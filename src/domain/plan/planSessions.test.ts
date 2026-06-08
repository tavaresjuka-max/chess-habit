import { describe, expect, it } from 'vitest';
import type { LearnerProfile, Weakness } from '../types';
import { generatePlan } from './generatePlan';
import {
  appendPlanSession,
  createTrainingRoadmap,
  getNextPlanSessionNumber,
  getPlanSessionSummaries,
  getPlanTotalMinutes,
} from './planSessions';

const profile: LearnerProfile = {
  lichessUsername: 'jukasparov',
  band: '800-1200',
  defaultSessionMinutes: 15,
  goals: ['estudar com consistencia'],
  updatedAt: '2026-06-06T00:00:00.000Z',
};

const weaknesses: Weakness[] = [
  {
    tag: 'fork',
    score: 0.7,
    confidence: 'medium',
    evidence: 'Sinal recorrente de garfos.',
  },
];

describe('plan sessions', () => {
  it('appends an extra same-day session with unique block ids', () => {
    const dailyPlan = generatePlan(profile, weaknesses, 30, '2026-06-06');
    const extraSession = generatePlan(profile, weaknesses, 15, '2026-06-06', {
      previousPlan: dailyPlan,
      sessionNumber: getNextPlanSessionNumber(dailyPlan),
    });
    const plan = appendPlanSession(dailyPlan, extraSession);

    expect(plan.blocks).toHaveLength(5);
    expect(getPlanTotalMinutes(plan)).toBe(45);
    expect(getPlanSessionSummaries(plan).map((session) => session.minutes)).toEqual([30, 15]);
    expect(new Set(plan.blocks.map((block) => block.id)).size).toBe(plan.blocks.length);
    expect(plan.blocks[plan.blocks.length - 1]?.sessionNumber).toBe(2);
  });

  it('creates a roadmap from today sessions and the weekly-focus progression', () => {
    const dailyPlan = generatePlan(profile, weaknesses, 15, '2026-06-06');
    const roadmap = createTrainingRoadmap({
      profile,
      weaknesses,
      activePlan: dailyPlan,
      sessionMinutes: 15,
      futureDays: 3,
    });

    expect(roadmap).toHaveLength(4);
    expect(roadmap[0]).toMatchObject({
      label: 'Hoje',
      title: 'Tema do dia: garfos',
      status: 'current',
      minutes: 15,
    });
    expect(roadmap[1]).toMatchObject({
      date: '2026-06-07',
      label: 'Amanhã',
      title: 'Repetição: garfos',
      destinationLabel: 'Puzzles Lichess: Fork',
      status: 'future',
    });
    expect(roadmap[2]).toMatchObject({
      date: '2026-06-08',
      label: 'Em 2 dias',
      title: 'Transferência: garfos em partida',
      destinationLabel: 'Lichess Analysis: revisar partida terminada',
    });
    expect(roadmap[3]).toMatchObject({
      date: '2026-06-09',
      label: 'Em 3 dias',
      title: 'Revisão: garfos sem pressa',
      destinationLabel: 'Lichess Analysis: revisar partida terminada',
    });
  });
});
