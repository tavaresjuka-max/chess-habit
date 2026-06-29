import { pullBlobs, pushBlob, type PulledItem } from './syncEngine';
import type { SyncClient } from './syncClient';

export const SYNCABLE_COLLECTIONS = [
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
] as const;

export type SyncableCollection = (typeof SYNCABLE_COLLECTIONS)[number];

export interface SyncRecord {
  readonly [key: string]: unknown;
}

export interface SyncRecordMutation {
  readonly v: 1;
  readonly collection: SyncableCollection;
  readonly entityId: string;
  readonly updatedAt: string;
  readonly deletedAt?: string;
  readonly record: SyncRecord;
}

export interface PushRecordMutationsInput {
  readonly client: SyncClient;
  readonly collection: SyncableCollection;
  readonly records: readonly SyncRecord[];
}

export interface PullRecordMutationsInput {
  readonly client: SyncClient;
  readonly collection?: SyncableCollection;
}

export interface PullRecordMutationsOk {
  readonly ok: true;
  readonly mutations: readonly SyncRecordMutation[];
}

export type PullRecordMutationsResult = PullRecordMutationsOk;

export interface MergeResult {
  readonly records: readonly SyncRecord[];
  readonly applied: number;
  readonly skipped: number;
}

export class SyncRecordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SyncRecordError';
  }
}

const SYNCABLE_COLLECTION_SET = new Set<string>(SYNCABLE_COLLECTIONS);
const ENTITY_ID_KEYS: Record<SyncableCollection, string> = {
  profile: 'id',
  plans: 'date',
  logs: 'id',
  signals: 'id',
  weaknesses: 'id',
  methodTracks: 'id',
  pendingItems: 'id',
  diplomaAttempts: 'id',
  achievements: 'id',
  placementResults: 'id',
  lichessStudies: 'id',
  appMeta: 'id',
};

export function isSyncableCollection(value: string): value is SyncableCollection {
  return SYNCABLE_COLLECTION_SET.has(value);
}

export function toSyncRecordMutation(
  collection: SyncableCollection,
  record: SyncRecord,
): SyncRecordMutation {
  const entityId = readString(record, ENTITY_ID_KEYS[collection], `${collection} entity id`);
  const updatedAt = getRecordUpdatedAt(collection, record);
  const deletedAt = readOptionalString(record, 'deletedAt');

  return {
    v: 1,
    collection,
    entityId,
    updatedAt,
    ...(deletedAt === undefined ? {} : { deletedAt }),
    record,
  };
}

export function recordsToSyncMutations(
  collection: SyncableCollection,
  records: readonly SyncRecord[],
): readonly SyncRecordMutation[] {
  return records.map((record) => toSyncRecordMutation(collection, record));
}

export function mutationClientId(mutation: SyncRecordMutation): string {
  return [
    mutation.collection,
    stableHash(mutation.entityId),
    String(toEpochMs(mutation.updatedAt)),
    mutation.deletedAt === undefined ? 'upsert' : 'delete',
    stableHash(canonicalJson(mutation.record)),
  ].join(':');
}

export async function pushRecordMutations(input: PushRecordMutationsInput): Promise<void> {
  const mutations = recordsToSyncMutations(input.collection, input.records);

  for (const mutation of mutations) {
    await pushBlob({
      client: input.client,
      collection: input.collection,
      clientMutationId: mutationClientId(mutation),
      value: mutation,
      updatedAt: toEpochMs(mutation.updatedAt),
    });
  }
}

export async function pullRecordMutations(
  input: PullRecordMutationsInput,
): Promise<PullRecordMutationsResult> {
  const pulled = await pullBlobs(input);

  return {
    ok: true,
    mutations: pulled.items.map(parsePulledMutation),
  };
}

/**
 * Field-merge para appMeta: cada campo tem semântica própria (write-once, toggle, etc.).
 * appMeta é a exceção segura ao LWW de registro inteiro — ver docs/architecture/SYNC-HARDENING.md
 * para entender por que SM-2/plans NÃO recebem o mesmo tratamento (campos interdependentes).
 *
 * Regras por campo:
 *   - adoptedAt: min (mais antigo não-nulo) — write-once, nunca apaga se algum lado tem.
 *   - onboardingCompletedAt: min não-nulo — mesma lógica de write-once.
 *   - errorCaptureEnabled: do registro com updatedAt mais recente (preferência = quem decidiu por último).
 *   - consentedAt: min não-nulo — write-once, igual adoptedAt. O consentimento mais antigo prevalece.
 *   - researchOptIn: do registro com updatedAt mais recente (toggle, igual errorCaptureEnabled).
 *   - updatedAt: max.
 *   - id: sempre 'app'.
 */
