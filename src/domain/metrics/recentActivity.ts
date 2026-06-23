import type { TrainingLog } from '../types';

export type RecentActivity = {
  /** Minutos treinados hoje (soma de elapsedSeconds dos logs 'done' de hoje, arredondado). */
  todayMinutes: number;
  /** Nº de DIAS distintos com sessão 'done' nos últimos 7 dias (inclusive hoje). */
  weekSessions: number;
  /** Janela de windowDays dias (inclusive hoje), em ordem cronológica. */
  recentDays: { date: string; active: boolean }[];
};

/**
 * Deriva a faixa de acumulação a partir dos logs existentes — sem nova tabela.
 *
 * @param logs       Todos os TrainingLog disponíveis.
 * @param today      Data de hoje no formato 'YYYY-MM-DD' (fuso local, igual a consistency.ts).
 * @param windowDays Tamanho da janela (padrão 14). Os últimos windowDays dias, inclusive hoje.
 */
export function computeRecentActivity(
  logs: TrainingLog[],
  today: string,
  windowDays = 14,
): RecentActivity {
  // Conjunto de datas com pelo menos um log 'done'.
  const doneDates = new Set(logs.filter((log) => log.status === 'done').map((log) => log.date));

  // Gera a janela de datas em ordem cronológica usando aritmética de string de data local.
  // Usamos Date com hora fixa ao meio-dia (igual a formatFriendlyDate em Today.tsx) para
  // evitar ambiguidade de fuso sem depender de UTC.
  const todayDate = new Date(`${today}T12:00:00`);
  const recentDays: { date: string; active: boolean }[] = [];

  for (let offset = windowDays - 1; offset >= 0; offset--) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() - offset);
    const dateStr = formatLocalDate(d);
    recentDays.push({ date: dateStr, active: doneDates.has(dateStr) });
  }

  // weekSessions: dias distintos com treino nos últimos 7 dias (inclusive hoje).
  const weekCutoff = new Date(todayDate);
  weekCutoff.setDate(todayDate.getDate() - 6); // hoje - 6 = início dos últimos 7 dias
  const weekCutoffStr = formatLocalDate(weekCutoff);

  const weekDoneDates = new Set(
    logs
      .filter((log) => log.status === 'done' && log.date >= weekCutoffStr && log.date <= today)
      .map((log) => log.date),
  );
  const weekSessions = weekDoneDates.size;

  // todayMinutes: soma dos elapsedSeconds dos logs 'done' de hoje, arredondada.
  const todayElapsedSeconds = logs
    .filter((log) => log.status === 'done' && log.date === today)
    .reduce((sum, log) => sum + (log.elapsedSeconds ?? 0), 0);
  const todayMinutes = Math.round(todayElapsedSeconds / 60);

  return { todayMinutes, weekSessions, recentDays };
}

/** Formata um objeto Date como 'YYYY-MM-DD' usando o fuso local (sem UTC). */
function formatLocalDate(d: Date): string {
  const year = String(d.getFullYear());
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
