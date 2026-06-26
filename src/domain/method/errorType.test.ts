/**
 * Testes de modelo: TrainingLog aceita errorType e selfExplanation (campos opcionais).
 * Verifica round-trip de persistência (o campo existe no tipo e pode ser lido de volta).
 *
 * Também verifica que copy do seletor de errorType NÃO usa BANNED_PHRASES.
 */
import { describe, expect, it } from 'vitest';
import { BANNED_PHRASES } from '../coach/sessionMessage';
import type { TrainingLog } from '../types';
import {
  ERROR_TYPE_LABELS,
  getErrorRoutingCoach,
  SELF_EXPLANATION_PROMPT,
} from './errorRouting';

describe('TrainingLog — campos errorType e selfExplanation', () => {
  it('aceita errorType nao-vi no log', () => {
    const log: TrainingLog = {
      id: '2026-06-24:block-1',
      date: '2026-06-24',
      blockId: 'block-1',
      blockTitle: 'Tema do dia',
      source: 'lichess',
      destinationLabel: 'Lichess',
      logKind: 'standard',
      plannedSeconds: 600,
      startedAt: '2026-06-24T10:00:00.000Z',
      timeLimitReached: false,
      status: 'done',
      feedback: 'hard',
      errorType: 'nao-vi',
      updatedAt: '2026-06-24T10:15:00.000Z',
    };
    expect(log.errorType).toBe('nao-vi');
  });

  it('aceita errorType errei-conta no log', () => {
    const log: TrainingLog = {
      id: '2026-06-24:block-2',
      date: '2026-06-24',
      blockId: 'block-2',
      blockTitle: 'Tema do dia',
      source: 'lichess',
      destinationLabel: 'Lichess',
      logKind: 'standard',
      plannedSeconds: 600,
      startedAt: '2026-06-24T10:00:00.000Z',
      timeLimitReached: false,
      status: 'done',
      feedback: 'hard',
      errorType: 'errei-conta',
      updatedAt: '2026-06-24T10:15:00.000Z',
    };
    expect(log.errorType).toBe('errei-conta');
  });

  it('aceita errorType escolhi-errado no log', () => {
    const log: TrainingLog = {
      id: '2026-06-24:block-3',
      date: '2026-06-24',
      blockId: 'block-3',
      blockTitle: 'Tema do dia',
      source: 'lichess',
      destinationLabel: 'Lichess',
      logKind: 'standard',
      plannedSeconds: 600,
      startedAt: '2026-06-24T10:00:00.000Z',
      timeLimitReached: false,
      status: 'done',
      feedback: 'hard',
      errorType: 'escolhi-errado',
      updatedAt: '2026-06-24T10:15:00.000Z',
    };
    expect(log.errorType).toBe('escolhi-errado');
  });

  it('aceita selfExplanation no log', () => {
    const log: TrainingLog = {
      id: '2026-06-24:block-4',
      date: '2026-06-24',
      blockId: 'block-4',
      blockTitle: 'Tema do dia',
      source: 'lichess',
      destinationLabel: 'Lichess',
      logKind: 'standard',
      plannedSeconds: 600,
      startedAt: '2026-06-24T10:00:00.000Z',
      timeLimitReached: false,
      status: 'done',
      feedback: 'hard',
      selfExplanation: 'Errei porque não vi a torre desprotegida antes de calcular.',
      updatedAt: '2026-06-24T10:15:00.000Z',
    };
    expect(log.selfExplanation).toContain('torre');
  });

  it('aceita log sem errorType e sem selfExplanation (campos opcionais)', () => {
    const log: TrainingLog = {
      id: '2026-06-24:block-5',
      date: '2026-06-24',
      blockId: 'block-5',
      blockTitle: 'Tema do dia',
      source: 'lichess',
      destinationLabel: 'Lichess',
      logKind: 'standard',
      plannedSeconds: 600,
      startedAt: '2026-06-24T10:00:00.000Z',
      timeLimitReached: false,
      status: 'done',
      updatedAt: '2026-06-24T10:15:00.000Z',
    };
    expect(log.errorType).toBeUndefined();
    expect(log.selfExplanation).toBeUndefined();
  });
});

describe('ERROR_TYPE_LABELS — copy passa BANNED_PHRASES', () => {
  it('nenhum label de errorType usa frases proibidas', () => {
    for (const label of Object.values(ERROR_TYPE_LABELS)) {
      for (const banned of BANNED_PHRASES) {
        expect(label.toLowerCase()).not.toContain(banned);
      }
    }
  });

  it('prompt de seleção "O que falhou?" não usa frases proibidas', () => {
    for (const banned of BANNED_PHRASES) {
      expect(SELF_EXPLANATION_PROMPT.toLowerCase()).not.toContain(banned);
    }
  });

  it('labels cobrem os 3 tipos de erro', () => {
    expect(ERROR_TYPE_LABELS['nao-vi']).toBeTruthy();
    expect(ERROR_TYPE_LABELS['errei-conta']).toBeTruthy();
    expect(ERROR_TYPE_LABELS['escolhi-errado']).toBeTruthy();
  });
});

describe('getErrorRoutingCoach — copy passa BANNED_PHRASES (tom Professor Tavarez)', () => {
  // Toda string que vira UI (coachNote/guidingQuestion do bloco tema) deve
  // respeitar a banlist — sem 'parabéns', 'gênio', 'você falhou', etc.
  const allEmphases = ['detection-volume', 'calculation', 'candidate-selection'] as const;

  it('nenhuma coachNote/guidingQuestion usa frases proibidas', () => {
    for (const emphasis of allEmphases) {
      const coach = getErrorRoutingCoach(emphasis);
      if (coach === undefined) {
        throw new Error(`Esperava coach para ênfase ${emphasis}`);
      }
      for (const banned of BANNED_PHRASES) {
        expect(coach.coachNote.toLowerCase()).not.toContain(banned);
        expect(coach.guidingQuestion.toLowerCase()).not.toContain(banned);
      }
    }
  });

  it('default retorna undefined (gerador usa sua copy usual — sem regressão)', () => {
    expect(getErrorRoutingCoach('default')).toBeUndefined();
  });
});
