import { useCallback, type Dispatch, type SetStateAction } from 'react';
import {
  appendPlanSession,
  buildPuzzleThemeStats,
  generatePlan,
  getNextPlanSessionNumber,
  type Achievement,
  type DailyPlan,
  type LearnerProfile,
  type LearningPlanResponse,
  type SessionMinutes,
  type TrainingLog,
  type Weakness,
} from '../domain';
import type { DiplomaAttempt, PendingTrainingItem } from '../domain/method/types';
import {
  loadTrainingLogs,
  loadTrainingLogsForDate,
  markOnboardingCompleted,
  savePlacementResult as savePlacementResultRecord,
  savePlan,
  type StoredPlacementResult,
} from '../infra/storage/appData';
import { syncAchievements } from './achievementsSync';
import { getTodayDate } from './date';
import { buildPlanContext } from './stateHelpers';
import type { AppView } from './state';

export type UsePlanLifecycleActionsInput = {
  allTrainingLogs: TrainingLog[];
  diplomaAttempts: DiplomaAttempt[];
  pendingItems: PendingTrainingItem[];
  profile: LearnerProfile | undefined;
  todayPlan: DailyPlan | undefined;
  trainingLogs: TrainingLog[];
  weaknesses: Weakness[];
  setAchievements: Dispatch<SetStateAction<Achievement[]>>;
  setActiveView: Dispatch<SetStateAction<AppView>>;
  setAllTrainingLogs: Dispatch<SetStateAction<TrainingLog[]>>;
  setErrorMessage: Dispatch<SetStateAction<string | undefined>>;
  setOnboardingCompletedAt: Dispatch<SetStateAction<string | undefined>>;
  setSessionMinutes: Dispatch<SetStateAction<SessionMinutes>>;
  setTodayPlan: Dispatch<SetStateAction<DailyPlan | undefined>>;
  setTrainingLogs: Dispatch<SetStateAction<TrainingLog[]>>;
};

export function usePlanLifecycleActions(input: UsePlanLifecycleActionsInput) {
  const {
    allTrainingLogs,
    diplomaAttempts,
    pendingItems,
    profile,
    todayPlan,
    trainingLogs,
    weaknesses,
    setAchievements,
    setActiveView,
    setAllTrainingLogs,
    setErrorMessage,
    setOnboardingCompletedAt,
    setSessionMinutes,
    setTodayPlan,
    setTrainingLogs,
  } = input;

  const savePlacementResult = useCallback(
    async (result: StoredPlacementResult) => {
      await savePlacementResultRecord(result);
      // Placement persistido pode destravar a conquista Calibrado.
      setAchievements(await syncAchievements(allTrainingLogs));
    },
    [allTrainingLogs],
  );

  const regeneratePlan = useCallback(
    async (minutes: SessionMinutes) => {
      if (profile === undefined) {
        setActiveView('config');
        return;
      }

      const recentThemeStats = buildPuzzleThemeStats(trainingLogs);
      const plan = generatePlan(
        profile,
        weaknesses,
        minutes,
        getTodayDate(),
        buildPlanContext({ previousPlan: todayPlan, recentThemeStats, trainingLogs, pendingItems, diplomaAttempts }),
      );

      await savePlan(plan);
      setSessionMinutes(minutes);
      setTodayPlan(plan);
      setErrorMessage(undefined);
    },
    [diplomaAttempts, pendingItems, profile, todayPlan, trainingLogs, weaknesses],
  );

  const createNextSession = useCallback(
    async (minutes: SessionMinutes) => {
      if (profile === undefined) {
        setActiveView('config');
        return;
      }

      const recentThemeStats = buildPuzzleThemeStats(trainingLogs);

      if (todayPlan === undefined) {
        const date = getTodayDate();
        const plan = generatePlan(
          profile,
          weaknesses,
          minutes,
          date,
          buildPlanContext({ recentThemeStats, trainingLogs, pendingItems, diplomaAttempts }),
        );

        await savePlan(plan);
        setSessionMinutes(minutes);
        setTodayPlan(plan);
        setTrainingLogs(await loadTrainingLogsForDate(date));
        setAllTrainingLogs(await loadTrainingLogs());
        setErrorMessage(undefined);
        return;
      }

      const sessionPlan = generatePlan(profile, weaknesses, minutes, todayPlan.date, {
        ...buildPlanContext({ previousPlan: todayPlan, recentThemeStats, trainingLogs, pendingItems, diplomaAttempts }),
        sessionNumber: getNextPlanSessionNumber(todayPlan),
      });
      const nextPlan = appendPlanSession(todayPlan, sessionPlan);

      await savePlan(nextPlan);
      setSessionMinutes(minutes);
      setTodayPlan(nextPlan);
      setTrainingLogs(await loadTrainingLogsForDate(todayPlan.date));
      setAllTrainingLogs(await loadTrainingLogs());
      setErrorMessage(undefined);
    },
    [diplomaAttempts, pendingItems, profile, todayPlan, trainingLogs, weaknesses],
  );

  const updateLearningPlanResponse = useCallback(
    async (response: LearningPlanResponse) => {
      if (todayPlan === undefined) {
        return;
      }

      const nextPlan: DailyPlan = {
        ...todayPlan,
        learningPlanResponse: response,
      };

      await savePlan(nextPlan);
      setTodayPlan(nextPlan);
      setErrorMessage(undefined);
    },
    [todayPlan],
  );

  const approveLearningPlan = useCallback(async () => {
    await updateLearningPlanResponse({
      status: 'approved',
      updatedAt: new Date().toISOString(),
    });
  }, [updateLearningPlanResponse]);

  const requestLearningPlanRevision = useCallback(
    async (note: string) => {
      await updateLearningPlanResponse({
        status: 'revision-requested',
        note,
        updatedAt: new Date().toISOString(),
      });
    },
    [updateLearningPlanResponse],
  );

  // Marca o fim do funil (primeira vez). A partir daqui o app abre direto no
  // Hoje e a aprovação diária volta a ser a dobra dentro do Hoje.
  const completeOnboarding = useCallback(async () => {
    const nowIso = new Date().toISOString();

    await markOnboardingCompleted(nowIso);
    setOnboardingCompletedAt(nowIso);
  }, []);

  return {
    savePlacementResult,
    regeneratePlan,
    createNextSession,
    approveLearningPlan,
    requestLearningPlanRevision,
    completeOnboarding,
  };
}
