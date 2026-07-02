import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearAutopsyCache, fetchGameForAutopsy, parseGameRef } from './autopsyClient';

describe('parseGameRef', () => {
  it('aceita id puro de 8 chars alfanuméricos', () => {
    expect(parseGameRef('abcd1234')).toBe('abcd1234');
    expect(parseGameRef('AbCd12EF')).toBe('AbCd12EF');
  });

  it('aceita URL completa https://lichess.org/{id}', () => {
    expect(parseGameRef('https://lichess.org/abcd1234')).toBe('abcd1234');
  });

  it('aceita URL sem protocolo', () => {
    expect(parseGameRef('lichess.org/abcd1234')).toBe('abcd1234');
  });

  it('aceita URL com www.', () => {
    expect(parseGameRef('https://www.lichess.org/abcd1234')).toBe('abcd1234');
  });

  it('aceita URL com sufixo de perspectiva /black ou /white', () => {
    expect(parseGameRef('https://lichess.org/abcd1234/black')).toBe('abcd1234');
    expect(parseGameRef('https://lichess.org/abcd1234/white')).toBe('abcd1234');
  });

  it('aceita URL com âncora de ply (#N)', () => {
    expect(parseGameRef('https://lichess.org/abcd1234#12')).toBe('abcd1234');
    expect(parseGameRef('https://lichess.org/abcd1234/black#12')).toBe('abcd1234');
  });

  it('aceita URL com query string', () => {
    expect(parseGameRef('https://lichess.org/abcd1234?any=1')).toBe('abcd1234');
  });

  it('aceita URL com âncora e query combinadas', () => {
    expect(parseGameRef('https://lichess.org/abcd1234/black?x=1#20')).toBe('abcd1234');
  });

  it('rejeita domínio que não é lichess.org', () => {
    expect(parseGameRef('https://chess.com/abcd1234')).toBeNull();
    expect(parseGameRef('https://notlichess.org/abcd1234')).toBeNull();
    expect(parseGameRef('https://evil-lichess.org/abcd1234')).toBeNull();
  });

  it('rejeita string vazia ou só espaços', () => {
    expect(parseGameRef('')).toBeNull();
    expect(parseGameRef('   ')).toBeNull();
  });

  it('rejeita id com tamanho errado', () => {
    expect(parseGameRef('abcd123')).toBeNull();
    expect(parseGameRef('abcd12345')).toBeNull();
  });

  it('rejeita id com caracteres inválidos', () => {
    expect(parseGameRef('abcd-234')).toBeNull();
    expect(parseGameRef('abcd 234')).toBeNull();
  });

  it('rejeita texto arbitrário não reconhecido', () => {
    expect(parseGameRef('não é um link nem um id')).toBeNull();
    expect(parseGameRef('https://lichess.org/')).toBeNull();
  });

  it('faz trim de espaços ao redor do input', () => {
    expect(parseGameRef('  abcd1234  ')).toBe('abcd1234');
    expect(parseGameRef('  https://lichess.org/abcd1234  ')).toBe('abcd1234');
  });
});

