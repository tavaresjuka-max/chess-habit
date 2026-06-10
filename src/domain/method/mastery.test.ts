import { describe, expect, it } from 'vitest';
import { computeMastery } from './mastery';

describe('computeMastery', () => {
  it('advances when accuracy is at least 80, volume is enough and recent feedback is not hard', () => {
    expect(
      computeMastery({
        accuracyPercent: 82,
        recentFeedbacks: ['good', 'easy', 'good'],
        minVolumeReached: true,
      }),
    ).toBe('advance');
  });

  it('reviews when accuracy is between 50 and 79', () => {
    expect(
      computeMastery({
        accuracyPercent: 65,
        recentFeedbacks: ['good'],
        minVolumeReached: true,
      }),
    ).toBe('review');
  });

  it('regresses when accuracy is below 50', () => {
    expect(
      computeMastery({
        accuracyPercent: 49,
        recentFeedbacks: ['good'],
        minVolumeReached: true,
      }),
    ).toBe('regress');
  });

  it('reviews instead of advancing when hard appears in the last two feedbacks', () => {
    expect(
      computeMastery({
        accuracyPercent: 90,
        recentFeedbacks: ['easy', 'good', 'hard'],
        minVolumeReached: true,
      }),
    ).toBe('review');
  });

  it('reviews instead of advancing when minimum volume is missing', () => {
    expect(
      computeMastery({
        accuracyPercent: 95,
        recentFeedbacks: ['easy', 'easy'],
        minVolumeReached: false,
      }),
    ).toBe('review');
  });
});
