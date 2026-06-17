import { describe, expect, it } from 'vitest';
import { generatePlan } from '../plan/generatePlan';
import type { LearnerProfile, PuzzleThemeStats, Signal } from '../types';
import { createWeaknessFromPuzzleStats, detectColorWeakness, detectWeaknesses, filterFreshSignals } from './detectWeaknesses';

const observedAt = '2026-06-06T00:00:00.000Z';

describe('detectWeaknesses', () => {
  it('detects blunder-rate from analysed judgment signals', () => {
    const signals: Signal[] = [
      {
        source: 'chesscom',
        confidence: 'medium',
        observedAt,
        value: { kind: 'judgment', blunders: 4, mistakes: 0, inaccuracies: 0, games: 6 },
      },
    ];

    const weaknesses = detectWeaknesses(signals);

    expect(weaknesses[0]).toMatchObject({
      tag: 'blunder-rate',
      confidence: 'medium',
      score: 0.6,
    });
  });

  it('usa limiar de blunder mais baixo nas bandas iniciantes', () => {
    const signals: Signal[] = [
      {
        source: 'chesscom',
        confidence: 'medium',
        observedAt,
        value: { kind: 'judgment', blunders: 2, mistakes: 0, inaccuracies: 0, games: 6 },
      },
    ];

    // ratio 0,33: não dispara no default (0,5), mas dispara em banda iniciante (0,3).
    expect(detectWeaknesses(signals)).toEqual([]);
    expect(detectWeaknesses(signals, '400-800')[0]).toMatchObject({ tag: 'blunder-rate' });
    expect(detectWeaknesses(signals, '1000-1200')).toEqual([]);
  });

  it('trata accuracy baixa como sinal próprio com limiar calibrado por banda', () => {
    // 6 de 8 partidas com accuracy baixa = 0,75.
    const signals: Signal[] = [
      {
        source: 'chesscom',
        confidence: 'low',
        observedAt,
        value: { kind: 'accuracy', lowAccuracyGames: 6, games: 8 },
      },
    ];

    // Default (0,6) dispara; iniciante (0,8) não — accuracy baixa é normal lá.
    expect(detectWeaknesses(signals, '1000-1200')[0]).toMatchObject({ tag: 'blunder-rate', confidence: 'low' });
    expect(detectWeaknesses(signals, '400-800')).toEqual([]);
  });

  it('ignora accuracy baixa com amostra pequena (< 8 partidas)', () => {
    const signals: Signal[] = [
      {
        source: 'chesscom',
        confidence: 'low',
        observedAt,
        value: { kind: 'accuracy', lowAccuracyGames: 6, games: 7 },
      },
    ];

    expect(detectWeaknesses(signals, '1000-1200')).toEqual([]);
  });

  it('keeps the plan conservative when thresholds do not fire', () => {
    const signals: Signal[] = [
      {
        source: 'lichess',
        confidence: 'medium',
        observedAt,
        value: { kind: 'clock', timeoutLosses: 1, games: 20 },
      },
    ];

    expect(detectWeaknesses(signals)).toEqual([]);
  });

  it('uses Chess.com-aware opening thresholds for shallow high-volume history', () => {
    const signals: Signal[] = [
      ...Array.from({ length: 293 }, (_, index) => ({
        source: 'chesscom' as const,
        confidence: 'low' as const,
        observedAt,
        value: { kind: 'rating' as const, perf: 'rapid' as const, rating: 900 + index },
      })),
      {
        source: 'chesscom',
        confidence: 'medium',
        observedAt,
        value: { kind: 'opening', eco: 'C20', name: 'King Pawn Game', games: 24, lossRate: 0.54 },
      },
    ];

    expect(detectWeaknesses(signals, '800-1000')).toEqual([
      expect.objectContaining({ tag: 'opening-principles', confidence: 'medium' }),
    ]);
  });

  it('treats one Chess.com timeout in 15 games as a clock weakness', () => {
    const signals: Signal[] = [
      {
        source: 'chesscom',
        confidence: 'medium',
        observedAt,
        value: { kind: 'clock', timeoutLosses: 1, games: 15 },
      },
    ];

    expect(detectWeaknesses(signals, '800-1000')).toEqual([
      expect.objectContaining({ tag: 'time-trouble', confidence: 'medium' }),
    ]);
  });

  it('turns manual signals into medium-confidence hypotheses', () => {
    const signals: Signal[] = [
      {
        source: 'outro',
        confidence: 'medium',
        observedAt,
        value: { kind: 'manual', tag: 'mate-in-2', note: 'Sinal manual: testar mate em 2.' },
      },
    ];

    expect(detectWeaknesses(signals)[0]).toMatchObject({
      tag: 'mate-in-2',
      confidence: 'medium',
      score: 0.6,
      evidence: 'Sinal manual: testar mate em 2.',
    });
  });

  it('ordena alfabeticamente por tag quando dois scores são iguais', () => {
    // Dois sinais manuais com confidence 'medium' produzem score 0.6 cada.
    // sortWeaknesses usa localeCompare(tag) como desempate → 'blunder-rate' < 'fork'.
    const signals: Signal[] = [
      {
        source: 'outro',
        confidence: 'medium',
        observedAt,
        value: { kind: 'manual', tag: 'fork', note: 'Sinal manual: garfo.' },
      },
      {
        source: 'outro',
        confidence: 'medium',
        observedAt,
        value: { kind: 'manual', tag: 'blunder-rate', note: 'Sinal manual: anti-blunder.' },
      },
    ];

    const weaknesses = detectWeaknesses(signals);

    expect(weaknesses).toHaveLength(2);
    expect(weaknesses[0]?.score).toBe(weaknesses[1]?.score);
    expect(weaknesses[0]?.tag).toBe('blunder-rate');
    expect(weaknesses[1]?.tag).toBe('fork');
  });

  it('aggregates opening signals under one opening-principles weakness', () => {
    const signals: Signal[] = [
      {
        source: 'chesscom',
        confidence: 'medium',
        observedAt,
        value: { kind: 'opening', eco: 'C20', name: 'King Pawn Game', games: 7, lossRate: 0.71 },
      },
      {
        source: 'chesscom',
        confidence: 'low',
        observedAt,
        value: { kind: 'color', color: 'white', games: 8, lossRate: 0.75 },
      },
      {
        source: 'chesscom',
        confidence: 'low',
        observedAt,
        value: { kind: 'color', color: 'black', games: 8, lossRate: 0.25 },
      },
    ];

    const weaknesses = detectWeaknesses(signals);
    const openingWeaknesses = weaknesses.filter((weakness) => weakness.tag === 'opening-principles');

    expect(openingWeaknesses).toHaveLength(1);
    expect(openingWeaknesses[0]?.confidence).toBe('medium');
  });
});

