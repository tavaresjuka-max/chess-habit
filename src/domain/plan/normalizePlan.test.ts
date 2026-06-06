import { describe, expect, it } from 'vitest';
import type { DailyPlan } from '../types';
import { normalizePlanDestinations } from './normalizePlan';

describe('normalizePlanDestinations', () => {
  it('updates stored opening-principles blocks that still point to generic Learn', () => {
    const plan: DailyPlan = {
      date: '2026-06-06',
      sessionMinutes: 15,
      generatedFromWeaknessesAt: '2026-06-06T00:00:00.000Z',
      blocks: [
        {
          id: 'block-1',
          title: 'Tema do dia: principios de abertura',
          source: 'lichess',
          destination: {
            source: 'lichess',
            label: 'Lichess Learn: principios de abertura',
            url: 'https://lichess.org/learn',
          },
          estimatedMinutes: 10,
          task: 'Revise principios.',
          stopRule: 'Pare no tempo.',
          reason: 'Sinal possivel.',
          coachNote: 'Calma.',
          status: 'pending',
          updatedAt: '2026-06-06T00:00:00.000Z',
        },
      ],
    };

    expect(normalizePlanDestinations(plan).blocks[0]?.destination).toEqual({
      source: 'lichess',
      label: 'Lichess Analysis: principios e explorador de abertura',
      url: 'https://lichess.org/analysis#explorer',
    });
  });

  it('keeps equivalent plans unchanged by value when no destination changes', () => {
    const plan: DailyPlan = {
      date: '2026-06-06',
      sessionMinutes: 5,
      generatedFromWeaknessesAt: '2026-06-06T00:00:00.000Z',
      blocks: [],
    };

    expect(normalizePlanDestinations(plan)).toEqual(plan);
  });
});
