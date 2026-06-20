import { describe, expect, it } from 'vitest';
import { computeMastery, masteryTargetFromCompletedLog, themeAccuracyFromCompletedLog } from './mastery';

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

  it('derives advance from high reconciled theme accuracy without recent hard feedback', () => {
    expect(
      masteryTargetFromCompletedLog({
        lichessTheme: 'fork',
        themeStats: [{ theme: 'fork', attempts: 5, losses: 0 }],
        lastFeedback: 'good',
        currentFeedback: 'easy',
        attempts: 1,
      }),
    ).toBe('advance');
  });

  it('derives review from medium reconciled theme accuracy', () => {
    expect(
      masteryTargetFromCompletedLog({
        lichessTheme: 'fork',
        themeStats: [{ theme: 'fork', attempts: 4, losses: 2 }],
        currentFeedback: 'good',
        attempts: 1,
      }),
    ).toBe('review');
  });

  it('derives regress from low reconciled theme accuracy', () => {
    expect(
      masteryTargetFromCompletedLog({
        lichessTheme: 'fork',
        themeStats: [{ theme: 'fork', attempts: 5, losses: 3 }],
        currentFeedback: 'good',
        attempts: 1,
      }),
    ).toBe('regress');
  });

  it('keeps review when the completed log has no stats for the pending theme', () => {
    expect(
      masteryTargetFromCompletedLog({
        lichessTheme: 'fork',
        themeStats: [{ theme: 'pin', attempts: 5, losses: 0 }],
        lastFeedback: 'easy',
        currentFeedback: 'easy',
        attempts: 1,
      }),
    ).toBe('review');
  });
});

describe('themeAccuracyFromCompletedLog', () => {
  it('retorna a fração de acerto do tema quando há pelo menos 3 tentativas', () => {
    expect(
      themeAccuracyFromCompletedLog({
        lichessTheme: 'fork',
        themeStats: [{ theme: 'fork', attempts: 10, losses: 3 }],
        attempts: 4,
      }),
    ).toBeCloseTo(0.7);
  });

  it('retorna undefined sem tema, sem stats ou com amostra pequena (< 3)', () => {
    expect(themeAccuracyFromCompletedLog({ attempts: 4 })).toBeUndefined();
    expect(
      themeAccuracyFromCompletedLog({
        lichessTheme: 'fork',
        themeStats: [{ theme: 'fork', attempts: 2, losses: 0 }],
        attempts: 4,
      }),
    ).toBeUndefined();
  });
});
