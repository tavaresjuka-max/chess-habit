import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generatePlan } from '../../domain';
import type { DiplomaAttempt, MethodTrack, PendingTrainingItem } from '../../domain/method/types';
import type { LearnerProfile, Signal, Weakness } from '../../domain';
import { db } from './db';
import { computeBackupChecksum } from './backup';
import {
  appendSignals,
  captureAdoption,
  clearAll,
  clearErrorLog,
  appendErrorLog,
  clearLichessOAuthToken,
  exportAllAsJson,
  exportErrorLogAsJson,
  getLatestPlanBefore,
  getLichessStudyLink,
  getPlan,
  getTrainingLog,
  importBackupFromJson,
  loadAdoptedAt,
  loadBackupMeta,
  loadErrorCaptureEnabled,
  loadErrorLog,
  loadLichessOAuthToken,
  loadDiplomaAttempts,
  loadMethodTracks,
  loadOnboardingCompletedAt,
  loadOpenPendingItems,
  loadProfile,
  markOnboardingCompleted,
  setErrorCaptureEnabled,
  recordGlobalError,
  getPurgeCutoff,
  loadSignals,
  loadTrainingLogs,
  loadTrainingLogsForDate,
  loadStoredPuzzleWeakness,
  loadWeaknesses,
  replaceSignalsForSource,
  replaceWeaknesses,
  saveChesscomMonthCache,
  saveLichessOAuthToken,
  saveLichessStudyLink,
  saveDiplomaAttempt,
  saveDiplomaAttempts,
  saveMethodTrack,
  savePendingItem,
  savePlan,
  saveProfile,
  saveProfileAndPlan,
  loadChesscomMonthCache,
  saveTrainingLog,
  saveTrainingLogsAndPlan,
  updatePendingItemStatus,
} from './appData';

type ExportPayload = {
  format: string;
  version: number;
  exportedAt: string;
  checksum: string;
  data: {
    profile: object[];
    plans: object[];
    logs: object[];
    signals: object[];
    weaknesses: object[];
    methodTracks: object[];
    pendingItems: object[];
    diplomaAttempts: object[];
  };
};

const profile: LearnerProfile = {
  lichessUsername: 'jukasparov',
  chesscomUsername: 'jukatavares',
  band: '800-1000',
  defaultSessionMinutes: 15,
  goals: ['rotina curta'],
  updatedAt: '2026-06-06T00:00:00.000Z',
};

