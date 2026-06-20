import { useCallback, useEffect, useRef } from 'react';
import {
  buildPuzzleThemeStats,
  createTrainingRoadmap,
  generatePlan,
  type Achievement,
  type DailyPlan,
  type LearnerProfile,
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
import { promoteBandForDiplomas } from '../domain/method/bandProgression';
import type { DiplomaAttempt, PendingTrainingItem } from '../domain/method/types';
import {
  exportAllAsJson,
  importBackupFromJson,
  loadBackupMeta,
  type BackupImportResult,
  loadTrainingLogs,
  loadTrainingLogsForDate,
  type StoredPlacementResult,
  saveProfileAndPlan,
} from '../infra/storage/appData';
import { type AutoBackupStatus } from '../infra/storage/autoBackup';
import type { BackupMetaRecord } from '../infra/storage/db';
import type { StoragePersistenceStatus } from '../infra/storage/persistence';
import { getTodayDate } from './date';
import { toErrorMessage } from './errorMessages';
import { buildPlanContext } from './stateHelpers';
import { useDiagnosisActions } from './useDiagnosisActions';
import { useAppData } from './useAppData';
import { useBackupActions } from './useBackupActions';
import { useOAuthActions } from './useOAuthActions';
import { usePendingActions } from './usePendingActions';
import { usePlanLifecycleActions } from './usePlanLifecycleActions';
import { useStudyActions } from './useStudyActions';
import { useTrainingActions } from './useTrainingActions';

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
  // autoSync (padrão true): ao salvar perfil com usuários, dispara o sync de
  // fundo (fire-and-forget). O onboarding passa false e roda runOnboardingImport
  // de forma awaitada na tela "Importando", para mostrar o loading real.
  readonly saveProfile: (profile: LearnerProfile, options?: { autoSync?: boolean }) => Promise<void>;
  readonly runOnboardingImport: (profile: LearnerProfile) => Promise<{ weaknessCount: number }>;
  readonly savePlacementResult: (result: StoredPlacementResult) => Promise<void>;
  readonly regeneratePlan: (minutes: SessionMinutes) => Promise<void>;
  readonly createNextSession: (minutes: SessionMinutes) => Promise<void>;
  readonly importKnownManualSignals: () => Promise<number>;
  readonly answerTutorQuestion: (answer: TutorQuestionAnswer) => Promise<void>;
  readonly syncChesscomDiagnosis: () => Promise<void>;
  readonly connectLichess: () => Promise<void>;
  readonly disconnectLichess: () => Promise<void>;
  readonly syncLichessDiagnosis: () => Promise<void>;
  readonly reconcileLichessResults: (options?: { silent?: boolean }) => Promise<void>;
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
    runOnboardingImport,
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

  const saveProfile = useCallback(async (rawProfile: LearnerProfile, options?: { autoSync?: boolean }) => {
    // Promoção de banda (council 2026-06-19): se o diploma da banda atual foi
    // conquistado, sobe a banda antes de montar o plano (vale do próximo em diante;
    // sobe, nunca desce). No-op até existirem tentativas de diploma gravadas.
    const promotedBand = promoteBandForDiplomas(rawProfile.band, diplomaAttempts);
    const nextProfile =
      promotedBand === rawProfile.band ? rawProfile : { ...rawProfile, band: promotedBand };

    const date = getTodayDate();
    const recentThemeStats = buildPuzzleThemeStats(trainingLogs);
    const plan = generatePlan(
      nextProfile,
      weaknesses,
      nextProfile.defaultSessionMinutes,
      date,
      buildPlanContext({ previousPlan: todayPlan, recentThemeStats, trainingLogs, pendingItems, diplomaAttempts }),
    );

    await saveProfileAndPlan(nextProfile, plan);

    setProfile(nextProfile);
    setSessionMinutes(nextProfile.defaultSessionMinutes);
    setTodayPlan(plan);
    setActiveView('today');
    setErrorMessage(undefined);
    setTrainingLogs(await loadTrainingLogsForDate(date));
    setAllTrainingLogs(await loadTrainingLogs());

    // Auto-diagnóstico: ao salvar usuários (no onboarding ou na Config), já puxa
    // as partidas para o professor calcular com dados reais desde o início.
    // Paralelo e em segundo plano: nao trava o salvar; "syncing" exibe o retorno
    // visual e o plano e regenerado quando os sinais chegam.
    const wantsChesscom = (nextProfile.chesscomUsername ?? '').trim() !== '';
    const wantsLichess = (nextProfile.lichessUsername ?? '').trim() !== '';

    if (options?.autoSync !== false && (wantsChesscom || wantsLichess)) {
      // Cada fonte tem catch proprio: um erro inesperado fica visivel por fonte
      // e nao cancela o outro sync (J3: falha auditavel).
      const syncJobs = [
        wantsChesscom
          ? runChesscomSync(nextProfile, { maxAgeMs: AUTO_SYNC_FRESHNESS_MS }).catch((error: unknown) => {
              setErrorMessage(`Chess.com: ${toErrorMessage(error)}`);
            })
          : undefined,
        wantsLichess
          ? runLichessSync(nextProfile, { maxAgeMs: AUTO_SYNC_FRESHNESS_MS }).catch((error: unknown) => {
              setErrorMessage(`Lichess: ${toErrorMessage(error)}`);
            })
          : undefined,
      ].filter((job): job is Promise<void> => job !== undefined);

      // Paralelo e auditavel: uma fonte lenta ou com erro inesperado nao cancela a outra.
      void Promise.allSettled(syncJobs);
    }
  }, [
    diplomaAttempts,
    pendingItems,
    runChesscomSync,
    runLichessSync,
    setActiveView,
    setAllTrainingLogs,
    setErrorMessage,
    setProfile,
    setSessionMinutes,
    setTodayPlan,
    setTrainingLogs,
    todayPlan,
    trainingLogs,
    weaknesses,
  ]);

  const {
    savePlacementResult,
    regeneratePlan,
    createNextSession,
    approveLearningPlan,
    requestLearningPlanRevision,
    completeOnboarding,
  } = usePlanLifecycleActions({
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
  });

  const { connectLichess, disconnectLichess } = useOAuthActions({
    profile,
    setLichessConnectionState,
    setLichessMessage,
    setLichessToken,
  });

  const { reconcileLichessResults, importFreeActivity, createLichessStudy } = useStudyActions({
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
  });

  // Auto-fetch SILENCIOSO de puzzles no boot (Decisão #3): o usuário recorrente,
  // que já passou do onboarding e abre o app com o Lichess conectado, confere os
  // puzzles UMA vez em segundo plano (sem mensagens de UI, erro engolido) para a
  // banda refletir o progresso recente sem o botão "Conferir puzzles". O gate em
  // onboardingCompletedAt exclui o funil de primeira vez e o callback de OAuth,
  // que rodam antes de o onboarding ser concluído — assim não interrompe o funil.
  const didBootReconcileRef = useRef(false);
  useEffect(() => {
    if (didBootReconcileRef.current || loadState !== 'ready') {
      return;
    }

    // Trade-off deliberado (council 2026-06-20): marca como resolvido no PRIMEIRO
    // 'ready', mesmo se ainda desconectado. Assim o auto-fetch só dispara para quem
    // ABRE o app já conectado (token salvo), e NÃO quando o Lichess conecta no meio
    // da sessão — isso evita reconciliar durante o funil/OAuth e mantém os e2e
    // verdes. Quem conecta depois pega o auto-fetch no próximo boot (ou no botão).
    didBootReconcileRef.current = true;

    if (lichessConnectionState === 'connected' && onboardingCompletedAt !== undefined) {
      // .catch: em modo silent, engole tambem um erro antes do try interno (ex.:
      // loadLichessOAuthToken falhar), evitando unhandled rejection no boot.
      void reconcileLichessResults({ silent: true }).catch(() => undefined);
    }
  }, [loadState, lichessConnectionState, onboardingCompletedAt, reconcileLichessResults]);

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

  const { startBlockTraining, completeBlockTraining, skipBlockTraining } = useTrainingActions({
    allTrainingLogs,
    diplomaAttempts,
    pendingItems,
    profile,
    todayPlan,
    trainingLogs,
    weaknesses,
    setAchievements,
    setAllTrainingLogs,
    setErrorMessage,
    setLichessMessage,
    setPendingItems,
    setTodayPlan,
    setTrainingLogs,
  });

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
    runOnboardingImport,
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
    completeBlockTraining,
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
