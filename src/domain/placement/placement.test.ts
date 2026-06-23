import { describe, expect, it } from 'vitest';
import type { Signal } from '../types';
import {
  applyCalibration,
  bandFromEstimate,
  bandFromPuzzlePerfSignal,
  computePlacement,
  describePlacementConfidence,
} from './placement';

describe('bandFromEstimate', () => {
  it('maps estimates to the 7-band spine', () => {
    expect(bandFromEstimate(0)).toBe('0-400');
    expect(bandFromEstimate(399)).toBe('0-400');
    expect(bandFromEstimate(400)).toBe('400-800');
    expect(bandFromEstimate(950)).toBe('800-1000');
    expect(bandFromEstimate(1100)).toBe('1000-1200');
    expect(bandFromEstimate(1500)).toBe('1200-1600');
    expect(bandFromEstimate(2100)).toBe('2000-2200');
    expect(bandFromEstimate(9999)).toBe('2000-2200');
  });
});

describe('computePlacement', () => {
  it('places a total beginner at the first band with low confidence', () => {
    const result = computePlacement({
      experience: 'nunca-joguei',
      tactics: 'nao-sei-nomear',
      endgames: 'nao-sei-mate-simples',
    });

    expect(result.band).toBe('0-400');
    expect(result.confidence).toBe('low');
    expect(result.calibrationTheme).toBe('mateIn1');
  });

  it('places a casual player who knows basics in the middle bands', () => {
    const result = computePlacement({
      experience: 'jogo-casual',
      tactics: 'reconheco-basicos',
      endgames: 'sei-mates-basicos',
    });

    expect(result.band).toBe('800-1000');
    expect(result.confidence).toBe('low');
  });

  it('weights a known online rating above the questionnaire', () => {
    const result = computePlacement({
      experience: 'sei-as-regras',
      tactics: 'nao-sei-nomear',
      endgames: 'nao-sei-mate-simples',
      knownRating: 1500,
    });

    expect(result.band).toBe('1000-1200');
    expect(result.confidence).toBe('medium');
    expect(result.reasons).toHaveLength(2);
  });
});

describe('applyCalibration', () => {
  const base = computePlacement({
    experience: 'jogo-casual',
    tactics: 'reconheco-basicos',
    endgames: 'sei-mates-basicos',
  });

  it('moves up one band when almost everything was solved', () => {
    const result = applyCalibration(base, { report: 'quase-todos', source: 'self-report' });

    expect(result.band).toBe('1000-1200');
    expect(result.confidence).toBe('medium');
  });

  it('moves down two bands when almost nothing was solved', () => {
    const result = applyCalibration(base, { report: 'quase-nenhum', source: 'self-report' });

    expect(result.band).toBe('0-400');
  });

  it('reaches high confidence with real Lichess data', () => {
    const result = applyCalibration(base, { report: 'mais-da-metade', source: 'lichess' });

    expect(result.band).toBe('800-1000');
    expect(result.confidence).toBe('high');
  });

  it('never moves below the first or above the last band', () => {
    const bottom = computePlacement({
      experience: 'nunca-joguei',
      tactics: 'nao-sei-nomear',
      endgames: 'nao-sei-mate-simples',
    });

    expect(applyCalibration(bottom, { report: 'quase-nenhum', source: 'self-report' }).band).toBe('0-400');
  });
});

describe('describePlacementConfidence', () => {
  it('labels every confidence level in PT-BR', () => {
    expect(describePlacementConfidence('high')).toContain('alta');
    expect(describePlacementConfidence('medium')).toContain('média');
    expect(describePlacementConfidence('low')).toContain('baixa');
  });
});

const makePuzzlePerfSignal = (rating: number, games = 150): Signal => ({
  source: 'lichess',
  value: { kind: 'puzzle-perf', rating, games },
  confidence: 'high',
  observedAt: '2026-06-23T05:00:00.000Z',
});

describe('bandFromPuzzlePerfSignal', () => {
  it('returns correct band for rating 1340 (maps to 1200-1600)', () => {
    const result = bandFromPuzzlePerfSignal([makePuzzlePerfSignal(1340)]);
    expect(result?.band).toBe('1200-1600');
    expect(result?.rating).toBe(1340);
  });

  it('returns correct band for rating 750 (maps to 400-800)', () => {
    const result = bandFromPuzzlePerfSignal([makePuzzlePerfSignal(750)]);
    expect(result?.band).toBe('400-800');
  });

  it('keeps current band when delta from mid is less than 200 (anti-ping-pong)', () => {
    // banda 800-1000: mid=900, rating=1050, delta=150 < 200 → mantém
    const result = bandFromPuzzlePerfSignal([makePuzzlePerfSignal(1050)], '800-1000');
    expect(result?.band).toBe('800-1000');
  });

  it('changes band when delta from mid exceeds 200', () => {
    // banda 400-800: mid=600, rating=1050, delta=450 > 200 → muda
    // bandFromEstimate(1050) = '1000-1200' (primeiro upper > 1050 é 1200)
    const result = bandFromPuzzlePerfSignal([makePuzzlePerfSignal(1050)], '400-800');
    expect(result?.band).toBe('1000-1200');
  });

  it('uses the most recent signal when multiple exist', () => {
    const older: Signal = { ...makePuzzlePerfSignal(500), observedAt: '2026-06-01T00:00:00.000Z' };
    const newer: Signal = { ...makePuzzlePerfSignal(1400), observedAt: '2026-06-23T00:00:00.000Z' };
    const result = bandFromPuzzlePerfSignal([older, newer]);
    expect(result?.rating).toBe(1400);
  });

  it('returns null when no puzzle-perf signal exists', () => {
    expect(bandFromPuzzlePerfSignal([])).toBeNull();
  });

  it('returns null when signals have no lichess puzzle-perf kind', () => {
    const signal: Signal = {
      source: 'lichess',
      value: { kind: 'rating', perf: 'rapid', rating: 1200 },
      confidence: 'medium',
      observedAt: '2026-06-23T05:00:00.000Z',
    };
    expect(bandFromPuzzlePerfSignal([signal])).toBeNull();
  });
});
