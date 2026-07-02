import { describe, expect, it, vi } from 'vitest';
import { importPgnToLichess } from './importClient';

const samplePgn = '[Event "Live Chess"]\n\n1. e4 e5 2. Nf3 Nc6 1-0';

describe('importPgnToLichess', () => {
  it('faz POST form-urlencoded para /api/import e devolve ok com gameId e url', async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response(JSON.stringify({ id: 'nJQmQMRZ', url: 'https://lichess.org/nJQmQMRZ' }), { status: 200 })),
    );

    const result = await importPgnToLichess(samplePgn, { fetcher });

    expect(result).toEqual({ kind: 'ok', gameId: 'nJQmQMRZ', url: 'https://lichess.org/nJQmQMRZ' });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const call = fetcher.mock.calls[0];
    expect(call?.[0]).toBe('https://lichess.org/api/import');
    const init = call?.[1];
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/x-www-form-urlencoded' });
    const expectedBody = new URLSearchParams();
    expectedBody.set('pgn', samplePgn);
    expect(init?.body).toBe(expectedBody.toString());
  });

  it('devolve rate-limited em HTTP 429', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: 429 })));

    const result = await importPgnToLichess(samplePgn, { fetcher });

    expect(result).toEqual({ kind: 'rate-limited' });
  });

  it('devolve invalid-pgn em HTTP 400', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: 400 })));

    const result = await importPgnToLichess('pgn quebrado', { fetcher });

    expect(result).toEqual({ kind: 'invalid-pgn' });
  });

  it('devolve network-error em outro status não-ok (500)', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: 500 })));

    const result = await importPgnToLichess(samplePgn, { fetcher });

    expect(result).toEqual({ kind: 'network-error' });
  });

  it('devolve network-error quando o fetch rejeita', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.reject(new Error('boom')));

    const result = await importPgnToLichess(samplePgn, { fetcher });

    expect(result).toEqual({ kind: 'network-error' });
  });

  it('devolve network-error quando a resposta ok não tem id/url', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(new Response(JSON.stringify({}), { status: 200 })));

    const result = await importPgnToLichess(samplePgn, { fetcher });

    expect(result).toEqual({ kind: 'network-error' });
  });

  it('devolve network-error quando o corpo não é JSON válido', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(new Response('not json', { status: 200 })));

    const result = await importPgnToLichess(samplePgn, { fetcher });

    expect(result).toEqual({ kind: 'network-error' });
  });

  it('devolve network-error em timeout (AbortController)', async () => {
    vi.useFakeTimers();
    try {
      const fetcher = vi.fn<typeof fetch>((_input, init) => {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        });
      });

      const resultPromise = importPgnToLichess(samplePgn, { fetcher });
      await vi.advanceTimersByTimeAsync(10_000);
      const result = await resultPromise;

      expect(result).toEqual({ kind: 'network-error' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('usa lichessFetch como fetcher default quando nenhum é injetado', async () => {
    const originalFetch = globalThis.fetch;
    const fetchSpy = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response(JSON.stringify({ id: 'abcd1234', url: 'https://lichess.org/abcd1234' }), { status: 200 })),
    );
    globalThis.fetch = fetchSpy;
    try {
      const result = await importPgnToLichess(samplePgn);
      expect(result).toEqual({ kind: 'ok', gameId: 'abcd1234', url: 'https://lichess.org/abcd1234' });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