export function mergeAppMetaRecords(local: SyncRecord, remote: SyncRecord): SyncRecord {
  const localUpdatedAt = readOptionalString(local, 'updatedAt') ?? '';
  const remoteUpdatedAt = readOptionalString(remote, 'updatedAt') ?? '';
  const localMs = localUpdatedAt ? toEpochMs(localUpdatedAt) : 0;
  const remoteMs = remoteUpdatedAt ? toEpochMs(remoteUpdatedAt) : 0;
  const updatedAt = localMs >= remoteMs ? localUpdatedAt : remoteUpdatedAt;

  // adoptedAt — write-once: preserva o mais antigo não-nulo de qualquer lado
  const localAdoptedAt = readOptionalString(local, 'adoptedAt');
  const remoteAdoptedAt = readOptionalString(remote, 'adoptedAt');
  let adoptedAt: string | undefined;
  if (localAdoptedAt !== undefined && remoteAdoptedAt !== undefined) {
    adoptedAt = toEpochMs(localAdoptedAt) <= toEpochMs(remoteAdoptedAt)
      ? localAdoptedAt
      : remoteAdoptedAt;
  } else {
    adoptedAt = localAdoptedAt ?? remoteAdoptedAt;
  }

  // onboardingCompletedAt — write-once: mais antigo não-nulo
  const localOCA = readOptionalString(local, 'onboardingCompletedAt');
  const remoteOCA = readOptionalString(remote, 'onboardingCompletedAt');
  let onboardingCompletedAt: string | undefined;
  if (localOCA !== undefined && remoteOCA !== undefined) {
    onboardingCompletedAt = toEpochMs(localOCA) <= toEpochMs(remoteOCA) ? localOCA : remoteOCA;
  } else {
    onboardingCompletedAt = localOCA ?? remoteOCA;
  }

  // consentedAt — write-once: mais antigo não-nulo (igual adoptedAt)
  const localConsentedAt = readOptionalString(local, 'consentedAt');
  const remoteConsentedAt = readOptionalString(remote, 'consentedAt');
  let consentedAt: string | undefined;
  if (localConsentedAt !== undefined && remoteConsentedAt !== undefined) {
    consentedAt =
      toEpochMs(localConsentedAt) <= toEpochMs(remoteConsentedAt)
        ? localConsentedAt
        : remoteConsentedAt;
  } else {
    consentedAt = localConsentedAt ?? remoteConsentedAt;
  }

  // errorCaptureEnabled e researchOptIn — do registro com updatedAt mais recente
  const newerRecord = remoteMs > localMs ? remote : local;
  const errorCaptureEnabled = newerRecord['errorCaptureEnabled'];
  const researchOptIn = newerRecord['researchOptIn'];

  const merged: Record<string, unknown> = { id: 'app', updatedAt };
  if (adoptedAt !== undefined) merged['adoptedAt'] = adoptedAt;
  if (onboardingCompletedAt !== undefined) merged['onboardingCompletedAt'] = onboardingCompletedAt;
  if (consentedAt !== undefined) merged['consentedAt'] = consentedAt;
  if (errorCaptureEnabled !== undefined) merged['errorCaptureEnabled'] = errorCaptureEnabled;
  if (researchOptIn !== undefined) merged['researchOptIn'] = researchOptIn;

  return merged;
}

export function mergeSyncRecords(
  collection: SyncableCollection,
  localRecords: readonly SyncRecord[],
  remoteMutations: readonly SyncRecordMutation[],
): MergeResult {
  const byId = new Map<string, SyncRecord>();

  for (const record of localRecords) {
    const mutation = toSyncRecordMutation(collection, record);
    byId.set(mutation.entityId, record);
  }

  let applied = 0;
  let skipped = 0;

  for (const mutation of remoteMutations) {
    if (mutation.collection !== collection) {
      skipped += 1;
      continue;
    }

    const current = byId.get(mutation.entityId);

    // appMeta usa field-merge sempre que há current — não depende de shouldApplyRemote,
    // porque queremos o min do adoptedAt independentemente de qual updatedAt é maior.
    // Ver docs/architecture/SYNC-HARDENING.md — por que appMeta é exceção segura e SM-2 não é.
    if (collection === 'appMeta' && current !== undefined) {
      byId.set(mutation.entityId, mergeAppMetaRecords(current, mutation.record));
      applied += 1;
    } else if (current === undefined || shouldApplyRemote(collection, current, mutation)) {
      byId.set(mutation.entityId, mutation.record);
      applied += 1;
    } else {
      skipped += 1;
    }
  }

  return {
    records: [...byId.values()],
    applied,
    skipped,
  };
}

