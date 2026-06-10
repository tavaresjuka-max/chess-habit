import { getMethodTrackTitle } from '../method/methodTracks';
import type { TrainingLog } from '../types';

// Painel Progresso MVP (Corte 5): visao por dados reais locais, sem promessa
// de rating. Tres blocos: habilidades por tema, esforco por trilha, tendencia.

export type SkillMapEntry = {
  theme: string;
  attempts: number;
  wins: number;
  accuracyPercent: number;
};

export type TrackEffortEntry = {
  trackId: string;
  title: string;
  minutes: number;
  blocks: number;
};

export type ProgressTrend = {
  thisWeekMinutes: number;
  previousWeekMinutes: number;
  line: string;
};

const MS_PER_DAY = 86_400_000;

function dayIndex(date: string): number {
  const [year, month, day] = date.split('-').map(Number);

  if (year === undefined || month === undefined || day === undefined) {
    return 0;
  }

  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

export function buildSkillMap(allLogs: TrainingLog[]): SkillMapEntry[] {
  const byTheme = new Map<string, { attempts: number; wins: number }>();

  // O dashboard de 30 dias e a fonte mais completa e ja cobre os puzzles dos
  // blocos no periodo; usar dashboard + atividade somaria o mesmo puzzle duas
  // vezes. Regra: dashboard mais recente quando existir, senao atividade real.
  const latestDashboard = allLogs
    .map((log) => log.result)
    .filter(
      (result): result is Extract<NonNullable<TrainingLog['result']>, { kind: 'puzzle-dashboard' }> =>
        result?.kind === 'puzzle-dashboard',
    )
    .sort((left, right) => right.fetchedAt.localeCompare(left.fetchedAt))[0];

  if (latestDashboard !== undefined) {
    for (const stat of latestDashboard.themeStats) {
      byTheme.set(stat.theme, { attempts: stat.attempts, wins: stat.attempts - stat.losses });
    }
  } else {
    for (const log of allLogs) {
      if (log.result?.kind !== 'puzzle-activity') {
        continue;
      }

      for (const stat of log.result.themeStats ?? []) {
        const entry = byTheme.get(stat.theme) ?? { attempts: 0, wins: 0 };

        entry.attempts += stat.attempts;
        entry.wins += stat.attempts - stat.losses;
        byTheme.set(stat.theme, entry);
      }
    }
  }

  return [...byTheme.entries()]
    .map(([theme, entry]) => ({
      theme,
      attempts: entry.attempts,
      wins: entry.wins,
      accuracyPercent: entry.attempts === 0 ? 0 : Math.round((entry.wins / entry.attempts) * 100),
    }))
    .filter((entry) => entry.attempts > 0)
    .sort((left, right) => right.attempts - left.attempts);
}

export function buildTrackEffort(allLogs: TrainingLog[]): TrackEffortEntry[] {
  const byTrack = new Map<string, { minutes: number; blocks: number }>();

  for (const log of allLogs) {
    if (log.status !== 'done' || log.plannedSeconds <= 0) {
      continue;
    }

    const trackId = log.methodTrackId ?? 'sem-trilha';
    const entry = byTrack.get(trackId) ?? { minutes: 0, blocks: 0 };

    entry.minutes += Math.round((log.elapsedSeconds ?? 0) / 60);
    entry.blocks += 1;
    byTrack.set(trackId, entry);
  }

  return [...byTrack.entries()]
    .map(([trackId, entry]) => ({
      trackId,
      title: trackId === 'sem-trilha' ? 'Treinos anteriores ao método' : getMethodTrackTitle(trackId),
      minutes: entry.minutes,
      blocks: entry.blocks,
    }))
    .sort((left, right) => right.minutes - left.minutes);
}

export function buildProgressTrend(allLogs: TrainingLog[], today: string): ProgressTrend | undefined {
  const todayIdx = dayIndex(today);
  const doneLogs = allLogs.filter((log) => log.status === 'done' && log.plannedSeconds > 0);

  const minutesIn = (fromIdx: number, toIdx: number): number =>
    Math.round(
      doneLogs
        .filter((log) => {
          const idx = dayIndex(log.date);

          return idx >= fromIdx && idx <= toIdx;
        })
        .reduce((sum, log) => sum + (log.elapsedSeconds ?? 0), 0) / 60,
    );

  const thisWeekMinutes = minutesIn(todayIdx - 6, todayIdx);
  const previousWeekMinutes = minutesIn(todayIdx - 13, todayIdx - 7);

  if (thisWeekMinutes === 0 && previousWeekMinutes === 0) {
    return undefined;
  }

  let line: string;

  if (previousWeekMinutes === 0) {
    line = `Você treinou ${String(thisWeekMinutes)} min nesta semana. Semana anterior sem registro — toda constância começa assim.`;
  } else if (thisWeekMinutes >= previousWeekMinutes) {
    line = `Você treinou ${String(thisWeekMinutes)} min nesta semana, contra ${String(previousWeekMinutes)} min na anterior. Ritmo mantido.`;
  } else {
    line = `Você treinou ${String(thisWeekMinutes)} min nesta semana, contra ${String(previousWeekMinutes)} min na anterior. Sessões curtas contam — 5 minutos já mantêm o fio.`;
  }

  return { thisWeekMinutes, previousWeekMinutes, line };
}
