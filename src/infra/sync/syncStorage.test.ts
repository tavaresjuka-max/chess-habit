// @vitest-environment node
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { pushRecordMutations, SYNCABLE_COLLECTIONS } from './syncRecords';
import {
  flushPendingPushes,
  loadSyncRecords,
  mergeRemoteMutationsIntoStorage,
  syncCollectionOnce,
} from './syncStorage';
import type { PushBlobInput, StoredBlob, SyncClient } from './syncClient';
import { clearAll } from '../storage/appData';
import { db } from '../storage/db';

function makeClient(): SyncClient & { stored: StoredBlob[] } {
  const stored: StoredBlob[] = [];

  return {
    stored,
    health() {
      return Promise.resolve({ ok: true });
    },
    pushBlob(input: PushBlobInput) {
      stored.push({ ...input });
      return Promise.resolve();
    },
    listBlobs(collection: string) {
      return Promise.resolve(stored.filter((blob) => blob.collection === collection));
    },
    snapshot() {
      return Promise.resolve([...stored]);
    },
  };
}

afterEach(async () => {
  await clearAll();
});

describe('syncStorage', () => {
  it('loadSyncRecords não inclui tabelas sensíveis fora da allowlist', async () => {
    await db.lichessOAuthTokens.put({
      id: 'lichess',
      accessToken: 'secret-token',
      tokenType: 'Bearer',
      scopes: ['puzzle:read'],
      obtainedAt: '2026-06-27T00:00:00.000Z',
      expiresAt: '2026-06-28T00:00:00.000Z',
    });
    await db.chesscomMonthSignals.put({
      id: 'chesscom:jukasparov:2026-06',
      username: 'jukasparov',
      archiveUrl: 'https://api.chess.com/pub/player/jukasparov/games/2026/06',
      signals: [],
      updatedAt: '2026-06-27T00:00:00.000Z',
      expiresAt: '2026-07-27T00:00:00.000Z',
    });

    expect(await loadSyncRecords('profile')).toEqual([]);
    expect(JSON.stringify(await loadSyncRecords('profile'))).not.toContain('secret-token');
  });

  it('mergeRemoteMutationsIntoStorage aplica remote mais novo e preserva local mais novo', async () => {
    await db.weaknesses.bulkPut([
      { id: 'fork', tag: 'fork', score: 0.2, confidence: 'medium', evidence: 'local antigo', updatedAt: '2026-06-27T10:00:00.000Z' },
      { id: 'pin', tag: 'pin', score: 0.9, confidence: 'high', evidence: 'local novo', updatedAt: '2026-06-27T10:30:00.000Z' },
    ]);
    const client = makeClient();
    await pushRecordMutations({
      client,
      collection: 'weaknesses',
      records: [
        { id: 'fork', tag: 'fork', score: 0.8, confidence: 'high', evidence: 'remote novo', updatedAt: '2026-06-27T10:20:00.000Z' },
        { id: 'pin', tag: 'pin', score: 0.1, confidence: 'low', evidence: 'remote antigo', updatedAt: '2026-06-27T10:10:00.000Z' },
      ],
    });
    const pulled = await import('./syncRecords').then((mod) =>
      mod.pullRecordMutations({ client, collection: 'weaknesses' }),
    );

    expect(pulled.ok).toBe(true);
    const result = await mergeRemoteMutationsIntoStorage('weaknesses', pulled.mutations);
    expect(result.applied).toBe(1);
    expect(result.skipped).toBe(1);

    const records = await db.weaknesses.orderBy('id').toArray();
    expect(records).toMatchObject([
      { id: 'fork', score: 0.8, evidence: 'remote novo' },
      { id: 'pin', score: 0.9, evidence: 'local novo' },
    ]);
  });

  it('syncCollectionOnce faz pull-merge-push sem perder entidades de outro aparelho', async () => {
    const client = makeClient();
    await pushRecordMutations({
      client,
      collection: 'weaknesses',
      records: [
        { id: 'pin', tag: 'pin', score: 0.7, confidence: 'high', evidence: 'aparelho B', updatedAt: '2026-06-27T10:01:00.000Z' },
      ],
    });
    await db.weaknesses.put({
      id: 'fork',
      tag: 'fork',
      score: 0.5,
      confidence: 'medium',
      evidence: 'aparelho A',
      updatedAt: '2026-06-27T10:00:00.000Z',
    });

    const result = await syncCollectionOnce({
      client,
      collection: 'weaknesses',
    });

    expect(result).toMatchObject({ ok: true, pulled: 1, applied: 1, pushed: 2 });
    expect((await db.weaknesses.orderBy('id').toArray()).map((record) => record.id)).toEqual(['fork', 'pin']);
  });

  // ── Ciclo crash-safe ─────────────────────────────────────────────────────

  it('syncCollectionOnce: pendingPush=true antes do push, =false + lastSyncedAt depois do push OK', async () => {
    const client = makeClient();
    await db.weaknesses.put({
      id: 'fork',
      tag: 'fork',
      score: 0.5,
      confidence: 'medium',
      evidence: 'local',
      updatedAt: '2026-06-27T10:00:00.000Z',
    });

    const result = await syncCollectionOnce({ client, collection: 'weaknesses' });

    expect(result).toMatchObject({ ok: true });
    const stateOk = await db.syncState.get('weaknesses');
    expect(stateOk).toBeDefined();
    expect(stateOk?.pendingPush).toBe(false);
    expect(stateOk?.lastSyncedAt).toBeDefined();
  });

  it('syncCollectionOnce: push interrompido → pendingPush permanece true e erro é propagado', async () => {
    const client = makeClient();
    const pushError = new Error('network-killed');
    let callCount = 0;
    const failClient: SyncClient & { stored: StoredBlob[] } = {
      ...client,
      pushBlob(blobInput: PushBlobInput) {
        void blobInput;
        callCount += 1;
        if (callCount === 1) return Promise.reject(pushError);
        return Promise.resolve();
      },
    };

    await db.weaknesses.put({
      id: 'fork',
      tag: 'fork',
      score: 0.5,
      confidence: 'medium',
      evidence: 'local',
      updatedAt: '2026-06-27T10:00:00.000Z',
    });

    await expect(
      syncCollectionOnce({ client: failClient, collection: 'weaknesses' }),
    ).rejects.toThrow('network-killed');

    const stateCrash = await db.syncState.get('weaknesses');
    expect(stateCrash).toBeDefined();
    expect(stateCrash?.pendingPush).toBe(true);
    expect(stateCrash?.lastSyncedAt).toBeUndefined();
  });

  it('flushPendingPushes re-empurra coleções com pendingPush=true e limpa a flag', async () => {
    const client = makeClient();

    await db.syncState.put({ collection: 'weaknesses', pendingPush: true });
    await db.weaknesses.put({
      id: 'fork',
      tag: 'fork',
      score: 0.5,
      confidence: 'medium',
      evidence: 'local',
      updatedAt: '2026-06-27T10:00:00.000Z',
    });

    const flushed = await flushPendingPushes({ client });

    expect(flushed).toBe(1);
    const stateFlush = await db.syncState.get('weaknesses');
    expect(stateFlush?.pendingPush).toBe(false);
    expect(client.stored.length).toBeGreaterThan(0);
  });

  it('flushPendingPushes é idempotente: 2ª chamada não re-envia (pendingPush já é false)', async () => {
    const client = makeClient();

    await db.syncState.put({ collection: 'weaknesses', pendingPush: true });
    await db.weaknesses.put({
      id: 'fork',
      tag: 'fork',
      score: 0.5,
      confidence: 'medium',
      evidence: 'local',
      updatedAt: '2026-06-27T10:00:00.000Z',
    });

    await flushPendingPushes({ client });
    const storedAfterFirst = client.stored.length;

    const flushed2 = await flushPendingPushes({ client });

    expect(flushed2).toBe(0);
    expect(client.stored.length).toBe(storedAfterFirst);
  });

  it('os blobs armazenados contêm JSON legível (plaintext, não cifrado)', async () => {
    const client = makeClient();
    await db.weaknesses.put({
      id: 'fork',
      tag: 'fork',
      score: 0.5,
      confidence: 'medium',
      evidence: 'teste-plaintext',
      updatedAt: '2026-06-27T10:00:00.000Z',
    });

    await syncCollectionOnce({ client, collection: 'weaknesses' });

    // O ciphertext deve ser JSON legível contendo o conteúdo da mutation
    expect(client.stored.length).toBeGreaterThan(0);
    const firstBlob = client.stored[0];
    expect(firstBlob).toBeDefined();
    const parsed = JSON.parse(firstBlob?.ciphertext ?? '{}') as unknown;
    expect(typeof parsed).toBe('object');
    // Deve ser uma SyncRecordMutation com v:1
    expect((parsed as Record<string, unknown>)['v']).toBe(1);
    // NÃO deve ter envelope E2EE
    expect((parsed as Record<string, unknown>)['kdf']).toBeUndefined();
    expect((parsed as Record<string, unknown>)['salt']).toBeUndefined();
  });

  it('syncState não aparece em SYNCABLE_COLLECTIONS', () => {
    expect(SYNCABLE_COLLECTIONS).not.toContain('syncState');
  });
});
