// Contrato de entrada PRÓPRIO do domínio (provider-agnóstico). E2 vive em src/domain/ →
// a regra no-restricted-imports proíbe importar infra ("Domain code must not import app
// infrastructure or UI"). O tipo LichessRatingSeries do E1a (infra, commit 49682ae) é
// ESTRUTURALMENTE compatível com RatingSeries, então quem chama passa a saída do parser
// direto, sem conversão. Mesmo padrão de src/domain/placement/lichessBand.ts.
export type RatingPoint = { date: string; rating: number };
export type RatingSeries = { perf: string; points: RatingPoint[] };

// INGREDIENTE DESCRITIVO, NÃO-CAUSAL. NUNCA usar (slopePos - slopePre) como prova de
// eficácia — é a armadilha de regressão-à-média (Tier 0). Ver
// docs/specs/e2e4-efficacy-methodology-DECISION.md. O estimador causal é outra camada,
// travada na decisão de tier do dono.

const MS_PER_DAY = 86_400_000;

export type SlopeSegment = {
  // slope OLS de rating vs dia (rating/dia). undefined se <2 pontos ou span 0 (reta indefinida).
  slopePerDay: number | undefined;
  n: number; // nº de pontos na janela (volume)
  spanDays: number; // dias entre o 1º e o último ponto da janela (0 se <2 pontos)
  densityPerDay: number; // n / max(spanDays, 1)
};

export type PerfSlopes = {
  perf: string;
  pre: SlopeSegment;
  pos: SlopeSegment;
};

export type SlopeWindowOptions = {
  adoptionDate: string; // 'YYYY-MM-DD' — T, marco de adoção do app (vem de quem chama)
  preWindowDays: number; // ex.: 90
  posWindowDays: number; // ex.: 90
};

// Converte 'YYYY-MM-DD' → número de dias inteiros desde a época (UTC). Determinístico
// (não usa "agora"). NaN se a data for inválida.
function toDayNumber(isoDate: string): number {
  const ms = Date.parse(`${isoDate}T00:00:00Z`);
  return Math.floor(ms / MS_PER_DAY);
}

// Slope OLS de y sobre x: Σ((x-x̄)(y-ȳ)) / Σ((x-x̄)²). undefined se denominador 0
// (todos os x iguais) ou <2 pares.
function olsSlope(xs: number[], ys: number[]): number | undefined {
  const n = xs.length;
  if (n < 2) {
    return undefined;
  }
  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i += 1) {
    const x = xs[i];
    const y = ys[i];
    if (x === undefined || y === undefined) {
      return undefined;
    }
    sumX += x;
    sumY += y;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    const x = xs[i];
    const y = ys[i];
    if (x === undefined || y === undefined) {
      return undefined;
    }
    const dx = x - meanX;
    num += dx * (y - meanY);
    den += dx * dx;
  }
  if (den === 0) {
    return undefined;
  }
  return num / den;
}

function segment(days: number[], ratings: number[]): SlopeSegment {
  const n = days.length;
  const first = days[0];
  const last = days[n - 1];
  const spanDays = n >= 2 && first !== undefined && last !== undefined ? last - first : 0;
  return {
    slopePerDay: olsSlope(days, ratings),
    n,
    spanDays,
    densityPerDay: n / Math.max(spanDays, 1),
  };
}

// Para cada formato relevante, separa os pontos em janela pré [T-preWindowDays, T) e
// pós [T, T+posWindowDays] e devolve os ingredientes descritivos de cada uma. O ponto
// EXATAMENTE em T cai no pós (date >= T). Pontos fora das duas janelas são ignorados.
export function computeRatingSlopes(
  series: RatingSeries[],
  options: SlopeWindowOptions,
): PerfSlopes[] {
  const t = toDayNumber(options.adoptionDate);
  if (!Number.isFinite(t)) {
    return [];
  }
  const preStart = t - options.preWindowDays;
  const posEnd = t + options.posWindowDays;

  const result: PerfSlopes[] = [];

  for (const s of series) {
    const pre: Array<{ day: number; rating: number }> = [];
    const pos: Array<{ day: number; rating: number }> = [];

    for (const point of s.points) {
      const day = toDayNumber(point.date);
      if (!Number.isFinite(day)) {
        continue;
      }
      if (day >= preStart && day < t) {
        pre.push({ day, rating: point.rating });
      } else if (day >= t && day <= posEnd) {
        pos.push({ day, rating: point.rating });
      }
    }

    // A ordem cronológica NÃO é garantida pelo E1a (o parser só repassa a ordem do
    // endpoint). Sort estável por dia dentro de cada janela antes de segment: o slope
    // OLS é insensível à ordem, mas spanDays usa primeiro/último do array.
    pre.sort((a, b) => a.day - b.day);
    pos.sort((a, b) => a.day - b.day);

    result.push({
      perf: s.perf,
      pre: segment(
        pre.map((p) => p.day),
        pre.map((p) => p.rating),
      ),
      pos: segment(
        pos.map((p) => p.day),
        pos.map((p) => p.rating),
      ),
    });
  }

  return result;
}
