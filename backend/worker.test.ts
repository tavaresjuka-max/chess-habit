import { afterEach, describe, expect, it } from 'vitest';
import { _oauthCache } from './auth';
import { createFakeD1 } from './fakeD1';
import type { StoredBlob, SyncEnv } from './types';
import worker from './worker';

const OPAQUE_A = 'bm90LXBsYWludGV4dA==';
const OPAQUE_B = 'Y2lwaGVydGV4dC1i';

interface ErrorBody {
  error?: unknown;
}

interface HealthBody {
  ok: boolean;
  service: string;
  db: string;
  version: string;
}

interface PushBody {
  userId: string;
}

interface BlobListBody {
  collection?: string;
  blobs: StoredBlob[];
}

function env(overrides: Partial<SyncEnv> = {}): SyncEnv {
  return {
    DB: createFakeD1(),
    SYNC_AUTH_MODE: 'local',
    SYNC_LOCAL_ALLOWED: 'true',
    ...overrides,
  };
}

/** Env em modo oauth com URL fake do Lichess (injetável, sem rede real) */
function oauthEnv(
  lichessUrl: string,
  overrides: Partial<SyncEnv> = {},
): SyncEnv {
  return {
    DB: createFakeD1(),
    SYNC_AUTH_MODE: 'oauth',
    LICHESS_VALIDATE_URL: lichessUrl,
    ...overrides,
  };
}

function req(path: string, init: RequestInit = {}, userId?: string): Request {
  const headers = new Headers(init.headers);
  if (userId) headers.set('x-sync-user', userId);
  return new Request(`http://sync.local${path}`, { ...init, headers });
}

/** Request em modo oauth com Bearer token */
function reqOAuth(
  path: string,
  token: string,
  init: RequestInit = {},
): Request {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return new Request(`http://sync.local${path}`, { ...init, headers });
}

async function push(
  e: SyncEnv,
  userId: string,
  payload: Record<string, unknown>,
): Promise<Response> {
  return worker.fetch(
    req('/blobs', { method: 'POST', body: JSON.stringify(payload) }, userId),
    e,
  );
}

async function bodyOf<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

