import type { TrainingResult } from '../../domain';
import { lichessFetch } from '../http/providerQueue';
import { parseJsonLineOrUndefined } from '../utils/ndjson';
import { isRecord } from '../utils/typeGuards';

export type LichessPuzzleActivity = {
  date: number;
  win: boolean;
  puzzle: {
    id: string;
    rating: number;
    themes: string[];
  };
};

export type FetchPuzzleActivityOptions = {
  token: string;
  since: string;
  until: string;
  max?: number;
  fetcher?: typeof fetch;
};

const lichessBaseUrl = 'https://lichess.org';

export class LichessRateLimitError extends Error {
  readonly retryAfterMs = 60_000;

  constructor() {
    super('Lichess limitou as requisições agora. Espere pelo menos 1 minuto antes de tentar de novo.');
    this.name = 'LichessRateLimitError';
  }
}

export async function fetchPuzzleActivity(options: FetchPuzzleActivityOptions): Promise<LichessPuzzleActivity[]> {
  const token = options.token.trim();

  if (token === '') {
    throw new Error('Token Lichess ausente para ler atividade de puzzles.');
  }

  const fetcher = options.fetcher ?? lichessFetch;
  const url = puzzleActivityUrl(options);
  const response = await fetcher(url, {
    headers: {
      Accept: 'application/x-ndjson',
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 429) {
    throw new LichessRateLimitError();
  }

  if (!response.ok) {
    throw new Error(`Lichess respondeu HTTP ${String(response.status)}.`);
  }

  return parsePuzzleActivityNdjson(await response.text()).filter((activity) => {
    const sinceMs = Date.parse(options.since);
    const untilMs = Date.parse(options.until);
    return activity.date >= sinceMs && activity.date <= untilMs;
  });
}

/**
 * Estima o tempo ATIVO de treino a partir dos timestamps (ms) dos puzzles.
 * O Lichess não expõe tempo por puzzle, então somamos só os intervalos curtos
 * entre puzzles consecutivos (pausas longas = distração/fora do app não contam),
 * com um piso por puzzle e um teto. Estimativa honesta, não relógio de parede.
 */
export function estimateActiveSeconds(
  timestampsMs: readonly number[],
  options: { maxGapSeconds?: number; perPuzzleFloorSeconds?: number; capSeconds?: number } = {},
): number {
  const maxGapMs = (options.maxGapSeconds ?? 180) * 1000;
  const floorPerPuzzle = options.perPuzzleFloorSeconds ?? 8;
  const cap = options.capSeconds;

  const sorted = timestampsMs.filter((value) => Number.isFinite(value)).sort((left, right) => left - right);

  if (sorted.length === 0) {
    return 0;
  }

  let activeMs = 0;
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];

    if (previous === undefined || current === undefined) {
      continue;
    }

    const gap = current - previous;
    if (gap > 0 && gap <= maxGapMs) {
      activeMs += gap;
    }
  }

  const seconds = Math.round(Math.max(activeMs / 1000, sorted.length * floorPerPuzzle));
  return cap === undefined ? seconds : Math.min(seconds, cap);
}

export function summarizePuzzleActivity(input: {
  activities: LichessPuzzleActivity[];
  fetchedAt: string;
  since: string;
  until: string;
}): TrainingResult {
  const wins = input.activities.filter((activity) => activity.win).length;
  const themes = [...new Set(input.activities.flatMap((activity) => activity.puzzle.themes))].sort();

  return {
    source: 'lichess',
    kind: 'puzzle-activity',
    fetchedAt: input.fetchedAt,
    since: input.since,
    until: input.until,
    puzzles: input.activities.length,
    wins,
    losses: input.activities.length - wins,
    themes,
    themeStats: summarizeThemeStats(input.activities),
    activeSeconds: estimateActiveSeconds(
      input.activities.map((activity) => activity.date),
      { capSeconds: 3600 },
    ),
  };
}

function summarizeThemeStats(activities: LichessPuzzleActivity[]): TrainingResult['themeStats'] {
  const byTheme = new Map<string, { theme: string; attempts: number; losses: number }>();

  for (const activity of activities) {
    for (const theme of activity.puzzle.themes) {
      const current = byTheme.get(theme) ?? { theme, attempts: 0, losses: 0 };

      byTheme.set(theme, {
        theme,
        attempts: current.attempts + 1,
        losses: current.losses + (activity.win ? 0 : 1),
      });
    }
  }

  return [...byTheme.values()].sort(
    (left, right) => right.losses - left.losses || right.attempts - left.attempts || left.theme.localeCompare(right.theme),
  );
}

export function parsePuzzleActivityNdjson(ndjson: string): LichessPuzzleActivity[] {
  return ndjson
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map(parseJsonLineOrUndefined)
    .filter(isPuzzleActivity);
}

function puzzleActivityUrl(options: FetchPuzzleActivityOptions): string {
  const params = new URLSearchParams({
    before: String(Date.parse(options.until)),
  });

  if (options.max !== undefined) {
    params.set('max', String(options.max));
  }

  return `${lichessBaseUrl}/api/puzzle/activity?${params.toString()}`;
}

function isPuzzleActivity(value: unknown): value is LichessPuzzleActivity {
  if (!isRecord(value)) {
    return false;
  }

  const puzzle = value.puzzle;

  return (
    typeof value.date === 'number' &&
    typeof value.win === 'boolean' &&
    isRecord(puzzle) &&
    typeof puzzle.id === 'string' &&
    typeof puzzle.rating === 'number' &&
    Array.isArray(puzzle.themes) &&
    puzzle.themes.every((theme) => typeof theme === 'string')
  );
}

