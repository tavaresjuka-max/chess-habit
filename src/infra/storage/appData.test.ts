import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { generatePlan } from '../../domain';
import type { LearnerProfile } from '../../domain';
import { clearAll, exportAllAsJson, getPlan, loadProfile, savePlan, saveProfile } from './appData';

type ExportPayload = {
  profile: object[];
  plans: object[];
  logs: object[];
  signals: object[];
  weaknesses: object[];
};

const profile: LearnerProfile = {
  lichessUsername: 'jukasparov',
  band: '800-1200',
  defaultSessionMinutes: 15,
  goals: ['rotina curta'],
  updatedAt: '2026-06-06T00:00:00.000Z',
};

afterEach(async () => {
  await clearAll();
});

describe('appData storage', () => {
  it('saves and loads profile and daily plan', async () => {
    const plan = generatePlan(profile, [], 15, '2026-06-06');

    await saveProfile(profile);
    await savePlan(plan);

    await expect(loadProfile()).resolves.toEqual(profile);
    await expect(getPlan('2026-06-06')).resolves.toEqual(plan);
  });

  it('exports all records as JSON', async () => {
    await saveProfile(profile);
    await savePlan(generatePlan(profile, [], 5, '2026-06-06'));

    const exported = await exportAllAsJson();
    const payload = JSON.parse(exported) as ExportPayload;

    expect(payload.profile).toHaveLength(1);
    expect(payload.plans).toHaveLength(1);
    expect(payload.logs).toHaveLength(0);
    expect(payload.signals).toHaveLength(0);
    expect(payload.weaknesses).toHaveLength(0);
  });

  it('clears local records', async () => {
    await saveProfile(profile);
    await savePlan(generatePlan(profile, [], 5, '2026-06-06'));

    await clearAll();

    await expect(loadProfile()).resolves.toBeUndefined();
    await expect(getPlan('2026-06-06')).resolves.toBeUndefined();
  });
});
