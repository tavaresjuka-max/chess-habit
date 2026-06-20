import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MethodTrackId, PendingTrainingItem } from './types';
import {
  advancePendingItem,
  buildGuidingPrompt,
  createPendingItemFromFeedback,
  getNextDueDate,
  isDueToday,
} from './pendingItems';

// Data LOCAL (igual a toDateKey/getTodayDate da app). Usar UTC (toISOString)
// divergia do dominio na virada de meia-noite UTC e deixava os testes flaky.
const toLocalDateKey = (date: Date): string =>
  `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const today = toLocalDateKey(new Date());
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

afterEach(() => {
  vi.useRealTimers();
});

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

  it('uses the local study date between 21h and 23h in Sao Paulo', () => {
    const nightCases = [
      '2026-06-18T00:30:00.000Z', // 2026-06-17 21:30 -03
      '2026-06-18T01:30:00.000Z', // 2026-06-17 22:30 -03
      '2026-06-18T02:30:00.000Z', // 2026-06-17 23:30 -03
    ];

    for (const iso of nightCases) {
      vi.setSystemTime(new Date(iso));

      expect(
        getNextDueDate(0, {
          nowFn: () => new Date(iso),
          timeZone: 'America/Sao_Paulo',
        }),
      ).toBe('2026-06-18');
    }
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

  it('pula dois níveis de espaçamento no feedback easy', () => {
    const advanced = advancePendingItem(createItem({ attempts: 1 }), 'easy');

    expect(advanced).toMatchObject({ attempts: 3, status: 'open', lastFeedback: 'easy' });
  });

  it('recua um nível e reexpõe amanhã no feedback hard', () => {
    const advanced = advancePendingItem(createItem({ attempts: 2, dueAt: today }), 'hard');

    expect(advanced).toMatchObject({ attempts: 1, status: 'open', dueAt: tomorrow, lastFeedback: 'hard' });
  });

  it('não deixa attempts negativo com hard no nível zero', () => {
    const advanced = advancePendingItem(createItem({ attempts: 0 }), 'hard');

    expect(advanced).toMatchObject({ attempts: 0, dueAt: tomorrow });
  });

  it('gradua mais rápido com easy repetido', () => {
    const once = advancePendingItem(createItem({ attempts: 0 }), 'easy');
    const twice = advancePendingItem(once, 'easy');

    expect(twice).toMatchObject({ attempts: 4, status: 'done' });
  });

  it('usa mastery advance para graduar em menos repetições que o feedback sozinho', () => {
    const item = createItem({ attempts: 2 });

    expect(advancePendingItem(item, 'good')).toMatchObject({ attempts: 3, status: 'open' });
    expect(advancePendingItem(item, 'good', 'advance')).toMatchObject({ attempts: 4, status: 'done' });
  });

  it('usa mastery regress para zerar attempts e revisar amanhã mesmo com feedback good', () => {
    const advanced = advancePendingItem(createItem({ attempts: 3, dueAt: today }), 'good', 'regress');

    expect(advanced).toMatchObject({
      attempts: 0,
      dueAt: tomorrow,
      status: 'open',
      lastFeedback: 'good',
    });
  });

  it('mantém review e undefined retrocompatíveis com a chamada de dois argumentos', () => {
    const item = createItem({ attempts: 2, dueAt: today });
    const baseline = advancePendingItem(item, 'hard');

    expect(advancePendingItem(item, 'hard', 'review')).toMatchObject({
      attempts: baseline.attempts,
      dueAt: baseline.dueAt,
      status: baseline.status,
      lastFeedback: baseline.lastFeedback,
    });
    expect(advancePendingItem(item, 'hard', undefined)).toMatchObject({
      attempts: baseline.attempts,
      dueAt: baseline.dueAt,
      status: baseline.status,
      lastFeedback: baseline.lastFeedback,
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
