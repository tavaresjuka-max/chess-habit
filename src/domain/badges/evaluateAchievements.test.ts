import { describe, expect, it } from 'vitest';
import type { TrainingLog } from '../types';
import type { PendingTrainingItem } from '../method/types';
import {
  ACHIEVEMENT_DEFINITIONS,
  evaluateAchievements,
  getAchievementDefinition,
  type Achievement,
} from './evaluateAchievements';

const NOW = '2026-06-12T12:00:00.000Z';

function makeLog(overrides: Partial<TrainingLog> & { date: string }): TrainingLog {
  return {
    id: `${overrides.date}:bloco`,
    blockId: 'bloco',
    blockTitle: 'Puzzles do tema',
    source: 'lichess',
    destinationLabel: 'Puzzles',
    plannedSeconds: 900,
    startedAt: `${overrides.date}T10:00:00.000Z`,
    completedAt: `${overrides.date}T10:15:00.000Z`,
    elapsedSeconds: 900,
    timeLimitReached: false,
    status: 'done',
    updatedAt: `${overrides.date}T10:15:00.000Z`,
    ...overrides,
  };
}

function makePendingDone(index: number, overrides: Partial<PendingTrainingItem> = {}): PendingTrainingItem {
  return {
    id: `pendencia-${String(index)}`,
    origin: 'puzzle',
    title: 'Revisão de garfos',
    weaknessTag: 'fork',
    methodTrackId: 'pending-review',
    prompt: 'Reveja o padrão antes de jogar.',
    dueAt: '2026-06-10',
    attempts: 4,
    lastFeedback: 'good',
    status: 'done',
    createdAt: '2026-05-01T10:00:00.000Z',
    updatedAt: '2026-06-10T10:00:00.000Z',
    ...overrides,
  };
}

function evaluate(
  logs: TrainingLog[],
  donePendingItems: PendingTrainingItem[] = [],
  unlocked: Achievement[] = [],
): Achievement[] {
  return evaluateAchievements({ logs, donePendingItems, unlocked, now: NOW });
}

function ids(achievements: Achievement[]): string[] {
  return achievements.map((achievement) => achievement.id);
}

