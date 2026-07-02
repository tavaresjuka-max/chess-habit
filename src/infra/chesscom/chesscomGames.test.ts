import { describe, expect, it, vi } from 'vitest';
import { fetchRecentChesscomGames } from './chesscomGames';

const now = new Date('2026-07-02T12:00:00.000Z');

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function chesscomGame(overrides: Partial<{
  end_time: number;
  white: { username: string; result: string };
  black: { username: string; result: string };
  pgn: string;
  url: string;
}> = {}) {
  return {
    end_time: 1_772_000_000,
    white: { username: 'jukatavares', result: 'win' },
    black: { username: 'opponent', result: 'checkmated' },
    pgn: '[Event "Live Chess"]\n\n1. e4 e5 0-1',
    url: 'https://www.chess.com/game/live/123',
    ...overrides,
  };
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

describe('fetchRecentChesscomGames', () => {
  it('busca o mês corrente e devolve ok com os jogos mapeados, mais recente primeiro', async () => {
    const requestedUrls: string[] = [];
    const fetcher = vi.fn<typeof fetch>((input) => {
      requestedUrls.push(requestUrl(input));
      return Promise.resolve(
        jsonResponse({
          games: [
            chesscomGame({ end_time: 100, url: 'https://www.chess.com/game/live/1' }),
            chesscomGame({ end_time: 200, url: 'https://www.chess.com/game/live/2' }),
          ],
        }),
      );
    });

    const result = await fetchRecentChesscomGames('jukatavares', { fetcher, now });

    expect(requestedUrls).toEqual(['https://api.chess.com/pub/player/jukatavares/games/2026/07']);
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.games).toHaveLength(2);
    expect(result.games[0]?.endTime).toBe(200);
    expect(result.games[1]?.endTime).toBe(100);
    expect(result.games[0]).toMatchObject({
      white: 'jukatavares',
      black: 'opponent',
      result: 'win',
      userColor: 'white',
    });
  });

  it('marca userColor como black quando o username pedido joga de pretas (case-insensitive)', async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        jsonResponse({
          games: [chesscomGame({ white: { username: 'someoneElse', result: 'win' }, black: { username: 'JukaTavares', result: 'checkmated' } })],
        }),
      ),
    );

    const result = await fetchRecentChesscomGames('jukatavares', { fetcher, now });

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.games[0]).toMatchObject({ userColor: 'black', result: 'checkmated' });
  });

  it('limita a 10 partidas mais recentes', async () => {
    const games = Array.from({ length: 15 }, (_unused, i) =>
      chesscomGame({ end_time: i, url: `https://www.chess.com/game/live/${String(i)}` }),
    );
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(jsonResponse({ games })));

    const result = await fetchRecentChesscomGames('jukatavares', { fetcher, now });

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.games).toHaveLength(10);
    expect(result.games[0]?.endTime).toBe(14);
  });

  it('ignora jogos sem pgn ou sem url', async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        jsonResponse({
          games: [
            chesscomGame({ pgn: '', url: 'https://www.chess.com/game/live/1' }),
            chesscomGame({ pgn: '1. e4 e5', url: '' }),
            chesscomGame({ end_time: 5 }),
          ],
        }),
      ),
    );

    const result = await fetchRecentChesscomGames('jukatavares', { fetcher, now });

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.games).toHaveLength(1);
    expect(result.games[0]?.endTime).toBe(5);
  });

  it('faz fallback para o mês anterior quando o mês corrente vem vazio', async () => {
    const requestedUrls: string[] = [];
    const fetcher = vi.fn<typeof fetch>((input) => {
      const url = requestUrl(input);
      requestedUrls.push(url);
      if (url.endsWith('2026/07')) {
        return Promise.resolve(jsonResponse({ games: [] }));
      }
      return Promise.resolve(jsonResponse({ games: [chesscomGame({ end_time: 42 })] }));
    });

    const result = await fetchRecentChesscomGames('jukatavares', { fetcher, now });

    expect(requestedUrls).toEqual([
      'https://api.chess.com/pub/player/jukatavares/games/2026/07',
      'https://api.chess.com/pub/player/jukatavares/games/2026/06',
    ]);
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.games[0]?.endTime).toBe(42);
  });

  it('atravessa a virada de ano ao buscar o mês anterior de janeiro', async () => {
    const requestedUrls: string[] = [];
    const fetcher = vi.fn<typeof fetch>((input) => {
      const url = requestUrl(input);
      requestedUrls.push(url);
      return Promise.resolve(jsonResponse({ games: [] }));
    });

    await fetchRecentChesscomGames('jukatavares', { fetcher, now: new Date('2026-01-15T00:00:00.000Z') });

    expect(requestedUrls).toEqual([
      'https://api.chess.com/pub/player/jukatavares/games/2026/01',
      'https://api.chess.com/pub/player/jukatavares/games/2025/12',
    ]);
  });

  it('devolve no-recent-games quando os 2 meses vêm vazios', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(jsonResponse({ games: [] })));

    const result = await fetchRecentChesscomGames('jukatavares', { fetcher, now });

    expect(result).toEqual({ kind: 'no-recent-games' });
  });

  it('devolve private-or-not-found em HTTP 404 sem tentar o mês anterior', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: 404 })));

    const result = await fetchRecentChesscomGames('jukatavares', { fetcher, now });

    expect(result).toEqual({ kind: 'private-or-not-found' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('devolve private-or-not-found em HTTP 403', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: 403 })));

    const result = await fetchRecentChesscomGames('jukatavares', { fetcher, now });

    expect(result).toEqual({ kind: 'private-or-not-found' });
  });

  it('devolve rate-limited em HTTP 429 sem tentar o mês anterior', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: 429 })));

    const result = await fetchRecentChesscomGames('jukatavares', { fetcher, now });

    expect(result).toEqual({ kind: 'rate-limited' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('devolve network-error quando o fetch rejeita', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.reject(new Error('boom')));

    const result = await fetchRecentChesscomGames('jukatavares', { fetcher, now });

    expect(result).toEqual({ kind: 'network-error' });
  });

  it('devolve network-error em HTTP 500', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: 500 })));

    const result = await fetchRecentChesscomGames('jukatavares', { fetcher, now });

    expect(result).toEqual({ kind: 'network-error' });
  });

  it('devolve network-error quando o corpo não tem games como array', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(jsonResponse({})));

    const result = await fetchRecentChesscomGames('jukatavares', { fetcher, now });

    expect(result).toEqual({ kind: 'network-error' });
  });

  it('usa o encodeURIComponent no username na URL', async () => {
    const requestedUrls: string[] = [];
    const fetcher = vi.fn<typeof fetch>((input) => {
      requestedUrls.push(requestUrl(input));
      return Promise.resolve(jsonResponse({ games: [] }));
    });

    await fetchRecentChesscomGames('user name', { fetcher, now });

    expect(requestedUrls[0]).toContain('user%20name');
  });
});
