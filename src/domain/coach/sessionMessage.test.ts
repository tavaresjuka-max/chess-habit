import { describe, expect, it } from 'vitest';
import type { Consistency, TrainingResult, Weakness } from '../types';
import { BANNED_PHRASES, buildSessionMessage } from './sessionMessage';

const baseConsistency: Consistency = {
  currentStreakDays: 0,
  longestStreakDays: 0,
  daysSinceLastSession: 0,
  returnedAfterGap: false,
};

const weakness: Weakness = {
  tag: 'fork',
  score: 0.9,
  confidence: 'high',
  evidence: 'Garfos apareceram com frequência nas partidas recentes.',
};

describe('buildSessionMessage', () => {
  it('opens with the reason of the day in welcome phase', () => {
    const message = buildSessionMessage({ phase: 'pre', primaryWeakness: weakness, consistency: baseConsistency });
    expect(message.phase).toBe('welcome');
    expect(message.lines).toContain(weakness.evidence);
  });

  it('adds a sober streak line from 2 days on', () => {
    const message = buildSessionMessage({
      phase: 'pre',
      primaryWeakness: weakness,
      consistency: { ...baseConsistency, currentStreakDays: 3 },
    });
    expect(message.lines.some((line) => line.includes('3 dias seguidos'))).toBe(true);
  });

  it('uses the return phase after an absence', () => {
    const message = buildSessionMessage({
      phase: 'pre',
      primaryWeakness: weakness,
      consistency: { ...baseConsistency, daysSinceLastSession: 4, returnedAfterGap: true },
    });
    expect(message.phase).toBe('return');
    expect(message.lines[0]).toContain('Sem cobrança');
  });

  it('branches the close message by feedback', () => {
    const hard = buildSessionMessage({ phase: 'post', consistency: baseConsistency, lastFeedback: 'hard' });
    const easy = buildSessionMessage({ phase: 'post', consistency: baseConsistency, lastFeedback: 'easy' });
    expect(hard.phase).toBe('close');
    expect(hard.lines.some((line) => line.includes('reduzir'))).toBe(true);
    expect(easy.lines.some((line) => line.includes('subir') || line.includes('dificuldade'))).toBe(true);
  });

  it('reports real puzzle numbers without inventing', () => {
    const result: TrainingResult = {
      source: 'lichess',
      kind: 'puzzle-activity',
      fetchedAt: '2026-06-08T10:00:00.000Z',
      since: '2026-06-08T00:00:00.000Z',
      until: '2026-06-08T10:00:00.000Z',
      puzzles: 5,
      wins: 4,
      losses: 1,
      themes: ['fork'],
    };
    const message = buildSessionMessage({
      phase: 'post',
      consistency: baseConsistency,
      lastFeedback: 'good',
      puzzleResult: result,
    });
    expect(message.lines.some((line) => line.includes('4') && line.includes('1'))).toBe(true);
  });

  it('never uses banned phrases', () => {
    const messages = [
      buildSessionMessage({
        phase: 'pre',
        primaryWeakness: weakness,
        consistency: { ...baseConsistency, currentStreakDays: 5 },
      }),
      buildSessionMessage({ phase: 'pre', consistency: { ...baseConsistency, daysSinceLastSession: 3, returnedAfterGap: true } }),
      buildSessionMessage({ phase: 'post', consistency: baseConsistency, lastFeedback: 'hard' }),
    ];
    for (const message of messages) {
      for (const line of message.lines) {
        for (const banned of BANNED_PHRASES) {
          expect(line.toLowerCase()).not.toContain(banned);
        }
      }
    }
  });
});
