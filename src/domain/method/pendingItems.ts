import type { PlanBlockFeedback, TrainingLog, WeaknessTag } from '../types';
import type { MethodTrackId, PendingTrainingItem } from './types';

const SPACING_DAYS = [1, 3, 7, 14] as const;

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);

  return date.toISOString().split('T')[0] ?? isoDate.slice(0, 10);
}

export function getNextDueDate(attempts: number): string {
  const days = SPACING_DAYS[Math.min(attempts, SPACING_DAYS.length - 1)] ?? 14;

  return addDays(new Date().toISOString(), days);
}

export function createPendingItemFromFeedback(
  log: TrainingLog,
  weaknessTag: WeaknessTag,
  methodTrackId: MethodTrackId,
  lichessTheme?: string,
): PendingTrainingItem {
  const now = new Date().toISOString();

  return {
    id: `pending-${log.id}-${String(Date.now())}`,
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
    id: `pending-theme-${theme}-${String(Date.now())}`,
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

export function advancePendingItem(item: PendingTrainingItem, feedback?: PlanBlockFeedback): PendingTrainingItem {
  const attempts = item.attempts + 1;

  return {
    ...item,
    attempts,
    dueAt: getNextDueDate(attempts),
    ...(feedback === undefined ? {} : { lastFeedback: feedback }),
    status: attempts >= SPACING_DAYS.length ? 'done' : 'open',
    updatedAt: new Date().toISOString(),
  };
}

export function isDueToday(item: PendingTrainingItem): boolean {
  if (item.status !== 'open') {
    return false;
  }

  const today = new Date().toISOString().slice(0, 10);

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
