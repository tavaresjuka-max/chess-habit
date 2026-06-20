// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DailyPlan, LearnerProfile, TrainingLog } from '../domain';
import type { PendingTrainingItem } from '../domain/method/types';
import { getTrainingLog, savePendingItem, savePlan, updatePendingItemStatus } from '../infra/storage/appData';
import { openExternalUrl } from './externalOpen';
import { suggestPendingFromHardFeedback } from './trainingLogFlow';
import { usePendingActions, type UsePendingActionsInput } from './usePendingActions';

vi.mock('../infra/storage/appData', () => ({
  getTrainingLog: vi.fn(),
  savePendingItem: vi.fn(),
  savePlan: vi.fn(),
  updatePendingItemStatus: vi.fn(),
}));

vi.mock('./externalOpen', () => ({
  openExternalUrl: vi.fn(),
}));

vi.mock('./trainingLogFlow', () => ({
  suggestPendingFromHardFeedback: vi.fn(),
}));

// stateHelpers used internally — keep real implementation
vi.mock('./stateHelpers', async (importOriginal) => {
  return await importOriginal();
});

const profile: LearnerProfile = {
  lichessUsername: 'jukasparov',
  band: '800-1000',
  defaultSessionMinutes: 15,
  goals: ['rotina'],
  updatedAt: '2026-06-20T00:00:00.000Z',
};

const pendingItem: PendingTrainingItem = {
  id: 'pending-1',
  origin: 'puzzle',
  title: 'Garfo para revisar',
  weaknessTag: 'fork',
  methodTrackId: 'pending-review',
  prompt: 'Resolva este garfo.',
  dueAt: '2026-06-21T00:00:00.000Z',
  attempts: 0,
  status: 'open',
  lichessUrl: 'https://lichess.org/training/fork',
  createdAt: '2026-06-20T00:00:00.000Z',
  updatedAt: '2026-06-20T00:00:00.000Z',
};

