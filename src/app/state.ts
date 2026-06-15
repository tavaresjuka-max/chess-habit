import { useCallback, useEffect } from 'react';
import {
  appendPlanSession,
  buildPuzzleThemeStats,
  completeTrainingLog,
  createTrainingRoadmap,
  createTrainingLog,
  generatePlan,
  getNextPlanSessionNumber,
  skipTrainingLog,
  type Achievement,
  type DailyPlan,
  type LearnerProfile,
  type LearningPlanResponse,
  type LichessOAuthToken,
  type LichessStudyLink,
  type PlanBlock,
  type PlanBlockFeedback,
  type SessionMinutes,
  type Signal,
  type TrainingLog,
  type TrainingRoadmapItem,
  type TutorQuestionAnswer,
  type Weakness,
} from '../domain';
import { advancePendingItem, masteryTargetFromCompletedLog } from '../domain/method';
import type { DiplomaAttempt, PendingTrainingItem } from '../domain/method/types';
import { revokeLichessOAuthToken } from '../infra/lichess/oauth';
import {
  clearLichessOAuthToken,
  exportAllAsJson,
  importBackupFromJson,
  loadBackupMeta,
  markOnboardingCompleted,
  type BackupImportResult,
  getTrainingLog,
  loadLichessOAuthToken,
  loadTrainingLogs,
  loadTrainingLogsForDate,
  savePendingItem,
  savePlacementResult as savePlacementResultRecord,
  savePlan,
  saveTrainingLogAndPlan,
  type StoredPlacementResult,
  saveProfile as saveStoredProfile,
  saveTrainingLog,
} from '../infra/storage/appData';
import { type AutoBackupStatus } from '../infra/storage/autoBackup';
import type { BackupMetaRecord } from '../infra/storage/db';
import type { StoragePersistenceStatus } from '../infra/storage/persistence';
import { syncAchievements } from './achievementsSync';
import { getTodayDate } from './date';
import { toErrorMessage } from './errorMessages';
import { startLichessOAuthConnection } from './oauthFlow';
import {
  buildPlanContext,
  toSessionMinutes,
} from './stateHelpers';
import {
  reconcileLogIfPossible,
  upsertTrainingLog,
} from './trainingLogFlow';
import { useDiagnosisActions } from './useDiagnosisActions';
import { useAppData } from './useAppData';
import { useBackupActions } from './useBackupActions';
import { usePendingActions } from './usePendingActions';
import { useStudyActions } from './useStudyActions';

export type AppView = 'today' | 'progress' | 'config';

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
  readonly allTrainingLogs: TrainingLog[];
  readonly pendingItems: PendingTrainingItem[];
  readonly diplomaAttempts: DiplomaAttempt[];
  readonly achievements: Achievement[];
  readonly weaknesses: Weakness[];
  readonly signals: Signal[];
  readonly diagnosisState: DiagnosisState;
  readonly diagnosisMessage: string | undefined;
  readonly errorMessage: string | undefined;
  readonly storagePersistence: StoragePersistenceStatus | undefined;
  readonly backupMeta: BackupMetaRecord | undefined;
  readonly autoBackupStatus: AutoBackupStatus;
  readonly autoBackupFileName: string | undefined;
  // Funil de onboarding: undefined = ainda na primeira vez (mostra o funil);
  // definido = já passou (abre direto no Hoje).
  readonly onboardingCompletedAt: string | undefined;
  readonly completeOnboarding: () => Promise<void>;
  readonly enableAutoBackup: () => Promise<void>;
  readonly disableAutoBackup: () => Promise<void>;
  readonly setActiveView: (view: AppView) => void;
  readonly saveProfile: (profile: LearnerProfile) => Promise<void>;
  readonly savePlacementResult: (result: StoredPlacementResult) => Promise<void>;
  readonly regeneratePlan: (minutes: SessionMinutes) => Promise<void>;
  readonly createNextSession: (minutes: SessionMinutes) => Promise<void>;
  readonly importKnownManualSignals: () => Promise<number>;
  readonly answerTutorQuestion: (answer: TutorQuestionAnswer) => Promise<void>;
  readonly syncChesscomDiagnosis: () => Promise<void>;
  readonly connectLichess: () => Promise<void>;
  readonly disconnectLichess: () => Promise<void>;
  readonly syncLichessDiagnosis: () => Promise<void>;
  readonly reconcileLichessResults: () => Promise<void>;
  readonly importFreeActivity: () => Promise<void>;
  readonly createLichessStudy: () => Promise<void>;
  readonly approveLearningPlan: () => Promise<void>;
  readonly requestLearningPlanRevision: (note: string) => Promise<void>;
  readonly openPendingItem: (item: PendingTrainingItem) => Promise<void>;
  readonly deferPendingItem: (item: PendingTrainingItem) => Promise<void>;
  readonly savePendingFromHardFeedback: (blockId: string) => Promise<void>;
  readonly startBlockTraining: (block: PlanBlock) => Promise<void>;
  readonly completeBlockTraining: (blockId: string, feedback?: PlanBlockFeedback) => Promise<void>;
  readonly skipBlockTraining: (blockId: string) => Promise<void>;
  readonly exportBackup: () => Promise<string>;
  readonly importBackup: (json: string) => Promise<BackupImportResult>;
  readonly clearAllData: () => Promise<void>;
};

