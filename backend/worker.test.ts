import { describe, expect, it } from 'vitest';
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
  return { DB: createFakeD1(), SYNC_AUTH_MODE: 'local', ...overrides };
}

function req(path: string, init: RequestInit = {}, userId?: string): Request {
  const headers = new Headers(init.headers);
  if (userId) headers.set('x-sync-user', userId);
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

describe('rotina-sync worker (P4 M12 local-only)', () => {
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

  it('rejeita (501) quando SYNC_AUTH_MODE nao e local - default production-safe', async () => {
    const res = await worker.fetch(
      req('/blobs', { method: 'POST', body: '{}' }, 'userA'),
      env({ SYNC_AUTH_MODE: 'oauth' }),
    );
    expect(res.status).toBe(501);
    const body = await bodyOf<ErrorBody>(res);
    expect(String(body.error)).toContain('M13');
  });

  it('rejeita (501) quando SYNC_AUTH_MODE esta ausente', async () => {
    const res = await worker.fetch(
      req('/blobs', { method: 'POST', body: '{}' }, 'userA'),
      env({ SYNC_AUTH_MODE: undefined }),
    );
    expect(res.status).toBe(501);
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

  describe('DELETE /blobs — exclusão de conta (direito de exclusão AGPL)', () => {
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
});
