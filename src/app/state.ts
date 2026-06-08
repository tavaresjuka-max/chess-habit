import { useCallback, useEffect, useState } from 'react';
import {
  appendPlanSession,
  detectWeaknesses,
  createKnownManualSignals,
  completeTrainingLog,
  createTrainingRoadmap,
  createTrainingLog,
  generatePlan,
  getNextPlanSessionNumber,
  normalizePlanDestinations,
  skipTrainingLog,
  type DailyPlan,
  type LearnerProfile,
  type LichessOAuthToken,
  type LichessStudyLink,
  type PlanBlock,
  type PlanBlockFeedback,
  type SessionMinutes,
  type TrainingLog,
  type TrainingRoadmapItem,
  type Weakness,
} from '../domain';
import { importChesscomSignals } from '../infra/chesscom/chesscomClient';
import { importLichessSignals } from '../infra/lichess/games';
import { revokeLichessOAuthToken } from '../infra/lichess/oauth';
import { createDailyStudy } from '../infra/lichess/study';
import {
  clearAll,
  clearLichessOAuthToken,
  exportAllAsJson,
  getLichessStudyLink,
  getPlan,
  getTrainingLog,
  loadChesscomMonthCache,
  loadLichessOAuthToken,
  loadProfile,
  loadSignals,
  loadTrainingLogsForDate,
  loadWeaknesses,
  replaceSignalsForSource,
  replaceWeaknesses,
  saveChesscomMonthCache,
  saveLichessStudyLink,
  savePlan,
  saveProfile as saveStoredProfile,
  saveTrainingLog,
} from '../infra/storage/appData';
import { getTodayDate } from './date';
import { toDiagnosisErrorMessage, toErrorMessage, toLichessErrorMessage } from './errorMessages';
import { openExternalUrl } from './externalOpen';
import { completeLichessOAuthIfNeeded, startLichessOAuthConnection } from './oauthFlow';
import {
  mergeTrainingLogs,
  reconcileLogIfPossible,
  reconcileLogsWithLichessPuzzleActivity,
  upsertTrainingLog,
} from './trainingLogFlow';

export type AppView = 'today' | 'config';

export type LoadState = 'loading' | 'ready' | 'error';
export type DiagnosisState = 'idle' | 'syncing' | 'success' | 'error';
export type LichessConnectionState = 'disconnected' | 'connected' | 'syncing' | 'error';

export type AppState = {
  readonly activeView: AppView;
  readonly loadState: LoadState;
  readonly profile: LearnerProfile | undefined;
  readonly todayPlan: DailyPlan | undefined;
  readonly roadmap: TrainingRoadmapItem[];
  readonly lichessToken: LichessOAuthToken | undefined;
  readonly lichessStudyLink: LichessStudyLink | undefined;
  readonly lichessConnectionState: LichessConnectionState;
  readonly lichessMessage: string | undefined;
  readonly sessionMinutes: SessionMinutes;
  readonly trainingLogs: TrainingLog[];
  readonly weaknesses: Weakness[];
  readonly diagnosisState: DiagnosisState;
  readonly diagnosisMessage: string | undefined;
  readonly errorMessage: string | undefined;
  readonly setActiveView: (view: AppView) => void;
  readonly saveProfile: (profile: LearnerProfile) => Promise<void>;
  readonly regeneratePlan: (minutes: SessionMinutes) => Promise<void>;
  readonly createNextSession: (minutes: SessionMinutes) => Promise<void>;
  readonly importKnownManualSignals: () => Promise<number>;
  readonly syncChesscomDiagnosis: () => Promise<void>;
  readonly connectLichess: () => Promise<void>;
  readonly disconnectLichess: () => Promise<void>;
  readonly syncLichessDiagnosis: () => Promise<void>;
  readonly reconcileLichessResults: () => Promise<void>;
  readonly createLichessStudy: () => Promise<void>;
  readonly startBlockTraining: (block: PlanBlock) => Promise<void>;
  readonly completeBlockTraining: (blockId: string, feedback?: PlanBlockFeedback) => Promise<void>;
  readonly skipBlockTraining: (blockId: string) => Promise<void>;
  readonly exportBackup: () => Promise<string>;
  readonly clearAllData: () => Promise<void>;
};

