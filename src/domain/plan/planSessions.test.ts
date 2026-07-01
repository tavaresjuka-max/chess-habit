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
  band: '800-1000',
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

  it('returns only active items when the plan has no weekly focus', () => {
    const planNoFocus = generatePlan(profile, [], 5, '2026-06-06');
    const planWithoutFocus = { ...planNoFocus, weeklyFocus: undefined };

    const roadmap = createTrainingRoadmap({
      profile,
      weaknesses: [],
      activePlan: planWithoutFocus,
      sessionMinutes: 5,
      futureDays: 3,
    });

    expect(roadmap.every((item) => item.status !== 'future')).toBe(true);
  });

  it('handles an invalid plan date without throwing when projecting future days', () => {
    const planInvalidDate = generatePlan(profile, weaknesses, 15, 'not-a-date');

    const roadmap = createTrainingRoadmap({
      profile,
      weaknesses,
      activePlan: planInvalidDate,
      sessionMinutes: 15,
      futureDays: 2,
    });

    const futureItems = roadmap.filter((item) => item.status === 'future');

    expect(futureItems).toHaveLength(2);
    // addDays falls back to the original invalid date string
    expect(futureItems[0]?.date).toBe('not-a-date');
    expect(futureItems[1]?.date).toBe('not-a-date');
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
      destinationLabel: 'Puzzles Lichess: Garfo',
      status: 'future',
    });
    expect(roadmap[2]).toMatchObject({
      date: '2026-06-08',
      label: 'Em 2 dias',
      title: 'Transferência: garfos em partida',
      destinationLabel: 'Puzzles Lichess: Garfo',
    });
    expect(roadmap[3]).toMatchObject({
      date: '2026-06-09',
      label: 'Em 3 dias',
      title: 'Revisão: garfos sem pressa',
      destinationLabel: 'Puzzles Lichess: Garfo',
    });
  });
});