afterEach(async () => {
  vi.restoreAllMocks();
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

  it('rolls back profile when saving profile and plan fails', async () => {
    const plan = generatePlan(profile, [], 15, '2026-06-06');

    vi.spyOn(db.plans, 'put').mockRejectedValueOnce(new Error('plan write failed'));

    await expect(saveProfileAndPlan(profile, plan)).rejects.toThrow('plan write failed');
    await expect(loadProfile()).resolves.toBeUndefined();
    await expect(getPlan('2026-06-06')).resolves.toBeUndefined();
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

  it('exports all records as a versioned backup file with checksum and metadata', async () => {
    await saveProfile(profile);
    await savePlan(generatePlan(profile, [], 5, '2026-06-06'));

    const exported = await exportAllAsJson('2026-06-10T12:00:00.000Z');
    const payload = JSON.parse(exported) as ExportPayload;

    expect(payload.format).toBe('lichess-tutor-backup');
    expect(payload.version).toBe(1);
    expect(payload.exportedAt).toBe('2026-06-10T12:00:00.000Z');
    expect(payload.checksum).toMatch(/^(sha256|fnv1a):/);
    expect(payload.data.profile).toHaveLength(1);
    expect(payload.data.plans).toHaveLength(1);
    expect(payload.data.logs).toHaveLength(0);
    expect(payload.data.signals).toHaveLength(0);
    expect(payload.data.weaknesses).toHaveLength(0);
    expect(payload.data.methodTracks).toHaveLength(0);
    expect(payload.data.pendingItems).toHaveLength(0);
    expect(payload.data.diplomaAttempts).toHaveLength(0);

    const meta = await loadBackupMeta();

    expect(meta?.exportedAt).toBe('2026-06-10T12:00:00.000Z');
    expect(meta?.checksum).toBe(payload.checksum);
    expect(meta?.recordCount).toBe(2);
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

  it('rolls back training logs when saving logs and plan fails', async () => {
    const firstLog = createTrainingLog('2026-06-06:block-1', 'block-1');
    const secondLog = createTrainingLog('2026-06-06:block-2', 'block-2');
    const plan = generatePlan(profile, [], 15, '2026-06-06');

    vi.spyOn(db.plans, 'put').mockRejectedValueOnce(new Error('plan write failed'));

    await expect(saveTrainingLogsAndPlan([firstLog, secondLog], plan)).rejects.toThrow('plan write failed');
    await expect(loadTrainingLogs()).resolves.toEqual([]);
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

  it('soft-deletes replaced signals instead of physically removing them', async () => {
    const oldSignal: Signal = {
      source: 'chesscom',
      confidence: 'medium',
      observedAt: '2026-06-01T00:00:00.000Z',
      value: { kind: 'clock', timeoutLosses: 2, games: 10 },
    };
    const newSignal: Signal = {
      source: 'chesscom',
      confidence: 'high',
      observedAt: '2026-06-10T00:00:00.000Z',
      value: { kind: 'clock', timeoutLosses: 1, games: 12 },
    };

    await replaceSignalsForSource('chesscom', [oldSignal]);
    await replaceSignalsForSource('chesscom', [newSignal]);

    await expect(loadSignals()).resolves.toEqual([newSignal]);

    const allRecords = await db.signals.toArray();

    expect(allRecords).toHaveLength(2);
    expect(allRecords.every((record) => record.updatedAt !== '')).toBe(true);
    expect(allRecords.filter((record) => record.deletedAt !== undefined)).toHaveLength(1);
  });

  it('soft-deletes weaknesses that left the diagnosis and revives returning tags', async () => {
    const forkWeakness: Weakness = {
      tag: 'fork',
      score: 0.7,
      confidence: 'medium',
      evidence: 'Sinal possivel em garfos.',
    };
    const pinWeakness: Weakness = {
      tag: 'pin',
      score: 0.5,
      confidence: 'low',
      evidence: 'Sinal possivel em cravadas.',
    };

    await replaceWeaknesses([forkWeakness, pinWeakness]);
    await replaceWeaknesses([forkWeakness]);

    await expect(loadWeaknesses()).resolves.toEqual([forkWeakness]);

    const allRecords = await db.weaknesses.toArray();

    expect(allRecords).toHaveLength(2);
    expect(allRecords.find((record) => record.tag === 'pin')?.deletedAt).toBeDefined();

    await replaceWeaknesses([forkWeakness, pinWeakness]);

    await expect(loadWeaknesses()).resolves.toEqual([forkWeakness, pinWeakness]);
    expect((await db.weaknesses.toArray()).every((record) => record.deletedAt === undefined)).toBe(true);
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
      value: { kind: 'manual', tag: 'hanging-piece', note: 'Resposta ao Professor Tavarez.' },
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
    expect(exported).not.toContain('accessToken');

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

    expect(payload.data.methodTracks).toEqual([methodTrack]);
    expect(payload.data.pendingItems).toHaveLength(1);
    expect(payload.data.diplomaAttempts).toEqual([diplomaAttempt]);
    expect(exported).not.toContain('lio_method_secret');
    expect(exported).not.toContain('accessToken');
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

  it('restores an exported backup after data loss (roundtrip)', async () => {
    await saveProfile(profile);
    await savePlan(generatePlan(profile, [], 15, '2026-06-06'));
    await saveMethodTrack(methodTrack);
    await savePendingItem(createPendingItem());
    await saveDiplomaAttempt(diplomaAttempt);

    const exported = await exportAllAsJson('2026-06-10T12:00:00.000Z');

    await clearAll();
    await expect(loadProfile()).resolves.toBeUndefined();

    const result = await importBackupFromJson(exported);

    expect(result).toMatchObject({ ok: true, exportedAt: '2026-06-10T12:00:00.000Z' });
    await expect(loadProfile()).resolves.toEqual(profile);
    await expect(getPlan('2026-06-06')).resolves.toBeDefined();
    await expect(loadMethodTracks()).resolves.toEqual([methodTrack]);
    await expect(loadOpenPendingItems()).resolves.toHaveLength(1);
    await expect(loadDiplomaAttempts()).resolves.toEqual([diplomaAttempt]);
  });

  it('preserva themeStages no round-trip de perfil (loadProfile — PED-3)', async () => {
    await saveProfile({ ...profile, themeStages: { fork: 'retrieval' } });

    const loaded = await loadProfile();

    expect(loaded?.themeStages).toEqual({ fork: 'retrieval' });
  });

  it('saveDiplomaAttempts grava varias tentativas de uma vez (LOG-5)', async () => {
    const a1: DiplomaAttempt = { ...diplomaAttempt, id: 'attempt-1' };
    const a2: DiplomaAttempt = { ...diplomaAttempt, id: 'attempt-2', diplomaId: 'torre' };

    await saveDiplomaAttempts([a1, a2]);

    await expect(loadDiplomaAttempts()).resolves.toEqual(expect.arrayContaining([a1, a2]));
  });

  it('saveDiplomaAttempts com lista vazia nao grava nada', async () => {
    await saveDiplomaAttempts([]);

    await expect(loadDiplomaAttempts()).resolves.toEqual([]);
  });

  it('atualiza backupMeta para o backup importado, sem deixar o meta antigo (DATA-2)', async () => {
    await saveProfile(profile);
    const fileV1 = await exportAllAsJson('2026-06-01T12:00:00.000Z');
    // Um export mais novo deixa o meta apontando para D2.
    await exportAllAsJson('2026-06-10T12:00:00.000Z');
    await expect(loadBackupMeta()).resolves.toMatchObject({ exportedAt: '2026-06-10T12:00:00.000Z' });

    const result = await importBackupFromJson(fileV1);

    expect(result).toMatchObject({ ok: true });
    // Apos restaurar o backup de D1, o meta reflete D1 (o que foi restaurado), nao D2.
    await expect(loadBackupMeta()).resolves.toMatchObject({ exportedAt: '2026-06-01T12:00:00.000Z' });
  });

  it('restaura sinais reais no roundtrip (guarda contra validacao de signals quebrada — DATA-1)', async () => {
    // Regressao: validateBackupData checava item.kind no topo, que sinais reais
    // (value.kind) nunca tem, fazendo o import rejeitar qualquer backup com sinais.
    const signal: Signal = {
      source: 'chesscom',
      confidence: 'medium',
      observedAt: '2026-06-06T00:00:00.000Z',
      value: { kind: 'accuracy', lowAccuracyGames: 6, games: 8 },
    };
    await saveProfile(profile);
    await replaceSignalsForSource('chesscom', [signal]);

    const exported = await exportAllAsJson('2026-06-10T12:00:00.000Z');

    await clearAll();
    await expect(loadSignals()).resolves.toEqual([]);

    const result = await importBackupFromJson(exported);

    expect(result).toMatchObject({ ok: true });
    await expect(loadSignals()).resolves.toEqual([signal]);
  });

  it('restaura lichessStudies e estado de onboarding no roundtrip (Corte F)', async () => {
    await saveProfile(profile);
    await markOnboardingCompleted('2026-06-09T08:00:00.000Z');
    await saveLichessStudyLink({
      id: '2026-06-06',
      date: '2026-06-06',
      studyId: 'abc123',
      url: 'https://lichess.org/study/abc123',
      visibility: 'private',
      imported: true,
      createdAt: '2026-06-06T10:00:00.000Z',
      updatedAt: '2026-06-06T10:00:00.000Z',
    });

    const exported = await exportAllAsJson('2026-06-10T12:00:00.000Z');

    await clearAll();
    await expect(loadOnboardingCompletedAt()).resolves.toBeUndefined();

    const result = await importBackupFromJson(exported);

    expect(result).toMatchObject({ ok: true });
    await expect(loadOnboardingCompletedAt()).resolves.toBe('2026-06-09T08:00:00.000Z');
    await expect(getLichessStudyLink('2026-06-06')).resolves.toMatchObject({ studyId: 'abc123' });
  });

  it('rejects a backup with tampered data without touching current records', async () => {
    await saveProfile(profile);

    const exported = await exportAllAsJson();
    const tampered = exported.replace('"jukasparov"', '"intruso"');

    const result = await importBackupFromJson(tampered);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toContain('Checksum');
    }

    await expect(loadProfile()).resolves.toEqual(profile);
  });

  it('rejects files that are not lichess-tutor backups', async () => {
    expect((await importBackupFromJson('not json')).ok).toBe(false);
    expect((await importBackupFromJson('{"format":"other-app","version":1}')).ok).toBe(false);
    expect(
      (await importBackupFromJson('{"format":"lichess-tutor-backup","version":99,"exportedAt":"x","checksum":"y","data":{}}')).ok,
    ).toBe(false);
  });

  it('preserva atomicidade ao rejeitar checksum corrompido (M-Hardening Task 3)', async () => {
    // Cenário: o checksum no arquivo foi adulterado diretamente (não os dados).
    // O import deve rejeitar ANTES de tocar nas tabelas — perfil pré-existente
    // continua inteiro após a tentativa falha.
    await saveProfile(profile);
    await savePlan(generatePlan(profile, [], 15, '2026-06-06'));
    await saveMethodTrack(methodTrack);
    await savePendingItem(createPendingItem());

    const exported = await exportAllAsJson('2026-06-10T12:00:00.000Z');
    const payload = JSON.parse(exported) as ExportPayload;
    // Corrompe só o checksum (troca por um que não bate), mantendo os dados.
    payload.checksum = 'sha256:deadbeef';
    const corrupted = JSON.stringify(payload);

    const result = await importBackupFromJson(corrupted);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Checksum');
    }
    // Nenhuma tabela foi limpa: perfil, plano, método e pending continuam lá.
    await expect(loadProfile()).resolves.toEqual(profile);
    await expect(getPlan('2026-06-06')).resolves.toBeDefined();
    await expect(loadMethodTracks()).resolves.toEqual([methodTrack]);
    await expect(loadOpenPendingItems()).resolves.toHaveLength(1);
  });

  it('restaura backup antigo sem tabelas opcionais (achievements/lichessStudies) sem lançar (M-Hardening Task 3)', async () => {
    // Backups exportados antes do Corte 7 (achievements) e Corte F (lichessStudies,
    // appMeta) não têm essas chaves em data. O import deve restaurar o que existe
    // e deixar as tabelas ausentes como vazias — não quebra, não lança.
    // Estratégia: exporta um backup real (perfis com id 'default' etc.) e remove
    // as tabelas opcionais do payload, simulando um arquivo antigo.
    await saveProfile(profile);
    await savePlan(generatePlan(profile, [], 15, '2026-06-06'));
    await saveMethodTrack(methodTrack);
    await savePendingItem(createPendingItem());
    await saveDiplomaAttempt(diplomaAttempt);

    const exported = await exportAllAsJson('2026-06-10T12:00:00.000Z');
    const payload = JSON.parse(exported) as ExportPayload & {
      data: Record<string, unknown> & {
        achievements?: unknown[];
        placementResults?: unknown[];
        lichessStudies?: unknown[];
        appMeta?: unknown[];
      };
    };

    // Remove as tabelas opcionais (simula um backup de versão anterior do app).
    delete payload.data.achievements;
    delete payload.data.placementResults;
    delete payload.data.lichessStudies;
    delete payload.data.appMeta;

    // Recalcula o checksum sobre os dados agora sem opcionais (algoritmo fnv1a
    // é determinístico e não depende de contexto seguro).
    const algorithm = payload.checksum.startsWith('fnv1a:') ? 'fnv1a' : 'fnv1a';
    payload.checksum = await computeBackupChecksum(JSON.stringify(payload.data), algorithm);
    const json = JSON.stringify(payload);

    // Limpa o aparelho para checar que a restauração realmente grava os dados.
    await clearAll();
    await expect(loadProfile()).resolves.toBeUndefined();

    const result = await importBackupFromJson(json);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Conta apenas as tabelas requeridas (backupTableNames) — opcionais ausentes somam 0.
      expect(result.recordCount).toBe(1 + 1 + 0 + 0 + 0 + 1 + 1 + 1);
    }
    // Tabelas requeridas foram restauradas.
    await expect(loadProfile()).resolves.toEqual(profile);
    await expect(getPlan('2026-06-06')).resolves.toBeDefined();
    await expect(loadMethodTracks()).resolves.toEqual([methodTrack]);
    // Tabelas opcionais ausentes ficam vazias, não lançam nem corrompem.
    await expect(db.achievements.count()).resolves.toBe(0);
    await expect(getLichessStudyLink('2026-06-06')).resolves.toBeUndefined();
  });

  it('trata JSON malformado sem corromper estado existente (M-Hardening Task 3)', async () => {
    // Cenário: já há dados válidos no aparelho; o usuário cola um arquivo que não
    // é JSON. O import rejeita sem tocar no estado — nada é apagado.
    await saveProfile(profile);
    await saveMethodTrack(methodTrack);

    const malformed = '{not valid json,,,}';

    const result = await importBackupFromJson(malformed);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('JSON');
    }
    // Estado pré-existente intacto.
    await expect(loadProfile()).resolves.toEqual(profile);
    await expect(loadMethodTracks()).resolves.toEqual([methodTrack]);
  });

  it('updatePendingItemStatus persiste status+updatedAt, NÃO toca em dueAt (M-Hardening Task 5)', async () => {
    // Documenta o comportamento real do "defer": updatePendingItemStatus(id,'deferred')
    // persiste apenas status e updatedAt. dueAt e demais campos são preservados.
    // (O plano Task 5 menciona "defer reagenda dueAt"; o código NÃO reagenda.
    //  Ver RELATÓRIO — divergência sinalizada, não corrigida por NON-GOALS.)
    const item = createPendingItem();

    await savePendingItem(item);

    const before = await db.pendingItems.get(item.id);
    expect(before?.status).toBe('open');
    expect(before?.dueAt).toBe(item.dueAt);

    // Defer.
    await updatePendingItemStatus(item.id, 'deferred');

    const after = await db.pendingItems.get(item.id);

    // status e updatedAt mudaram.
    expect(after?.status).toBe('deferred');
    expect(after?.updatedAt).not.toBe(item.updatedAt);
    // dueAt NÃO foi reagendado — permanece exatamente como estava na criação.
    expect(after?.dueAt).toBe(item.dueAt);
    // demais campos preservados.
    expect(after?.weaknessTag).toBe(item.weaknessTag);
    expect(after?.attempts).toBe(item.attempts);

    // Item sai da lista open (defer esconde da fila de revisão).
    await expect(loadOpenPendingItems()).resolves.toEqual([]);
  });

  it('rejects a backup where profile is not an array (shape inválida)', async () => {
    // data.profile deve ser array — qualquer outro tipo falha na validação de shape
    // antes mesmo de chegar ao validateBackupData.
    const invalidData = {
      profile: 'not-an-array',
      plans: [],
      logs: [],
      signals: [],
      weaknesses: [],
      methodTracks: [],
      pendingItems: [],
      diplomaAttempts: [],
    };

    const checksum = await computeBackupChecksum(JSON.stringify(invalidData), 'fnv1a');
    const json = JSON.stringify({
      format: 'lichess-tutor-backup',
      version: 1,
      exportedAt: '2026-06-16T00:00:00.000Z',
      checksum,
      data: invalidData,
    });

    const result = await importBackupFromJson(json);

    expect(result.ok).toBe(false);
  });

  it('inclui Lichess study links no backup (Corte F: dado durável do usuário)', async () => {
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

    // Antes do Corte F os studies ficavam de fora; eram dado criado pelo usuário
    // sem como recuperar. Agora entram no backup (token/cache continuam fora).
    expect(await exportAllAsJson()).toContain('abc12345');
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

function createTrainingLog(id: string, blockId: string) {
  return {
    id,
    date: '2026-06-06',
    blockId,
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
}

describe('getPurgeCutoff (B1: corte de purga independente de fuso)', () => {
  it('retorna exatamente 90 dias antes do nowIso, em qualquer fuso', () => {
    // 01:00 UTC = 22:00 do dia anterior em GMT-3 — o caso que quebrava com getDate local.
    const nowIso = '2026-06-21T01:00:00.000Z';
    const cutoff = getPurgeCutoff(nowIso);
    const days = (Date.parse(nowIso) - Date.parse(cutoff)) / 86_400_000;

    expect(days).toBe(90);
  });
});

describe('adoptedAt — carimbo de adoção write-once (Fase 1, classe de risco)', () => {
  it('captureAdoption grava UMA vez: 2ª chamada com data diferente não muda o valor', async () => {
    await captureAdoption('2026-06-01T10:00:00.000Z');

    expect(await loadAdoptedAt()).toBe('2026-06-01T10:00:00.000Z');

    await captureAdoption('2099-12-31T23:59:59.000Z');

    // Write-once: continua sendo a 1ª data.
    expect(await loadAdoptedAt()).toBe('2026-06-01T10:00:00.000Z');
  });

  it('captureAdoption preserva onboardingCompletedAt existente (read-merge-put)', async () => {
    await markOnboardingCompleted('2026-05-01T08:00:00.000Z');
    await captureAdoption('2026-06-01T10:00:00.000Z');

    const record = await db.appMeta.get('app');

    expect(record?.adoptedAt).toBe('2026-06-01T10:00:00.000Z');
    expect(record?.onboardingCompletedAt).toBe('2026-05-01T08:00:00.000Z');
  });

  it('markOnboardingCompleted preserva adoptedAt existente (guarda do put cego)', async () => {
    // O teste-chave que pega a armadilha do put cego: antes, marcar onboarding
    // regravava o registro inteiro e apagava adoptedAt. Agora funde.
    await captureAdoption('2026-06-01T10:00:00.000Z');
    await markOnboardingCompleted('2026-06-09T08:00:00.000Z');

    const record = await db.appMeta.get('app');

    expect(record?.onboardingCompletedAt).toBe('2026-06-09T08:00:00.000Z');
    expect(record?.adoptedAt).toBe('2026-06-01T10:00:00.000Z');
  });

  it('adoptedAt sobrevive ao round-trip de backup (export -> clear -> import)', async () => {
    await saveProfile(profile);
    await captureAdoption('2026-06-01T10:00:00.000Z');

    const exported = await exportAllAsJson('2026-06-10T12:00:00.000Z');

    await clearAll();
    await expect(loadAdoptedAt()).resolves.toBeUndefined();

    const result = await importBackupFromJson(exported);

    expect(result).toMatchObject({ ok: true });
    await expect(loadAdoptedAt()).resolves.toBe('2026-06-01T10:00:00.000Z');
  });

  it('setErrorCaptureEnabled preserva adoptedAt e onboardingCompletedAt (read-merge-put)', async () => {
    await captureAdoption('2026-06-01T10:00:00.000Z');
    await markOnboardingCompleted('2026-06-09T08:00:00.000Z');

    await setErrorCaptureEnabled(true);

    const record = await db.appMeta.get('app');

    expect(record?.errorCaptureEnabled).toBe(true);
    expect(record?.adoptedAt).toBe('2026-06-01T10:00:00.000Z');
    expect(record?.onboardingCompletedAt).toBe('2026-06-09T08:00:00.000Z');
  });
});

describe('errorLog — captura mínima de erros (Fase 1, opt-in)', () => {
  it('recordGlobalError NÃO grava quando a captura está desligada (default)', async () => {
    await recordGlobalError({ kind: 'error', message: 'boom' });

    await expect(loadErrorLog()).resolves.toEqual([]);
  });

  it('recordGlobalError grava no errorLog quando habilitado', async () => {
    await setErrorCaptureEnabled(true);

    await recordGlobalError(
      { kind: 'unhandledrejection', message: 'promise vazou', stack: 'at foo:1' },
      '2026-06-01T00:00:00.000Z',
    );

    const records = await loadErrorLog();

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      kind: 'unhandledrejection',
      message: 'promise vazou',
      stack: 'at foo:1',
      at: '2026-06-01T00:00:00.000Z',
    });
  });

  it('toggle persiste (loadErrorCaptureEnabled lê o que setErrorCaptureEnabled gravou)', async () => {
    expect(await loadErrorCaptureEnabled()).toBe(false);

    await setErrorCaptureEnabled(true);
    expect(await loadErrorCaptureEnabled()).toBe(true);

    await setErrorCaptureEnabled(false);
    expect(await loadErrorCaptureEnabled()).toBe(false);
  });

  it('mantém só os últimos 100 registros (cap — descarta os mais antigos)', async () => {
    await setErrorCaptureEnabled(true);

    // Datas crescentes válidas (1 dia por registro): i=0 é o mais antigo.
    for (let i = 0; i < 120; i += 1) {
      const at = new Date(Date.UTC(2026, 0, 1 + i)).toISOString();
      await appendErrorLog({ kind: 'error', message: `err-${String(i)}` }, at);
    }

    const records = await loadErrorLog();

    expect(records).toHaveLength(100);
    // Os 20 mais antigos (err-0..err-19) foram descartados; o mais antigo
    // remanescente é err-20, o mais novo é err-119 (loadErrorLog ordena por `at`).
    expect(records[0]?.message).toBe('err-20');
    expect(records[99]?.message).toBe('err-119');
  });

  it('exportErrorLogAsJson produz JSON dedicado (fora do backup principal)', async () => {
    await appendErrorLog({ kind: 'error', message: 'algo' }, '2026-06-01T00:00:00.000Z');

    const json = await exportErrorLogAsJson('2026-06-02T00:00:00.000Z');
    const parsed = JSON.parse(json) as { format: string; version: number; records: { message: string }[] };

    expect(parsed.format).toBe('lichess-tutor-errorlog');
    expect(parsed.version).toBe(1);
    expect(parsed.records).toHaveLength(1);
    expect(parsed.records[0]?.message).toBe('algo');

    // errorLog NÃO entra no backup principal.
    expect(await exportAllAsJson()).not.toContain('lichess-tutor-errorlog');
  });

  it('clearErrorLog esvazia o errorLog', async () => {
    await appendErrorLog({ kind: 'error', message: 'x' });
    await expect(loadErrorLog()).resolves.toHaveLength(1);

    await clearErrorLog();

    await expect(loadErrorLog()).resolves.toEqual([]);
  });
});

describe('loadStoredPuzzleWeakness (1B: fraqueza de puzzle durável)', () => {
  const puzzleWeakness: Weakness = {
    tag: 'fork',
    score: 0.6,
    confidence: 'medium',
    evidence: 'Sinal durável de puzzle.',
    observedAt: '2026-06-06T00:00:00.000Z',
    source: 'puzzle',
  };

  it('retorna fraqueza de puzzle salva quando dentro do prazo', async () => {
    await replaceWeaknesses([puzzleWeakness]);

    const result = await loadStoredPuzzleWeakness('2026-06-22T00:00:00.000Z');

    expect(result).toMatchObject({ tag: 'fork', source: 'puzzle', observedAt: '2026-06-06T00:00:00.000Z' });
  });

  it('retorna undefined quando fraqueza de puzzle expirou (> 90 dias)', async () => {
    await replaceWeaknesses([puzzleWeakness]);

    // 91 dias após 2026-06-06 = 2026-09-05
    const result = await loadStoredPuzzleWeakness('2026-09-05T00:00:00.000Z');

    expect(result).toBeUndefined();
  });

  it('retorna undefined quando não há fraqueza de puzzle armazenada', async () => {
    const nonPuzzleWeakness: Weakness = { tag: 'pin', score: 0.5, confidence: 'low', evidence: 'Sinal de partida.' };

    await replaceWeaknesses([nonPuzzleWeakness]);

    const result = await loadStoredPuzzleWeakness('2026-06-22T00:00:00.000Z');

    expect(result).toBeUndefined();
  });
});
