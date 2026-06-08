import { describe, expect, it } from 'vitest';
import type { TrainingLog } from '../types';
import { computeConsistency } from './consistency';

function doneLog(date: string, id: string): TrainingLog {
  return {
    id,
    date,
    blockId: `${date}-01-tema`,
    blockTitle: 'Tema do dia',
    source: 'lichess',
    destinationLabel: 'Lichess',
    plannedSeconds: 600,
    startedAt: `${date}T10:00:00.000Z`,
    completedAt: `${date}T10:08:00.000Z`,
    elapsedSeconds: 480,
    timeLimitReached: false,
    status: 'done',
    updatedAt: `${date}T10:08:00.000Z`,
  };
}

describe('computeConsistency', () => {
  it('returns zeros when there are no logs', () => {
    expect(computeConsistency([], '2026-06-08')).toEqual({
      currentStreakDays: 0,
      longestStreakDays: 0,
      daysSinceLastSession: 0,
      returnedAfterGap: false,
    });
  });

  it('counts a 3-day consecutive streak ending today', () => {
    const logs = [doneLog('2026-06-06', 'a'), doneLog('2026-06-07', 'b'), doneLog('2026-06-08', 'c')];
    const result = computeConsistency(logs, '2026-06-08');
    expect(result.currentStreakDays).toBe(3);
    expect(result.longestStreakDays).toBe(3);
    expect(result.daysSinceLastSession).toBe(0);
    expect(result.returnedAfterGap).toBe(false);
  });

  it('keeps the streak alive when the last session was yesterday', () => {
    const logs = [doneLog('2026-06-06', 'a'), doneLog('2026-06-07', 'b')];
    expect(computeConsistency(logs, '2026-06-08').currentStreakDays).toBe(2);
  });

  it('breaks the streak when a calendar day has no done log', () => {
    const logs = [doneLog('2026-06-06', 'a'), doneLog('2026-06-08', 'b')];
    const result = computeConsistency(logs, '2026-06-08');
    expect(result.currentStreakDays).toBe(1);
    expect(result.longestStreakDays).toBe(1);
  });

  it('counts two done logs on the same day as one', () => {
    const logs = [doneLog('2026-06-08', 'a'), doneLog('2026-06-08', 'b')];
    expect(computeConsistency(logs, '2026-06-08').currentStreakDays).toBe(1);
  });

  it('flags returnedAfterGap when away for 2+ days', () => {
    const logs = [doneLog('2026-06-04', 'a')];
    expect(computeConsistency(logs, '2026-06-08').returnedAfterGap).toBe(true);
  });

  it('ignores non-done logs', () => {
    const skipped: TrainingLog = { ...doneLog('2026-06-08', 'a'), status: 'skipped', completedAt: undefined };
    expect(computeConsistency([skipped], '2026-06-08').currentStreakDays).toBe(0);
  });
});
