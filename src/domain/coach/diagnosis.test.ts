import { describe, expect, it } from 'vitest';
import type { Weakness } from '../types';
import { diagnose } from './diagnosis';

describe('diagnose', () => {
  it('names the cause when the primary weakness has a clear signal', () => {
    const weaknesses: Weakness[] = [
      { tag: 'blunder-rate', score: 0.6, confidence: 'medium', evidence: 'erros graves recentes' },
    ];
    const result = diagnose(weaknesses);
    expect(result.kind).toBe('cause');
    if (result.kind === 'cause') {
      expect(result.weaknessTag).toBe('blunder-rate');
      expect(result.basis).toBe('aggregate');
      expect(result.message).toContain('peça');
      expect(result.procedure).toContain('defensores');
    }
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
    const result = diagnose([]);
    expect(result.kind).toBe('question');
    if (result.kind === 'question') {
      expect(result.message).toContain('O que pesou');
    }
  });

  it('names the cause for endgame tags that now have mapped procedures', () => {
    const weaknesses: Weakness[] = [
      { tag: 'endgame-pawn', score: 0.9, confidence: 'high', evidence: 'tema fora do mapa agregado' },
    ];
    const result = diagnose(weaknesses);

    expect(result.kind).toBe('cause');
    if (result.kind === 'cause') {
      expect(result.weaknessTag).toBe('endgame-pawn');
    }
  });

  it('names the cause for a tactical tag that has a mapped procedure', () => {
    const weaknesses: Weakness[] = [{ tag: 'discovered', score: 0.9, confidence: 'high', evidence: 'descobertas recentes' }];
    const result = diagnose(weaknesses);
    expect(result.kind).toBe('cause');
    if (result.kind === 'cause') {
      expect(result.weaknessTag).toBe('discovered');
    }
  });

  it('uses puzzle theme stats when a reconciled theme has clear error evidence', () => {
    const result = diagnose(
      [{ tag: 'blunder-rate', score: 0.6, confidence: 'medium', evidence: 'erros graves recentes' }],
      {
        since: '2026-06-08T10:00:00.000Z',
        until: '2026-06-08T10:15:00.000Z',
        themes: [
          { theme: 'fork', attempts: 5, losses: 3 },
          { theme: 'pin', attempts: 4, losses: 1 },
        ],
      },
    );

    expect(result.kind).toBe('cause');
    if (result.kind === 'cause') {
      expect(result.basis).toBe('puzzle-theme');
      expect(result.weaknessTag).toBe('fork');
      expect(result.message).toContain('3 erros em 5 tentativas');
    }
  });

  it('maps conversion puzzle dashboard themes to conversion weakness', () => {
    const result = diagnose([], {
      since: '2026-06-01T00:00:00.000Z',
      until: '2026-06-08T00:00:00.000Z',
      themes: [{ theme: 'advantage', attempts: 5, losses: 3 }],
    });

    expect(result.kind).toBe('cause');
    if (result.kind === 'cause') {
      expect(result.weaknessTag).toBe('conversion');
      expect(result.basis).toBe('puzzle-theme');
    }
  });

  it('does not use puzzle theme stats when volume is still weak', () => {
    const result = diagnose([], {
      since: '2026-06-08T10:00:00.000Z',
      until: '2026-06-08T10:05:00.000Z',
      themes: [{ theme: 'fork', attempts: 2, losses: 2 }],
    });

    expect(result.kind).toBe('question');
  });
});
