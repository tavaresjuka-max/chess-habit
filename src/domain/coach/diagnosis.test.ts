import { describe, expect, it } from 'vitest';
import type { Weakness } from '../types';
import { diagnose } from './diagnosis';

describe('diagnose', () => {
  it('names the cause when the primary weakness has a clear signal', () => {
    const weaknesses: Weakness[] = [
      { tag: 'blunder-rate', score: 0.6, confidence: 'medium', evidence: 'erros graves recentes' },
    ];
    const result = diagnose(weaknesses);
    expect(result).toEqual({
      kind: 'cause',
      weaknessTag: 'blunder-rate',
      basis: 'aggregate',
      message: expect.stringContaining('peça'),
      procedure: expect.stringContaining('defensores'),
    });
  });

  it('asks a question when confidence is too low', () => {
    const weaknesses: Weakness[] = [{ tag: 'blunder-rate', score: 0.6, confidence: 'low', evidence: 'sinal fraco' }];
    expect(diagnose(weaknesses).kind).toBe('question');
  });

  it('asks a question when score is below the threshold', () => {
    const weaknesses: Weakness[] = [{ tag: 'time-trouble', score: 0.3, confidence: 'high', evidence: 'pouco volume' }];
    expect(diagnose(weaknesses).kind).toBe('question');
  });

  it('asks a question when there is no weakness at all', () => {
    expect(diagnose([])).toEqual({
      kind: 'question',
      message: expect.stringContaining('O que pesou'),
    });
  });

  it('asks a question when the tag has no mapped procedure', () => {
    const weaknesses: Weakness[] = [
      { tag: 'endgame-pawn', score: 0.9, confidence: 'high', evidence: 'tema fora do mapa agregado' },
    ];
    expect(diagnose(weaknesses).kind).toBe('question');
  });

  it('names the cause for a tactical tag that has a mapped procedure', () => {
    const weaknesses: Weakness[] = [{ tag: 'discovered', score: 0.9, confidence: 'high', evidence: 'descobertas recentes' }];
    const result = diagnose(weaknesses);
    expect(result.kind).toBe('cause');
    if (result.kind === 'cause') {
      expect(result.weaknessTag).toBe('discovered');
    }
  });
});
