import { isBeginnerBand } from '../bands';
import { assertNever } from '../assertNever';
import { weaknessTagFromPuzzleTheme } from '../coach/puzzleThemeStats';
import type { Confidence, LearnerBand, PuzzleThemeStats, Signal, Weakness, WeaknessTag } from '../types';

// Iniciantes (0-800) recebem um limiar de blunder mais baixo: anti-blunder é a
// alavanca nº1 nessa fase, então o sinal dispara mais cedo. Acima de 800, só
// vale destacar quando os erros graves são claramente frequentes.
const BLUNDER_RATE_BEGINNER = 0.3;
const BLUNDER_RATE_DEFAULT = 0.5;

// Precisão (accuracy) baixa é normal para iniciantes — por isso o limiar deles é
// mais alto: só vira sinal quando quase todas as partidas têm accuracy baixa.
// Acima de 800, basta uma maioria das partidas com precisão baixa.
const ACCURACY_LOW_RATE_BEGINNER = 0.8;
const ACCURACY_LOW_RATE_DEFAULT = 0.6;

const puzzleWeaknessTitle = {
  'hanging-piece': 'pecas penduradas',
  fork: 'garfos',
  pin: 'cravadas',
  skewer: 'espetos',
  discovered: 'ataques descobertos',
  'mate-in-1': 'mate em 1',
  'mate-in-2': 'mate em 2',
  'back-rank': 'mate na ultima fileira',
  'opening-principles': 'principios de abertura',
  'time-trouble': 'gestao de tempo',
  'endgame-pawn': 'finais de peoes',
  'endgame-rook': 'finais de torres',
  conversion: 'conversao',
  'blunder-rate': 'seguranca anti-blunder',
} satisfies Record<WeaknessTag, string>;

type WeaknessCandidate = {
  tag: WeaknessTag;
  contribution: number;
  minContribution: number;
  confidence: Confidence;
  evidence: string;
};

const confidenceScore = {
  low: 0.3,
  medium: 0.6,
  high: 0.9,
} satisfies Record<Confidence, number>;

const confidenceRank = {
  low: 0,
  medium: 1,
  high: 2,
} satisfies Record<Confidence, number>;

// Politica de decaimento (Corte 5, achado Gemini): sinais com mais de 90 dias
// nao descrevem mais o jogador de hoje e saem do diagnostico.
const SIGNAL_MAX_AGE_DAYS = 90;

export function filterFreshSignals(
  signals: Signal[],
  nowIso: string,
  maxAgeDays = SIGNAL_MAX_AGE_DAYS,
): Signal[] {
  if (Number.isNaN(Date.parse(nowIso))) {
    return signals;
  }

  return signals.filter((signal) => isFreshObservedAt(signal.observedAt, nowIso, maxAgeDays));
}

export function detectWeaknesses(signals: Signal[], band?: LearnerBand): Weakness[] {
  const beginner = isBeginnerBand(band);
  const blunderThreshold = beginner ? BLUNDER_RATE_BEGINNER : BLUNDER_RATE_DEFAULT;
  const accuracyThreshold = beginner ? ACCURACY_LOW_RATE_BEGINNER : ACCURACY_LOW_RATE_DEFAULT;
  const weaknesses = detectNonColorWeaknesses(signals, blunderThreshold, accuracyThreshold);
  const colorWeakness = detectColorWeakness(signals);

  if (colorWeakness === undefined) {
    return weaknesses;
  }

  const existingIndex = weaknesses.findIndex((weakness) => weakness.tag === colorWeakness.tag);

  if (existingIndex === -1) {
    return [...weaknesses, colorWeakness].sort(sortWeaknesses);
  }

  return weaknesses.map((weakness, index) =>
    index === existingIndex
      ? {
          ...weakness,
          confidence: maxConfidence(weakness.confidence, colorWeakness.confidence),
          score: Math.max(weakness.score, colorWeakness.score),
        }
      : weakness,
  );
}

export function createWeaknessFromPuzzleStats(
  themeStats: PuzzleThemeStats | undefined,
  observedAt: string,
): Weakness | undefined {
  if (themeStats === undefined || !isFreshObservedAt(themeStats.until, observedAt, SIGNAL_MAX_AGE_DAYS)) {
    return undefined;
  }

  for (const theme of themeStats.themes) {
    if (theme.losses <= 0 || theme.attempts <= 0) {
      continue;
    }

    const tag = weaknessTagFromPuzzleTheme(theme.theme);

    if (tag === undefined) {
      continue;
    }

    const lossRate = theme.losses / theme.attempts;
    const confidence: Confidence = theme.attempts >= 5 && theme.losses >= 3 && lossRate >= 0.5 ? 'medium' : 'low';
    const score = roundScore(confidenceScore[confidence] * Math.min(1, theme.losses / 3));

    return {
      tag,
      score,
      confidence,
      evidence: `Sinal duravel dos puzzles conferidos no Lichess: ${puzzleWeaknessTitle[tag]} concentrou ${String(theme.losses)} erro(s) em ${String(theme.attempts)} tentativa(s).`,
    };
  }

  return undefined;
}

