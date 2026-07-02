import type {
  Achievement,
  DailyPlan,
  LearnerProfile,
  LichessOAuthToken,
  LichessStudyLink,
  PlanBlock,
  ErrorType,
  PlanBlockFeedback,
  SessionMinutes,
  Signal,
  TrainingLog,
  TrainingRoadmapItem,
  TutorQuestionAnswer,
  Weakness,
} from '../domain';
import type { DiplomaAttempt, PendingTrainingItem } from '../domain/method/types';
import type { BackupImportResult, StoredPlacementResult } from '../infra/storage/appData';
import type { AutoBackupStatus } from '../infra/storage/autoBackup';
import type { BackupMetaRecord } from '../infra/storage/db';
import type { StoragePersistenceStatus } from '../infra/storage/persistence';

export type AppView = 'today' | 'autopsy' | 'progress' | 'config';

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
  readonly runOnboardingImport: (
    profile: LearnerProfile,
  ) => Promise<{ weaknessCount: number; confidentWeaknessCount: number }>;
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
  readonly completeBlockTraining: (blockId: string, feedback?: PlanBlockFeedback, errorType?: ErrorType, selfExplanation?: string) => Promise<void>;
  readonly skipBlockTraining: (blockId: string) => Promise<void>;
  readonly exportBackup: () => Promise<string>;
  readonly importBackup: (json: string) => Promise<BackupImportResult>;
  readonly clearAllData: () => Promise<void>;
  // Captura mínima de erros (opt-in, Fase 1): toggle local + export dedicado.
  readonly errorCaptureEnabled: boolean;
  readonly setErrorCapture: (enabled: boolean) => Promise<void>;
  readonly exportErrorLog: () => Promise<string>;
  // Consentimento informado (Fase 3): carimbo write-once + opt-in de pesquisa.
  readonly consentedAt: string | undefined;
  readonly researchOptIn: boolean | undefined;
  // Aceita o consentimento no onboarding (grava consentedAt write-once + opt-in).
  readonly acceptConsent: (researchOptIn: boolean) => Promise<void>;
  // Alterna a participação na pesquisa pela Config (mantém consentedAt write-once).
  readonly setResearchOptIn: (enabled: boolean) => Promise<void>;
};
