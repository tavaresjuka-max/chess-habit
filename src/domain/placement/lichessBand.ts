import type { Confidence, LearnerBand } from '../types';
import { bandFromEstimate } from './placement';

// M2a: ordem de preferência FIXA mata o empate ambíguo (B1) — não usa contagem
// de games para escolher. Rapid > Blitz > Classical, primeiro não-provisório vence.
const GAME_PREFERENCE = ['rapid', 'blitz', 'classical'] as const;

type RatingPerf = {
  rating: number;
  games: number;
  provisional?: boolean;
};

export type LichessGameRatingsInput = {
  rapid?: RatingPerf;
  blitz?: RatingPerf;
  classical?: RatingPerf;
};

export type LichessBandResult = {
  band: LearnerBand;
  confidence: Confidence;
  reasons: string[];
  estimate: number;
  source: (typeof GAME_PREFERENCE)[number];
};

// DD2/DD3: SÓ rating de JOGO. Sem puzzle como número, sem offset, sem limiar
// arbitrário de games. Gate de confiabilidade = `prov !== true` (Glicko já
// codifica RD/provisoriedade). DD4 (só sobe) é aplicado pelo chamador.
export function bandFromLichessGameRatings(input: LichessGameRatingsInput): LichessBandResult | undefined {
  for (const key of GAME_PREFERENCE) {
    const perf = input[key];

    if (perf !== undefined && perf.provisional !== true) {
      return {
        band: bandFromEstimate(perf.rating),
        confidence: 'high',
        reasons: [`Seu rating de ${key} no Lichess.`],
        estimate: perf.rating,
        source: key,
      };
    }
  }

  return undefined;
}
