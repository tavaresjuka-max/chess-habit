import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { generatePlan } from '../../domain';
import type { LearnerProfile, Signal, Weakness } from '../../domain';
import {
  clearAll,
  clearLichessOAuthToken,
  exportAllAsJson,
  getLichessStudyLink,
  getPlan,
  getTrainingLog,
  loadLichessOAuthToken,
  loadProfile,
  loadSignals,
  loadTrainingLogsForDate,
  loadWeaknesses,
  replaceSignalsForSource,
  replaceWeaknesses,
  saveChesscomMonthCache,
  saveLichessOAuthToken,
  saveLichessStudyLink,
  savePlan,
  saveProfile,
  loadChesscomMonthCache,
  saveTrainingLog,
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

  it('saves and loads training logs', async () => {
    const log = {
      id: '2026-06-06:block-1',
      date: '2026-06-06',
      blockId: 'block-1',
      blockTitle: 'Tema',
      source: 'lichess',
      destinationLabel: 'Puzzles Lichess',
      plannedSeconds: 300,
      startedAt: '2026-06-06T10:00:00.000Z',
      completedAt: '2026-06-06T10:04:00.000Z',
      elapsedSeconds: 240,
      timeLimitReached: false,
      status: 'done',
      updatedAt: '2026-06-06T10:04:00.000Z',
    } as const;

    await saveTrainingLog(log);

    await expect(getTrainingLog(log.id)).resolves.toEqual(log);
    await expect(loadTrainingLogsForDate('2026-06-06')).resolves.toEqual([log]);
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

  it('stores Lichess OAuth token locally outside backup export', async () => {
    await saveLichessOAuthToken({
      accessToken: 'lio_secret',
      tokenType: 'Bearer',
      scopes: ['puzzle:read', 'study:write'],
      obtainedAt: '2026-06-06T00:00:00.000Z',
      expiresAt: '2027-06-06T00:00:00.000Z',
    });

    await expect(loadLichessOAuthToken('2026-06-06T12:00:00.000Z')).resolves.toMatchObject({
      accessToken: 'lio_secret',
    });

    const exported = await exportAllAsJson();

    expect(exported).not.toContain('lio_secret');

    await clearLichessOAuthToken();
    await expect(loadLichessOAuthToken()).resolves.toBeUndefined();
  });

  it('stores Lichess study links outside backup export', async () => {
    await saveLichessStudyLink({
      id: '2026-06-06',
      date: '2026-06-06',
      studyId: 'abc12345',
      url: 'https://lichess.org/study/abc12345',
      visibility: 'private',
      imported: true,
      createdAt: '2026-06-06T10:00:00.000Z',
      updatedAt: '2026-06-06T10:00:00.000Z',
    });

    await expect(getLichessStudyLink('2026-06-06')).resolves.toMatchObject({
      studyId: 'abc12345',
    });

    expect(await exportAllAsJson()).not.toContain('abc12345');
  });
});
