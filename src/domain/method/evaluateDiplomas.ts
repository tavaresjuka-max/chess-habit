import { weaknessTagFromPuzzleTheme } from '../coach/puzzleThemeStats';
import type { SkillMapEntry } from '../metrics/progressOverview';
import type { BlindConceptEvidence } from '../pedagogy/blindEvidence';
import { getConceptContract } from '../pedagogy/conceptContracts';
import type { LearnerBand, WeaknessTag } from '../types';
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
  blindEvidence: BlindConceptEvidence[] = [],
): DiplomaAttempt[] {
  const byTheme = new Map(skillMap.map((entry) => [entry.theme, entry]));
  const blindEvidenceByConcept = new Map(blindEvidence.map((entry) => [entry.conceptId, entry]));
  const evaluated: DiplomaAttempt[] = [];

  for (const diploma of DIPLOMAS) {
    for (const section of diploma.sections) {
      if (section.kind !== 'accuracy' || section.lichessThemes === undefined) {
        continue;
      }

      const id = `${diploma.id}:${section.id}`;
      const prior = existing.find((attempt) => attempt.id === id);

      // Diploma conquistado não regride (igual à promoção de banda): uma vez
      // passed, a seção permanece earned mesmo que a janela de 30 dias do
      // dashboard piore. Pulamos a reavaliação; mergeDiplomaAttempts mantém o
      // attempt anterior.
      if (prior?.passed === true) {
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
      const blindEvidenceSummary = getSectionBlindEvidence(section.lichessThemes, blindEvidenceByConcept);
      const passesAccuracy = attempts >= (section.minAttempts ?? 0) && scorePercent >= (section.accuracyTarget ?? 0);
      // Fase 4 (SPEC blind-retrieval): com a flag, evidência cega vira gate ADICIONAL —
      // sem ela, comportamento idêntico ao anterior (só acurácia + volume).
      const passesBlindEvidence =
        section.requiresBlindEvidence !== true ||
        blindEvidenceSummary.blindEvidenceItems >= blindEvidenceSummary.blindEvidenceTarget;
      const passed = passesAccuracy && passesBlindEvidence;

      evaluated.push({
        id,
        diplomaId: diploma.id,
        sectionId: section.id,
        scorePercent,
        totalItems: attempts,
        passed,
        source: 'lichess',
        ...(blindEvidenceSummary.blindEvidenceItems === 0
          ? {}
          : { blindEvidenceItems: blindEvidenceSummary.blindEvidenceItems }),
        ...(blindEvidenceSummary.blindEvidenceTarget === 0
          ? {}
          : { blindEvidenceTarget: blindEvidenceSummary.blindEvidenceTarget }),
        createdAt: prior?.createdAt ?? nowIso,
        updatedAt: nowIso,
      });
    }
  }

  return evaluated;
}

function getSectionBlindEvidence(
  themes: readonly string[],
  blindEvidenceByConcept: ReadonlyMap<WeaknessTag, BlindConceptEvidence>,
): { blindEvidenceItems: number; blindEvidenceTarget: number } {
  const conceptIds = new Set<WeaknessTag>();

  for (const theme of themes) {
    const conceptId = weaknessTagFromPuzzleTheme(theme);

    if (conceptId !== undefined) {
      conceptIds.add(conceptId);
    }
  }

  let blindEvidenceItems = 0;
  let blindEvidenceTarget = 0;

  for (const conceptId of conceptIds) {
    blindEvidenceItems += blindEvidenceByConcept.get(conceptId)?.eligibleAttempts ?? 0;
    blindEvidenceTarget += getConceptContract(conceptId).mastery.blindCorrectStreak;
  }

  return { blindEvidenceItems, blindEvidenceTarget };
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
  blindEvidence: BlindConceptEvidence[] = [],
): DiplomaProgressOutcome {
  const evaluated = evaluateDiplomaSections(skillMap, existing, nowIso, blindEvidence);
  const nextAttempts = mergeDiplomaAttempts(existing, evaluated);
  const promotedBand = promoteBandForDiplomas(currentBand, nextAttempts);

  return { evaluated, nextAttempts, promotedBand, bandChanged: promotedBand !== currentBand };
}
