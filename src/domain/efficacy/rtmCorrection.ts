// Correção de regressão-à-média (RTM) via autocorrelação AR(1) — Tier 1 do estimador
// causal. Ver docs/specs/e2e4-efficacy-methodology-DECISION.md:
//   Tier 1 (honesto-mas-limitado): within-subject dose-resposta + AR(1)/correção de RTM
//   (Beaven–Hutson: E[pós−pré|nulo] = (1−ρ)·(média_pré − média_pop)).
//
// O doc fixa a FORMA da correção (Beaven–Hutson), mas não fixa a FONTE de "média_pop"
// (população externa) — o projeto não tem infra de controle externo no Tier 1 (isso é
// Tier 1.5/2, decisão do dono ainda não implementada aqui). Na ausência de população
// externa, adotamos o Beaven–Hutson clássico (regression toward the subject's own
// long-run mean): populationMean = média da série COMBINADA pré+pós, usada como proxy
// do nível "verdadeiro" do sujeito antes da seleção; baselineMean = média da série pré
// (o valor que sofreu seleção, ex.: "fundo do vale").
//
// CONVENÇÃO DE SINAL (nota de implementação): a forma textual do doc é
// `E[pós−pré|nulo] = (1−ρ)·(média_pré − média_pop)`, isto é, RTM_esperada =
// (1-ρ)·(baselineMean - populationMean). Só que sob RTM pura (vale abaixo da média de
// longo prazo, sujeito reverte pra cima sem efeito real do app), baselineMean <
// populationMean → esse termo fica NEGATIVO, e `rawDelta - RTM_esperada` aumentaria a
// magnitude do delta em vez de reduzi-la — o oposto do que "corrigir RTM" significa.
// A literatura clássica de Beaven–Hutson define a reversão ESPERADA com o sinal
// invertido: RTM_esperada = (1-ρ)·(populationMean - baselineMean) — POSITIVA quando o
// baseline está abaixo da população, empurrando a correção na direção certa
// (correctedDelta = rawDelta - RTM_esperada encolhe em direção a 0 no caso de vale
// puro). Implementamos com esse sinal (verificado numericamente: ver
// rtmCorrection.test.ts, cenário "vale + reversão", que EXIGE
// |correctedDelta| < |rawDelta|). Resultado classificado como "sugestivo,
// não-identificado" — NUNCA como prova de eficácia (postura oficial: falsificar, não
// provar; ver docs/specs/falsification-protocol-DECISION.md).
//
// INGREDIENTE NÃO-CAUSAL. NUNCA expor correctedDelta como "efeito comprovado do app".

// Estima o coeficiente de autocorrelação de lag-1 (ρ) de uma série. Guarda: séries
// curtas (n<3) não sustentam uma estimativa confiável de autocorrelação → 0 (sem
// correção de RTM aplicável, equivale a assumir ausência de reversão).
export function estimateLag1Autocorrelation(series: number[]): number {
  const n = series.length;
  if (n < 3) {
    return 0;
  }

  let sum = 0;
  for (let i = 0; i < n; i += 1) {
    const value = series[i];
    if (value === undefined) {
      return 0;
    }
    sum += value;
  }
  const mean = sum / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i += 1) {
    const value = series[i];
    if (value === undefined) {
      return 0;
    }
    const centered = value - mean;
    denominator += centered * centered;
    if (i < n - 1) {
      const next = series[i + 1];
      if (next === undefined) {
        return 0;
      }
      numerator += centered * (next - mean);
    }
  }

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

function mean(series: number[]): number {
  if (series.length === 0) {
    return 0;
  }
  let sum = 0;
  for (const value of series) {
    sum += value;
  }
  return sum / series.length;
}

export type RtmCorrectionResult = {
  rawDelta: number; // média(pós) - média(pré), sem correção — sujeito a RTM.
  correctedDelta: number; // rawDelta corrigido pela RTM esperada sob H0 (Beaven–Hutson).
  rho: number; // autocorrelação lag-1 estimada da série pré (ρ).
};

// Aplica a correção de Beaven–Hutson: RTM esperada sob H0 = (1-ρ)·(populationMean -
// baselineMean) (ver nota de convenção de sinal no topo do arquivo). Como não há
// população externa no Tier 1, populationMean = média da série COMBINADA pré+pós (proxy
// do nível de longo prazo do sujeito). correctedDelta = rawDelta - RTM_esperada.
export function correctRtm(preSeries: number[], postSeries: number[]): RtmCorrectionResult {
  const preMean = mean(preSeries);
  const postMean = mean(postSeries);
  const rawDelta = postMean - preMean;

  const rho = estimateLag1Autocorrelation(preSeries);

  // populationMean = média da série combinada pré+pós (proxy na ausência de controle
  // externo — Tier 1; futuro Tier 1.5/2 substitui por uma média populacional real sem
  // mudar a assinatura da função). baselineMean = média da própria janela pré, que é o
  // valor sujeito à seleção (ex.: "fundo do vale" antes da adoção).
  const populationMean = mean([...preSeries, ...postSeries]);
  const baselineMean = preMean;
  const expectedRtm = (1 - rho) * (populationMean - baselineMean);

  const correctedDelta = rawDelta - expectedRtm;

  return { rawDelta, correctedDelta, rho };
}
