import { describe, expect, it } from 'vitest';
import type { PendingTrainingItem } from '../method/types';
import type { LearnerProfile, SessionMinutes } from '../types';
import { generatePlan, getReviewRatioForPendingCount } from './generatePlan';
import { getTimeBudget } from './timeBudget';

const baseProfile: LearnerProfile = {
  lichessUsername: 'jukasparov',
  band: '800-1000',
  defaultSessionMinutes: 15,
  goals: ['estudar com consistencia'],
  updatedAt: '2026-06-06T00:00:00.000Z',
};

const today = new Date().toISOString().slice(0, 10);

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

  it('keeps the warmup coach note as a pure execution tip (greeting lives in the TutorCard)', () => {
    const plan = generatePlan(baseProfile, [], 30, '2026-06-06');
    const warmup = plan.blocks[0];

    expect(warmup).toMatchObject({
      title: 'Aquecimento tático',
      resourceStage: 'retrieval',
    });
    expect(warmup?.coachNote).toContain('Não é prova de velocidade');
    expect(warmup?.coachNote).not.toContain('Que bom ver você');
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
    expect(plan.blocks[0]?.methodTrackId).toBe('calculation-bridge');
  });

  it('treina a fraqueza secundária no bloco de transferência (decisão 1)', () => {
    const weaknesses = [
      { tag: 'fork' as const, score: 0.8, confidence: 'medium' as const, evidence: 'Garfos frequentes.' },
      { tag: 'pin' as const, score: 0.6, confidence: 'medium' as const, evidence: 'Cravadas perdidas.' },
    ];
    const plan = generatePlan(baseProfile, weaknesses, 30, '2026-06-06');
    const tema = plan.blocks.find((block) => block.id.endsWith('-tema'));
    const transferencia = plan.blocks.find((block) => block.id.endsWith('-transferencia'));

    expect(tema?.weaknessTag).toBe('fork');
    expect(transferencia?.weaknessTag).toBe('pin');
  });

  it('volta à fraqueza primária na transferência quando não há secundária distinta', () => {
    const weaknesses = [
      { tag: 'fork' as const, score: 0.8, confidence: 'medium' as const, evidence: 'Garfos frequentes.' },
    ];
    const plan = generatePlan(baseProfile, weaknesses, 30, '2026-06-06');
    const transferencia = plan.blocks.find((block) => block.id.endsWith('-transferencia'));

    expect(transferencia?.weaknessTag).toBe('fork');
  });

  it('introduces the guided fork lesson with simple Professor Lemos context', () => {
    const plan = generatePlan(baseProfile, [], 15, '2026-06-06');
    const note = plan.blocks[0]?.coachNote ?? '';

    expect(note).toContain('Garfo é quando uma peça sua ataca dois alvos ao mesmo tempo.');
    expect(note).toContain('cavalo, bispo, peão e dama');
    expect(note).toContain('começa a preparar o garfo alguns lances antes');
    expect(note).not.toContain('consequência material');
  });

  it('keeps the short review on the daily theme instead of generic analysis', () => {
    const plan = generatePlan(baseProfile, [], 15, '2026-06-06');

    expect(plan.blocks[1]).toMatchObject({
      title: 'Revisão curta',
      weaknessTag: 'fork',
      resourceStage: 'review',
      destination: {
        source: 'lichess',
        label: 'Puzzles Lichess: Fork',
        url: 'https://lichess.org/training/fork',
      },
    });
    expect(plan.blocks[1]?.task).toContain('garfos');
    expect(plan.blocks[1]?.task).not.toContain('análise de uma partida');
  });

  it('uses puzzle replay as a short review when recent theme errors exist', () => {
    const plan = generatePlan(baseProfile, [], 15, '2026-06-06', {
      recentThemeStats: {
        since: '2026-06-01T00:00:00.000Z',
        until: '2026-06-08T00:00:00.000Z',
        themes: [{ theme: 'fork', attempts: 4, losses: 3 }],
      },
    });

    expect(plan.blocks[1]).toMatchObject({
      weaknessTag: 'fork',
      resourceStage: 'review',
      destination: {
        source: 'lichess',
        label: 'Lichess Replay: revisar erros recentes em Fork',
        url: 'https://lichess.org/training/fork',
      },
    });
  });

  it('uses hanging pieces as the fixed P0 theme for the 0-800 band', () => {
    const profile: LearnerProfile = { ...baseProfile, band: '400-800' };
    const plan = generatePlan(profile, [], 5, '2026-06-06');

    expect(plan.blocks[0]?.title).toContain('peças penduradas');
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
      'https://lichess.org/practice/checkmates/checkmate-patterns-ii/8yadFPpU',
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
          evidence: 'A abertura 1...e5 apareceu várias vezes com resultado difícil.',
        },
      ],
      15,
      '2026-06-06',
    );

    expect(plan.blocks[0]?.title).toContain('princípios de abertura');
    expect(plan.blocks[0]?.destination).toEqual({
      source: 'lichess',
      label: 'Lichess Video (em inglês): abertura - centro, desenvolvimento e rei seguro',
      url: 'https://lichess.org/video/gpsZAim-mYc',
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

  it('moves a good guided theme to varied retrieval puzzles on the next plan', () => {
    const previousPlan = generatePlan(baseProfile, [], 15, '2026-06-06');
    const plan = generatePlan(baseProfile, [], 15, '2026-06-07', {
      previousPlan: {
        ...previousPlan,
        blocks: previousPlan.blocks.map((block, index) =>
          index === 0
            ? {
                ...block,
                status: 'done',
                feedback: 'good',
              }
            : block,
        ),
      },
    });

    expect(plan.blocks[0]?.resourceStage).toBe('retrieval');
    expect(plan.blocks[0]?.destination.url).toBe('https://lichess.org/training/fork');
    expect(plan.blocks[0]?.task).toContain('Resolva puzzles de garfos');
  });

  it('does not repeat a prior guided Practice lesson even without feedback', () => {
    const previousPlan = generatePlan(baseProfile, [], 15, '2026-06-08');
    const plan = generatePlan(baseProfile, [], 15, '2026-06-09', {
      previousPlan,
    });

    expect(previousPlan.blocks[0]).toMatchObject({
      resourceStage: 'guided',
      destination: {
        url: 'https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p',
      },
      status: 'pending',
    });
    expect(previousPlan.blocks[0]?.feedback).toBeUndefined();
    expect(plan.blocks[0]?.resourceStage).toBe('retrieval');
    expect(plan.blocks[0]?.destination).toMatchObject({
      label: 'Puzzles Lichess: Fork',
      url: 'https://lichess.org/training/fork',
    });
    expect(plan.blocks[0]?.task).toContain('Resolva puzzles de garfos');
    expect(plan.blocks[0]?.coachNote).toContain('Garfo é quando uma peça sua ataca dois alvos');
  });

  it('repairs a same-day guided Practice lesson after the block has been opened', () => {
    const storedPlan = generatePlan(baseProfile, [], 15, '2026-06-09');
    const openedBlockId = storedPlan.blocks[0]?.id;

    if (openedBlockId === undefined) {
      throw new Error('Expected a fork block.');
    }

    const plan = generatePlan(baseProfile, [], 15, '2026-06-09', {
      previousPlan: storedPlan,
      openedBlockIds: [openedBlockId],
    });

    expect(storedPlan.blocks[0]?.resourceStage).toBe('guided');
    expect(storedPlan.blocks[0]?.destination.url).toBe(
      'https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p',
    );
    expect(plan.blocks[0]?.resourceStage).toBe('retrieval');
    expect(plan.blocks[0]?.destination.url).toBe('https://lichess.org/training/fork');
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
    expect(plan.blocks[0]?.destination.url).toBe('https://lichess.org/video/mbiR0tcdqBY');
    expect(plan.blocks[0]?.task).toContain('Revise uma explicação curta de garfos');
  });

  it('switches to varied retrieval after a hard explanation was already tried', () => {
    const guidedPlan = generatePlan(baseProfile, [], 15, '2026-06-06');
    const explanationPlan = generatePlan(baseProfile, [], 15, '2026-06-06', {
      previousPlan: {
        ...guidedPlan,
        blocks: guidedPlan.blocks.map((block, index) =>
          index === 0
            ? {
                ...block,
                feedback: 'hard',
              }
            : block,
        ),
      },
    });
    const plan = generatePlan(baseProfile, [], 15, '2026-06-06', {
      previousPlan: {
        ...explanationPlan,
        blocks: explanationPlan.blocks.map((block, index) =>
          index === 0
            ? {
                ...block,
                status: 'done',
                feedback: 'hard',
              }
            : block,
        ),
      },
      sessionNumber: 2,
    });

    expect(plan.blocks[0]?.resourceStage).toBe('retrieval');
    expect(plan.blocks[0]?.destination.url).toBe('https://lichess.org/training/fork');
    expect(plan.blocks[0]?.task).toContain('Resolva puzzles de garfos');
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

  it('does not rewrite the destination of a completed block when regenerating the same session', () => {
    const previousPlan = generatePlan(baseProfile, [], 15, '2026-06-06');
    const completedBlock = previousPlan.blocks[0];

    if (completedBlock === undefined) {
      throw new Error('Expected a theme block.');
    }

    const plan = generatePlan(baseProfile, [], 15, '2026-06-06', {
      previousPlan: {
        ...previousPlan,
        blocks: previousPlan.blocks.map((block) =>
          block.id === completedBlock.id
            ? { ...block, status: 'done', feedback: 'easy', updatedAt: '2026-06-06T10:00:00.000Z' }
            : block,
        ),
      },
    });

    expect(plan.blocks[0]).toMatchObject({
      status: 'done',
      feedback: 'easy',
      resourceStage: completedBlock.resourceStage,
      destination: completedBlock.destination,
    });
  });

  it('does not resurrect feedback on a previously pending block', () => {
    const previousPlan = generatePlan(baseProfile, [], 15, '2026-06-06');
    const plan = generatePlan(baseProfile, [], 15, '2026-06-06', { previousPlan });

    expect(plan.blocks.every((block) => block.status === 'pending')).toBe(true);
    expect(plan.blocks.every((block) => block.feedback === undefined)).toBe(true);
  });

  it('preserves the local learning-plan response when regenerating the same date', () => {
    const previousPlan = generatePlan(baseProfile, [], 15, '2026-06-09');
    const plan = generatePlan(baseProfile, [], 30, '2026-06-09', {
      previousPlan: {
        ...previousPlan,
        learningPlanResponse: {
          status: 'approved',
          updatedAt: '2026-06-09T10:00:00.000Z',
        },
      },
    });

    expect(plan.learningPlanResponse).toEqual({
      status: 'approved',
      updatedAt: '2026-06-09T10:00:00.000Z',
    });
  });

  it('puts a due pending item as the first block with pending-review track', () => {
    const plan = generatePlan(baseProfile, [], 15, today, {
      openPendingItems: [createPendingItem({ dueAt: today })],
    });

    expect(plan.blocks[0]).toMatchObject({
      title: 'Revisar tema: fork',
      methodTrackId: 'pending-review',
      pendingItemId: 'pending-1',
      drillFormatId: 'pendency-treatment',
      resourceStage: 'review',
      destination: {
        source: 'lichess',
        label: 'Pendência Lichess: fork',
        url: 'https://lichess.org/training/fork',
      },
    });
  });

  it('selects calculation-bridge as active track for fork weakness', () => {
    const plan = generatePlan(
      baseProfile,
      [
        {
          tag: 'fork',
          score: 0.9,
          confidence: 'high',
          evidence: 'Erros recentes em garfos.',
        },
      ],
      15,
      '2026-06-10',
    );

    expect(plan.blocks.every((block) => block.methodTrackId === 'calculation-bridge')).toBe(true);
  });

  it('computes adaptive review ratio from pending count', () => {
    expect(getReviewRatioForPendingCount(3)).toBe(0.55);
  });

  it('adds a guiding question to generated blocks', () => {
    const plan = generatePlan(baseProfile, [], 15, '2026-06-10');

    expect(plan.blocks[0]?.guidingQuestion).toBe('Quais são meus 2 candidatos?');
  });

  it('is deterministic for the same inputs', () => {
    const sessionMinutes: SessionMinutes = 30;
    const first = generatePlan(baseProfile, [], sessionMinutes, '2026-06-06');
    const second = generatePlan(baseProfile, [], sessionMinutes, '2026-06-06');

    expect(first).toEqual(second);
  });
});

function createPendingItem(overrides: Partial<PendingTrainingItem>): PendingTrainingItem {
  return {
    id: 'pending-1',
    origin: 'puzzle',
    title: 'Revisar tema: fork',
    weaknessTag: 'fork',
    methodTrackId: 'pending-review',
    lichessTheme: 'fork',
    lichessUrl: 'https://lichess.org/training/fork',
    prompt: 'Qual sinal do tabuleiro você ignorou?',
    dueAt: today,
    attempts: 0,
    status: 'open',
    createdAt: `${today}T00:00:00.000Z`,
    updatedAt: `${today}T00:00:00.000Z`,
    ...overrides,
  };
}
