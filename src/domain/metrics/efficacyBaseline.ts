import type { Signal, TrainingLog } from '../types';
import { buildSkillMap } from './progressOverview';

// Trilha paralela de validacao de eficacia (decisao do dono, 2026-06-10):
// 4 metricas deterministicas registradas desde ja; revisao em ~2026-07-08.
// Mede o metodo, nao o aluno — e nunca aparece como cobranca na UI.

export type EfficacyBaseline = {
  capturedAt: string;
  overallPuzzleAccuracyPercent?: number;
  puzzleAttempts: number;
  sessionCompletionPercent?: number;
  averageDaysBetweenSessions?: number;
  blundersPerGame?: number;
};

const MS_PER_DAY = 86_400_000;

function dayIndex(date: string): number {
  const [year, month, day] = date.split('-').map(Number);

  if (year === undefined || month === undefined || day === undefined) {
    return 0;
  }

  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

export function buildEfficacyBaseline(input: {
  allLogs: TrainingLog[];
  signals: Signal[];
  today: string;
}): EfficacyBaseline {
  const skillMap = buildSkillMap(input.allLogs);
  const puzzleAttempts = skillMap.reduce((sum, entry) => sum + entry.attempts, 0);
  const puzzleWins = skillMap.reduce((sum, entry) => sum + entry.wins, 0);

  const finishedLogs = input.allLogs.filter((log) => log.status === 'done' || log.status === 'skipped');
  const doneLogs = finishedLogs.filter((log) => log.status === 'done');

  const trainingDays = [...new Set(doneLogs.map((log) => dayIndex(log.date)))].sort(
    (left, right) => left - right,
  );
  const gaps: number[] = [];

  for (let index = 1; index < trainingDays.length; index += 1) {
    const current = trainingDays[index];
    const previous = trainingDays[index - 1];

    if (current !== undefined && previous !== undefined) {
      gaps.push(current - previous);
    }
  }

  const judgmentSignals = input.signals
    .filter(
      (signal): signal is Signal & { value: Extract<Signal['value'], { kind: 'judgment' }> } =>
        signal.value.kind === 'judgment' && signal.value.games > 0,
    )
    .sort((left, right) => right.observedAt.localeCompare(left.observedAt));
  const latestJudgment = judgmentSignals[0];

  return {
    capturedAt: input.today,
    ...(puzzleAttempts > 0
      ? { overallPuzzleAccuracyPercent: Math.round((puzzleWins / puzzleAttempts) * 100) }
      : {}),
    puzzleAttempts,
    ...(finishedLogs.length > 0
      ? { sessionCompletionPercent: Math.round((doneLogs.length / finishedLogs.length) * 100) }
      : {}),
    ...(gaps.length > 0
      ? { averageDaysBetweenSessions: Math.round((gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length) * 10) / 10 }
      : {}),
    ...(latestJudgment !== undefined
      ? { blundersPerGame: Math.round((latestJudgment.value.blunders / latestJudgment.value.games) * 100) / 100 }
      : {}),
  };
}