// Auto-sync ao Salvar reaproveita um diagnóstico recente em vez de re-puxar o
// histórico inteiro a cada salvamento. O botão "Atualizar" manual ignora isto e
// força o pull completo. (Chess.com já cacheia por mês; isto evita até o refetch
// de stats/lista/mês atual. Lichess não tem cache, então o ganho é maior.)
const AUTO_SYNC_FRESHNESS_MS = 6 * 60 * 60 * 1000;

export function useAppState(): AppState {
  const {
    activeView,
    setActiveView,
    loadState,
    profile,
    setProfile,
    todayPlan,
    setTodayPlan,
    latestPlanRef,
    sessionMinutes,
    setSessionMinutes,
    trainingLogs,
    setTrainingLogs,
    allTrainingLogs,
    setAllTrainingLogs,
    pendingItems,
    setPendingItems,
    diplomaAttempts,
    setDiplomaAttempts,
    achievements,
    setAchievements,
    weaknesses,
    setWeaknesses,
    signals,
    setSignals,
    diagnosisState,
    setDiagnosisState,
    diagnosisMessage,
    setDiagnosisMessage,
    lichessToken,
    setLichessToken,
    lichessStudyLink,
    setLichessStudyLink,
    lichessConnectionState,
    setLichessConnectionState,
    lichessMessage,
    setLichessMessage,
    errorMessage,
    setErrorMessage,
    storagePersistence,
    backupMeta,
    setBackupMeta,
    autoBackupStatus,
    setAutoBackupStatus,
    autoBackupFileName,
    setAutoBackupFileName,
    onboardingCompletedAt,
    setOnboardingCompletedAt,
  } = useAppData();

  // Mantém o ref do plano sempre com o valor mais recente, para o auto-sync em
  // segundo plano não sobrescrever uma aprovação feita durante o fetch.
  useEffect(() => {
    latestPlanRef.current = todayPlan;
  }, [todayPlan]);

  const {
    answerTutorQuestion,
    importKnownManualSignals,
    runChesscomSync,
    runLichessSync,
    syncChesscomDiagnosis,
    syncLichessDiagnosis,
  } = useDiagnosisActions({
    profile,
    todayPlan,
    sessionMinutes,
    trainingLogs,
    pendingItems,
    diplomaAttempts,
    latestPlanRef,
    setActiveView,
    setDiagnosisState,
    setDiagnosisMessage,
    setErrorMessage,
    setSignals,
    setWeaknesses,
    setTodayPlan,
    setLichessConnectionState,
    setLichessMessage,
  });

  const saveProfile = useCallback(async (nextProfile: LearnerProfile) => {
    const date = getTodayDate();
    const recentThemeStats = buildPuzzleThemeStats(trainingLogs);
    const plan = generatePlan(
      nextProfile,
      weaknesses,
      nextProfile.defaultSessionMinutes,
      date,
      buildPlanContext({ previousPlan: todayPlan, recentThemeStats, trainingLogs, pendingItems, diplomaAttempts }),
    );

    await saveStoredProfile(nextProfile);
    await savePlan(plan);

    setProfile(nextProfile);
    setSessionMinutes(nextProfile.defaultSessionMinutes);
    setTodayPlan(plan);
    setActiveView('today');
    setErrorMessage(undefined);
    setTrainingLogs(await loadTrainingLogsForDate(date));
    setAllTrainingLogs(await loadTrainingLogs());

    // Auto-diagnóstico: ao salvar usuários (no onboarding ou na Config), já puxa
    // as partidas para o professor calcular com dados reais desde o início.
    // Sequencial e em segundo plano — não trava o salvar; o estado "syncing" dá
    // o retorno visual e o plano é regenerado quando os sinais chegam.
    const wantsChesscom = (nextProfile.chesscomUsername ?? '').trim() !== '';
    const wantsLichess = (nextProfile.lichessUsername ?? '').trim() !== '';

    if (wantsChesscom || wantsLichess) {
      // Sequencial e em segundo plano. Cada fonte tem try/catch próprio: um erro
      // inesperado de uma não cancela a outra nem some no void silencioso —
      // vai para a mensagem de erro visível (J3 — falha auditável).
      void (async () => {
        if (wantsChesscom) {
          try {
            await runChesscomSync(nextProfile, { maxAgeMs: AUTO_SYNC_FRESHNESS_MS });
          } catch (error) {
            setErrorMessage(toErrorMessage(error));
          }
        }

        if (wantsLichess) {
          try {
            await runLichessSync(nextProfile, { maxAgeMs: AUTO_SYNC_FRESHNESS_MS });
          } catch (error) {
            setErrorMessage(toErrorMessage(error));
          }
        }
      })();
    }
  }, [diplomaAttempts, pendingItems, todayPlan, trainingLogs, weaknesses, runChesscomSync, runLichessSync]);

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
      setLichessMessage('Conexão Lichess removida.');
    }
  }, []);

  const { reconcileLichessResults, importFreeActivity, createLichessStudy } = useStudyActions({
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
  });

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

  const { openPendingItem, deferPendingItem, savePendingFromHardFeedback } = usePendingActions({
    pendingItems,
    profile,
    todayPlan,
    trainingLogs,
    weaknesses,
    diplomaAttempts,
    setPendingItems,
    setTodayPlan,
    setLichessMessage,
    setErrorMessage,
  });

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
        setAllTrainingLogs(upsertTrainingLog(allTrainingLogs, log));
      }
    },
    [allTrainingLogs, todayPlan, trainingLogs],
  );

  const updateBlockStatusWithTrainingLog = useCallback(
    async (blockId: string, status: PlanBlock['status'], feedback?: PlanBlockFeedback) => {
      if (todayPlan === undefined) {
        return;
      }

      const updatedAt = new Date().toISOString();
      const existingLog = await getTrainingLog(`${todayPlan.date}:${blockId}`);

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
          const nextTrainingLogs = upsertTrainingLog(trainingLogs, reconcileOutcome.log);
          const nextAllTrainingLogs = upsertTrainingLog(allTrainingLogs, reconcileOutcome.log);

          // Log e plano numa transação só: o bloco "done" e o log que o comprova
          // nunca divergem se o app fechar no meio (J3 — durabilidade).
          await saveTrainingLogAndPlan(reconcileOutcome.log, nextPlan);
          let finalPlan = nextPlan;

          if (block.pendingItemId !== undefined) {
            const pendingItem = pendingItems.find((item) => item.id === block.pendingItemId);

            if (pendingItem !== undefined) {
              const masteryTarget = masteryTargetFromCompletedLog({
                lichessTheme: pendingItem.lichessTheme,
                themeStats: reconcileOutcome.log.result?.themeStats,
                lastFeedback: pendingItem.lastFeedback,
                currentFeedback: feedback,
                attempts: pendingItem.attempts,
              });
              const advancedPendingItem = advancePendingItem(pendingItem, feedback, masteryTarget);

              await savePendingItem(advancedPendingItem);

              const nextPendingItems =
                advancedPendingItem.status === 'open'
                  ? pendingItems.map((item) => (item.id === advancedPendingItem.id ? advancedPendingItem : item))
                  : pendingItems.filter((item) => item.id !== advancedPendingItem.id);

              setPendingItems(nextPendingItems);

              if (profile !== undefined) {
                const recentThemeStats = buildPuzzleThemeStats(nextTrainingLogs);

                finalPlan = generatePlan(
                  profile,
                  weaknesses,
                  toSessionMinutes(nextPlan.sessionMinutes, profile.defaultSessionMinutes),
                  nextPlan.date,
                  buildPlanContext({
                    previousPlan: nextPlan,
                    recentThemeStats,
                    trainingLogs: nextTrainingLogs,
                    pendingItems: nextPendingItems,
                    diplomaAttempts,
                  }),
                );
                await savePlan(finalPlan);
              }
            }
          }

          setTrainingLogs(nextTrainingLogs);
          setAllTrainingLogs(nextAllTrainingLogs);
          // Conquistas (Corte 7): avaliadas no fechamento de bloco, fonte de
          // verdade no Dexie; sem celebração visual, só registro sóbrio.
          setAchievements(await syncAchievements(nextAllTrainingLogs));
          setTodayPlan(finalPlan);
          setErrorMessage(undefined);

          if (reconcileOutcome.warning !== undefined) {
            setLichessMessage(reconcileOutcome.warning);
          }

          return;
        }
      }

      if (status === 'skipped' && existingLog !== undefined) {
        const skippedLog = skipTrainingLog({
          log: existingLog,
          skippedAt: updatedAt,
        });

        await saveTrainingLogAndPlan(skippedLog, nextPlan);
        setTrainingLogs(upsertTrainingLog(trainingLogs, skippedLog));
        setAllTrainingLogs(upsertTrainingLog(allTrainingLogs, skippedLog));
        setTodayPlan(nextPlan);
        setErrorMessage(undefined);

        return;
      }

      await savePlan(nextPlan);
      setTodayPlan(nextPlan);
      setErrorMessage(undefined);
    },
    [allTrainingLogs, diplomaAttempts, pendingItems, profile, todayPlan, trainingLogs, weaknesses],
  );

  const skipBlockTraining = useCallback(
    async (blockId: string) => {
      await updateBlockStatusWithTrainingLog(blockId, 'skipped');
    },
    [updateBlockStatusWithTrainingLog],
  );

  // Marca o fim do funil (primeira vez). A partir daqui o app abre direto no
  // Hoje e a aprovação diária volta a ser a dobra dentro do Hoje.
  const completeOnboarding = useCallback(async () => {
    const nowIso = new Date().toISOString();

    await markOnboardingCompleted(nowIso);
    setOnboardingCompletedAt(nowIso);
  }, []);

  const { enableAutoBackup, disableAutoBackup, clearAllData } = useBackupActions({
    setActiveView,
    setAchievements,
    setAllTrainingLogs,
    setAutoBackupFileName,
    setAutoBackupStatus,
    setBackupMeta,
    setDiagnosisMessage,
    setDiagnosisState,
    setDiplomaAttempts,
    setErrorMessage,
    setLichessConnectionState,
    setLichessMessage,
    setLichessStudyLink,
    setLichessToken,
    setOnboardingCompletedAt,
    setPendingItems,
    setProfile,
    setSessionMinutes,
    setSignals,
    setTodayPlan,
    setTrainingLogs,
    setWeaknesses,
  });

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
    allTrainingLogs,
    pendingItems,
    diplomaAttempts,
    achievements,
    weaknesses,
    signals,
    diagnosisState,
    diagnosisMessage,
    errorMessage,
    storagePersistence,
    backupMeta,
    autoBackupStatus,
    autoBackupFileName,
    onboardingCompletedAt,
    completeOnboarding,
    enableAutoBackup,
    disableAutoBackup,
    setActiveView,
    saveProfile,
    savePlacementResult,
    regeneratePlan,
    createNextSession,
    importKnownManualSignals,
    answerTutorQuestion,
    syncChesscomDiagnosis,
    connectLichess,
    disconnectLichess,
    syncLichessDiagnosis,
    reconcileLichessResults,
    importFreeActivity,
    createLichessStudy,
    approveLearningPlan,
    requestLearningPlanRevision,
    openPendingItem,
    deferPendingItem,
    savePendingFromHardFeedback,
    startBlockTraining,
    completeBlockTraining: (blockId: string, feedback?: PlanBlockFeedback) =>
      updateBlockStatusWithTrainingLog(blockId, 'done', feedback),
    skipBlockTraining,
    exportBackup: async () => {
      const json = await exportAllAsJson();

      setBackupMeta(await loadBackupMeta());

      return json;
    },
    importBackup: importBackupFromJson,
    clearAllData,
  };
}

export function createDefaultProfile(): LearnerProfile {
  return {
    // Perfil em branco: um novo usuário começa sem credenciais. Os usernames
    // reais do dono vivem apenas nos fixtures de teste (*.test.*), nunca no
    // bundle de produção (evita vazar PII e sincronizar dados de terceiros).
    lichessUsername: undefined,
    chesscomUsername: undefined,
    band: '800-1000',
    defaultSessionMinutes: 15,
    goals: ['Criar uma rotina consistente de treino'],
    updatedAt: new Date().toISOString(),
  };
}
