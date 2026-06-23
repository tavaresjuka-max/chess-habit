import { describe, expect, it } from 'vitest';
import { chesscomFetch, createSerialQueue, lichessFetch } from './providerQueue';

function ok(status = 200): Response {
  return new Response('', { status });
}

function response(status: number, headers?: HeadersInit): Response {
  return new Response('', { status, headers });
}

function labelOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

describe('createSerialQueue', () => {
  it('serializes two simultaneous calls', async () => {
    const log: string[] = [];

    const mock = async (input: RequestInfo | URL): Promise<Response> => {
      const label = labelOf(input);
      log.push(`start:${label}`);
      await new Promise<void>((r) => setTimeout(r, 10));
      log.push(`end:${label}`);
      return ok();
    };

    const queue = createSerialQueue({ fetcher: mock });
    await Promise.all([queue('a'), queue('b')]);

    expect(log).toEqual(['start:a', 'end:a', 'start:b', 'end:b']);
  });

  it('waits cooldown after a 429 response', async () => {
    const cooldownMs = 30;
    let calls = 0;

    const mock = (): Promise<Response> => {
      calls += 1;
      return Promise.resolve(ok(calls === 1 ? 429 : 200));
    };

    const queue = createSerialQueue({ cooldownMs, fetcher: mock });

    const t0 = Date.now();
    await Promise.all([queue('https://a'), queue('https://b')]);

    expect(calls).toBe(2);
    expect(Date.now() - t0).toBeGreaterThanOrEqual(cooldownMs);
  });

  it('respects Retry-After when it is longer than the default cooldown', async () => {
    const cooldownMs = 10;
    let calls = 0;

    const mock = (): Promise<Response> => {
      calls += 1;
      return Promise.resolve(calls === 1 ? response(429, { 'Retry-After': '0.05' }) : ok());
    };

    const queue = createSerialQueue({ cooldownMs, fetcher: mock });

    const t0 = Date.now();
    await Promise.all([queue('https://a'), queue('https://b')]);

    expect(Date.now() - t0).toBeGreaterThanOrEqual(50);
  });

  it('continues processing after a network error', async () => {
    let calls = 0;

    const mock = (): Promise<Response> => {
      calls += 1;
      if (calls === 1) return Promise.reject(new Error('network'));
      return Promise.resolve(ok());
    };

    const queue = createSerialQueue({ fetcher: mock });

    await expect(queue('https://a')).rejects.toThrow('network');
    const res = await queue('https://b');
    expect(res.status).toBe(200);
  });

  it('lichessFetch and chesscomFetch are separate queue instances', () => {
    expect(lichessFetch).not.toBe(chesscomFetch);
  });

  it('aborta uma chamada que excede o timeout', async () => {
    let calls = 0;
    const stalled: typeof fetch = (_input, init) => {
      calls += 1;
      return new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        if (signal?.aborted) {
          reject(new Error('aborted'));
          return;
        }
        signal?.addEventListener('abort', () => {
          reject(new Error('aborted'));
        });
      });
    };

    const queue = createSerialQueue({ timeoutMs: 20, fetcher: stalled });

    await expect(queue('https://slow')).rejects.toThrow();
    expect(calls).toBe(1);
  });

  it('não aborta quando a chamada responde dentro do timeout', async () => {
    const queue = createSerialQueue({ timeoutMs: 1000, fetcher: () => Promise.resolve(ok()) });

    await expect(queue('https://fast')).resolves.toHaveProperty('status', 200);
  });

  it('timeout não trava a fila: próxima chamada processa normalmente (M-Hardening Task 4)', async () => {
    // Cenário: a 1ª chamada excede o timeout e é abortada. A fila deve continuar
    // liberando chamadas seguintes — o `tail` chain não pode ficar preso no
    // rejected promise da chamada abortada.
    let calls = 0;
    let secondCallStarted = false;
    const t0 = Date.now();
    const callTimestamps: number[] = [];

    const mixed: typeof fetch = (_input, init) => {
      calls += 1;
      callTimestamps.push(Date.now() - t0);
      if (calls === 1) {
        // 1ª chamada estoura o timeout: nunca resolve espontaneamente.
        return new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal;
          if (signal?.aborted) {
            reject(new DOMException('aborted', 'AbortError'));
            return;
          }
          signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'));
          });
        });
      }
      secondCallStarted = true;
      return Promise.resolve(ok(200));
    };

    const queue = createSerialQueue({ timeoutMs: 20, fetcher: mixed });

    // 1ª chamada: estoura o timeout e rejeita.
    await expect(queue('https://slow')).rejects.toThrow();

    // 2ª chamada despachada depois do timeout: fetcher responde rápido. A fila
    // não pode estar presa — secondCallStarted deve virar true e status == 200.
    const second = await queue('https://fast');

    expect(secondCallStarted).toBe(true);
    expect(second.status).toBe(200);
    // Sanidade: 2ª chamada só inicia depois da 1ª.
    expect(callTimestamps[1] as number).toBeGreaterThanOrEqual(callTimestamps[0] as number);
  });

  it('429 + Retry-After: não dispara a próxima chamada antes do cooldown (M-Hardening Task 4)', async () => {
    // Cenário: o 1º request volta 429 com Retry-After curto. A 2ª chamada NÃO
    // pode disparar o fetcher imediatamente — precisa esperar o cooldown passar.
    // Asserção: o timestamp em que o fetcher é invocado pela 2ª vez é >= que o
    // timestamp da 1ª chamada + Retry-After.
    const cooldownMs = 10;
    const retryAfterSeconds = 0.08; // 80ms — maior que cooldownMs (10ms)
    const callTimestamps: number[] = [];
    const t0 = Date.now();

    const mock = (): Promise<Response> => {
      callTimestamps.push(Date.now() - t0);
      const isFirst = callTimestamps.length === 1;
      return Promise.resolve(isFirst ? response(429, { 'Retry-After': String(retryAfterSeconds) }) : ok());
    };

    const queue = createSerialQueue({ cooldownMs, fetcher: mock });

    await Promise.all([queue('https://a'), queue('https://b')]);

    expect(callTimestamps).toHaveLength(2);
    const gap = (callTimestamps[1] as number) - (callTimestamps[0] as number);
    // Retry-After = 80ms → a 2ª chamada só pode rodar >= 80ms depois da 1ª.
    expect(gap).toBeGreaterThanOrEqual(70); // tolerância de 10ms para jitter do scheduler
  });

  it('serialização preserva ordem em 3 chamadas concorrentes (M-Hardening Task 4)', async () => {
    // Cenário: 3 chamadas despachadas "simultaneamente" para a MESMA fila não
    // rodam em paralelo — ordem de execução == ordem do dispatch, sem overlap.
    const events: string[] = [];
    const inFlight: Set<string> = new Set();

    const mock = async (input: RequestInfo | URL): Promise<Response> => {
      const label = labelOf(input);
      // Se já há algo em voo, quebrou a serialização.
      if (inFlight.size > 0) {
        events.push(`OVERLAP:${label} while ${[...inFlight].join(',')}`);
      }
      inFlight.add(label);
      events.push(`start:${label}`);
      await new Promise<void>((r) => setTimeout(r, 15));
      events.push(`end:${label}`);
      inFlight.delete(label);
      return ok();
    };

    const queue = createSerialQueue({ fetcher: mock });

    await Promise.all([queue('https://1'), queue('https://2'), queue('https://3')]);

    // Sem overlap em momento algum.
    expect(events.some((e) => e.startsWith('OVERLAP'))).toBe(false);
    // Ordem de início preserva ordem de dispatch (1, 2, 3 — nunca embaralhada).
    const starts = events.filter((e) => e.startsWith('start:'));
    expect(starts).toEqual(['start:https://1', 'start:https://2', 'start:https://3']);
  });
});
