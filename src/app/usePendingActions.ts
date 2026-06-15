import { useCallback, type Dispatch, type SetStateAction } from 'react';
import {
  buildPuzzleThemeStats,
  generatePlan,
  type DailyPlan,
  type LearnerProfile,
  type TrainingLog,
  type Weakness,
} from '../domain';
import type { DiplomaAttempt, PendingTrainingItem } from '../domain/method/types';
import { getTrainingLog, savePendingItem, savePlan, updatePendingItemStatus } from '../infra/storage/appData';
import { openExternalUrl } from './externalOpen';
import { buildPlanContext, getLichessThemeFromUrl, toSessionMinutes, upsertPendingItem } from './stateHelpers';
import { suggestPendingFromHardFeedback } from './trainingLogFlow';

export type UsePendingActionsInput = {
  pendingItems: PendingTrainingItem[];
  profile: LearnerProfile | undefined;
  todayPlan: DailyPlan | undefined;
  trainingLogs: TrainingLog[];
  weaknesses: Weakness[];
  diplomaAttempts: DiplomaAttempt[];
  setPendingItems: Dispatch<SetStateAction<PendingTrainingItem[]>>;
  setTodayPlan: Dispatch<SetStateAction<DailyPlan | undefined>>;
  setLichessMessage: Dispatch<SetStateAction<string | undefined>>;
  setErrorMessage: Dispatch<SetStateAction<string | undefined>>;
};

export function usePendingActions(input: UsePendingActionsInput) {
  const openPendingItem = useCallback(
    (item: PendingTrainingItem): Promise<void> => {
      if (item.lichessUrl === undefined) {
        input.setLichessMessage('Pendência registrada, mas ainda sem link Lichess.');
        return Promise.resolve();
      }

      input.setLichessMessage(openExternalUrl(item.lichessUrl) ?? 'Pendência aberta no Lichess.');
      return Promise.resolve();
    },
    [input],
  );

  const deferPendingItem = useCallback(
    async (item: PendingTrainingItem) => {
      await updatePendingItemStatus(item.id, 'deferred');

      const nextPendingItems = input.pendingItems.filter((pendingItem) => pendingItem.id !== item.id);

      input.setPendingItems(nextPendingItems);

      if (input.profile !== undefined && input.todayPlan !== undefined) {
        const recentThemeStats = buildPuzzleThemeStats(input.trainingLogs);
        const nextPlan = generatePlan(
          input.profile,
          input.weaknesses,
          toSessionMinutes(input.todayPlan.sessionMinutes, input.profile.defaultSessionMinutes),
          input.todayPlan.date,
          buildPlanContext({
            previousPlan: input.todayPlan,
            recentThemeStats,
            trainingLogs: input.trainingLogs,
            pendingItems: nextPendingItems,
            diplomaAttempts: input.diplomaAttempts,
          }),
        );

        await savePlan(nextPlan);
        input.setTodayPlan(nextPlan);
      }

      input.setLichessMessage('Pendência adiada.');
    },
    [input],
  );

  const savePendingFromHardFeedback = useCallback(
    async (blockId: string) => {
      if (input.todayPlan === undefined) {
        return;
      }

      const block = input.todayPlan.blocks.find((planBlock) => planBlock.id === blockId);

      if (block?.weaknessTag === undefined || block.methodTrackId === undefined) {
        input.setErrorMessage('Não consegui criar pendência para este bloco.');
        return;
      }

      const log = await getTrainingLog(`${input.todayPlan.date}:${blockId}`);

      if (log === undefined) {
        input.setErrorMessage('Conclua o bloco antes de guardar como pendência.');
        return;
      }

      const item = await suggestPendingFromHardFeedback(
        log,
        block.weaknessTag,
        block.methodTrackId,
        getLichessThemeFromUrl(block.destination.url),
      );

      await savePendingItem(item);
      input.setPendingItems((current) => upsertPendingItem(current, item));
      input.setLichessMessage('Pendência guardada para revisão amanhã.');
      input.setErrorMessage(undefined);
    },
    [input],
  );

  return {
    openPendingItem,
    deferPendingItem,
    savePendingFromHardFeedback,
  };
}
