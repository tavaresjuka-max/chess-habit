import { describe, expect, it } from 'vitest';
import { generatePlan } from '../plan/generatePlan';
import { createTrainingRoadmap } from '../plan/planSessions';
import type { LearnerProfile, Weakness } from '../types';
import { buildLearningPlanProposal } from './learningPlanProposal';

const profile: LearnerProfile = {
  lichessUsername: 'jukasparov',
  chesscomUsername: 'jukatavares',
  band: '800-1000',
  defaultSessionMinutes: 30,
  goals: ['estudar com consistencia'],
  updatedAt: '2026-06-09T00:00:00.000Z',
};

const weaknesses: Weakness[] = [
  {
    tag: 'fork',
    score: 0.8,
    confidence: 'medium',
    evidence: 'Garfos apareceram como ponto de melhoria nos sinais recentes.',
  },
];

describe('buildLearningPlanProposal', () => {
  it('explains the first phase with estimate, checkpoint and review prompt', () => {
    const plan = generatePlan(profile, weaknesses, 30, '2026-06-09');
    const roadmap = createTrainingRoadmap({
      profile,
      weaknesses,
      activePlan: plan,
      sessionMinutes: 30,
    });
    const proposal = buildLearningPlanProposal({
      plan,
      roadmap,
      sessionMinutes: 30,
      weaknesses,
    });

    expect(proposal.heading).toBe('Entendi o que você precisa.');
    expect(proposal.phaseTitle).toBe('Primeira fase: garfos');
    expect(proposal.methodSummary).toContain('observar sinais reais');
    expect(proposal.evidenceLevel).toContain('Confiança: média');
    expect(proposal.methodSteps).toContain(
      'Treino: conceito guiado quando o tema é novo, depois recuperação ativa em puzzles variados.',
    );
    expect(proposal.focusItems).toContain('Ver garfos com cavalo, bispo, peão e dama.');
    expect(proposal.progressCriteria).toContain('Acertar mais puzzles de garfo na primeira tentativa.');
    expect(proposal.estimate).toContain('30 horas');
    expect(proposal.estimate).toContain('60 sessões de 30 min');
    expect(proposal.checkpoint).toContain('Depois de 6 horas');
    expect(proposal.checkpoint).toContain('12 sessões');
    expect(proposal.reviewPrompt).toContain('aprovar o plano');
    expect(proposal.reviewPrompt).toContain('pedir revisão');
    expect(proposal.caveat).toContain('não é promessa de rating');
  });

  it('uses conservative language when real weakness signals are still missing', () => {
    const plan = generatePlan(profile, [], 15, '2026-06-09');
    const proposal = buildLearningPlanProposal({
      plan,
      roadmap: [],
      sessionMinutes: 15,
      weaknesses: [],
    });

    expect(proposal.intro).toContain('faltam dados reais suficientes');
    expect(proposal.evidenceLevel).toContain('Confiança: inicial');
    expect(proposal.progressCriteria).toContain('Registrar feedback honesto: fácil, bom ou difícil.');
    expect(proposal.estimate).toContain('120 sessões de 15 min');
    expect(proposal.caveat).not.toContain('vai subir');
  });
});
