import {
  createId,
  reconcileTrainingLogResult,
  type TrainingLog,
  type TrainingResult,
  type WeaknessTag,
} from '../domain';
import { createPendingItemFromFeedback } from '../domain/method/pendingItems';
import type { MethodTrackId, PendingTrainingItem } from '../domain/method/types';
import { loadLichessOAuthToken } from '../infra/storage/appData';
import { fetchPuzzleActivity, LichessRateLimitError, summarizePuzzleActivity } from '../infra/lichess/puzzleActivity';
import {
  fetchPuzzleDashboard,
  fetchPuzzleReplay,
  summarizePuzzleDashboard,
  summarizePuzzleReplay,
} from '../infra/lichess/puzzleDashboard';

export type ReconcileOutcome = { log: TrainingLog; warning?: string };

export async function suggestPendingFromHardFeedback(
  log: TrainingLog,
  weaknessTag: WeaknessTag,
  methodTrackId: MethodTrackId,
  lichessTheme?: string,
): Promise<PendingTrainingItem> {
  await Promise.resolve();

  return createPendingItemFromFeedback(log, weaknessTag, methodTrackId, lichessTheme);
}

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
    return { log, warning: 'Treino salvo. Não consegui conferir o resultado dos puzzles no Lichess agora.' };
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
    title: 'Diagnóstico de puzzles Lichess',
    label: 'Lichess Puzzle Dashboard',
    result: dashboardResult,
  });
  const replayLog = await createReplayLogIfPossible(token, dashboardResult, fetchedAt);

  return replayLog === undefined ? [...reconciledLogs, dashboardLog] : [...reconciledLogs, dashboardLog, replayLog];
}

// Importacao de atividade livre (Corte 6, item 10 da visao do dono): puzzles
// feitos por conta propria no Lichess viram credito honesto no historico.
// Regras explicitas (caveats DeepSeek): janela de 48h ou desde a ultima
// importacao; puzzles dentro de janelas de blocos planejados NAO contam de
// novo; nenhum tempo de treino e inventado (plannedSeconds/elapsedSeconds 0).
export const freeActivityBlockId = 'atividade-livre';

const freeActivityWindowMs = 48 * 60 * 60 * 1000;

export type FreeActivityImportOutcome = { log?: TrainingLog; message: string };

export async function importFreeActivity(input: {
  token: string;
  existingLogs: TrainingLog[];
  today: string;
  nowIso?: string;
  fetcher?: typeof fetch;
}): Promise<FreeActivityImportOutcome> {
  const now = input.nowIso ?? new Date().toISOString();
  const defaultSince = new Date(Date.parse(now) - freeActivityWindowMs).toISOString();
  const lastImportUntil = input.existingLogs
    .filter((log) => log.blockId === freeActivityBlockId)
    .map((log) => log.result?.until)
    .filter((until): until is string => until !== undefined)
    .sort()
    .at(-1);
  const since = lastImportUntil !== undefined && lastImportUntil > defaultSince ? lastImportUntil : defaultSince;

  const activities = await fetchPuzzleActivity({
    token: input.token,
    since,
    until: now,
    max: 200,
    ...(input.fetcher === undefined ? {} : { fetcher: input.fetcher }),
  });

  const blockWindows = input.existingLogs
    .filter((log) => log.blockId !== freeActivityBlockId && log.plannedSeconds > 0)
    .map((log) => ({
      start: Date.parse(log.startedAt),
      end: Date.parse(log.completedAt ?? log.updatedAt),
    }))
    .filter((window) => !Number.isNaN(window.start) && !Number.isNaN(window.end));

  const freeActivities = activities.filter(
    (activity) => !blockWindows.some((window) => activity.date >= window.start && activity.date <= window.end),
  );

  if (freeActivities.length === 0) {
    return {
      message: 'Nenhum puzzle novo fora dos treinos planejados desde a última importação.',
    };
  }

  const result = summarizePuzzleActivity({
    activities: freeActivities,
    fetchedAt: now,
    since,
    until: now,
  });

  const log: TrainingLog = {
    id: `${input.today}:${freeActivityBlockId}-${createId()}`,
    date: input.today,
    blockId: freeActivityBlockId,
    blockTitle: 'Atividade livre (puzzles)',
    source: 'lichess',
    destinationLabel: 'Puzzles Lichess (atividade livre)',
    plannedSeconds: 0,
    startedAt: since,
    completedAt: now,
    elapsedSeconds: 0,
    timeLimitReached: false,
    status: 'done',
    result,
    updatedAt: now,
  };

  return {
    log,
    message: `Atividade livre importada: ${String(result.wins)} certos e ${String(result.losses)} errados em ${String(result.puzzles)} puzzles feitos por conta própria.`,
  };
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
  return (
    log.destinationLabel.includes('Puzzles') ||
    log.destinationLabel.includes('Puzzle') ||
    log.destinationLabel.startsWith('Pendência Lichess:')
  );
}

export async function createReplayLogIfPossible(
  token: string,
  dashboardResult: Extract<TrainingResult, { kind: 'puzzle-dashboard' }>,
  fetchedAt: string,
  fetcher?: typeof fetch,
): Promise<TrainingLog | undefined> {
  const theme = dashboardResult.weakThemes[0];

  if (theme === undefined) {
    return undefined;
  }

  try {
    const replay = await fetchPuzzleReplay({ token, days: dashboardResult.days, theme, fetcher });

    if (replay.remainingCount === 0) {
      return undefined;
    }

    return createDiagnosticLog({
      id: `lichess-puzzle-replay-${theme}`,
      title: `Replay de puzzles: ${theme}`,
      label: `Lichess Puzzle Replay: ${theme}`,
      result: summarizePuzzleReplay({ replay, fetchedAt }),
    });
  } catch (error) {
    // 429 precisa propagar para ativar o cooldown da fila (invariante do Corte C).
    // Demais erros de replay continuam com fallback silencioso (diagnóstico opcional).
    if (error instanceof LichessRateLimitError) {
      throw error;
    }
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
