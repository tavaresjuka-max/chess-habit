import type { Confidence } from './types';

export const confidenceRank: Record<Confidence, number> = {
  low: 0,
  medium: 1,
  high: 2,
} satisfies Record<Confidence, number>;
