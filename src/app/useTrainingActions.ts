import { useCallback, type Dispatch, type SetStateAction } from 'react';
import {
  buildPuzzleThemeStats,
  completeTrainingLog,
  createTrainingLog,
  ensureTrainingLogKind,
  generatePlan,
  skipTrainingLog,
  type Achievement,
  type DailyPlan,
  type LearnerProfile,
  type PlanBlock,
  type PlanBlockFeedback,
  type TrainingLog,
  type Weakness,
} from '../domain';
import {
  advancePendingItem,
  masteryTargetFromCompletedLog,
  themeAccuracyFromCompletedLog,
} from '../domain/method';
import type { DiplomaAttempt, PendingTrainingItem } from '../domain/method/types';
import {
  getTrainingLog,
  savePendingItem,
  savePlan,
  saveTrainingLog,
  saveTrainingLogAndPlan,
} from '../infra/storage/appData';
import { syncAchievements } from './achievementsSync';
import { buildPlanContext, toSessionMinutes } from './stateHelpers';
import { reconcileLogIfPossible, upsertTrainingLog } from './trainingLogFlow';

export type UseTrainingActionsInput = {
  allTrainingLogs: TrainingLog[];
  diplomaAttempts: DiplomaAttempt[];
  pendingItems: PendingTrainingItem[];
  profile: LearnerProfile | undefined;
  todayPlan: DailyPlan | undefined;
  trainingLogs: TrainingLog[];
  weaknesses: Weakness[];
  setAchievements: Dispatch<SetStateAction<Achievement[]>>;
  setAllTrainingLogs: Dispatch<SetStateAction<TrainingLog[]>>;
  setErrorMessage: Dispatch<SetStateAction<string | undefined>>;
  setLichessMessage: Dispatch<SetStateAction<string | undefined>>;
  setPendingItems: Dispatch<SetStateAction<PendingTrainingItem[]>>;
  setTodayPlan: Dispatch<SetStateAction<DailyPlan | undefined>>;
  setTrainingLogs: Dispatch<SetStateAction<TrainingLog[]>>;
};

