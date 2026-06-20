import { describe, expect, it } from 'vitest';
import type { PendingTrainingItem } from './types';
import { selectMethodTrack } from './selectMethodTrack';

// Data LOCAL (igual a toDateKey/getTodayDate da app); UTC divergia na virada de
// meia-noite UTC e deixava o teste flaky.
const toLocalDateKey = (date: Date): string =>
  `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const today = toLocalDateKey(new Date());

describe('selectMethodTrack', () => {
  it('prioritizes pending-review when a due item exists', () => {
    expect(
      selectMethodTrack({
        openPendingItems: [createPendingItem({ dueAt: today })],
        primaryWeakness: 'fork',
        weakThemes: [],
      }),
    ).toBe('pending-review');
  });

  it('selects active-defense for weak defensiveMove dashboard theme', () => {
    expect(
      selectMethodTrack({
        openPendingItems: [],
        primaryWeakness: 'fork',
        weakThemes: ['defensiveMove'],
      }),
    ).toBe('active-defense');
  });

  it('selects calculation-bridge for dominant fork weakness', () => {
    expect(
      selectMethodTrack({
        openPendingItems: [],
        primaryWeakness: 'fork',
        weakThemes: [],
      }),
    ).toBe('calculation-bridge');
  });

  it('selects opening-as-plan for opening-principles weakness', () => {
    expect(
      selectMethodTrack({
        openPendingItems: [],
        primaryWeakness: 'opening-principles',
        weakThemes: [],
      }),
    ).toBe('opening-as-plan');
  });

  it('defaults to calculation-bridge without a specific signal', () => {
    expect(
      selectMethodTrack({
        openPendingItems: [],
        weakThemes: [],
      }),
    ).toBe('calculation-bridge');
  });

  it('promove para progress-diplomas após diploma recente (decisão 3)', () => {
    expect(
      selectMethodTrack({
        openPendingItems: [],
        primaryWeakness: 'fork',
        weakThemes: [],
        recentlyEarnedDiploma: true,
      }),
    ).toBe('progress-diplomas');
  });

  it('mantém pending-review acima da trilha de diploma recente', () => {
    expect(
      selectMethodTrack({
        openPendingItems: [createPendingItem({ dueAt: today })],
        primaryWeakness: 'fork',
        weakThemes: [],
        recentlyEarnedDiploma: true,
      }),
    ).toBe('pending-review');
  });
});

function createPendingItem(overrides: Partial<PendingTrainingItem>): PendingTrainingItem {
  return {
    id: 'pending-1',
    origin: 'puzzle',
    title: 'Revisar tema: fork',
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