function parsePulledMutation(item: PulledItem): SyncRecordMutation {
  return parseSyncRecordMutation(item.value);
}

export function parseSyncRecordMutation(value: unknown): SyncRecordMutation {
  if (!isPlainObject(value)) {
    throw new SyncRecordError('mutation deve ser um objeto.');
  }
  if (value.v !== 1) {
    throw new SyncRecordError('mutation.v invalido.');
  }
  const collection = readString(value, 'collection', 'mutation.collection');
  if (!isSyncableCollection(collection)) {
    throw new SyncRecordError('mutation.collection fora da allowlist.');
  }
  const entityId = readString(value, 'entityId', 'mutation.entityId');
  const updatedAt = readString(value, 'updatedAt', 'mutation.updatedAt');
  toEpochMs(updatedAt);
  const deletedAt = readOptionalString(value, 'deletedAt');
  if (deletedAt !== undefined) {
    toEpochMs(deletedAt);
  }
  const record = value.record;
  if (!isPlainObject(record)) {
    throw new SyncRecordError('mutation.record deve ser um objeto.');
  }

  return {
    v: 1,
    collection,
    entityId,
    updatedAt,
    ...(deletedAt === undefined ? {} : { deletedAt }),
    record,
  };
}

function shouldApplyRemote(
  collection: SyncableCollection,
  local: SyncRecord,
  remote: SyncRecordMutation,
): boolean {
  const localUpdatedAt = getRecordUpdatedAt(collection, local);
  const localMs = toEpochMs(localUpdatedAt);
  const remoteMs = toEpochMs(remote.updatedAt);

  if (remoteMs > localMs) {
    return true;
  }
  if (remoteMs < localMs) {
    return false;
  }

  return canonicalJson(remote.record) > canonicalJson(local);
}

function getRecordUpdatedAt(collection: SyncableCollection, record: SyncRecord): string {
  const updatedAt = readOptionalString(record, 'updatedAt');

  if (updatedAt !== undefined) {
    toEpochMs(updatedAt);
    return updatedAt;
  }

  if (collection === 'plans') {
    return getPlanUpdatedAt(record);
  }

  const fallbacks = ['completedAt', 'createdAt', 'unlockedAt', 'generatedFromWeaknessesAt'];

  for (const key of fallbacks) {
    const value = readOptionalString(record, key);
    if (value !== undefined) {
      toEpochMs(value);
      return value;
    }
  }

  throw new SyncRecordError(`${collection} sem updatedAt sincronizavel.`);
}

function getPlanUpdatedAt(record: SyncRecord): string {
  const candidates: string[] = [];
  const generatedFromWeaknessesAt = readOptionalString(record, 'generatedFromWeaknessesAt');
  if (generatedFromWeaknessesAt !== undefined) {
    candidates.push(generatedFromWeaknessesAt);
  }
  const response = record.learningPlanResponse;
  if (isPlainObject(response)) {
    const responseUpdatedAt = readOptionalString(response, 'updatedAt');
    if (responseUpdatedAt !== undefined) {
      candidates.push(responseUpdatedAt);
    }
  }
  const blocks = record.blocks;
  if (Array.isArray(blocks)) {
    for (const block of blocks) {
      if (isPlainObject(block)) {
        const blockUpdatedAt = readOptionalString(block, 'updatedAt');
        if (blockUpdatedAt !== undefined) {
          candidates.push(blockUpdatedAt);
        }
      }
    }
  }

  if (candidates.length === 0) {
    throw new SyncRecordError('plans sem timestamp sincronizavel.');
  }

  return candidates.reduce((latest, candidate) =>
    toEpochMs(candidate) > toEpochMs(latest) ? candidate : latest,
  );
}

function readString(record: SyncRecord, key: string, label: string): string {
  const value = record[key];

  if (typeof value !== 'string' || value.length === 0) {
    throw new SyncRecordError(`${label} ausente ou invalido.`);
  }

  return value;
}

function readOptionalString(record: SyncRecord, key: string): string | undefined {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string' || value.length === 0) {
    throw new SyncRecordError(`${key} invalido.`);
  }

  return value;
}

function toEpochMs(value: string): number {
  const ms = Date.parse(value);

  if (!Number.isFinite(ms)) {
    throw new SyncRecordError(`timestamp invalido: ${value}`);
  }

  return ms;
}

function isPlainObject(value: unknown): value is SyncRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function stableHash(value: string): string {
  let hash = 5381;

  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) + hash + value.charCodeAt(i)) >>> 0;
  }

  return hash.toString(36);
}
