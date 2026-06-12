import type {
  DailyPlan,
  LearnerProfile,
  LichessOAuthToken,
  LichessStudyLink,
  Signal,
  SourceId,
  TrainingLog,
  Weakness,
} from '../../domain';
import type { DiplomaAttempt, MethodTrack, PendingTrainingItem } from '../../domain/method/types';
import type { Achievement, AchievementId } from '../../domain/badges/evaluateAchievements';
import type { ChesscomMonthCache } from '../chesscom/chesscomClient';
import { countBackupRecords, createBackupFile, parseBackupFile, type BackupData } from './backup';
import {
  db,
  type AchievementRecord,
  type AutoBackupConfigRecord,
  type BackupMetaRecord,
  type DiplomaAttemptRecord,
  type LearningLogRecord,
  type LichessOAuthTokenRecord,
  type MethodTrackRecord,
  type PendingItemRecord,
  type PlanRecord,
  type ProfileRecord,
  type SignalRecord,
  type WeaknessRecord,
} from './db';

const defaultProfileId: ProfileRecord['id'] = 'default';
const lichessTokenId: LichessOAuthTokenRecord['id'] = 'lichess';

export async function loadProfile(): Promise<LearnerProfile | undefined> {
  const record = await db.profile.get(defaultProfileId);

  if (record === undefined) {
    return undefined;
  }

  return {
    lichessUsername: record.lichessUsername,
    chesscomUsername: record.chesscomUsername,
    band: record.band,
    defaultSessionMinutes: record.defaultSessionMinutes,
    goals: record.goals,
    updatedAt: record.updatedAt,
  };
}

export async function saveProfile(profile: LearnerProfile): Promise<void> {
  await db.profile.put({
    ...profile,
    id: defaultProfileId,
  });
}

export async function savePlan(plan: DailyPlan): Promise<void> {
  await db.plans.put(plan);
}

export async function getPlan(date: string): Promise<DailyPlan | undefined> {
  return db.plans.get(date);
}

export async function getLatestPlanBefore(date: string): Promise<DailyPlan | undefined> {
  return db.plans.where('date').below(date).reverse().first();
}

export async function saveTrainingLog(log: TrainingLog): Promise<void> {
  await db.logs.put(log);
}

export async function getTrainingLog(id: string): Promise<TrainingLog | undefined> {
  return db.logs.get(id);
}

export async function loadTrainingLogs(): Promise<TrainingLog[]> {
  return db.logs.toArray();
}

export async function loadTrainingLogsForDate(date: string): Promise<TrainingLog[]> {
  return db.logs.where('date').equals(date).toArray();
}

const softDeletePurgeDays = 90;

function getPurgeCutoff(nowIso: string): string {
  const cutoff = new Date(nowIso);

  cutoff.setDate(cutoff.getDate() - softDeletePurgeDays);

  return cutoff.toISOString();
}

export async function loadSignals(): Promise<Signal[]> {
  // Com ids UUID a ordem da chave primaria e aleatoria; ordenar por observedAt
  // mantem a ordem cronologica que o restante do app espera.
  const records = await db.signals.orderBy('observedAt').toArray();

  return records.filter((record) => record.deletedAt === undefined).map(fromSignalRecord);
}

// Substituicao logica, nao fisica: os registros antigos da fonte recebem
// deletedAt (soft delete) e so sao purgados apos 90 dias. Isso preserva o
// historico para merge por registro quando o sync (P4) for descongelado.
export async function replaceSignalsForSource(source: SourceId, signals: Signal[]): Promise<void> {
  const now = new Date().toISOString();
  const purgeCutoff = getPurgeCutoff(now);

  await db.transaction('rw', db.signals, async () => {
    await db.signals
      .where('source')
      .equals(source)
      .modify((record) => {
        if (record.deletedAt === undefined) {
          record.deletedAt = now;
          record.updatedAt = now;
        }
      });
    await db.signals
      .filter((record) => record.deletedAt !== undefined && record.deletedAt < purgeCutoff)
      .delete();
    await db.signals.bulkPut(signals.map((signal) => toSignalRecord(signal, now)));
  });
}

export async function appendSignals(signals: Signal[]): Promise<void> {
  if (signals.length === 0) {
    return;
  }

  const now = new Date().toISOString();

  await db.signals.bulkPut(signals.map((signal) => toSignalRecord(signal, now)));
}

export async function loadWeaknesses(): Promise<Weakness[]> {
  const records = await db.weaknesses.toArray();

  return records.filter((record) => record.deletedAt === undefined).map(fromWeaknessRecord);
}

