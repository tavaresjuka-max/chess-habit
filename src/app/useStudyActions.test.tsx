// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Achievement, TrainingLog } from '../domain';
import {
  loadLichessOAuthToken,
  saveTrainingLog,
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
  saveDiplomaAttempt: vi.fn(),
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
