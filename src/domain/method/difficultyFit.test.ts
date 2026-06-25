import { describe, expect, it } from 'vitest';

import { classifyDifficultyFit, decideMismatchAction, solveRate } from './difficultyFit';

describe('solveRate', () => {
  it('é (attempts - losses) / attempts; 0 quando não há tentativas', () => {
    expect(solveRate({ attempts: 0, losses: 0 })).toBe(0);
    expect(solveRate({ attempts: 10, losses: 4 })).toBeCloseTo(0.6, 5);
    expect(solveRate({ attempts: 10, losses: 0 })).toBe(1);
  });

  it('não vai negativo se losses > attempts (dado sujo)', () => {
    expect(solveRate({ attempts: 5, losses: 9 })).toBe(0);
  });
});

describe('classifyDifficultyFit', () => {
  it('sem amostra suficiente = insufficient (cold-start não adia)', () => {
    expect(classifyDifficultyFit({ attempts: 3, losses: 3 })).toBe('insufficient');
    expect(classifyDifficultyFit({ attempts: 1, losses: 0 })).toBe('insufficient');
  });

  it('solve-rate < 0.40 com amostra = too-hard', () => {
    expect(classifyDifficultyFit({ attempts: 10, losses: 7 })).toBe('too-hard'); // 0.30
    expect(classifyDifficultyFit({ attempts: 4, losses: 4 })).toBe('too-hard'); // 0.00
  });

  it('solve-rate > 0.85 com amostra = too-easy', () => {
    expect(classifyDifficultyFit({ attempts: 10, losses: 1 })).toBe('too-easy'); // 0.90
    expect(classifyDifficultyFit({ attempts: 20, losses: 2 })).toBe('too-easy'); // 0.90
  });

  it('entre os limiares = fit; fronteiras (0.40 e 0.85) são fit', () => {
    expect(classifyDifficultyFit({ attempts: 10, losses: 4 })).toBe('fit'); // 0.60
    expect(classifyDifficultyFit({ attempts: 10, losses: 6 })).toBe('fit'); // 0.40 exato
    expect(classifyDifficultyFit({ attempts: 20, losses: 3 })).toBe('fit'); // 0.85 exato
  });

  it('minAttempts customizável', () => {
    expect(classifyDifficultyFit({ attempts: 4, losses: 4 }, { minAttempts: 8 })).toBe('insufficient');
    expect(classifyDifficultyFit({ attempts: 8, losses: 8 }, { minAttempts: 8 })).toBe('too-hard');
  });
});

describe('decideMismatchAction', () => {
  it('too-hard + tem Study curada = route-study (cai pro layer controlável)', () => {
    expect(decideMismatchAction('too-hard', { hasCuratedStudy: true })).toBe('route-study');
  });

  it('too-hard + sem Study = defer (adia com nota honesta)', () => {
    expect(decideMismatchAction('too-hard', { hasCuratedStudy: false })).toBe('defer');
  });

  it('fit / too-easy / insufficient nunca disparam mismatch', () => {
    expect(decideMismatchAction('fit', { hasCuratedStudy: false })).toBe('continue');
    expect(decideMismatchAction('too-easy', { hasCuratedStudy: true })).toBe('continue');
    expect(decideMismatchAction('insufficient', { hasCuratedStudy: false })).toBe('continue');
  });
});
