import { useCallback, type Dispatch, type SetStateAction } from 'react';
import {
  buildPuzzleThemeStats,
  generatePlan,
  type Achievement,
  type DailyPlan,
  type LearnerProfile,
  type LichessStudyLink,
  type TrainingLog,
  type Weakness,
} from '../domain';
import type { DiplomaAttempt, PendingTrainingItem } from '../domain/method/types';
import { createDailyStudy } from '../infra/lichess/study';
import {
  getLichessStudyLink,
  loadLichessOAuthToken,
  saveLichessStudyLink,
  savePlan,
  saveTrainingLog,
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
  trainingLogs: TrainingLog[];
  weaknesses: Weakness[];
  setAchievements: Dispatch<SetStateAction<Achievement[]>>;
  setAllTrainingLogs: Dispatch<SetStateAction<TrainingLog[]>>;
  setLichessConnectionState: Dispatch<SetStateAction<LichessConnectionState>>;
  setLichessMessage: Dispatch<SetStateAction<string | undefined>>;
  setLichessStudyLink: Dispatch<SetStateAction<LichessStudyLink | undefined>>;
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
    trainingLogs,
    weaknesses,
    setAchievements,
    setAllTrainingLogs,
    setLichessConnectionState,
    setLichessMessage,
    setLichessStudyLink,
    setTodayPlan,
    setTrainingLogs,
  } = input;

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
      const reconciledLogs = await reconcileLichessPuzzleDiagnostics(trainingLogs, token.accessToken);

      for (const log of reconciledLogs) {
        await saveTrainingLog(log);
      }

      const nextTrainingLogs = mergeTrainingLogs(trainingLogs, reconciledLogs);
      const nextAllTrainingLogs = mergeTrainingLogs(allTrainingLogs, reconciledLogs);

      if (profile !== undefined && todayPlan !== undefined) {
        const recentThemeStats = buildPuzzleThemeStats(nextTrainingLogs);
        const nextPlan = generatePlan(
          profile,
          weaknesses,
          toSessionMinutes(todayPlan.sessionMinutes, profile.defaultSessionMinutes),
          todayPlan.date,
          buildPlanContext({
            previousPlan: todayPlan,
            recentThemeStats,
            trainingLogs: nextTrainingLogs,
            pendingItems,
            diplomaAttempts,
          }),
        );

        await savePlan(nextPlan);
        setTodayPlan(nextPlan);
      }

      setTrainingLogs(nextTrainingLogs);
      setAllTrainingLogs(nextAllTrainingLogs);
      setLichessConnectionState('connected');
      setLichessMessage(
        reconciledLogs.length === 0
          ? 'Nenhum resultado novo de puzzle encontrado.'
          : `${String(reconciledLogs.length)} bloco(s) e sinais agregados de puzzle atualizados.`,
      );
    } catch (error) {
      setLichessConnectionState('error');
      setLichessMessage(toLichessErrorMessage(error));
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