export function useTrainingActions(input: UseTrainingActionsInput) {
  const {
    allTrainingLogs,
    diplomaAttempts,
    pendingItems,
    profile,
    todayPlan,
    trainingLogs,
    weaknesses,
    setAchievements,
    setAllTrainingLogs,
    setErrorMessage,
    setLichessMessage,
    setPendingItems,
    setTodayPlan,
    setTrainingLogs,
  } = input;

  const startBlockTraining = useCallback(
    async (block: PlanBlock) => {
      if (todayPlan === undefined) {
        return;
      }

      const existingLog = await getTrainingLog(`${todayPlan.date}:${block.id}`);

      // Reabrir um bloco ja concluido apenas reabre o destino: nao recria um log
      // active que apagaria o treino concluido anterior.
      if (existingLog?.status !== 'done') {
        const startedAt = new Date().toISOString();
        const log = createTrainingLog({
          block,
          date: todayPlan.date,
          startedAt,
        });

        await saveTrainingLog(log);
        setTrainingLogs(upsertTrainingLog(trainingLogs, log));
        setAllTrainingLogs(upsertTrainingLog(allTrainingLogs, log));
      }
    },
    [allTrainingLogs, todayPlan, trainingLogs],
  );

  const updateBlockStatusWithTrainingLog = useCallback(
    async (blockId: string, status: PlanBlock['status'], feedback?: PlanBlockFeedback) => {
      if (todayPlan === undefined) {
        return;
      }

      const updatedAt = new Date().toISOString();
      const existingLog = await getTrainingLog(`${todayPlan.date}:${blockId}`);

      const nextPlan: DailyPlan = {
        ...todayPlan,
        blocks: todayPlan.blocks.map((block) =>
          block.id === blockId
            ? {
                ...block,
                status,
                ...(feedback === undefined ? {} : { feedback }),
                updatedAt,
              }
            : block,
        ),
      };

      if (status === 'done') {
        const block = todayPlan.blocks.find((planBlock) => planBlock.id === blockId);

        if (block !== undefined) {
          const baseLog =
            existingLog ??
            createTrainingLog({
              block,
              date: todayPlan.date,
              startedAt: updatedAt,
            });
          const typedLog = ensureTrainingLogKind(baseLog, block);
          const completedLog = completeTrainingLog({
            log: typedLog,
            completedAt: updatedAt,
            feedback,
          });
          const reconcileOutcome = await reconcileLogIfPossible(completedLog);
          const nextTrainingLogs = upsertTrainingLog(trainingLogs, reconcileOutcome.log);
          const nextAllTrainingLogs = upsertTrainingLog(allTrainingLogs, reconcileOutcome.log);

          // Log e plano numa transação só: o bloco "done" e o log que o comprova
          // nunca divergem se o app fechar no meio (J3 — durabilidade).
          await saveTrainingLogAndPlan(reconcileOutcome.log, nextPlan);
          let finalPlan = nextPlan;

          if (block.pendingItemId !== undefined) {
            const pendingItem = pendingItems.find((item) => item.id === block.pendingItemId);

            if (pendingItem !== undefined) {
              const masteryInput = {
                lichessTheme: pendingItem.lichessTheme,
                themeStats: reconcileOutcome.log.result?.themeStats,
                lastFeedback: pendingItem.lastFeedback,
                currentFeedback: feedback,
                attempts: pendingItem.attempts,
              };
              const masteryTarget = masteryTargetFromCompletedLog(masteryInput);
              const themeAccuracy = themeAccuracyFromCompletedLog(masteryInput);
              const advancedPendingItem = advancePendingItem(
                pendingItem,
                feedback,
                masteryTarget,
                themeAccuracy,
              );

              await savePendingItem(advancedPendingItem);

              const nextPendingItems =
                advancedPendingItem.status === 'open'
                  ? pendingItems.map((item) => (item.id === advancedPendingItem.id ? advancedPendingItem : item))
                  : pendingItems.filter((item) => item.id !== advancedPendingItem.id);

              setPendingItems(nextPendingItems);

              if (profile !== undefined) {
                const recentThemeStats = buildPuzzleThemeStats(nextTrainingLogs);

                finalPlan = generatePlan(
                  profile,
                  weaknesses,
                  toSessionMinutes(nextPlan.sessionMinutes, profile.defaultSessionMinutes),
                  nextPlan.date,
                  buildPlanContext({
                    previousPlan: nextPlan,
                    recentThemeStats,
                    trainingLogs: nextTrainingLogs,
                    pendingItems: nextPendingItems,
                    diplomaAttempts,
                  }),
                );
                await savePlan(finalPlan);
              }
            }
          }

          setTrainingLogs(nextTrainingLogs);
          setAllTrainingLogs(nextAllTrainingLogs);
          // Conquistas (Corte 7): avaliadas no fechamento de bloco, fonte de
          // verdade no Dexie; sem celebração visual, só registro sóbrio.
          setAchievements(await syncAchievements(nextAllTrainingLogs));
          setTodayPlan(finalPlan);
          setErrorMessage(undefined);

          if (reconcileOutcome.warning !== undefined) {
            setLichessMessage(reconcileOutcome.warning);
          }

          return;
        }
      }

      if (status === 'skipped' && existingLog !== undefined) {
        const skippedLog = skipTrainingLog({
          log: existingLog,
          skippedAt: updatedAt,
        });

        await saveTrainingLogAndPlan(skippedLog, nextPlan);
        setTrainingLogs(upsertTrainingLog(trainingLogs, skippedLog));
        setAllTrainingLogs(upsertTrainingLog(allTrainingLogs, skippedLog));
        setTodayPlan(nextPlan);
        setErrorMessage(undefined);

        return;
      }

      await savePlan(nextPlan);
      setTodayPlan(nextPlan);
      setErrorMessage(undefined);
    },
    [allTrainingLogs, diplomaAttempts, pendingItems, profile, todayPlan, trainingLogs, weaknesses],
  );

  const skipBlockTraining = useCallback(
    async (blockId: string) => {
      await updateBlockStatusWithTrainingLog(blockId, 'skipped');
    },
    [updateBlockStatusWithTrainingLog],
  );

  const completeBlockTraining = (blockId: string, feedback?: PlanBlockFeedback) =>
    updateBlockStatusWithTrainingLog(blockId, 'done', feedback);

  return {
    startBlockTraining,
    completeBlockTraining,
    skipBlockTraining,
  };
}