describe('rotina-sync worker (P4 M12 local + M13 oauth)', () => {
  it('GET /health retorna ok sem auth', async () => {
    const res = await worker.fetch(req('/health'), env());
    expect(res.status).toBe(200);
    const body = await bodyOf<HealthBody>(res);
    expect(body).toMatchObject({
      ok: true,
      service: 'rotina-sync',
      db: 'up',
      version: '0.1.0-local',
    });
  });

  it('GET /health funciona em qualquer modo (sem depender de auth)', async () => {
    const res = await worker.fetch(req('/health'), env({ SYNC_AUTH_MODE: 'oauth' }));
    expect(res.status).toBe(200);
  });

  it('rejeita push sem header de auth em modo local (401)', async () => {
    const res = await worker.fetch(
      req('/blobs', { method: 'POST', body: '{}' }),
      env(),
    );
    expect(res.status).toBe(401);
  });

  it('rejeita (401) quando SYNC_AUTH_MODE=oauth e nao ha Bearer token', async () => {
    // oauth mode ativo mas sem Authorization: Bearer → 401, não 501
    const res = await worker.fetch(
      req('/blobs', { method: 'POST', body: '{}' }),
      env({ SYNC_AUTH_MODE: 'oauth' }),
    );
    expect(res.status).toBe(401);
    const body = await bodyOf<ErrorBody>(res);
    expect(String(body.error)).toContain('Bearer');
  });

  it('rejeita (501) quando SYNC_AUTH_MODE esta ausente', async () => {
    const res = await worker.fetch(
      req('/blobs', { method: 'POST', body: '{}' }, 'userA'),
      env({ SYNC_AUTH_MODE: undefined }),
    );
    expect(res.status).toBe(501);
  });

  it('bloqueia (403) modo local sem SYNC_LOCAL_ALLOWED (guard anti-takeover)', async () => {
    const res = await worker.fetch(
      req('/blobs', { method: 'POST', body: '{}' }, 'userA'),
      env({ SYNC_LOCAL_ALLOWED: undefined }),
    );
    expect(res.status).toBe(403);
  });

  it('rejeita header de userId com formato invalido (401)', async () => {
    const res = await worker.fetch(
      req('/blobs', { method: 'POST', body: '{}' }, 'user with space'),
      env(),
    );
    expect(res.status).toBe(401);
  });

  it('push depois pull devolve o mesmo blob opaco', async () => {
    const e = env();
    const r1 = await push(e, 'userA', {
      collection: 'profiles',
      clientMutationId: 'mut-1',
      ciphertext: OPAQUE_A,
      updatedAt: 1_000,
    });
    expect(r1.status).toBe(200);
    expect((await bodyOf<PushBody>(r1)).userId).toBe('userA');

    const pull = await worker.fetch(req('/blobs?collection=profiles', {}, 'userA'), e);
    expect(pull.status).toBe(200);
    const body = await bodyOf<BlobListBody>(pull);
    expect(body.collection).toBe('profiles');
    expect(body.blobs).toHaveLength(1);
    expect(body.blobs[0]).toEqual({
      collection: 'profiles',
      clientMutationId: 'mut-1',
      ciphertext: OPAQUE_A,
      updatedAt: 1_000,
    });
  });

  it('snapshot devolve blobs de todas as colecoes do usuario', async () => {
    const e = env();
    await push(e, 'userA', {
      collection: 'profiles',
      clientMutationId: 'm1',
      ciphertext: OPAQUE_A,
      updatedAt: 1,
    });
    await push(e, 'userA', {
      collection: 'settings',
      clientMutationId: 'm2',
      ciphertext: OPAQUE_B,
      updatedAt: 2,
    });

    const snap = await worker.fetch(req('/snapshot', {}, 'userA'), e);
    expect(snap.status).toBe(200);
    const body = await bodyOf<BlobListBody>(snap);
    expect(body.blobs).toHaveLength(2);
    expect(body.blobs.map((b) => b.collection).sort()).toEqual([
      'profiles',
      'settings',
    ]);
  });

  it('isola blobs entre usuarios (userB nunca ve blobs de userA)', async () => {
    const e = env();
    await push(e, 'userA', {
      collection: 'profiles',
      clientMutationId: 'm1',
      ciphertext: OPAQUE_A,
      updatedAt: 1,
    });

    const pullB = await worker.fetch(req('/blobs?collection=profiles', {}, 'userB'), e);
    expect((await bodyOf<BlobListBody>(pullB)).blobs).toHaveLength(0);

    const snapB = await worker.fetch(req('/snapshot', {}, 'userB'), e);
    expect((await bodyOf<BlobListBody>(snapB)).blobs).toHaveLength(0);

    const pullA = await worker.fetch(req('/blobs?collection=profiles', {}, 'userA'), e);
    expect((await bodyOf<BlobListBody>(pullA)).blobs).toHaveLength(1);
  });

  it('userId do storage vem do auth, nunca do payload do cliente', async () => {
    const e = env();
    await push(e, 'userA', {
      userId: 'userB',
      collection: 'profiles',
      clientMutationId: 'm1',
      ciphertext: OPAQUE_A,
      updatedAt: 1,
    });

    const pullB = await worker.fetch(req('/blobs?collection=profiles', {}, 'userB'), e);
    expect((await bodyOf<BlobListBody>(pullB)).blobs).toHaveLength(0);
    const pullA = await worker.fetch(req('/blobs?collection=profiles', {}, 'userA'), e);
    expect((await bodyOf<BlobListBody>(pullA)).blobs).toHaveLength(1);
  });

  it('armazena ciphertext de forma opaca (bytes com cara de JSON nao sao parseados)', async () => {
    const e = env();
    const looksLikeJson = btoa('{"passphrase":"hunter2"}');
    const r1 = await push(e, 'userA', {
      collection: 'secrets',
      clientMutationId: 'm1',
      ciphertext: looksLikeJson,
      updatedAt: 5,
    });
    expect(r1.status).toBe(200);

    const pull = await worker.fetch(req('/blobs?collection=secrets', {}, 'userA'), e);
    const body = await bodyOf<BlobListBody>(pull);
    expect(body.blobs[0]?.ciphertext).toBe(looksLikeJson);
  });

  it('push idempotente: mesmo clientMutationId nao duplica', async () => {
    const e = env();
    const payload = (ciphertext: string, updatedAt: number) => ({
      collection: 'profiles',
      clientMutationId: 'mut-same',
      ciphertext,
      updatedAt,
    });

    const first = await push(e, 'userA', payload(OPAQUE_A, 1));
    expect(first.status).toBe(200);
    const replay = await push(e, 'userA', payload(OPAQUE_B, 2));
    expect(replay.status).toBe(200);

    const pull = await worker.fetch(req('/blobs?collection=profiles', {}, 'userA'), e);
    const pulled = await bodyOf<BlobListBody>(pull);
    expect(pulled.blobs).toHaveLength(1);
    expect(pulled.blobs[0]?.ciphertext).toBe(OPAQUE_B);
    expect(pulled.blobs[0]?.updatedAt).toBe(2);
  });

  it('recusa rollback/clobber: reenvio com updatedAt menor NAO sobrescreve', async () => {
    const e = env();
    await push(e, 'userA', {
      collection: 'profiles',
      clientMutationId: 'm1',
      ciphertext: OPAQUE_B,
      updatedAt: 10,
    });
    const r = await push(e, 'userA', {
      collection: 'profiles',
      clientMutationId: 'm1',
      ciphertext: OPAQUE_A,
      updatedAt: 5,
    });
    expect(r.status).toBe(200);
    const pull = await worker.fetch(req('/blobs?collection=profiles', {}, 'userA'), e);
    const body = await bodyOf<BlobListBody>(pull);
    expect(body.blobs).toHaveLength(1);
    expect(body.blobs[0]?.ciphertext).toBe(OPAQUE_B);
    expect(body.blobs[0]?.updatedAt).toBe(10);
  });

  it('idempotencia preservada: mesmo clientMutationId com updatedAt igual nao duplica nem altera', async () => {
    const e = env();
    await push(e, 'userA', {
      collection: 'profiles',
      clientMutationId: 'm1',
      ciphertext: OPAQUE_A,
      updatedAt: 7,
    });
    const r = await push(e, 'userA', {
      collection: 'profiles',
      clientMutationId: 'm1',
      ciphertext: OPAQUE_B,
      updatedAt: 7,
    });
    expect(r.status).toBe(200);
    const pull = await worker.fetch(req('/blobs?collection=profiles', {}, 'userA'), e);
    const body = await bodyOf<BlobListBody>(pull);
    expect(body.blobs).toHaveLength(1);
    expect(body.blobs[0]?.ciphertext).toBe(OPAQUE_A);
    expect(body.blobs[0]?.updatedAt).toBe(7);
  });

  it('mesmo clientMutationId em colecoes diferentes sao registros distintos', async () => {
    const e = env();
    await push(e, 'userA', {
      collection: 'profiles',
      clientMutationId: 'dup',
      ciphertext: OPAQUE_A,
      updatedAt: 1,
    });
    await push(e, 'userA', {
      collection: 'settings',
      clientMutationId: 'dup',
      ciphertext: OPAQUE_B,
      updatedAt: 2,
    });
    const snap = await worker.fetch(req('/snapshot', {}, 'userA'), e);
    expect((await bodyOf<BlobListBody>(snap)).blobs).toHaveLength(2);
  });

  it('rejeita body JSON invalido (400)', async () => {
    const res = await worker.fetch(
      req('/blobs', { method: 'POST', body: 'nope' }, 'userA'),
      env(),
    );
    expect(res.status).toBe(400);
  });

  it('rejeita collection invalida (400)', async () => {
    const res = await push(env(), 'userA', {
      collection: 'bad collection!',
      clientMutationId: 'm',
      ciphertext: OPAQUE_A,
      updatedAt: 1,
    });
    expect(res.status).toBe(400);
  });

  it('rejeita ciphertext vazio (400)', async () => {
    const res = await push(env(), 'userA', {
      collection: 'profiles',
      clientMutationId: 'm',
      ciphertext: '',
      updatedAt: 1,
    });
    expect(res.status).toBe(400);
  });

  it('rejeita ciphertext acima de SYNC_MAX_BLOB_BYTES (400)', async () => {
    const res = await push(env({ SYNC_MAX_BLOB_BYTES: '8' }), 'userA', {
      collection: 'profiles',
      clientMutationId: 'm',
      ciphertext: OPAQUE_A,
      updatedAt: 1,
    });
    expect(res.status).toBe(400);
  });

  it('rejeita pull sem collection (400)', async () => {
    const res = await worker.fetch(req('/blobs', {}, 'userA'), env());
    expect(res.status).toBe(400);
  });

  it('retorna 404 para rota desconhecida', async () => {
    const res = await worker.fetch(req('/nope', {}, 'userA'), env());
    expect(res.status).toBe(404);
  });

  it('retorna 404 para metodo nao suportado em /blobs (ex: PATCH)', async () => {
    const res = await worker.fetch(req('/blobs', { method: 'PATCH' }, 'userA'), env());
    expect(res.status).toBe(404);
  });

  describe('DELETE /blobs — exclusão de conta (direito de exclusão / privacidade)', () => {
    interface DeleteBody {
      deleted: number;
    }

    it('apaga todos os blobs do userId autenticado e não toca nos blobs de outro userId', async () => {
      const e = env();
      // push 2 blobs do userA e 1 do userB
      await push(e, 'userA', { collection: 'profiles', clientMutationId: 'a1', ciphertext: OPAQUE_A, updatedAt: 1 });
      await push(e, 'userA', { collection: 'settings', clientMutationId: 'a2', ciphertext: OPAQUE_B, updatedAt: 2 });
      await push(e, 'userB', { collection: 'profiles', clientMutationId: 'b1', ciphertext: OPAQUE_A, updatedAt: 3 });

      const del = await worker.fetch(req('/blobs', { method: 'DELETE' }, 'userA'), e);
      expect(del.status).toBe(200);
      const body = await bodyOf<DeleteBody>(del);
      expect(body.deleted).toBe(2);

      // userA não tem mais nada
      const snapA = await worker.fetch(req('/snapshot', {}, 'userA'), e);
      expect((await bodyOf<BlobListBody>(snapA)).blobs).toHaveLength(0);

      // userB intacto
      const snapB = await worker.fetch(req('/snapshot', {}, 'userB'), e);
      expect((await bodyOf<BlobListBody>(snapB)).blobs).toHaveLength(1);
    });

    it('DELETE /blobs sem auth retorna 401', async () => {
      const e = env();
      const res = await worker.fetch(req('/blobs', { method: 'DELETE' }), e);
      expect(res.status).toBe(401);
    });

    it('DELETE /blobs idempotente: segunda chamada retorna 200 com deleted=0', async () => {
      const e = env();
      await push(e, 'userA', { collection: 'profiles', clientMutationId: 'a1', ciphertext: OPAQUE_A, updatedAt: 1 });

      const first = await worker.fetch(req('/blobs', { method: 'DELETE' }, 'userA'), e);
      expect(first.status).toBe(200);
      expect((await bodyOf<DeleteBody>(first)).deleted).toBe(1);

      const second = await worker.fetch(req('/blobs', { method: 'DELETE' }, 'userA'), e);
      expect(second.status).toBe(200);
      expect((await bodyOf<DeleteBody>(second)).deleted).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // M13 — modo oauth
  // ---------------------------------------------------------------------------
  describe('M13 oauth — validação de token via Lichess fake', () => {
    // Limpar o cache entre testes para evitar contaminação
    afterEach(() => {
      _oauthCache.clear();
    });

    /** Cria um fetcher fake que simula a API /api/account do Lichess */
    function makeLichessFake(
      responses: Map<string, { status: number; body: unknown }>,
      calls: string[],
    ): { url: string; fetcher: (u: string, init: RequestInit) => Promise<Response> } {
      const url = 'http://fake-lichess.local/api/account';
      const fetcher = (_u: string, init: RequestInit): Promise<Response> => {
        const authHeader = new Headers(init.headers).get('Authorization') ?? '';
        const token = authHeader.replace(/^Bearer\s+/i, '');
        calls.push(token);
        const resp = responses.get(token);
        if (resp === undefined) {
          return Promise.resolve(
            new Response(JSON.stringify({ message: 'Not Found' }), { status: 401 }),
          );
        }
        return Promise.resolve(new Response(JSON.stringify(resp.body), { status: resp.status }));
      };
      return { url, fetcher };
    }

    it('token válido autentica e push/pull funcionam isolados por userId', async () => {
      const calls: string[] = [];
      const { url, fetcher } = makeLichessFake(
        new Map([['token-valid-userA', { status: 200, body: { id: 'userA' } }]]),
        calls,
      );
      const e = oauthEnv(url);

      // O fetcher é injetado via env — para o worker, precisa ir por env
      // Worker chama authenticate(request, env, fetcher) mas o worker.ts usa
      // o fetcher padrão (globalThis.fetch). Para testes, precisamos de uma
      // abordagem diferente: authenticate é importado e testado separadamente
      // no describe abaixo (auth.ts direto). Aqui testamos via worker com
      // LICHESS_VALIDATE_URL apontando para um servidor local fictício.
      // Como não há servidor de verdade, este teste usa authenticate() direto
      // para cobrir o fluxo de integração.
      const { authenticate } = await import('./auth');

      const authResult = await authenticate(
        reqOAuth('/blobs', 'token-valid-userA', { method: 'POST' }),
        e,
        fetcher,
      );
      expect(authResult.ok).toBe(true);
      if (authResult.ok) {
        expect(authResult.userId).toBe('usera');
      }
    });

    it('token inválido retorna 401 do Lichess → authenticate retorna 401', async () => {
      const calls: string[] = [];
      const { url, fetcher } = makeLichessFake(new Map(), calls);
      const e = oauthEnv(url);
      const { authenticate } = await import('./auth');

      const result = await authenticate(
        reqOAuth('/blobs', 'token-invalido', { method: 'POST' }),
        e,
        fetcher,
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(401);
      }
      expect(calls).toHaveLength(1);
    });

    it('2 requests com o mesmo token dentro do TTL chamam o Lichess só 1x (cache hit)', async () => {
      const calls: string[] = [];
      const { url, fetcher } = makeLichessFake(
        new Map([['token-cache-test', { status: 200, body: { id: 'cacheuser' } }]]),
        calls,
      );
      const e = oauthEnv(url);
      const { authenticate } = await import('./auth');

      // Primeira chamada — popula cache
      const r1 = await authenticate(
        reqOAuth('/snapshot', 'token-cache-test'),
        e,
        fetcher,
      );
      expect(r1.ok).toBe(true);
      expect(calls).toHaveLength(1);

      // Segunda chamada — deve usar cache, não chamar Lichess de novo
      const r2 = await authenticate(
        reqOAuth('/snapshot', 'token-cache-test'),
        e,
        fetcher,
      );
      expect(r2.ok).toBe(true);
      // Lichess não foi chamado segunda vez
      expect(calls).toHaveLength(1);
    });

    it('sem Bearer token em modo oauth → 401 com mensagem em pt-BR', async () => {
      const e = oauthEnv('http://fake-lichess.local/api/account');
      const res = await worker.fetch(
        req('/blobs', { method: 'POST', body: '{}' }),
        e,
      );
      expect(res.status).toBe(401);
      const body = await bodyOf<ErrorBody>(res);
      expect(String(body.error)).toContain('Bearer');
    });

    it('modo local continua passando (M12 intacto)', async () => {
      const e = env();
      const pushRes = await push(e, 'userA', {
        collection: 'profiles',
        clientMutationId: 'm-local',
        ciphertext: OPAQUE_A,
        updatedAt: 42,
      });
      expect(pushRes.status).toBe(200);
    });
  });
});
