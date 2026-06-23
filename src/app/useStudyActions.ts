import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';
import {
  buildDiagnosticThemeStats,
  buildSkillMap,
  generatePlan,
  type Achievement,
  type DailyPlan,
  type LearnerProfile,
  type LichessStudyLink,
  type TrainingLog,
  type Weakness,
} from '../domain';
import { applyDiplomaProgress } from '../domain/method/evaluateDiplomas';
import type { DiplomaAttempt, PendingTrainingItem } from '../domain/method/types';
import { createDailyStudy } from '../infra/lichess/study';
import {
  getLichessStudyLink,
  loadLichessOAuthToken,
  loadProfile,
  loadTrainingLogs,
  loadTrainingLogsForDate,
  saveDiplomaAttempts,
  saveLichessStudyLink,
  saveProfile,
  saveTrainingLog,
  saveTrainingLogsAndPlan,
} from '../infra/storage/appData';
import { syncAchievements } from './achievementsSync';
import { getTodayDate } from './date';
import { toLichessErrorMessage } from './errorMessages';
import { openExternalUrl } from './externalOpen';
import { buildPlanContext, toSessionMinutes } from './stateHelpers';
import {
  importFreeActivity as importFreeActivityFlow,
  mergeTrainingLogs,
  reconcileLichessPuzzleDiagnostics,
  upsertTrainingLog,
} from './trainingLogFlow';
import type { LichessConnectionState } from './state';

export type UseStudyActionsInput = {
  allTrainingLogs: TrainingLog[];
  diplomaAttempts: DiplomaAttempt[];
  pendingItems: PendingTrainingItem[];
  profile: LearnerProfile | undefined;
  todayPlan: DailyPlan | undefined;
  // Ref sempre com o plano mais recente (state.ts a mantém em sync). Usada no
  // reconcile para não sobrescrever, com a closure obsoleta, uma mudança feita
  // durante o fetch (anti-race, achado do council).
  latestPlanRef: { current: DailyPlan | undefined };
  trainingLogs: TrainingLog[];
  weaknesses: Weakness[];
  setAchievements: Dispatch<SetStateAction<Achievement[]>>;
  setAllTrainingLogs: Dispatch<SetStateAction<TrainingLog[]>>;
  setDiplomaAttempts: Dispatch<SetStateAction<DiplomaAttempt[]>>;
  setLichessConnectionState: Dispatch<SetStateAction<LichessConnectionState>>;
  setLichessMessage: Dispatch<SetStateAction<string | undefined>>;
  setLichessStudyLink: Dispatch<SetStateAction<LichessStudyLink | undefined>>;
  setProfile: Dispatch<SetStateAction<LearnerProfile | undefined>>;
  setTodayPlan: Dispatch<SetStateAction<DailyPlan | undefined>>;
  setTrainingLogs: Dispatch<SetStateAction<TrainingLog[]>>;
};

