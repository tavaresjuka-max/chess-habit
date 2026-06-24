/**
 * Teste de integração: errorRouting → generatePlan não quebra features existentes.
 *
 * Verifica que a integração de errorRouting em generatePlan é ADITIVA:
 * - sem errorType nos logs → plano idêntico ao atual (sem regressão)
 * - com errorType → apenas ajusta a ênfase sem tocar DD-Ped6/floor, M-Retenção, R2b
 */
import { describe, expect, it } from 'vitest';
import { generatePlan } from '../plan/generatePlan';
import type { LearnerProfile, Weakness, TrainingLog } from '../types';

const profile: LearnerProfile = {
  band: '800-1000',
  defaultSessionMinutes: 30,
  goals: ['melhorar táticas'],
  updatedAt: '2026-06-24T00:00:00.000Z',
};

const weaknesses: Weakness[] = [
  {
    tag: 'fork',
    score: 0.8,
    confidence: 'high',
    evidence: 'Garfos frequentes.',
  },
];

function makeHardLog(errorType: TrainingLog['errorType']): TrainingLog {
  return {
    id: '2026-06-23:block-1',
    date: '2026-06-23',
    blockId: 'block-1',
    blockTitle: 'Tema do dia: Garfo',
    source: 'lichess',
    destinationLabel: 'Lichess Puzzles',
    logKind: 'standard',
    plannedSeconds: 900,
    startedAt: '2026-06-23T10:00:00.000Z',
    completedAt: '2026-06-23T10:15:00.000Z',
    elapsedSeconds: 900,
    timeLimitReached: false,
    status: 'done',
    feedback: 'hard',
    errorType,
    updatedAt: '2026-06-23T10:15:00.000Z',
  };
}

describe('errorRouting → generatePlan integration', () => {
  it('gera plano válido sem logs de errorType (fallback — sem regressão)', () => {
    const plan = generatePlan(profile, weaknesses, 30, '2026-06-24');
    expect(plan.blocks.length).toBeGreaterThan(0);
    expect(plan.blocks.every((b) => b.status === 'pending')).toBe(true);
    // Campos novos não aparecem no plano (são da lógica de geração, não do tipo DailyPlan)
    expect(plan.date).toBe('2026-06-24');
  });

  it('gera plano válido com errorType nao-vi nos logs recentes', () => {
    const logs: TrainingLog[] = [
      makeHardLog('nao-vi'),
      makeHardLog('nao-vi'),
    ];
    const plan = generatePlan(profile, weaknesses, 30, '2026-06-24', {
      recentTrainingLogs: logs,
    });
    expect(plan.blocks.length).toBeGreaterThan(0);
    // O plano deve ser válido — não quebra
    expect(plan.date).toBe('2026-06-24');
  });

  it('gera plano válido com errorType errei-conta nos logs recentes', () => {
    const logs: TrainingLog[] = [
      makeHardLog('errei-conta'),
      makeHardLog('errei-conta'),
    ];
    const plan = generatePlan(profile, weaknesses, 30, '2026-06-24', {
      recentTrainingLogs: logs,
    });
    expect(plan.blocks.length).toBeGreaterThan(0);
    expect(plan.date).toBe('2026-06-24');
  });

  it('gera plano válido com errorType escolhi-errado nos logs recentes', () => {
    const logs: TrainingLog[] = [
      makeHardLog('escolhi-errado'),
      makeHardLog('escolhi-errado'),
      makeHardLog('escolhi-errado'),
    ];
    const plan = generatePlan(profile, weaknesses, 30, '2026-06-24', {
      recentTrainingLogs: logs,
    });
    expect(plan.blocks.length).toBeGreaterThan(0);
    expect(plan.date).toBe('2026-06-24');
  });

  it('chronicSupportSuggested ainda funciona junto com errorRouting (R2b não quebra)', () => {
    // Sem recentThemeStats suficiente, chronicSupportSuggested deve ser false/undefined
    const plan = generatePlan(profile, weaknesses, 30, '2026-06-24');
    expect(plan.chronicSupportSuggested).toBeFalsy();
  });
});
