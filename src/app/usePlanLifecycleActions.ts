import { useCallback, type Dispatch, type SetStateAction } from 'react';
import {
  appendPlanSession,
  buildDiagnosticThemeStats,
  buildPuzzleThemeStats,
  extractThemeStages,
  generatePlan,
  getNextPlanSessionNumber,
  isThemeGraduated,
  weaknessTagFromPuzzleTheme,
  type Achievement,
  type DailyPlan,
  type LearnerProfile,
  type LearningPlanResponse,
  type SessionMinutes,
  type TrainingLog,
  type WeaknessTag,
  type Weakness,
} from '../domain';
import type { DiplomaAttempt, PendingTrainingItem } from '../domain/method/types';
import {
  loadProfile,
  loadTrainingLogs,
  loadTrainingLogsForDate,
  markOnboardingCompleted,
  saveProfile,
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
  setProfile: Dispatch<SetStateAction<LearnerProfile | undefined>>;
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
    setProfile,
    setSessionMinutes,
    setTodayPlan,
    setTrainingLogs,
  } = input;

  // Persiste o estágio alcançado por tema (PED-3): após gerar um plano com o
  // estágio (possivelmente avançado pelo feedback), grava em profile.themeStages
  // para o aluno intermitente retomar de onde parou. No-op quando nada mudou.
  // D3 (scheduler híbrido): recomputa graduatedThemes a partir de TODOS os logs
  // acumulados — evita bug de agregação cumulativa stale (obs 9094). Idempotente:
  // resultado é sempre derivado dos dados reais, nunca incrementado.
  // D4: recebe patch opcional do counter de sessões (currentPrimaryTheme +
  // sessionsOnPrimaryTheme); integrado no mesmo saveProfile para evitar
  // segundo write concorrente.
  const persistThemeStages = useCallback(
    async (
      plan: DailyPlan,
      primaryCounterPatch?: { currentPrimaryTheme: WeaknessTag; sessionsOnPrimaryTheme: number },
    ) => {
      if (profile === undefined) {
        return;
      }

      // Relê o perfil mais recente do storage como base do merge: assim uma promoção
      // de banda concorrente (reconcile/boot) não é sobrescrita por uma closure de
      // perfil obsoleta (achado do council).
      const base = (await loadProfile()) ?? profile;
      const merged = { ...base.themeStages, ...extractThemeStages(plan) };

      // D3 — recomputa graduatedThemes a partir de todos os logs (idempotente).
      // loadTrainingLogs já foi chamado por createNextSession; reutilizamos aqui
      // para garantir que a graduação reflita o estado completo do storage.
      const allLogs = await loadTrainingLogs();
      const cumulativeStats = buildPuzzleThemeStats(allLogs);
      const nextGraduated: WeaknessTag[] = [];

      for (const entry of cumulativeStats?.themes ?? []) {
        const tag = weaknessTagFromPuzzleTheme(entry.theme);

        if (tag !== undefined) {
          const wins = entry.attempts - entry.losses;

          if (isThemeGraduated({ attempts: entry.attempts, wins })) {
            if (!nextGraduated.includes(tag)) {
              nextGraduated.push(tag);
            }
          }
        }
      }

      nextGraduated.sort();

      const themeStagesChanged = JSON.stringify(merged) !== JSON.stringify(base.themeStages ?? {});
      const graduatedChanged = JSON.stringify(nextGraduated) !== JSON.stringify(base.graduatedThemes ?? []);
      const counterChanged =
        primaryCounterPatch !== undefined &&
        (base.currentPrimaryTheme !== primaryCounterPatch.currentPrimaryTheme ||
          base.sessionsOnPrimaryTheme !== primaryCounterPatch.sessionsOnPrimaryTheme);

      if (!themeStagesChanged && !graduatedChanged && !counterChanged) {
        return;
      }

      const nextProfile: LearnerProfile = {
        ...base,
        themeStages: merged,
        graduatedThemes: nextGraduated,
        ...(primaryCounterPatch !== undefined
          ? {
              currentPrimaryTheme: primaryCounterPatch.currentPrimaryTheme,
              sessionsOnPrimaryTheme: primaryCounterPatch.sessionsOnPrimaryTheme,
            }
          : {}),
        updatedAt: new Date().toISOString(),
      };

      await saveProfile(nextProfile);
      setProfile(nextProfile);
    },
    [profile, setProfile],
  );

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

      // D5: usa buildDiagnosticThemeStats para excluir logs de -revisao/-transferencia
      // do sinal que alimenta selectPrimaryWeakness (guarda anti ping-pong).
      const recentThemeStats = buildDiagnosticThemeStats(trainingLogs);
      const plan = generatePlan(
        profile,
        weaknesses,
        minutes,
        getTodayDate(),
        buildPlanContext({ previousPlan: todayPlan, recentThemeStats, trainingLogs, pendingItems, diplomaAttempts }),
      );

      await savePlan(plan);
      await persistThemeStages(plan);
      setSessionMinutes(minutes);
      setTodayPlan(plan);
      setErrorMessage(undefined);
    },
    [diplomaAttempts, pendingItems, persistThemeStages, profile, todayPlan, trainingLogs, weaknesses],
  );

  // D4: calcula o patch do counter de sessões para um plano recém-gerado.
  // Lê base do storage (race-guard); retorna o patch pronto para persistThemeStages.
  const buildPrimaryCounterPatch = useCallback(
    async (
      planBlocks: DailyPlan['blocks'],
    ): Promise<{ currentPrimaryTheme: WeaknessTag; sessionsOnPrimaryTheme: number } | undefined> => {
      const newPrimary = planBlocks.find((b) => b.id.endsWith('-tema'))?.weaknessTag;

      if (newPrimary === undefined) {
        return undefined;
      }

      // Relê o base mais recente para evitar race com reconcile/boot.
      const base = (await loadProfile()) ?? profile;
      const nextCount =
        base?.currentPrimaryTheme === newPrimary ? (base.sessionsOnPrimaryTheme ?? 0) + 1 : 1;

      return { currentPrimaryTheme: newPrimary, sessionsOnPrimaryTheme: nextCount };
    },
    [profile],
  );

  const createNextSession = useCallback(
    async (minutes: SessionMinutes) => {
      if (profile === undefined) {
        setActiveView('config');
        return;
      }

      // D5: usa buildDiagnosticThemeStats para excluir logs de -revisao/-transferencia
      // do sinal que alimenta selectPrimaryWeakness (guarda anti ping-pong).
      const recentThemeStats = buildDiagnosticThemeStats(trainingLogs);

      if (todayPlan === undefined) {
        const date = getTodayDate();
        const plan = generatePlan(
          profile,
          weaknesses,
          minutes,
          date,
          buildPlanContext({ recentThemeStats, trainingLogs, pendingItems, diplomaAttempts }),
        );

        // D4: calcula patch do counter ANTES de persistThemeStages para que ambos
        // os campos sejam escritos no mesmo saveProfile (evita race de dois writes).
        const primaryCounterPatch = await buildPrimaryCounterPatch(plan.blocks);

        await savePlan(plan);
        await persistThemeStages(plan, primaryCounterPatch);
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

      // D4: mesma lógica — calcula patch antes de persistThemeStages.
      const primaryCounterPatch = await buildPrimaryCounterPatch(sessionPlan.blocks);

      await savePlan(nextPlan);
      await persistThemeStages(nextPlan, primaryCounterPatch);
      setSessionMinutes(minutes);
      setTodayPlan(nextPlan);
      setTrainingLogs(await loadTrainingLogsForDate(todayPlan.date));
      setAllTrainingLogs(await loadTrainingLogs());
      setErrorMessage(undefined);
    },
    [
      buildPrimaryCounterPatch,
      diplomaAttempts,
      pendingItems,
      persistThemeStages,
      profile,
      todayPlan,
      trainingLogs,
      weaknesses,
    ],
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
