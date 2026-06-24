import { describe, expect, it } from 'vitest';
import {
  applyCalibration,
  bandFromEstimate,
  computePlacement,
  describePlacementConfidence,
} from './placement';

describe('bandFromEstimate', () => {
  it('maps estimates to the 8-band spine (teto aspiracional FM 2200-2400)', () => {
    expect(bandFromEstimate(0)).toBe('0-400');
    expect(bandFromEstimate(399)).toBe('0-400');
    expect(bandFromEstimate(400)).toBe('400-800');
    expect(bandFromEstimate(950)).toBe('800-1000');
    expect(bandFromEstimate(1100)).toBe('1000-1200');
    expect(bandFromEstimate(1500)).toBe('1200-1600');
    expect(bandFromEstimate(2100)).toBe('2000-2200');
    expect(bandFromEstimate(2300)).toBe('2200-2400');
    expect(bandFromEstimate(9999)).toBe('2200-2400');
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

