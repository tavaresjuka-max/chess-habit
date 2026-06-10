import { describe, expect, it } from 'vitest';
import type { MethodTrackId, PendingTrainingItem } from './types';
import {
  advancePendingItem,
  buildGuidingPrompt,
  createPendingItemFromFeedback,
  isDueToday,
} from './pendingItems';

const today = new Date().toISOString().split('T')[0] ?? '2026-06-10';
const tomorrow = addDays(today, 1);

const baseLog = {
  id: '2026-06-10:block-1',
  date: '2026-06-10',
  blockId: 'block-1',
  blockTitle: 'Garfo',
  source: 'lichess',
  destinationLabel: 'Puzzles Lichess: Fork',
  plannedSeconds: 300,
  startedAt: '2026-06-10T10:00:00.000Z',
  completedAt: '2026-06-10T10:05:00.000Z',
  elapsedSeconds: 300,
  timeLimitReached: false,
  status: 'done',
  feedback: 'hard',
  updatedAt: '2026-06-10T10:05:00.000Z',
} as const;

describe('pending training items', () => {
  it('creates an open pending item from hard feedback due tomorrow', () => {
    const item = createPendingItemFromFeedback(baseLog, 'fork', 'pending-review', 'fork');

    expect(item).toMatchObject({
      status: 'open',
      dueAt: tomorrow,
      title: 'Revisar: Garfo',
      lichessUrl: 'https://lichess.org/training/fork',
      lastFeedback: 'hard',
    });
  });

  it('treats open items due today as due', () => {
    expect(isDueToday(createItem({ dueAt: today }))).toBe(true);
  });

  it('does not treat open items due tomorrow as due', () => {
    expect(isDueToday(createItem({ dueAt: tomorrow }))).toBe(false);
  });

  it('does not treat done items as due', () => {
    expect(isDueToday(createItem({ dueAt: today, status: 'done' }))).toBe(false);
  });

  it('marks an item done after four advances', () => {
    const first = createItem({ attempts: 0 });
    const second = advancePendingItem(first);
    const third = advancePendingItem(second);
    const fourth = advancePendingItem(third);
    const fifth = advancePendingItem(fourth);

    expect(fifth).toMatchObject({
      attempts: 4,
      status: 'done',
    });
  });

  it('returns a guiding prompt for every track', () => {
    const tracks: MethodTrackId[] = [
      'pending-review',
      'calculation-bridge',
      'active-defense',
      'opening-as-plan',
      'progress-diplomas',
    ];

    for (const track of tracks) {
      expect(buildGuidingPrompt(track)).not.toBe('');
    }
  });
});

function createItem(overrides: Partial<PendingTrainingItem>): PendingTrainingItem {
  return {
    id: 'pending-1',
    origin: 'puzzle',
    title: 'Revisar: Garfo',
    weaknessTag: 'fork',
    methodTrackId: 'pending-review',
    prompt: 'Qual sinal?',
    dueAt: today,
    attempts: 0,
    status: 'open',
    createdAt: `${today}T00:00:00.000Z`,
    updatedAt: `${today}T00:00:00.000Z`,
    ...overrides,
  };
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}
