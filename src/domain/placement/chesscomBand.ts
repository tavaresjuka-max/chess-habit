import type { Confidence, LearnerBand } from '../types';
import { bandFromEstimate } from './placement';

// P1: espelha lichessBand.ts. Rapid > Blitz, primeiro não-provisório vence.
// Bullet fica FORA: força mal estimada por bullet (ruidoso/inflado como proxy).
const GAME_PREFERENCE = ['rapid', 'blitz'] as const;

// Chess.com corre ~100-150 pts ACIMA do Lichess em força comparável. O OFFSET
// converte o rating Chess.com → equivalente Lichess ANTES de mapear a banda
// (bandFromEstimate é calibrado na escala Lichess). PROVISÓRIO — recalibrar com
// dado real do beta. Conservador de propósito (tende a SUB-colocar, não super):
// a banda SÓ SOBE (DD4, aplicada pelo chamador) e over-placement é pegajoso e nocivo.
const CHESSCOM_TO_LICHESS_OFFSET = 150;

type RatingPerf = {
  rating: number;
  games?: number;
  provisional?: boolean;
};

export type ChesscomGameRatingsInput = {
  rapid?: RatingPerf;
  blitz?: RatingPerf;
};

export type ChesscomBandResult = {
  band: LearnerBand;
  confidence: Confidence;
  reasons: string[];
  estimate: number; // já convertido para a escala Lichess (rating - OFFSET)
  source: (typeof GAME_PREFERENCE)[number];
};

// SÓ rating de JOGO verificado. Gate de confiabilidade = `provisional !== true`.
// A regra "só sobe" (pega a MAIOR banda) é aplicada pelo chamador, igual ao M2a Lichess.
export function bandFromChesscomRating(
  input: ChesscomGameRatingsInput,
): ChesscomBandResult | undefined {
  for (const key of GAME_PREFERENCE) {
    const perf = input[key];

    if (perf !== undefined && perf.provisional !== true) {
      const estimate = perf.rating - CHESSCOM_TO_LICHESS_OFFSET;
      return {
        band: bandFromEstimate(estimate),
        confidence: 'high',
        reasons: [`Seu rating de ${key} no Chess.com (ajustado à escala Lichess).`],
        estimate,
        source: key,
      };
    }
  }

  return undefined;
}
