import { createId } from '../ids';
import type { PlanBlockFeedback, TrainingLog, WeaknessTag } from '../types';
import type { MasteryResult } from './mastery';
import type { MethodTrackId, PendingTrainingItem } from './types';

const SPACING_DAYS = [1, 3, 7, 14] as const;

type StudyDateOptions = {
  nowFn?: () => Date;
  timeZone?: string;
};

function toDateKey(date: Date, timeZone?: string): string {
  if (timeZone !== undefined) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    if (year !== undefined && month !== undefined && day !== undefined) {
      return `${year}-${month}-${day}`;
    }
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${String(year)}-${month}-${day}`;
}

function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    return dateKey;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().split('T')[0] ?? dateKey;
}

export function getNextDueDate(attempts: number, options: StudyDateOptions = {}): string {
  const days = SPACING_DAYS[Math.min(attempts, SPACING_DAYS.length - 1)] ?? 14;
  const today = toDateKey((options.nowFn ?? (() => new Date()))(), options.timeZone);

  return addDays(today, days);
}

function clampSpacingAttempts(attempts: number): number {
  return Math.max(0, Math.min(attempts, GRADUATION_ATTEMPTS));
}

export function createPendingItemFromFeedback(
  log: TrainingLog,
  weaknessTag: WeaknessTag,
  methodTrackId: MethodTrackId,
  lichessTheme?: string,
): PendingTrainingItem {
  const now = new Date().toISOString();

  return {
    id: `pending-${createId()}`,
    origin: 'puzzle',
    title: `Revisar: ${log.blockTitle}`,
    weaknessTag,
    methodTrackId,
    ...(lichessTheme === undefined
      ? {}
      : {
          lichessTheme,
          lichessUrl: `https://lichess.org/training/${lichessTheme}`,
        }),
    sourceLogId: log.id,
    prompt: buildGuidingPrompt(methodTrackId),
    dueAt: getNextDueDate(0),
    attempts: 0,
    lastFeedback: 'hard',
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };
}

export function createPendingItemFromTheme(
  theme: string,
  lossCount: number,
  weaknessTag: WeaknessTag,
  methodTrackId: MethodTrackId,
): PendingTrainingItem {
  const now = new Date().toISOString();

  return {
    id: `pending-theme-${createId()}`,
    origin: 'puzzle',
    title: `Revisar tema: ${theme} (${String(lossCount)} erros)`,
    weaknessTag,
    methodTrackId,
    lichessTheme: theme,
    lichessUrl: `https://lichess.org/training/${theme}`,
    prompt: buildGuidingPrompt(methodTrackId),
    dueAt: getNextDueDate(0),
    attempts: 0,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };
}

const GRADUATION_ATTEMPTS = SPACING_DAYS.length;

// Espaçamento fixo: o feedback do aluno move o item em vez de avançar sempre
// um nível. 'easy' pula um nível extra, 'hard' recua; 'good'/sem feedback avança.
function nextSpacingAttempts(attempts: number, feedback?: PlanBlockFeedback): number {
  const delta = feedback === 'easy' ? 2 : feedback === 'hard' ? -1 : 1;

  return clampSpacingAttempts(attempts + delta);
}

export function advancePendingItem(
  item: PendingTrainingItem,
  feedback?: PlanBlockFeedback,
  masteryTarget?: MasteryResult,
): PendingTrainingItem {
  const feedbackAttempts = nextSpacingAttempts(item.attempts, feedback);
  const attempts = masteryTarget === 'advance' ? clampSpacingAttempts(feedbackAttempts + 1) : feedbackAttempts;
  // Mastery real vinda do log reconciliado vence o ajuste local de dueAt do
  // feedback: 'regress' reexpõe amanhã; 'advance' segue o nível acelerado.
  const dueAt =
    masteryTarget === 'regress'
      ? getNextDueDate(0)
      : masteryTarget === 'advance'
        ? getNextDueDate(attempts)
        : feedback === 'hard'
          ? getNextDueDate(0)
          : getNextDueDate(attempts);

  return {
    ...item,
    attempts: masteryTarget === 'regress' ? 0 : attempts,
    dueAt,
    ...(feedback === undefined ? {} : { lastFeedback: feedback }),
    status: masteryTarget !== 'regress' && attempts >= GRADUATION_ATTEMPTS ? 'done' : 'open',
    updatedAt: new Date().toISOString(),
  };
}

export function isDueToday(item: PendingTrainingItem, options: StudyDateOptions = {}): boolean {
  if (item.status !== 'open') {
    return false;
  }

  const today = toDateKey((options.nowFn ?? (() => new Date()))(), options.timeZone);

  return item.dueAt <= today;
}

export function buildGuidingPrompt(trackId: MethodTrackId): string {
  const prompts: Record<MethodTrackId, string> = {
    'pending-review': 'Qual sinal do tabuleiro você ignorou quando jogou o lance errado?',
    'calculation-bridge': 'Quais são meus 2 candidatos e qual é a melhor resposta do adversário?',
    'active-defense': 'O que o oponente ameaça e como posso incomodá-lo ao defender?',
    'opening-as-plan': 'Essa jogada desenvolve peças e protege o rei, ou é só um movimento sem motivo?',
    'progress-diplomas': 'Você confia nas suas decisões neste tema? Sem pressa, sem chutar.',
  };

  return prompts[trackId];
}
