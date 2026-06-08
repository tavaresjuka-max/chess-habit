import { describe, expect, it } from 'vitest';
import { LichessRateLimitError } from './puzzleActivity';
import {
  fetchPuzzleDashboard,
  fetchPuzzleReplay,
  parsePuzzleDashboard,
  parsePuzzleReplaySummary,
  summarizePuzzleDashboard,
  summarizePuzzleReplay,
} from './puzzleDashboard';

describe('parsePuzzleDashboard', () => {
  it('parses only days, global and themes from the official dashboard shape', () => {
    const dashboard = parsePuzzleDashboard({
      days: 30,
      global: { nb: 11, firstWins: 5, replayWins: 0, puzzleRatingAvg: 1495, performance: 1450 },
      themes: {
        fork: { theme: 'Fork', results: { nb: 4, firstWins: 2, replayWins: 0, puzzleRatingAvg: 1133 } },
        broken: { theme: 'Broken' },
      },
      ignored: { personal: 'not persisted' },
    });

    expect(dashboard).toEqual({
      days: 30,
      global: { nb: 11, firstWins: 5, replayWins: 0, puzzleRatingAvg: 1495, performance: 1450 },
      themes: {
        fork: { theme: 'Fork', results: { nb: 4, firstWins: 2, replayWins: 0, puzzleRatingAvg: 1133 } },
      },
    });
  });

  it('rejects invalid dashboard roots', () => {
    expect(parsePuzzleDashboard({ days: 30, global: {}, themes: {} })).toBeUndefined();
    expect(parsePuzzleDashboard({ days: '30', global: { nb: 1 }, themes: {} })).toBeUndefined();
  });
});

describe('summarizePuzzleDashboard', () => {
  it('turns the dashboard into aggregated theme signals', () => {
    const dashboard = parsePuzzleDashboard({
      days: 30,
      global: { nb: 6, firstWins: 3, replayWins: 0, puzzleRatingAvg: 1200, performance: 1150 },
      themes: {
        fork: { theme: 'Fork', results: { nb: 4, firstWins: 1, replayWins: 0, puzzleRatingAvg: 1100 } },
        pin: { theme: 'Pin', results: { nb: 2, firstWins: 2, replayWins: 0, puzzleRatingAvg: 1300 } },
      },
    });

    if (dashboard === undefined) {
      throw new Error('Expected dashboard fixture to parse.');
    }

    expect(summarizePuzzleDashboard({ dashboard, fetchedAt: '2026-06-08T12:00:00.000Z' })).toMatchObject({
      source: 'lichess',
      kind: 'puzzle-dashboard',
      days: 30,
      puzzles: 6,
      wins: 3,
      losses: 3,
      themes: ['fork', 'pin'],
      weakThemes: ['fork'],
      strongThemes: ['pin'],
      averageRating: 1200,
      performance: 1150,
      themeStats: [
        { theme: 'fork', attempts: 4, losses: 3, averageRating: 1100, accuracy: 0.25 },
        { theme: 'pin', attempts: 2, losses: 0, averageRating: 1300, accuracy: 1 },
      ],
    });
  });
});

describe('parsePuzzleReplaySummary', () => {
  it('keeps only replay counts and drops puzzle IDs', () => {
    const replay = parsePuzzleReplaySummary({
      replay: { days: 90, theme: 'fork', nb: 6, remaining: ['EUX2q', 'B2dps'] },
      angle: { key: 'fork', name: 'Fork', desc: 'not stored' },
    });

    expect(replay).toEqual({ days: 90, theme: 'fork', nb: 6, remainingCount: 2 });
    expect(JSON.stringify(replay)).not.toContain('EUX2q');
  });

  it('rejects invalid replay roots', () => {
    expect(parsePuzzleReplaySummary({ replay: { days: 30, theme: 'fork', nb: 2 } })).toBeUndefined();
  });
});

describe('summarizePuzzleReplay', () => {
  it('uses the public theme route as the safe replay destination fallback', () => {
    const result = summarizePuzzleReplay({
      replay: { days: 30, theme: 'fork', nb: 4, remainingCount: 3 },
      fetchedAt: '2026-06-08T12:00:00.000Z',
    });

    expect(result).toMatchObject({
      kind: 'puzzle-replay-summary',
      theme: 'fork',
      nb: 4,
      remainingCount: 3,
      url: 'https://lichess.org/training/fork',
      themeStats: [{ theme: 'fork', attempts: 4, losses: 3 }],
    });
  });
});

describe('fetchPuzzleDashboard and fetchPuzzleReplay', () => {
  it('requests dashboard with puzzle:read bearer token', async () => {
    const requested: Array<{ url: string; authorization: string | null; accept: string | null }> = [];
    const fetcher = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      requested.push({
        url: requestUrl(input),
        authorization: new Headers(init?.headers).get('Authorization'),
        accept: new Headers(init?.headers).get('Accept'),
      });

      return Promise.resolve(
        Response.json({
          days: 30,
          global: { nb: 1, firstWins: 1, replayWins: 0 },
          themes: {},
        }),
      );
    };

    await fetchPuzzleDashboard({ token: 'secret-token', days: 30, fetcher });

    expect(requested[0]).toEqual({
      url: 'https://lichess.org/api/puzzle/dashboard/30',
      authorization: 'Bearer secret-token',
      accept: 'application/json',
    });
  });

  it('requests replay and does not expose remaining puzzle IDs', async () => {
    const fetcher = (): Promise<Response> =>
      Promise.resolve(Response.json({ replay: { days: 30, theme: 'fork', nb: 2, remaining: ['abc12'] }, angle: {} }));

    const replay = await fetchPuzzleReplay({ token: 'secret-token', days: 30, theme: 'fork', fetcher });

    expect(replay).toEqual({ days: 30, theme: 'fork', nb: 2, remainingCount: 1 });
    expect(JSON.stringify(replay)).not.toContain('abc12');
  });

  it('turns 429 into the shared Lichess rate-limit error', async () => {
    const fetcher = (): Promise<Response> => Promise.resolve(new Response('', { status: 429 }));

    await expect(fetchPuzzleDashboard({ token: 'secret-token', days: 30, fetcher })).rejects.toBeInstanceOf(
      LichessRateLimitError,
    );
    await expect(fetchPuzzleReplay({ token: 'secret-token', days: 30, theme: 'fork', fetcher })).rejects.toBeInstanceOf(
      LichessRateLimitError,
    );
  });

  it('requires an OAuth token for OAuth endpoints', async () => {
    await expect(fetchPuzzleDashboard({ token: '   ', days: 30 })).rejects.toThrow(/Token Lichess ausente/);
    await expect(fetchPuzzleReplay({ token: '   ', days: 30, theme: 'fork' })).rejects.toThrow(/Token Lichess ausente/);
  });
});

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}