describe('filterFreshSignals', () => {
  it('keeps a signal whose observedAt is an invalid date string', () => {
    const invalidSignal: Signal = {
      source: 'outro',
      confidence: 'medium',
      observedAt: 'not-a-date',
      value: { kind: 'manual', tag: 'fork', note: 'Sinal com data inválida.' },
    };

    const result = filterFreshSignals([invalidSignal], '2026-06-06T00:00:00.000Z');

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(invalidSignal);
  });
});

describe('detectColorWeakness', () => {
  it('detects a color imbalance only when both colors have enough games', () => {
    const signals: Signal[] = [
      {
        source: 'chesscom',
        confidence: 'low',
        observedAt,
        value: { kind: 'color', color: 'white', games: 6, lossRate: 0.8 },
      },
      {
        source: 'chesscom',
        confidence: 'low',
        observedAt,
        value: { kind: 'color', color: 'black', games: 5, lossRate: 0.2 },
      },
    ];

    expect(detectColorWeakness(signals)).toMatchObject({
      tag: 'opening-principles',
      confidence: 'low',
    });
  });

  it('returns undefined when color loss rates are too close to diagnose a weakness', () => {
    const signals: Signal[] = [
      {
        source: 'chesscom',
        confidence: 'low',
        observedAt,
        value: { kind: 'color', color: 'white', games: 10, lossRate: 0.5 },
      },
      {
        source: 'chesscom',
        confidence: 'low',
        observedAt,
        value: { kind: 'color', color: 'black', games: 10, lossRate: 0.45 },
      },
    ];

    // lossRateDiff = 0.05 ≤ 0.2 → no diagnosable color weakness
    expect(detectColorWeakness(signals)).toBeUndefined();
  });
});

describe('createWeaknessFromPuzzleStats', () => {
  const profile: LearnerProfile = {
    lichessUsername: 'jukasparov',
    band: '800-1000',
    defaultSessionMinutes: 15,
    goals: ['treinar com constancia'],
    updatedAt: '2026-06-06T00:00:00.000Z',
  };

  it('creates a durable weakness that survives plan regeneration without new game signals', () => {
    const weakness = createWeaknessFromPuzzleStats(
      puzzleStats({
        until: '2026-06-10T12:00:00.000Z',
        themes: [{ theme: 'fork', attempts: 6, losses: 4 }],
      }),
      '2026-06-15T00:00:00.000Z',
    );

    expect(weakness).toMatchObject({ tag: 'fork', confidence: 'medium' });

    if (weakness === undefined) {
      throw new Error('expected puzzle weakness');
    }

    const plan = generatePlan(profile, [weakness], 15, '2026-06-16');

    expect(plan.weeklyFocus?.tag).toBe('fork');
  });

  it('decays puzzle weaknesses after 90 days', () => {
    const weakness = createWeaknessFromPuzzleStats(
      puzzleStats({
        until: '2026-02-01T12:00:00.000Z',
        themes: [{ theme: 'fork', attempts: 6, losses: 4 }],
      }),
      '2026-06-15T00:00:00.000Z',
    );

    expect(weakness).toBeUndefined();
  });
});

function puzzleStats(input: { until: string; themes: PuzzleThemeStats['themes'] }): PuzzleThemeStats {
  return {
    since: input.until,
    until: input.until,
    themes: input.themes,
  };
}
