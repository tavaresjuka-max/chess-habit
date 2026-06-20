// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DailyPlan, LearnerProfile, TrainingLog } from '../domain';
import {
  loadProfile,
  loadTrainingLogs,
  loadTrainingLogsForDate,
  markOnboardingCompleted,
  savePlacementResult,
  savePlan,
  saveProfile,
} from '../infra/storage/appData';
import { syncAchievements } from './achievementsSync';
import { usePlanLifecycleActions, type UsePlanLifecycleActionsInput } from './usePlanLifecycleActions';

vi.mock('../infra/storage/appData', () => ({
  loadProfile: vi.fn(),
  loadTrainingLogs: vi.fn(),
  loadTrainingLogsForDate: vi.fn(),
  markOnboardingCompleted: vi.fn(),
  savePlacementResult: vi.fn(),
  savePlan: vi.fn(),
  saveProfile: vi.fn(),
}));

vi.mock('./achievementsSync', () => ({
  syncAchievements: vi.fn(),
}));

// date module – freeze to a fixed date so plan.date is deterministic
vi.mock('./date', () => ({
  getTodayDate: vi.fn(() => '2026-06-20'),
}));

const profile: LearnerProfile = {
  lichessUsername: 'jukasparov',
  band: '800-1000',
  defaultSessionMinutes: 15,
  goals: ['rotina'],
  updatedAt: '2026-06-20T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(loadProfile).mockResolvedValue(undefined);
  vi.mocked(savePlan).mockResolvedValue(undefined);
  vi.mocked(saveProfile).mockResolvedValue(undefined);
  vi.mocked(savePlacementResult).mockResolvedValue(undefined);
  vi.mocked(markOnboardingCompleted).mockResolvedValue(undefined);
  vi.mocked(loadTrainingLogs).mockResolvedValue([]);
  vi.mocked(loadTrainingLogsForDate).mockResolvedValue([]);
  vi.mocked(syncAchievements).mockResolvedValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('usePlanLifecycleActions', () => {
  describe('regeneratePlan', () => {
    it('saves plan and updates setTodayPlan / setSessionMinutes when profile exists', async () => {
      const input = createInput({ profile });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.regeneratePlan(30);
      });

      expect(savePlan).toHaveBeenCalledOnce();
      const savedPlan = vi.mocked(savePlan).mock.calls[0]?.[0];
      expect(savedPlan?.date).toBe('2026-06-20');
      expect(input.setSessionMinutes).toHaveBeenCalledWith(30);
      expect(input.setTodayPlan).toHaveBeenCalledWith(savedPlan);
      expect(input.setErrorMessage).toHaveBeenCalledWith(undefined);
    });

    it('redirects to config and does not save when profile is undefined', async () => {
      const input = createInput({ profile: undefined });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.regeneratePlan(15);
      });

      expect(savePlan).not.toHaveBeenCalled();
      expect(input.setActiveView).toHaveBeenCalledWith('config');
    });
  });

  describe('createNextSession', () => {
    it('creates the first session plan and loads training logs when todayPlan is undefined', async () => {
      const input = createInput({ profile, todayPlan: undefined });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.createNextSession(15);
      });

      expect(savePlan).toHaveBeenCalledOnce();
      expect(input.setSessionMinutes).toHaveBeenCalledWith(15);
      expect(input.setTodayPlan).toHaveBeenCalled();
      expect(loadTrainingLogsForDate).toHaveBeenCalledWith('2026-06-20');
      expect(loadTrainingLogs).toHaveBeenCalled();
      expect(input.setErrorMessage).toHaveBeenCalledWith(undefined);
    });

    it('appends a new session to an existing plan and reloads logs', async () => {
      const todayPlan = makePlan('2026-06-20');
      const input = createInput({ profile, todayPlan });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.createNextSession(15);
      });

      expect(savePlan).toHaveBeenCalledOnce();
      const savedPlan = vi.mocked(savePlan).mock.calls[0]?.[0];
      // appendPlanSession merges sessions; resulting plan keeps the original date
      expect(savedPlan?.date).toBe('2026-06-20');
      expect(loadTrainingLogsForDate).toHaveBeenCalledWith('2026-06-20');
    });
  });

  describe('savePlacementResult', () => {
    it('persists placement and syncs achievements', async () => {
      const input = createInput({ profile });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.savePlacementResult({
          band: '800-1000',
          confidence: 'medium',
          calibrated: true,
          completedAt: '2026-06-20T00:00:00.000Z',
        });
      });

      expect(savePlacementResult).toHaveBeenCalledWith(
        expect.objectContaining({ band: '800-1000', confidence: 'medium' }),
      );
      expect(syncAchievements).toHaveBeenCalled();
      expect(input.setAchievements).toHaveBeenCalled();
    });
  });

  describe('approveLearningPlan', () => {
    it('saves plan with status approved when todayPlan exists', async () => {
      const todayPlan = makePlan('2026-06-20');
      const input = createInput({ profile, todayPlan });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.approveLearningPlan();
      });

      expect(savePlan).toHaveBeenCalledOnce();
      const savedPlan = vi.mocked(savePlan).mock.calls[0]?.[0];
      expect(savedPlan?.learningPlanResponse?.status).toBe('approved');
      expect(input.setTodayPlan).toHaveBeenCalledWith(savedPlan);
    });

    it('does not call savePlan when todayPlan is undefined', async () => {
      const input = createInput({ profile, todayPlan: undefined });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.approveLearningPlan();
      });

      expect(savePlan).not.toHaveBeenCalled();
    });
  });

  describe('completeOnboarding', () => {
    it('marks onboarding completed and updates setOnboardingCompletedAt', async () => {
      const input = createInput({ profile });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.completeOnboarding();
      });

      expect(markOnboardingCompleted).toHaveBeenCalled();
      expect(input.setOnboardingCompletedAt).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/));
    });
  });

  describe('persistência de estágio por tema (PED-3)', () => {
    it('grava themeStages no perfil ao criar a próxima sessão', async () => {
      const input = createInput({ profile });
      const { result } = renderHook(() => usePlanLifecycleActions(input));

      await act(async () => {
        await result.current.createNextSession(15);
      });

      const savedProfile = vi.mocked(saveProfile).mock.calls[0]?.[0];
      expect(savedProfile?.themeStages).toBeDefined();
      expect(Object.keys(savedProfile?.themeStages ?? {}).length).toBeGreaterThan(0);
      expect(input.setProfile).toHaveBeenCalled();
    });
  });
});

function createInput(
  overrides: Partial<UsePlanLifecycleActionsInput> = {},
): UsePlanLifecycleActionsInput {
  return {
    allTrainingLogs: [],
    diplomaAttempts: [],
    pendingItems: [],
    profile: undefined,
    todayPlan: undefined,
    trainingLogs: [],
    weaknesses: [],
    setAchievements: vi.fn(),
    setActiveView: vi.fn(),
    setAllTrainingLogs: vi.fn(),
    setErrorMessage: vi.fn(),
    setOnboardingCompletedAt: vi.fn(),
    setProfile: vi.fn(),
    setSessionMinutes: vi.fn(),
    setTodayPlan: vi.fn(),
    setTrainingLogs: vi.fn(),
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

// suppress unused warning — makeLog kept for future tests
void makeLog;
