import { createId } from '../ids';
import type { PlanBlockFeedback, TrainingLog, WeaknessTag } from '../types';
import { classifyDifficultyFit, decideMismatchAction, type ObservedResult } from './difficultyFit';
import type { MasteryResult } from './mastery';
import type { MethodTrackId, PendingTrainingItem } from './types';

const SPACING_DAYS = [1, 3, 7, 14] as const;

// SR adaptativo (SM-2, council 2026-06-24). Intervalo = SPACING_DAYS[attempts] ×
// (easeFactor / DEFAULT). Default 2.5 => escala 1 => idêntico à escada fixa
// (retrocompatível). 'easy'/'good' sobem o EF (intervalos maiores), 'hard' desce.
const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;
const MAX_EASE_FACTOR = 2.8;
// Gate de retenção: resgate CEGO de longo prazo antes da graduação final.
const RETENTION_GATE_DAYS = 30;

function clampEaseFactor(ease: number): number {
  return Math.max(MIN_EASE_FACTOR, Math.min(MAX_EASE_FACTOR, ease));
}

// Ajuste do EF por feedback (estilo SM-2, suavizado): 'easy' +0.15, 'good' +0.05,
// 'hard' -0.20, sem feedback mantém. Clamp [1.3, 2.8].
export function nextEaseFactor(current: number | undefined, feedback?: PlanBlockFeedback): number {
  const ease = current ?? DEFAULT_EASE_FACTOR;
  const delta = feedback === 'easy' ? 0.15 : feedback === 'good' ? 0.05 : feedback === 'hard' ? -0.2 : 0;

  return clampEaseFactor(ease + delta);
}

type StudyDateOptions = {
  nowFn?: () => Date;
  timeZone?: string;
};

