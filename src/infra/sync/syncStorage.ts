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
  type WeaknessRecord,
} from '../storage/db';
import type { EncryptedBlob } from './crypto';
import {
  mergeSyncRecords,
  pullRecordMutations,
  pushRecordMutations,
  type SyncRecord,
  type SyncRecordMutation,
  type SyncableCollection,
} from './syncRecords';
import type { SyncClient } from './syncClient';

export interface SyncCollectionInput {
  readonly collection: SyncableCollection;
  readonly passphrase: string;
  readonly canary: EncryptedBlob;
  readonly client: SyncClient;
  readonly iterations?: number;
}

export type SyncCollectionResult =
  | {
      readonly ok: true;
      readonly pulled: number;
      readonly applied: number;
      readonly skipped: number;
      readonly pushed: number;
    }
  | { readonly ok: false; readonly reason: 'wrong-passphrase' };

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
    passphrase: input.passphrase,
    canary: input.canary,
    client: input.client,
    collection: input.collection,
  });

  if (!pulled.ok) {
    return pulled;
  }

  const merged = await mergeRemoteMutationsIntoStorage(input.collection, pulled.mutations);
  await pushRecordMutations({
    passphrase: input.passphrase,
    canary: input.canary,
    client: input.client,
    collection: input.collection,
    records: merged.records,
    iterations: input.iterations,
  });

  return {
    ok: true,
    pulled: pulled.mutations.length,
    applied: merged.applied,
    skipped: merged.skipped,
    pushed: merged.records.length,
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