export function useStudyActions(input: UseStudyActionsInput) {
  const {
    allTrainingLogs,
    diplomaAttempts,
    pendingItems,
    profile,
    todayPlan,
    latestPlanRef,
    trainingLogs,
    weaknesses,
    setAchievements,
    setAllTrainingLogs,
    setDiplomaAttempts,
    setLichessConnectionState,
    setLichessMessage,
    setLichessStudyLink,
    setProfile,
    setTodayPlan,
    setTrainingLogs,
  } = input;

  const reconcileLichessResults = useCallback(async (options?: { silent?: boolean }) => {
    // silent: usado pelo auto-fetch de boot — sem mensagens de UI nem estado de
    // erro; só promove a banda em segundo plano se houver diploma novo.
    const silent = options?.silent === true;
    const token = await loadLichessOAuthToken();

    if (token === undefined) {
      if (!silent) {
        setLichessConnectionState('error');
        setLichessMessage('Conecte o Lichess para buscar resultado real dos puzzles.');
      }
      return;
    }

    if (!silent) {
      setLichessConnectionState('syncing');
      setLichessMessage('Buscando resultados de puzzles no Lichess.');
    }

    try {
      const reconciledLogs = await reconcileLichessPuzzleDiagnostics(trainingLogs, token.accessToken);

      // Sem resultado novo: não regenera nem sobrescreve o plano/perfil. Mata a race
      // do auto-fetch silencioso de boot, que sobrescrevia uma conclusão de bloco feita
      // durante o fetch (achado ALTA do council). Promoção de banda por diplomas já
      // conquistados é coberta no boot/saveProfile (promoteBandForDiplomas, idempotente).
      if (reconciledLogs.length === 0) {
        if (!silent) {
          setLichessConnectionState('connected');
          setLichessMessage('Nenhum resultado novo de puzzle encontrado.');
        }
        return;
      }

      // Anti-race (council): a busca leva 1-3s; relê o estado MAIS RECENTE (plano via
      // latestPlanRef; perfil e logs do storage) em vez das closures, para não
      // sobrescrever uma conclusão de bloco / promoção de banda feita durante o fetch.
      const currentPlan = latestPlanRef.current ?? todayPlan;
      const currentProfile = (await loadProfile()) ?? profile;
      const currentDayLogs =
        currentPlan === undefined ? trainingLogs : await loadTrainingLogsForDate(currentPlan.date);
      const nextTrainingLogs = mergeTrainingLogs(currentDayLogs, reconciledLogs);
      const nextAllTrainingLogs = mergeTrainingLogs(await loadTrainingLogs(), reconciledLogs);

      let promotionMessage: string | undefined;

      if (currentProfile !== undefined && currentPlan !== undefined) {
        // Diplomas automáticos + promoção de banda (Open Decision #1): a partir da
        // acurácia por tema (buildSkillMap), avalia os DiplomaAttempt e sobe a banda
        // (monotônico). applyDiplomaProgress é puro; persistimos os logs/plano
        // ANTES de gravar diplomas/perfil para não atrasar a durabilidade do sync.
        const nowIso = new Date().toISOString();
        const skillMap = buildSkillMap(nextAllTrainingLogs);
        const { evaluated, nextAttempts, promotedBand, bandChanged } = applyDiplomaProgress(
          skillMap,
          diplomaAttempts,
          currentProfile.band,
          nowIso,
        );

        const effectiveProfile = bandChanged ? { ...currentProfile, band: promotedBand } : currentProfile;
        // D5: usa buildDiagnosticThemeStats para excluir logs de pool do sinal diagnóstico.
        const recentThemeStats = buildDiagnosticThemeStats(nextTrainingLogs);
        const nextPlan = generatePlan(
          effectiveProfile,
          weaknesses,
          toSessionMinutes(currentPlan.sessionMinutes, effectiveProfile.defaultSessionMinutes),
          currentPlan.date,
          buildPlanContext({
            previousPlan: currentPlan,
            recentThemeStats,
            trainingLogs: nextTrainingLogs,
            pendingItems,
            diplomaAttempts: nextAttempts,
          }),
        );

        await saveTrainingLogsAndPlan(reconciledLogs, nextPlan);
        setTodayPlan(nextPlan);
        latestPlanRef.current = nextPlan;

        await saveDiplomaAttempts(evaluated);
        setDiplomaAttempts(nextAttempts);

        if (bandChanged) {
          await saveProfile(effectiveProfile);
          setProfile(effectiveProfile);
          promotionMessage = `Diploma conquistado! Sua banda subiu para ${promotedBand}. O plano foi recalibrado.`;
        }
      } else {
        for (const log of reconciledLogs) {
          await saveTrainingLog(log);
        }
      }

      setTrainingLogs(nextTrainingLogs);
      setAllTrainingLogs(nextAllTrainingLogs);
      setAchievements(await syncAchievements(nextAllTrainingLogs));

      if (!silent) {
        setLichessConnectionState('connected');
        setLichessMessage(
          promotionMessage ??
            (reconciledLogs.length === 0
              ? 'Nenhum resultado novo de puzzle encontrado.'
              : `${String(reconciledLogs.length)} bloco(s) e sinais agregados de puzzle atualizados.`),
        );
      } else if (promotionMessage !== undefined) {
        // Auto-fetch silencioso: não polui a tela no rotineiro, mas COMEMORA a
        // promoção de banda/diploma com um toast discreto (decisão do dono).
        toast.success(promotionMessage);
      }
    } catch (error) {
      if (!silent) {
        setLichessConnectionState('error');
        setLichessMessage(toLichessErrorMessage(error));
      }
    }
  }, [allTrainingLogs, diplomaAttempts, pendingItems, profile, todayPlan, trainingLogs, weaknesses]);

  const importFreeActivity = useCallback(async () => {
    const token = await loadLichessOAuthToken();

    if (token === undefined) {
      setLichessConnectionState('error');
      setLichessMessage('Conecte o Lichess para importar sua atividade livre.');
      return;
    }

    setLichessConnectionState('syncing');
    setLichessMessage('Buscando sua atividade livre no Lichess.');

    try {
      const outcome = await importFreeActivityFlow({
        token: token.accessToken,
        existingLogs: allTrainingLogs,
        today: getTodayDate(),
      });

      if (outcome.log !== undefined) {
        await saveTrainingLog(outcome.log);

        const importedLog = outcome.log;
        const nextAllTrainingLogs = upsertTrainingLog(allTrainingLogs, importedLog);

        setAllTrainingLogs(nextAllTrainingLogs);
        setAchievements(await syncAchievements(nextAllTrainingLogs));

        if (importedLog.date === getTodayDate()) {
          setTrainingLogs((current) => upsertTrainingLog(current, importedLog));
        }
      }

      setLichessConnectionState('connected');
      setLichessMessage(outcome.message);
    } catch (error) {
      setLichessConnectionState('error');
      setLichessMessage(toLichessErrorMessage(error));
    }
  }, [allTrainingLogs]);

  const createLichessStudy = useCallback(async () => {
    if (todayPlan === undefined) {
      return;
    }

    const existingLink = await getLichessStudyLink(todayPlan.date);

    if (existingLink?.imported === true) {
      setLichessStudyLink(existingLink);
      setLichessMessage(openExternalUrl(existingLink.url) ?? 'Study do dia já existe.');
      return;
    }

    const token = await loadLichessOAuthToken();

    if (token === undefined) {
      setLichessConnectionState('error');
      setLichessMessage('Conecte o Lichess para criar o Study do dia.');
      return;
    }

    setLichessConnectionState('syncing');
    setLichessMessage(
      existingLink === undefined ? 'Criando Study privado no Lichess.' : 'Retomando o Study do dia no Lichess.',
    );

    try {
      const studyLink = await createDailyStudy({
        token: token.accessToken,
        plan: todayPlan,
        existingStudyId: existingLink?.studyId,
        onStudyCreated: async (studyId) => {
          const partialNow = new Date().toISOString();

          await saveLichessStudyLink({
            id: todayPlan.date,
            date: todayPlan.date,
            studyId,
            url: `https://lichess.org/study/${studyId}`,
            visibility: 'private',
            imported: false,
            createdAt: partialNow,
            updatedAt: partialNow,
          });
        },
      });

      await saveLichessStudyLink(studyLink);
      setLichessStudyLink(studyLink);
      setLichessConnectionState('connected');
      setLichessMessage(openExternalUrl(studyLink.url) ?? 'Study do dia criado no Lichess.');
    } catch (error) {
      setLichessConnectionState('error');
      setLichessMessage(toLichessErrorMessage(error));
    }
  }, [todayPlan]);

  return {
    reconcileLichessResults,
    importFreeActivity,
    createLichessStudy,
  };
}
