import {
  reconcileTrainingLogResult,
  type TrainingLog,
} from '../domain';
import { loadLichessOAuthToken } from '../infra/storage/appData';
import { fetchPuzzleActivity, summarizePuzzleActivity } from '../infra/lichess/puzzleActivity';

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
