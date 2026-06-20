// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generatePlan, type Achievement, type LearnerProfile, type TrainingLog } from '../domain';
import type { DiplomaAttempt } from '../domain/method/types';
import {
  loadLichessOAuthToken,
  loadProfile,
  loadTrainingLogs,
  loadTrainingLogsForDate,
  saveProfile,
  saveTrainingLog,
  saveTrainingLogsAndPlan,
} from '../infra/storage/appData';
import { syncAchievements } from './achievementsSync';
import {
  mergeTrainingLogs,
  reconcileLichessPuzzleDiagnostics,
} from './trainingLogFlow';
import { useStudyActions, type UseStudyActionsInput } from './useStudyActions';

vi.mock('../infra/storage/appData', () => ({
  getLichessStudyLink: vi.fn(),
  loadLichessOAuthToken: vi.fn(),
  loadProfile: vi.fn(),
  loadTrainingLogs: vi.fn(),
  loadTrainingLogsForDate: vi.fn(),
  saveDiplomaAttempt: vi.fn(),
  saveDiplomaAttempts: vi.fn(),
  saveLichessStudyLink: vi.fn(),
  saveProfile: vi.fn(),
  saveTrainingLog: vi.fn(),
  saveTrainingLogsAndPlan: vi.fn(),
}));

vi.mock('./achievementsSync', () => ({
  syncAchievements: vi.fn(),
}));

vi.mock('./trainingLogFlow', () => ({
  importFreeActivity: vi.fn(),
  mergeTrainingLogs: vi.fn((existing: TrainingLog[], incoming: TrainingLog[]) => [...existing, ...incoming]),
  reconcileLichessPuzzleDiagnostics: vi.fn(),
  upsertTrainingLog: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(loadLichessOAuthToken).mockResolvedValue({
    accessToken: 'secret-token',
    tokenType: 'Bearer',
    scopes: ['puzzle:read'],
    obtainedAt: '2026-06-19T10:00:00.000Z',
    expiresAt: '2099-01-01T00:00:00.000Z',
  });
  vi.mocked(saveTrainingLog).mockResolvedValue(undefined);
  vi.mocked(loadProfile).mockResolvedValue(undefined);
  // Releitura fresca do reconcile (anti-race): espelha o estado que a closure padrão
  // assume (allTrainingLogs = [existingLog]); o dia começa vazio.
  vi.mocked(loadTrainingLogs).mockResolvedValue([existingLog]);
  vi.mocked(loadTrainingLogsForDate).mockResolvedValue([]);
  vi.mocked(reconcileLichessPuzzleDiagnostics).mockResolvedValue([reconciledLog]);
  vi.mocked(syncAchievements).mockResolvedValue([unlockedAchievement]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useStudyActions', () => {
  it('syncs achievements after reconciling Lichess puzzle results', async () => {
    const input = createInput();
    const { result } = renderHook(() => useStudyActions(input));

    await act(async () => {
      await result.current.reconcileLichessResults();
    });

    expect(reconcileLichessPuzzleDiagnostics).toHaveBeenCalledWith([], 'secret-token');
    expect(mergeTrainingLogs).toHaveBeenCalledWith([existingLog], [reconciledLog]);
    expect(syncAchievements).toHaveBeenCalledWith([existingLog, reconciledLog]);
    expect(input.setAchievements).toHaveBeenCalledWith([unlockedAchievement]);
    expect(input.setLichessConnectionState).toHaveBeenLastCalledWith('connected');
  });

  it('promove a banda e persiste o perfil quando o diploma da banda foi conquistado (Decisão #1)', async () => {
    const profile: LearnerProfile = {
      lichessUsername: 'jukasparov',
      band: '400-800',
      defaultSessionMinutes: 15,
      goals: ['rotina'],
      updatedAt: '2026-06-06T00:00:00.000Z',
    };
    // Diploma do Peão já conquistado (ambas as seções passadas) -> applyDiplomaProgress
    // promove 400-800 -> 800-1000 dentro do reconcile, sem botão de banda separado.
    const peaoAttempts = [diplomaSection('peao', 'valor-pecas'), diplomaSection('peao', 'mates-basicos')];
    const input = createInput({
      profile,
      todayPlan: generatePlan(profile, [], 15, '2026-06-19'),
      diplomaAttempts: peaoAttempts,
    });
    const { result } = renderHook(() => useStudyActions(input));

    await act(async () => {
      await result.current.reconcileLichessResults();
    });

    expect(vi.mocked(saveProfile)).toHaveBeenCalledWith(expect.objectContaining({ band: '800-1000' }));
    expect(input.setProfile).toHaveBeenCalledWith(expect.objectContaining({ band: '800-1000' }));
    expect(input.setLichessMessage).toHaveBeenLastCalledWith(expect.stringContaining('800-1000'));
  });

  it('não regenera nem sobrescreve o plano quando não há resultado novo (anti-race do boot)', async () => {
    vi.mocked(reconcileLichessPuzzleDiagnostics).mockResolvedValueOnce([]);
    const profile: LearnerProfile = {
      lichessUsername: 'jukasparov',
      band: '400-800',
      defaultSessionMinutes: 15,
      goals: [],
      updatedAt: '2026-06-06T00:00:00.000Z',
    };
    const input = createInput({ profile, todayPlan: generatePlan(profile, [], 15, '2026-06-19') });
    const { result } = renderHook(() => useStudyActions(input));

    await act(async () => {
      await result.current.reconcileLichessResults();
    });

    expect(saveTrainingLogsAndPlan).not.toHaveBeenCalled();
    expect(input.setTodayPlan).not.toHaveBeenCalled();
  });

  it('usa o plano mais recente (latestPlanRef), não a closure, ao reconciliar com resultado novo (anti-race)', async () => {
    const profile: LearnerProfile = {
      lichessUsername: 'jukasparov',
      band: '400-800',
      defaultSessionMinutes: 15,
      goals: [],
      updatedAt: '2026-06-06T00:00:00.000Z',
    };
    // Closure obsoleta aponta para o plano de ontem; latestPlanRef tem o de hoje (o
    // usuário avançou durante o fetch). O reconcile não pode reverter para a closure.
    const stalePlan = generatePlan(profile, [], 15, '2026-06-18');
    const freshPlan = generatePlan(profile, [], 15, '2026-06-19');
    const input = createInput({ profile, todayPlan: stalePlan, latestPlanRef: { current: freshPlan } });
    const { result } = renderHook(() => useStudyActions(input));

    await act(async () => {
      await result.current.reconcileLichessResults();
    });

    expect(saveTrainingLogsAndPlan).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ date: '2026-06-19' }),
    );
    expect(input.setTodayPlan).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-06-19' }));
  });
});

