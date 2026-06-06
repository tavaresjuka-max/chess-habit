import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { generatePlan } from '../../domain';
import type { LearnerProfile, Signal, Weakness } from '../../domain';
import {
  clearAll,
  exportAllAsJson,
  getPlan,
  loadProfile,
  loadSignals,
  loadWeaknesses,
  replaceSignalsForSource,
  replaceWeaknesses,
  saveChesscomMonthCache,
  savePlan,
  saveProfile,
  loadChesscomMonthCache,
} from './appData';

type ExportPayload = {
  profile: object[];
  plans: object[];
  logs: object[];
  signals: object[];
  weaknesses: object[];
};

const profile: LearnerProfile = {
  lichessUsername: 'jukasparov',
  chesscomUsername: 'jukatavares',
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

  it('replaces derived signals by source and stores weaknesses', async () => {
    const signal: Signal = {
      source: 'chesscom',
      confidence: 'medium',
      observedAt: '2026-06-06T00:00:00.000Z',
      value: { kind: 'clock', timeoutLosses: 2, games: 10 },
    };
    const weakness: Weakness = {
      tag: 'time-trouble',
      score: 0.6,
      confidence: 'medium',
      evidence: 'Sinal possivel de pressa no relogio.',
    };

    await replaceSignalsForSource('chesscom', [signal]);
    await replaceWeaknesses([weakness]);

    await expect(loadSignals()).resolves.toEqual([signal]);
    await expect(loadWeaknesses()).resolves.toEqual([weakness]);
  });

  it('caches only derived Chess.com month signals', async () => {
    const signal: Signal = {
      source: 'chesscom',
      confidence: 'medium',
      observedAt: '2026-06-06T00:00:00.000Z',
      value: { kind: 'opening', eco: 'C20', name: 'King Pawn Game', games: 6, lossRate: 0.667 },
    };

    await saveChesscomMonthCache({
      id: 'jukatavares:2026-05',
      username: 'jukatavares',
      archiveUrl: 'https://api.chess.com/pub/player/jukatavares/games/2026/05',
      signals: [signal],
      updatedAt: '2026-06-06T00:00:00.000Z',
      expiresAt: '2026-06-07T00:00:00.000Z',
    });

    const cached = await loadChesscomMonthCache('jukatavares:2026-05', '2026-06-06T12:00:00.000Z');

    expect(cached?.signals).toEqual([signal]);
    expect(JSON.stringify(cached)).not.toContain('1. e4');
  });
});
