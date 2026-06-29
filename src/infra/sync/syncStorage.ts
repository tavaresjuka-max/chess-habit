import type { Table } from 'dexie';
import {
  db,
  type AchievementRecord,
  type AppMetaRecord,
  type DiplomaAttemptRecord,
  type LearningLogRecord,
  type LichessStudyLinkRecord,
  type MethodTrackRecord,
  type PendingItemRecord,
  type PlacementResultRecord,
  type PlanRecord,
  type ProfileRecord,
  type SignalRecord,
  type SyncStateRecord,
  type WeaknessRecord,
} from '../storage/db';
import {
  mergeSyncRecords,
  pullRecordMutations,
  pushRecordMutations,
  SYNCABLE_COLLECTIONS,
  type SyncRecord,
  type SyncRecordMutation,
  type SyncableCollection,
} from './syncRecords';
import { SyncUnauthorizedError, type SyncClient } from './syncClient';

export interface SyncCollectionInput {
  readonly collection: SyncableCollection;
  readonly client: SyncClient;
}

export interface FlushPendingPushesInput {
  readonly client: SyncClient;
}

export type SyncCollectionResult = {
  readonly ok: true;
  readonly pulled: number;
  readonly applied: number;
  readonly skipped: number;
  readonly pushed: number;
};

export interface SyncAllInput {
  readonly client: SyncClient;
  readonly iterations?: number;
}

export interface SyncAllCollectionEntry {
  readonly collection: SyncableCollection;
  readonly pulled: number;
  readonly applied: number;
  readonly pushed: number;
  readonly error?: string;
}

export type SyncAllResult =
  | {
      readonly ok: true;
      readonly perCollection: readonly SyncAllCollectionEntry[];
      readonly totals: {
        readonly pushed: number;
        readonly applied: number;
        readonly collectionsOk: number;
        readonly collectionsFailed: number;
      };
    }
  | {
      readonly ok: false;
      readonly reason: 'unauthorized';
    };

// ── Helpers de estado local de sync ─────────────────────────────────────────

/** Lê o registro de estado de sync para uma coleção (undefined se inexistente). */
export async function loadSyncState(collection: string): Promise<SyncStateRecord | undefined> {
  return db.syncState.get(collection);
}

/**
 * Persiste pendingPush para a coleção.
 * Quando pendingPush=false, grava também lastSyncedAt (timestamp ISO).
 * Quando pendingPush=true, preserva lastSyncedAt anterior (não limpa).
 */
export async function setPendingPush(
  collection: string,
  pendingPush: boolean,
  lastSyncedAt?: string,
): Promise<void> {
  if (pendingPush) {
    // Mantém lastSyncedAt anterior; só atualiza o flag.
    const existing = await db.syncState.get(collection);
    await db.syncState.put({
      collection,
      pendingPush: true,
      lastSyncedAt: existing?.lastSyncedAt,
    });
  } else {
    await db.syncState.put({
      collection,
      pendingPush: false,
      lastSyncedAt,
    });
  }
}

export async function loadSyncRecords(collection: SyncableCollection): Promise<SyncRecord[]> {
  switch (collection) {
    case 'profile':
      return toSyncRecords(await db.profile.toArray());
    case 'plans':
      return toSyncRecords(await db.plans.toArray());
    case 'logs':
      return toSyncRecords(await db.logs.toArray());
    case 'signals':
      return toSyncRecords(await db.signals.toArray());
    case 'weaknesses':
      return toSyncRecords(await db.weaknesses.toArray());
    case 'methodTracks':
      return toSyncRecords(await db.methodTracks.toArray());
    case 'pendingItems':
      return toSyncRecords(await db.pendingItems.toArray());
    case 'diplomaAttempts':
      return toSyncRecords(await db.diplomaAttempts.toArray());
    case 'achievements':
      return toSyncRecords(await db.achievements.toArray());
    case 'placementResults':
      return toSyncRecords(await db.placementResults.toArray());
    case 'lichessStudies':
      return toSyncRecords(await db.lichessStudies.toArray());
    case 'appMeta':
      return toSyncRecords(await db.appMeta.toArray());
  }
}

export async function replaceSyncRecords(
  collection: SyncableCollection,
  records: readonly SyncRecord[],
): Promise<void> {
  switch (collection) {
    case 'profile':
      await replaceTable(db.profile, records);
      return;
    case 'plans':
      await replaceTable(db.plans, records);
      return;
    case 'logs':
      await replaceTable(db.logs, records);
      return;
    case 'signals':
      await replaceTable(db.signals, records);
      return;
    case 'weaknesses':
      await replaceTable(db.weaknesses, records);
      return;
    case 'methodTracks':
      await replaceTable(db.methodTracks, records);
      return;
    case 'pendingItems':
      await replaceTable(db.pendingItems, records);
      return;
    case 'diplomaAttempts':
      await replaceTable(db.diplomaAttempts, records);
      return;
    case 'achievements':
      await replaceTable(db.achievements, records);
      return;
    case 'placementResults':
      await replaceTable(db.placementResults, records);
      return;
    case 'lichessStudies':
      await replaceTable(db.lichessStudies, records);
      return;
    case 'appMeta':
      await replaceTable(db.appMeta, records);
      return;
  }
}

