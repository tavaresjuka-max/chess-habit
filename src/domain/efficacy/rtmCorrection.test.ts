import { describe, expect, it } from 'vitest';

import { correctRtm, estimateLag1Autocorrelation } from './rtmCorrection';

// Ver docs/specs/e2e4-efficacy-methodology-DECISION.md — Tier 1 (AR(1)/correção de RTM,
// Beaven–Hutson). INGREDIENTE NÃO-CAUSAL: estes testes verificam só a matemática da
// correção, não afirmam eficácia do app (postura: falsificar, não provar).

// PRNG determinístico sem dependência nova (mulberry32). Mesmo padrão de "sem dep extra"
// pedido no escopo: gerador seedado, reprodutível, 32 bits de estado.
function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Amostra normal-padrão via Box-Muller a partir do PRNG seedado (determinístico dado o
// mesmo seed/sequência de chamadas).
function gaussian(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-12); // evita log(0)
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Gera uma série AR(1) estacionária: value_t = mu + rho*(value_{t-1} - mu) + ruído.
function generateAr1Series(
  rng: () => number,
  n: number,
  rho: number,
  sigma: number,
  mu: number,
): number[] {
  const series: number[] = [];
  let prev = mu;
  for (let i = 0; i < n; i += 1) {
    const eps = gaussian(rng) * sigma;
    const value = mu + rho * (prev - mu) + eps;
    series.push(value);
    prev = value;
  }
  return series;
}

describe('estimateLag1Autocorrelation', () => {
  it('série curta (n<3) → 0 (guarda)', () => {
    expect(estimateLag1Autocorrelation([])).toBe(0);
    expect(estimateLag1Autocorrelation([1])).toBe(0);
    expect(estimateLag1Autocorrelation([1, 2])).toBe(0);
  });

  it('série constante (variância 0) → 0 (denominador 0, guarda)', () => {
    expect(estimateLag1Autocorrelation([5, 5, 5, 5])).toBe(0);
  });

  it('série alternando em torno da média → ρ fortemente negativo', () => {
    // Série finita e curta: os extremos (1º e último ponto) puxam ρ pra longe de -1
    // exato, mas o sinal e a magnitude forte confirmam a autocorrelação negativa.
    const series = [0, 10, 0, 10, 0, 10, 0, 10];
    const rho = estimateLag1Autocorrelation(series);
    expect(rho).toBeLessThan(-0.8);
    expect(rho).toBeGreaterThanOrEqual(-1.0001);
  });

  it('série linear crescente (tendência forte) → ρ alto e positivo', () => {
    const series = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const rho = estimateLag1Autocorrelation(series);
    expect(rho).toBeGreaterThanOrEqual(0.7);
    expect(rho).toBeLessThanOrEqual(1.0001);
  });
});

describe('correctRtm', () => {
  it('séries vazias → deltas 0, rho 0 (guardas de mean/autocorrelação)', () => {
    const result = correctRtm([], []);
    expect(result.rawDelta).toBe(0);
    expect(result.correctedDelta).toBe(0);
    expect(result.rho).toBe(0);
  });

  it('pré e pós idênticos, sem tendência → rawDelta 0 e correctedDelta 0', () => {
    const pre = [1500, 1500, 1500, 1500];
    const post = [1500, 1500, 1500, 1500];
    const result = correctRtm(pre, post);
    expect(result.rawDelta).toBeCloseTo(0, 9);
    expect(result.correctedDelta).toBeCloseTo(0, 9);
  });

  it('cenário "vale + reversão": baseline artificialmente baixo por seleção — correção ENCOLHE o delta', () => {
    // Pré é um vale (bem abaixo do nível de longo prazo do sujeito ~1500); pós reverte
    // pra cima sem NENHUM efeito real do app — pura regressão-à-média. A correção deve
    // reduzir a magnitude do delta observado (|correctedDelta| < |rawDelta|), puxando o
    // sinal em direção a "não há efeito".
    const pre = [1390, 1405, 1395, 1410, 1400, 1408, 1398, 1402];
    const post = [1505, 1495, 1510, 1490, 1500, 1508, 1492, 1503];

    const result = correctRtm(pre, post);

    expect(result.rawDelta).toBeGreaterThan(0);
    expect(Math.abs(result.correctedDelta)).toBeLessThan(Math.abs(result.rawDelta));
  });

  it('rho vem da série pré (não da pós): mudar só a pós não muda rho', () => {
    const pre = [1500, 1520, 1490, 1530, 1480, 1540];
    const rhoWithPostA = correctRtm(pre, [1600, 1610]).rho;
    const rhoWithPostB = correctRtm(pre, [1400, 1390, 1420]).rho;
    expect(rhoWithPostA).toBe(rhoWithPostB);
  });

  describe('property-test sob H0 pura (200 séries AR(1) sem efeito real, seed fixo)', () => {
    // H0: a série completa (pré+pós) é gerada por um único processo AR(1) estacionário,
    // sem NENHUM efeito de tratamento na transição pré→pós — toda diferença pré/pós é
    // ruído + RTM. Sob H0, a média dos correctedDelta ao longo de muitas séries deve
    // ficar perto de 0 (a correção não deve introduzir viés sistemático).
    const SEED = 42;
    const N_SERIES = 200;
    const RHO_TRUE = 0.5;
    const SIGMA = 30;
    const MU = 1500;
    const PRE_N = 10;
    const POS_N = 10;

    it('média dos correctedDelta fica dentro de ±10 pontos de 0', () => {
      const rng = mulberry32(SEED);
      let sumCorrected = 0;

      for (let s = 0; s < N_SERIES; s += 1) {
        const full = generateAr1Series(rng, PRE_N + POS_N, RHO_TRUE, SIGMA, MU);
        const pre = full.slice(0, PRE_N);
        const post = full.slice(PRE_N, PRE_N + POS_N);
        const { correctedDelta } = correctRtm(pre, post);
        sumCorrected += correctedDelta;
      }

      const avgCorrected = sumCorrected / N_SERIES;
      expect(Math.abs(avgCorrected)).toBeLessThan(10);
    });
  });
});
