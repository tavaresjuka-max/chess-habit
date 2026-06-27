// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createCanary } from './passphraseCanary';
import {
  isSyncableCollection,
  mergeSyncRecords,
  mutationClientId,
  parseSyncRecordMutation,
  pullRecordMutations,
  pushRecordMutations,
  recordsToSyncMutations,
  SYNCABLE_COLLECTIONS,
  SyncRecordError,
  type SyncRecordMutation,
} from './syncRecords';
import type { PushBlobInput, StoredBlob, SyncClient } from './syncClient';

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

describe('syncRecords allowlist', () => {
  it('allowlist sincroniza apenas dados locais não-sensíveis', () => {
    expect(SYNCABLE_COLLECTIONS).toEqual([
      'profile',
      'plans',
      'logs',
      'signals',
      'weaknesses',
      'methodTracks',
      'pendingItems',
      'diplomaAttempts',
      'achievements',
      'placementResults',
      'lichessStudies',
      'appMeta',
    ]);
    expect(isSyncableCollection('lichessOAuthTokens')).toBe(false);
    expect(isSyncableCollection('chesscomMonthSignals')).toBe(false);
    expect(isSyncableCollection('backupMeta')).toBe(false);
    expect(isSyncableCollection('autoBackup')).toBe(false);
  });

  it('recusa mutation fora da allowlist', () => {
    expect(() =>
      parseSyncRecordMutation({
        v: 1,
        collection: 'lichessOAuthTokens',
        entityId: 'lichess',
        updatedAt: '2026-06-27T00:00:00.000Z',
        record: { id: 'lichess', accessToken: 'secret-token', updatedAt: '2026-06-27T00:00:00.000Z' },
      }),
    ).toThrow(SyncRecordError);
  });
});

describe('recordsToSyncMutations', () => {
  it('usa date como entityId de plans e maior timestamp interno como updatedAt', () => {
    const [mutation] = recordsToSyncMutations('plans', [
      {
        date: '2026-06-27',
        generatedFromWeaknessesAt: '2026-06-27T10:00:00.000Z',
        blocks: [
          { id: 'b1', updatedAt: '2026-06-27T12:00:00.000Z' },
          { id: 'b2', updatedAt: '2026-06-27T11:00:00.000Z' },
        ],
      },
    ]);

    expect(mutation?.entityId).toBe('2026-06-27');
    expect(mutation?.updatedAt).toBe('2026-06-27T12:00:00.000Z');
  });

  it('gera clientMutationId determinístico por entidade, timestamp e conteúdo', () => {
    const [mutation] = recordsToSyncMutations('weaknesses', [
      { id: 'fork', tag: 'fork', updatedAt: '2026-06-27T00:00:00.000Z' },
    ]);

    expect(mutation).toBeDefined();
    expect(mutationClientId(mutation as SyncRecordMutation)).toBe(
      mutationClientId(mutation as SyncRecordMutation),
    );
    expect(mutationClientId(mutation as SyncRecordMutation)).toContain('weaknesses:');
    expect(mutationClientId(mutation as SyncRecordMutation)).not.toContain('fork');
  });

  it('falha quando updatedAt não é parseável', () => {
    expect(() =>
      recordsToSyncMutations('weaknesses', [{ id: 'fork', tag: 'fork', updatedAt: 'ontem' }]),
    ).toThrow(/timestamp invalido/i);
  });
});