describe('evaluateAchievements', () => {
  it('não desbloqueia nada sem dados', () => {
    expect(evaluate([])).toEqual([]);
  });

  it('marca unlockedAt com o instante da avaliação', () => {
    const logs = [
      makeLog({ date: '2026-06-01' }),
      makeLog({ date: '2026-06-10', id: '2026-06-10:bloco' }),
    ];

    const [achievement] = evaluate(logs);

    expect(achievement?.unlockedAt).toBe(NOW);
  });

  it('não repete conquista já desbloqueada', () => {
    const logs = [
      makeLog({ date: '2026-06-01' }),
      makeLog({ date: '2026-06-10', id: '2026-06-10:bloco' }),
    ];
    const unlocked: Achievement[] = [{ id: 'retorno-de-ouro', unlockedAt: '2026-06-10T09:00:00.000Z' }];

    expect(ids(evaluate(logs, [], unlocked))).not.toContain('retorno-de-ouro');
  });

  describe('retorno-de-ouro', () => {
    it('desbloqueia com gap de 7+ dias entre treinos concluídos', () => {
      const logs = [
        makeLog({ date: '2026-06-01' }),
        makeLog({ date: '2026-06-08', id: '2026-06-08:bloco' }),
      ];

      expect(ids(evaluate(logs))).toContain('retorno-de-ouro');
    });

    it('não desbloqueia com gap de 6 dias', () => {
      const logs = [
        makeLog({ date: '2026-06-01' }),
        makeLog({ date: '2026-06-07', id: '2026-06-07:bloco' }),
      ];

      expect(ids(evaluate(logs))).not.toContain('retorno-de-ouro');
    });

    it('exige sessão de retorno concluída, não só aberta', () => {
      const logs = [
        makeLog({ date: '2026-06-01' }),
        makeLog({ date: '2026-06-10', id: '2026-06-10:bloco', status: 'active' }),
      ];

      expect(ids(evaluate(logs))).not.toContain('retorno-de-ouro');
    });
  });

  describe('primeira-hora', () => {
    it('desbloqueia com 60 min reais em 3 dias distintos', () => {
      const logs = [
        makeLog({ date: '2026-06-01', elapsedSeconds: 1_200 }),
        makeLog({ date: '2026-06-02', id: 'b', elapsedSeconds: 1_200 }),
        makeLog({ date: '2026-06-03', id: 'c', elapsedSeconds: 1_200 }),
      ];

      expect(ids(evaluate(logs))).toContain('primeira-hora');
    });

    it('não desbloqueia com 1 maratona de 60 min em um dia só', () => {
      const logs = [makeLog({ date: '2026-06-01', elapsedSeconds: 3_600 })];

      expect(ids(evaluate(logs))).not.toContain('primeira-hora');
    });

    it('não desbloqueia com 3 dias mas menos de 60 min', () => {
      const logs = [
        makeLog({ date: '2026-06-01', elapsedSeconds: 600 }),
        makeLog({ date: '2026-06-02', id: 'b', elapsedSeconds: 600 }),
        makeLog({ date: '2026-06-03', id: 'c', elapsedSeconds: 600 }),
      ];

      expect(ids(evaluate(logs))).not.toContain('primeira-hora');
    });
  });

  describe('tratador-de-pendencias', () => {
    it('desbloqueia com 10 pendências fechadas após 4 revisões e final tranquilo', () => {
      const items = Array.from({ length: 10 }, (_, index) => makePendingDone(index));

      expect(ids(evaluate([], items))).toContain('tratador-de-pendencias');
    });

    it('não conta pendência fechada com menos de 4 revisões', () => {
      const items = Array.from({ length: 10 }, (_, index) => makePendingDone(index, { attempts: 3 }));

      expect(ids(evaluate([], items))).not.toContain('tratador-de-pendencias');
    });

    it('não conta pendência com última revisão difícil', () => {
      const items = Array.from({ length: 10 }, (_, index) => makePendingDone(index, { lastFeedback: 'hard' }));

      expect(ids(evaluate([], items))).not.toContain('tratador-de-pendencias');
    });

    it('não desbloqueia com 9 pendências qualificadas', () => {
      const items = Array.from({ length: 9 }, (_, index) => makePendingDone(index));

      expect(ids(evaluate([], items))).not.toContain('tratador-de-pendencias');
    });
  });

  describe('semana-inteira', () => {
    it('desbloqueia com 5 dias concluídos na mesma semana (segunda a domingo)', () => {
      // 2026-06-08 é segunda-feira.
      const logs = ['2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12'].map((date) =>
        makeLog({ date, id: `${date}:bloco` }),
      );

      expect(ids(evaluate(logs))).toContain('semana-inteira');
    });

    it('não desbloqueia com 5 dias espalhados por duas semanas', () => {
      // Sexta a terça cruza o domingo: 3 dias numa semana, 2 na outra.
      const logs = ['2026-06-05', '2026-06-06', '2026-06-07', '2026-06-08', '2026-06-09'].map((date) =>
        makeLog({ date, id: `${date}:bloco` }),
      );

      expect(ids(evaluate(logs))).not.toContain('semana-inteira');
    });

    it('não desbloqueia com 4 dias na mesma semana', () => {
      const logs = ['2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11'].map((date) =>
        makeLog({ date, id: `${date}:bloco` }),
      );

      expect(ids(evaluate(logs))).not.toContain('semana-inteira');
    });
  });
});

describe('definições das conquistas', () => {
  it('toda conquista tem título, descrição e linha de relatório sóbrios', () => {
    for (const definition of ACHIEVEMENT_DEFINITIONS) {
      expect(definition.title.length).toBeGreaterThan(0);
      expect(definition.description.length).toBeGreaterThan(0);
      expect(definition.reportLine.length).toBeGreaterThan(0);
    }
  });

  it('nenhum texto usa a banlist do Professor Lemos', () => {
    const banned = ['você falhou', 'sumiu', 'gênio', 'talento', 'missão épica', 'parabéns'];

    for (const definition of ACHIEVEMENT_DEFINITIONS) {
      const fullText = `${definition.title} ${definition.description} ${definition.reportLine}`.toLowerCase();

      for (const phrase of banned) {
        expect(fullText).not.toContain(phrase);
      }
    }
  });

  it('getAchievementDefinition resolve todos os ids', () => {
    for (const definition of ACHIEVEMENT_DEFINITIONS) {
      expect(getAchievementDefinition(definition.id).title).toBe(definition.title);
    }
  });
});
