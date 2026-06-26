import { describe, expect, it } from 'vitest';

import { computeRatingSlopes } from './ratingSlopes';

// E2-descriptive: ingredientes DESCRITIVOS (slope/volume/span/densidade), NÃO-CAUSAIS.
// O contraste slopePos - slopePre é a armadilha de regressão-à-média (Tier 0) e NÃO é
// testado aqui como prova de eficácia — só verificamos o cálculo descritivo.
//
// Marco de adoção T = '2025-01-10'; janelas pre/pos de 10 dias cada:
//   pré [2024-12-31, 2025-01-10)  → inclui 2024-12-31 .. 2025-01-09
//   pós [2025-01-10, 2025-01-20]  → inclui 2025-01-10 .. 2025-01-20
const BASE_OPTIONS = {
  adoptionDate: '2025-01-10',
  preWindowDays: 10,
  posWindowDays: 10,
};

describe('computeRatingSlopes', () => {
  it('caso 1: slope pós positivo e pré chato (constante, slope ≈ 0)', () => {
    const series = [
      {
        perf: 'rapid',
        points: [
          { date: '2025-01-01', rating: 1500 },
          { date: '2025-01-05', rating: 1500 },
          { date: '2025-01-09', rating: 1500 },
          { date: '2025-01-10', rating: 1500 },
          { date: '2025-01-12', rating: 1502 },
          { date: '2025-01-14', rating: 1504 },
        ],
      },
    ];

    const result = computeRatingSlopes(series, BASE_OPTIONS);
    const rapid = result.find((s) => s.perf === 'rapid');

    // Pré chato: ratings constantes → slope 0 (não undefined: den ≠ 0, datas distintas).
    expect(rapid?.pre.slopePerDay).toBeCloseTo(0, 9);
    expect(rapid?.pre.n).toBe(3);
    expect(rapid?.pre.spanDays).toBe(8);
    expect(rapid?.pre.densityPerDay).toBeCloseTo(0.375, 9);

    // Pós subindo +1/dia → slope 1.
    expect(rapid?.pos.slopePerDay).toBeCloseTo(1, 9);
    expect(rapid?.pos.n).toBe(3);
    expect(rapid?.pos.spanDays).toBe(4);
    expect(rapid?.pos.densityPerDay).toBeCloseTo(0.75, 9);
  });

  it('caso 2: fronteira em T — ponto em T cai no pós, ponto em T-1 cai no pré', () => {
    const series = [
      {
        perf: 'blitz',
        points: [
          { date: '2025-01-09', rating: 1500 }, // T-1 → pré
          { date: '2025-01-10', rating: 1510 }, // T   → pós
        ],
      },
    ];

    const result = computeRatingSlopes(series, BASE_OPTIONS);
    const blitz = result.find((s) => s.perf === 'blitz');

    expect(blitz?.pre.n).toBe(1);
    expect(blitz?.pos.n).toBe(1);
  });

  it('caso 3: 1 ponto na janela → slope undefined, span 0, density 1', () => {
    const series = [
      {
        perf: 'classical',
        points: [{ date: '2025-01-05', rating: 1500 }],
      },
    ];

    const result = computeRatingSlopes(series, BASE_OPTIONS);
    const classical = result.find((s) => s.perf === 'classical');

    expect(classical?.pre.slopePerDay).toBeUndefined();
    expect(classical?.pre.n).toBe(1);
    expect(classical?.pre.spanDays).toBe(0);
    expect(classical?.pre.densityPerDay).toBe(1);

    // Pós sem pontos.
    expect(classical?.pos.n).toBe(0);
    expect(classical?.pos.slopePerDay).toBeUndefined();
  });

  it('caso 4: série vazia → []', () => {
    expect(computeRatingSlopes([], BASE_OPTIONS)).toEqual([]);
  });

  it('caso 5: todos os pontos na mesma data → slope undefined (span 0, den OLS 0)', () => {
    const series = [
      {
        perf: 'rapid',
        points: [
          { date: '2025-01-05', rating: 1500 },
          { date: '2025-01-05', rating: 1510 },
          { date: '2025-01-05', rating: 1520 },
        ],
      },
    ];

    const result = computeRatingSlopes(series, BASE_OPTIONS);
    const rapid = result.find((s) => s.perf === 'rapid');

    expect(rapid?.pre.slopePerDay).toBeUndefined();
    expect(rapid?.pre.n).toBe(3);
    expect(rapid?.pre.spanDays).toBe(0);
    expect(rapid?.pre.densityPerDay).toBe(3); // 3 / max(0, 1)
  });

  it('caso 6: pontos fora das duas janelas são excluídos das contagens', () => {
    const series = [
      {
        perf: 'rapid',
        points: [
          { date: '2024-12-15', rating: 1500 }, // mais velho que pré → fora
          { date: '2025-01-05', rating: 1500 }, // dentro do pré
          { date: '2025-01-15', rating: 1600 }, // dentro do pós
          { date: '2025-02-01', rating: 1700 }, // mais novo que pós → fora
        ],
      },
    ];

    const result = computeRatingSlopes(series, BASE_OPTIONS);
    const rapid = result.find((s) => s.perf === 'rapid');

    // Só o ponto dentro de cada janela conta.
    expect(rapid?.pre.n).toBe(1);
    expect(rapid?.pos.n).toBe(1);
  });

  it('caso 7: slope pré NEGATIVO — padrão descritivo do "fundo do vale" (RTM), nunca causal', () => {
    const series = [
      {
        perf: 'rapid',
        points: [
          { date: '2025-01-01', rating: 1600 },
          { date: '2025-01-05', rating: 1590 },
          { date: '2025-01-09', rating: 1580 },
        ],
      },
    ];

    const result = computeRatingSlopes(series, BASE_OPTIONS);
    const rapid = result.find((s) => s.perf === 'rapid');

    // Rating caindo −10 a cada 4 dias → slope = −2.5 rating/dia. Documenta o padrão da
    // armadilha (regressão-à-média): rótulo DESCRITIVO, nunca prova de eficácia.
    expect(rapid?.pre.slopePerDay).toBeLessThan(0);
    expect(rapid?.pre.slopePerDay).toBeCloseTo(-2.5, 9);
  });

  it('caso 8: adoptionDate inválida → [] (toDayNumber NaN dispara o guard)', () => {
    const series = [
      {
        perf: 'rapid',
        points: [{ date: '2025-01-05', rating: 1500 }],
      },
    ];

    expect(
      computeRatingSlopes(series, { ...BASE_OPTIONS, adoptionDate: 'nao-e-data' }),
    ).toEqual([]);
  });
});
