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
    expect(plan.weeklyFocus).toMatchObject({
      tag: 'fork',
      title: 'garfos',
      startsOn: '2026-06-01',
    });
    expect(plan.blocks[0]?.resourceStage).toBe('guided');
    expect(plan.blocks[0]?.destination.url).toBe(
      'https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p',
    );
  });

  it('uses hanging pieces as the fixed P0 theme for the 0-800 band', () => {
    const profile: LearnerProfile = { ...baseProfile, band: '0-800' };
    const plan = generatePlan(profile, [], 5, '2026-06-06');

    expect(plan.blocks[0]?.title).toContain('pecas penduradas');
    expect(plan.blocks[0]?.destination.url).toBe('https://lichess.org/training/hangingPiece');
  });

  it('uses the strongest weakness when detector signals are available', () => {
    const plan = generatePlan(
      baseProfile,
      [
        {
          tag: 'mate-in-2',
          score: 0.6,
          confidence: 'medium',
          evidence: 'Sinal possivel de dificuldade com mates curtos.',
        },
      ],
      15,
      '2026-06-06',
    );

    expect(plan.blocks[0]?.title).toContain('mate em 2');
    expect(plan.blocks[0]?.reason).toBe('Sinal possivel de dificuldade com mates curtos.');
    expect(plan.blocks[0]?.destination.url).toBe(
      'https://lichess.org/practice/checkmates/checkmate-patterns-i/fE4k21MW',
    );
  });

  it('opens a concrete opening-principles lesson instead of a generic video filter', () => {
    const plan = generatePlan(
      baseProfile,
      [
        {
          tag: 'opening-principles',
          score: 0.8,
          confidence: 'medium',
          evidence: 'A abertura 1...e5 apareceu varias vezes com resultado dificil.',
        },
      ],
      15,
      '2026-06-06',
    );

    expect(plan.blocks[0]?.title).toContain('principios de abertura');
    expect(plan.blocks[0]?.destination).toEqual({
      source: 'lichess',
      label: 'Lichess Video: abertura - centro, desenvolvimento e rei seguro',
      url: 'https://lichess.org/video/gpsZAim-mYc?tags=opening+principles',
    });
  });

  it('uses retrieval practice for a repeated theme that was marked easy', () => {
    const previousPlan = generatePlan(baseProfile, [], 15, '2026-06-06');
    const plan = generatePlan(baseProfile, [], 15, '2026-06-06', {
      previousPlan: {
        ...previousPlan,
        blocks: previousPlan.blocks.map((block, index) =>
          index === 0
            ? {
                ...block,
                feedback: 'easy',
              }
            : block,
        ),
      },
    });

    expect(plan.blocks[0]?.resourceStage).toBe('retrieval');
    expect(plan.blocks[0]?.destination.url).toBe('https://lichess.org/training/fork');
    expect(plan.blocks[0]?.task).toContain('Resolva puzzles de garfos');
  });

  it('moves a hard repeated theme back to an explanation resource', () => {
    const previousPlan = generatePlan(baseProfile, [], 15, '2026-06-06');
    const plan = generatePlan(baseProfile, [], 15, '2026-06-06', {
      previousPlan: {
        ...previousPlan,
        blocks: previousPlan.blocks.map((block, index) =>
          index === 0
            ? {
                ...block,
                feedback: 'hard',
              }
            : block,
        ),
      },
    });

    expect(plan.blocks[0]?.resourceStage).toBe('explain');
    expect(plan.blocks[0]?.destination.url).toBe('https://lichess.org/video?tags=beginner%2Ftactics');
    expect(plan.blocks[0]?.task).toContain('Revise uma explicacao curta de garfos');
  });

  it('keeps a good repeated theme in the same resource stage', () => {
    const previousPlan = generatePlan(baseProfile, [], 15, '2026-06-06');
    const retrievalPlan = generatePlan(baseProfile, [], 15, '2026-06-06', {
      previousPlan: {
        ...previousPlan,
        blocks: previousPlan.blocks.map((block, index) =>
          index === 0
            ? {
                ...block,
                feedback: 'easy',
              }
            : block,
        ),
      },
    });
    const plan = generatePlan(baseProfile, [], 15, '2026-06-06', {
      previousPlan: {
        ...retrievalPlan,
        blocks: retrievalPlan.blocks.map((block, index) =>
          index === 0
            ? {
                ...block,
                feedback: 'good',
              }
            : block,
        ),
      },
    });

    expect(plan.blocks[0]?.resourceStage).toBe('retrieval');
    expect(plan.blocks[0]?.destination.url).toBe('https://lichess.org/training/fork');
  });

  it('preserves done status and feedback of matching blocks when regenerating', () => {
    const previousPlan = generatePlan(baseProfile, [], 15, '2026-06-06');
    const completedBlockId = previousPlan.blocks[0]?.id;
    const plan = generatePlan(baseProfile, [], 15, '2026-06-06', {
      previousPlan: {
        ...previousPlan,
        blocks: previousPlan.blocks.map((block, index) =>
          index === 0
            ? { ...block, status: 'done', feedback: 'good', updatedAt: '2026-06-06T10:00:00.000Z' }
            : block,
        ),
      },
    });

    const regenerated = plan.blocks.find((block) => block.id === completedBlockId);

    expect(regenerated?.status).toBe('done');
    expect(regenerated?.feedback).toBe('good');
    expect(regenerated?.updatedAt).toBe('2026-06-06T10:00:00.000Z');
  });

  it('does not resurrect feedback on a previously pending block', () => {
    const previousPlan = generatePlan(baseProfile, [], 15, '2026-06-06');
    const plan = generatePlan(baseProfile, [], 15, '2026-06-06', { previousPlan });

    expect(plan.blocks.every((block) => block.status === 'pending')).toBe(true);
    expect(plan.blocks.every((block) => block.feedback === undefined)).toBe(true);
  });

  it('is deterministic for the same inputs', () => {
    const sessionMinutes: SessionMinutes = 30;
    const first = generatePlan(baseProfile, [], sessionMinutes, '2026-06-06');
    const second = generatePlan(baseProfile, [], sessionMinutes, '2026-06-06');

    expect(first).toEqual(second);
  });
});
