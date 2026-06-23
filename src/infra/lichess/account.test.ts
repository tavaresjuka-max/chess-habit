import { describe, expect, it, vi } from 'vitest';
import { LichessRateLimitError } from './puzzleActivity';
import { fetchLichessAccount, parseLichessAccount } from './account';

describe('parseLichessAccount', () => {
  it('parses id, username and the supported perfs (rating/games/provisional)', () => {
    const summary = parseLichessAccount({
      id: 'jukatavares',
      username: 'jukatavares',
      perfs: {
        puzzle: { rating: 1500, games: 99, prov: false },
        rapid: { rating: 1422, games: 40, prov: false },
        blitz: { rating: 1700, games: 30, prov: true },
        classical: { rating: 1800, games: 10 },
      },
      profile: { bio: 'ignored' },
    });

    expect(summary).toEqual({
      id: 'jukatavares',
      username: 'jukatavares',
      puzzle: { rating: 1500, games: 99, provisional: false },
      rapid: { rating: 1422, games: 40, provisional: false },
      blitz: { rating: 1700, games: 30, provisional: true },
      classical: { rating: 1800, games: 10, provisional: false },
    });
  });

  it('omits perfs that are malformed and keeps the valid ones', () => {
    const summary = parseLichessAccount({
      id: 'abc',
      username: 'abc',
      perfs: {
        rapid: { rating: 'oops', games: 1 },
        blitz: { rating: 1700, games: 30 },
      },
    });

    expect(summary).toEqual({
      id: 'abc',
      username: 'abc',
      blitz: { rating: 1700, games: 30, provisional: false },
    });
  });

  it('rejects invalid account roots', () => {
    expect(parseLichessAccount({ id: 1, username: 'abc' })).toBeUndefined();
    expect(parseLichessAccount({ id: 'abc' })).toBeUndefined();
    expect(parseLichessAccount('not-an-object')).toBeUndefined();
    expect(parseLichessAccount(null)).toBeUndefined();
  });

  it('survives a missing perfs object', () => {
    expect(parseLichessAccount({ id: 'abc', username: 'abc' })).toEqual({
      id: 'abc',
      username: 'abc',
    });
  });
});

describe('fetchLichessAccount', () => {
  it('throws when the token is empty', async () => {
    await expect(fetchLichessAccount({ token: '   ' })).rejects.toThrow(/Token Lichess/);
  });

  it('requests /api/account with Bearer + Accept and returns the parsed summary', async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            id: 'jukatavares',
            username: 'jukatavares',
            perfs: { rapid: { rating: 1500, games: 40, prov: false } },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );

    const summary = await fetchLichessAccount({ token: 'tok-123', fetcher });

    expect(fetcher).toHaveBeenCalledWith(
      'https://lichess.org/api/account',
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer tok-123',
        },
      }),
    );
    expect(summary?.rapid).toEqual({ rating: 1500, games: 40, provisional: false });
  });

  it('maps HTTP 429 to LichessRateLimitError', async () => {
    const fetcher = vi.fn(() => Promise.resolve(new Response('', { status: 429 })));

    await expect(fetchLichessAccount({ token: 'tok', fetcher })).rejects.toBeInstanceOf(
      LichessRateLimitError,
    );
  });

  it('throws on other non-ok responses', async () => {
    const fetcher = vi.fn(() => Promise.resolve(new Response('', { status: 401 })));

    await expect(fetchLichessAccount({ token: 'tok', fetcher })).rejects.toThrow(/401/);
  });

  it('trims the token before sending', async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ id: 'abc', username: 'abc' }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );

    await fetchLichessAccount({ token: '  tok  ', fetcher });

    expect(fetcher).toHaveBeenCalledWith(
      'https://lichess.org/api/account',
      expect.objectContaining({
        headers: { Accept: 'application/json', Authorization: 'Bearer tok' },
      }),
    );
  });
});
