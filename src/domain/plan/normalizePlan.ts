import { normalizeDestination } from '../sources/destinations';
import type { DailyPlan } from '../types';

export function normalizePlanDestinations(plan: DailyPlan): DailyPlan {
  return {
    ...plan,
    blocks: plan.blocks.map((block) => {
    const destination = normalizeDestination(block.destination);

    return {
      ...block,
      destination,
      source: destination.source,
    };
    }),
  };
}
