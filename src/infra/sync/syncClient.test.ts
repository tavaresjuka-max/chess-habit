// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  createSyncClient,
  SyncUnauthorizedError,
  type PushBlobInput,
  type StoredBlob,
} from './syncClient';

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
  const fetcher = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url =
      input instanceof URL
        ? input
        : typeof input === 'string'
          ? new URL(input)
          : new URL(input.url);
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

const BASE = 'http://127.0.0.1:8787';

function makeClient(fetcher: typeof fetch) {
  return createSyncClient({ baseUrl: BASE, userId: 'userA', fetcher });
}

describe('sync client (P4 M13 local-only)', () => {
  describe('health', () => {
    it('GET /health com header X-Sync-User', async () => {
      const { fetcher, calls } = mockFetch(() =>
        jsonResponse(200, { ok: true, service: 'rotina-sync', db: 'up' }),
      );
      const client = makeClient(fetcher);
      const res = await client.health();
      expect(res.ok).toBe(true);
      expect(calls).toHaveLength(1);
      expect(calls[0]?.method).toBe('GET');
      expect(calls[0]?.url.pathname).toBe('/health');
      expect(calls[0]?.headers.get('x-sync-user')).toBe('userA');
    });
  });

  describe('pushBlob', () => {
    it('POST /blobs com corpo {collection, clientMutationId, ciphertext, updatedAt}', async () => {
      const { fetcher, calls } = mockFetch(() => jsonResponse(200, { ok: true }));
      const client = makeClient(fetcher);
      await client.pushBlob({
        collection: 'profiles',
        clientMutationId: 'mut-1',
        ciphertext: 'OPACO-AAA',
        updatedAt: 1_000,
      });
      const call = calls[0];
      expect(call?.method).toBe('POST');
      expect(call?.url.pathname).toBe('/blobs');
      expect(call?.headers.get('content-type')).toContain('application/json');
      expect(call?.headers.get('x-sync-user')).toBe('userA');
      const body = JSON.parse(call?.body ?? '{}') as {
        collection: string;
        clientMutationId: string;
        ciphertext: string;
        updatedAt: number;
      };
      expect(body).toEqual({
        collection: 'profiles',
        clientMutationId: 'mut-1',
        ciphertext: 'OPACO-AAA',
        updatedAt: 1_000,
      });
    });

    it('recusa collection invalida (antes de ir para a rede)', async () => {
      const { fetcher, calls } = mockFetch(() => jsonResponse(200, { ok: true }));
      const client = makeClient(fetcher);
      await expect(
        client.pushBlob({
          collection: 'bad collection!',
          clientMutationId: 'm',
          ciphertext: 'x',
          updatedAt: 1,
        }),
      ).rejects.toThrow(/collection/);
      expect(calls).toHaveLength(0);
    });

    it('recusa ciphertext vazio', async () => {
      const { fetcher } = mockFetch(() => jsonResponse(200, { ok: true }));
      const client = makeClient(fetcher);
      await expect(
        client.pushBlob({
          collection: 'profiles',
          clientMutationId: 'm',
          ciphertext: '',
          updatedAt: 1,
        }),
      ).rejects.toThrow(/ciphertext/);
    });
  });

  describe('listBlobs', () => {
    it('GET /blobs?collection=X devolve os blobs opacos', async () => {
      const { fetcher, calls } = mockFetch(() =>
        jsonResponse(200, {
          userId: 'userA',
          collection: 'profiles',
          blobs: [
            { collection: 'profiles', clientMutationId: 'm1', ciphertext: 'A', updatedAt: 1 },
          ],
        }),
      );
      const client = makeClient(fetcher);
      const blobs = await client.listBlobs('profiles');
      expect(blobs).toHaveLength(1);
      expect(blobs[0]).toEqual({
        collection: 'profiles',
        clientMutationId: 'm1',
        ciphertext: 'A',
        updatedAt: 1,
      });
      expect(calls[0]?.url.searchParams.get('collection')).toBe('profiles');
    });

    it('recusa collection invalida', async () => {
      const { fetcher, calls } = mockFetch(() => jsonResponse(200, { blobs: [] }));
      const client = makeClient(fetcher);
      await expect(client.listBlobs('bad!')).rejects.toThrow(/collection/);
      expect(calls).toHaveLength(0);
    });
  });

  describe('snapshot', () => {
    it('GET /snapshot devolve blobs de todas as colecoes', async () => {
      const { fetcher, calls } = mockFetch(() =>
        jsonResponse(200, {
          userId: 'userA',
          blobs: [
            { collection: 'profiles', clientMutationId: 'm1', ciphertext: 'A', updatedAt: 1 },
            { collection: 'settings', clientMutationId: 'm2', ciphertext: 'B', updatedAt: 2 },
          ],
        }),
      );
      const client = makeClient(fetcher);
      const blobs = await client.snapshot();
      expect(blobs.map((b) => b.collection).sort()).toEqual(['profiles', 'settings']);
      expect(calls[0]?.url.pathname).toBe('/snapshot');
    });
  });

  describe('tratamento de erros HTTP', () => {
    it('lancam SyncHttpError com status e mensagem do backend em nao-2xx', async () => {
      const { fetcher } = mockFetch(() =>
        jsonResponse(401, { error: 'missing or invalid X-Sync-User header (local mode).' }),
      );
      const client = makeClient(fetcher);
      await expect(client.snapshot()).rejects.toMatchObject({
        name: 'SyncHttpError',
        status: 401,
        message: 'missing or invalid X-Sync-User header (local mode).',
      });
    });

    it('funciona mesmo se o backend retornar erro sem corpo JSON', async () => {
      const { fetcher } = mockFetch(() => new Response('upstream down', { status: 502 }));
      const client = makeClient(fetcher);
      await expect(client.snapshot()).rejects.toMatchObject({
        name: 'SyncHttpError',
        status: 502,
      });
    });

    it('SyncHttpError status=0 em falha de rede', async () => {
      const { fetcher } = mockFetch(() => Promise.reject(new Error('ECONNREFUSED')));
      const client = makeClient(fetcher);
      await expect(client.health()).rejects.toMatchObject({ name: 'SyncHttpError', status: 0 });
    });

    it('200 com corpo nao-JSON vira SyncHttpError (nao SyntaxError)', async () => {
      const { fetcher } = mockFetch(() => new Response('upstream down', { status: 200 }));
      const client = makeClient(fetcher);
      await expect(client.health()).rejects.toMatchObject({
        name: 'SyncHttpError',
        status: 200,
      });
    });

    it('timeout aborta e vira SyncHttpError', async () => {
      const stalled: typeof fetch = (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'));
          });
        });
      const client = createSyncClient({
        baseUrl: BASE,
        userId: 'userA',
        fetcher: stalled,
        timeoutMs: 20,
      });
      await expect(client.health()).rejects.toMatchObject({ name: 'SyncHttpError', status: 0 });
    });
  });

  describe('validacao de config', () => {
    it('recusa userId fora do formato local', () => {
      expect(() =>
        createSyncClient({
          baseUrl: BASE,
          userId: 'user com espaco',
          fetcher: () => Promise.resolve(jsonResponse(200, {})),
        }),
      ).toThrow(/userId/);
    });

    it('normaliza baseUrl removendo barra final', async () => {
      const { fetcher, calls } = mockFetch(() => jsonResponse(200, { ok: true }));
      const client = createSyncClient({
        baseUrl: `${BASE}/`,
        userId: 'userA',
        fetcher,
      });
      await client.health();
      expect(calls[0]?.url.href).toBe(`${BASE}/health`);
    });
  });

  describe('modo oauth (M13)', () => {
    function makeOAuthClient(fetcher: typeof fetch, bearerToken = 'my-oauth-token') {
      return createSyncClient({ mode: 'oauth', baseUrl: BASE, bearerToken, fetcher });
    }

    it('envia Authorization: Bearer em vez de x-sync-user', async () => {
      const { fetcher, calls } = mockFetch(() => jsonResponse(200, { ok: true }));
      const client = makeOAuthClient(fetcher);
      await client.health();
      expect(calls[0]?.headers.get('Authorization')).toBe('Bearer my-oauth-token');
      expect(calls[0]?.headers.get('x-sync-user')).toBeNull();
    });

    it('NÃO envia x-sync-user em modo oauth (fronteira de segurança)', async () => {
      const { fetcher, calls } = mockFetch(() =>
        jsonResponse(200, { ok: true, service: 'rotina-sync', db: 'up' }),
      );
      const client = makeOAuthClient(fetcher, 'secret-bearer-token');
      await client.health();
      const headerNames = [...(calls[0]?.headers.keys() ?? [])].map((h) => h.toLowerCase());
      expect(headerNames).not.toContain('x-sync-user');
      expect(calls[0]?.headers.get('authorization')).toBe('Bearer secret-bearer-token');
    });

    it('401 em modo oauth lança SyncUnauthorizedError (não SyncHttpError genérico)', async () => {
      const { fetcher } = mockFetch(() =>
        jsonResponse(401, { error: 'token OAuth inválido ou expirado.' }),
      );
      const client = makeOAuthClient(fetcher);
      await expect(client.snapshot()).rejects.toBeInstanceOf(SyncUnauthorizedError);
      await expect(client.snapshot()).rejects.toMatchObject({
        name: 'SyncUnauthorizedError',
        status: 401,
      });
    });

    it('SyncUnauthorizedError é instância de SyncHttpError (herança)', async () => {
      const { fetcher } = mockFetch(() =>
        jsonResponse(401, { error: 'token OAuth inválido ou expirado.' }),
      );
      const client = makeOAuthClient(fetcher);
      try {
        await client.snapshot();
        expect.fail('deveria ter lançado erro');
      } catch (err) {
        expect(err).toBeInstanceOf(SyncUnauthorizedError);
        // SyncUnauthorizedError extends SyncHttpError
        const { SyncHttpError: SHE } = await import('./syncClient');
        expect(err).toBeInstanceOf(SHE);
      }
    });

    it('push em modo oauth envia Bearer e não envia userId no payload', async () => {
      const { fetcher, calls } = mockFetch(() => jsonResponse(200, { ok: true }));
      const client = makeOAuthClient(fetcher, 'bearer-xyz');
      await client.pushBlob({
        collection: 'profiles',
        clientMutationId: 'mut-oauth-1',
        ciphertext: 'OPACO-BLOB',
        updatedAt: 999,
      });
      expect(calls[0]?.headers.get('Authorization')).toBe('Bearer bearer-xyz');
      const body = JSON.parse(calls[0]?.body ?? '{}') as Record<string, unknown>;
      expect(body).not.toHaveProperty('userId');
      expect(body).toMatchObject({
        collection: 'profiles',
        clientMutationId: 'mut-oauth-1',
        ciphertext: 'OPACO-BLOB',
        updatedAt: 999,
      });
    });

    it('modo local continua enviando x-sync-user (M12 intacto)', async () => {
      const { fetcher, calls } = mockFetch(() => jsonResponse(200, { ok: true }));
      const client = createSyncClient({ baseUrl: BASE, userId: 'userA', fetcher });
      await client.health();
      expect(calls[0]?.headers.get('x-sync-user')).toBe('userA');
      expect(calls[0]?.headers.get('authorization')).toBeNull();
    });

    it('recusa bearerToken vazio em modo oauth', () => {
      expect(() =>
        createSyncClient({
          mode: 'oauth',
          baseUrl: BASE,
          bearerToken: '',
          fetcher: () => Promise.resolve(jsonResponse(200, {})),
        }),
      ).toThrow(/bearerToken/);
    });
  });

  describe('FRONTEIRA DE SEGURANCA: payload transporta ciphertext como string opaca', () => {
    it('push de blob: corpo contém a string ciphertext exatamente como enviada (content-agnostic)', async () => {
      const bearer = 'oauth-bearer-TOKEN-VALUE';
      // No modelo plaintext, o ciphertext é JSON puro — o cliente não interpreta nem modifica
      const wire = JSON.stringify({ v: 1, collection: 'profiles', entityId: 'u1' });

      const { fetcher, calls } = mockFetch(() => jsonResponse(200, { ok: true }));
      const client = makeClient(fetcher);
      await client.pushBlob({
        collection: 'profiles',
        clientMutationId: 'mut-1',
        ciphertext: wire,
        updatedAt: 5_000,
      });

      const sent = calls[0]?.body ?? '';
      expect(sent).not.toContain(bearer);
      const parsed = JSON.parse(sent) as { ciphertext: string };
      // Cliente devolve o wire intacto — content-agnostic
      expect(parsed.ciphertext).toBe(wire);
      const headerNames = [...(calls[0]?.headers.keys() ?? [])].map((h) => h.toLowerCase());
      expect(headerNames).not.toContain('authorization');
      expect(headerNames).not.toContain('cookie');
    });

    it('roundtrip opaco ponta-a-ponta: ciphertext chega ao listBlobs idêntico ao enviado', () => {
      const original = { name: 'Juka', band: '800-1200', theme: 'fork' };
      // plaintext: ciphertext = JSON.stringify do valor
      const wire = JSON.stringify(original);

      const store = new Map<string, StoredBlob>();
      const { fetcher } = mockFetch((call) => {
        if (call.method === 'POST' && call.url.pathname === '/blobs') {
          const body = JSON.parse(call.body ?? '{}') as PushBlobInput;
          const row: StoredBlob = {
            collection: body.collection,
            clientMutationId: body.clientMutationId,
            ciphertext: body.ciphertext,
            updatedAt: body.updatedAt,
          };
          store.set(`${body.collection}/${body.clientMutationId}`, row);
          return jsonResponse(200, { ok: true });
        }
        if (call.method === 'GET' && call.url.pathname === '/blobs') {
          const collection = call.url.searchParams.get('collection') ?? '';
          const blobs = [...store.values()].filter((r) => r.collection === collection);
          return jsonResponse(200, { userId: 'userA', collection, blobs });
        }
        return jsonResponse(404, { error: 'not found' });
      });

      const client = makeClient(fetcher);

      return client
        .pushBlob({ collection: 'profiles', clientMutationId: 'm1', ciphertext: wire, updatedAt: 123 })
        .then(() => client.listBlobs('profiles'))
        .then((pulled) => {
          expect(pulled).toHaveLength(1);
          // ciphertext chega intacto — o cliente não transforma
          expect(pulled[0]?.ciphertext).toBe(wire);
          // e o conteúdo é JSON parseável no recetor
          expect(JSON.parse(pulled[0]?.ciphertext ?? '{}')).toEqual(original);
        });
    });
  });
});
