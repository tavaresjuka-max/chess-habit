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
import type { ChesscomMonthCache } from '../chesscom/chesscomClient';
import { countBackupRecords, createBackupFile, type BackupData } from './backup';
import {
  db,
  type BackupMetaRecord,
  type LichessOAuthTokenRecord,
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

export async function loadSignals(): Promise<Signal[]> {
  const records = await db.signals.toArray();
  return records.map(fromSignalRecord);
}

export async function replaceSignalsForSource(source: SourceId, signals: Signal[]): Promise<void> {
  await db.transaction('rw', db.signals, async () => {
    await db.signals.where('source').equals(source).delete();
    await db.signals.bulkPut(signals.map((signal, index) => toSignalRecord(signal, index)));
  });
}

export async function appendSignals(signals: Signal[]): Promise<void> {
  if (signals.length === 0) {
    return;
  }

  await db.transaction('rw', db.signals, async () => {
    const offset = await db.signals.count();

    await db.signals.bulkPut(signals.map((signal, index) => toSignalRecord(signal, offset + index)));
  });
}

export async function loadWeaknesses(): Promise<Weakness[]> {
  const records = await db.weaknesses.toArray();
  return records.map(fromWeaknessRecord);
}

export async function replaceWeaknesses(weaknesses: Weakness[]): Promise<void> {
  await db.transaction('rw', db.weaknesses, async () => {
    await db.weaknesses.clear();
    await db.weaknesses.bulkPut(weaknesses.map(toWeaknessRecord));
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
      await db.backupMeta.clear();
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

function toSignalRecord(signal: Signal, index: number): SignalRecord {
  return {
    ...signal,
    id: `${signal.source}:${signal.value.kind}:${signal.observedAt}:${String(index).padStart(4, '0')}`,
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

function toWeaknessRecord(weakness: Weakness): WeaknessRecord {
  return {
    ...weakness,
    id: weakness.tag,
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
