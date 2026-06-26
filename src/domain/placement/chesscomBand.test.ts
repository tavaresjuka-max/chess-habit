import { describe, expect, it } from 'vitest';

import { bandFromChesscomRating } from './chesscomBand';
import { bandFromEstimate } from './placement';

// P1: o rating do Chess.com corre ~150 pts acima do Lichess em força comparável.
// A banda é derivada de bandFromEstimate(rating - OFFSET); OFFSET = 150 (provisório).
const OFFSET = 150;

describe('bandFromChesscomRating', () => {
  it('deriva a banda do rapid não-provisório, convertendo à escala Lichess', () => {
    const result = bandFromChesscomRating({ rapid: { rating: 1500 } });

    expect(result).toBeDefined();
    // OFFSET fixado em número literal: regressão que mude o offset falha aqui.
    expect(result?.estimate).toBe(1500 - OFFSET);
    // Contrato: banda Chess.com = banda Lichess do rating convertido.
    expect(result?.band).toBe(bandFromEstimate(1500 - OFFSET));
    expect(result?.confidence).toBe('high');
    expect(result?.source).toBe('rapid');
  });

  it('prefere rapid a blitz quando ambos são não-provisórios', () => {
    const result = bandFromChesscomRating({
      rapid: { rating: 1600 },
      blitz: { rating: 1900 },
    });

    expect(result?.source).toBe('rapid');
    expect(result?.estimate).toBe(1600 - OFFSET);
  });

  it('cai para blitz quando rapid é provisório', () => {
    const result = bandFromChesscomRating({
      rapid: { rating: 1700, provisional: true },
      blitz: { rating: 1300 },
    });

    expect(result?.source).toBe('blitz');
    expect(result?.estimate).toBe(1300 - OFFSET);
    expect(result?.band).toBe(bandFromEstimate(1300 - OFFSET));
  });

  it('usa blitz quando rapid está ausente', () => {
    const result = bandFromChesscomRating({ blitz: { rating: 1100 } });

    expect(result?.source).toBe('blitz');
    expect(result?.estimate).toBe(1100 - OFFSET);
  });

  it('cobre a espinha 0-2400 com a conversão aplicada', () => {
    for (const rating of [500, 900, 1200, 1500, 1800, 2100, 2400]) {
      const result = bandFromChesscomRating({ rapid: { rating } });
      expect(result?.band).toBe(bandFromEstimate(rating - OFFSET));
    }
  });

  it('retorna undefined quando todos os perfis são provisórios', () => {
    const result = bandFromChesscomRating({
      rapid: { rating: 1500, provisional: true },
      blitz: { rating: 1400, provisional: true },
    });

    expect(result).toBeUndefined();
  });

  it('retorna undefined para input vazio', () => {
    expect(bandFromChesscomRating({})).toBeUndefined();
  });
});
