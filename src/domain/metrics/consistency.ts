import type { Consistency, TrainingLog } from '../types';

const MS_PER_DAY = 86_400_000;

function toUtcDayIndex(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`Invalid date: ${date}`);
  }
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
  const lastIndex = doneDays.at(-1);
  if (lastIndex === undefined) {
    throw new Error('Expected at least one done training day.');
  }
  const daysSinceLastSession = Math.max(0, todayIndex - lastIndex);

  let longestStreakDays = 1;
  let run = 1;
  let previousDay = doneDays[0];
  if (previousDay === undefined) {
    throw new Error('Expected at least one done training day.');
  }
  for (const day of doneDays.slice(1)) {
    run = day - previousDay === 1 ? run + 1 : 1;
    longestStreakDays = Math.max(longestStreakDays, run);
    previousDay = day;
  }

  let currentRun = 1;
  const doneDaySet = new Set(doneDays);
  for (let day = lastIndex - 1; doneDaySet.has(day); day -= 1) {
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
