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

  it('não gradua com 4 revisões se a acurácia cumulativa do tema < 75% (amostra suficiente)', () => {
    const advanced = advancePendingItem(createItem({ attempts: 3 }), 'good', undefined, {
      accuracyPercent: 50,
      attempts: 12,
    });

    expect(advanced).toMatchObject({ attempts: 4, status: 'open' });
  });

  it('gradua com 4 revisões quando a acurácia cumulativa do tema >= 75%', () => {
    const advanced = advancePendingItem(createItem({ attempts: 3 }), 'good', undefined, {
      accuracyPercent: 80,
      attempts: 12,
    });

    expect(advanced).toMatchObject({ attempts: 4, status: 'done' });
  });

  it('gradua por volume com pouca amostra do tema (válvula: dados ralos não travam)', () => {
    const advanced = advancePendingItem(createItem({ attempts: 3 }), 'good', undefined, {
      accuracyPercent: 40,
      attempts: 5,
    });

    expect(advanced).toMatchObject({ attempts: 4, status: 'done' });
  });

  it('gradua por volume quando não há medição cumulativa do tema', () => {
    const advanced = advancePendingItem(createItem({ attempts: 3 }), 'good', undefined, undefined);

    expect(advanced).toMatchObject({ attempts: 4, status: 'done' });
  });

  it('válvula de escape: após 2 ciclos bloqueado no teto, forma assim mesmo', () => {
    const blocked = { accuracyPercent: 50, attempts: 12 };

    const first = advancePendingItem(createItem({ attempts: 3 }), 'good', undefined, blocked);
    expect(first).toMatchObject({ attempts: 4, status: 'open', gateBlockedCount: 1 });

    const second = advancePendingItem(first, 'good', undefined, blocked);
    expect(second).toMatchObject({ attempts: 4, status: 'done', gateBlockedCount: 2 });
  });

  it('zera o contador de escape quando o item não está bloqueado no teto', () => {
    const recovered = advancePendingItem(createItem({ attempts: 3, gateBlockedCount: 1 }), 'good', undefined, {
      accuracyPercent: 90,
      attempts: 12,
    });

    expect(recovered).toMatchObject({ attempts: 4, status: 'done', gateBlockedCount: 0 });
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

  it('cadeia de transições: hard → open → due → advance(hard) → open again (M-Hardening Task 5)', () => {
    // Cadeia pedida pelo plano (Task 5):
    //   criação por feedback 'hard' → open (estudar) → defer/reestuda → volta a ficar due.
    // Asserir cada transição persiste o campo certo (status, dueAt, lastFeedback, attempts).
    //
    // 1. Criação por 'hard': item nasce OPEN, dueAt=amanhã, lastFeedback='hard'.
    const created = createPendingItemFromFeedback(baseLog, 'fork', 'pending-review', 'fork');

    expect(created).toMatchObject({
      status: 'open',
      dueAt: tomorrow,
      lastFeedback: 'hard',
      attempts: 0,
    });
    // No dia seguinte ainda NÃO está due (dueAt=amanhã == hoje+1; isDueToday checa <=).
    // Simula "hoje" sendo o dia da criação: dueAt=amanhã ainda não venceu.
    expect(isDueToday(created, { nowFn: () => new Date(`${today}T12:00:00`) })).toBe(false);

    // 2. Avançando o calendário até o dueAt → item "volta a ficar due".
    //    (isDueToday é a função que decide se o item aparece na fila de revisão.)
    vi.setSystemTime(new Date(`${tomorrow}T12:00:00.000Z`));
    const dueTomorrow = isDueToday(created, {
      nowFn: () => new Date(`${tomorrow}T12:00:00`),
    });
    expect(dueTomorrow).toBe(true);

    // 3. Estuda (advance) dando feedback 'hard' novamente: dueAt é reagendado para
    //    amanhã (relativo ao novo "hoje" = tomorrow), attempts permanece em 0
    //    (hard recua, clamp em 0), status continua OPEN. lastFeedback='hard'.
    const advanced = advancePendingItem(created, 'hard');

    expect(advanced).toMatchObject({
      status: 'open',
      dueAt: addDays(tomorrow, 1),
      lastFeedback: 'hard',
      attempts: 0,
    });
    // Após advance(hard) o item sai da fila due (dueAt virou depois de "hoje").
    expect(isDueToday(advanced, { nowFn: () => new Date(`${tomorrow}T12:00:00`) })).toBe(false);

    // 4. Volta a ficar due no dia seguinte ao novo dueAt (cadeia se repete).
    const dayAfter = addDays(tomorrow, 1);
    expect(isDueToday(advanced, { nowFn: () => new Date(`${dayAfter}T12:00:00`) })).toBe(true);
  });

  it('isDueToday ignora itens deferred: defer não é "due" (M-Hardening Task 5)', () => {
    // Documenta o comportamento REAL de defer: o item sai da lista open/due.
    // (O plano menciona "defer reagenda dueAt", mas o updatePendingItemStatus só
    // persiste status+updatedAt — sem auto-revive para open. Ver report.)
    const deferredItem = createItem({ status: 'deferred', dueAt: today });

    expect(isDueToday(deferredItem, { nowFn: () => new Date(`${today}T12:00:00`) })).toBe(false);
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
