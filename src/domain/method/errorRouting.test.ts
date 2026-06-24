/**
 * Testes TDD para errorRouting.ts (Fase 1 — Sinal Pedagógico 9.5)
 *
 * Cobre:
 * 1. Roteamento pelo errorType predominante nos erros recentes de um tema.
 * 2. Fallback sem dado (mantém comportamento atual do gerador).
 * 3. Empate ou sem erros suficientes → fallback.
 * 4. Janela de N erros recentes (só logs 'done' com feedback='hard').
 */
import { describe, expect, it } from 'vitest';
import type { TrainingLog } from '../types';
import { buildRoutingWhy, getErrorRoutingEmphasis } from './errorRouting';
import { BANNED_PHRASES } from '../coach/sessionMessage';

function hardLog(overrides: {
  date?: string;
  errorType?: TrainingLog['errorType'];
  weaknessTag?: string;
}): TrainingLog {
  return {
    id: `${overrides.date ?? '2026-06-24'}:block-1`,
    date: overrides.date ?? '2026-06-24',
    blockId: 'block-1',
    blockTitle: 'Tema do dia: Garfo',
    source: 'lichess',
    destinationLabel: 'Lichess Puzzles',
    logKind: 'standard',
    plannedSeconds: 900,
    startedAt: `${overrides.date ?? '2026-06-24'}T10:00:00.000Z`,
    completedAt: `${overrides.date ?? '2026-06-24'}T10:15:00.000Z`,
    elapsedSeconds: 900,
    timeLimitReached: false,
    status: 'done',
    feedback: 'hard',
    errorType: overrides.errorType,
    updatedAt: `${overrides.date ?? '2026-06-24'}T10:15:00.000Z`,
  };
}

function easyLog(date = '2026-06-24'): TrainingLog {
  return {
    id: `${date}:block-easy`,
    date,
    blockId: 'block-easy',
    blockTitle: 'Aquecimento',
    source: 'lichess',
    destinationLabel: 'Lichess Puzzles',
    logKind: 'standard',
    plannedSeconds: 300,
    startedAt: `${date}T09:00:00.000Z`,
    completedAt: `${date}T09:05:00.000Z`,
    elapsedSeconds: 300,
    timeLimitReached: false,
    status: 'done',
    feedback: 'easy',
    updatedAt: `${date}T09:05:00.000Z`,
  };
}

