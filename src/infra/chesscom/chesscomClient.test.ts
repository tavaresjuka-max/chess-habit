import { describe, expect, it } from 'vitest';
import type { Signal } from '../../domain';
import { ChesscomRateLimitError, importChesscomSignals, type ChesscomMonthCache } from './chesscomClient';

const observedAt = '2026-06-06T00:00:00.000Z';

describe('importChesscomSignals', () => {
  it('fetches Chess.com archives serially and caches only derived signals', async () => {
    const requestedUrls: string[] = [];
    const savedCaches: ChesscomMonthCache[] = [];
    const fetcher = (input: RequestInfo | URL): Promise<Response> => {
      const url = requestUrl(input);
      requestedUrls.push(url);

      if (url.endsWith('/stats')) {
        return Promise.resolve(jsonResponse({ chess_rapid: { last: { rating: 950 } } }));
      }

      if (url.endsWith('/games/archives')) {
        return Promise.resolve(jsonResponse({
          archives: [
            'https://api.chess.com/pub/player/jukatavares/games/2026/05',
            'https://api.chess.com/pub/player/jukatavares/games/2026/06',
          ],
        }));
      }

      return Promise.resolve(jsonResponse({
        games: [
          {
            white: { username: 'jukatavares', result: 'timeout' },
            black: { username: 'opponent', result: 'win' },
            pgn: '[Event "Live Chess"]\n\n1. e4 e5 0-1',
            rules: 'chess',
            time_class: 'rapid',
          },
        ],
      }));
    };

    const cache = {
      loadMonth: () => Promise.resolve(undefined),
      saveMonth: (record: ChesscomMonthCache) => {
        savedCaches.push(record);
        return Promise.resolve();
      },
    };

    const signals = await importChesscomSignals('jukatavares', { fetcher, cache, observedAt });

    expect(requestedUrls).toEqual([
      'https://api.chess.com/pub/player/jukatavares/stats',
      'https://api.chess.com/pub/player/jukatavares/games/archives',
      'https://api.chess.com/pub/player/jukatavares/games/2026/05',
      'https://api.chess.com/pub/player/jukatavares/games/2026/06',
    ]);
    expect(signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: { kind: 'rating', perf: 'rapid', rating: 950 },
        }),
      ]),
    );
    expect(JSON.stringify(savedCaches)).not.toContain('1. e4');
    expect(JSON.stringify(savedCaches)).not.toContain('[Event');
  });

  it('uses cached month signals without refetching that monthly archive', async () => {
    const cachedSignals: Signal[] = [
      {
        source: 'chesscom',
        confidence: 'medium',
        observedAt,
        value: { kind: 'clock', timeoutLosses: 2, games: 10 },
      },
    ];
    const requestedUrls: string[] = [];
    const fetcher = (input: RequestInfo | URL): Promise<Response> => {
      const url = requestUrl(input);
      requestedUrls.push(url);

      if (url.endsWith('/stats')) {
        return Promise.resolve(jsonResponse({}));
      }

      return Promise.resolve(jsonResponse({
        archives: ['https://api.chess.com/pub/player/jukatavares/games/2026/05'],
      }));
    };
    const cache = {
      loadMonth: () => Promise.resolve({
        id: 'cache',
        username: 'jukatavares',
        archiveUrl: 'https://api.chess.com/pub/player/jukatavares/games/2026/05',
        signals: cachedSignals,
        updatedAt: observedAt,
        expiresAt: '2026-06-07T00:00:00.000Z',
      }),
      saveMonth: () => Promise.resolve(),
    };

    const signals = await importChesscomSignals('jukatavares', { fetcher, cache, observedAt });

    expect(requestedUrls).toEqual([
      'https://api.chess.com/pub/player/jukatavares/stats',
      'https://api.chess.com/pub/player/jukatavares/games/archives',
    ]);
    expect(signals).toEqual(cachedSignals);
  });

  it('turns HTTP 429 into an explicit rate-limit error', async () => {
    const fetcher = (): Promise<Response> => Promise.resolve(new Response('{}', { status: 429 }));

    await expect(importChesscomSignals('jukatavares', { fetcher, observedAt })).rejects.toBeInstanceOf(
      ChesscomRateLimitError,
    );
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}
