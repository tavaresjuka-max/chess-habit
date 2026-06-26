import { describe, expect, it } from 'vitest';

import { parseRatingHistory } from './ratingHistory';

describe('parseRatingHistory', () => {
  it('extrai só as categorias relevantes e converte pontos para ISO (amostra do SPEC)', () => {
    // Amostra do SPEC: Blitz com 2 pontos, Rapid com points: [], Classical com 1 ponto.
    const input = [
      { name: 'Blitz', points: [[2024, 0, 15, 1532], [2024, 1, 3, 1547]] },
      { name: 'Rapid', points: [] },
      { name: 'Classical', points: [[2024, 2, 9, 1610]] },
    ];

    const result = parseRatingHistory(input);

    // Rapid (vazio) descartado; só Blitz e Classical sobrevivem, na ordem de entrada.
    expect(result.map((series) => series.perf)).toEqual(['blitz', 'classical']);

    const blitz = result.find((series) => series.perf === 'blitz');
    expect(blitz?.points).toEqual([
      { date: '2024-01-15', rating: 1532 },
      { date: '2024-02-03', rating: 1547 },
    ]);

    const classical = result.find((series) => series.perf === 'classical');
    expect(classical?.points).toEqual([{ date: '2024-03-09', rating: 1610 }]);
  });

  it('converte mês 0-indexed para mês+1 no ISO (0=jan, 11=dez)', () => {
    const result = parseRatingHistory([{ name: 'Blitz', points: [[2024, 11, 31, 1600]] }]);

    expect(result).toEqual([
      {
        perf: 'blitz',
        points: [{ date: '2024-12-31', rating: 1600 }],
      },
    ]);
  });

  it('descarta categorias irrelevantes (bullet, correspondence, variantes)', () => {
    const result = parseRatingHistory([
      { name: 'Bullet', points: [[2024, 0, 1, 1500]] },
      { name: 'Correspondence', points: [[2024, 0, 1, 1500]] },
      { name: 'UltraBullet', points: [[2024, 0, 1, 1500]] },
      { name: 'CrazyHouse', points: [[2024, 0, 1, 1500]] },
      { name: 'Blitz', points: [[2024, 0, 1, 1500]] },
    ]);

    expect(result.map((series) => series.perf)).toEqual(['blitz']);
  });

  it('descarta categoria relevante com points: []', () => {
    const result = parseRatingHistory([
      { name: 'Rapid', points: [] },
      { name: 'Blitz', points: [[2024, 0, 1, 1500]] },
    ]);

    expect(result.map((series) => series.perf)).toEqual(['blitz']);
  });

  it('retorna [] para input vazio sem throw', () => {
    expect(parseRatingHistory([])).toEqual([]);
  });

  it('degrada sem throw quando a entrada é malformada', () => {
    // Ponto com menos de 4 números → ponto ignorado, categoria cai se ficar vazia.
    const pontosParcialmenteInvalidos = parseRatingHistory([
      { name: 'Blitz', points: [[2024, 0, 15], [2024, 1, 3, 1547]] },
    ]);
    expect(pontosParcialmenteInvalidos).toEqual([
      {
        perf: 'blitz',
        points: [{ date: '2024-02-03', rating: 1547 }],
      },
    ]);

    // Todos os pontos inválidos → categoria inteira descartada (não vira série vazia).
    const todosInvalidos = parseRatingHistory([
      { name: 'Blitz', points: [[2024, 0], [2024]] },
    ]);
    expect(todosInvalidos).toEqual([]);

    // `points` não-array → categoria descartada.
    const pointsNaoArray = parseRatingHistory([
      { name: 'Blitz', points: null },
      { name: 'Classical', points: 'nope' },
      { name: 'Rapid', points: 42 },
    ]);
    expect(pointsNaoArray).toEqual([]);

    // Entrada topo não-array → [].
    expect(parseRatingHistory(null)).toEqual([]);
    expect(parseRatingHistory('xyz')).toEqual([]);
    expect(parseRatingHistory({ name: 'Blitz' })).toEqual([]);

    // Entrada com shape não-objeto / sem name → ignorada.
    expect(parseRatingHistory([null, 42, 'str', { points: [[2024, 0, 1, 1500]] }])).toEqual([]);
  });
});
