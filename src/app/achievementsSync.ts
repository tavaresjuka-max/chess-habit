import { evaluateAchievements, type Achievement, type TrainingLog } from '../domain';
import {
  loadAchievements,
  loadDonePendingItems,
  loadPlacementCompletion,
  saveAchievements,
} from '../infra/storage/appData';

// Avalia conquistas contra o Dexie (fonte de verdade), grava as novas e
// devolve a lista completa em ordem de desbloqueio.
export async function syncAchievements(logs: TrainingLog[]): Promise<Achievement[]> {
  const [donePendingItems, unlocked, placement] = await Promise.all([
    loadDonePendingItems(),
    loadAchievements(),
    loadPlacementCompletion(),
  ]);
  const newlyUnlocked = evaluateAchievements({
    logs,
    donePendingItems,
    unlocked,
    now: new Date().toISOString(),
    ...(placement === undefined ? {} : { placement }),
  });

  if (newlyUnlocked.length > 0) {
    await saveAchievements(newlyUnlocked);
  }

  return [...unlocked, ...newlyUnlocked].sort((left, right) => left.unlockedAt.localeCompare(right.unlockedAt));
}
