import { describe, expect, it, vi } from 'vitest';
import { LichessRateLimitError } from './puzzleActivity';
import { fetchLichessRatingHistory } from './ratingHistoryClient';

// Helper no estilo de account.test.ts: constroi uma Response com status/ok/json.
function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('fetchLichessRatingHistory', () => {
  it('integra o parser E1a: resposta 200 válida vira série por categoria', async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(jsonResponse([{ name: 'Blitz', points: [[2024, 0, 15, 1532]] }], 200)),
    );

    const series = await fetchLichessRatingHistory('jukatavares', { fetcher });

    expect(series).toEqual([{ perf: 'blitz', points: [{ date: '2024-01-15', rating: 1532 }] }]);
  });

  it('retorna [] sem chamar o fetcher quando o username é vazio', async () => {
    const fetcher = vi.fn();

    await expect(fetchLichessRatingHistory('', { fetcher })).resolves.toEqual([]);
    await expect(fetchLichessRatingHistory('   ', { fetcher })).resolves.toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('mapeia HTTP 429 para LichessRateLimitError', async () => {
    const fetcher = vi.fn(() => Promise.resolve(new Response('', { status: 429 })));

    await expect(fetchLichessRatingHistory('jukatavares', { fetcher })).rejects.toBeInstanceOf(
      LichessRateLimitError,
    );
  });

  it('rejeita com Error cuja mensagem contém "HTTP 404" em status não-ok', async () => {
    const fetcher = vi.fn(() => Promise.resolve(new Response('', { status: 404 })));

    await expect(fetchLichessRatingHistory('nao-existe', { fetcher })).rejects.toThrow(/HTTP 404/);
  });

  it('aplica encodeURIComponent no username ao montar a URL', async () => {
    const fetcher = vi.fn(() => Promise.resolve(jsonResponse([], 200)));

    await fetchLichessRatingHistory('a b', { fetcher });

    expect(fetcher).toHaveBeenCalledWith(
      'https://lichess.org/api/user/a%20b/rating-history',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
  });

  it('retorna [] quando a resposta 200 vem com corpo vazio', async () => {
    const fetcher = vi.fn(() => Promise.resolve(jsonResponse([], 200)));

    await expect(fetchLichessRatingHistory('jukatavares', { fetcher })).resolves.toEqual([]);
  });
});
