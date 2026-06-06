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

    const normalizedBlock = normalizePlanDestinations(plan).blocks[0];

    expect(normalizedBlock?.destination).toEqual({
      source: 'lichess',
      label: 'Lichess Videos: aulas de abertura para iniciantes',
      url: 'https://lichess.org/video?tags=beginner%2Fopening',
    });
    expect(normalizedBlock?.task).toBe(
      'Assista uma aula curta de abertura e anote uma regra para testar na proxima partida: centro, desenvolvimento ou rei seguro.',
    );
  });

  it('updates stored opening-principles blocks that still point to analysis explorer', () => {
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
            label: 'Lichess Analysis: principios e explorador de abertura',
            url: 'https://lichess.org/analysis#explorer',
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

    const normalizedBlock = normalizePlanDestinations(plan).blocks[0];

    expect(normalizedBlock?.destination.url).toBe('https://lichess.org/video?tags=beginner%2Fopening');
    expect(normalizedBlock?.task).toBe(
      'Assista uma aula curta de abertura e anote uma regra para testar na proxima partida: centro, desenvolvimento ou rei seguro.',
    );
  });

  it('updates stored tactical blocks that still point to raw puzzle themes when Practice is better', () => {
    const plan: DailyPlan = {
      date: '2026-06-06',
      sessionMinutes: 15,
      generatedFromWeaknessesAt: '2026-06-06T00:00:00.000Z',
      blocks: [
        {
          id: 'block-1',
          title: 'Tema do dia: garfos',
          source: 'lichess',
          destination: {
            source: 'lichess',
            label: 'Puzzles Lichess: garfos',
            url: 'https://lichess.org/training/fork',
          },
          estimatedMinutes: 10,
          task: 'Treine puzzles de garfo e procure dois alvos antes de jogar.',
          stopRule: 'Pare no tempo.',
          reason: 'Sinal possivel.',
          coachNote: 'Calma.',
          status: 'pending',
          updatedAt: '2026-06-06T00:00:00.000Z',
        },
      ],
    };

    const normalizedBlock = normalizePlanDestinations(plan).blocks[0];

    expect(normalizedBlock?.destination).toEqual({
      source: 'lichess',
      label: 'Lichess Practice: The Fork',
      url: 'https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p',
    });
    expect(normalizedBlock?.task).toBe(
      'Estude a licao guiada de garfo e procure dois alvos antes de confirmar o lance.',
    );
  });

  it('keeps raw puzzle theme links when a block is marked as retrieval practice', () => {
    const plan: DailyPlan = {
      date: '2026-06-06',
      sessionMinutes: 15,
      generatedFromWeaknessesAt: '2026-06-06T00:00:00.000Z',
      blocks: [
        {
          id: 'block-1',
          title: 'Tema do dia: garfos',
          source: 'lichess',
          destination: {
            source: 'lichess',
            label: 'Puzzles Lichess: Fork',
            url: 'https://lichess.org/training/fork',
          },
          weaknessTag: 'fork',
          resourceStage: 'retrieval',
          estimatedMinutes: 10,
          task: 'Repita o tema em puzzles.',
          stopRule: 'Pare no tempo.',
          reason: 'Foi facil ontem.',
          coachNote: 'Calma.',
          status: 'pending',
          updatedAt: '2026-06-06T00:00:00.000Z',
        },
      ],
    };

    const normalizedBlock = normalizePlanDestinations(plan).blocks[0];

    expect(normalizedBlock?.destination.url).toBe('https://lichess.org/training/fork');
    expect(normalizedBlock?.task).toBe('Resolva puzzles de garfos e confirme a ideia antes do primeiro lance.');
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