// Upsert por tag (merge-key natural): tags que sairam do diagnostico recebem
// deletedAt; tags presentes sao regravadas sem deletedAt (revividas).
export async function replaceWeaknesses(weaknesses: Weakness[]): Promise<void> {
  const now = new Date().toISOString();
  const nextTags = new Set(weaknesses.map((weakness) => weakness.tag));

  await db.transaction('rw', db.weaknesses, async () => {
    await db.weaknesses.toCollection().modify((record) => {
      if (!nextTags.has(record.tag) && record.deletedAt === undefined) {
        record.deletedAt = now;
        record.updatedAt = now;
      }
    });
    await db.weaknesses.bulkPut(weaknesses.map((weakness) => toWeaknessRecord(weakness, now)));
  });
}

export async function loadChesscomMonthCache(id: string, nowIso: string): Promise<ChesscomMonthCache | undefined> {
  const record = await db.chesscomMonthSignals.get(id);

  if (record === undefined || record.expiresAt <= nowIso) {
    return undefined;
  }

  return record;
}

export async function saveChesscomMonthCache(record: ChesscomMonthCache): Promise<void> {
  await db.chesscomMonthSignals.put(record);
}

export async function loadLichessOAuthToken(nowIso = new Date().toISOString()): Promise<LichessOAuthToken | undefined> {
  const record = await db.lichessOAuthTokens.get(lichessTokenId);

  if (record === undefined) {
    return undefined;
  }

  if (record.expiresAt <= nowIso) {
    await clearLichessOAuthToken();
    return undefined;
  }

  return fromLichessOAuthTokenRecord(record);
}

export async function saveLichessOAuthToken(token: LichessOAuthToken): Promise<void> {
  await db.lichessOAuthTokens.put({
    ...token,
    id: lichessTokenId,
  });
}

export async function clearLichessOAuthToken(): Promise<void> {
  await db.lichessOAuthTokens.delete(lichessTokenId);
}

export async function getLichessStudyLink(date: string): Promise<LichessStudyLink | undefined> {
  return db.lichessStudies.get(date);
}

export async function saveLichessStudyLink(link: LichessStudyLink): Promise<void> {
  await db.lichessStudies.put(link);
}

export async function loadMethodTracks(): Promise<MethodTrack[]> {
  return db.methodTracks.toArray();
}

export async function saveMethodTrack(track: MethodTrack): Promise<void> {
  await db.methodTracks.put(track);
}

export async function loadOpenPendingItems(): Promise<PendingTrainingItem[]> {
  return db.pendingItems.where('status').equals('open').toArray();
}

export async function loadDonePendingItems(): Promise<PendingTrainingItem[]> {
  return db.pendingItems.where('status').equals('done').toArray();
}

export async function loadAchievements(): Promise<Achievement[]> {
  const records = await db.achievements.toArray();

  return records.map((record) => ({
    id: record.id as AchievementId,
    unlockedAt: record.unlockedAt,
  }));
}

export async function saveAchievements(achievements: Achievement[]): Promise<void> {
  if (achievements.length === 0) {
    return;
  }

  const now = new Date().toISOString();

  await db.achievements.bulkPut(
    achievements.map((achievement) => ({
      id: achievement.id,
      unlockedAt: achievement.unlockedAt,
      updatedAt: now,
    })),
  );
}

export async function savePendingItem(item: PendingTrainingItem): Promise<void> {
  await db.pendingItems.put(item);
}

export async function updatePendingItemStatus(
  id: string,
  status: PendingTrainingItem['status'],
): Promise<void> {
  await db.pendingItems.update(id, {
    status,
    updatedAt: new Date().toISOString(),
  });
}

export async function loadDiplomaAttempts(): Promise<DiplomaAttempt[]> {
  return db.diplomaAttempts.toArray();
}

export async function saveDiplomaAttempt(attempt: DiplomaAttempt): Promise<void> {
  await db.diplomaAttempts.put(attempt);
}

export async function exportAllAsJson(nowIso = new Date().toISOString()): Promise<string> {
  const data: BackupData = {
    profile: await db.profile.toArray(),
    plans: await db.plans.toArray(),
    logs: await db.logs.toArray(),
    signals: await db.signals.toArray(),
    weaknesses: await db.weaknesses.toArray(),
    methodTracks: await db.methodTracks.toArray(),
    pendingItems: await db.pendingItems.toArray(),
    diplomaAttempts: await db.diplomaAttempts.toArray(),
    achievements: await db.achievements.toArray(),
  };

  const backupFile = await createBackupFile(data, nowIso);

  await db.backupMeta.put({
    id: 'last-export',
    exportedAt: backupFile.exportedAt,
    checksum: backupFile.checksum,
    recordCount: countBackupRecords(data),
  });

  return JSON.stringify(backupFile, null, 2);
}

export async function loadBackupMeta(): Promise<BackupMetaRecord | undefined> {
  return db.backupMeta.get('last-export');
}