describe('fetchGameForAutopsy', () => {
  afterEach(() => {
    clearAutopsyCache();
    vi.restoreAllMocks();
  });

  it('devolve invalid-ref sem chamar fetch quando o gameRef não é reconhecido', async () => {
    const fetcher = vi.fn();

    const result = await fetchGameForAutopsy('não é um link nem um id', { fetcher });

    expect(result).toEqual({ kind: 'invalid-ref' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('devolve ok com o export JSON e faz a chamada certa (GET, Accept json, evals=true)', async () => {
    const exportJson = { id: 'abcd1234', moves: 'e4 e5', analysis: [{ eval: 20 }] };
    const fetcher = vi.fn<typeof fetch>(() => {
      return Promise.resolve(new Response(JSON.stringify(exportJson), { status: 200 }));
    });

    const result = await fetchGameForAutopsy('abcd1234', { fetcher });

    expect(result).toEqual({ kind: 'ok', exportJson, gameId: 'abcd1234' });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const call = fetcher.mock.calls[0];
    expect(call?.[0]).toBe('https://lichess.org/game/export/abcd1234?evals=true');
    expect(call?.[1]?.headers).toMatchObject({ Accept: 'application/json' });
  });

  it('aceita URL completa como gameRef', async () => {
    const exportJson = { id: 'abcd1234', moves: 'e4 e5', analysis: [{ eval: 20 }] };
    const fetcher = vi.fn(() => Promise.resolve(new Response(JSON.stringify(exportJson), { status: 200 })));

    const result = await fetchGameForAutopsy('https://lichess.org/abcd1234', { fetcher });

    expect(result).toEqual({ kind: 'ok', exportJson, gameId: 'abcd1234' });
  });

  it('devolve not-found em HTTP 404', async () => {
    const fetcher = vi.fn(() => Promise.resolve(new Response(null, { status: 404 })));

    const result = await fetchGameForAutopsy('abcd1234', { fetcher });

    expect(result).toEqual({ kind: 'not-found' });
  });

  it('devolve rate-limited em HTTP 429', async () => {
    const fetcher = vi.fn(() => Promise.resolve(new Response(null, { status: 429 })));

    const result = await fetchGameForAutopsy('abcd1234', { fetcher });

    expect(result).toEqual({ kind: 'rate-limited' });
  });

  it('devolve no-analysis com gameId quando a resposta é ok mas sem campo analysis', async () => {
    const exportJson = { id: 'abcd1234', moves: 'e4 e5' };
    const fetcher = vi.fn(() => Promise.resolve(new Response(JSON.stringify(exportJson), { status: 200 })));

    const result = await fetchGameForAutopsy('abcd1234', { fetcher });

    expect(result).toEqual({ kind: 'no-analysis', gameId: 'abcd1234' });
  });

  it('devolve network-error quando o fetch rejeita', async () => {
    const fetcher = vi.fn(() => Promise.reject(new Error('boom')));

    const result = await fetchGameForAutopsy('abcd1234', { fetcher });

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

      const resultPromise = fetchGameForAutopsy('abcd1234', { fetcher });
      await vi.advanceTimersByTimeAsync(10_000);

      const result = await resultPromise;
      expect(result).toEqual({ kind: 'network-error' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('devolve network-error em HTTP genérico não-ok (ex.: 500)', async () => {
    const fetcher = vi.fn(() => Promise.resolve(new Response(null, { status: 500 })));

    const result = await fetchGameForAutopsy('abcd1234', { fetcher });

    expect(result).toEqual({ kind: 'network-error' });
  });

  it('usa cache in-memory por gameId: segunda chamada não invoca fetch de novo', async () => {
    const exportJson = { id: 'abcd1234', moves: 'e4 e5', analysis: [{ eval: 20 }] };
    const fetcher = vi.fn(() => Promise.resolve(new Response(JSON.stringify(exportJson), { status: 200 })));

    const first = await fetchGameForAutopsy('abcd1234', { fetcher });
    const second = await fetchGameForAutopsy('abcd1234', { fetcher });

    expect(first).toEqual({ kind: 'ok', exportJson, gameId: 'abcd1234' });
    expect(second).toEqual({ kind: 'ok', exportJson, gameId: 'abcd1234' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('não guarda em cache respostas de erro (not-found não deve grudar)', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'abcd1234', moves: 'e4', analysis: [{ eval: 10 }] }), { status: 200 }),
      );

    const first = await fetchGameForAutopsy('abcd1234', { fetcher });
    const second = await fetchGameForAutopsy('abcd1234', { fetcher });

    expect(first).toEqual({ kind: 'not-found' });
    expect(second).toEqual({ kind: 'ok', exportJson: { id: 'abcd1234', moves: 'e4', analysis: [{ eval: 10 }] }, gameId: 'abcd1234' });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
