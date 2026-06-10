import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { generatePlan } from '../../domain';
import type { DiplomaAttempt, MethodTrack, PendingTrainingItem } from '../../domain/method/types';
import type { LearnerProfile, Signal, Weakness } from '../../domain';
import { db } from './db';
import {
  appendSignals,
  clearAll,
  clearLichessOAuthToken,
  exportAllAsJson,
  getLatestPlanBefore,
  getLichessStudyLink,
  getPlan,
  getTrainingLog,
  loadLichessOAuthToken,
  loadDiplomaAttempts,
  loadMethodTracks,
  loadOpenPendingItems,
  loadProfile,
  loadSignals,
  loadTrainingLogs,
  loadTrainingLogsForDate,
  loadWeaknesses,
  replaceSignalsForSource,
  replaceWeaknesses,
  saveChesscomMonthCache,
  saveLichessOAuthToken,
  saveLichessStudyLink,
  saveDiplomaAttempt,
  saveMethodTrack,
  savePendingItem,
  savePlan,
  saveProfile,
  loadChesscomMonthCache,
  saveTrainingLog,
  updatePendingItemStatus,
} from './appData';

type ExportPayload = {
  profile: object[];
  plans: object[];
  logs: object[];
  signals: object[];
  weaknesses: object[];
  methodTracks: object[];
  pendingItems: object[];
  diplomaAttempts: object[];
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
  it('creates Dexie v4 method tables', () => {
    expect(db.tables.map((table) => table.name)).toEqual(
      expect.arrayContaining(['methodTracks', 'pendingItems', 'diplomaAttempts']),
    );
  });

  it('saves and loads profile and daily plan', async () => {
    const plan = generatePlan(profile, [], 15, '2026-06-06');

    await saveProfile(profile);
    await savePlan(plan);

    await expect(loadProfile()).resolves.toEqual(profile);
    await expect(getPlan('2026-06-06')).resolves.toEqual(plan);
  });

  it('loads the latest plan before a new daily plan date', async () => {
    const firstPlan = generatePlan(profile, [], 15, '2026-06-06');
    const secondPlan = generatePlan(profile, [], 15, '2026-06-07');

    await savePlan(firstPlan);
    await savePlan(secondPlan);

    await expect(getLatestPlanBefore('2026-06-08')).resolves.toEqual(secondPlan);
    await expect(getLatestPlanBefore('2026-06-07')).resolves.toEqual(firstPlan);
    await expect(getLatestPlanBefore('2026-06-06')).resolves.toBeUndefined();
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
    expect(payload.methodTracks).toHaveLength(0);
    expect(payload.pendingItems).toHaveLength(0);
    expect(payload.diplomaAttempts).toHaveLength(0);
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
    await expect(loadTrainingLogs()).resolves.toEqual([log]);
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

  it('appends manual tutor signals without deleting existing source signals', async () => {
    const existingSignal: Signal = {
      source: 'outro',
      confidence: 'medium',
      observedAt: '2026-06-06T00:00:00.000Z',
      value: { kind: 'manual', tag: 'fork', note: 'Sinal manual anterior.' },
    };
    const nextSignal: Signal = {
      source: 'outro',
      confidence: 'medium',
      observedAt: '2026-06-08T00:00:00.000Z',
      value: { kind: 'manual', tag: 'hanging-piece', note: 'Resposta ao Professor Lemos.' },
    };

    await replaceSignalsForSource('outro', [existingSignal]);
    await appendSignals([nextSignal]);

    await expect(loadSignals()).resolves.toEqual([existingSignal, nextSignal]);
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

  it('saves pending items and loads only open ones', async () => {
    const item = createPendingItem();

    await savePendingItem(item);

    await expect(loadOpenPendingItems()).resolves.toEqual([item]);
  });

  it('removes done pending items from the open list', async () => {
    const item = createPendingItem();

    await savePendingItem(item);
    await updatePendingItemStatus(item.id, 'done');

    await expect(loadOpenPendingItems()).resolves.toEqual([]);
  });

  it('exports method records without OAuth tokens', async () => {
    await saveMethodTrack(methodTrack);
    await savePendingItem(createPendingItem());
    await saveDiplomaAttempt(diplomaAttempt);
    await saveLichessOAuthToken({
      accessToken: 'lio_method_secret',
      tokenType: 'Bearer',
      scopes: ['puzzle:read'],
      obtainedAt: '2026-06-10T00:00:00.000Z',
      expiresAt: '2027-06-10T00:00:00.000Z',
    });

    const exported = await exportAllAsJson();
    const payload = JSON.parse(exported) as ExportPayload;

    expect(payload.methodTracks).toEqual([methodTrack]);
    expect(payload.pendingItems).toHaveLength(1);
    expect(payload.diplomaAttempts).toEqual([diplomaAttempt]);
    expect(exported).not.toContain('lio_method_secret');
  });

  it('clears method tracks, pending items and diploma attempts', async () => {
    await saveMethodTrack(methodTrack);
    await savePendingItem(createPendingItem());
    await saveDiplomaAttempt(diplomaAttempt);

    await clearAll();

    await expect(loadMethodTracks()).resolves.toEqual([]);
    await expect(loadOpenPendingItems()).resolves.toEqual([]);
    await expect(loadDiplomaAttempts()).resolves.toEqual([]);
  });

  it('deletes an expired Lichess OAuth token when loading it', async () => {
    await saveLichessOAuthToken({
      accessToken: 'lio_expired',
      tokenType: 'Bearer',
      scopes: ['puzzle:read'],
      obtainedAt: '2026-06-06T00:00:00.000Z',
      expiresAt: '2026-06-07T00:00:00.000Z',
    });

    await expect(loadLichessOAuthToken('2026-06-08T00:00:00.000Z')).resolves.toBeUndefined();
    await expect(loadLichessOAuthToken('2026-06-06T12:00:00.000Z')).resolves.toBeUndefined();
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

const methodTrack: MethodTrack = {
  id: 'pending-review',
  title: 'Tratamento de Pendências',
  priority: 1,
  status: 'active',
  focusWeaknessTags: ['fork'],
  startedAt: '2026-06-10T00:00:00.000Z',
  updatedAt: '2026-06-10T00:00:00.000Z',
};

const diplomaAttempt: DiplomaAttempt = {
  id: 'attempt-1',
  diplomaId: 'peao',
  sectionId: 'coordenadas',
  scorePercent: 95,
  totalItems: 10,
  passed: true,
  source: 'local',
  createdAt: '2026-06-10T00:00:00.000Z',
  updatedAt: '2026-06-10T00:00:00.000Z',
};

function createPendingItem(): PendingTrainingItem {
  return {
    id: 'pending-1',
    origin: 'puzzle',
    title: 'Revisar: Garfo',
    weaknessTag: 'fork',
    methodTrackId: 'pending-review',
    lichessTheme: 'fork',
    lichessUrl: 'https://lichess.org/training/fork',
    prompt: 'Qual sinal do tabuleiro você ignorou?',
    dueAt: '2026-06-11',
    attempts: 0,
    lastFeedback: 'hard',
    status: 'open',
    createdAt: '2026-06-10T00:00:00.000Z',
    updatedAt: '2026-06-10T00:00:00.000Z',
  };
}