const planBlock: DailyPlan['blocks'][number] = {
  id: 'block-fork',
  title: 'Garfos',
  source: 'lichess',
  destination: { source: 'lichess', label: 'Lichess Puzzles', url: 'https://lichess.org/training/fork' },
  weaknessTag: 'fork',
  methodTrackId: 'pending-review',
  estimatedMinutes: 15,
  task: 'Resolver 5 puzzles de garfo.',
  stopRule: 'Tempo esgotado ou 5 puzzles.',
  reason: 'Fraqueza detectada em garfos.',
  coachNote: 'Atenção ao cavaleiro.',
  status: 'pending',
  updatedAt: '2026-06-20T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(updatePendingItemStatus).mockResolvedValue(undefined);
  vi.mocked(savePlan).mockResolvedValue(undefined);
  vi.mocked(savePendingItem).mockResolvedValue(undefined);
  vi.mocked(openExternalUrl).mockReturnValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('usePendingActions', () => {
  describe('openPendingItem', () => {
    it('calls openExternalUrl and sets lichessMessage when item has a url', async () => {
      vi.mocked(openExternalUrl).mockReturnValue('Pendência aberta no Lichess.');

      const input = createInput();
      const { result } = renderHook(() => usePendingActions(input));

      await act(async () => {
        await result.current.openPendingItem(pendingItem);
      });

      expect(openExternalUrl).toHaveBeenCalledWith('https://lichess.org/training/fork');
      expect(input.setLichessMessage).toHaveBeenCalledWith('Pendência aberta no Lichess.');
    });

    it('sets a fallback message when item has no lichessUrl', async () => {
      const itemWithoutUrl: PendingTrainingItem = { ...pendingItem, lichessUrl: undefined };
      const input = createInput();
      const { result } = renderHook(() => usePendingActions(input));

      await act(async () => {
        await result.current.openPendingItem(itemWithoutUrl);
      });

      expect(openExternalUrl).not.toHaveBeenCalled();
      expect(input.setLichessMessage).toHaveBeenCalledWith(
        expect.stringContaining('sem link Lichess'),
      );
    });
  });

  describe('deferPendingItem', () => {
    it('marks item as deferred, removes it from list, and updates plan when profile and todayPlan exist', async () => {
      const todayPlan = makePlan('2026-06-20');
      const input = createInput({
        profile,
        todayPlan,
        pendingItems: [pendingItem],
      });
      const { result } = renderHook(() => usePendingActions(input));

      await act(async () => {
        await result.current.deferPendingItem(pendingItem);
      });

      expect(updatePendingItemStatus).toHaveBeenCalledWith('pending-1', 'deferred');
      expect(input.setPendingItems).toHaveBeenCalledWith([]);
      expect(savePlan).toHaveBeenCalledOnce();
      expect(input.setTodayPlan).toHaveBeenCalled();
      expect(input.setLichessMessage).toHaveBeenCalledWith('Pendência adiada.');
    });

    it('still defers and sets message even when profile is undefined (no plan regen)', async () => {
      const input = createInput({
        profile: undefined,
        todayPlan: undefined,
        pendingItems: [pendingItem],
      });
      const { result } = renderHook(() => usePendingActions(input));

      await act(async () => {
        await result.current.deferPendingItem(pendingItem);
      });

      expect(updatePendingItemStatus).toHaveBeenCalledWith('pending-1', 'deferred');
      expect(savePlan).not.toHaveBeenCalled();
      expect(input.setLichessMessage).toHaveBeenCalledWith('Pendência adiada.');
    });
  });

  describe('savePendingFromHardFeedback', () => {
    it('saves pending item and updates state when block and log exist', async () => {
      const log = makeLog('2026-06-20:block-fork', '2026-06-20');
      const todayPlan: DailyPlan = {
        date: '2026-06-20',
        sessionMinutes: 15,
        generatedFromWeaknessesAt: '2026-06-20T06:00:00.000Z',
        blocks: [planBlock],
      };
      vi.mocked(getTrainingLog).mockResolvedValue(log);
      vi.mocked(suggestPendingFromHardFeedback).mockResolvedValue(pendingItem);

      const input = createInput({ todayPlan, pendingItems: [] });
      const { result } = renderHook(() => usePendingActions(input));

      await act(async () => {
        await result.current.savePendingFromHardFeedback('block-fork');
      });

      expect(getTrainingLog).toHaveBeenCalledWith('2026-06-20:block-fork');
      expect(suggestPendingFromHardFeedback).toHaveBeenCalled();
      expect(savePendingItem).toHaveBeenCalledWith(pendingItem);
      expect(input.setPendingItems).toHaveBeenCalled();
      expect(input.setLichessMessage).toHaveBeenCalledWith('Pendência guardada para revisão amanhã.');
      expect(input.setErrorMessage).toHaveBeenCalledWith(undefined);
    });

    it('sets errorMessage and aborts when block has no weaknessTag', async () => {
      const blockNoTag: DailyPlan['blocks'][number] = {
        ...planBlock,
        id: 'block-no-tag',
        weaknessTag: undefined,
        methodTrackId: undefined,
      };
      const todayPlan: DailyPlan = {
        date: '2026-06-20',
        sessionMinutes: 15,
        generatedFromWeaknessesAt: '2026-06-20T06:00:00.000Z',
        blocks: [blockNoTag],
      };
      const input = createInput({ todayPlan });
      const { result } = renderHook(() => usePendingActions(input));

      await act(async () => {
        await result.current.savePendingFromHardFeedback('block-no-tag');
      });

      expect(getTrainingLog).not.toHaveBeenCalled();
      expect(savePendingItem).not.toHaveBeenCalled();
      expect(input.setErrorMessage).toHaveBeenCalledWith(expect.stringContaining('pendência'));
    });

    it('sets errorMessage when log is not found for the block', async () => {
      const todayPlan: DailyPlan = {
        date: '2026-06-20',
        sessionMinutes: 15,
        generatedFromWeaknessesAt: '2026-06-20T06:00:00.000Z',
        blocks: [planBlock],
      };
      vi.mocked(getTrainingLog).mockResolvedValue(undefined);

      const input = createInput({ todayPlan });
      const { result } = renderHook(() => usePendingActions(input));

      await act(async () => {
        await result.current.savePendingFromHardFeedback('block-fork');
      });

      expect(savePendingItem).not.toHaveBeenCalled();
      expect(input.setErrorMessage).toHaveBeenCalledWith(expect.stringContaining('bloco'));
    });
  });
});

function createInput(overrides: Partial<UsePendingActionsInput> = {}): UsePendingActionsInput {
  return {
    pendingItems: [],
    profile: undefined,
    todayPlan: undefined,
    trainingLogs: [],
    weaknesses: [],
    diplomaAttempts: [],
    setErrorMessage: vi.fn(),
    setLichessMessage: vi.fn(),
    setPendingItems: vi.fn(),
    setTodayPlan: vi.fn(),
    ...overrides,
  };
}

function makePlan(date: string): DailyPlan {
  return {
    date,
    sessionMinutes: 15,
    generatedFromWeaknessesAt: `${date}T06:00:00.000Z`,
    blocks: [],
  };
}

function makeLog(id: string, date: string): TrainingLog {
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
