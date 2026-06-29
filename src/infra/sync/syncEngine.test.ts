// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { createSyncClient, type SyncClient } from './syncClient';
import { pullBlobs, pushBlob } from './syncEngine';

const BASE = 'http://127.0.0.1:8787';

interface MockCall {
  url: URL;
  method: string;
  headers: Headers;
  body: string | undefined;
}

function mockFetch(
  responder: (call: MockCall) => Response | Promise<Response>,
): { fetcher: typeof fetch; calls: MockCall[] } {
  const calls: MockCall[] = [];
  const fetcher = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = input instanceof URL ? input : typeof input === 'string' ? new URL(input) : new URL(input.url);
    const headers = new Headers(init?.headers);
    const method = (init?.method ?? 'GET').toUpperCase();
    const body = typeof init?.body === 'string' ? init.body : undefined;
    const call: MockCall = { url, method, headers, body };
    calls.push(call);
    return responder(call);
  };
  return { fetcher, calls };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function makeClient(fetcher: typeof fetch): SyncClient {
  return createSyncClient({ baseUrl: BASE, userId: 'userA', fetcher });
}

describe('sync engine plaintext (B5a)', () => {
  describe('pushBlob — envia JSON puro ao backend', () => {
    it('faz POST com ciphertext = JSON.stringify do valor', async () => {
      const { fetcher, calls } = mockFetch(() => jsonResponse(200, { ok: true }));
      const client = makeClient(fetcher);
      const value = { trilha: 'Peao', n: 7, lista: [1, 2, 3] };

      await pushBlob({
        client,
        collection: 'probe',
        clientMutationId: 'm1',
        value,
        updatedAt: 777,
      });

      expect(calls).toHaveLength(1);
      expect(calls[0]?.method).toBe('POST');
      const body = JSON.parse(calls[0]?.body ?? '{}') as {
        collection: string;
        clientMutationId: string;
        ciphertext: string;
        updatedAt: number;
      };
      expect(body.collection).toBe('probe');
      expect(body.clientMutationId).toBe('m1');
      expect(body.updatedAt).toBe(777);
      expect(JSON.parse(body.ciphertext)).toEqual(value);
    });

    it('o ciphertext NÃO contém base64 de envelope E2EE (só JSON legível)', async () => {
      const { fetcher, calls } = mockFetch(() => jsonResponse(200, { ok: true }));
      const client = makeClient(fetcher);

      await pushBlob({
        client,
        collection: 'probe',
        clientMutationId: 'm1',
        value: { kind: 'sync-probe', at: 42 },
        updatedAt: 1,
      });

      const body = JSON.parse(calls[0]?.body ?? '{}') as { ciphertext: string };
      // JSON puro: NÃO tem campos de envelope E2EE (kdf, iterations, salt, iv)
      const parsed = JSON.parse(body.ciphertext) as unknown;
      expect(typeof parsed).toBe('object');
      expect((parsed as Record<string, unknown>)['kdf']).toBeUndefined();
      expect((parsed as Record<string, unknown>)['salt']).toBeUndefined();
    });
  });

  describe('pullBlobs — round-trip plaintext', () => {
    it('push depois pull devolve o valor original via JSON.parse', async () => {
      const store = new Map<string, { ciphertext: string; updatedAt: number }>();
      const { fetcher } = mockFetch((call) => {
        if (call.method === 'POST') {
          const payload = JSON.parse(call.body ?? '{}') as {
            collection: string;
            clientMutationId: string;
            ciphertext: string;
            updatedAt: number;
          };
          store.set(`${payload.collection}:${payload.clientMutationId}`, {
            ciphertext: payload.ciphertext,
            updatedAt: payload.updatedAt,
          });
          return jsonResponse(200, { ok: true });
        }
        const url = call.url;
        const collection = url.searchParams.get('collection') ?? '';
        const blobs = [...store.entries()]
          .filter(([key]) => key.startsWith(`${collection}:`))
          .map(([key, value]) => {
            const [, clientMutationId] = key.split(':');
            return { collection, clientMutationId: clientMutationId ?? '', ...value };
          });
        return jsonResponse(200, { userId: 'userA', collection, blobs });
      });
      const client = makeClient(fetcher);

      const original = { trilha: 'Peao', n: 7, lista: [1, 2, 3] };
      await pushBlob({
        client,
        collection: 'profiles',
        clientMutationId: 'mut-1',
        value: original,
        updatedAt: 100,
      });

      const pullRes = await pullBlobs({ client, collection: 'profiles' });
      expect(pullRes.ok).toBe(true);
      expect(pullRes.items).toHaveLength(1);
      expect(pullRes.items[0]?.value).toEqual(original);
    });

    it('snapshot (sem collection) retorna blobs de várias coleções', async () => {
      const stored = [
        { collection: 'profiles', clientMutationId: 'm1', ciphertext: JSON.stringify({ x: 1 }), updatedAt: 1 },
        { collection: 'settings', clientMutationId: 'm2', ciphertext: JSON.stringify({ y: 2 }), updatedAt: 2 },
      ];
      const { fetcher } = mockFetch(() => jsonResponse(200, { userId: 'userA', blobs: stored }));
      const client = makeClient(fetcher);

      const res = await pullBlobs({ client });
      expect(res.ok).toBe(true);
      expect(res.items.map((i) => i.collection).sort()).toEqual(['profiles', 'settings']);
      expect(res.items.find((i) => i.collection === 'profiles')?.value).toEqual({ x: 1 });
      expect(res.items.find((i) => i.collection === 'settings')?.value).toEqual({ y: 2 });
    });

    it('userId (isolamento por conta) vem do header, NÃO do corpo', async () => {
      const { fetcher, calls } = mockFetch(() =>
        jsonResponse(200, { userId: 'userA', collection: 'probe', blobs: [] }),
      );
      const client = makeClient(fetcher);

      await pullBlobs({ client, collection: 'probe' });

      const headers = calls[0]?.headers ?? new Headers();
      expect(headers.get('x-sync-user')).toBe('userA');
      expect(calls[0]?.body).toBeUndefined();
    });
  });

  describe('pullBlobs — preserva metadata dos blobs', () => {
    it('clientMutationId e updatedAt são preservados no item retornado', async () => {
      const stored = [
        { collection: 'logs', clientMutationId: 'cid-42', ciphertext: JSON.stringify({ id: 'log1' }), updatedAt: 9999 },
      ];
      const { fetcher } = mockFetch(() =>
        jsonResponse(200, { userId: 'userA', collection: 'logs', blobs: stored }),
      );
      const client = makeClient(fetcher);

      const res = await pullBlobs({ client, collection: 'logs' });
      expect(res.items[0]?.clientMutationId).toBe('cid-42');
      expect(res.items[0]?.updatedAt).toBe(9999);
    });
  });
});