export async function mergeRemoteMutationsIntoStorage(
  collection: SyncableCollection,
  remoteMutations: readonly SyncRecordMutation[],
): Promise<{ readonly applied: number; readonly skipped: number; readonly records: readonly SyncRecord[] }> {
  const local = await loadSyncRecords(collection);
  const merged = mergeSyncRecords(collection, local, remoteMutations);
  await replaceSyncRecords(collection, merged.records);
  return merged;
}

export async function syncCollectionOnce(input: SyncCollectionInput): Promise<SyncCollectionResult> {
  const pulled = await pullRecordMutations({
    client: input.client,
    collection: input.collection,
  });

  const merged = await mergeRemoteMutationsIntoStorage(input.collection, pulled.mutations);

  // Marca pendingPush ANTES do push: se o processo for interrompido (crash,
  // kill em background) entre aqui e o fim do push, flushPendingPushes pode
  // re-empurrar na próxima sessão.
  await setPendingPush(input.collection, true);

  await pushRecordMutations({
    client: input.client,
    collection: input.collection,
    records: merged.records,
  });

  // Push concluído com sucesso: limpa a flag e registra o horário.
  await setPendingPush(input.collection, false, new Date().toISOString());

  return {
    ok: true,
    pulled: pulled.mutations.length,
    applied: merged.applied,
    skipped: merged.skipped,
    pushed: merged.records.length,
  };
}

/**
 * Re-empurra todas as coleções que ficaram com pendingPush=true (interrupção
 * anterior). Idempotente: pushRecordMutations usa clientMutationId para evitar
 * duplicatas no backend.
 *
 * Não falha tudo se uma coleção falhar — registra e continua.
 * Retorna o número de coleções que foram re-enviadas com sucesso.
 */
export async function flushPendingPushes(input: FlushPendingPushesInput): Promise<number> {
  let flushed = 0;

  for (const collection of SYNCABLE_COLLECTIONS) {
    const state = await db.syncState.get(collection);
    if (!state?.pendingPush) continue;

    try {
      const records = await loadSyncRecords(collection);
      await pushRecordMutations({
        client: input.client,
        collection,
        records,
      });
      await setPendingPush(collection, false, new Date().toISOString());
      flushed += 1;
    } catch {
      // Mantém pendingPush=true; será retentado na próxima chamada.
    }
  }

  return flushed;
}

/**
 * Sincroniza TODAS as coleções de uma vez contra o backend.
 *
 * - Itera SYNCABLE_COLLECTIONS chamando syncCollectionOnce para cada uma.
 * - Se uma coleção falhar (throw ou !ok), registra o erro e continua as demais.
 * - Se qualquer coleção lançar SyncUnauthorizedError (401), propaga imediatamente
 *   como { ok: false, reason: 'unauthorized' } — o login precisa ser refeito.
 * - Ao final chama flushPendingPushes para recuperar pushes interrompidos.
 * - Retorna o agregado: totais e resultado por coleção.
 */
export async function syncAllCollections(input: SyncAllInput): Promise<SyncAllResult> {
  const perCollection: SyncAllCollectionEntry[] = [];

  for (const collection of SYNCABLE_COLLECTIONS) {
    try {
      const result = await syncCollectionOnce({ collection, client: input.client });
      perCollection.push({
        collection,
        pulled: result.pulled,
        applied: result.applied,
        pushed: result.pushed,
      });
    } catch (err) {
      // 401 propaga imediatamente — token inválido, não adianta continuar
      if (err instanceof SyncUnauthorizedError) {
        return { ok: false, reason: 'unauthorized' };
      }
      // Qualquer outro erro: registra e continua as demais coleções
      perCollection.push({
        collection,
        pulled: 0,
        applied: 0,
        pushed: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Flush de pendências de syncs anteriores interrompidos
  await flushPendingPushes({ client: input.client });

  const collectionsOk = perCollection.filter((c) => c.error === undefined).length;
  const collectionsFailed = perCollection.filter((c) => c.error !== undefined).length;
  const pushed = perCollection.reduce((sum, c) => sum + c.pushed, 0);
  const applied = perCollection.reduce((sum, c) => sum + c.applied, 0);

  return {
    ok: true,
    perCollection,
    totals: { pushed, applied, collectionsOk, collectionsFailed },
  };
}

type SyncRecordTable =
  | Table<ProfileRecord, string>
  | Table<PlanRecord, string>
  | Table<LearningLogRecord, string>
  | Table<SignalRecord, string>
  | Table<WeaknessRecord, string>
  | Table<MethodTrackRecord, string>
  | Table<PendingItemRecord, string>
  | Table<DiplomaAttemptRecord, string>
  | Table<AchievementRecord, string>
  | Table<PlacementResultRecord, string>
  | Table<LichessStudyLinkRecord, string>
  | Table<AppMetaRecord, string>;

async function replaceTable(table: SyncRecordTable, records: readonly SyncRecord[]): Promise<void> {
  const syncTable = table as unknown as Table<SyncRecord, string>;

  await db.transaction('rw', syncTable, async () => {
    await syncTable.clear();
    if (records.length > 0) {
      await syncTable.bulkPut([...records]);
    }
  });
}

function toSyncRecords(records: readonly object[]): SyncRecord[] {
  return records.map((record) => record as SyncRecord);
}
