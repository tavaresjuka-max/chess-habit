import type { DailyPlan, LearnerProfile, Signal, SourceId, Weakness } from '../../domain';
import type { ChesscomMonthCache } from '../chesscom/chesscomClient';
import { db, type ProfileRecord, type SignalRecord, type WeaknessRecord } from './db';

const defaultProfileId: ProfileRecord['id'] = 'default';

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

export async function exportAllAsJson(): Promise<string> {
  const payload = {
    profile: await db.profile.toArray(),
    plans: await db.plans.toArray(),
    logs: await db.logs.toArray(),
    signals: await db.signals.toArray(),
    weaknesses: await db.weaknesses.toArray(),
  };

  return JSON.stringify(payload, null, 2);
}

export async function clearAll(): Promise<void> {
  await db.transaction(
    'rw',
    [db.profile, db.plans, db.logs, db.signals, db.weaknesses, db.chesscomMonthSignals],
    async () => {
    await db.profile.clear();
    await db.plans.clear();
    await db.logs.clear();
    await db.signals.clear();
    await db.weaknesses.clear();
      await db.chesscomMonthSignals.clear();
    },
  );
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
