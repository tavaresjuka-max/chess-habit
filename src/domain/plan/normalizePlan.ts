import { normalizeDestination } from '../sources/destinations';
import type { DailyPlan } from '../types';

const openingPrinciplesVideoUrl = 'https://lichess.org/video?tags=beginner%2Fopening';
const openingPrinciplesLessonTask =
  'Assista uma aula curta de abertura e anote uma regra para testar na proxima partida: centro, desenvolvimento ou rei seguro.';

export function normalizePlanDestinations(plan: DailyPlan): DailyPlan {
  return {
    ...plan,
    blocks: plan.blocks.map((block) => {
      const destination = normalizeDestination(block.destination);
      const upgradedOpeningPrinciplesDestination =
        block.destination.url !== destination.url && destination.url === openingPrinciplesVideoUrl;

      return {
        ...block,
        destination,
        source: destination.source,
        task: upgradedOpeningPrinciplesDestination ? openingPrinciplesLessonTask : block.task,
      };
    }),
  };
}
