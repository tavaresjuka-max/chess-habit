import { filterFreshSignals, type Signal, type Weakness } from '../domain';
import { confidenceRank } from '../domain/confidence';
import { loadSignals } from '../infra/storage/appData';

// Sinal mais recente salvo por fonte. Em Chess.com, observedAt preserva a data
// da evidencia mensal quando existe; maxAgeMs e um atalho best-effort, nao uma
// garantia exata de "ultimo sync".
export async function latestSignalObservedAt(source: Signal['source']): Promise<string | undefined> {
  const all = await loadSignals();
  let latest: string | undefined;

  for (const signal of all) {
    if (signal.source === source && (latest === undefined || signal.observedAt > latest)) {
      latest = signal.observedAt;
    }
  }

  return latest;
}

// Sinais Chess.com derivam observedAt do end_time real do jogo, então o corte de
// 90 dias os descartaria cedo demais (achado nº1: 294 sinais -> 0 fraquezas). Mas
// isentá-los por completo deixava ratings/aberturas de anos atrás vivos para sempre
// (fraquezas-fantasma). Meio-termo: Chess.com usa uma janela maior (365d) em vez de
// ilimitada; as demais fontes seguem com 90 dias.
const CHESSCOM_SIGNAL_MAX_AGE_DAYS = 365;

export function filterSignalsForDiagnosis(signals: Signal[], nowIso: string): Signal[] {
  const freshSignals = new Set(filterFreshSignals(signals, nowIso));
  const chesscomFreshSignals = new Set(
    filterFreshSignals(signals, nowIso, CHESSCOM_SIGNAL_MAX_AGE_DAYS),
  );

  return signals.filter((signal) => {
    if (signal.source !== 'chesscom') {
      return freshSignals.has(signal);
    }

    // Rating é um retrato do momento: rating antigo (ex.: <1000 de meses atrás) não
    // reflete o jogador de hoje e gerava fraqueza-fantasma de anti-blunder. Rating
    // expira em 90 dias (janela padrão); os demais sinais chesscom (accuracy/opening
    // derivados de jogos) seguem com a janela maior de 365 dias.
    if (signal.value.kind === 'rating') {
      return freshSignals.has(signal);
    }

    return chesscomFreshSignals.has(signal);
  });
}

export function mergePuzzleWeakness(weaknesses: Weakness[], puzzleWeakness: Weakness | undefined): Weakness[] {
  if (puzzleWeakness === undefined) {
    return weaknesses;
  }

  const existing = weaknesses.find((weakness) => weakness.tag === puzzleWeakness.tag);

  if (existing === undefined) {
    return [...weaknesses, puzzleWeakness].sort(sortWeaknessesByScore);
  }

  return weaknesses
    .map((weakness) =>
      weakness.tag === puzzleWeakness.tag
        ? {
            ...weakness,
            score: Math.max(weakness.score, puzzleWeakness.score),
            confidence:
              confidenceRank[puzzleWeakness.confidence] > confidenceRank[weakness.confidence]
                ? puzzleWeakness.confidence
                : weakness.confidence,
            evidence: puzzleWeakness.score > weakness.score ? puzzleWeakness.evidence : weakness.evidence,
          }
        : weakness,
    )
    .sort(sortWeaknessesByScore);
}

function sortWeaknessesByScore(left: Weakness, right: Weakness): number {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  return left.tag.localeCompare(right.tag);
}
