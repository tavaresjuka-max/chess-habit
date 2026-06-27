// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { decryptJson, encryptJson, parseEncryptedBlob, serializeEncryptedBlob } from './crypto';
import { createCanary } from './passphraseCanary';
import { createSyncClient, type SyncClient } from './syncClient';
import { pullAndDecrypt, pushEncrypted } from './syncEngine';

const FAST = { iterations: 1_000 };
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

describe('sync engine (P4 M13 local-only)', () => {
  describe('pushEncrypted — canary bloqueia passphrase divergente', () => {
    it('recusa push quando a passphrase difere do canary (sem rede)', async () => {
      const { fetcher, calls } = mockFetch(() => jsonResponse(200, { ok: true }));
      const client = makeClient(fetcher);
      const canary = await createCanary('correta', FAST);

      const result = await pushEncrypted({
        passphrase: 'errada',
        canary,
        client,
        collection: 'probe',
        clientMutationId: 'm1',
        value: { segredo: 'x' },
        updatedAt: 1,
        iterations: FAST.iterations,
      });

      expect(result).toEqual({ ok: false, reason: 'wrong-passphrase' });
      expect(calls).toHaveLength(0);
    });

    it('recusa push com passphrase vazia (sem rede)', async () => {
      const { fetcher, calls } = mockFetch(() => jsonResponse(200, { ok: true }));
      const client = makeClient(fetcher);
      const canary = await createCanary('correta', FAST);

      const result = await pushEncrypted({
        passphrase: '',
        canary,
        client,
        collection: 'probe',
        clientMutationId: 'm1',
        value: { a: 1 },
        updatedAt: 1,
        iterations: FAST.iterations,
      });

      expect(result.ok).toBe(false);
      expect(calls).toHaveLength(0);
    });

    it('aceita push quando a passphrase bate com o canary', async () => {
      const { fetcher, calls } = mockFetch(() => jsonResponse(200, { ok: true }));
      const client = makeClient(fetcher);
      const canary = await createCanary('correta', FAST);

      const result = await pushEncrypted({
        passphrase: 'correta',
        canary,
        client,
        collection: 'probe',
        clientMutationId: 'm1',
        value: { a: 1 },
        updatedAt: 1,
        iterations: FAST.iterations,
      });

      expect(result).toEqual({ ok: true });
      expect(calls).toHaveLength(1);
      expect(calls[0]?.method).toBe('POST');
    });
  });

  describe('pushEncrypted — payload nao vaza plaintext/passphrase', () => {
    it('o corpo HTTP contem APENAS ciphertext + metadados; sem plaintext/passphrase', async () => {
      const passphrase = 'passphrase-unica-ZZZ-999';
      const plaintextMarker = 'TOPSECRET-plaintext-marker-4242';
      const { fetcher, calls } = mockFetch(() => jsonResponse(200, { ok: true }));
      const client = makeClient(fetcher);
      const canary = await createCanary(passphrase, FAST);

      const result = await pushEncrypted({
        passphrase,
        canary,
        client,
        collection: 'probe',
        clientMutationId: 'm1',
        value: { secret: plaintextMarker, nested: { deep: plaintextMarker } },
        updatedAt: 777,
        iterations: FAST.iterations,
      });

      expect(result.ok).toBe(true);
      const body = calls[0]?.body ?? '';
      expect(body).toContain('"collection":"probe"');
      expect(body).toContain('"clientMutationId":"m1"');
      expect(body).toContain('"updatedAt":777');
      expect(body).toContain('"ciphertext"');
      expect(body).not.toContain(plaintextMarker);
      expect(body).not.toContain(passphrase);
      expect(body).not.toContain('"passphrase"');
      expect(body).not.toContain('"token"');
    });

    it('o header tambem nao carrega passphrase/token (so X-Sync-User local)', async () => {
      const passphrase = 'cabecalho-pass-ZZZ-999';
      const { fetcher, calls } = mockFetch(() => jsonResponse(200, { ok: true }));
      const client = makeClient(fetcher);
      const canary = await createCanary(passphrase, FAST);

      await pushEncrypted({
        passphrase,
        canary,
        client,
        collection: 'probe',
        clientMutationId: 'm1',
        value: { a: 1 },
        updatedAt: 1,
        iterations: FAST.iterations,
      });

      const headers = calls[0]?.headers ?? new Headers();
      expect(headers.get('x-sync-user')).toBe('userA');
      expect(headers.get('authorization')).toBeNull();
      expect(headers.get('cookie')).toBeNull();
      const passphraseAnywhere = [...headers.entries()].some(([, v]) => v.includes(passphrase));
      expect(passphraseAnywhere).toBe(false);
    });
  });

  describe('pullAndDecrypt — round-trip E2EE', () => {
    it('push depois pull devolve o valor original decifrado', async () => {
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
      const canary = await createCanary('correta', FAST);

      const original = { trilha: 'Peao', n: 7, lista: [1, 2, 3] };
      const pushRes = await pushEncrypted({
        passphrase: 'correta',
        canary,
        client,
        collection: 'profiles',
        clientMutationId: 'mut-1',
        value: original,
        updatedAt: 100,
        iterations: FAST.iterations,
      });
      expect(pushRes.ok).toBe(true);

      const pullRes = await pullAndDecrypt({
        passphrase: 'correta',
        canary,
        client,
        collection: 'profiles',
      });
      expect(pullRes.ok).toBe(true);
      if (pullRes.ok) {
        expect(pullRes.items).toHaveLength(1);
        expect(pullRes.items[0]?.value).toEqual(original);
      }
    });

    it('pull com passphrase divergente do canary e barrado antes da rede', async () => {
      const { fetcher, calls } = mockFetch(() => jsonResponse(200, { blobs: [] }));
      const client = makeClient(fetcher);
      const canary = await createCanary('correta', FAST);

      const res = await pullAndDecrypt({
        passphrase: 'errada',
        canary,
        client,
        collection: 'profiles',
      });
      expect(res).toEqual({ ok: false, reason: 'wrong-passphrase' });
      expect(calls).toHaveLength(0);
    });

    it('pull com ciphertext corrompido no servidor => wrong-passphrase', async () => {
      const good = await encryptJson({ ok: true }, 'correta', FAST);
      const corrupted = { ...good, ciphertext: good.ciphertext.slice(0, -4) + 'AAAA' };
      const stored = [
        { collection: 'profiles', clientMutationId: 'a', ciphertext: serializeEncryptedBlob(good), updatedAt: 1 },
        { collection: 'profiles', clientMutationId: 'b', ciphertext: JSON.stringify(corrupted), updatedAt: 2 },
      ];
      const { fetcher } = mockFetch(() => jsonResponse(200, { userId: 'userA', collection: 'profiles', blobs: stored }));
      const client = makeClient(fetcher);
      const canary = await createCanary('correta', FAST);

      const res = await pullAndDecrypt({ passphrase: 'correta', canary, client, collection: 'profiles' });
      expect(res).toEqual({ ok: false, reason: 'wrong-passphrase' });
    });

    it('snapshot (sem collection) decifra blobs de varias colecoes', async () => {
      const a = await encryptJson({ x: 1 }, 'k', FAST);
      const b = await encryptJson({ y: 2 }, 'k', FAST);
      const stored = [
        { collection: 'profiles', clientMutationId: 'm1', ciphertext: serializeEncryptedBlob(a), updatedAt: 1 },
        { collection: 'settings', clientMutationId: 'm2', ciphertext: serializeEncryptedBlob(b), updatedAt: 2 },
      ];
      const { fetcher } = mockFetch(() => jsonResponse(200, { userId: 'userA', blobs: stored }));
      const client = makeClient(fetcher);
      const canary = await createCanary('k', FAST);

      const res = await pullAndDecrypt({ passphrase: 'k', canary, client });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.items.map((i) => i.collection).sort()).toEqual(['profiles', 'settings']);
      }
    });
  });

  describe('pullAndDecrypt — rejeita ciphertext que nao e envelope', () => {
    it('ciphertext estranho no servidor => wrong-passphrase (nao quebra)', async () => {
      const stored = [
        { collection: 'profiles', clientMutationId: 'm1', ciphertext: 'nao-e-json', updatedAt: 1 },
      ];
      const { fetcher } = mockFetch(() => jsonResponse(200, { userId: 'userA', collection: 'profiles', blobs: stored }));
      const client = makeClient(fetcher);
      const canary = await createCanary('k', FAST);

      const res = await pullAndDecrypt({ passphrase: 'k', canary, client, collection: 'profiles' });
      expect(res).toEqual({ ok: false, reason: 'wrong-passphrase' });
    });

    it('ciphertext envelope valido decifra normalmente (sanidade do parse)', async () => {
      const blob = await encryptJson({ valor: 42 }, 'k', FAST);
      const parsed = parseEncryptedBlob(serializeEncryptedBlob(blob));
      expect(await decryptJson(parsed, 'k')).toEqual({ valor: 42 });
    });
  });
});
