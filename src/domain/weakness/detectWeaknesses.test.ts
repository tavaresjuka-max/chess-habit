import { describe, expect, it } from 'vitest';
import type { Signal } from '../types';
import { detectColorWeakness, detectWeaknesses } from './detectWeaknesses';

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
        source: 'chesscom',
        confidence: 'medium',
        observedAt,
        value: { kind: 'clock', timeoutLosses: 1, games: 20 },
      },
    ];

    expect(detectWeaknesses(signals)).toEqual([]);
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
});
