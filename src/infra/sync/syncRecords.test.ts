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

describe('mergeSyncRecords — appMeta special-merge', () => {
  const T1 = '2026-01-01T00:00:00.000Z'; // mais antigo
  const T2 = '2026-06-01T00:00:00.000Z';
  const T3 = '2026-06-27T00:00:00.000Z'; // mais recente

  function makeAppMetaMutation(
    fields: Record<string, unknown>,
    updatedAt: string = T2,
  ): SyncRecordMutation {
    return {
      v: 1,
      collection: 'appMeta',
      entityId: 'app',
      updatedAt,
      record: { id: 'app', updatedAt, ...fields },
    };
  }

  it('adoptedAt: preserva o mais antigo entre local e remoto', () => {
    const local = [{ id: 'app', updatedAt: T1, adoptedAt: T1 }];
    const remote = [makeAppMetaMutation({ adoptedAt: T2 }, T2)];

    const merged = mergeSyncRecords('appMeta', local, remote);

    expect(merged.records).toHaveLength(1);
    expect(merged.records[0]?.adoptedAt).toBe(T1);
  });

  it('adoptedAt: remoto com updatedAt maior mas SEM adoptedAt não apaga adoptedAt local', () => {
    // Este é o teste-chave: prova que o carimbo write-once não é perdido
    const local = [{ id: 'app', updatedAt: T1, adoptedAt: T1 }];
    const remote = [makeAppMetaMutation({}, T3)]; // updatedAt mais recente, sem adoptedAt

    const merged = mergeSyncRecords('appMeta', local, remote);

    expect(merged.records[0]?.adoptedAt).toBe(T1);
    expect(merged.records[0]?.updatedAt).toBe(T3); // updatedAt é o max
  });

  it('adoptedAt: quando só o remoto tem, usa o do remoto', () => {
    const local = [{ id: 'app', updatedAt: T1 }]; // sem adoptedAt
    const remote = [makeAppMetaMutation({ adoptedAt: T2 }, T2)];

    const merged = mergeSyncRecords('appMeta', local, remote);

    expect(merged.records[0]?.adoptedAt).toBe(T2);
  });

  it('onboardingCompletedAt: mais antigo não-nulo vence', () => {
    const local = [{ id: 'app', updatedAt: T3, onboardingCompletedAt: T1 }];
    const remote = [makeAppMetaMutation({ onboardingCompletedAt: T2 }, T2)];

    const merged = mergeSyncRecords('appMeta', local, remote);

    expect(merged.records[0]?.onboardingCompletedAt).toBe(T1);
  });

  it('onboardingCompletedAt: se local não tem mas remoto tem, usa remoto', () => {
    const local = [{ id: 'app', updatedAt: T1 }];
    const remote = [makeAppMetaMutation({ onboardingCompletedAt: T2 }, T2)];

    const merged = mergeSyncRecords('appMeta', local, remote);

    expect(merged.records[0]?.onboardingCompletedAt).toBe(T2);
  });

  it('errorCaptureEnabled: vem do registro com updatedAt mais recente (remoto mais novo)', () => {
    const local = [{ id: 'app', updatedAt: T1, errorCaptureEnabled: true }];
    const remote = [makeAppMetaMutation({ errorCaptureEnabled: false }, T3)];

    const merged = mergeSyncRecords('appMeta', local, remote);

    expect(merged.records[0]?.errorCaptureEnabled).toBe(false);
  });

  it('errorCaptureEnabled: vem do registro com updatedAt mais recente (local mais novo)', () => {
    const local = [{ id: 'app', updatedAt: T3, errorCaptureEnabled: true }];
    const remote = [makeAppMetaMutation({ errorCaptureEnabled: false }, T1)];

    const merged = mergeSyncRecords('appMeta', local, remote);

    expect(merged.records[0]?.errorCaptureEnabled).toBe(true);
  });

  it('updatedAt: sempre o max entre local e remoto', () => {
    const local = [{ id: 'app', updatedAt: T3 }];
    const remote = [makeAppMetaMutation({}, T2)];

    const merged = mergeSyncRecords('appMeta', local, remote);

    expect(merged.records[0]?.updatedAt).toBe(T3);
  });

  it('idempotência: merge(local, remote) aplicado duas vezes produz o mesmo resultado', () => {
    const local = [{ id: 'app', updatedAt: T1, adoptedAt: T1, errorCaptureEnabled: true }];
    const remote = [makeAppMetaMutation({ adoptedAt: T2, errorCaptureEnabled: false }, T3)];

    const first = mergeSyncRecords('appMeta', local, remote);
    // Aplica o resultado como novo "local" e o mesmo remoto novamente
    const second = mergeSyncRecords('appMeta', first.records, remote);

    expect(second.records[0]).toEqual(first.records[0]);
  });

  it('appMeta sem current local: usa mutation.record diretamente', () => {
    const remote = [makeAppMetaMutation({ adoptedAt: T1, errorCaptureEnabled: true }, T2)];

    const merged = mergeSyncRecords('appMeta', [], remote);

    expect(merged.records[0]).toMatchObject({ id: 'app', adoptedAt: T1, errorCaptureEnabled: true });
  });

  // --- consentedAt (write-once, igual adoptedAt) ---

  it('consentedAt: preserva o mais antigo entre local e remoto', () => {
    const local = [{ id: 'app', updatedAt: T1, consentedAt: T1 }];
    const remote = [makeAppMetaMutation({ consentedAt: T2 }, T2)];

    const merged = mergeSyncRecords('appMeta', local, remote);

    expect(merged.records[0]?.consentedAt).toBe(T1);
  });

  it('consentedAt: remoto com updatedAt maior mas SEM consentedAt não apaga consentedAt local', () => {
    const local = [{ id: 'app', updatedAt: T1, consentedAt: T1 }];
    const remote = [makeAppMetaMutation({}, T3)]; // updatedAt mais recente, sem consentedAt

    const merged = mergeSyncRecords('appMeta', local, remote);

    expect(merged.records[0]?.consentedAt).toBe(T1);
    expect(merged.records[0]?.updatedAt).toBe(T3);
  });

  it('consentedAt: quando só o remoto tem, usa o do remoto', () => {
    const local = [{ id: 'app', updatedAt: T1 }]; // sem consentedAt
    const remote = [makeAppMetaMutation({ consentedAt: T2 }, T2)];

    const merged = mergeSyncRecords('appMeta', local, remote);

    expect(merged.records[0]?.consentedAt).toBe(T2);
  });

  it('consentedAt: quando nenhum lado tem, resultado não contém o campo', () => {
    const local = [{ id: 'app', updatedAt: T1 }];
    const remote = [makeAppMetaMutation({}, T2)];

    const merged = mergeSyncRecords('appMeta', local, remote);

    expect(merged.records[0]).not.toHaveProperty('consentedAt');
  });

  // --- researchOptIn (toggle, igual errorCaptureEnabled) ---

  it('researchOptIn: vem do registro com updatedAt mais recente (remoto mais novo)', () => {
    const local = [{ id: 'app', updatedAt: T1, researchOptIn: true }];
    const remote = [makeAppMetaMutation({ researchOptIn: false }, T3)];

    const merged = mergeSyncRecords('appMeta', local, remote);

    expect(merged.records[0]?.researchOptIn).toBe(false);
  });

  it('researchOptIn: vem do registro com updatedAt mais recente (local mais novo)', () => {
    const local = [{ id: 'app', updatedAt: T3, researchOptIn: true }];
    const remote = [makeAppMetaMutation({ researchOptIn: false }, T1)];

    const merged = mergeSyncRecords('appMeta', local, remote);

    expect(merged.records[0]?.researchOptIn).toBe(true);
  });

  it('researchOptIn: quando nenhum lado tem, resultado não contém o campo', () => {
    const local = [{ id: 'app', updatedAt: T1 }];
    const remote = [makeAppMetaMutation({}, T2)];

    const merged = mergeSyncRecords('appMeta', local, remote);

    expect(merged.records[0]).not.toHaveProperty('researchOptIn');
  });

  it('idempotência com consentedAt e researchOptIn: merge duplo produz o mesmo resultado', () => {
    const local = [{ id: 'app', updatedAt: T1, consentedAt: T1, researchOptIn: false }];
    const remote = [makeAppMetaMutation({ consentedAt: T2, researchOptIn: true }, T3)];

    const first = mergeSyncRecords('appMeta', local, remote);
    const second = mergeSyncRecords('appMeta', first.records, remote);

    expect(second.records[0]).toEqual(first.records[0]);
    // consentedAt write-once: preserva T1 (mais antigo)
    expect(second.records[0]?.consentedAt).toBe(T1);
    // researchOptIn: T3 > T1, remoto mais recente vence
    expect(second.records[0]?.researchOptIn).toBe(true);
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
