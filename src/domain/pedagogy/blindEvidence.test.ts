import { describe, expect, it } from 'vitest';
import type { TrainingLog } from '../types';
import { buildBlindConceptEvidence, isStrongBlindEvidenceLog } from './blindEvidence';

const baseLog: TrainingLog = {
  id: 'log-1',
  date: '2026-07-01',
  blockId: 'block-1',
  blockTitle: 'Tema do dia',
  source: 'lichess',
  destinationLabel: 'Lichess',
  plannedSeconds: 600,
  startedAt: '2026-07-01T10:00:00.000Z',
  completedAt: '2026-07-01T10:10:00.000Z',
  timeLimitReached: false,
  status: 'done',
  feedback: 'good',
  updatedAt: '2026-07-01T10:10:00.000Z',
};

describe('blindEvidence', () => {
  it('aceita apenas logs concluídos, cegos, sem dica e sem vazamento', () => {
    expect(
      isStrongBlindEvidenceLog({
        ...baseLog,
        conceptContractId: 'fork',
        isBlindAttempt: true,
        hintWasVisible: false,
        platformThemeLeakRisk: false,
      }),
    ).toBe(true);

    expect(
      isStrongBlindEvidenceLog({
        ...baseLog,
        conceptContractId: 'fork',
        isBlindAttempt: true,
        hintWasVisible: true,
        platformThemeLeakRisk: false,
      }),
    ).toBe(false);

    expect(
      isStrongBlindEvidenceLog({
        ...baseLog,
        conceptContractId: 'fork',
        isBlindAttempt: true,
        hintWasVisible: false,
        platformThemeLeakRisk: true,
      }),
    ).toBe(false);
  });

  it('calcula streak cego por conceito e hard cego zera a sequência', () => {
    const evidence = buildBlindConceptEvidence([
      makeLog('1', 'fork', 'good'),
      makeLog('2', 'fork', 'easy'),
      makeLog('3', 'fork', 'hard'),
      makeLog('4', 'fork', 'good'),
      makeLog('5', 'pin', 'good'),
      makeLog('6', 'fork', 'good', { platformThemeLeakRisk: true }),
    ]);

    expect(evidence.find((entry) => entry.conceptId === 'fork')).toMatchObject({
      eligibleAttempts: 3,
      blindCorrectStreak: 1,
    });
    expect(evidence.find((entry) => entry.conceptId === 'pin')).toMatchObject({
      eligibleAttempts: 1,
      blindCorrectStreak: 1,
    });
  });
});

function makeLog(
  id: string,
  conceptContractId: TrainingLog['conceptContractId'],
  feedback: TrainingLog['feedback'],
  overrides: Partial<TrainingLog> = {},
): TrainingLog {
  return {
    ...baseLog,
    id,
    blockId: `block-${id}`,
    completedAt: `2026-07-01T10:${id.padStart(2, '0')}:00.000Z`,
    updatedAt: `2026-07-01T10:${id.padStart(2, '0')}:00.000Z`,
    conceptContractId,
    isBlindAttempt: true,
    hintWasVisible: false,
    platformThemeLeakRisk: false,
    feedback,
    ...overrides,
  };
}
