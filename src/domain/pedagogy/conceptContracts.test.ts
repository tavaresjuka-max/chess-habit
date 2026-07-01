import { describe, expect, it } from 'vitest';
import type { WeaknessTag } from '../types';
import { conceptContractByTag, conceptContracts, getConceptContract } from './conceptContracts';

const ALL_TAGS: readonly WeaknessTag[] = [
  'hanging-piece',
  'fork',
  'pin',
  'skewer',
  'discovered',
  'mate-in-1',
  'mate-in-2',
  'back-rank',
  'opening-principles',
  'time-trouble',
  'endgame-pawn',
  'endgame-rook',
  'conversion',
  'blunder-rate',
];

describe('conceptContracts', () => {
  it('cobre toda a união de WeaknessTag sem sobras nem faltas', () => {
    expect(conceptContracts.map((contract) => contract.id).sort()).toEqual([...ALL_TAGS].sort());
    expect(Object.keys(conceptContractByTag).sort()).toEqual([...ALL_TAGS].sort());
  });

  it('define um contrato pedagógico não vazio para cada conceito', () => {
    for (const tag of ALL_TAGS) {
      const contract = getConceptContract(tag);

      expect(contract.id).toBe(tag);
      expect(contract.title.trim().length).toBeGreaterThan(0);
      expect(contract.typicalError.trim().length).toBeGreaterThan(20);
      expect(contract.observableGoal.trim().length).toBeGreaterThan(20);
      expect(contract.scaffoldCue.trim().length).toBeGreaterThan(20);
      expect(contract.retrievalPrompt.trim().length).toBeGreaterThan(20);
      expect(contract.postAttemptReflection.trim().length).toBeGreaterThan(20);
      expect(contract.mastery.blindCorrectStreak).toBeGreaterThan(0);
      expect(contract.mastery.minAttempts).toBeGreaterThan(0);
      expect(contract.transfer.mixedBlindCorrectStreak).toBeGreaterThan(0);
      expect(contract.sourceInfluences.length).toBeGreaterThan(0);
      expect(contract.cleanRoomNote).toContain('sem copiar');
    }
  });

  it('referencia apenas pré-requisitos existentes', () => {
    const tags = new Set<WeaknessTag>(ALL_TAGS);

    for (const contract of conceptContracts) {
      for (const prerequisite of contract.prerequisiteTags) {
        expect(tags.has(prerequisite), `${contract.id} -> ${prerequisite}`).toBe(true);
      }
    }
  });
});
