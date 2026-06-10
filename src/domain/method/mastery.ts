export type MasteryInput = {
  accuracyPercent: number;
  recentFeedbacks: ('easy' | 'good' | 'hard')[];
  minVolumeReached: boolean;
};

export type MasteryResult = 'advance' | 'review' | 'regress';

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

export const DIPLOMA_THRESHOLDS: Record<string, number> = {
  peao: 90,
  torre: 80,
  rei: 75,
};