function detectNonColorWeaknesses(
  signals: Signal[],
  blunderThreshold: number,
  accuracyThreshold: number,
): Weakness[] {
  const candidates = signals.flatMap((signal) => signalToCandidates(signal, blunderThreshold, accuracyThreshold));
  const byTag = new Map<WeaknessTag, Weakness>();

  for (const candidate of candidates) {
    const score = toScore(candidate);
    const existing = byTag.get(candidate.tag);

    if (existing === undefined) {
      byTag.set(candidate.tag, {
        tag: candidate.tag,
        score,
        confidence: candidate.confidence,
        evidence: candidate.evidence,
      });
      continue;
    }

    byTag.set(candidate.tag, {
      tag: candidate.tag,
      score: Math.max(existing.score, score),
      confidence: maxConfidence(existing.confidence, candidate.confidence),
      evidence: score > existing.score ? candidate.evidence : existing.evidence,
    });
  }

  return [...byTag.values()].sort(sortWeaknesses);
}

function signalToCandidates(
  signal: Signal,
  blunderThreshold: number,
  accuracyThreshold: number,
): WeaknessCandidate[] {
  switch (signal.value.kind) {
    case 'judgment':
      if (signal.value.games >= 5 && signal.value.blunders / signal.value.games > blunderThreshold) {
        return [
          {
            tag: 'blunder-rate',
            contribution: signal.value.games,
            minContribution: 5,
            confidence: signal.confidence,
            evidence:
              'Nas partidas analisadas recentes apareceram mais erros graves que o esperado; hoje vale testar uma rotina curta anti-blunder.',
          },
        ];
      }
      return [];

    case 'accuracy':
      if (signal.value.games >= 8 && signal.value.lowAccuracyGames / signal.value.games >= accuracyThreshold) {
        return [
          {
            tag: 'blunder-rate',
            contribution: signal.value.games,
            minContribution: 8,
            confidence: 'low',
            evidence:
              'Em várias partidas recentes a precisão (accuracy) ficou baixa; uma rotina curta anti-blunder ajuda a estabilizar.',
          },
        ];
      }
      return [];

    case 'clock':
      if (signal.value.games >= 10 && signal.value.timeoutLosses >= 2) {
        return [
          {
            tag: 'time-trouble',
            contribution: signal.value.games,
            minContribution: 10,
            confidence: signal.confidence,
            evidence: `Você perdeu por tempo em ${String(signal.value.timeoutLosses)} partidas recentes; talvez um ritmo um pouco mais calmo ajude.`,
          },
        ];
      }
      return [];

    case 'opening':
      if (signal.value.games >= 5 && signal.value.lossRate > 0.6) {
        return [
          {
            tag: 'opening-principles',
            contribution: signal.value.games,
            minContribution: 5,
            confidence: signal.confidence,
            evidence: `A abertura ${signal.value.name} apareceu várias vezes com resultado difícil; hoje a revisão fica nos princípios de abertura.`,
          },
        ];
      }
      return [];

    case 'manual':
      return [
        {
          tag: signal.value.tag,
          contribution: 1,
          minContribution: 1,
          confidence: signal.confidence,
          evidence:
            signal.value.note ??
            'Há um sinal manual registrado para este tema; hoje o plano pode testar essa hipótese com treino curto.',
        },
      ];

    case 'color':
    case 'rating':
    case 'time-control':
      return [];
    default:
      return assertNever(signal.value);
  }
}

function isFreshObservedAt(observedAt: string, nowIso: string, maxAgeDays: number): boolean {
  const observed = Date.parse(observedAt);
  const now = Date.parse(nowIso);

  if (Number.isNaN(observed) || Number.isNaN(now)) {
    return true;
  }

  return observed >= now - maxAgeDays * 86_400_000;
}

export function detectColorWeakness(signals: Signal[]): Weakness | undefined {
  const colorSignals = signals.filter((signal) => signal.value.kind === 'color');
  const white = aggregateColor(colorSignals, 'white');
  const black = aggregateColor(colorSignals, 'black');

  if (white.games + black.games < 10 || white.games === 0 || black.games === 0) {
    return undefined;
  }

  const lossRateDiff = Math.abs(white.lossRate - black.lossRate);

  if (lossRateDiff <= 0.2) {
    return undefined;
  }

  return {
    tag: 'opening-principles',
    score: confidenceScore.low,
    confidence: 'low',
    evidence: 'A diferenca de resultado entre cores sugere revisar fundamentos de abertura sem tirar conclusoes duras.',
  };
}

function aggregateColor(signals: Signal[], color: 'white' | 'black'): { games: number; lossRate: number } {
  let games = 0;
  let losses = 0;

  for (const signal of signals) {
    if (signal.value.kind !== 'color' || signal.value.color !== color) {
      continue;
    }

    games += signal.value.games;
    losses += signal.value.lossRate * signal.value.games;
  }

  return {
    games,
    lossRate: games === 0 ? 0 : losses / games,
  };
}

function toScore(candidate: WeaknessCandidate): number {
  const frequencyFactor = Math.min(1, candidate.contribution / candidate.minContribution);
  return roundScore(confidenceScore[candidate.confidence] * frequencyFactor);
}

function roundScore(score: number): number {
  return Math.round(score * 1000) / 1000;
}

function maxConfidence(left: Confidence, right: Confidence): Confidence {
  return confidenceRank[right] > confidenceRank[left] ? right : left;
}

function sortWeaknesses(left: Weakness, right: Weakness): number {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  return left.tag.localeCompare(right.tag);
}