export async function loadAutoBackupConfig(): Promise<AutoBackupConfigRecord | undefined> {
  return db.autoBackup.get('config');
}

export async function saveAutoBackupConfig(
  config: Omit<AutoBackupConfigRecord, 'id' | 'updatedAt'>,
): Promise<void> {
  await db.autoBackup.put({
    ...config,
    id: 'config',
    updatedAt: new Date().toISOString(),
  });
}

export async function clearAutoBackupConfig(): Promise<void> {
  await db.autoBackup.delete('config');
}

export type BackupImportResult =
  | { ok: true; recordCount: number; exportedAt: string }
  | { ok: false; error: string };

export async function importBackupFromJson(json: string): Promise<BackupImportResult> {
  const parsed = await parseBackupFile(json);

  if (!parsed.ok) {
    return parsed;
  }

  const { data } = parsed.file;

  await db.transaction(
    'rw',
    [
      db.profile,
      db.plans,
      db.logs,
      db.signals,
      db.weaknesses,
      db.methodTracks,
      db.pendingItems,
      db.diplomaAttempts,
      db.achievements,
    ],
    async () => {
      await db.profile.clear();
      await db.profile.bulkPut(data.profile as ProfileRecord[]);
      await db.plans.clear();
      await db.plans.bulkPut(data.plans as PlanRecord[]);
      await db.logs.clear();
      await db.logs.bulkPut(data.logs as LearningLogRecord[]);
      await db.signals.clear();
      await db.signals.bulkPut(data.signals as SignalRecord[]);
      await db.weaknesses.clear();
      await db.weaknesses.bulkPut(data.weaknesses as WeaknessRecord[]);
      await db.methodTracks.clear();
      await db.methodTracks.bulkPut(data.methodTracks as MethodTrackRecord[]);
      await db.pendingItems.clear();
      await db.pendingItems.bulkPut(data.pendingItems as PendingItemRecord[]);
      await db.diplomaAttempts.clear();
      await db.diplomaAttempts.bulkPut(data.diplomaAttempts as DiplomaAttemptRecord[]);
      await db.achievements.clear();
      // Backups antigos (pre-Corte 7) nao tem a tabela; importa como vazia.
      await db.achievements.bulkPut((data.achievements ?? []) as AchievementRecord[]);
    },
  );

  return {
    ok: true,
    recordCount: countBackupRecords(data),
    exportedAt: parsed.file.exportedAt,
  };
}

export async function clearAll(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.profile,
      db.plans,
      db.logs,
      db.signals,
      db.weaknesses,
      db.chesscomMonthSignals,
      db.lichessOAuthTokens,
      db.lichessStudies,
      db.methodTracks,
      db.pendingItems,
      db.diplomaAttempts,
      db.backupMeta,
      db.autoBackup,
      db.achievements,
    ],
    async () => {
      await db.profile.clear();
      await db.plans.clear();
      await db.logs.clear();
      await db.signals.clear();
      await db.weaknesses.clear();
      await db.chesscomMonthSignals.clear();
      await db.lichessOAuthTokens.clear();
      await db.lichessStudies.clear();
      await db.methodTracks.clear();
      await db.pendingItems.clear();
      await db.diplomaAttempts.clear();
      await db.achievements.clear();
      await db.backupMeta.clear();
      // Apagar tudo desliga o backup automatico: sem isso, a proxima abertura
      // gravaria um backup vazio por cima do arquivo bom do usuario.
      await db.autoBackup.clear();
    },
  );
}

function fromLichessOAuthTokenRecord(record: LichessOAuthTokenRecord): LichessOAuthToken {
  return {
    accessToken: record.accessToken,
    tokenType: record.tokenType,
    scopes: record.scopes,
    obtainedAt: record.obtainedAt,
    expiresAt: record.expiresAt,
  };
}

function createRecordId(): string {
  const cryptoObject = globalThis.crypto as { randomUUID?: () => string } | undefined;

  if (cryptoObject?.randomUUID !== undefined) {
    return cryptoObject.randomUUID();
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function toSignalRecord(signal: Signal, updatedAt: string): SignalRecord {
  return {
    ...signal,
    id: createRecordId(),
    updatedAt,
  };
}

function fromSignalRecord(record: SignalRecord): Signal {
  return {
    source: record.source,
    value: record.value,
    confidence: record.confidence,
    observedAt: record.observedAt,
  };
}

function toWeaknessRecord(weakness: Weakness, updatedAt: string): WeaknessRecord {
  return {
    ...weakness,
    id: weakness.tag,
    updatedAt,
  };
}

function fromWeaknessRecord(record: WeaknessRecord): Weakness {
  return {
    tag: record.tag,
    score: record.score,
    confidence: record.confidence,
    evidence: record.evidence,
  };
}
