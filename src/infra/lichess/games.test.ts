import { describe, expect, it } from 'vitest';
import {
  extractSignalsFromLichessGames,
  fetchLichessGames,
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
