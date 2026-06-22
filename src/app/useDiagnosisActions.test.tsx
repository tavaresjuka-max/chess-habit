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
  loadStoredPuzzleWeakness,
  loadWeaknesses,
  replaceSignalsForSource,
  replaceWeaknesses,
  saveChesscomMonthCache,
  savePlan,
} from '../infra/storage/appData';
import { bumpOperationEpoch } from './operationEpoch';
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
  loadStoredPuzzleWeakness: vi.fn(),
  loadWeaknesses: vi.fn(),
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

const lichessSignal: Signal = {
  source: 'lichess',
  confidence: 'medium',
  observedAt: '2026-06-15T00:01:00.000Z',
  value: { kind: 'manual', tag: 'fork', note: 'Sinal controlado do Lichess.' },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(importChesscomSignals).mockResolvedValue([chesscomSignal]);
  vi.mocked(importLichessSignals).mockResolvedValue([]);
  vi.mocked(appendSignals).mockResolvedValue(undefined);
  vi.mocked(loadChesscomMonthCache).mockResolvedValue(undefined);
  vi.mocked(loadLichessOAuthToken).mockResolvedValue(undefined);
  vi.mocked(loadSignals).mockResolvedValue([chesscomSignal]);
  vi.mocked(loadStoredPuzzleWeakness).mockResolvedValue(undefined);
  vi.mocked(loadWeaknesses).mockResolvedValue([]);
  vi.mocked(replaceSignalsForSource).mockResolvedValue(undefined);
  vi.mocked(replaceWeaknesses).mockResolvedValue(undefined);
  vi.mocked(saveChesscomMonthCache).mockResolvedValue(undefined);
  vi.mocked(savePlan).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
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

  it('keeps historic Chess.com signals in diagnosis even when generic freshness would decay them', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));

    const staleChesscomOpeningSignal: Signal = {
      source: 'chesscom',
      confidence: 'medium',
      observedAt: '2026-01-01T00:00:00.000Z',
      value: { kind: 'opening', eco: 'C20', name: 'King Pawn Game', games: 12, lossRate: 0.67 },
    };

    vi.mocked(importChesscomSignals).mockResolvedValue([staleChesscomOpeningSignal]);
    vi.mocked(loadSignals).mockResolvedValue([staleChesscomOpeningSignal]);

    const input = createInput();
    const { result } = renderHook(() => useDiagnosisActions(input));

    await act(async () => {
      await result.current.syncChesscomDiagnosis();
    });

    expect(replaceWeaknesses).toHaveBeenCalledWith([
      expect.objectContaining({ tag: 'opening-principles', confidence: 'medium' }),
    ]);
  });

  it('preserves the union of weaknesses when onboarding imports Chess.com and Lichess in parallel', async () => {
    vi.mocked(importLichessSignals).mockResolvedValue([lichessSignal]);

    let loadCount = 0;
    vi.mocked(loadSignals).mockImplementation(() => {
      loadCount += 1;
      return Promise.resolve(loadCount === 1 ? [chesscomSignal] : [chesscomSignal, lichessSignal]);
    });
    const completedWrites: string[][] = [];
    vi.mocked(replaceWeaknesses).mockImplementation(async (weaknesses) => {
      const tags = weaknesses.map((weakness) => weakness.tag);

      if (tags.includes('blunder-rate') && !tags.includes('fork')) {
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }

      completedWrites.push(tags);
    });

    const input = createInput({
      profile: { ...profile, lichessUsername: 'jukasparov' },
    });
    const { result } = renderHook(() => useDiagnosisActions(input));

    await act(async () => {
      await result.current.runOnboardingImport(input.profile as LearnerProfile);
    });

    expect(completedWrites.at(-1)).toEqual(expect.arrayContaining(['blunder-rate', 'fork']));
  });

  it('conta só fraquezas confiáveis (confidence != low) para rotear o onboarding', async () => {
    vi.mocked(loadWeaknesses).mockResolvedValue([
      { tag: 'blunder-rate', score: 0.3, confidence: 'low', evidence: 'pouca amostra' },
      { tag: 'fork', score: 0.6, confidence: 'medium', evidence: 'amostra ok' },
      { tag: 'opening-principles', score: 0.9, confidence: 'high', evidence: 'amostra forte' },
    ]);

    const input = createInput({ profile });
    const { result } = renderHook(() => useDiagnosisActions(input));

    let imported: { weaknessCount: number; confidentWeaknessCount: number } | undefined;
    await act(async () => {
      imported = await result.current.runOnboardingImport(input.profile as LearnerProfile);
    });

    // 3 fraquezas, mas só 2 confiáveis: poucos jogos (só 'low') iriam para a calibração.
    expect(imported).toEqual({ weaknessCount: 3, confidentWeaknessCount: 2 });
  });

  it('does not write an in-flight diagnosis after local data is cleared', async () => {
    let resolveSignals: ((signals: Signal[]) => void) | undefined;
    vi.mocked(importChesscomSignals).mockReturnValue(
      new Promise((resolve) => {
        resolveSignals = resolve;
      }),
    );

    const input = createInput();
    const { result } = renderHook(() => useDiagnosisActions(input));

    await act(async () => {
      const sync = result.current.syncChesscomDiagnosis();
      await Promise.resolve();
      bumpOperationEpoch();
      resolveSignals?.([chesscomSignal]);
      await sync;
    });

    expect(replaceSignalsForSource).not.toHaveBeenCalled();
    expect(replaceWeaknesses).not.toHaveBeenCalled();
    expect(savePlan).not.toHaveBeenCalled();
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
