import { useCallback, useEffect, useState } from 'react';
import {
  appendPlanSession,
  buildPuzzleThemeStats,
  detectWeaknesses,
  createKnownManualSignals,
  createTutorQuestionSignal,
  completeTrainingLog,
  createTrainingRoadmap,
  createTrainingLog,
  generatePlan,
  getNextPlanSessionNumber,
  normalizePlanDestinations,
  skipTrainingLog,
  type DailyPlan,
  type LearnerProfile,
  type LearningPlanResponse,
  type LichessOAuthToken,
  type LichessStudyLink,
  type PlanBlock,
  type PlanBlockFeedback,
  type PuzzleThemeStats,
  type SessionMinutes,
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
  clearLichessOAuthToken,
  exportAllAsJson,
  appendSignals,
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
  savePlan,
  saveProfile as saveStoredProfile,
  saveTrainingLog,
  updatePendingItemStatus,
} from '../infra/storage/appData';
import { requestPersistentStorage, type StoragePersistenceStatus } from '../infra/storage/persistence';
import { getTodayDate } from './date';
import { toDiagnosisErrorMessage, toErrorMessage, toLichessErrorMessage } from './errorMessages';
import { openExternalUrl } from './externalOpen';
import { completeLichessOAuthIfNeeded, startLichessOAuthConnection } from './oauthFlow';
import {
  mergeTrainingLogs,
  reconcileLogIfPossible,
  reconcileLichessPuzzleDiagnostics,
  suggestPendingFromHardFeedback,
  upsertTrainingLog,
} from './trainingLogFlow';

export type AppView = 'today' | 'config';

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
  readonly weaknesses: Weakness[];
  readonly diagnosisState: DiagnosisState;
  readonly diagnosisMessage: string | undefined;
  readonly errorMessage: string | undefined;
  readonly storagePersistence: StoragePersistenceStatus | undefined;
  readonly setActiveView: (view: AppView) => void;
  readonly saveProfile: (profile: LearnerProfile) => Promise<void>;
  readonly regeneratePlan: (minutes: SessionMinutes) => Promise<void>;
  readonly createNextSession: (minutes: SessionMinutes) => Promise<void>;
  readonly importKnownManualSignals: () => Promise<number>;
  readonly answerTutorQuestion: (answer: TutorQuestionAnswer) => Promise<void>;
  readonly syncChesscomDiagnosis: () => Promise<void>;
  readonly connectLichess: () => Promise<void>;
  readonly disconnectLichess: () => Promise<void>;
  readonly syncLichessDiagnosis: () => Promise<void>;
  readonly reconcileLichessResults: () => Promise<void>;
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
  readonly clearAllData: () => Promise<void>;
};

