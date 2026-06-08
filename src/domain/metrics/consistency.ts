import type { Consistency, TrainingLog } from '../types';

const MS_PER_DAY = 86_400_000;

function toUtcDayIndex(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

export function computeConsistency(logs: TrainingLog[], today: string): Consistency {
  const doneDays = [...new Set(logs.filter((log) => log.status === 'done').map((log) => log.date))]
    .map(toUtcDayIndex)
    .sort((left, right) => left - right);

  if (doneDays.length === 0) {
    return {
      currentStreakDays: 0,
      longestStreakDays: 0,
      daysSinceLastSession: 0,
      returnedAfterGap: false,
    };
  }

  const todayIndex = toUtcDayIndex(today);
  const lastIndex = doneDays[doneDays.length - 1];
  const daysSinceLastSession = Math.max(0, todayIndex - lastIndex);

  let longestStreakDays = 1;
  let run = 1;
  for (let i = 1; i < doneDays.length; i += 1) {
    run = doneDays[i] - doneDays[i - 1] === 1 ? run + 1 : 1;
    longestStreakDays = Math.max(longestStreakDays, run);
  }

  let currentRun = 1;
  for (let i = doneDays.length - 1; i > 0; i -= 1) {
    if (doneDays[i] - doneDays[i - 1] !== 1) {
      break;
    }
    currentRun += 1;
  }

  const currentStreakDays = daysSinceLastSession <= 1 ? currentRun : 0;

  return {
    currentStreakDays,
    longestStreakDays,
    daysSinceLastSession,
    returnedAfterGap: daysSinceLastSession >= 2,
  };
}