describe('mergeSyncRecords', () => {
  it('merge de dois aparelhos com entidades diferentes preserva ambas', () => {
    const local = [{ id: 'a', updatedAt: '2026-06-27T10:00:00.000Z', value: 'A' }];
    const remote = recordsToSyncMutations('weaknesses', [
      { id: 'b', updatedAt: '2026-06-27T10:01:00.000Z', value: 'B' },
    ]);

    const merged = mergeSyncRecords('weaknesses', local, remote);

    expect(merged.records).toHaveLength(2);
    expect(merged.records.map((record) => record.id).sort()).toEqual(['a', 'b']);
    expect(merged.applied).toBe(1);
  });

  it('LWW aplica remoto mais novo para mesma entidade', () => {
    const local = [{ id: 'fork', updatedAt: '2026-06-27T10:00:00.000Z', score: 0.2 }];
    const remote = recordsToSyncMutations('weaknesses', [
      { id: 'fork', updatedAt: '2026-06-27T10:05:00.000Z', score: 0.8 },
    ]);

    const merged = mergeSyncRecords('weaknesses', local, remote);

    expect(merged.records).toEqual([
      { id: 'fork', updatedAt: '2026-06-27T10:05:00.000Z', score: 0.8 },
    ]);
  });

  it('LWW mantém local mais novo para mesma entidade', () => {
    const local = [{ id: 'fork', updatedAt: '2026-06-27T10:10:00.000Z', score: 0.9 }];
    const remote = recordsToSyncMutations('weaknesses', [
      { id: 'fork', updatedAt: '2026-06-27T10:05:00.000Z', score: 0.8 },
    ]);

    const merged = mergeSyncRecords('weaknesses', local, remote);

    expect(merged.records).toEqual(local);
    expect(merged.skipped).toBe(1);
  });

  it('tombstone remoto mais novo vence update local antigo', () => {
    const local = [{ id: 'fork', updatedAt: '2026-06-27T10:00:00.000Z', score: 0.9 }];
    const remote = recordsToSyncMutations('weaknesses', [
      {
        id: 'fork',
        updatedAt: '2026-06-27T10:20:00.000Z',
        deletedAt: '2026-06-27T10:20:00.000Z',
        score: 0.9,
      },
    ]);

    const merged = mergeSyncRecords('weaknesses', local, remote);

    expect(merged.records[0]?.deletedAt).toBe('2026-06-27T10:20:00.000Z');
  });

  it('tombstone remoto antigo não ressuscita por cima de recriação local mais nova', () => {
    const local = [{ id: 'fork', updatedAt: '2026-06-27T10:30:00.000Z', score: 0.4 }];
    const remote = recordsToSyncMutations('weaknesses', [
      {
        id: 'fork',
        updatedAt: '2026-06-27T10:20:00.000Z',
        deletedAt: '2026-06-27T10:20:00.000Z',
        score: 0.9,
      },
    ]);

    const merged = mergeSyncRecords('weaknesses', local, remote);

    expect(merged.records).toEqual(local);
  });
});

describe('round-trip E2EE por mutation', () => {
  it('push cifra cada entidade como blob independente e pull decifra para mutations', async () => {
    const client = makeClient();
    const canary = await createCanary('passphrase-forte', FAST);

    await pushRecordMutations({
      passphrase: 'passphrase-forte',
      canary,
      client,
      collection: 'weaknesses',
      records: [
        { id: 'fork', tag: 'fork', updatedAt: '2026-06-27T10:00:00.000Z', score: 0.5 },
        { id: 'pin', tag: 'pin', updatedAt: '2026-06-27T10:01:00.000Z', score: 0.7 },
      ],
      iterations: 1_000,
    });

    expect(client.stored).toHaveLength(2);
    expect(JSON.stringify(client.stored)).not.toContain('fork');
    expect(JSON.stringify(client.stored)).not.toContain('pin');

    const pulled = await pullRecordMutations({
      passphrase: 'passphrase-forte',
      canary,
      client,
      collection: 'weaknesses',
    });

    expect(pulled.ok).toBe(true);
    if (pulled.ok) {
      expect(pulled.mutations.map((mutation) => mutation.entityId).sort()).toEqual(['fork', 'pin']);
    }
  });

  it('passphrase errada barra pull antes de aplicar merge', async () => {
    const client = makeClient();
    const canary = await createCanary('passphrase-correta', FAST);

    const pulled = await pullRecordMutations({
      passphrase: 'errada',
      canary,
      client,
      collection: 'weaknesses',
    });

    expect(pulled).toEqual({ ok: false, reason: 'wrong-passphrase' });
  });
});
