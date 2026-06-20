import type { PlanBlockFeedback, PuzzleThemeStat } from '../types';

export type MasteryInput = {
  accuracyPercent: number;
  recentFeedbacks: ('easy' | 'good' | 'hard')[];
  minVolumeReached: boolean;
};

export type MasteryResult = 'advance' | 'review' | 'regress';

export type CompletedLogMasteryInput = {
  lichessTheme?: string;
  themeStats?: PuzzleThemeStat[];
  lastFeedback?: PlanBlockFeedback;
  currentFeedback?: PlanBlockFeedback;
  attempts: number;
};

export function computeMastery(input: MasteryInput): MasteryResult {
  const hasRecentHard = input.recentFeedbacks.slice(-2).includes('hard');

  if (!input.minVolumeReached) {
    return 'review';
  }

  if (input.accuracyPercent >= 80 && !hasRecentHard) {
    return 'advance';
  }

  if (input.accuracyPercent >= 50) {
    return 'review';
  }

  return 'regress';
}

export function masteryTargetFromCompletedLog(input: CompletedLogMasteryInput): MasteryResult {
  const recentFeedbacks = [input.lastFeedback, input.currentFeedback].filter(
    (feedback): feedback is PlanBlockFeedback => feedback !== undefined,
  );
  const themeStat =
    input.lichessTheme === undefined
      ? undefined
      : input.themeStats?.find((stat) => stat.theme === input.lichessTheme);

  if (themeStat === undefined || themeStat.attempts < 3) {
    return computeMastery({
      accuracyPercent: 0,
      recentFeedbacks,
      minVolumeReached: false,
    });
  }

  return computeMastery({
    accuracyPercent: ((themeStat.attempts - themeStat.losses) / themeStat.attempts) * 100,
    recentFeedbacks,
    minVolumeReached: true,
  });
}

export const DIPLOMA_THRESHOLDS: Record<string, number> = {
  peao: 90,
  torre: 80,
  rei: 75,
};
