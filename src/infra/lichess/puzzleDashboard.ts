import type { PuzzleDashboardTrainingResult, PuzzleReplaySummaryTrainingResult, PuzzleThemeStat } from '../../domain/types';
import { lichessFetch } from '../http/providerQueue';
import { LichessRateLimitError } from './puzzleActivity';

export type LichessPuzzlePerformance = {
  nb: number;
  firstWins: number;
  replayWins: number;
  puzzleRatingAvg?: number;
  performance?: number;
};

export type LichessPuzzleDashboard = {
  days: number;
  global: LichessPuzzlePerformance;
  themes: Record<string, { theme: string; results: LichessPuzzlePerformance }>;
};

export type LichessPuzzleReplaySummary = {
  days: number;
  theme: string;
  nb: number;
  remainingCount: number;
};

export type FetchPuzzleDashboardOptions = {
  token: string;
  days: number;
  fetcher?: typeof fetch;
};

export type FetchPuzzleReplayOptions = {
  token: string;
  days: number;
  theme: string;
  fetcher?: typeof fetch;
};

const lichessBaseUrl = 'https://lichess.org';

export async function fetchPuzzleDashboard(options: FetchPuzzleDashboardOptions): Promise<LichessPuzzleDashboard> {
  const token = options.token.trim();

  if (token === '') {
    throw new Error('Token Lichess ausente para ler o dashboard de puzzles.');
  }

  const response = await (options.fetcher ?? lichessFetch)(`${lichessBaseUrl}/api/puzzle/dashboard/${String(options.days)}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 429) {
    throw new LichessRateLimitError();
  }

  if (!response.ok) {
    throw new Error(`Lichess respondeu HTTP ${String(response.status)}.`);
  }

  const dashboard = parsePuzzleDashboard(await response.json());

  if (dashboard === undefined) {
    throw new Error('Dashboard de puzzles Lichess veio em formato inesperado.');
  }

  return dashboard;
}

export async function fetchPuzzleReplay(options: FetchPuzzleReplayOptions): Promise<LichessPuzzleReplaySummary> {
  const token = options.token.trim();

  if (token === '') {
    throw new Error('Token Lichess ausente para ler replay de puzzles.');
  }

  const encodedTheme = encodeURIComponent(options.theme);
  const response = await (options.fetcher ?? lichessFetch)(
    `${lichessBaseUrl}/api/puzzle/replay/${String(options.days)}/${encodedTheme}`,
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (response.status === 429) {
    throw new LichessRateLimitError();
  }

  if (response.status === 404) {
    return {
      days: options.days,
      theme: options.theme,
      nb: 0,
      remainingCount: 0,
    };
  }

  if (!response.ok) {
    throw new Error(`Lichess respondeu HTTP ${String(response.status)}.`);
  }

  const replay = parsePuzzleReplaySummary(await response.json());

  if (replay === undefined) {
    throw new Error('Replay de puzzles Lichess veio em formato inesperado.');
  }

  return replay;
}

export function parsePuzzleDashboard(value: unknown): LichessPuzzleDashboard | undefined {
  if (!isRecord(value) || !isInteger(value.days) || !isRecord(value.themes)) {
    return undefined;
  }

  const global = parsePuzzlePerformance(value.global);

  if (global === undefined) {
    return undefined;
  }

  const themes: LichessPuzzleDashboard['themes'] = {};

  for (const [slug, themeValue] of Object.entries(value.themes)) {
    if (!isRecord(themeValue) || typeof themeValue.theme !== 'string') {
      continue;
    }

    const results = parsePuzzlePerformance(themeValue.results);

    if (results === undefined) {
      continue;
    }

    themes[slug] = {
      theme: themeValue.theme,
      results,
    };
  }

  return {
    days: value.days,
    global,
    themes,
  };
}

export function parsePuzzleReplaySummary(value: unknown): LichessPuzzleReplaySummary | undefined {
  if (!isRecord(value) || !isRecord(value.replay)) {
    return undefined;
  }

  const replay = value.replay;

  if (
    !isInteger(replay.days) ||
    typeof replay.theme !== 'string' ||
    !isInteger(replay.nb) ||
    !Array.isArray(replay.remaining)
  ) {
    return undefined;
  }

  return {
    days: replay.days,
    theme: replay.theme,
    nb: replay.nb,
    remainingCount: replay.remaining.filter((item) => typeof item === 'string').length,
  };
}

export function summarizePuzzleDashboard(input: {
  dashboard: LichessPuzzleDashboard;
  fetchedAt: string;
}): PuzzleDashboardTrainingResult {
  const until = input.fetchedAt;
  const since = isoDaysBefore(until, input.dashboard.days);
  const themeStats = Object.entries(input.dashboard.themes)
    .map(([theme, value]) => performanceToThemeStat(theme, value.results))
    .sort(compareThemeStats);
  const wins = input.dashboard.global.firstWins;
  const losses = Math.max(0, input.dashboard.global.nb - wins);

  return {
    source: 'lichess',
    kind: 'puzzle-dashboard',
    fetchedAt: input.fetchedAt,
    since,
    until,
    days: input.dashboard.days,
    puzzles: input.dashboard.global.nb,
    wins,
    losses,
    themes: themeStats.map((stat) => stat.theme).sort(),
    themeStats,
    weakThemes: themeStats.filter(hasRecentLoss).sort(compareWeakThemes).map((stat) => stat.theme).slice(0, 5),
    strongThemes: themeStats.filter(isStrongTheme).sort(compareStrongThemes).map((stat) => stat.theme).slice(0, 5),
    ...(input.dashboard.global.puzzleRatingAvg === undefined
      ? {}
      : { averageRating: input.dashboard.global.puzzleRatingAvg }),
    ...(input.dashboard.global.performance === undefined ? {} : { performance: input.dashboard.global.performance }),
    ...(input.dashboard.global.nb === 0 ? {} : { accuracy: wins / input.dashboard.global.nb }),
  };
}

export function summarizePuzzleReplay(input: {
  replay: LichessPuzzleReplaySummary;
  fetchedAt: string;
}): PuzzleReplaySummaryTrainingResult {
  const until = input.fetchedAt;
  const since = isoDaysBefore(until, input.replay.days);
  const wins = Math.max(0, input.replay.nb - input.replay.remainingCount);

  return {
    source: 'lichess',
    kind: 'puzzle-replay-summary',
    fetchedAt: input.fetchedAt,
    since,
    until,
    days: input.replay.days,
    theme: input.replay.theme,
    nb: input.replay.nb,
    remainingCount: input.replay.remainingCount,
    url: getPuzzleReplayDestinationUrl(input.replay.theme),
    puzzles: input.replay.nb,
    wins,
    losses: input.replay.remainingCount,
    themes: [input.replay.theme],
    themeStats: [
      {
        theme: input.replay.theme,
        attempts: input.replay.nb,
        losses: input.replay.remainingCount,
        ...(input.replay.nb === 0 ? {} : { accuracy: wins / input.replay.nb }),
      },
    ],
  };
}

export function getPuzzleReplayDestinationUrl(theme: string): string {
  return `${lichessBaseUrl}/training/${encodeURIComponent(theme)}`;
}

function parsePuzzlePerformance(value: unknown): LichessPuzzlePerformance | undefined {
  if (!isRecord(value) || !isInteger(value.nb)) {
    return undefined;
  }

  const firstWins = isInteger(value.firstWins) ? value.firstWins : 0;
  const replayWins = isInteger(value.replayWins) ? value.replayWins : 0;

  return {
    nb: value.nb,
    firstWins,
    replayWins,
    ...(typeof value.puzzleRatingAvg === 'number' ? { puzzleRatingAvg: value.puzzleRatingAvg } : {}),
    ...(typeof value.performance === 'number' ? { performance: value.performance } : {}),
  };
}

function performanceToThemeStat(theme: string, performance: LichessPuzzlePerformance): PuzzleThemeStat {
  const losses = Math.max(0, performance.nb - performance.firstWins);

  return {
    theme,
    attempts: performance.nb,
    losses,
    ...(performance.puzzleRatingAvg === undefined ? {} : { averageRating: performance.puzzleRatingAvg }),
    ...(performance.performance === undefined ? {} : { performance: performance.performance }),
    ...(performance.nb === 0 ? {} : { accuracy: performance.firstWins / performance.nb }),
  };
}

function compareThemeStats(left: PuzzleThemeStat, right: PuzzleThemeStat): number {
  return compareWeakThemes(left, right) || left.theme.localeCompare(right.theme);
}

function compareWeakThemes(left: PuzzleThemeStat, right: PuzzleThemeStat): number {
  return (
    lossRate(right) - lossRate(left) ||
    right.losses - left.losses ||
    right.attempts - left.attempts ||
    left.theme.localeCompare(right.theme)
  );
}

function compareStrongThemes(left: PuzzleThemeStat, right: PuzzleThemeStat): number {
  return (
    (right.accuracy ?? 0) - (left.accuracy ?? 0) ||
    right.attempts - left.attempts ||
    left.theme.localeCompare(right.theme)
  );
}

function hasRecentLoss(stat: PuzzleThemeStat): boolean {
  return stat.attempts > 0 && stat.losses > 0;
}

function isStrongTheme(stat: PuzzleThemeStat): boolean {
  return stat.attempts > 0 && stat.losses === 0;
}

function lossRate(stat: PuzzleThemeStat): number {
  return stat.attempts === 0 ? 0 : stat.losses / stat.attempts;
}

function isoDaysBefore(until: string, days: number): string {
  const parsed = Date.parse(until);

  if (Number.isNaN(parsed)) {
    return until;
  }

  return new Date(parsed - days * 24 * 60 * 60 * 1000).toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isInteger(value: unknown): value is number {
  return Number.isInteger(value);
}
