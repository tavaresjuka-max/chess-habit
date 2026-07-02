import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AutopsyError } from '../autopsy/autopsyReport';
import type { MethodTrackId, PendingTrainingItem } from './types';
import {
  advancePendingItem,
  buildAutopsyPendingItems,
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

  it('no teto entra na retenção (resgate cego), e gradua só ao reter (gate de retenção)', () => {
    const first = createItem({ attempts: 0 });
    const second = advancePendingItem(first);
    const third = advancePendingItem(second);
    const fourth = advancePendingItem(third);
    const fifth = advancePendingItem(fourth);

    // No teto NÃO gradua direto: agenda o resgate cego de longo prazo.
    expect(fifth).toMatchObject({ attempts: 4, status: 'open', retentionPending: true });

    // Resgate bem-sucedido (sem 'hard') após o intervalo longo → gradua de verdade.
    const graduated = advancePendingItem(fifth, 'good');
    expect(graduated).toMatchObject({ status: 'done', retentionPending: false });
  });

  it('resgate de retenção falho (hard) reaprende em vez de graduar', () => {
    const inRetention = createItem({ attempts: 4, retentionPending: true });
    const failed = advancePendingItem(inRetention, 'hard');

    expect(failed).toMatchObject({ status: 'open', retentionPending: false, lastFeedback: 'hard' });
    expect(failed.attempts).toBeLessThan(4);
  });

  it('SM-2: easeFactor sobe com good/easy e desce com hard (clamp 1.3–2.8)', () => {
    const base = createItem({ attempts: 1 });
    expect(advancePendingItem(base, 'good').easeFactor).toBeGreaterThan(2.5);
    expect(advancePendingItem(base, 'hard').easeFactor).toBeLessThan(2.5);
    expect(advancePendingItem(createItem({ attempts: 1, easeFactor: 1.3 }), 'hard').easeFactor).toBe(1.3);
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

    expect(advanced).toMatchObject({ attempts: 4, status: 'open', retentionPending: true });
  });

  it('gradua por volume com pouca amostra do tema (válvula: dados ralos não travam)', () => {
    const advanced = advancePendingItem(createItem({ attempts: 3 }), 'good', undefined, {
      accuracyPercent: 40,
      attempts: 5,
    });

    expect(advanced).toMatchObject({ attempts: 4, status: 'open', retentionPending: true });
  });

  it('gradua por volume quando não há medição cumulativa do tema', () => {
    const advanced = advancePendingItem(createItem({ attempts: 3 }), 'good', undefined, undefined);

    expect(advanced).toMatchObject({ attempts: 4, status: 'open', retentionPending: true });
  });

  it('válvula de escape: após 2 ciclos bloqueado no teto, forma assim mesmo', () => {
    const blocked = { accuracyPercent: 50, attempts: 12 };

    const first = advancePendingItem(createItem({ attempts: 3 }), 'good', undefined, blocked);
    expect(first).toMatchObject({ attempts: 4, status: 'open', gateBlockedCount: 1 });

    const second = advancePendingItem(first, 'good', undefined, blocked);
    expect(second).toMatchObject({ attempts: 4, status: 'open', retentionPending: true, gateBlockedCount: 2 });
  });

  it('zera o contador de escape quando o item não está bloqueado no teto', () => {
    const recovered = advancePendingItem(createItem({ attempts: 3, gateBlockedCount: 1 }), 'good', undefined, {
      accuracyPercent: 90,
      attempts: 12,
    });

    expect(recovered).toMatchObject({ attempts: 4, status: 'open', retentionPending: true, gateBlockedCount: 0 });
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

    expect(twice).toMatchObject({ attempts: 4, status: 'open', retentionPending: true });
  });

  it('usa mastery advance para graduar em menos repetições que o feedback sozinho', () => {
    const item = createItem({ attempts: 2 });

    expect(advancePendingItem(item, 'good')).toMatchObject({ attempts: 3, status: 'open' });
    expect(advancePendingItem(item, 'good', 'advance')).toMatchObject({ attempts: 4, status: 'open', retentionPending: true });
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

describe('advancePendingItem — gate por dificuldade observada (Pilar B, council 2026-06-24)', () => {
  const studyUrl = 'https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p';
  // 10 tentativas, 7 perdas = solve-rate 0.30 < 0.40 => too-hard (amostra suficiente).
  const tooHard = { attempts: 10, losses: 7 };
  // 10 tentativas, 4 perdas = 0.60 => fit. 2 tentativas = insufficient.
  const fit = { attempts: 10, losses: 4 };
  const insufficient = { attempts: 2, losses: 2 };

  it('too-hard + tem Study curada → roteia pra Study (recua nível, reexpõe amanhã), NÃO gradua', () => {
    const advanced = advancePendingItem(createItem({ attempts: 2 }), 'good', undefined, undefined, {
      recentObserved: tooHard,
      hasCuratedStudy: true,
      studyUrl,
    });

    expect(advanced).toMatchObject({ status: 'open', lichessUrl: studyUrl, retentionPending: false });
    expect(advanced.attempts).toBeLessThan(2);
    expect(advanced.dueAt).toBe(tomorrow);
  });

  it('too-hard + sem Study → adia com nota honesta (status deferred + deferReason)', () => {
    const advanced = advancePendingItem(createItem({ attempts: 2 }), 'good', undefined, undefined, {
      recentObserved: tooHard,
      hasCuratedStudy: false,
    });

    expect(advanced.status).toBe('deferred');
    expect(advanced.deferReason).toMatch(/difíceis demais/i);
  });

  it('too-hard VENCE o autorrelato "good" no teto: não forma (fecha o sinal cego)', () => {
    const goodMastery = { accuracyPercent: 95, attempts: 20 };
    const advanced = advancePendingItem(createItem({ attempts: 4 }), 'good', undefined, goodMastery, {
      recentObserved: tooHard,
      hasCuratedStudy: true,
      studyUrl,
    });

    expect(advanced.status).not.toBe('done');
    expect(advanced.retentionPending).not.toBe(true);
    expect(advanced.lichessUrl).toBe(studyUrl);
  });

  it('too-hard observado também reprova o resgate de retenção (não vira done)', () => {
    const inRetention = createItem({ attempts: 4, retentionPending: true });
    const advanced = advancePendingItem(inRetention, 'good', undefined, undefined, {
      recentObserved: tooHard,
      hasCuratedStudy: false,
    });

    expect(advanced.status).toBe('open');
    expect(advanced.retentionPending).toBe(false);
  });

  it('fit observado não atrapalha: graduação normal segue (teto → retenção)', () => {
    const advanced = advancePendingItem(createItem({ attempts: 3 }), 'good', undefined, undefined, {
      recentObserved: fit,
      hasCuratedStudy: true,
      studyUrl,
    });

    expect(advanced).toMatchObject({ attempts: 4, status: 'open', retentionPending: true });
  });

  it('amostra insuficiente (cold-start) não adia: segue rota normal', () => {
    const advanced = advancePendingItem(createItem({ attempts: 3 }), 'good', undefined, undefined, {
      recentObserved: insufficient,
      hasCuratedStudy: false,
    });

    expect(advanced).toMatchObject({ attempts: 4, status: 'open', retentionPending: true });
  });

  it('retrocompat: sem routing, comportamento idêntico ao atual', () => {
    const withoutRouting = advancePendingItem(createItem({ attempts: 3 }), 'good');
    const withEmptyRouting = advancePendingItem(createItem({ attempts: 3 }), 'good', undefined, undefined, {});

    expect(withEmptyRouting).toMatchObject({
      attempts: withoutRouting.attempts,
      status: withoutRouting.status,
      retentionPending: withoutRouting.retentionPending,
    });
  });
});

describe('buildAutopsyPendingItems (GRUPO A2, 2026-07-02)', () => {
  const blunder: AutopsyError = {
    ply: 5,
    moveNumber: 3,
    side: 'white',
    sanPlayed: 'd4',
    fenBefore: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3',
    bestSan: 'Nc3',
    severity: 'blunder',
    lichessUrl: 'https://lichess.org/abcd1234/white#5',
  };
  const mistake: AutopsyError = {
    ply: 11,
    moveNumber: 6,
    side: 'white',
    sanPlayed: 'Bxf7+',
    fenBefore: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 4',
    severity: 'mistake',
    lichessUrl: 'https://lichess.org/abcd1234/white#11',
  };

  it('converte erros em pending items na mesma escada SM-2 (dueAt amanhã, attempts 0, pending-review)', () => {
    const items = buildAutopsyPendingItems([blunder], 'abcd1234', []);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      origin: 'game-review',
      source: 'autopsy',
      methodTrackId: 'pending-review',
      weaknessTag: 'blunder-rate',
      status: 'open',
      attempts: 0,
      dueAt: tomorrow,
      gameId: 'abcd1234',
      ply: 5,
      sanPlayed: 'd4',
      bestSan: 'Nc3',
      fen: blunder.fenBefore,
      lichessUrl: 'https://lichess.org/abcd1234/white#5',
      prompt: 'Antes de ver a resposta: o que você jogaria aqui?',
    });
  });

  it('omite bestSan quando o erro não trouxe (sem inventar dado)', () => {
    const items = buildAutopsyPendingItems([mistake], 'abcd1234', []);

    expect(items[0]?.bestSan).toBeUndefined();
  });

  it('cria um item por erro, preservando a ordem', () => {
    const items = buildAutopsyPendingItems([blunder, mistake], 'abcd1234', []);

    expect(items).toHaveLength(2);
    expect(items.map((item) => item.ply)).toEqual([5, 11]);
  });

  it('dedup por gameId+ply: reinjetar a mesma partida não duplica', () => {
    const firstBatch = buildAutopsyPendingItems([blunder, mistake], 'abcd1234', []);
    const secondBatch = buildAutopsyPendingItems([blunder, mistake], 'abcd1234', firstBatch);

    expect(secondBatch).toHaveLength(0);
  });

  it('dedup respeita status (done/deferred também contam — já foi tratado, não reinjeta)', () => {
    const [generatedItem] = buildAutopsyPendingItems([blunder], 'abcd1234', []);
    expect(generatedItem).toBeDefined();
    if (generatedItem === undefined) {
      return;
    }

    const doneItem = { ...generatedItem, status: 'done' as const };
    const secondBatch = buildAutopsyPendingItems([blunder], 'abcd1234', [doneItem]);

    expect(secondBatch).toHaveLength(0);
  });

  it('dedup é por gameId+ply: mesmo ply de OUTRA partida não conflita', () => {
    const firstGameItems = buildAutopsyPendingItems([blunder], 'abcd1234', []);
    const secondGameItems = buildAutopsyPendingItems([blunder], 'wxyz9999', firstGameItems);

    expect(secondGameItems).toHaveLength(1);
    expect(secondGameItems[0]?.gameId).toBe('wxyz9999');
  });

  it('não deduplica contra pending items de OUTRA origem (puzzle) mesmo com gameId coincidente por acaso', () => {
    const puzzleItem = createItem({ id: 'pending-puzzle-1' });
    const items = buildAutopsyPendingItems([blunder], 'abcd1234', [puzzleItem]);

    expect(items).toHaveLength(1);
  });

  it('itens gerados entram na fila due e avançam pelo advancePendingItem normal (zero fork)', () => {
    const [item] = buildAutopsyPendingItems([blunder], 'abcd1234', []);
    expect(item).toBeDefined();
    if (item === undefined) {
      return;
    }

    expect(isDueToday({ ...item, dueAt: today })).toBe(true);

    const advanced = advancePendingItem({ ...item, dueAt: today }, 'good');
    expect(advanced.attempts).toBe(1);
    expect(advanced.source).toBe('autopsy');
    expect(advanced.gameId).toBe('abcd1234');
  });

  it('lista vazia de erros não gera itens', () => {
    expect(buildAutopsyPendingItems([], 'abcd1234', [])).toEqual([]);
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