export function useAppState(): AppState {
  const [activeView, setActiveView] = useState<AppView>('today');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [profile, setProfile] = useState<LearnerProfile | undefined>(undefined);
  const [todayPlan, setTodayPlan] = useState<DailyPlan | undefined>(undefined);
  const [sessionMinutes, setSessionMinutes] = useState<SessionMinutes>(15);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [diagnosisState, setDiagnosisState] = useState<DiagnosisState>('idle');
  const [diagnosisMessage, setDiagnosisMessage] = useState<string | undefined>(undefined);
  const [lichessToken, setLichessToken] = useState<LichessOAuthToken | undefined>(undefined);
  const [lichessStudyLink, setLichessStudyLink] = useState<LichessStudyLink | undefined>(undefined);
  const [lichessConnectionState, setLichessConnectionState] = useState<LichessConnectionState>('disconnected');
  const [lichessMessage, setLichessMessage] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    async function loadAppData() {
      try {
        const completion = await completeLichessOAuthIfNeeded();
        const storedProfile = await loadProfile();

        if (!isMounted) {
          return;
        }

        if (completion.kind === 'connected') {
          setLichessToken(completion.token);
          setLichessConnectionState('connected');
          setLichessMessage('Lichess conectado.');
        } else {
          const storedToken = await loadLichessOAuthToken();

          setLichessToken(storedToken);
          setLichessConnectionState(storedToken === undefined ? 'disconnected' : 'connected');

          if (completion.kind === 'cancelled') {
            setLichessMessage(completion.message);
          }
        }

        if (storedProfile === undefined) {
          setActiveView('config');
          setLoadState('ready');
          return;
        }

        const date = getTodayDate();
        const storedWeaknesses = await loadWeaknesses();
        const storedPlan = await getPlan(date);
        const storedTrainingLogs = await loadTrainingLogsForDate(date);
        const storedStudyLink = await getLichessStudyLink(date);
        const plan =
          storedPlan === undefined
            ? generatePlan(storedProfile, storedWeaknesses, storedProfile.defaultSessionMinutes, date)
            : normalizePlanDestinations(storedPlan);

        if (storedPlan === undefined || plan !== storedPlan) {
          await savePlan(plan);
        }

        setProfile(storedProfile);
        setSessionMinutes(toSessionMinutes(plan.sessionMinutes, storedProfile.defaultSessionMinutes));
        setTrainingLogs(storedTrainingLogs);
        setWeaknesses(storedWeaknesses);
        setLichessStudyLink(storedStudyLink);
        setTodayPlan(plan);
        setLoadState('ready');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(toErrorMessage(error));
        setLoadState('error');
      }
    }

    void loadAppData();

    return () => {
      isMounted = false;
    };
  }, []);

  const saveProfile = useCallback(async (nextProfile: LearnerProfile) => {
    const date = getTodayDate();
    const plan = generatePlan(nextProfile, weaknesses, nextProfile.defaultSessionMinutes, date, {
      previousPlan: todayPlan,
    });

    await saveStoredProfile(nextProfile);
    await savePlan(plan);

    setProfile(nextProfile);
    setSessionMinutes(nextProfile.defaultSessionMinutes);
    setTodayPlan(plan);
    setActiveView('today');
    setErrorMessage(undefined);
    setTrainingLogs(await loadTrainingLogsForDate(date));
  }, [todayPlan, weaknesses]);

  const regeneratePlan = useCallback(
    async (minutes: SessionMinutes) => {
      if (profile === undefined) {
        setActiveView('config');
        return;
      }

      const plan = generatePlan(profile, weaknesses, minutes, getTodayDate(), { previousPlan: todayPlan });

      await savePlan(plan);
      setSessionMinutes(minutes);
      setTodayPlan(plan);
      setErrorMessage(undefined);
    },
    [profile, todayPlan, weaknesses],
  );

  const createNextSession = useCallback(
    async (minutes: SessionMinutes) => {
      if (profile === undefined) {
        setActiveView('config');
        return;
      }

      if (todayPlan === undefined) {
        const date = getTodayDate();
        const plan = generatePlan(profile, weaknesses, minutes, date);

        await savePlan(plan);
        setSessionMinutes(minutes);
        setTodayPlan(plan);
        setTrainingLogs(await loadTrainingLogsForDate(date));
        setErrorMessage(undefined);
        return;
      }

      const sessionPlan = generatePlan(profile, weaknesses, minutes, todayPlan.date, {
        previousPlan: todayPlan,
        sessionNumber: getNextPlanSessionNumber(todayPlan),
      });
      const nextPlan = appendPlanSession(todayPlan, sessionPlan);

      await savePlan(nextPlan);
      setSessionMinutes(minutes);
      setTodayPlan(nextPlan);
      setTrainingLogs(await loadTrainingLogsForDate(todayPlan.date));
      setErrorMessage(undefined);
    },
    [profile, todayPlan, weaknesses],
  );

  const syncChesscomDiagnosis = useCallback(async () => {
    if (profile === undefined) {
      setActiveView('config');
      return;
    }

    if (profile.chesscomUsername === undefined || profile.chesscomUsername.trim() === '') {
      setDiagnosisState('error');
      setDiagnosisMessage('Informe seu usuario Chess.com na Config.');
      setActiveView('config');
      return;
    }

    setDiagnosisState('syncing');
    setDiagnosisMessage('Atualizando diagnóstico Chess.com.');

    try {
      const signals = await importChesscomSignals(profile.chesscomUsername, {
        cache: {
          loadMonth: loadChesscomMonthCache,
          saveMonth: saveChesscomMonthCache,
        },
      });

      await replaceSignalsForSource('chesscom', signals);

      const allSignals = await loadSignals();
      const nextWeaknesses = detectWeaknesses(allSignals);
      const date = getTodayDate();
      const plan = generatePlan(profile, nextWeaknesses, sessionMinutes, date, { previousPlan: todayPlan });

      await replaceWeaknesses(nextWeaknesses);
      await savePlan(plan);

      setWeaknesses(nextWeaknesses);
      setTodayPlan(plan);
      setDiagnosisState('success');
      setDiagnosisMessage(
        nextWeaknesses.length === 0
          ? `Diagnóstico atualizado com ${String(signals.length)} sinais derivados. Ainda sem limiar suficiente; mantive plano conservador.`
          : `Diagnóstico atualizado com ${String(signals.length)} sinais derivados e ${String(nextWeaknesses.length)} hipóteses.`,
      );
      setErrorMessage(undefined);
    } catch (error) {
      setDiagnosisState('error');
      setDiagnosisMessage(toDiagnosisErrorMessage(error));
    }
  }, [profile, sessionMinutes, todayPlan]);

  const importKnownManualSignals = useCallback(async () => {
    const manualSignals = createKnownManualSignals(new Date().toISOString());

    await replaceSignalsForSource('outro', manualSignals);

    const allSignals = await loadSignals();
    const nextWeaknesses = detectWeaknesses(allSignals);

    await replaceWeaknesses(nextWeaknesses);
    setWeaknesses(nextWeaknesses);

    if (profile !== undefined) {
      const date = getTodayDate();
      const plan = generatePlan(profile, nextWeaknesses, sessionMinutes, date, { previousPlan: todayPlan });

      await savePlan(plan);
      setTodayPlan(plan);
    }

    return manualSignals.length;
  }, [profile, sessionMinutes, todayPlan]);

  const connectLichess = useCallback(async () => {
    await startLichessOAuthConnection(profile?.lichessUsername);
  }, [profile]);

  const disconnectLichess = useCallback(async () => {
    const token = await loadLichessOAuthToken();

    try {
      if (token !== undefined) {
        await revokeLichessOAuthToken({ token: token.accessToken });
      }
    } catch {
      // Revogar depende da rede; mesmo se falhar, o token local precisa sumir.
    } finally {
      await clearLichessOAuthToken();
      setLichessToken(undefined);
      setLichessConnectionState('disconnected');
      setLichessMessage('Conexao Lichess removida.');
    }
  }, []);

  const syncLichessDiagnosis = useCallback(async () => {
    if (profile === undefined) {
      setActiveView('config');
      return;
    }

    if (profile.lichessUsername === undefined || profile.lichessUsername.trim() === '') {
      setLichessConnectionState('error');
      setLichessMessage('Informe seu usuario Lichess na Config.');
      setActiveView('config');
      return;
    }

    setLichessConnectionState('syncing');
    setLichessMessage('Atualizando diagnóstico Lichess.');

    try {
      const token = await loadLichessOAuthToken();
      const signals = await importLichessSignals({
        username: profile.lichessUsername,
        token: token?.accessToken,
      });

      await replaceSignalsForSource('lichess', signals);

      const allSignals = await loadSignals();
      const nextWeaknesses = detectWeaknesses(allSignals);
      const date = getTodayDate();
      const plan = generatePlan(profile, nextWeaknesses, sessionMinutes, date, { previousPlan: todayPlan });

      await replaceWeaknesses(nextWeaknesses);
      await savePlan(plan);

      setWeaknesses(nextWeaknesses);
      setTodayPlan(plan);
      setLichessConnectionState(token === undefined ? 'disconnected' : 'connected');
      setLichessMessage(
        signals.length === 0
          ? 'Lichess atualizado, mas ainda sem sinais suficientes.'
          : `Lichess atualizado com ${String(signals.length)} sinais derivados.`,
      );
    } catch (error) {
      setLichessConnectionState('error');
      setLichessMessage(toLichessErrorMessage(error));
    }
  }, [profile, sessionMinutes, todayPlan]);

  const reconcileLichessResults = useCallback(async () => {
    const token = await loadLichessOAuthToken();

    if (token === undefined) {
      setLichessConnectionState('error');
      setLichessMessage('Conecte o Lichess para buscar resultado real dos puzzles.');
      return;
    }

    setLichessConnectionState('syncing');
    setLichessMessage('Buscando resultados de puzzles no Lichess.');

    try {
      const reconciledLogs = await reconcileLogsWithLichessPuzzleActivity(trainingLogs, token.accessToken);

      for (const log of reconciledLogs) {
        await saveTrainingLog(log);
      }

      setTrainingLogs(mergeTrainingLogs(trainingLogs, reconciledLogs));
      setLichessConnectionState('connected');
      setLichessMessage(
        reconciledLogs.length === 0
          ? 'Nenhum resultado novo de puzzle encontrado.'
          : `${String(reconciledLogs.length)} bloco(s) reconciliado(s) com o Lichess.`,
      );
    } catch (error) {
      setLichessConnectionState('error');
      setLichessMessage(toLichessErrorMessage(error));
    }
  }, [trainingLogs]);

  const createLichessStudy = useCallback(async () => {
    if (todayPlan === undefined) {
      return;
    }

    const existingLink = await getLichessStudyLink(todayPlan.date);

    if (existingLink?.imported === true) {
      setLichessStudyLink(existingLink);
      setLichessMessage(openExternalUrl(existingLink.url) ?? 'Study do dia ja existe.');
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

  const startBlockTraining = useCallback(
    async (block: PlanBlock) => {
      if (todayPlan === undefined) {
        return;
      }

      const existingLog = await getTrainingLog(`${todayPlan.date}:${block.id}`);

      // Reabrir um bloco ja concluido apenas reabre o destino: nao recria um log
      // active que apagaria o treino concluido anterior.
      if (existingLog?.status !== 'done') {
        const startedAt = new Date().toISOString();
        const log = createTrainingLog({
          block,
          date: todayPlan.date,
          startedAt,
        });

        await saveTrainingLog(log);
        setTrainingLogs(upsertTrainingLog(trainingLogs, log));
      }
    },
    [todayPlan, trainingLogs],
  );

  const updateBlockStatusWithTrainingLog = useCallback(
    async (blockId: string, status: PlanBlock['status'], feedback?: PlanBlockFeedback) => {
      if (todayPlan === undefined) {
        return;
      }

      const updatedAt = new Date().toISOString();
      const existingLog = await getTrainingLog(`${todayPlan.date}:${blockId}`);

      if (status === 'done') {
        const block = todayPlan.blocks.find((planBlock) => planBlock.id === blockId);

        if (block !== undefined) {
          const baseLog =
            existingLog ??
            createTrainingLog({
              block,
              date: todayPlan.date,
              startedAt: updatedAt,
            });
          const completedLog = completeTrainingLog({
            log: baseLog,
            completedAt: updatedAt,
            feedback,
          });
          const reconcileOutcome = await reconcileLogIfPossible(completedLog);

          await saveTrainingLog(reconcileOutcome.log);
          setTrainingLogs(upsertTrainingLog(trainingLogs, reconcileOutcome.log));

          if (reconcileOutcome.warning !== undefined) {
            setLichessMessage(reconcileOutcome.warning);
          }
        }
      }

      if (status === 'skipped' && existingLog !== undefined) {
        const skippedLog = skipTrainingLog({
          log: existingLog,
          skippedAt: updatedAt,
        });

        await saveTrainingLog(skippedLog);
        setTrainingLogs(upsertTrainingLog(trainingLogs, skippedLog));
      }

      const nextPlan: DailyPlan = {
        ...todayPlan,
        blocks: todayPlan.blocks.map((block) =>
          block.id === blockId
            ? {
                ...block,
                status,
                ...(feedback === undefined ? {} : { feedback }),
                updatedAt,
              }
            : block,
        ),
      };

      await savePlan(nextPlan);
      setTodayPlan(nextPlan);
      setErrorMessage(undefined);
    },
    [todayPlan, trainingLogs],
  );

  const skipBlockTraining = useCallback(
    async (blockId: string) => {
      await updateBlockStatusWithTrainingLog(blockId, 'skipped');
    },
    [updateBlockStatusWithTrainingLog],
  );

  const clearAllData = useCallback(async () => {
    await clearAll();
    setProfile(undefined);
    setTodayPlan(undefined);
    setSessionMinutes(15);
    setTrainingLogs([]);
    setWeaknesses([]);
    setLichessToken(undefined);
    setLichessStudyLink(undefined);
    setLichessConnectionState('disconnected');
    setLichessMessage(undefined);
    setDiagnosisState('idle');
    setDiagnosisMessage(undefined);
    setActiveView('config');
    setErrorMessage(undefined);
  }, []);

  return {
    activeView,
    loadState,
    profile,
    todayPlan,
    roadmap:
      profile === undefined || todayPlan === undefined
        ? []
        : createTrainingRoadmap({
            profile,
            weaknesses,
            activePlan: todayPlan,
            sessionMinutes,
          }),
    lichessToken,
    lichessStudyLink,
    lichessConnectionState,
    lichessMessage,
    sessionMinutes,
    trainingLogs,
    weaknesses,
    diagnosisState,
    diagnosisMessage,
    errorMessage,
    setActiveView,
    saveProfile,
    regeneratePlan,
    createNextSession,
    importKnownManualSignals,
    syncChesscomDiagnosis,
    connectLichess,
    disconnectLichess,
    syncLichessDiagnosis,
    reconcileLichessResults,
    createLichessStudy,
    startBlockTraining,
    completeBlockTraining: (blockId: string, feedback?: PlanBlockFeedback) =>
      updateBlockStatusWithTrainingLog(blockId, 'done', feedback),
    skipBlockTraining,
    exportBackup: exportAllAsJson,
    clearAllData,
  };
}

export function createDefaultProfile(): LearnerProfile {
  return {
    lichessUsername: 'jukasparov',
    chesscomUsername: 'jukatavares',
    band: '800-1200',
    defaultSessionMinutes: 15,
    goals: ['Criar uma rotina consistente de treino'],
    updatedAt: new Date().toISOString(),
  };
}

function toSessionMinutes(minutes: number, fallback: SessionMinutes): SessionMinutes {
  switch (minutes) {
    case 5:
    case 15:
    case 30:
    case 60:
      return minutes;
    default:
      return fallback;
  }
}
