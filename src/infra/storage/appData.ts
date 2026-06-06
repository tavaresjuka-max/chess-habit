import type { DailyPlan, LearnerProfile } from '../../domain';
import { db, type ProfileRecord } from './db';

const defaultProfileId: ProfileRecord['id'] = 'default';

export async function loadProfile(): Promise<LearnerProfile | undefined> {
  const record = await db.profile.get(defaultProfileId);

  if (record === undefined) {
    return undefined;
  }

  return {
    lichessUsername: record.lichessUsername,
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
  await db.transaction('rw', [db.profile, db.plans, db.logs, db.signals, db.weaknesses], async () => {
    await db.profile.clear();
    await db.plans.clear();
    await db.logs.clear();
    await db.signals.clear();
    await db.weaknesses.clear();
  });
}
