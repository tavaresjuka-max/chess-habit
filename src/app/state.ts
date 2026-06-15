import { useCallback, useEffect, useRef, useState } from 'react';
import {
  appendPlanSession,
  buildPuzzleThemeStats,
  computeConsistency,
  detectWeaknesses,
  filterFreshSignals,
  getReturnSessionMinutes,
  createKnownManualSignals,
  createTutorQuestionSignal,
  completeTrainingLog,
  createTrainingRoadmap,
  createTrainingLog,
  generatePlan,
  getNextPlanSessionNumber,
  normalizePlanDestinations,
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
import type { DiplomaAttempt, PendingTrainingItem } from '../domain/method/types';
import { importChesscomSignals } from '../infra/chesscom/chesscomClient';
import { importLichessSignals } from '../infra/lichess/games';
import { revokeLichessOAuthToken } from '../infra/lichess/oauth';
import { createDailyStudy } from '../infra/lichess/study';
import {
  clearAll,
  clearAutoBackupConfig,
  clearLichessOAuthToken,
  exportAllAsJson,
  importBackupFromJson,
  loadAutoBackupConfig,
  loadBackupMeta,
  loadOnboardingCompletedAt,
  markOnboardingCompleted,
  saveAutoBackupConfig,
  appendSignals,
  type BackupImportResult,
  getLatestPlanBefore,
  getLichessStudyLink,
  getPlan,
  getTrainingLog,
  loadDiplomaAttempts,
  loadChesscomMonthCache,
  loadLichessOAuthToken,
  loadOpenPendingItems,
  loadProfile,
  loadSignals,
  loadTrainingLogs,
  loadTrainingLogsForDate,
  loadWeaknesses,
  replaceSignalsForSource,
  replaceWeaknesses,
  saveChesscomMonthCache,
  savePendingItem,
  saveLichessStudyLink,
  savePlacementResult as savePlacementResultRecord,
  savePlan,
  type StoredPlacementResult,
  saveProfile as saveStoredProfile,
  saveTrainingLog,
  updatePendingItemStatus,
} from '../infra/storage/appData';
import {
  isAutoBackupSupported,
  pickAutoBackupFile,
  writeAutoBackup,
  type AutoBackupStatus,
  type FileSystemFileHandleLike,
} from '../infra/storage/autoBackup';
import type { BackupMetaRecord } from '../infra/storage/db';
import { requestPersistentStorage, type StoragePersistenceStatus } from '../infra/storage/persistence';
import { syncAchievements } from './achievementsSync';
import { getTodayDate } from './date';
import { toDiagnosisErrorMessage, toErrorMessage, toLichessErrorMessage } from './errorMessages';
import { openExternalUrl } from './externalOpen';
import { completeLichessOAuthIfNeeded, startLichessOAuthConnection } from './oauthFlow';
import {
  buildPlanContext,
  combinePlanHistory,
  getLichessThemeFromUrl,
  getOpenedTrainingBlockIds,
  getWeakThemesFromThemeStats,
  toSessionMinutes,
  upsertPendingItem,
} from './stateHelpers';
import {
  importFreeActivity as importFreeActivityFlow,
  mergeTrainingLogs,
  reconcileLogIfPossible,
  reconcileLichessPuzzleDiagnostics,
  suggestPendingFromHardFeedback,
  upsertTrainingLog,
} from './trainingLogFlow';

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

// Decisão 4 do dono (aprovada): o auto-sync (ao salvar) puxa só as partidas
// recentes para não travar no celular; o botão manual "Atualizar Lichess"
// continua puxando o histórico completo (max indefinido).
const AUTO_SYNC_MAX_LICHESS_GAMES = 500;

// Quando foi o último diagnóstico bem-sucedido de uma fonte: derivado do
// observedAt mais recente dos sinais salvos daquela fonte (cada sync grava
// observedAt = agora). undefined se a fonte nunca sincronizou.
async function latestSignalObservedAt(source: Signal['source']): Promise<string | undefined> {
  const all = await loadSignals();
  let latest: string | undefined;

  for (const signal of all) {
    if (signal.source === source && (latest === undefined || signal.observedAt > latest)) {
      latest = signal.observedAt;
    }
  }

  return latest;
}

export function useAppState(): AppState {
  const [activeView, setActiveView] = useState<AppView>('today');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [profile, setProfile] = useState<LearnerProfile | undefined>(undefined);
  const [todayPlan, setTodayPlan] = useState<DailyPlan | undefined>(undefined);
  // Espelho síncrono do plano atual: callbacks de segundo plano (auto-sync)
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
  const [lichessConnectionState, setLichessConnectionState] = useState<LichessConnectionState>('disconnected');
  const [lichessMessage, setLichessMessage] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [storagePersistence, setStoragePersistence] = useState<StoragePersistenceStatus | undefined>(undefined);
  const [backupMeta, setBackupMeta] = useState<BackupMetaRecord | undefined>(undefined);
  const [autoBackupStatus, setAutoBackupStatus] = useState<AutoBackupStatus>(
    isAutoBackupSupported() ? 'disabled' : 'unsupported',
  );
  const [autoBackupFileName, setAutoBackupFileName] = useState<string | undefined>(undefined);
  const [onboardingCompletedAt, setOnboardingCompletedAt] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    async function loadAppData() {
      try {
        const persistenceStatus = await requestPersistentStorage();
        const storedBackupMeta = await loadBackupMeta();
        const storedOnboardingCompletedAt = await loadOnboardingCompletedAt();

        if (isMounted) {
          setStoragePersistence(persistenceStatus);
          setBackupMeta(storedBackupMeta);
          setOnboardingCompletedAt(storedOnboardingCompletedAt);
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
        const storedAchievements = await syncAchievements(storedAllTrainingLogs);
        const recentThemeStats = buildPuzzleThemeStats(storedTrainingLogs);
        const normalizedStoredPlan =
          storedPlan === undefined ? undefined : normalizePlanDestinations(storedPlan);
        const normalizedPreviousPlan =
          previousPlan === undefined ? undefined : normalizePlanDestinations(previousPlan);
        const openedBlockIds = getOpenedTrainingBlockIds(storedTrainingLogs);
        // Retorno apos ausencia longa: plano novo do dia nasce mais curto.
        const returnMinutes = getReturnSessionMinutes(
          computeConsistency(storedAllTrainingLogs, date),
          storedProfile.defaultSessionMinutes,
        );
        const plan =
          normalizedStoredPlan === undefined
            ? generatePlan(storedProfile, storedWeaknesses, returnMinutes, date, {
                previousPlan: normalizedPreviousPlan,
                recentThemeStats,
                openedBlockIds,
                openPendingItems: storedPendingItems,
                weakThemesFromDashboard: getWeakThemesFromThemeStats(recentThemeStats),
              })
            : generatePlan(storedProfile, storedWeaknesses, toSessionMinutes(normalizedStoredPlan.sessionMinutes, storedProfile.defaultSessionMinutes), date, {
                previousPlan: combinePlanHistory(normalizedStoredPlan, normalizedPreviousPlan),
                recentThemeStats,
                openedBlockIds,
                openPendingItems: storedPendingItems,
                weakThemesFromDashboard: getWeakThemesFromThemeStats(recentThemeStats),
              });

        if (storedPlan === undefined || plan !== storedPlan) {
          await savePlan(plan);
        }

        setProfile(storedProfile);
        setSessionMinutes(toSessionMinutes(plan.sessionMinutes, storedProfile.defaultSessionMinutes));
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

  // Mantém o ref do plano sempre com o valor mais recente, para o auto-sync em
  // segundo plano não sobrescrever uma aprovação feita durante o fetch.
  useEffect(() => {
    latestPlanRef.current = todayPlan;
  }, [todayPlan]);

  // Núcleo do diagnóstico Chess.com, parametrizado pelo perfil-alvo. Recebe o
  // perfil explícito (não o do estado) para que o auto-sync logo após salvar
  // use os dados recém-gravados, sem esperar o re-render.
  const runChesscomSync = useCallback(
    async (targetProfile: LearnerProfile, options?: { maxAgeMs?: number }) => {
      if (targetProfile.chesscomUsername === undefined || targetProfile.chesscomUsername.trim() === '') {
        return;
      }

      // Guarda de validade (só no auto-sync): se sincronizamos há pouco,
      // reaproveita o diagnóstico salvo em vez de re-buscar.
      if (options?.maxAgeMs !== undefined) {
        const lastSyncAt = await latestSignalObservedAt('chesscom');
        if (lastSyncAt !== undefined && Date.now() - Date.parse(lastSyncAt) < options.maxAgeMs) {
          return;
        }
      }

      setDiagnosisState('syncing');
      setDiagnosisMessage('Atualizando diagnóstico Chess.com.');

      try {
        const signals = await importChesscomSignals(targetProfile.chesscomUsername, {
          cache: {
            loadMonth: loadChesscomMonthCache,
            saveMonth: saveChesscomMonthCache,
          },
        });

        await replaceSignalsForSource('chesscom', signals);

        const allSignals = await loadSignals();
        setSignals(allSignals);
        const nextWeaknesses = detectWeaknesses(filterFreshSignals(allSignals, new Date().toISOString()), targetProfile.band);
        const date = getTodayDate();
        const recentThemeStats = buildPuzzleThemeStats(trainingLogs);
        const plan = generatePlan(
          targetProfile,
          nextWeaknesses,
          sessionMinutes,
          date,
          buildPlanContext({
            previousPlan: latestPlanRef.current,
            recentThemeStats,
            trainingLogs,
            pendingItems,
            diplomaAttempts,
          }),
        );

        // Preserva a aprovação do plano: se o aluno aprovou enquanto a rede
        // respondia, o plano mais recente (ref) carrega a resposta — mantemos.
        const latestPlan = latestPlanRef.current;
        const mergedPlan =
          latestPlan?.date === plan.date && latestPlan.learningPlanResponse !== undefined
            ? { ...plan, learningPlanResponse: latestPlan.learningPlanResponse }
            : plan;

        await replaceWeaknesses(nextWeaknesses);
        await savePlan(mergedPlan);

        setWeaknesses(nextWeaknesses);
        setTodayPlan(mergedPlan);
        latestPlanRef.current = mergedPlan;
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
    },
    [diplomaAttempts, pendingItems, sessionMinutes, trainingLogs],
  );

  // Núcleo do diagnóstico Lichess, também parametrizado pelo perfil-alvo.
  const runLichessSync = useCallback(
    async (targetProfile: LearnerProfile, options?: { maxAgeMs?: number }) => {
      if (targetProfile.lichessUsername === undefined || targetProfile.lichessUsername.trim() === '') {
        return;
      }

      // Guarda de validade (só no auto-sync): Lichess não tem cache e re-exporta
      // o histórico todo, então aqui evitamos re-puxar se sincronizou há pouco.
      if (options?.maxAgeMs !== undefined) {
        const lastSyncAt = await latestSignalObservedAt('lichess');
        if (lastSyncAt !== undefined && Date.now() - Date.parse(lastSyncAt) < options.maxAgeMs) {
          return;
        }
      }

      setLichessConnectionState('syncing');
      setLichessMessage('Atualizando diagnóstico Lichess.');

      try {
        const token = await loadLichessOAuthToken();
        // Auto-sync (maxAgeMs presente) limita ao recente; manual puxa tudo.
        const max = options?.maxAgeMs !== undefined ? AUTO_SYNC_MAX_LICHESS_GAMES : undefined;
        const signals = await importLichessSignals({
          username: targetProfile.lichessUsername,
          token: token?.accessToken,
          ...(max === undefined ? {} : { max }),
        });

        await replaceSignalsForSource('lichess', signals);

        const allSignals = await loadSignals();
        setSignals(allSignals);
        const nextWeaknesses = detectWeaknesses(filterFreshSignals(allSignals, new Date().toISOString()), targetProfile.band);
        const date = getTodayDate();
        const recentThemeStats = buildPuzzleThemeStats(trainingLogs);
        const plan = generatePlan(
          targetProfile,
          nextWeaknesses,
          sessionMinutes,
          date,
          buildPlanContext({
            previousPlan: latestPlanRef.current,
            recentThemeStats,
            trainingLogs,
            pendingItems,
            diplomaAttempts,
          }),
        );

        // Preserva a aprovação do plano (mesmo motivo do sync Chess.com).
        const latestPlan = latestPlanRef.current;
        const mergedPlan =
          latestPlan?.date === plan.date && latestPlan.learningPlanResponse !== undefined
            ? { ...plan, learningPlanResponse: latestPlan.learningPlanResponse }
            : plan;

        await replaceWeaknesses(nextWeaknesses);
        await savePlan(mergedPlan);

        setWeaknesses(nextWeaknesses);
        setTodayPlan(mergedPlan);
        latestPlanRef.current = mergedPlan;
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
    },
    [diplomaAttempts, pendingItems, sessionMinutes, trainingLogs],
  );

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
      void (async () => {
        if (wantsChesscom) {
          await runChesscomSync(nextProfile, { maxAgeMs: AUTO_SYNC_FRESHNESS_MS });
        }

        if (wantsLichess) {
          await runLichessSync(nextProfile, { maxAgeMs: AUTO_SYNC_FRESHNESS_MS });
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

  const syncChesscomDiagnosis = useCallback(async () => {
    if (profile === undefined) {
      setActiveView('config');
      return;
    }

    if (profile.chesscomUsername === undefined || profile.chesscomUsername.trim() === '') {
      setDiagnosisState('error');
      setDiagnosisMessage('Informe seu usuário Chess.com na Config.');
      setActiveView('config');
      return;
    }

    await runChesscomSync(profile);
  }, [profile, runChesscomSync]);

  const importKnownManualSignals = useCallback(async () => {
    const manualSignals = createKnownManualSignals(new Date().toISOString());

    await replaceSignalsForSource('outro', manualSignals);

    const allSignals = await loadSignals();
    setSignals(allSignals);
    const nextWeaknesses = detectWeaknesses(filterFreshSignals(allSignals, new Date().toISOString()), profile?.band);

    await replaceWeaknesses(nextWeaknesses);
    setWeaknesses(nextWeaknesses);

    if (profile !== undefined) {
      const date = getTodayDate();
      const recentThemeStats = buildPuzzleThemeStats(trainingLogs);
      const plan = generatePlan(profile, nextWeaknesses, sessionMinutes, date, {
        previousPlan: todayPlan,
        recentThemeStats,
        openedBlockIds: getOpenedTrainingBlockIds(trainingLogs),
        openPendingItems: pendingItems,
        weakThemesFromDashboard: getWeakThemesFromThemeStats(recentThemeStats),
      });

      await savePlan(plan);
      setTodayPlan(plan);
    }

    return manualSignals.length;
  }, [pendingItems, profile, sessionMinutes, todayPlan, trainingLogs]);

  const answerTutorQuestion = useCallback(
    async (answer: TutorQuestionAnswer) => {
      const signal = createTutorQuestionSignal(answer, new Date().toISOString());

      await appendSignals([signal]);

      const allSignals = await loadSignals();
      setSignals(allSignals);
      const nextWeaknesses = detectWeaknesses(filterFreshSignals(allSignals, new Date().toISOString()), profile?.band);

      await replaceWeaknesses(nextWeaknesses);
      setWeaknesses(nextWeaknesses);

      if (profile !== undefined) {
        const date = getTodayDate();
        const recentThemeStats = buildPuzzleThemeStats(trainingLogs);
        const plan = generatePlan(profile, nextWeaknesses, sessionMinutes, date, {
          previousPlan: todayPlan,
          recentThemeStats,
          openedBlockIds: getOpenedTrainingBlockIds(trainingLogs),
          openPendingItems: pendingItems,
          weakThemesFromDashboard: getWeakThemesFromThemeStats(recentThemeStats),
        });

        await savePlan(plan);
        setTodayPlan(plan);
      }

      setDiagnosisState('success');
      setDiagnosisMessage('Resposta registrada. Ajustei as hipóteses do treino.');
      setErrorMessage(undefined);
    },
    [pendingItems, profile, sessionMinutes, todayPlan, trainingLogs],
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

  const syncLichessDiagnosis = useCallback(async () => {
    if (profile === undefined) {
      setActiveView('config');
      return;
    }

    if (profile.lichessUsername === undefined || profile.lichessUsername.trim() === '') {
      setLichessConnectionState('error');
      setLichessMessage('Informe seu usuário Lichess na Config.');
      setActiveView('config');
      return;
    }

    await runLichessSync(profile);
  }, [profile, runLichessSync]);

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
          {
            previousPlan: todayPlan,
            recentThemeStats,
            openedBlockIds: getOpenedTrainingBlockIds(nextTrainingLogs),
            openPendingItems: pendingItems,
            weakThemesFromDashboard: getWeakThemesFromThemeStats(recentThemeStats),
          },
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
  }, [allTrainingLogs, pendingItems, profile, todayPlan, trainingLogs, weaknesses]);

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

  const openPendingItem = useCallback((item: PendingTrainingItem): Promise<void> => {
    if (item.lichessUrl === undefined) {
      setLichessMessage('Pendência registrada, mas ainda sem link Lichess.');
      return Promise.resolve();
    }

    setLichessMessage(openExternalUrl(item.lichessUrl) ?? 'Pendência aberta no Lichess.');
    return Promise.resolve();
  }, []);

  const deferPendingItem = useCallback(
    async (item: PendingTrainingItem) => {
      await updatePendingItemStatus(item.id, 'deferred');

      const nextPendingItems = pendingItems.filter((pendingItem) => pendingItem.id !== item.id);

      setPendingItems(nextPendingItems);

      if (profile !== undefined && todayPlan !== undefined) {
        const recentThemeStats = buildPuzzleThemeStats(trainingLogs);
        const nextPlan = generatePlan(
          profile,
          weaknesses,
          toSessionMinutes(todayPlan.sessionMinutes, profile.defaultSessionMinutes),
          todayPlan.date,
          {
            previousPlan: todayPlan,
            recentThemeStats,
            openedBlockIds: getOpenedTrainingBlockIds(trainingLogs),
            openPendingItems: nextPendingItems,
            weakThemesFromDashboard: getWeakThemesFromThemeStats(recentThemeStats),
          },
        );

        await savePlan(nextPlan);
        setTodayPlan(nextPlan);
      }

      setLichessMessage('Pendência adiada.');
    },
    [diplomaAttempts, pendingItems, profile, todayPlan, trainingLogs, weaknesses],
  );

  const savePendingFromHardFeedback = useCallback(
    async (blockId: string) => {
      if (todayPlan === undefined) {
        return;
      }

      const block = todayPlan.blocks.find((planBlock) => planBlock.id === blockId);

      if (block?.weaknessTag === undefined || block.methodTrackId === undefined) {
        setErrorMessage('Não consegui criar pendência para este bloco.');
        return;
      }

      const log = await getTrainingLog(`${todayPlan.date}:${blockId}`);

      if (log === undefined) {
        setErrorMessage('Conclua o bloco antes de guardar como pendência.');
        return;
      }

      const item = await suggestPendingFromHardFeedback(
        log,
        block.weaknessTag,
        block.methodTrackId,
        getLichessThemeFromUrl(block.destination.url),
      );

      await savePendingItem(item);
      setPendingItems((current) => upsertPendingItem(current, item));
      setLichessMessage('Pendência guardada para revisão amanhã.');
      setErrorMessage(undefined);
    },
    [todayPlan],
  );

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
          const nextAllTrainingLogs = upsertTrainingLog(allTrainingLogs, reconcileOutcome.log);

          await saveTrainingLog(reconcileOutcome.log);
          setTrainingLogs(upsertTrainingLog(trainingLogs, reconcileOutcome.log));
          setAllTrainingLogs(nextAllTrainingLogs);
          // Conquistas (Corte 7): avaliadas no fechamento de bloco, fonte de
          // verdade no Dexie; sem celebração visual, só registro sóbrio.
          setAchievements(await syncAchievements(nextAllTrainingLogs));

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
        setAllTrainingLogs(upsertTrainingLog(allTrainingLogs, skippedLog));
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
    [allTrainingLogs, todayPlan, trainingLogs],
  );

  const skipBlockTraining = useCallback(
    async (blockId: string) => {
      await updateBlockStatusWithTrainingLog(blockId, 'skipped');
    },
    [updateBlockStatusWithTrainingLog],
  );

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
  }, []);

  const disableAutoBackup = useCallback(async () => {
    await clearAutoBackupConfig();
    setAutoBackupFileName(undefined);
    setAutoBackupStatus(isAutoBackupSupported() ? 'disabled' : 'unsupported');
  }, []);

  // Marca o fim do funil (primeira vez). A partir daqui o app abre direto no
  // Hoje e a aprovação diária volta a ser a dobra dentro do Hoje.
  const completeOnboarding = useCallback(async () => {
    const nowIso = new Date().toISOString();

    await markOnboardingCompleted(nowIso);
    setOnboardingCompletedAt(nowIso);
  }, []);

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
    lichessUsername: 'jukasparov',
    chesscomUsername: 'jukatavares',
    band: '800-1000',
    defaultSessionMinutes: 15,
    goals: ['Criar uma rotina consistente de treino'],
    updatedAt: new Date().toISOString(),
  };
}
