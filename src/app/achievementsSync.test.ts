import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrainingLog } from '../domain';
import {
  loadAchievements,
  loadDonePendingItems,
  loadPlacementCompletion,
  saveAchievements,
} from '../infra/storage/appData';
import { syncAchievements } from './achievementsSync';

vi.mock('../infra/storage/appData', () => ({
  loadAchievements: vi.fn(),
  loadDonePendingItems: vi.fn(),
  loadPlacementCompletion: vi.fn(),
  saveAchievements: vi.fn(),
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  vi.mocked(loadAchievements).mockResolvedValue([]);
  vi.mocked(loadDonePendingItems).mockResolvedValue([]);
  vi.mocked(loadPlacementCompletion).mockResolvedValue(undefined);
  vi.mocked(saveAchievements).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('syncAchievements', () => {
  it('persists newly unlocked achievements and returns the full sorted list', async () => {
    vi.mocked(loadAchievements).mockResolvedValue([
      { id: 'calibrado', unlockedAt: '2026-06-01T00:00:00.000Z' },
    ]);

    const achievements = await syncAchievements([
      doneLog('a', '2026-06-10', 1_200),
      doneLog('b', '2026-06-11', 1_200),
      doneLog('c', '2026-06-12', 1_200),
    ]);

    expect(saveAchievements).toHaveBeenCalledWith([
      { id: 'primeira-hora', unlockedAt: '2026-06-15T12:00:00.000Z' },
    ]);
    expect(achievements.map((achievement) => achievement.id)).toEqual(['calibrado', 'primeira-hora']);
  });
});

function doneLog(id: string, date: string, elapsedSeconds: number): TrainingLog {
  return {
    id,
    date,
    blockId: `${id}-block`,
    blockTitle: 'Treino',
    source: 'lichess',
    destinationLabel: 'Lichess Video',
    plannedSeconds: elapsedSeconds,
    startedAt: `${date}T10:00:00.000Z`,
    completedAt: `${date}T10:20:00.000Z`,
    elapsedSeconds,
    timeLimitReached: true,
    status: 'done',
    updatedAt: `${date}T10:20:00.000Z`,
  };
}
