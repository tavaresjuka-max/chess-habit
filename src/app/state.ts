import { useCallback, useEffect, useState } from 'react';
import { createSingleFlight } from './singleFlight';
import {
  appendPlanSession,
  detectWeaknesses,
  createKnownManualSignals,
  completeTrainingLog,
  createTrainingRoadmap,
  createTrainingLog,
  generatePlan,
  getNextPlanSessionNumber,
  normalizePlanDestinations,
  reconcileTrainingLogResult,
  skipTrainingLog,
  type DailyPlan,
  type LearnerProfile,
  type LichessOAuthToken,
  type LichessStudyLink,
  type PlanBlock,
  type PlanBlockFeedback,
  type SessionMinutes,
  type TrainingLog,
  type TrainingRoadmapItem,
  type Weakness,
} from '../domain';
import { ChesscomRateLimitError, importChesscomSignals } from '../infra/chesscom/chesscomClient';
import { importLichessSignals } from '../infra/lichess/games';
import {
  createLichessOAuthRequest,
  exchangeLichessOAuthCode,
  parseLichessOAuthCallback,
  revokeLichessOAuthToken,
  stripOAuthQuery,
} from '../infra/lichess/oauth';
import { fetchPuzzleActivity, LichessRateLimitError, summarizePuzzleActivity } from '../infra/lichess/puzzleActivity';
import { createDailyStudy } from '../infra/lichess/study';
import {
  clearAll,
  clearLichessOAuthToken,
  exportAllAsJson,
  getLichessStudyLink,
  getPlan,
  getTrainingLog,
  loadChesscomMonthCache,
  loadLichessOAuthToken,
  loadProfile,
  loadSignals,
  loadTrainingLogsForDate,
  loadWeaknesses,
  replaceSignalsForSource,
  replaceWeaknesses,
  saveChesscomMonthCache,
  saveLichessOAuthToken,
  saveLichessStudyLink,
  savePlan,
  saveProfile as saveStoredProfile,
  saveTrainingLog,
} from '../infra/storage/appData';

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
  readonly weaknesses: Weakness[];
  readonly diagnosisState: DiagnosisState;
  readonly diagnosisMessage: string | undefined;
  readonly errorMessage: string | undefined;
  readonly setActiveView: (view: AppView) => void;
  readonly saveProfile: (profile: LearnerProfile) => Promise<void>;
  readonly regeneratePlan: (minutes: SessionMinutes) => Promise<void>;
  readonly createNextSession: (minutes: SessionMinutes) => Promise<void>;
  readonly importKnownManualSignals: () => Promise<number>;
  readonly syncChesscomDiagnosis: () => Promise<void>;
  readonly connectLichess: () => Promise<void>;
  readonly disconnectLichess: () => Promise<void>;
  readonly syncLichessDiagnosis: () => Promise<void>;
  readonly reconcileLichessResults: () => Promise<void>;
  readonly createLichessStudy: () => Promise<void>;
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
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [diagnosisState, setDiagnosisState] = useState<DiagnosisState>('idle');
  const [diagnosisMessage, setDiagnosisMessage] = useState<string | undefined>(undefined);
  const [lichessToken, setLichessToken] = useState<LichessOAuthToken | undefined>(undefined);
  const [lichessStudyLink, setLichessStudyLink] = useState<LichessStudyLink | undefined>(undefined);
  const [lichessConnectionState, setLichessConnectionState] = useState<LichessConnectionState>('disconnected');
  const [lichessMessage, setLichessMessage] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    async function loadAppData() {
      try {
        const oauthToken = await completeLichessOAuthIfNeeded();
        const storedProfile = await loadProfile();

        if (!isMounted) {
          return;
        }

        if (oauthToken !== undefined) {
          setLichessToken(oauthToken);
          setLichessConnectionState('connected');
          setLichessMessage('Lichess conectado.');
        } else {
          const storedToken = await loadLichessOAuthToken();
          setLichessToken(storedToken);
          setLichessConnectionState(storedToken === undefined ? 'disconnected' : 'connected');
        }

        if (storedProfile === undefined) {
          setActiveView('config');
          setLoadState('ready');
          return;
        }

        const date = getTodayDate();
        const storedWeaknesses = await loadWeaknesses();
        const storedPlan = await getPlan(date);
        const storedTrainingLogs = await loadTrainingLogsForDate(date);
        const storedStudyLink = await getLichessStudyLink(date);
        const plan =
          storedPlan === undefined
            ? generatePlan(storedProfile, storedWeaknesses, storedProfile.defaultSessionMinutes, date)
            : normalizePlanDestinations(storedPlan);

        if (storedPlan === undefined || plan !== storedPlan) {
          await savePlan(plan);
        }

        setProfile(storedProfile);
        setSessionMinutes(toSessionMinutes(plan.sessionMinutes, storedProfile.defaultSessionMinutes));
        setTrainingLogs(storedTrainingLogs);
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
    const plan = generatePlan(nextProfile, weaknesses, nextProfile.defaultSessionMinutes, date, {
      previousPlan: todayPlan,
    });

    await saveStoredProfile(nextProfile);
    await savePlan(plan);

    setProfile(nextProfile);
    setSessionMinutes(nextProfile.defaultSessionMinutes);
    setTodayPlan(plan);
    setActiveView('today');
    setErrorMessage(undefined);
    setTrainingLogs(await loadTrainingLogsForDate(date));
  }, [todayPlan, weaknesses]);

  const regeneratePlan = useCallback(
    async (minutes: SessionMinutes) => {
      if (profile === undefined) {
        setActiveView('config');
        return;
      }

      const plan = generatePlan(profile, weaknesses, minutes, getTodayDate(), { previousPlan: todayPlan });

      await savePlan(plan);
      setSessionMinutes(minutes);
      setTodayPlan(plan);
      setErrorMessage(undefined);
    },
    [profile, todayPlan, weaknesses],
  );

  const createNextSession = useCallback(
    async (minutes: SessionMinutes) => {
      if (profile === undefined) {
        setActiveView('config');
        return;
      }

      if (todayPlan === undefined) {
        const date = getTodayDate();
        const plan = generatePlan(profile, weaknesses, minutes, date);

        await savePlan(plan);
        setSessionMinutes(minutes);
        setTodayPlan(plan);
        setTrainingLogs(await loadTrainingLogsForDate(date));
        setErrorMessage(undefined);
        return;
      }

      const sessionPlan = generatePlan(profile, weaknesses, minutes, todayPlan.date, {
        previousPlan: todayPlan,
        sessionNumber: getNextPlanSessionNumber(todayPlan),
      });
      const nextPlan = appendPlanSession(todayPlan, sessionPlan);

      await savePlan(nextPlan);
      setSessionMinutes(minutes);
      setTodayPlan(nextPlan);
      setTrainingLogs(await loadTrainingLogsForDate(todayPlan.date));
      setErrorMessage(undefined);
    },
    [profile, todayPlan, weaknesses],
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
    setDiagnosisMessage('Atualizando diagnostico Chess.com.');

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
      const plan = generatePlan(profile, nextWeaknesses, sessionMinutes, date, { previousPlan: todayPlan });

      await replaceWeaknesses(nextWeaknesses);
      await savePlan(plan);

      setWeaknesses(nextWeaknesses);
      setTodayPlan(plan);
      setDiagnosisState('success');
      setDiagnosisMessage(
        nextWeaknesses.length === 0
          ? `Diagnostico atualizado com ${String(signals.length)} sinais derivados. Ainda sem limiar suficiente; mantive plano conservador.`
          : `Diagnostico atualizado com ${String(signals.length)} sinais derivados e ${String(nextWeaknesses.length)} hipoteses.`,
      );
      setErrorMessage(undefined);
    } catch (error) {
      setDiagnosisState('error');
      setDiagnosisMessage(toDiagnosisErrorMessage(error));
    }
  }, [profile, sessionMinutes, todayPlan]);

  const importKnownManualSignals = useCallback(async () => {
    const manualSignals = createKnownManualSignals(new Date().toISOString());

    await replaceSignalsForSource('outro', manualSignals);

    const allSignals = await loadSignals();
    const nextWeaknesses = detectWeaknesses(allSignals);

    await replaceWeaknesses(nextWeaknesses);
    setWeaknesses(nextWeaknesses);

    if (profile !== undefined) {
      const date = getTodayDate();
      const plan = generatePlan(profile, nextWeaknesses, sessionMinutes, date, { previousPlan: todayPlan });

      await savePlan(plan);
      setTodayPlan(plan);
    }

    return manualSignals.length;
  }, [profile, sessionMinutes, todayPlan]);

  const connectLichess = useCallback(async () => {
    const redirectUri = getOAuthRedirectUri();
    const request = await createLichessOAuthRequest({
      clientId: oauthClientId,
      redirectUri,
      username: profile?.lichessUsername,
    });

    sessionStorage.setItem(oauthSessionStorageKey, JSON.stringify(request));
    window.location.assign(request.authorizationUrl);
  }, [profile]);

  const disconnectLichess = useCallback(async () => {
    const token = await loadLichessOAuthToken();

    if (token !== undefined) {
      await revokeLichessOAuthToken({ token: token.accessToken });
    }

    await clearLichessOAuthToken();
    setLichessToken(undefined);
    setLichessConnectionState('disconnected');
    setLichessMessage('Conexao Lichess removida.');
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
    setLichessMessage('Atualizando diagnostico Lichess.');

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
      const plan = generatePlan(profile, nextWeaknesses, sessionMinutes, date, { previousPlan: todayPlan });

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
  }, [profile, sessionMinutes, todayPlan]);

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
      const reconciledLogs = await reconcileLogsWithLichessPuzzleActivity(trainingLogs, token.accessToken);

      for (const log of reconciledLogs) {
        await saveTrainingLog(log);
      }

      setTrainingLogs(mergeTrainingLogs(trainingLogs, reconciledLogs));
      setLichessConnectionState('connected');
      setLichessMessage(
        reconciledLogs.length === 0
          ? 'Nenhum resultado novo de puzzle encontrado.'
          : `${String(reconciledLogs.length)} bloco(s) reconciliado(s) com o Lichess.`,
      );
    } catch (error) {
      setLichessConnectionState('error');
      setLichessMessage(toLichessErrorMessage(error));
    }
  }, [trainingLogs]);

  const createLichessStudy = useCallback(async () => {
    if (todayPlan === undefined) {
      return;
    }

    const existingLink = await getLichessStudyLink(todayPlan.date);

    if (existingLink?.imported === true) {
      setLichessStudyLink(existingLink);
      setLichessMessage('Study do dia ja existe.');
      window.open(existingLink.url, '_blank', 'noopener,noreferrer');
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
      setLichessMessage('Study do dia criado no Lichess.');
      window.open(studyLink.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setLichessConnectionState('error');
      setLichessMessage(toLichessErrorMessage(error));
    }
  }, [todayPlan]);

  const startBlockTraining = useCallback(
    async (block: PlanBlock) => {
      if (todayPlan === undefined) {
        return;
      }

      const startedAt = new Date().toISOString();
      const log = createTrainingLog({
        block,
        date: todayPlan.date,
        startedAt,
      });

      await saveTrainingLog(log);
      setTrainingLogs(upsertTrainingLog(trainingLogs, log));

      if (block.destination.url !== undefined) {
        window.open(block.destination.url, '_blank', 'noopener,noreferrer');
      }
    },
    [todayPlan, trainingLogs],
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
          const reconciledLog = await reconcileLogIfPossible(completedLog);

          await saveTrainingLog(reconciledLog);
          setTrainingLogs(upsertTrainingLog(trainingLogs, reconciledLog));
        }
      }

      if (status === 'skipped' && existingLog !== undefined) {
        const skippedLog = skipTrainingLog({
          log: existingLog,
          skippedAt: updatedAt,
        });

        await saveTrainingLog(skippedLog);
        setTrainingLogs(upsertTrainingLog(trainingLogs, skippedLog));
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
    [todayPlan, trainingLogs],
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
    weaknesses,
    diagnosisState,
    diagnosisMessage,
    errorMessage,
    setActiveView,
    saveProfile,
    regeneratePlan,
    createNextSession,
    importKnownManualSignals,
    syncChesscomDiagnosis,
    connectLichess,
    disconnectLichess,
    syncLichessDiagnosis,
    reconcileLichessResults,
    createLichessStudy,
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

const oauthClientId = 'lichess-tutor-local';
const oauthSessionStorageKey = 'lichess-tutor:oauth-pending';
const oauthCompletionFlight = createSingleFlight<LichessOAuthToken | undefined>();

type StoredOAuthRequest = {
  state: string;
  codeVerifier: string;
  redirectUri: string;
  scopes: LichessOAuthToken['scopes'];
};

async function completeLichessOAuthIfNeeded(): Promise<LichessOAuthToken | undefined> {
  // Em StrictMode o efeito de carga roda duas vezes; o codigo de autorizacao do
  // Lichess so pode ser trocado uma vez. O single-flight garante uma unica troca
  // e ambas as execucoes recebem o mesmo token, entao a execucao viva consegue
  // marcar a conexao como conectada sem depender de um refresh manual.
  return oauthCompletionFlight(runLichessOAuthCompletion);
}

async function runLichessOAuthCompletion(): Promise<LichessOAuthToken | undefined> {
  const callback = parseLichessOAuthCallback(window.location.href);

  if (callback === undefined) {
    return undefined;
  }

  const pending = readPendingOAuthRequest();

  if (pending === undefined || pending.state !== callback.state) {
    throw new Error('Retorno OAuth Lichess nao confere com a solicitacao local.');
  }

  const token = await exchangeLichessOAuthCode({
    code: callback.code,
    codeVerifier: pending.codeVerifier,
    redirectUri: pending.redirectUri,
    clientId: oauthClientId,
    scopes: pending.scopes,
    nowIso: new Date().toISOString(),
  });

  await saveLichessOAuthToken(token);
  sessionStorage.removeItem(oauthSessionStorageKey);
  window.history.replaceState(null, document.title, stripOAuthQuery(window.location.href));

  return token;
}

function readPendingOAuthRequest(): StoredOAuthRequest | undefined {
  const raw = sessionStorage.getItem(oauthSessionStorageKey);

  if (raw === null) {
    return undefined;
  }

  const parsed = JSON.parse(raw) as unknown;

  if (!isStoredOAuthRequest(parsed)) {
    return undefined;
  }

  return parsed;
}

function getOAuthRedirectUri(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

async function reconcileLogIfPossible(log: TrainingLog): Promise<TrainingLog> {
  if (!isPuzzleTrainingLog(log)) {
    return log;
  }

  try {
    const token = await loadLichessOAuthToken();

    if (token === undefined) {
      return log;
    }

    const until = log.completedAt ?? new Date().toISOString();
    const activities = await fetchPuzzleActivity({
      token: token.accessToken,
      since: log.startedAt,
      until,
      max: 50,
    });

    if (activities.length === 0) {
      return log;
    }

    return reconcileTrainingLogResult({
      log,
      result: summarizePuzzleActivity({
        activities,
        fetchedAt: new Date().toISOString(),
        since: log.startedAt,
        until,
      }),
    });
  } catch {
    return log;
  }
}

async function reconcileLogsWithLichessPuzzleActivity(logs: TrainingLog[], token: string): Promise<TrainingLog[]> {
  const reconciledLogs: TrainingLog[] = [];

  for (const log of logs) {
    if (!isPuzzleTrainingLog(log) || log.result !== undefined) {
      continue;
    }

    const until = log.completedAt ?? new Date().toISOString();
    const activities = await fetchPuzzleActivity({
      token,
      since: log.startedAt,
      until,
      max: 50,
    });

    if (activities.length === 0) {
      continue;
    }

    reconciledLogs.push(
      reconcileTrainingLogResult({
        log,
        result: summarizePuzzleActivity({
          activities,
          fetchedAt: new Date().toISOString(),
          since: log.startedAt,
          until,
        }),
      }),
    );
  }

  return reconciledLogs;
}

function isPuzzleTrainingLog(log: TrainingLog): boolean {
  return log.destinationLabel.includes('Puzzles') || log.destinationLabel.includes('Puzzle');
}

function mergeTrainingLogs(currentLogs: TrainingLog[], nextLogs: TrainingLog[]): TrainingLog[] {
  return nextLogs.reduce(upsertTrainingLog, currentLogs);
}

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${String(year)}-${month}-${day}`;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Nao foi possivel carregar os dados locais.';
}

function toDiagnosisErrorMessage(error: unknown): string {
  if (error instanceof ChesscomRateLimitError || error instanceof LichessRateLimitError) {
    return error.message;
  }

  return error instanceof Error ? error.message : 'Nao foi possivel atualizar o diagnostico Chess.com.';
}

function toLichessErrorMessage(error: unknown): string {
  if (error instanceof LichessRateLimitError) {
    return error.message;
  }

  return error instanceof Error ? error.message : 'Nao foi possivel atualizar o Lichess.';
}

function upsertTrainingLog(logs: TrainingLog[], nextLog: TrainingLog): TrainingLog[] {
  const existingIndex = logs.findIndex((log) => log.id === nextLog.id);

  if (existingIndex === -1) {
    return [...logs, nextLog];
  }

  return logs.map((log, index) => (index === existingIndex ? nextLog : log));
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

function isStoredOAuthRequest(value: unknown): value is StoredOAuthRequest {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as {
    state?: unknown;
    codeVerifier?: unknown;
    redirectUri?: unknown;
    scopes?: unknown;
  };

  return (
    typeof candidate.state === 'string' &&
    typeof candidate.codeVerifier === 'string' &&
    typeof candidate.redirectUri === 'string' &&
    Array.isArray(candidate.scopes) &&
    candidate.scopes.every(isLichessOAuthScope)
  );
}

function isLichessOAuthScope(scope: unknown): scope is LichessOAuthToken['scopes'][number] {
  return scope === 'puzzle:read' || scope === 'study:write';
}
