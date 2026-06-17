import { describe, expect, it } from 'vitest';
import {
  fetchPuzzleActivity,
  LichessRateLimitError,
  parsePuzzleActivityNdjson,
  summarizePuzzleActivity,
} from './puzzleActivity';

describe('parsePuzzleActivityNdjson', () => {
  it('parses valid puzzle activity lines and ignores malformed shapes', () => {
    const ndjson = [
      JSON.stringify({
        date: 1_780_000_000_000,
        win: true,
        puzzle: { id: 'abc12', rating: 1200, themes: ['fork', 'short'] },
      }),
      JSON.stringify({ bad: true }),
      '',
    ].join('\n');

    expect(parsePuzzleActivityNdjson(ndjson)).toEqual([
      {
        date: 1_780_000_000_000,
        win: true,
        puzzle: { id: 'abc12', rating: 1200, themes: ['fork', 'short'] },
      },
    ]);
  });

  it('skips a syntactically broken json line without dropping the batch', () => {
    const valid = {
      date: 1_780_000_000_000,
      win: false,
      puzzle: { id: 'zz999', rating: 1300, themes: ['mate'] },
    };
    const ndjson = [JSON.stringify(valid), '{ "date": 1, ', ''].join('\n');

    expect(parsePuzzleActivityNdjson(ndjson)).toEqual([valid]);
  });
});

describe('summarizePuzzleActivity', () => {
  it('summarizes count, wins, losses and themes', () => {
    const result = summarizePuzzleActivity({
      fetchedAt: '2026-06-06T10:10:00.000Z',
      since: '2026-06-06T10:00:00.000Z',
      until: '2026-06-06T10:10:00.000Z',
      activities: [
        { date: 1, win: true, puzzle: { id: 'one', rating: 1000, themes: ['fork'] } },
        { date: 2, win: false, puzzle: { id: 'two', rating: 1100, themes: ['fork', 'mate'] } },
      ],
    });

    expect(result).toEqual({
      source: 'lichess',
      kind: 'puzzle-activity',
      fetchedAt: '2026-06-06T10:10:00.000Z',
      since: '2026-06-06T10:00:00.000Z',
      until: '2026-06-06T10:10:00.000Z',
      puzzles: 2,
      wins: 1,
      losses: 1,
      themes: ['fork', 'mate'],
      themeStats: [
        { theme: 'fork', attempts: 2, losses: 1 },
        { theme: 'mate', attempts: 1, losses: 1 },
      ],
    });
  });
});

describe('fetchPuzzleActivity', () => {
  it('requests official Lichess puzzle activity with puzzle:read bearer token', async () => {
    const requested: Array<{ url: string; authorization: string | null }> = [];
    const fetcher = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      requested.push({
        url: requestUrl(input),
        authorization: new Headers(init?.headers).get('Authorization'),
      });

      return Promise.resolve(
        new Response(
          `${JSON.stringify({
            date: Date.parse('2026-06-06T10:05:00.000Z'),
            win: true,
            puzzle: { id: 'abc12', rating: 1200, themes: ['fork'] },
          })}\n`,
          { status: 200 },
        ),
      );
    };

    const activities = await fetchPuzzleActivity({
      token: 'secret-token',
      since: '2026-06-06T10:00:00.000Z',
      until: '2026-06-06T10:10:00.000Z',
      max: 20,
      fetcher,
    });

    expect(requested[0]?.url).toContain('https://lichess.org/api/puzzle/activity?');
    expect(requested[0]?.url).toContain('max=20');
    expect(requested[0]?.url).toContain(`before=${String(Date.parse('2026-06-06T10:10:00.000Z'))}`);
    expect(new URL(requested[0]?.url ?? '').searchParams.has('since')).toBe(false);
    expect(requested[0]?.authorization).toBe('Bearer secret-token');
    expect(activities).toHaveLength(1);
  });

  it('throws when the access token is blank', async () => {
    await expect(
      fetchPuzzleActivity({
        token: '   ',
        since: '2026-06-06T10:00:00.000Z',
        until: '2026-06-06T10:10:00.000Z',
      }),
    ).rejects.toThrow();
  });

  it('throws on unexpected HTTP error status codes', async () => {
    const fetcher = (): Promise<Response> =>
      Promise.resolve(new Response('Server Error', { status: 500 }));

    await expect(
      fetchPuzzleActivity({
        token: 'secret-token',
        since: '2026-06-06T10:00:00.000Z',
        until: '2026-06-06T10:10:00.000Z',
        fetcher,
      }),
    ).rejects.toThrow('500');
  });

  it('turns 429 into a Lichess rate-limit error', async () => {
    const fetcher = (): Promise<Response> => Promise.resolve(new Response('', { status: 429 }));

    await expect(
      fetchPuzzleActivity({
        token: 'secret-token',
        since: '2026-06-06T10:00:00.000Z',
        until: '2026-06-06T10:10:00.000Z',
        fetcher,
      }),
    ).rejects.toBeInstanceOf(LichessRateLimitError);
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
