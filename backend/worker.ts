import { authenticate } from './auth';
import { deleteAllBlobs, listBlobs, ping, snapshot, upsertBlob } from './store';
import type { PushBlobRequest, SyncEnv } from './types';

const SERVICE = 'rotina-sync';
const VERSION = '0.1.0-local';
const DEFAULT_MAX_BLOB_BYTES = 256 * 1024;
const MAX_REQUEST_BYTES = 2 * 1024 * 1024;

const COLLECTION_RE = /^[a-zA-Z0-9_-]{1,64}$/;
const MUTATION_ID_RE = /^[\s\S]{1,128}$/;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function maxBlobBytes(env: SyncEnv): number {
  const parsed = Number.parseInt(env.SYNC_MAX_BLOB_BYTES ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_BLOB_BYTES;
}

function validatePush(
  payload: unknown,
  env: SyncEnv,
): PushBlobRequest | { error: string } {
  if (typeof payload !== 'object' || payload === null) {
    return { error: 'body must be a JSON object.' };
  }
  const p = payload as Record<string, unknown>;
  const collection = p['collection'];
  const clientMutationId = p['clientMutationId'];
  const ciphertext = p['ciphertext'];
  const updatedAt = p['updatedAt'];

  if (typeof collection !== 'string' || !COLLECTION_RE.test(collection)) {
    return { error: 'collection must match ^[a-zA-Z0-9_-]{1,64}$.' };
  }
  if (typeof clientMutationId !== 'string' || !MUTATION_ID_RE.test(clientMutationId)) {
    return { error: 'clientMutationId must be a string of 1..128 chars.' };
  }
  if (typeof ciphertext !== 'string' || ciphertext.length === 0) {
    return { error: 'ciphertext must be a non-empty string.' };
  }
  if (ciphertext.length > maxBlobBytes(env)) {
    return { error: 'ciphertext exceeds SYNC_MAX_BLOB_BYTES.' };
  }
  if (typeof updatedAt !== 'number' || !Number.isFinite(updatedAt) || updatedAt < 0) {
    return { error: 'updatedAt must be a finite non-negative number.' };
  }
  return { collection, clientMutationId, ciphertext, updatedAt };
}

async function handleHealth(env: SyncEnv): Promise<Response> {
  const dbUp = await ping(env.DB);
  return json(200, {
    ok: dbUp,
    service: SERVICE,
    version: VERSION,
    mode: env.SYNC_AUTH_MODE ?? 'unset',
    db: dbUp ? 'up' : 'down',
    time: Date.now(),
  });
}

async function handlePush(request: Request, env: SyncEnv, userId: string): Promise<Response> {
  const text = await request.text();
  if (text.length > MAX_REQUEST_BYTES) {
    return json(413, { error: 'request body too large.' });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return json(400, { error: 'invalid JSON body.' });
  }
  const validated = validatePush(payload, env);
  if ('error' in validated) {
    return json(400, { error: validated.error });
  }
  await upsertBlob(env.DB, {
    userId,
    collection: validated.collection,
    clientMutationId: validated.clientMutationId,
    ciphertext: validated.ciphertext,
    updatedAt: validated.updatedAt,
  });
  return json(200, {
    ok: true,
    userId,
    collection: validated.collection,
    clientMutationId: validated.clientMutationId,
  });
}

async function handleList(request: Request, env: SyncEnv, userId: string): Promise<Response> {
  const url = new URL(request.url);
  const collection = url.searchParams.get('collection') ?? '';
  if (!COLLECTION_RE.test(collection)) {
    return json(400, { error: 'query param collection is required.' });
  }
  const blobs = await listBlobs(env.DB, userId, collection);
  return json(200, { userId, collection, blobs });
}

async function handleSnapshot(env: SyncEnv, userId: string): Promise<Response> {
  const blobs = await snapshot(env.DB, userId);
  return json(200, { userId, blobs });
}

async function handleDelete(env: SyncEnv, userId: string): Promise<Response> {
  const deleted = await deleteAllBlobs(env.DB, userId);
  return json(200, { ok: true, userId, deleted });
}

export default {
  async fetch(request: Request, env: SyncEnv): Promise<Response> {
    try {
      const url = new URL(request.url);
      const method = request.method.toUpperCase();
      const path = url.pathname.replace(/\/+$/, '') || '/';

      if (method === 'GET' && path === '/health') {
        return await handleHealth(env);
      }

      const auth = await authenticate(request, env);
      if (!auth.ok) {
        return json(auth.status, { error: auth.error });
      }
      const userId = auth.userId;

      if (method === 'POST' && path === '/blobs') {
        return await handlePush(request, env, userId);
      }
      if (method === 'GET' && path === '/blobs') {
        return await handleList(request, env, userId);
      }
      if (method === 'DELETE' && path === '/blobs') {
        return await handleDelete(env, userId);
      }
      if (method === 'GET' && path === '/snapshot') {
        return await handleSnapshot(env, userId);
      }
      return json(404, { error: 'not found.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'internal error';
      return json(500, { error: message });
    }
  },
};
