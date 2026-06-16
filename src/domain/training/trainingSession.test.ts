import { describe, expect, it } from 'vitest';
import type { PlanBlock } from '../types';
import {
  completeTrainingLog,
  createTrainingLog,
  elapsedSecondsBetween,
  formatElapsedMinutes,
  reconcileTrainingLogResult,
} from './trainingSession';

const block: PlanBlock = {
  id: '2026-06-06-01-tema',
  title: 'Tema do dia: garfos',
  source: 'lichess',
  destination: {
    source: 'lichess',
    label: 'Puzzles Lichess: garfos',
    url: 'https://lichess.org/training/fork',
  },
  estimatedMinutes: 10,
  task: 'Treine.',
  stopRule: 'Pare no tempo.',
  reason: 'Hipotese.',
  coachNote: 'Calma.',
  status: 'pending',
  updatedAt: '2026-06-06T00:00:00.000Z',
};

describe('trainingSession', () => {
  it('creates an active log from a plan block', () => {
    const log = createTrainingLog({
      block,
      date: '2026-06-06',
      startedAt: '2026-06-06T10:00:00.000Z',
    });

    expect(log).toMatchObject({
      id: '2026-06-06:2026-06-06-01-tema',
      blockId: block.id,
      logKind: 'puzzle',
      plannedSeconds: 600,
      status: 'active',
    });
  });

  it('classifies non-training Lichess destinations as standard logs', () => {
    const log = createTrainingLog({
      block: {
        ...block,
        destination: {
          source: 'lichess',
          label: 'Lichess Practice: The Fork',
          url: 'https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p',
        },
      },
      date: '2026-06-06',
      startedAt: '2026-06-06T10:00:00.000Z',
    });

    expect(log.logKind).toBe('standard');
  });

  it('completes a log with real elapsed time and limit status', () => {
    const log = createTrainingLog({
      block,
      date: '2026-06-06',
      startedAt: '2026-06-06T10:00:00.000Z',
    });

    const completed = completeTrainingLog({
      log,
      completedAt: '2026-06-06T10:07:15.000Z',
    });

    expect(completed.elapsedSeconds).toBe(435);
    expect(completed.timeLimitReached).toBe(false);
    expect(completed.status).toBe('done');
  });

  it('stores optional completion feedback with the log', () => {
    const log = createTrainingLog({
      block,
      date: '2026-06-06',
      startedAt: '2026-06-06T10:00:00.000Z',
    });

    const completed = completeTrainingLog({
      log,
      completedAt: '2026-06-06T10:03:00.000Z',
      feedback: 'hard',
    });

    expect(completed.feedback).toBe('hard');
    expect(completed.elapsedSeconds).toBe(180);
  });

  it('formats sub-minute completion as one minute', () => {
    expect(formatElapsedMinutes(20)).toBe('1 min');
    expect(formatElapsedMinutes(90)).toBe('2 min');
  });

  it('formats a zero-duration completion honestly instead of inflating to a minute', () => {
    expect(formatElapsedMinutes(0)).toBe('menos de 1 min');
  });

  it('guards invalid elapsed dates', () => {
    expect(elapsedSecondsBetween('bad', '2026-06-06T10:00:00.000Z')).toBe(0);
  });

  it('reconciles later puzzle activity into an active log', () => {
    const log = createTrainingLog({
      block,
      date: '2026-06-06',
      startedAt: '2026-06-06T10:00:00.000Z',
    });

    const reconciled = reconcileTrainingLogResult({
      log,
      result: {
        source: 'lichess',
        kind: 'puzzle-activity',
        fetchedAt: '2026-06-06T10:12:00.000Z',
        since: '2026-06-06T10:00:00.000Z',
        until: '2026-06-06T10:11:00.000Z',
        puzzles: 4,
        wins: 3,
        losses: 1,
        themes: ['fork'],
      },
    });

    expect(reconciled.status).toBe('done');
    expect(reconciled.elapsedSeconds).toBe(660);
    expect(reconciled.timeLimitReached).toBe(true);
    expect(reconciled.result?.wins).toBe(3);
  });
});
