import { describe, expect, it } from 'vitest';
import type { DailyPlan, PuzzleThemeStats, TrainingLog } from '../domain';
import type { PendingTrainingItem } from '../domain/method/types';
import {
  buildPlanContext,
  combinePlanHistory,
  getLichessThemeFromUrl,
  getOpenedTrainingBlockIds,
  getWeakThemesFromThemeStats,
  toSessionMinutes,
  upsertPendingItem,
} from './stateHelpers';

describe('buildPlanContext', () => {
  it('monta as opções e omite previousPlan quando ausente', () => {
    const context = buildPlanContext({
      recentThemeStats: undefined,
      trainingLogs: [],
      pendingItems: [],
      diplomaAttempts: [],
    });

    expect(context).toMatchObject({
      openedBlockIds: [],
      openPendingItems: [],
      weakThemesFromDashboard: [],
      diplomaAttempts: [],
    });
    expect('previousPlan' in context).toBe(false);
  });

  it('inclui previousPlan e diplomaAttempts quando fornecidos', () => {
    const plan = { date: '2026-06-06' } as DailyPlan;
    const context = buildPlanContext({
      previousPlan: plan,
      recentThemeStats: undefined,
      trainingLogs: [],
      pendingItems: [],
      diplomaAttempts: [{ id: 'a' } as never],
    });

    expect(context.previousPlan).toBe(plan);
    expect(context.diplomaAttempts).toHaveLength(1);
  });
});

describe('toSessionMinutes', () => {
  it('aceita os valores válidos', () => {
    expect(toSessionMinutes(5, 15)).toBe(5);
    expect(toSessionMinutes(60, 15)).toBe(60);
  });

  it('cai no fallback para valores fora do conjunto', () => {
    expect(toSessionMinutes(7, 15)).toBe(15);
    expect(toSessionMinutes(0, 30)).toBe(30);
  });
});

describe('combinePlanHistory', () => {
  const makePlan = (date: string, blockIds: string[]): DailyPlan => ({
    date,
    sessionMinutes: 15,
    blocks: blockIds.map((id) => ({
      id,
      title: id,
      source: 'lichess',
      destination: { source: 'lichess', label: 'Puzzles' },
      estimatedMinutes: 10,
      task: 't',
      stopRule: 's',
      reason: 'r',
      coachNote: 'c',
      status: 'pending',
      updatedAt: `${date}T09:00:00.000Z`,
    })),
    generatedFromWeaknessesAt: `${date}T09:00:00.000Z`,
  });

  it('devolve o plano atual quando não há anterior', () => {
    const current = makePlan('2026-06-12', ['a']);

    expect(combinePlanHistory(current, undefined)).toBe(current);
  });

  it('concatena blocos do anterior antes dos atuais', () => {
    const combined = combinePlanHistory(makePlan('2026-06-12', ['b']), makePlan('2026-06-11', ['a']));

    expect(combined.blocks.map((block) => block.id)).toEqual(['a', 'b']);
    expect(combined.date).toBe('2026-06-12');
  });
});

describe('getOpenedTrainingBlockIds', () => {
  it('deduplica e ordena ids de bloco', () => {
    const logs = [{ blockId: 'b' }, { blockId: 'a' }, { blockId: 'b' }] as TrainingLog[];

    expect(getOpenedTrainingBlockIds(logs)).toEqual(['a', 'b']);
  });
});

describe('getWeakThemesFromThemeStats', () => {
  it('retorna só temas com derrotas, ordenados', () => {
    const stats: PuzzleThemeStats = {
      since: '2026-06-01',
      until: '2026-06-12',
      themes: [
        { theme: 'pin', attempts: 3, losses: 0 },
        { theme: 'fork', attempts: 3, losses: 2 },
        { theme: 'backRank', attempts: 1, losses: 1 },
      ],
    };

    expect(getWeakThemesFromThemeStats(stats)).toEqual(['backRank', 'fork']);
  });

  it('retorna vazio sem stats', () => {
    expect(getWeakThemesFromThemeStats(undefined)).toEqual([]);
  });
});

describe('getLichessThemeFromUrl', () => {
  it('extrai o tema de uma URL de training', () => {
    expect(getLichessThemeFromUrl('https://lichess.org/training/fork')).toBe('fork');
  });

  it('rejeita URLs de outros caminhos ou com subpastas', () => {
    expect(getLichessThemeFromUrl('https://lichess.org/study/abc')).toBeUndefined();
    expect(getLichessThemeFromUrl('https://lichess.org/training/fork/extra')).toBeUndefined();
    expect(getLichessThemeFromUrl('https://lichess.org/training/')).toBeUndefined();
    expect(getLichessThemeFromUrl(undefined)).toBeUndefined();
  });
});

describe('upsertPendingItem', () => {
  const item = (id: string, attempts = 0): PendingTrainingItem => ({
    id,
    origin: 'puzzle',
    title: id,
    weaknessTag: 'fork',
    methodTrackId: 'pending-review',
    prompt: 'p',
    dueAt: '2026-06-13',
    attempts,
    status: 'open',
    createdAt: '2026-06-12T09:00:00.000Z',
    updatedAt: '2026-06-12T09:00:00.000Z',
  });

  it('acrescenta item novo no fim', () => {
    expect(upsertPendingItem([item('a')], item('b')).map((entry) => entry.id)).toEqual(['a', 'b']);
  });

  it('substitui item existente preservando a posição', () => {
    const result = upsertPendingItem([item('a'), item('b')], item('a', 3));

    expect(result.map((entry) => entry.id)).toEqual(['a', 'b']);
    expect(result[0]?.attempts).toBe(3);
  });
});
