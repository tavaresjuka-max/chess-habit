// @vitest-environment node
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { createCanary } from './passphraseCanary';
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

const FAST = { iterations: 1_000 };

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
    const canary = await createCanary('passphrase-forte', FAST);
    await pushRecordMutations({
      passphrase: 'passphrase-forte',
      canary,
      client,
      collection: 'weaknesses',
      records: [
        { id: 'fork', tag: 'fork', score: 0.8, confidence: 'high', evidence: 'remote novo', updatedAt: '2026-06-27T10:20:00.000Z' },
        { id: 'pin', tag: 'pin', score: 0.1, confidence: 'low', evidence: 'remote antigo', updatedAt: '2026-06-27T10:10:00.000Z' },
      ],
      iterations: 1_000,
    });
    const pulled = await import('./syncRecords').then((mod) =>
      mod.pullRecordMutations({ passphrase: 'passphrase-forte', canary, client, collection: 'weaknesses' }),
    );

    expect(pulled.ok).toBe(true);
    if (pulled.ok) {
      const result = await mergeRemoteMutationsIntoStorage('weaknesses', pulled.mutations);
      expect(result.applied).toBe(1);
      expect(result.skipped).toBe(1);
    }

    const records = await db.weaknesses.orderBy('id').toArray();
    expect(records).toMatchObject([
      { id: 'fork', score: 0.8, evidence: 'remote novo' },
      { id: 'pin', score: 0.9, evidence: 'local novo' },
    ]);
  });

  it('syncCollectionOnce faz pull-merge-push sem perder entidades de outro aparelho', async () => {
    const client = makeClient();
    const canary = await createCanary('passphrase-forte', FAST);
    await pushRecordMutations({
      passphrase: 'passphrase-forte',
      canary,
      client,
      collection: 'weaknesses',
      records: [
        { id: 'pin', tag: 'pin', score: 0.7, confidence: 'high', evidence: 'aparelho B', updatedAt: '2026-06-27T10:01:00.000Z' },
      ],
      iterations: 1_000,
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
      passphrase: 'passphrase-forte',
      canary,
      client,
      collection: 'weaknesses',
      iterations: 1_000,
    });

    expect(result).toMatchObject({ ok: true, pulled: 1, applied: 1, pushed: 2 });
    expect((await db.weaknesses.orderBy('id').toArray()).map((record) => record.id)).toEqual(['fork', 'pin']);
  });

  it('syncCollectionOnce não altera storage quando passphrase diverge do canary', async () => {
    const client = makeClient();
    const canary = await createCanary('passphrase-correta', FAST);
    await db.weaknesses.put({
      id: 'fork',
      tag: 'fork',
      score: 0.5,
      confidence: 'medium',
      evidence: 'local',
      updatedAt: '2026-06-27T10:00:00.000Z',
    });

    const result = await syncCollectionOnce({
      passphrase: 'errada',
      canary,
      client,
      collection: 'weaknesses',
      iterations: 1_000,
    });

    expect(result).toEqual({ ok: false, reason: 'wrong-passphrase' });
    expect(await db.weaknesses.count()).toBe(1);
  });

  // ── Ciclo crash-safe (Item C) ───────────────────────────────────────────

  it('syncCollectionOnce: pendingPush=true antes do push, =false + lastSyncedAt depois do push OK', async () => {
    const client = makeClient();
    const canary = await createCanary('passphrase-forte', FAST);
    await db.weaknesses.put({
      id: 'fork',
      tag: 'fork',
      score: 0.5,
      confidence: 'medium',
      evidence: 'local',
      updatedAt: '2026-06-27T10:00:00.000Z',
    });

    const result = await syncCollectionOnce({
      passphrase: 'passphrase-forte',
      canary,
      client,
      collection: 'weaknesses',
      iterations: 1_000,
    });

    expect(result).toMatchObject({ ok: true });
    const stateOk = await db.syncState.get('weaknesses');
    expect(stateOk).toBeDefined();
    expect(stateOk?.pendingPush).toBe(false);
    expect(stateOk?.lastSyncedAt).toBeDefined();
  });

  it('syncCollectionOnce: push interrompido → pendingPush permanece true e erro é propagado', async () => {
    const client = makeClient();
    // sobrescreve pushBlob para lançar na primeira chamada
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
    const canary = await createCanary('passphrase-forte', FAST);

    await expect(
      syncCollectionOnce({
        passphrase: 'passphrase-forte',
        canary,
        client: failClient,
        collection: 'weaknesses',
        iterations: 1_000,
      }),
    ).rejects.toThrow('network-killed');

    const stateCrash = await db.syncState.get('weaknesses');
    expect(stateCrash).toBeDefined();
    expect(stateCrash?.pendingPush).toBe(true);
    expect(stateCrash?.lastSyncedAt).toBeUndefined();
  });

  it('flushPendingPushes re-empurra coleções com pendingPush=true e limpa a flag', async () => {
    const client = makeClient();
    const canary = await createCanary('passphrase-forte', FAST);

    // Simula estado pós-crash: pendingPush=true em weaknesses
    await db.syncState.put({ collection: 'weaknesses', pendingPush: true });
    await db.weaknesses.put({
      id: 'fork',
      tag: 'fork',
      score: 0.5,
      confidence: 'medium',
      evidence: 'local',
      updatedAt: '2026-06-27T10:00:00.000Z',
    });

    const flushed = await flushPendingPushes({
      passphrase: 'passphrase-forte',
      canary,
      client,
      iterations: 1_000,
    });

    expect(flushed).toBe(1);
    const stateFlush = await db.syncState.get('weaknesses');
    expect(stateFlush?.pendingPush).toBe(false);
    // blob chegou ao cliente
    expect(client.stored.length).toBeGreaterThan(0);
  });

  it('flushPendingPushes é idempotente: 2ª chamada não re-envia (pendingPush já é false)', async () => {
    const client = makeClient();
    const canary = await createCanary('passphrase-forte', FAST);

    await db.syncState.put({ collection: 'weaknesses', pendingPush: true });
    await db.weaknesses.put({
      id: 'fork',
      tag: 'fork',
      score: 0.5,
      confidence: 'medium',
      evidence: 'local',
      updatedAt: '2026-06-27T10:00:00.000Z',
    });

    await flushPendingPushes({ passphrase: 'passphrase-forte', canary, client, iterations: 1_000 });
    const storedAfterFirst = client.stored.length;

    const flushed2 = await flushPendingPushes({
      passphrase: 'passphrase-forte',
      canary,
      client,
      iterations: 1_000,
    });

    expect(flushed2).toBe(0);
    expect(client.stored.length).toBe(storedAfterFirst); // nenhum novo blob
  });

  it('syncState não aparece em SYNCABLE_COLLECTIONS', () => {
    expect(SYNCABLE_COLLECTIONS).not.toContain('syncState');
  });
});