export function useAppState(): AppState {
  const [activeView, setActiveView] = useState<AppView>('today');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [profile, setProfile] = useState<LearnerProfile | undefined>(undefined);
  const [todayPlan, setTodayPlan] = useState<DailyPlan | undefined>(undefined);
  const [sessionMinutes, setSessionMinutes] = useState<SessionMinutes>(15);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [allTrainingLogs, setAllTrainingLogs] = useState<TrainingLog[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingTrainingItem[]>([]);
  const [diplomaAttempts, setDiplomaAttempts] = useState<DiplomaAttempt[]>([]);
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [diagnosisState, setDiagnosisState] = useState<DiagnosisState>('idle');
  const [diagnosisMessage, setDiagnosisMessage] = useState<string | undefined>(undefined);
  const [lichessToken, setLichessToken] = useState<LichessOAuthToken | undefined>(undefined);
  const [lichessStudyLink, setLichessStudyLink] = useState<LichessStudyLink | undefined>(undefined);
  const [lichessConnectionState, setLichessConnectionState] = useState<LichessConnectionState>('disconnected');
  const [lichessMessage, setLichessMessage] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [storagePersistence, setStoragePersistence] = useState<StoragePersistenceStatus | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    async function loadAppData() {
      try {
        const persistenceStatus = await requestPersistentStorage();

        if (isMounted) {
          setStoragePersistence(persistenceStatus);
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
        const storedPlan = await getPlan(date);
        const previousPlan = await getLatestPlanBefore(date);
        const storedAllTrainingLogs = await loadTrainingLogs();
        const storedTrainingLogs = await loadTrainingLogsForDate(date);
        const storedStudyLink = await getLichessStudyLink(date);
        const storedPendingItems = await loadOpenPendingItems();
        const storedDiplomaAttempts = await loadDiplomaAttempts();
        const recentThemeStats = buildPuzzleThemeStats(storedTrainingLogs);
        const normalizedStoredPlan =
          storedPlan === undefined ? undefined : normalizePlanDestinations(storedPlan);
        const normalizedPreviousPlan =
          previousPlan === undefined ? undefined : normalizePlanDestinations(previousPlan);
        const openedBlockIds = getOpenedTrainingBlockIds(storedTrainingLogs);
        const plan =
          normalizedStoredPlan === undefined
            ? generatePlan(storedProfile, storedWeaknesses, storedProfile.defaultSessionMinutes, date, {
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
        setWeaknesses(storedWeaknesses);
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

  const saveProfile = useCallback(async (nextProfile: LearnerProfile) => {
    const date = getTodayDate();
    const recentThemeStats = buildPuzzleThemeStats(trainingLogs);
    const plan = generatePlan(nextProfile, weaknesses, nextProfile.defaultSessionMinutes, date, {
      previousPlan: todayPlan,
      recentThemeStats,
      openedBlockIds: getOpenedTrainingBlockIds(trainingLogs),
      openPendingItems: pendingItems,
      weakThemesFromDashboard: getWeakThemesFromThemeStats(recentThemeStats),
    });

    await saveStoredProfile(nextProfile);
    await savePlan(plan);

    setProfile(nextProfile);
    setSessionMinutes(nextProfile.defaultSessionMinutes);
    setTodayPlan(plan);
    setActiveView('today');
    setErrorMessage(undefined);
    setTrainingLogs(await loadTrainingLogsForDate(date));
    setAllTrainingLogs(await loadTrainingLogs());
  }, [pendingItems, todayPlan, trainingLogs, weaknesses]);

  const regeneratePlan = useCallback(
    async (minutes: SessionMinutes) => {
      if (profile === undefined) {
        setActiveView('config');
        return;
      }

      const recentThemeStats = buildPuzzleThemeStats(trainingLogs);
      const plan = generatePlan(profile, weaknesses, minutes, getTodayDate(), {
        previousPlan: todayPlan,
        recentThemeStats,
        openedBlockIds: getOpenedTrainingBlockIds(trainingLogs),
        openPendingItems: pendingItems,
        weakThemesFromDashboard: getWeakThemesFromThemeStats(recentThemeStats),
      });

      await savePlan(plan);
      setSessionMinutes(minutes);
      setTodayPlan(plan);
      setErrorMessage(undefined);
    },
    [pendingItems, profile, todayPlan, trainingLogs, weaknesses],
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
        const plan = generatePlan(profile, weaknesses, minutes, date, {
          recentThemeStats,
          openedBlockIds: getOpenedTrainingBlockIds(trainingLogs),
          openPendingItems: pendingItems,
          weakThemesFromDashboard: getWeakThemesFromThemeStats(recentThemeStats),
        });

        await savePlan(plan);
        setSessionMinutes(minutes);
        setTodayPlan(plan);
        setTrainingLogs(await loadTrainingLogsForDate(date));
        setAllTrainingLogs(await loadTrainingLogs());
        setErrorMessage(undefined);
        return;
      }

      const sessionPlan = generatePlan(profile, weaknesses, minutes, todayPlan.date, {
        previousPlan: todayPlan,
        sessionNumber: getNextPlanSessionNumber(todayPlan),
        recentThemeStats,
        openedBlockIds: getOpenedTrainingBlockIds(trainingLogs),
        openPendingItems: pendingItems,
        weakThemesFromDashboard: getWeakThemesFromThemeStats(recentThemeStats),
      });
      const nextPlan = appendPlanSession(todayPlan, sessionPlan);

      await savePlan(nextPlan);
      setSessionMinutes(minutes);
      setTodayPlan(nextPlan);
      setTrainingLogs(await loadTrainingLogsForDate(todayPlan.date));
      setAllTrainingLogs(await loadTrainingLogs());
      setErrorMessage(undefined);
    },
    [pendingItems, profile, todayPlan, trainingLogs, weaknesses],
  );

  const syncChesscomDiagnosis = useCallback(async () => {
    if (profile === undefined) {
      setActiveView('config');
      return;
    }

    if (profile.chesscomUsername === undefined || profile.chesscomUsername.trim() === '') {
      setDiagnosisState('error');
      setDiagnosisMessage('Informe seu usuario Chess.com na Config.');
      setActiveView('config');
      return;
    }

    setDiagnosisState('syncing');
    setDiagnosisMessage('Atualizando diagnóstico Chess.com.');

    try {
      const signals = await importChesscomSignals(profile.chesscomUsername, {
        cache: {
          loadMonth: loadChesscomMonthCache,
          saveMonth: saveChesscomMonthCache,
        },
      });

      await replaceSignalsForSource('chesscom', signals);

      const allSignals = await loadSignals();
      const nextWeaknesses = detectWeaknesses(allSignals);
      const date = getTodayDate();
      const recentThemeStats = buildPuzzleThemeStats(trainingLogs);
      const plan = generatePlan(profile, nextWeaknesses, sessionMinutes, date, {
        previousPlan: todayPlan,
        recentThemeStats,
        openedBlockIds: getOpenedTrainingBlockIds(trainingLogs),
        openPendingItems: pendingItems,
        weakThemesFromDashboard: getWeakThemesFromThemeStats(recentThemeStats),
      });

      await replaceWeaknesses(nextWeaknesses);
      await savePlan(plan);

      setWeaknesses(nextWeaknesses);
      setTodayPlan(plan);
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
  }, [pendingItems, profile, sessionMinutes, todayPlan, trainingLogs]);

  const importKnownManualSignals = useCallback(async () => {
    const manualSignals = createKnownManualSignals(new Date().toISOString());

    await replaceSignalsForSource('outro', manualSignals);

    const allSignals = await loadSignals();
    const nextWeaknesses = detectWeaknesses(allSignals);

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
      const nextWeaknesses = detectWeaknesses(allSignals);

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
      setDiagnosisMessage('Resposta registrada. Ajustei as hipoteses do treino.');
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
      setLichessMessage('Conexao Lichess removida.');
    }
  }, []);

  const syncLichessDiagnosis = useCallback(async () => {
    if (profile === undefined) {
      setActiveView('config');
      return;
    }

    if (profile.lichessUsername === undefined || profile.lichessUsername.trim() === '') {
      setLichessConnectionState('error');
      setLichessMessage('Informe seu usuario Lichess na Config.');
      setActiveView('config');
      return;
    }

    setLichessConnectionState('syncing');
    setLichessMessage('Atualizando diagnóstico Lichess.');

    try {
      const token = await loadLichessOAuthToken();
      const signals = await importLichessSignals({
        username: profile.lichessUsername,
        token: token?.accessToken,
      });

      await replaceSignalsForSource('lichess', signals);

      const allSignals = await loadSignals();
      const nextWeaknesses = detectWeaknesses(allSignals);
      const date = getTodayDate();
      const recentThemeStats = buildPuzzleThemeStats(trainingLogs);
      const plan = generatePlan(profile, nextWeaknesses, sessionMinutes, date, {
        previousPlan: todayPlan,
        recentThemeStats,
        openedBlockIds: getOpenedTrainingBlockIds(trainingLogs),
        openPendingItems: pendingItems,
        weakThemesFromDashboard: getWeakThemesFromThemeStats(recentThemeStats),
      });

      await replaceWeaknesses(nextWeaknesses);
      await savePlan(plan);

      setWeaknesses(nextWeaknesses);
      setTodayPlan(plan);
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
  }, [pendingItems, profile, sessionMinutes, todayPlan, trainingLogs]);

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

  const createLichessStudy = useCallback(async () => {
    if (todayPlan === undefined) {
      return;
    }

    const existingLink = await getLichessStudyLink(todayPlan.date);

    if (existingLink?.imported === true) {
      setLichessStudyLink(existingLink);
      setLichessMessage(openExternalUrl(existingLink.url) ?? 'Study do dia ja existe.');
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
    [pendingItems, profile, todayPlan, trainingLogs, weaknesses],
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

          await saveTrainingLog(reconcileOutcome.log);
          setTrainingLogs(upsertTrainingLog(trainingLogs, reconcileOutcome.log));
          setAllTrainingLogs(upsertTrainingLog(allTrainingLogs, reconcileOutcome.log));

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

  const clearAllData = useCallback(async () => {
    await clearAll();
    setProfile(undefined);
    setTodayPlan(undefined);
    setSessionMinutes(15);
    setTrainingLogs([]);
    setAllTrainingLogs([]);
    setPendingItems([]);
    setDiplomaAttempts([]);
    setWeaknesses([]);
    setLichessToken(undefined);
    setLichessStudyLink(undefined);
    setLichessConnectionState('disconnected');
    setLichessMessage(undefined);
    setDiagnosisState('idle');
    setDiagnosisMessage(undefined);
    setActiveView('config');
    setErrorMessage(undefined);
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
    weaknesses,
    diagnosisState,
    diagnosisMessage,
    errorMessage,
    storagePersistence,
    setActiveView,
    saveProfile,
    regeneratePlan,
    createNextSession,
    importKnownManualSignals,
    answerTutorQuestion,
    syncChesscomDiagnosis,
    connectLichess,
    disconnectLichess,
    syncLichessDiagnosis,
    reconcileLichessResults,
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
    exportBackup: exportAllAsJson,
    clearAllData,
  };
}

export function createDefaultProfile(): LearnerProfile {
  return {
    lichessUsername: 'jukasparov',
    chesscomUsername: 'jukatavares',
    band: '800-1200',
    defaultSessionMinutes: 15,
    goals: ['Criar uma rotina consistente de treino'],
    updatedAt: new Date().toISOString(),
  };
}

function toSessionMinutes(minutes: number, fallback: SessionMinutes): SessionMinutes {
  switch (minutes) {
    case 5:
    case 15:
    case 30:
    case 60:
      return minutes;
    default:
      return fallback;
  }
}

function combinePlanHistory(currentPlan: DailyPlan, previousPlan: DailyPlan | undefined): DailyPlan {
  if (previousPlan === undefined) {
    return currentPlan;
  }

  return {
    ...currentPlan,
    blocks: [...previousPlan.blocks, ...currentPlan.blocks],
  };
}

function getOpenedTrainingBlockIds(logs: readonly TrainingLog[]): string[] {
  return [...new Set(logs.map((log) => log.blockId))].sort();
}

function getWeakThemesFromThemeStats(stats: PuzzleThemeStats | undefined): string[] {
  return (stats?.themes ?? [])
    .filter((theme) => theme.losses > 0)
    .map((theme) => theme.theme)
    .sort();
}

function getLichessThemeFromUrl(url: string | undefined): string | undefined {
  if (url === undefined) {
    return undefined;
  }

  const prefix = 'https://lichess.org/training/';

  if (!url.startsWith(prefix)) {
    return undefined;
  }

  const theme = url.slice(prefix.length);

  return theme === '' || theme.includes('/') ? undefined : theme;
}

function upsertPendingItem(items: PendingTrainingItem[], nextItem: PendingTrainingItem): PendingTrainingItem[] {
  const existingIndex = items.findIndex((item) => item.id === nextItem.id);

  if (existingIndex === -1) {
    return [...items, nextItem];
  }

  return items.map((item, index) => (index === existingIndex ? nextItem : item));
}
