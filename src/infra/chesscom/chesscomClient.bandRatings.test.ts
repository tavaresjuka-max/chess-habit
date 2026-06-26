import { describe, expect, it, vi } from 'vitest';
import { ChesscomRateLimitError, fetchChesscomGameRatings } from './chesscomClient';

// Fetcher mock compatível com fetchJson (que usa response.status / response.ok /
// response.json()). Reusamos Response real para casar com typeof fetch sem cast.
function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('fetchChesscomGameRatings', () => {
  it('marca como não-provisional quando a categoria soma >=10 jogos', async () => {
    const fetcher = () =>
      Promise.resolve(
        jsonResponse({
          chess_rapid: { last: { rating: 1500 }, record: { win: 6, loss: 3, draw: 1 } },
        }),
      );

    const input = await fetchChesscomGameRatings('jukatavares', { fetcher });

    expect(input).toEqual({ rapid: { rating: 1500, games: 10, provisional: false } });
  });

  it('marca como provisório quando a categoria soma <10 jogos', async () => {
    const fetcher = () =>
      Promise.resolve(
        jsonResponse({
          chess_rapid: { last: { rating: 1500 }, record: { win: 2, loss: 2, draw: 1 } },
        }),
      );

    const input = await fetchChesscomGameRatings('jukatavares', { fetcher });

    expect(input).toEqual({ rapid: { rating: 1500, games: 5, provisional: true } });
  });

  it('trata categoria sem record como 0 jogos (provisório)', async () => {
    const fetcher = () =>
      Promise.resolve(
        jsonResponse({
          chess_rapid: { last: { rating: 1500 } },
        }),
      );

    const input = await fetchChesscomGameRatings('jukatavares', { fetcher });

    expect(input).toEqual({ rapid: { rating: 1500, games: 0, provisional: true } });
  });

  it('inclui só categorias com last.rating (rapid ausente, blitz presente)', async () => {
    const fetcher = () =>
      Promise.resolve(
        jsonResponse({
          chess_blitz: { last: { rating: 1600 }, record: { win: 10, loss: 5, draw: 0 } },
        }),
      );

    const input = await fetchChesscomGameRatings('jukatavares', { fetcher });

    expect(input).toEqual({ blitz: { rating: 1600, games: 15, provisional: false } });
  });

  it('devolve objeto vazio quando nenhum last.rating está presente', async () => {
    const fetcher = () => Promise.resolve(jsonResponse({}));

    const input = await fetchChesscomGameRatings('jukatavares', { fetcher });

    expect(input).toEqual({});
  });

  it('rejeita com ChesscomRateLimitError em HTTP 429', async () => {
    const fetcher = () => Promise.resolve(new Response('{}', { status: 429 }));

    await expect(fetchChesscomGameRatings('jukatavares', { fetcher })).rejects.toBeInstanceOf(
      ChesscomRateLimitError,
    );
  });

  it('devolve {} sem chamar o fetcher quando o username é vazio', async () => {
    const fetcher = vi.fn<typeof fetch>();

    const input = await fetchChesscomGameRatings('   ', { fetcher });

    expect(input).toEqual({});
    expect(fetcher).not.toHaveBeenCalled();
  });
});
