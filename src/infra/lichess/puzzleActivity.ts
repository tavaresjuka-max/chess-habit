import type { TrainingResult } from '../../domain';

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

  const fetcher = options.fetcher ?? fetch;
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

function parseJsonLineOrUndefined(line: string): unknown {
  try {
    return JSON.parse(line) as unknown;
  } catch {
    return undefined;
  }
}

function puzzleActivityUrl(options: FetchPuzzleActivityOptions): string {
  const params = new URLSearchParams({
    since: String(Date.parse(options.since)),
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
