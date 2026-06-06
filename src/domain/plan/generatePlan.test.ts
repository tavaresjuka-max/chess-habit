import { describe, expect, it } from 'vitest';
import type { LearnerProfile, SessionMinutes } from '../types';
import { generatePlan } from './generatePlan';
import { getTimeBudget } from './timeBudget';

const baseProfile: LearnerProfile = {
  lichessUsername: 'jukasparov',
  band: '800-1200',
  defaultSessionMinutes: 15,
  goals: ['estudar com consistencia'],
  updatedAt: '2026-06-06T00:00:00.000Z',
};

describe('getTimeBudget', () => {
  it.each([
    [5, [5]],
    [15, [10, 5]],
    [30, [5, 15, 10]],
    [60, [10, 20, 20, 10]],
  ] as const)('splits %i minutes exactly', (sessionMinutes, expectedMinutes) => {
    const budget = getTimeBudget(sessionMinutes);

    expect(budget.map((block) => block.minutes)).toEqual(expectedMinutes);
    expect(budget.reduce((sum, block) => sum + block.minutes, 0)).toBe(sessionMinutes);
  });
});

describe('generatePlan', () => {
  it.each([
    [5, 1],
    [15, 2],
    [30, 3],
    [60, 4],
  ] as const)('creates the expected block count and total for %i minutes', (sessionMinutes, blockCount) => {
    const plan = generatePlan(baseProfile, [], sessionMinutes, '2026-06-06');

    expect(plan.blocks).toHaveLength(blockCount);
    expect(plan.blocks.reduce((sum, block) => sum + block.estimatedMinutes, 0)).toBe(sessionMinutes);
    expect(plan.blocks.every((block) => block.status === 'pending')).toBe(true);
  });

  it('uses fork as the fixed P0 theme for the 800-1200 band', () => {
    const plan = generatePlan(baseProfile, [], 15, '2026-06-06');

    expect(plan.blocks[0]?.title).toContain('garfos');
    expect(plan.blocks[0]?.destination.url).toBe('https://lichess.org/training/fork');
  });

  it('uses hanging pieces as the fixed P0 theme for the 0-800 band', () => {
    const profile: LearnerProfile = { ...baseProfile, band: '0-800' };
    const plan = generatePlan(profile, [], 5, '2026-06-06');

    expect(plan.blocks[0]?.title).toContain('pecas penduradas');
    expect(plan.blocks[0]?.destination.url).toBe('https://lichess.org/training/hangingPiece');
  });

  it('is deterministic for the same inputs', () => {
    const sessionMinutes: SessionMinutes = 30;
    const first = generatePlan(baseProfile, [], sessionMinutes, '2026-06-06');
    const second = generatePlan(baseProfile, [], sessionMinutes, '2026-06-06');

    expect(first).toEqual(second);
  });
});
