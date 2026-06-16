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
  const {
    diplomaAttempts,
    pendingItems,
    profile,
    todayPlan,
    trainingLogs,
    weaknesses,
    setErrorMessage,
    setLichessMessage,
    setPendingItems,
    setTodayPlan,
  } = input;

  const openPendingItem = useCallback(
    (item: PendingTrainingItem): Promise<void> => {
      if (item.lichessUrl === undefined) {
        setLichessMessage('Pendência registrada, mas ainda sem link Lichess.');
        return Promise.resolve();
      }

      setLichessMessage(openExternalUrl(item.lichessUrl) ?? 'Pendência aberta no Lichess.');
      return Promise.resolve();
    },
    [setLichessMessage],
  );

  const deferPendingItem = useCallback(
    async (item: PendingTrainingItem) => {
      await updatePendingItemStatus(item.id, 'deferred');

      const nextPendingItems = pendingItems.filter((pendingItem) => pendingItem.id !== item.id);

      setPendingItems(nextPendingItems);

      if (profile !== undefined && todayPlan !== undefined) {
        const recentThemeStats = buildPuzzleThemeStats(trainingLogs);
        const nextPlan = generatePlan(
          profile,
          weaknesses,
          toSessionMinutes(todayPlan.sessionMinutes, profile.defaultSessionMinutes),
          todayPlan.date,
          buildPlanContext({
            previousPlan: todayPlan,
            recentThemeStats,
            trainingLogs,
            pendingItems: nextPendingItems,
            diplomaAttempts,
          }),
        );

        await savePlan(nextPlan);
        setTodayPlan(nextPlan);
      }

      setLichessMessage('Pendência adiada.');
    },
    [
      diplomaAttempts,
      pendingItems,
      profile,
      setLichessMessage,
      setPendingItems,
      setTodayPlan,
      todayPlan,
      trainingLogs,
      weaknesses,
    ],
  );

  const savePendingFromHardFeedback = useCallback(
    async (blockId: string) => {
      if (todayPlan === undefined) {
        return;
      }

      const block = todayPlan.blocks.find((planBlock) => planBlock.id === blockId);

      if (block?.weaknessTag === undefined || block.methodTrackId === undefined) {
        setErrorMessage('Não consegui criar pendência para este bloco.');
        return;
      }

      const log = await getTrainingLog(`${todayPlan.date}:${blockId}`);

      if (log === undefined) {
        setErrorMessage('Conclua o bloco antes de guardar como pendência.');
        return;
      }

      const item = await suggestPendingFromHardFeedback(
        log,
        block.weaknessTag,
        block.methodTrackId,
        getLichessThemeFromUrl(block.destination.url),
      );

      await savePendingItem(item);
      setPendingItems((current) => upsertPendingItem(current, item));
      setLichessMessage('Pendência guardada para revisão amanhã.');
      setErrorMessage(undefined);
    },
    [setErrorMessage, setLichessMessage, setPendingItems, todayPlan],
  );

  return {
    openPendingItem,
    deferPendingItem,
    savePendingFromHardFeedback,
  };
}
