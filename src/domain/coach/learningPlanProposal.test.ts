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
    expect(proposal.methodSummary).toBe('Sinal → foco → treino → registro → ajuste.');
    expect(proposal.evidenceLevel).toContain('Confiança: média');
    expect(proposal.methodSteps).toContain('Treino: conceito novo, depois puzzles variados.');
    expect(proposal.focusItems).toContain('Garfos: cavalo, bispo, peão, dama.');
    expect(proposal.progressCriteria).toContain('Mais garfos certos na 1ª tentativa.');
    expect(proposal.estimate).toContain('≈30h');
    expect(proposal.estimate).toContain('60 sessões de 30 min');
    expect(proposal.checkpoint).toContain('Checkpoint: 6h');
    expect(proposal.checkpoint).toContain('12 sessões');
    expect(proposal.estimateHours).toBe(30);
    expect(proposal.estimateSessions).toBe(60);
    expect(proposal.estimateMinutes).toBe(30);
    expect(proposal.checkpointHours).toBe(6);
    expect(proposal.checkpointSessions).toBe(12);
    expect(proposal.reviewPrompt).toContain('Aprove o plano');
    expect(proposal.reviewPrompt).toContain('peça revisão');
    expect(proposal.caveat).toContain('Não é promessa de rating');
  });

  it('uses conservative language when real weakness signals are still missing', () => {
    const plan = generatePlan(profile, [], 15, '2026-06-09');
    const proposal = buildLearningPlanProposal({
      plan,
      roadmap: [],
      sessionMinutes: 15,
      weaknesses: [],
    });

    expect(proposal.intro).toContain('Poucos dados ainda');
    expect(proposal.evidenceLevel).toContain('Confiança: inicial');
    expect(proposal.progressCriteria).toContain('Registrar: fácil / bom / difícil.');
    expect(proposal.estimate).toContain('120 sessões de 15 min');
    expect(proposal.caveat).not.toContain('vai subir');
  });

  it('rotula confiança baixa honestamente mesmo com sinal de peso (não chama de "média")', () => {
    const lowButStrong: Weakness[] = [
      { tag: 'fork', score: 0.6, confidence: 'low', evidence: 'Sinal de garfo com peso, mas pouca evidência.' },
    ];
    const plan = generatePlan(profile, lowButStrong, 30, '2026-06-09');
    const proposal = buildLearningPlanProposal({
      plan,
      roadmap: [],
      sessionMinutes: 30,
      weaknesses: lowButStrong,
    });

    expect(proposal.evidenceLevel).not.toContain('Confiança: média');
    expect(proposal.evidenceLevel).toContain('Confiança: baixa');
  });
});
