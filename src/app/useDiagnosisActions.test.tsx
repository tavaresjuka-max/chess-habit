// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DailyPlan, LearnerProfile, Signal } from '../domain';
import { importChesscomSignals } from '../infra/chesscom/chesscomClient';
import { importLichessSignals } from '../infra/lichess/games';
import {
  appendSignals,
  loadChesscomMonthCache,
  loadLichessOAuthToken,
  loadSignals,
  replaceSignalsForSource,
  replaceWeaknesses,
  saveChesscomMonthCache,
  savePlan,
} from '../infra/storage/appData';
import { useDiagnosisActions, type UseDiagnosisActionsInput } from './useDiagnosisActions';

vi.mock('../infra/chesscom/chesscomClient', () => ({
  importChesscomSignals: vi.fn(),
}));

vi.mock('../infra/lichess/games', () => ({
  importLichessSignals: vi.fn(),
}));

vi.mock('../infra/storage/appData', () => ({
  appendSignals: vi.fn(),
  loadChesscomMonthCache: vi.fn(),
  loadLichessOAuthToken: vi.fn(),
  loadSignals: vi.fn(),
  replaceSignalsForSource: vi.fn(),
  replaceWeaknesses: vi.fn(),
  saveChesscomMonthCache: vi.fn(),
  savePlan: vi.fn(),
}));

const profile: LearnerProfile = {
  lichessUsername: undefined,
  chesscomUsername: 'jukatavares',
  band: '800-1000',
  defaultSessionMinutes: 15,
  goals: ['treinar com constancia'],
  updatedAt: '2026-06-15T00:00:00.000Z',
};

const chesscomSignal: Signal = {
  source: 'chesscom',
  confidence: 'medium',
  observedAt: '2026-06-15T00:00:00.000Z',
  value: { kind: 'judgment', blunders: 4, mistakes: 0, inaccuracies: 0, games: 6 },
};

beforeEach(() => {
  vi.mocked(importChesscomSignals).mockResolvedValue([chesscomSignal]);
  vi.mocked(importLichessSignals).mockResolvedValue([]);
  vi.mocked(appendSignals).mockResolvedValue(undefined);
  vi.mocked(loadChesscomMonthCache).mockResolvedValue(undefined);
  vi.mocked(loadLichessOAuthToken).mockResolvedValue(undefined);
  vi.mocked(loadSignals).mockResolvedValue([chesscomSignal]);
  vi.mocked(replaceSignalsForSource).mockResolvedValue(undefined);
  vi.mocked(replaceWeaknesses).mockResolvedValue(undefined);
  vi.mocked(saveChesscomMonthCache).mockResolvedValue(undefined);
  vi.mocked(savePlan).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useDiagnosisActions', () => {
  it('syncs Chess.com signals into persisted weaknesses and a regenerated plan', async () => {
    const input = createInput();
    const { result } = renderHook(() => useDiagnosisActions(input));

    await act(async () => {
      await result.current.syncChesscomDiagnosis();
    });

    expect(importChesscomSignals).toHaveBeenCalledWith(
      'jukatavares',
      expect.objectContaining({
        band: '800-1000',
        cache: {
          loadMonth: loadChesscomMonthCache,
          saveMonth: saveChesscomMonthCache,
        },
      }),
    );
    expect(replaceSignalsForSource).toHaveBeenCalledWith('chesscom', [chesscomSignal]);
    expect(replaceWeaknesses).toHaveBeenCalledWith([
      expect.objectContaining({ tag: 'blunder-rate', confidence: 'medium' }),
    ]);
    const savedPlan = vi.mocked(savePlan).mock.calls[0]?.[0];

    expect(savedPlan?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(input.setDiagnosisState).toHaveBeenLastCalledWith('success');
    expect(input.setErrorMessage).toHaveBeenCalledWith(undefined);
  });
});

function createInput(overrides: Partial<UseDiagnosisActionsInput> = {}): UseDiagnosisActionsInput {
  return {
    profile,
    todayPlan: undefined,
    sessionMinutes: 15,
    trainingLogs: [],
    pendingItems: [],
    diplomaAttempts: [],
    latestPlanRef: { current: undefined as DailyPlan | undefined },
    setActiveView: vi.fn(),
    setDiagnosisState: vi.fn(),
    setDiagnosisMessage: vi.fn(),
    setErrorMessage: vi.fn(),
    setSignals: vi.fn(),
    setWeaknesses: vi.fn(),
    setTodayPlan: vi.fn(),
    setLichessConnectionState: vi.fn(),
    setLichessMessage: vi.fn(),
    ...overrides,
  };
}
