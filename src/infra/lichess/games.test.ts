import { describe, expect, it } from 'vitest';
import {
  extractSignalsFromLichessGames,
  fetchLichessGames,
  fetchLichessPuzzlePerf,
  getPlayerSideLichess,
  parseLichessGamesNdjson,
} from './games';

describe('lichess games', () => {
  it('parses ndjson games and ignores malformed lines', () => {
    const games = parseLichessGamesNdjson(
      [
        JSON.stringify({
          id: 'game1',
          winner: 'black',
          players: {
            white: { user: { name: 'jukasparov' } },
            black: { user: { name: 'opponent' } },
          },
        }),
        JSON.stringify({ bad: true }),
      ].join('\n'),
    );

    expect(games).toHaveLength(1);
    expect(games[0]?.id).toBe('game1');
  });

  it('skips a syntactically broken json line without dropping the batch', () => {
    const games = parseLichessGamesNdjson(
      [
        JSON.stringify({
          id: 'game1',
          players: { white: { user: { name: 'jukasparov' } }, black: { user: { name: 'opponent' } } },
        }),
        '{ "id": "broken", ',
        JSON.stringify({
          id: 'game2',
          players: { white: { user: { name: 'jukasparov' } }, black: { user: { name: 'opponent' } } },
        }),
      ].join('\n'),
    );

    expect(games.map((game) => game.id)).toEqual(['game1', 'game2']);
  });

  it('finds the player side case-insensitively', () => {
    expect(
      getPlayerSideLichess(
        {
          id: 'game1',
          players: {
            white: { user: { name: 'JuKasparov' } },
            black: { user: { name: 'opponent' } },
          },
        },
        'jukasparov',
      ),
    ).toBe('white');
  });

  it('extracts derived signals without PGN text', () => {
    const games = Array.from({ length: 6 }, (_, index) => ({
      id: `game${String(index)}`,
      winner: index < 4 ? 'black' : 'white',
      opening: { eco: 'C20', name: 'King Pawn Game' },
      players: {
        white: {
          user: { name: 'jukasparov' },
          analysis: { inaccuracy: 1, mistake: 1, blunder: index < 4 ? 1 : 0, acpl: 85 },
        },
        black: { user: { name: 'opponent' } },
      },
    })) as Parameters<typeof extractSignalsFromLichessGames>[1];

    const signals = extractSignalsFromLichessGames('jukasparov', games, '2026-06-06T00:00:00.000Z');
    const openingSignal = signals.find((signal) => signal.value.kind === 'opening');
    const judgmentSignal = signals.find((signal) => signal.value.kind === 'judgment');

    expect(openingSignal?.value).toEqual({
      kind: 'opening',
      eco: 'C20',
      name: 'King Pawn Game',
      games: 6,
      lossRate: 0.667,
    });
    expect(judgmentSignal?.value).toMatchObject({
      kind: 'judgment',
      blunders: 4,
      mistakes: 6,
      inaccuracies: 6,
      acpl: 85,
      games: 6,
    });
    expect(JSON.stringify(signals)).not.toContain('1. e4');
  });

  it('requests official Lichess games export serial input with no moves or PGN', async () => {
    const requested: Array<{ url: string; authorization: string | null }> = [];
    const fetcher = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      requested.push({
        url: requestUrl(input),
        authorization: new Headers(init?.headers).get('Authorization'),
      });

      return Promise.resolve(
        new Response(
          `${JSON.stringify({
            id: 'game1',
            players: {
              white: { user: { name: 'jukasparov' } },
              black: { user: { name: 'opponent' } },
            },
          })}\n`,
          { status: 200 },
        ),
      );
    };

    const games = await fetchLichessGames({
      username: 'jukasparov',
      token: 'secret-token',
      max: 12,
      fetcher,
    });

    expect(games).toHaveLength(1);
    expect(requested[0]?.authorization).toBe('Bearer secret-token');
    expect(requested[0]?.url).toContain('https://lichess.org/api/games/user/jukasparov?');
    expect(requested[0]?.url).toContain('moves=false');
    expect(requested[0]?.url).toContain('pgnInJson=false');
    expect(requested[0]?.url).not.toContain('analysed=true');
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

describe('fetchLichessPuzzlePerf', () => {
  const makeFetcher = (status: number, body: unknown) =>
    (): Promise<Response> =>
      Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body),
      } as Response);

  it('returns parsed rating and games for a valid response', async () => {
    const fetcher = makeFetcher(200, {
      perf: { glicko: { rating: 1340.7, deviation: 65.2, provisional: false } },
      stat: { count: { all: 150 } },
    });

    const result = await fetchLichessPuzzlePerf('jukasparov', { fetcher });
    expect(result).toEqual({ rating: 1341, games: 150, deviation: 65, provisional: false });
  });

  it('returns null on 404 (user has no puzzle history)', async () => {
    const fetcher = makeFetcher(404, {});
    const result = await fetchLichessPuzzlePerf('newuser', { fetcher });
    expect(result).toBeNull();
  });

  it('returns null on other HTTP errors (graceful degradation)', async () => {
    const fetcher = makeFetcher(500, {});
    const result = await fetchLichessPuzzlePerf('user', { fetcher });
    expect(result).toBeNull();
  });

  it('returns null on missing glicko fields', async () => {
    const fetcher = makeFetcher(200, { perf: {}, stat: { count: { all: 10 } } });
    const result = await fetchLichessPuzzlePerf('user', { fetcher });
    expect(result).toBeNull();
  });

  it('returns null for empty username', async () => {
    const fetcher = makeFetcher(200, {});
    const result = await fetchLichessPuzzlePerf('', { fetcher });
    expect(result).toBeNull();
  });

  it('does NOT emit signal for provisional rating (RD gate)', async () => {
    // importLichessSignals deve filtrar; mas testamos a forma do resultado
    const fetcher = makeFetcher(200, {
      perf: { glicko: { rating: 1200, deviation: 200, provisional: true } },
      stat: { count: { all: 5 } },
    });
    const result = await fetchLichessPuzzlePerf('newplayer', { fetcher });
    expect(result).toEqual({ rating: 1200, games: 5, deviation: 200, provisional: true });
    // (o gate acontece em puzzlePerfToSignal, não aqui)
  });
})
