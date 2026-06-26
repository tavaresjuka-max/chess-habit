# SPEC — E2-descriptive: ingredientes de slope (DESCRITIVOS, NÃO-CAUSAIS)

## Contexto e contrato anti-armadilha
[[e2e4-efficacy-methodology-DECISION]] RE-ROTULOU o E2: ele computa **ingredientes DESCRITIVOS**
(segmentos de slope por formato + volume + densidade), **explicitamente NÃO-CAUSAIS**. NÃO é o
estimador de eficácia. O contraste `slopePos − slopePre` é EXATAMENTE a armadilha RTM (Tier 0):
**proibido** apresentá-lo como prova de que "o app funciona". O estimador causal (AR(1)-corrigido
ou DiD vs controle) é OUTRA camada, GATED na decisão de tier do dono — NÃO entra aqui.

Este módulo é PURO (sem IO, sem Dexie, sem rede, sem persistência). Consome a saída do E1a
(`LichessRatingSeries[]`, commit 49682ae) e devolve números descritivos. Tier-agnóstico.

## Escopo da fonte (decidido pelo maestro — NÃO reabrir)
A rating-history do Lichess só carrega `[date, rating]` — **NÃO tem RD/Glicko-2**. Logo os pesos
`1/RD²` que a DECISION cita como covariável ficam **FORA do E2** (deferidos pra quando dados a
nível de partida forem ligados). E2 computa SÓ o que a série dá: **slope OLS, volume (n),
span e densidade** por formato. Theil-Sen/robustez também ficam pro estimador (tier-gated), não
pro ingrediente descritivo.

## A) src/domain/efficacy/ratingSlopes.ts — NOVO
```ts
import type { LichessRatingSeries } from '../../infra/lichess/ratingHistory';

// INGREDIENTE DESCRITIVO, NÃO-CAUSAL. NUNCA usar (slopePos - slopePre) como prova de
// eficácia — é a armadilha de regressão-à-média (Tier 0). Ver
// docs/specs/e2e4-efficacy-methodology-DECISION.md. O estimador causal é outra camada,
// travada na decisão de tier do dono.

const MS_PER_DAY = 86_400_000;

export type SlopeSegment = {
  // slope OLS de rating vs dia (rating/dia). undefined se <2 pontos ou span 0 (reta indefinida).
  slopePerDay: number | undefined;
  n: number;            // nº de pontos na janela (volume)
  spanDays: number;     // dias entre o 1º e o último ponto da janela (0 se <2 pontos)
  densityPerDay: number; // n / max(spanDays, 1)
};

export type PerfSlopes = {
  perf: string;
  pre: SlopeSegment;
  pos: SlopeSegment;
};

export type SlopeWindowOptions = {
  adoptionDate: string;  // 'YYYY-MM-DD' — T, marco de adoção do app (vem de quem chama)
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
    sumX += xs[i];
    sumY += ys[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - meanX;
    num += dx * (ys[i] - meanY);
    den += dx * dx;
  }
  if (den === 0) {
    return undefined;
  }
  return num / den;
}

function segment(days: number[], ratings: number[]): SlopeSegment {
  const n = days.length;
  const spanDays = n >= 2 ? days[n - 1] - days[0] : 0;
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
  series: LichessRatingSeries[],
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
    const preDays: number[] = [];
    const preRatings: number[] = [];
    const posDays: number[] = [];
    const posRatings: number[] = [];

    for (const point of s.points) {
      const day = toDayNumber(point.date);
      if (!Number.isFinite(day)) {
        continue;
      }
      if (day >= preStart && day < t) {
        preDays.push(day);
        preRatings.push(point.rating);
      } else if (day >= t && day <= posEnd) {
        posDays.push(day);
        posRatings.push(point.rating);
      }
    }

    result.push({
      perf: s.perf,
      pre: segment(preDays, preRatings),
      pos: segment(posDays, posRatings),
    });
  }

  return result;
}
```
> NOTA: a saída do E1a já vem ordenada por data? O parser preserva a ordem do endpoint (cronológica).
> Se NÃO houver garantia de ordem, ordenar `preDays`/`posDays` antes de `segment` (spanDays usa
> primeiro/último). GLM: se a ordem não for garantida pelo E1a, adicione um sort estável por dia
> dentro de cada janela ANTES de chamar segment. (O slope OLS independe de ordem; só span depende.)

## B) src/domain/efficacy/ratingSlopes.test.ts — NOVO (vitest)
Casos VERMELHO→VERDE (datas como 'YYYY-MM-DD'; T = adoptionDate):
1. **slope pós positivo, pré chato:** pré com ratings constantes (slope ≈ 0), pós subindo linear
   (ex.: +1/dia) → `pos.slopePerDay > 0`, `pre.slopePerDay ≈ 0`; n/span/density corretos.
2. **fronteira em T:** ponto com date === T cai no PÓS (n_pos inclui), ponto em T-1 cai no PRÉ.
3. **1 ponto na janela:** `slopePerDay === undefined`, `n === 1`, `spanDays === 0`,
   `densityPerDay === 1` (n/max(span,1)=1/1).
4. **série vazia** (`[]`) → `[]`.
5. **todos os pontos na mesma data** dentro da janela → `slopePerDay === undefined` (span 0,
   denominador OLS 0), `n` = contagem.
6. **pontos fora das duas janelas** (mais velhos que T-pre ou mais novos que T+pos) → excluídos
   das contagens (n só conta o que está dentro).
7. **slope pré NEGATIVO** (o "fundo do vale" da RTM: rating descendo antes da adoção) →
   `pre.slopePerDay < 0`. Documenta o padrão da armadilha — rotulado DESCRITIVO, nunca causal.
8. **adoptionDate inválida** (`'nao-e-data'`) → `[]` (toDayNumber NaN → guard).

## PROIBIDO TOCAR / NON-GOALS
NÃO mexer em ratingHistory.ts nem ratingHistoryClient.ts (E1) nem em qualquer infra/rede/Dexie.
NÃO computar pesos 1/RD² (não há RD na fonte — deferido). NÃO computar estimador causal
(AR(1)/DiD/Theil-Sen) — é tier-gated, outra camada. NÃO persistir. NÃO expor
`slopePos − slopePre` como métrica de eficácia. NÃO commitar.

## Gate (o maestro roda — você NÃO)
8 testes VERMELHO→VERDE; `npm test`/`lint`/`build` verdes. Lint strict: módulo é puro e tipado,
sem `any`. Entrega: arquivos mudados + diff + o teste novo. NÃO commitar.

## CORREÇÃO na revisão (maestro) — fronteira domain→infra
A instrução original ("importar `LichessRatingSeries` de `../../infra/lichess/ratingHistory`")
violava a regra eslint `no-restricted-imports` de `src/domain/**` ("Domain code must not import
app infrastructure or UI"). Corrigido sem mexer na matemática: o módulo passou a declarar um
contrato de entrada PRÓPRIO e provider-agnóstico (`RatingPoint`/`RatingSeries`),
ESTRUTURALMENTE compatível com `LichessRatingSeries` do E1a — quem chama passa a saída do
parser direto, sem conversão. Mesmo padrão de `src/domain/placement/lichessBand.ts`. Gates
após a correção: 1102 testes verdes, lint limpo, build OK.
