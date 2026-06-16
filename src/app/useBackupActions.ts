import { useCallback, type Dispatch, type SetStateAction } from 'react';
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
import {
  clearAll,
  clearAutoBackupConfig,
  exportAllAsJson,
  loadBackupMeta,
  saveAutoBackupConfig,
} from '../infra/storage/appData';
import {
  isAutoBackupSupported,
  pickAutoBackupFile,
  writeAutoBackup,
  type AutoBackupStatus,
} from '../infra/storage/autoBackup';
import type { BackupMetaRecord } from '../infra/storage/db';
import type { AppView, DiagnosisState, LichessConnectionState } from './state';

export type UseBackupActionsInput = {
  setActiveView: Dispatch<SetStateAction<AppView>>;
  setAchievements: Dispatch<SetStateAction<Achievement[]>>;
  setAllTrainingLogs: Dispatch<SetStateAction<TrainingLog[]>>;
  setAutoBackupFileName: Dispatch<SetStateAction<string | undefined>>;
  setAutoBackupStatus: Dispatch<SetStateAction<AutoBackupStatus>>;
  setBackupMeta: Dispatch<SetStateAction<BackupMetaRecord | undefined>>;
  setDiagnosisMessage: Dispatch<SetStateAction<string | undefined>>;
  setDiagnosisState: Dispatch<SetStateAction<DiagnosisState>>;
  setDiplomaAttempts: Dispatch<SetStateAction<DiplomaAttempt[]>>;
  setErrorMessage: Dispatch<SetStateAction<string | undefined>>;
  setLichessConnectionState: Dispatch<SetStateAction<LichessConnectionState>>;
  setLichessMessage: Dispatch<SetStateAction<string | undefined>>;
  setLichessStudyLink: Dispatch<SetStateAction<LichessStudyLink | undefined>>;
  setLichessToken: Dispatch<SetStateAction<LichessOAuthToken | undefined>>;
  setOnboardingCompletedAt: Dispatch<SetStateAction<string | undefined>>;
  setPendingItems: Dispatch<SetStateAction<PendingTrainingItem[]>>;
  setProfile: Dispatch<SetStateAction<LearnerProfile | undefined>>;
  setSessionMinutes: Dispatch<SetStateAction<SessionMinutes>>;
  setSignals: Dispatch<SetStateAction<Signal[]>>;
  setTodayPlan: Dispatch<SetStateAction<DailyPlan | undefined>>;
  setTrainingLogs: Dispatch<SetStateAction<TrainingLog[]>>;
  setWeaknesses: Dispatch<SetStateAction<Weakness[]>>;
};

export function useBackupActions(input: UseBackupActionsInput) {
  const {
    setAchievements,
    setActiveView,
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
  } = input;

  const enableAutoBackup = useCallback(async () => {
    const handle = await pickAutoBackupFile();

    if (handle === undefined) {
      // Sem suporte ou usuario cancelou: status honesto, sem fingir sucesso.
      setAutoBackupStatus(isAutoBackupSupported() ? 'disabled' : 'unsupported');
      return;
    }

    const written = await writeAutoBackup(handle, await exportAllAsJson(), {
      allowPermissionRequest: true,
    });

    if (written !== 'written') {
      setAutoBackupStatus('error');
      return;
    }

    await saveAutoBackupConfig({
      enabled: true,
      ...(handle.name === undefined ? {} : { fileName: handle.name }),
      handle,
    });
    setAutoBackupFileName(handle.name);
    setAutoBackupStatus('enabled');
    setBackupMeta(await loadBackupMeta());
  }, [setAutoBackupFileName, setAutoBackupStatus, setBackupMeta]);

  const disableAutoBackup = useCallback(async () => {
    await clearAutoBackupConfig();
    setAutoBackupFileName(undefined);
    setAutoBackupStatus(isAutoBackupSupported() ? 'disabled' : 'unsupported');
  }, [setAutoBackupFileName, setAutoBackupStatus]);

  const clearAllData = useCallback(async () => {
    await clearAll();
    setBackupMeta(undefined);
    setAutoBackupFileName(undefined);
    setAutoBackupStatus(isAutoBackupSupported() ? 'disabled' : 'unsupported');
    setProfile(undefined);
    setTodayPlan(undefined);
    setSessionMinutes(15);
    setTrainingLogs([]);
    setAllTrainingLogs([]);
    setPendingItems([]);
    setDiplomaAttempts([]);
    setAchievements([]);
    setWeaknesses([]);
    setSignals([]);
    setLichessToken(undefined);
    setLichessStudyLink(undefined);
    setLichessConnectionState('disconnected');
    setLichessMessage(undefined);
    setDiagnosisState('idle');
    setDiagnosisMessage(undefined);
    setActiveView('config');
    setErrorMessage(undefined);
    // Apagar tudo volta o funil de onboarding para o início.
    setOnboardingCompletedAt(undefined);
  }, [
    setAchievements,
    setActiveView,
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
  ]);

  return {
    enableAutoBackup,
    disableAutoBackup,
    clearAllData,
  };
}