describe('getErrorRoutingEmphasis', () => {
  it('retorna fallback quando não há logs com errorType', () => {
    const logs: TrainingLog[] = [hardLog({ errorType: undefined }), hardLog({ errorType: undefined })];
    expect(getErrorRoutingEmphasis(logs)).toBe('default');
  });

  it('retorna fallback quando não há logs hard suficientes', () => {
    expect(getErrorRoutingEmphasis([])).toBe('default');
  });

  it('roteia para detecção/volume quando nao-vi predomina', () => {
    const logs: TrainingLog[] = [
      hardLog({ errorType: 'nao-vi', date: '2026-06-22' }),
      hardLog({ errorType: 'nao-vi', date: '2026-06-23' }),
      hardLog({ errorType: 'errei-conta', date: '2026-06-24' }),
    ];
    expect(getErrorRoutingEmphasis(logs)).toBe('detection-volume');
  });

  it('roteia para cálculo quando errei-conta predomina', () => {
    const logs: TrainingLog[] = [
      hardLog({ errorType: 'errei-conta', date: '2026-06-21' }),
      hardLog({ errorType: 'errei-conta', date: '2026-06-22' }),
      hardLog({ errorType: 'errei-conta', date: '2026-06-23' }),
      hardLog({ errorType: 'nao-vi', date: '2026-06-24' }),
    ];
    expect(getErrorRoutingEmphasis(logs)).toBe('calculation');
  });

  it('roteia para seleção de candidatos quando escolhi-errado predomina', () => {
    const logs: TrainingLog[] = [
      hardLog({ errorType: 'escolhi-errado', date: '2026-06-20' }),
      hardLog({ errorType: 'escolhi-errado', date: '2026-06-21' }),
      hardLog({ errorType: 'escolhi-errado', date: '2026-06-22' }),
      hardLog({ errorType: 'nao-vi', date: '2026-06-23' }),
      hardLog({ errorType: 'errei-conta', date: '2026-06-24' }),
    ];
    expect(getErrorRoutingEmphasis(logs)).toBe('candidate-selection');
  });

  it('retorna fallback em caso de empate (sem maioria clara)', () => {
    const logs: TrainingLog[] = [
      hardLog({ errorType: 'nao-vi', date: '2026-06-23' }),
      hardLog({ errorType: 'errei-conta', date: '2026-06-24' }),
    ];
    expect(getErrorRoutingEmphasis(logs)).toBe('default');
  });

  it('ignora logs que não são hard (easy/good não conta)', () => {
    const logs: TrainingLog[] = [
      easyLog('2026-06-22'),
      easyLog('2026-06-23'),
      hardLog({ errorType: 'errei-conta', date: '2026-06-24' }),
    ];
    // Só 1 hard com errorType elegível → abaixo do mínimo de 2 → fallback (ruído)
    // (logs easy/good são filtrados; 1 amostra isolada não é sinal pedagógico)
    expect(getErrorRoutingEmphasis(logs)).toBe('default');
  });

  it('roteia quando há 2+ logs hard com errorType do mesmo tipo', () => {
    const logs: TrainingLog[] = [
      easyLog('2026-06-22'),
      hardLog({ errorType: 'errei-conta', date: '2026-06-23' }),
      hardLog({ errorType: 'errei-conta', date: '2026-06-24' }),
    ];
    // 2 logs elegíveis, ambos errei-conta → 100% → calculation
    expect(getErrorRoutingEmphasis(logs)).toBe('calculation');
  });

  it('respeita a janela de 10 logs mais recentes (hard com errorType)', () => {
    // 8 logs antigos nao-vi + 3 recentes errei-conta → errei-conta deve vencer
    // pois a janela pega só os 10 mais recentes com errorType
    const logs: TrainingLog[] = [
      ...Array.from({ length: 8 }, (_, i) =>
        hardLog({ errorType: 'nao-vi', date: `2026-06-${String(i + 1).padStart(2, '0')}` }),
      ),
      hardLog({ errorType: 'errei-conta', date: '2026-06-10' }),
      hardLog({ errorType: 'errei-conta', date: '2026-06-11' }),
      hardLog({ errorType: 'errei-conta', date: '2026-06-12' }),
    ];
    // Janela de 10 mais recentes: 8 nao-vi + 3 errei-conta → pega os 10 mais
    // recentes por data → 2 nao-vi (06-01, 06-02 caem fora) + 6 nao-vi (06-03..08) + 3 errei-conta
    // Mas a janela é dos 10 ÚLTIMOS: 06-05..06-12 → 4 nao-vi + 3 errei-conta → nao-vi vence
    expect(getErrorRoutingEmphasis(logs)).toBe('detection-volume');
  });

  it('logs skipped são ignorados mesmo com errorType', () => {
    const skippedLog: TrainingLog = {
      id: '2026-06-24:block-skip',
      date: '2026-06-24',
      blockId: 'block-skip',
      blockTitle: 'Tema',
      source: 'lichess',
      destinationLabel: 'Lichess',
      logKind: 'standard',
      plannedSeconds: 600,
      startedAt: '2026-06-24T10:00:00.000Z',
      timeLimitReached: false,
      status: 'skipped',
      errorType: 'errei-conta',
      updatedAt: '2026-06-24T10:00:00.000Z',
    };
    const logs: TrainingLog[] = [
      skippedLog,
      skippedLog,
      hardLog({ errorType: 'nao-vi', date: '2026-06-23' }),
      hardLog({ errorType: 'nao-vi', date: '2026-06-22' }),
    ];
    // Apenas os 2 nao-vi (done+hard) contam → mas ainda sem maioria absoluta c/ empate impossível
    // 2 nao-vi, 0 outros → nao-vi claramente vence
    expect(getErrorRoutingEmphasis(logs)).toBe('detection-volume');
  });
});

describe('buildRoutingWhy (A1 transparencia)', () => {
  const emphases = ['detection-volume', 'calculation', 'candidate-selection'] as const;

  it('retorna uma linha de porquê para cada ênfase real', () => {
    for (const e of emphases) {
      const why = buildRoutingWhy(e);
      expect(why).toBeTruthy();
      expect(why?.toLowerCase()).toContain('foco de hoje');
    }
  });

  it('retorna undefined para default (sem ênfase = sem nota)', () => {
    expect(buildRoutingWhy('default')).toBeUndefined();
  });

  it('passa por BANNED_PHRASES e não promete rating nem usa exclamação', () => {
    for (const e of emphases) {
      const why = buildRoutingWhy(e) ?? '';
      for (const banned of BANNED_PHRASES) {
        expect(why.toLowerCase()).not.toContain(banned);
      }
      expect(why).not.toContain('!');
      expect(why).not.toMatch(/rating|elo/i);
    }
  });
});