function toDateKey(date: Date, timeZone?: string): string {
  if (timeZone !== undefined) {
    const parts = new Intl.DateTimeFormat('pt-BR', {
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

function dueDateInDays(days: number, options: StudyDateOptions = {}): string {
  const today = toDateKey((options.nowFn ?? (() => new Date()))(), options.timeZone);

  return addDays(today, days);
}

export function getNextDueDate(
  attempts: number,
  options: StudyDateOptions = {},
  easeFactor: number = DEFAULT_EASE_FACTOR,
): string {
  const base = SPACING_DAYS[Math.min(attempts, SPACING_DAYS.length - 1)] ?? 14;
  // attempts<=0 = piso de reaprendizado (amanhã), sem escala. Demais escalam pelo
  // EF; no EF default (2.5) a escala é 1 => intervalos idênticos à escada fixa.
  const days = attempts <= 0 ? base : Math.max(1, Math.round(base * (easeFactor / DEFAULT_EASE_FACTOR)));

  return dueDateInDays(days, options);
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

// Só "forma" (gradua) um item se a acurácia CUMULATIVA do tema (todo o histórico de
// puzzles, via buildSkillMap) for >= 75% (decisão 2026-06-20). Válvula de amostra:
// só BLOQUEIA a formatura com amostra suficiente (>= 10 tentativas). Com pouco dado
// (ou nenhum), a graduação cai no critério por volume — dados ralos nunca travam.
// Válvula de ESCAPE: após 2 ciclos consecutivos bloqueados no teto de espaçamento, o
// item forma assim mesmo (não fica eterno); o tema segue rastreado como fraqueza.
const GRADUATION_MIN_ACCURACY_PERCENT = 75;
const GRADUATION_MIN_ATTEMPTS = 10;
const GRADUATION_GATE_ESCAPE_CYCLES = 2;

function graduationBlockedByAccuracy(themeMastery?: { accuracyPercent: number; attempts: number }): boolean {
  return (
    themeMastery !== undefined &&
    themeMastery.attempts >= GRADUATION_MIN_ATTEMPTS &&
    themeMastery.accuracyPercent < GRADUATION_MIN_ACCURACY_PERCENT
  );
}

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
  themeMastery?: { accuracyPercent: number; attempts: number },
  routing?: { recentObserved?: ObservedResult; hasCuratedStudy?: boolean; studyUrl?: string },
): PendingTrainingItem {
  const easeFactor = nextEaseFactor(item.easeFactor, feedback);
  const now = new Date().toISOString();
  const lastFeedback = feedback === undefined ? {} : { lastFeedback: feedback };

  // Gate por resultado OBSERVADO (council 2026-06-24, ver routing-concept-puzzle-decision): o
  // solve-rate RECENTE da reconciliação classifica o encaixe de dificuldade. 'too-hard' VENCE o
  // autorrelato — fecha o buraco de "otimizar contra sinal cego": não gradua e dispara o mismatch.
  // Sem sinal observado (routing ausente) → undefined → comportamento idêntico ao atual.
  const observedFit =
    routing?.recentObserved === undefined ? undefined : classifyDifficultyFit(routing.recentObserved);

  // Gate de retenção: o item já está no resgate CEGO de longo prazo.
  if (item.retentionPending === true) {
    // too-hard observado também reprova o resgate (não basta o autorrelato não ser 'hard').
    const retained = feedback !== 'hard' && masteryTarget !== 'regress' && observedFit !== 'too-hard';
    if (retained) {
      // Reteve o padrão após o intervalo longo → gradua de verdade (prova de retenção).
      return { ...item, easeFactor, retentionPending: false, ...lastFeedback, status: 'done', updatedAt: now };
    }
    // Falhou o resgate cego → reaprende: volta um nível, reexpõe amanhã, sai da retenção.
    return {
      ...item,
      easeFactor,
      retentionPending: false,
      attempts: clampSpacingAttempts(item.attempts - 1),
      dueAt: getNextDueDate(0),
      ...lastFeedback,
      gateBlockedCount: 0,
      status: 'open',
      updatedAt: now,
    };
  }

  // Mismatch (too-hard observado, council 2026-06-24): a dificuldade é ingovernável no tema, então
  // cai pro layer CONTROLÁVEL (Study curada) ou ADIA o conceito — nunca repete volume duro em
  // silêncio. Decisão do dono (UX TDAH). Precede a graduação: item difícil demais não forma.
  if (observedFit === 'too-hard') {
    const action = decideMismatchAction(observedFit, { hasCuratedStudy: routing?.hasCuratedStudy ?? false });

    if (action === 'route-study' && routing?.studyUrl !== undefined) {
      // Re-ensina pelo layer controlável: recua um nível, reexpõe amanhã, rota passa a ser a Study.
      return {
        ...item,
        easeFactor,
        attempts: clampSpacingAttempts(item.attempts - 1),
        lichessUrl: routing.studyUrl,
        retentionPending: false,
        dueAt: getNextDueDate(0),
        ...lastFeedback,
        gateBlockedCount: 0,
        status: 'open',
        updatedAt: now,
      };
    }

    // Sem Study curada → adia com nota honesta (não finge controlar a dificuldade).
    return {
      ...item,
      easeFactor,
      ...lastFeedback,
      status: 'deferred',
      deferReason:
        'Puzzles deste tema ficaram difíceis demais pro seu nível agora — adiado até reforçar a base.',
      updatedAt: now,
    };
  }

  const feedbackAttempts = nextSpacingAttempts(item.attempts, feedback);
  const attempts = masteryTarget === 'advance' ? clampSpacingAttempts(feedbackAttempts + 1) : feedbackAttempts;
  // Mastery real vinda do log reconciliado vence o ajuste local de dueAt do
  // feedback: 'regress' reexpõe amanhã; 'advance' segue o nível acelerado (escala EF).
  const dueAt =
    masteryTarget === 'regress'
      ? getNextDueDate(0)
      : masteryTarget === 'advance'
        ? getNextDueDate(attempts, {}, easeFactor)
        : feedback === 'hard'
          ? getNextDueDate(0)
          : getNextDueDate(attempts, {}, easeFactor);

  // Conta ciclos consecutivos bloqueados pela acurácia no teto de espaçamento; zera
  // quando não está bloqueado no teto. Após GRADUATION_GATE_ESCAPE_CYCLES, escapa.
  const atCeiling = masteryTarget !== 'regress' && attempts >= GRADUATION_ATTEMPTS;
  const accuracyBlocks = graduationBlockedByAccuracy(themeMastery);
  const gateBlockedCount = atCeiling && accuracyBlocks ? (item.gateBlockedCount ?? 0) + 1 : 0;
  const escaped = gateBlockedCount >= GRADUATION_GATE_ESCAPE_CYCLES;
  const reachesGraduation = atCeiling && (!accuracyBlocks || escaped);

  // Gate de retenção (council 2026-06-24): no teto, NÃO gradua direto — agenda um
  // resgate cego de RETENTION_GATE_DAYS. Só vira 'done' se reter (próximo advance).
  if (reachesGraduation) {
    return {
      ...item,
      attempts,
      easeFactor,
      retentionPending: true,
      dueAt: dueDateInDays(RETENTION_GATE_DAYS),
      ...lastFeedback,
      gateBlockedCount,
      status: 'open',
      updatedAt: now,
    };
  }

  return {
    ...item,
    attempts: masteryTarget === 'regress' ? 0 : attempts,
    easeFactor,
    dueAt,
    ...lastFeedback,
    gateBlockedCount,
    status: 'open',
    updatedAt: now,
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
