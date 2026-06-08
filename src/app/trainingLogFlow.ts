import {
  reconcileTrainingLogResult,
  type TrainingLog,
  type TrainingResult,
} from '../domain';
import { loadLichessOAuthToken } from '../infra/storage/appData';
import { fetchPuzzleActivity, summarizePuzzleActivity } from '../infra/lichess/puzzleActivity';
import {
  fetchPuzzleDashboard,
  fetchPuzzleReplay,
  summarizePuzzleDashboard,
  summarizePuzzleReplay,
} from '../infra/lichess/puzzleDashboard';

export type ReconcileOutcome = { log: TrainingLog; warning?: string };

export async function reconcileLogIfPossible(log: TrainingLog): Promise<ReconcileOutcome> {
  if (!isPuzzleTrainingLog(log)) {
    return { log };
  }

  const token = await loadLichessOAuthToken();

  if (token === undefined) {
    return { log };
  }

  try {
    const until = log.completedAt ?? new Date().toISOString();
    const activities = await fetchPuzzleActivity({
      token: token.accessToken,
      since: log.startedAt,
      until,
      max: 50,
    });

    if (activities.length === 0) {
      return { log };
    }

    return {
      log: reconcileTrainingLogResult({
        log,
        result: summarizePuzzleActivity({
          activities,
          fetchedAt: new Date().toISOString(),
          since: log.startedAt,
          until,
        }),
      }),
    };
  } catch {
    // Antes engolia o erro: o treino era salvo como se o resultado tivesse sido
    // conferido. Agora o bloco e salvo, mas o usuario sabe que faltou conferir.
    return { log, warning: 'Treino salvo. Nao consegui conferir o resultado dos puzzles no Lichess agora.' };
  }
}

export async function reconcileLogsWithLichessPuzzleActivity(
  logs: TrainingLog[],
  token: string,
): Promise<TrainingLog[]> {
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

export async function reconcileLichessPuzzleDiagnostics(
  logs: TrainingLog[],
  token: string,
  fetchedAt = new Date().toISOString(),
): Promise<TrainingLog[]> {
  const reconciledLogs = await reconcileLogsWithLichessPuzzleActivity(logs, token);
  const dashboard = await fetchPuzzleDashboard({ token, days: 30 });
  const dashboardResult = summarizePuzzleDashboard({ dashboard, fetchedAt });
  const dashboardLog = createDiagnosticLog({
    id: 'lichess-puzzle-dashboard',
    title: 'Diagnostico de puzzles Lichess',
    label: 'Lichess Puzzle Dashboard',
    result: dashboardResult,
  });
  const replayLog = await createReplayLogIfPossible(token, dashboardResult, fetchedAt);

  return replayLog === undefined ? [...reconciledLogs, dashboardLog] : [...reconciledLogs, dashboardLog, replayLog];
}

export function mergeTrainingLogs(currentLogs: TrainingLog[], nextLogs: TrainingLog[]): TrainingLog[] {
  return nextLogs.reduce(upsertTrainingLog, currentLogs);
}

export function upsertTrainingLog(logs: TrainingLog[], nextLog: TrainingLog): TrainingLog[] {
  const existingIndex = logs.findIndex((log) => log.id === nextLog.id);

  if (existingIndex === -1) {
    return [...logs, nextLog];
  }

  return logs.map((log, index) => (index === existingIndex ? nextLog : log));
}

function isPuzzleTrainingLog(log: TrainingLog): boolean {
  return log.destinationLabel.includes('Puzzles') || log.destinationLabel.includes('Puzzle');
}

async function createReplayLogIfPossible(
  token: string,
  dashboardResult: Extract<TrainingResult, { kind: 'puzzle-dashboard' }>,
  fetchedAt: string,
): Promise<TrainingLog | undefined> {
  const theme = dashboardResult.weakThemes[0];

  if (theme === undefined) {
    return undefined;
  }

  try {
    const replay = await fetchPuzzleReplay({ token, days: dashboardResult.days, theme });

    if (replay.remainingCount === 0) {
      return undefined;
    }

    return createDiagnosticLog({
      id: `lichess-puzzle-replay-${theme}`,
      title: `Replay de puzzles: ${theme}`,
      label: `Lichess Puzzle Replay: ${theme}`,
      result: summarizePuzzleReplay({ replay, fetchedAt }),
    });
  } catch {
    return undefined;
  }
}

function createDiagnosticLog(input: {
  id: string;
  title: string;
  label: string;
  result: TrainingResult;
}): TrainingLog {
  return {
    id: `${input.result.until.slice(0, 10)}:${input.id}`,
    date: input.result.until.slice(0, 10),
    blockId: input.id,
    blockTitle: input.title,
    source: 'lichess',
    destinationLabel: input.label,
    plannedSeconds: 0,
    startedAt: input.result.fetchedAt,
    completedAt: input.result.fetchedAt,
    elapsedSeconds: 0,
    timeLimitReached: false,
    status: 'done',
    result: input.result,
    updatedAt: input.result.fetchedAt,
  };
}
