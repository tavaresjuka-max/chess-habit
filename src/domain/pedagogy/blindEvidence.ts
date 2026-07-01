import type { TrainingLog, WeaknessTag } from '../types';

export type BlindConceptEvidence = {
  conceptId: WeaknessTag;
  blindCorrectStreak: number;
  eligibleAttempts: number;
};

export function isStrongBlindEvidenceLog(log: TrainingLog): boolean {
  return (
    log.status === 'done' &&
    log.conceptContractId !== undefined &&
    log.isBlindAttempt === true &&
    log.hintWasVisible !== true &&
    log.platformThemeLeakRisk !== true &&
    log.feedback !== 'hard'
  );
}

export function buildBlindConceptEvidence(logs: TrainingLog[]): BlindConceptEvidence[] {
  const byConcept = new Map<WeaknessTag, { blindCorrectStreak: number; eligibleAttempts: number }>();
  const orderedLogs = [...logs].sort(
    (left, right) =>
      (left.completedAt ?? left.updatedAt).localeCompare(right.completedAt ?? right.updatedAt) ||
      left.id.localeCompare(right.id),
  );

  for (const log of orderedLogs) {
    const conceptId = log.conceptContractId;

    if (conceptId === undefined || log.status !== 'done') {
      continue;
    }

    const entry = byConcept.get(conceptId) ?? { blindCorrectStreak: 0, eligibleAttempts: 0 };

    if (isStrongBlindEvidenceLog(log)) {
      entry.blindCorrectStreak += 1;
      entry.eligibleAttempts += 1;
    } else if (log.isBlindAttempt === true && log.feedback === 'hard') {
      entry.blindCorrectStreak = 0;
    }

    byConcept.set(conceptId, entry);
  }

  return [...byConcept.entries()]
    .map(([conceptId, entry]) => ({ conceptId, ...entry }))
    .sort((left, right) => right.eligibleAttempts - left.eligibleAttempts || left.conceptId.localeCompare(right.conceptId));
}

export function getBlindConceptEvidence(logs: TrainingLog[], conceptId: WeaknessTag): BlindConceptEvidence {
  return (
    buildBlindConceptEvidence(logs).find((entry) => entry.conceptId === conceptId) ?? {
      conceptId,
      blindCorrectStreak: 0,
      eligibleAttempts: 0,
    }
  );
}
