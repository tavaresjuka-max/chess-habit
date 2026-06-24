// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DailyPlan, LearnerProfile, PlanBlock, TrainingLog } from '../domain';
import { advancePendingItem } from '../domain/method';
import type { PendingTrainingItem } from '../domain/method/types';
import {
  getTrainingLog,
  savePendingItem,
  savePlan,
  saveTrainingLog,
  saveTrainingLogAndPlan,
} from '../infra/storage/appData';
import { syncAchievements } from './achievementsSync';
import { useTrainingActions, type UseTrainingActionsInput } from './useTrainingActions';

vi.mock('../infra/storage/appData', () => ({
  getTrainingLog: vi.fn(),
  savePendingItem: vi.fn(),
  savePlan: vi.fn(),
  saveTrainingLog: vi.fn(),
  saveTrainingLogAndPlan: vi.fn(),
}));

vi.mock('./achievementsSync', () => ({
  syncAchievements: vi.fn(),
}));

// advancePendingItem é a unidade que decide adiar (testada à parte). Aqui o foco é o
// FIO: status 'deferred' precisa surfar a deferReason pro aluno (Pilar A/B).
vi.mock('../domain/method', async (importActual) => {
  const actual = await importActual<typeof import('../domain/method')>();
  return { ...actual, advancePendingItem: vi.fn() };
});

const profile: LearnerProfile = {
  lichessUsername: undefined,
  chesscomUsername: undefined,
  band: '800-1000',
  defaultSessionMinutes: 15,
  goals: ['treinar com constancia'],
  updatedAt: '2026-06-15T00:00:00.000Z',
};

const block: PlanBlock = {
  id: '2026-06-15-01-tema',
  sessionNumber: 1,
  title: 'Tema do dia: garfos',
  source: 'lichess',
  destination: {
    source: 'lichess',
    label: 'Lichess Video',
    url: 'https://lichess.org/video/mbiR0tcdqBY',
  },
  weaknessTag: 'fork',
  resourceStage: 'explain',
  estimatedMinutes: 5,
  task: 'Revise uma explicacao curta.',
  stopRule: 'Pare no tempo.',
  reason: 'Garfos frequentes.',
  coachNote: 'Revise com calma.',
  status: 'pending',
  updatedAt: '2026-06-15T10:00:00.000Z',
};

const plan: DailyPlan = {
  date: '2026-06-15',
  sessionMinutes: 15,
  weeklyFocus: {
    tag: 'fork',
    title: 'garfos',
    reason: 'Garfos frequentes.',
    startsOn: '2026-06-15',
  },
  blocks: [block],
  generatedFromWeaknessesAt: '2026-06-15T10:00:00.000Z',
};

const activeLog: TrainingLog = {
  id: '2026-06-15:2026-06-15-01-tema',
  date: '2026-06-15',
  blockId: block.id,
  blockTitle: block.title,
  source: 'lichess',
  destinationLabel: 'Lichess Video',
  plannedSeconds: 300,
  startedAt: '2026-06-15T10:00:00.000Z',
  timeLimitReached: false,
  status: 'active',
  updatedAt: '2026-06-15T10:00:00.000Z',
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-15T10:05:00.000Z'));
  vi.mocked(getTrainingLog).mockResolvedValue(activeLog);
  vi.mocked(savePendingItem).mockResolvedValue(undefined);
  vi.mocked(savePlan).mockResolvedValue(undefined);
  vi.mocked(saveTrainingLog).mockResolvedValue(undefined);
  vi.mocked(saveTrainingLogAndPlan).mockResolvedValue(undefined);
  vi.mocked(syncAchievements).mockResolvedValue([]);
  vi.mocked(advancePendingItem).mockImplementation((item) => item);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useTrainingActions', () => {
  it('completes a block by saving the done log and updated plan atomically', async () => {
    const input = createInput();
    const { result } = renderHook(() => useTrainingActions(input));

    await act(async () => {
      await result.current.completeBlockTraining(block.id, 'good');
    });

    expect(saveTrainingLogAndPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        id: activeLog.id,
        status: 'done',
        feedback: 'good',
        completedAt: '2026-06-15T10:05:00.000Z',
      }),
      expect.objectContaining({
        blocks: [expect.objectContaining({ id: block.id, status: 'done', feedback: 'good' })],
      }),
    );
    expect(input.setTrainingLogs).toHaveBeenCalledWith([
      expect.objectContaining({ id: activeLog.id, status: 'done' }),
    ]);
    expect(input.setAchievements).toHaveBeenCalledWith([]);
    expect(input.setTodayPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        blocks: [expect.objectContaining({ id: block.id, status: 'done' })],
      }),
    );
    expect(input.setErrorMessage).toHaveBeenCalledWith(undefined);
  });

  it('mostra a nota honesta de adiamento (deferReason) quando o gate de dificuldade adia o item', async () => {
    const pendingItem: PendingTrainingItem = {
      id: 'pending-1',
      origin: 'puzzle',
      title: 'Peca pendurada',
      weaknessTag: 'hanging-piece',
      methodTrackId: 'pending-review',
      lichessTheme: 'hangingPiece',
      prompt: 'Treine o tema.',
      dueAt: '2026-06-15T00:00:00.000Z',
      attempts: 6,
      status: 'open',
      createdAt: '2026-06-10T00:00:00.000Z',
      updatedAt: '2026-06-14T00:00:00.000Z',
    };
    const deferReason =
      'Puzzles deste tema ficaram difíceis demais pro seu nível agora — adiado até reforçar a base.';
    vi.mocked(advancePendingItem).mockReturnValue({ ...pendingItem, status: 'deferred', deferReason });

    const blockWithPending: PlanBlock = { ...block, pendingItemId: 'pending-1' };
    const planWithPending: DailyPlan = { ...plan, blocks: [blockWithPending] };
    const setLichessMessage = vi.fn();
    const setPendingItems = vi.fn();
    const input = createInput({
      pendingItems: [pendingItem],
      todayPlan: planWithPending,
      setLichessMessage,
      setPendingItems,
    });
    const { result } = renderHook(() => useTrainingActions(input));

    await act(async () => {
      await result.current.completeBlockTraining(block.id, 'good');
    });

    // Adiado sai da lista ativa (como 'done')...
    expect(setPendingItems).toHaveBeenCalledWith([]);
    // ...mas a nota honesta aparece pro aluno em vez de o item sumir em silêncio.
    expect(setLichessMessage).toHaveBeenCalledWith(deferReason);
  });
});

function createInput(overrides: Partial<UseTrainingActionsInput> = {}): UseTrainingActionsInput {
  return {
    allTrainingLogs: [activeLog],
    diplomaAttempts: [],
    pendingItems: [],
    profile,
    todayPlan: plan,
    trainingLogs: [activeLog],
    weaknesses: [{ tag: 'fork', score: 0.6, confidence: 'medium', evidence: 'Garfos frequentes.' }],
    setAchievements: vi.fn(),
    setAllTrainingLogs: vi.fn(),
    setErrorMessage: vi.fn(),
    setLichessMessage: vi.fn(),
    setPendingItems: vi.fn(),
    setTodayPlan: vi.fn(),
    setTrainingLogs: vi.fn(),
    ...overrides,
  };
}
