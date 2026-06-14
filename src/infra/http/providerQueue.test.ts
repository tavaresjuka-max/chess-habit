import { describe, expect, it } from 'vitest';
import { chesscomFetch, createSerialQueue, lichessFetch } from './providerQueue';

function ok(status = 200): Response {
  return new Response('', { status });
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
});