const existingLog = doneLog('existing-log', '2026-06-18');
const reconciledLog = doneLog('reconciled-log', '2026-06-19');
const unlockedAchievement: Achievement = {
  id: 'primeira-hora',
  unlockedAt: '2026-06-19T10:00:00.000Z',
};

function createInput(overrides: Partial<UseStudyActionsInput> = {}): UseStudyActionsInput {
  return {
    allTrainingLogs: [existingLog],
    diplomaAttempts: [],
    pendingItems: [],
    profile: undefined,
    todayPlan: undefined,
    latestPlanRef: { current: undefined },
    trainingLogs: [],
    weaknesses: [],
    setAchievements: vi.fn(),
    setAllTrainingLogs: vi.fn(),
    setDiplomaAttempts: vi.fn(),
    setLichessConnectionState: vi.fn(),
    setLichessMessage: vi.fn(),
    setLichessStudyLink: vi.fn(),
    setProfile: vi.fn(),
    setTodayPlan: vi.fn(),
    setTrainingLogs: vi.fn(),
    ...overrides,
  };
}

function diplomaSection(
  diplomaId: DiplomaAttempt['diplomaId'],
  sectionId: string,
): DiplomaAttempt {
  return {
    id: `${diplomaId}:${sectionId}`,
    diplomaId,
    sectionId,
    scorePercent: 95,
    totalItems: 30,
    passed: true,
    source: 'lichess',
    createdAt: '2026-06-18T00:00:00.000Z',
    updatedAt: '2026-06-18T00:00:00.000Z',
  };
}

function doneLog(id: string, date: string): TrainingLog {
  return {
    id,
    date,
    blockId: `${id}-block`,
    blockTitle: 'Treino',
    source: 'lichess',
    destinationLabel: 'Puzzles Lichess',
    plannedSeconds: 900,
    startedAt: `${date}T10:00:00.000Z`,
    completedAt: `${date}T10:15:00.000Z`,
    elapsedSeconds: 900,
    timeLimitReached: true,
    status: 'done',
    updatedAt: `${date}T10:15:00.000Z`,
  };
}
