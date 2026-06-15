import { useRef, useState } from 'react';
import type {
  Achievement,
  DailyPlan,
  LearnerProfile,
  LichessOAuthToken,
  LichessStudyLink,
  SessionMinutes,
  Signal,
  TrainingLog,
  Weakness,
} from '../domain';
import type { DiplomaAttempt, PendingTrainingItem } from '../domain/method/types';
import { isAutoBackupSupported, type AutoBackupStatus } from '../infra/storage/autoBackup';
import type { BackupMetaRecord } from '../infra/storage/db';
import type { StoragePersistenceStatus } from '../infra/storage/persistence';
import type { AppView, DiagnosisState, LichessConnectionState, LoadState } from './state';

export function useAppData() {
  const [activeView, setActiveView] = useState<AppView>('today');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [profile, setProfile] = useState<LearnerProfile | undefined>(undefined);
  const [todayPlan, setTodayPlan] = useState<DailyPlan | undefined>(undefined);
  // Espelho sincrono do plano atual: callbacks de segundo plano (auto-sync)
  // leem daqui em vez da closure, que capturaria um plano obsoleto.
  const latestPlanRef = useRef<DailyPlan | undefined>(undefined);
  const [sessionMinutes, setSessionMinutes] = useState<SessionMinutes>(15);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [allTrainingLogs, setAllTrainingLogs] = useState<TrainingLog[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingTrainingItem[]>([]);
  const [diplomaAttempts, setDiplomaAttempts] = useState<DiplomaAttempt[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [diagnosisState, setDiagnosisState] = useState<DiagnosisState>('idle');
  const [diagnosisMessage, setDiagnosisMessage] = useState<string | undefined>(undefined);
  const [lichessToken, setLichessToken] = useState<LichessOAuthToken | undefined>(undefined);
  const [lichessStudyLink, setLichessStudyLink] = useState<LichessStudyLink | undefined>(undefined);
  const [lichessConnectionState, setLichessConnectionState] =
    useState<LichessConnectionState>('disconnected');
  const [lichessMessage, setLichessMessage] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [storagePersistence, setStoragePersistence] = useState<StoragePersistenceStatus | undefined>(undefined);
  const [backupMeta, setBackupMeta] = useState<BackupMetaRecord | undefined>(undefined);
  const [autoBackupStatus, setAutoBackupStatus] = useState<AutoBackupStatus>(
    isAutoBackupSupported() ? 'disabled' : 'unsupported',
  );
  const [autoBackupFileName, setAutoBackupFileName] = useState<string | undefined>(undefined);
  const [onboardingCompletedAt, setOnboardingCompletedAt] = useState<string | undefined>(undefined);

  return {
    activeView,
    setActiveView,
    loadState,
    setLoadState,
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
    setStoragePersistence,
    backupMeta,
    setBackupMeta,
    autoBackupStatus,
    setAutoBackupStatus,
    autoBackupFileName,
    setAutoBackupFileName,
    onboardingCompletedAt,
    setOnboardingCompletedAt,
  };
}
