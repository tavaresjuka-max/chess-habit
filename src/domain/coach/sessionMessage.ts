import type { CoachMessage, Consistency, PlanBlockFeedback, TrainingResult, Weakness } from '../types';

export type SessionContext = {
  phase: 'pre' | 'post';
  consistency: Consistency;
  primaryWeakness?: Weakness;
  lastFeedback?: PlanBlockFeedback;
  puzzleResult?: TrainingResult;
};

// Lista da banlist do docs/pedagogy/professor-lemos.md, em minúsculas.
export const BANNED_PHRASES = ['você falhou', 'sumiu', 'gênio', 'talento', 'missão épica', 'parabéns'];

const MAINTENANCE_REASON = 'Hoje o treino é de manutenção: visão e segurança de peças.';

function reasonLine(weakness: Weakness | undefined): string {
  return weakness?.evidence ?? MAINTENANCE_REASON;
}

function streakLines(consistency: Consistency): string[] {
  if (consistency.currentStreakDays >= 2) {
    return [`${String(consistency.currentStreakDays)} dias seguidos. Isso já é rotina.`];
  }
  return [];
}

function buildWelcome(context: SessionContext): CoachMessage {
  return {
    phase: 'welcome',
    lines: [
      'Bom treino. Comece observando o tabuleiro inteiro antes do primeiro lance.',
      reasonLine(context.primaryWeakness),
      ...streakLines(context.consistency),
    ],
  };
}

function buildReturn(context: SessionContext): CoachMessage {
  return {
    phase: 'return',
    lines: ['Sem cobrança. O tabuleiro espera.', reasonLine(context.primaryWeakness)],
  };
}

const closeByFeedback: Record<PlanBlockFeedback, string> = {
  easy: 'Fácil hoje. Da próxima a gente sobe um pouco a dificuldade.',
  good: 'Bom treino. Vale consolidar o padrão com uma variação.',
  hard: 'Hoje pesou. Vamos reduzir a carga e voltar à explicação.',
};

function puzzleLines(result: TrainingResult | undefined): string[] {
  if (result === undefined || result.kind !== 'puzzle-activity') {
    return [];
  }
  return [`Nos puzzles: ${String(result.wins)} certos, ${String(result.losses)} errados.`];
}

function buildClose(context: SessionContext): CoachMessage {
  const base = context.lastFeedback === undefined ? 'Treino registrado.' : closeByFeedback[context.lastFeedback];
  return {
    phase: 'close',
    lines: [base, ...puzzleLines(context.puzzleResult)],
  };
}

export function buildSessionMessage(context: SessionContext): CoachMessage {
  if (context.phase === 'pre') {
    return context.consistency.returnedAfterGap ? buildReturn(context) : buildWelcome(context);
  }
  return buildClose(context);
}
