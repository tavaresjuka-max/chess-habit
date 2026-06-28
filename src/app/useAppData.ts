import { useEffect, useRef, useState } from 'react';
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
import {
  buildDiagnosticThemeStats,
  computeConsistency,
  generatePlan,
  getReturnSessionMinutes,
  normalizePlanDestinations,
} from '../domain';
import { promoteBandForDiplomas } from '../domain/method/bandProgression';
import type { DiplomaAttempt, PendingTrainingItem } from '../domain/method/types';
import {
  exportAllAsJson,
  getLatestPlanBefore,
  getLichessStudyLink,
  getPlan,
  captureAdoption,
  loadAutoBackupConfig,
  loadBackupMeta,
  loadDiplomaAttempts,
  loadErrorCaptureEnabled,
  loadLichessOAuthToken,
  loadOnboardingCompletedAt,
  loadOpenPendingItems,
  loadProfile,
  loadSignals,
  loadTrainingLogs,
  loadTrainingLogsForDate,
  loadWeaknesses,
  savePlan,
  saveProfile,
} from '../infra/storage/appData';
import {
  isAutoBackupSupported,
  writeAutoBackup,
  type AutoBackupStatus,
  type FileSystemFileHandleLike,
} from '../infra/storage/autoBackup';
import type { BackupMetaRecord } from '../infra/storage/db';
import { requestPersistentStorage, type StoragePersistenceStatus } from '../infra/storage/persistence';
import { syncAchievements } from './achievementsSync';
import { getTodayDate } from './date';
import { toErrorMessage } from './errorMessages';
import { completeLichessOAuthIfNeeded } from './oauthFlow';
import {
  buildPlanContext,
  combinePlanHistory,
  toSessionMinutes,
} from './stateHelpers';
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
  const [errorCaptureEnabled, setErrorCaptureEnabled] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAppData() {
      try {
        const persistenceStatus = await requestPersistentStorage();
        const storedBackupMeta = await loadBackupMeta();
        const storedOnboardingCompletedAt = await loadOnboardingCompletedAt();

        // Carimbo de adoção write-once: grava a 1ª abertura UMA vez. Usuário
        // antigo (já com onboarding) já veio com adoptedAt via migration v12;
        // usuário novo é carimbado aqui. Idempotente (write-once).
        await captureAdoption();
        const storedErrorCaptureEnabled = await loadErrorCaptureEnabled();

        if (isMounted) {
          setStoragePersistence(persistenceStatus);
          setBackupMeta(storedBackupMeta);
          setOnboardingCompletedAt(storedOnboardingCompletedAt);
          setErrorCaptureEnabled(storedErrorCaptureEnabled);
        }

        // Backup automatico: grava na abertura do app, somente com dados presentes
        // (nunca sobrescreve o arquivo bom do usuario com um estado vazio).
        const autoBackupConfig = await loadAutoBackupConfig();

        if (isMounted && autoBackupConfig?.enabled === true) {
          setAutoBackupFileName(autoBackupConfig.fileName);

          const handle = autoBackupConfig.handle as FileSystemFileHandleLike | undefined;
          const hasData = (await loadProfile()) !== undefined;

          if (handle === undefined) {
            setAutoBackupStatus('needs-permission');
          } else if (!hasData) {
            setAutoBackupStatus('enabled');
          } else {
            const written = await writeAutoBackup(handle, await exportAllAsJson());

            setAutoBackupStatus(
              written === 'written' ? 'enabled' : written === 'needs-permission' ? 'needs-permission' : 'error',
            );

            if (written === 'written') {
              setBackupMeta(await loadBackupMeta());
            }
          }
        }

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
        const storedSignals = await loadSignals();
        const storedPlan = await getPlan(date);
        const previousPlan = await getLatestPlanBefore(date);
        const storedAllTrainingLogs = await loadTrainingLogs();
        const storedTrainingLogs = await loadTrainingLogsForDate(date);
        const storedStudyLink = await getLichessStudyLink(date);
        const storedPendingItems = await loadOpenPendingItems();
        const storedDiplomaAttempts = await loadDiplomaAttempts();
        // Promoção de banda no boot (Decisão #3): se os diplomas conquistados em
        // sessões anteriores já justificam uma banda maior, sobe ao abrir o app —
        // sem depender do botão "Conferir puzzles". Monotônico e idempotente:
        // no-op (mesma referência, sem escrita) quando a banda já está correta.
        const promotedBand = promoteBandForDiplomas(storedProfile.band, storedDiplomaAttempts);
        const effectiveProfile =
          promotedBand === storedProfile.band ? storedProfile : { ...storedProfile, band: promotedBand };

        if (effectiveProfile !== storedProfile) {
          await saveProfile(effectiveProfile);
        }

        const storedAchievements = await syncAchievements(storedAllTrainingLogs);
        // D5: usa buildDiagnosticThemeStats para excluir logs de pool do sinal diagnóstico no boot.
        const recentThemeStats = buildDiagnosticThemeStats(storedTrainingLogs);
        const normalizedStoredPlan = storedPlan === undefined ? undefined : normalizePlanDestinations(storedPlan);
        const normalizedPreviousPlan =
          previousPlan === undefined ? undefined : normalizePlanDestinations(previousPlan);
        // Retorno apos ausencia longa: plano novo do dia nasce mais curto.
        const returnMinutes = getReturnSessionMinutes(
          computeConsistency(storedAllTrainingLogs, date),
          storedProfile.defaultSessionMinutes,
        );
        const plan =
          normalizedStoredPlan === undefined
            ? generatePlan(
                effectiveProfile,
                storedWeaknesses,
                returnMinutes,
                date,
                buildPlanContext({
                  previousPlan: normalizedPreviousPlan,
                  recentThemeStats,
                  trainingLogs: storedAllTrainingLogs,
                  pendingItems: storedPendingItems,
                  diplomaAttempts: storedDiplomaAttempts,
                }),
              )
            : generatePlan(
                effectiveProfile,
                storedWeaknesses,
                toSessionMinutes(normalizedStoredPlan.sessionMinutes, effectiveProfile.defaultSessionMinutes),
                date,
                buildPlanContext({
                  previousPlan: combinePlanHistory(normalizedStoredPlan, normalizedPreviousPlan),
                  recentThemeStats,
                  trainingLogs: storedAllTrainingLogs,
                  pendingItems: storedPendingItems,
                  diplomaAttempts: storedDiplomaAttempts,
                }),
              );

        if (storedPlan === undefined || plan !== storedPlan) {
          await savePlan(plan);
        }

        setProfile(effectiveProfile);
        setSessionMinutes(toSessionMinutes(plan.sessionMinutes, effectiveProfile.defaultSessionMinutes));
        setTrainingLogs(storedTrainingLogs);
        setAllTrainingLogs(storedAllTrainingLogs);
        setPendingItems(storedPendingItems);
        setDiplomaAttempts(storedDiplomaAttempts);
        setAchievements(storedAchievements);
        setWeaknesses(storedWeaknesses);
        setSignals(storedSignals);
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
    errorCaptureEnabled,
    setErrorCaptureEnabled,
  };
}
