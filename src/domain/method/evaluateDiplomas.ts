import type { SkillMapEntry } from '../metrics/progressOverview';
import type { LearnerBand } from '../types';
import { promoteBandForDiplomas } from './bandProgression';
import { DIPLOMAS } from './diplomas';
import type { DiplomaAttempt } from './types';

// Open Decision #1 (2026-06-19): a partir da acurácia por tema do Lichess
// (buildSkillMap), grava um DiplomaAttempt idempotente por seção mensurável e
// compõe a promoção de banda já existente. Funções puras: a camada app injeta
// nowIso e cuida da persistência/estado.

export function evaluateDiplomaSections(
  skillMap: SkillMapEntry[],
  existing: DiplomaAttempt[],
  nowIso: string,
): DiplomaAttempt[] {
  const byTheme = new Map(skillMap.map((entry) => [entry.theme, entry]));
  const evaluated: DiplomaAttempt[] = [];

  for (const diploma of DIPLOMAS) {
    for (const section of diploma.sections) {
      if (section.kind !== 'accuracy' || section.lichessThemes === undefined) {
        continue;
      }

      let attempts = 0;
      let wins = 0;

      for (const theme of section.lichessThemes) {
        const entry = byTheme.get(theme);

        if (entry !== undefined) {
          attempts += entry.attempts;
          wins += entry.wins;
        }
      }

      // Sem nenhum puzzle do tema: seção fica não-tentada (não grava attempt).
      if (attempts === 0) {
        continue;
      }

      const scorePercent = Math.round((wins / attempts) * 100);
      const passed = attempts >= (section.minAttempts ?? 0) && scorePercent >= (section.accuracyTarget ?? 0);
      const id = `${diploma.id}:${section.id}`;
      const prior = existing.find((attempt) => attempt.id === id);

      evaluated.push({
        id,
        diplomaId: diploma.id,
        sectionId: section.id,
        scorePercent,
        totalItems: attempts,
        passed,
        source: 'lichess',
        createdAt: prior?.createdAt ?? nowIso,
        updatedAt: nowIso,
      });
    }
  }

  return evaluated;
}

export function mergeDiplomaAttempts(existing: DiplomaAttempt[], evaluated: DiplomaAttempt[]): DiplomaAttempt[] {
  const byId = new Map(existing.map((attempt) => [attempt.id, attempt]));

  for (const attempt of evaluated) {
    byId.set(attempt.id, attempt);
  }

  return [...byId.values()];
}

export type DiplomaProgressOutcome = {
  evaluated: DiplomaAttempt[];
  nextAttempts: DiplomaAttempt[];
  promotedBand: LearnerBand;
  bandChanged: boolean;
};

export function applyDiplomaProgress(
  skillMap: SkillMapEntry[],
  existing: DiplomaAttempt[],
  currentBand: LearnerBand,
  nowIso: string,
): DiplomaProgressOutcome {
  const evaluated = evaluateDiplomaSections(skillMap, existing, nowIso);
  const nextAttempts = mergeDiplomaAttempts(existing, evaluated);
  const promotedBand = promoteBandForDiplomas(currentBand, nextAttempts);

  return { evaluated, nextAttempts, promotedBand, bandChanged: promotedBand !== currentBand };
}
