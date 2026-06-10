import type { Consistency, DailyPlan, PuzzleThemeStats, SessionMinutes, TrainingLog } from '../types';
import { formatElapsedMinutes } from '../training/trainingSession';

// Relatorio pos-sessao (Corte 4): maquina de regras deterministica, sem LLM.
// Trava de evidencia: sem sinal real por tema, o tutor pergunta — nunca inventa causa.

export type WeeklyDigest = {
  heading: string;
  metrics: string[];
  lines: string[];
};

const MS_PER_DAY = 86_400_000;

function dayIndex(date: string): number {
  const [year, month, day] = date.split('-').map(Number);

  if (year === undefined || month === undefined || day === undefined) {
    return 0;
  }

  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

export function buildWeeklyDigest(allLogs: TrainingLog[], today: string, days = 7): WeeklyDigest | undefined {
  const cutoff = dayIndex(today) - (days - 1);
  const recentDone = allLogs.filter((log) => log.status === 'done' && dayIndex(log.date) >= cutoff);

  if (recentDone.length === 0) {
    return undefined;
  }

  const sessionDays = new Set(recentDone.map((log) => log.date)).size;
  const elapsedSeconds = recentDone.reduce((sum, log) => sum + (log.elapsedSeconds ?? 0), 0);
  const puzzleTotals = recentDone.reduce(
    (acc, log) => {
      if (log.result === undefined) {
        return acc;
      }

      return {
        puzzles: acc.puzzles + log.result.puzzles,
        wins: acc.wins + log.result.wins,
        losses: acc.losses + log.result.losses,
      };
    },
    { puzzles: 0, wins: 0, losses: 0 },
  );

  const periodLabel = days <= 7 ? 'últimos 7 dias' : `últimos ${String(days)} dias`;
  const metrics = [
    `${String(sessionDays)} ${sessionDays === 1 ? 'dia' : 'dias'} de treino`,
    `${String(recentDone.length)} ${recentDone.length === 1 ? 'bloco' : 'blocos'}`,
    formatElapsedMinutes(elapsedSeconds),
  ];

  const lines: string[] = [];

  if (puzzleTotals.puzzles > 0) {
    lines.push(
      `Puzzles no período: ${String(puzzleTotals.wins)} certos e ${String(puzzleTotals.losses)} errados em ${String(puzzleTotals.puzzles)} tentativas.`,
    );
  }

  return {
    heading: `Sua semana (${periodLabel})`,
    metrics,
    lines,
  };
}

// O "porquê" do próximo passo, por regra observável — nunca causa inventada.
export function buildNextStepExplanations(plan: DailyPlan, themeStats?: PuzzleThemeStats): string[] {
  const explanations: string[] = [];
  const seenTitles = new Set<string>();

  for (const block of plan.blocks) {
    if (block.feedback === undefined || seenTitles.has(block.title)) {
      continue;
    }

    seenTitles.add(block.title);

    if (block.feedback === 'hard') {
      explanations.push(
        `Você marcou "${block.title}" como difícil: na próxima sessão voltamos um passo nesse tema, com explicação antes do treino.`,
      );
    } else if (block.feedback === 'easy' && block.resourceStage === 'explain') {
      explanations.push(
        `"${block.title}" foi fácil: o próximo passo é praticar o tema em puzzles variados, sem repetir a explicação.`,
      );
    }
  }

  const hasRealThemeData = themeStats !== undefined && themeStats.themes.some((theme) => theme.attempts > 0);

  if (explanations.length === 0 && !hasRealThemeData) {
    explanations.push(
      'Ainda não tenho sinal claro desta sessão. Como foi o treino para você? Marcar fácil/bom/difícil nos blocos me ajuda a calibrar o próximo plano.',
    );
  }

  return explanations;
}

// Recalibracao de retorno (achado TDAH do DeepSeek): depois de ausencia longa,
// o plano volta menor — recomeçar pequeno protege o retorno.
const LONG_GAP_DAYS = 7;

export function getReturnSessionMinutes(
  consistency: Pick<Consistency, 'daysSinceLastSession'>,
  defaultMinutes: SessionMinutes,
): SessionMinutes {
  if (consistency.daysSinceLastSession >= LONG_GAP_DAYS && defaultMinutes > 15) {
    return 15;
  }

  return defaultMinutes;
}

export function buildReturnRecalibrationNote(daysSinceLastSession: number): string | undefined {
  if (daysSinceLastSession < LONG_GAP_DAYS) {
    return undefined;
  }

  return `Você ficou ${String(daysSinceLastSession)} dias fora — normal, a vida acontece. Preparei uma sessão mais curta para recomeçar leve; quando quiser, aumente o tempo.`;
}
