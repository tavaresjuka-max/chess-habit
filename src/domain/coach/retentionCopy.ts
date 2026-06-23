/**
 * Cópias de retenção — tom Professor Lemos.
 * SEM 'parabéns', sem confete, sem ícone festivo, sem cor de alarme.
 * Constatação calma, não celebração.
 */

type StreakInfo = {
  currentStreakDays: number;
  longestStreakDays: number;
};

/**
 * Emite UMA linha sóbria de marco quando o aluno bate o recorde de sequência.
 * Retorna undefined em dia normal (sem marco, sem texto).
 *
 * Condição: currentStreakDays === longestStreakDays && currentStreakDays >= 3.
 */
export function buildMilestoneLine(streak: StreakInfo): string | undefined {
  if (streak.currentStreakDays < 3) {
    return undefined;
  }
  if (streak.currentStreakDays !== streak.longestStreakDays) {
    return undefined;
  }
  return 'Esta é a sua sequência mais longa até aqui.';
}

type FooterInput = {
  todayMinutes: number;
  weekSessions: number;
};

/**
 * Rodapé factual: "Hoje: X min · Esta semana: N sessões."
 * Puro fato, sem juízo, sem exclamação.
 */
export function buildFactualFooter({ todayMinutes, weekSessions }: FooterInput): string {
  const sessionWord = weekSessions === 1 ? 'sessão' : 'sessões';
  return `Hoje: ${String(todayMinutes)} min · Esta semana: ${String(weekSessions)} ${sessionWord}.`;
}
