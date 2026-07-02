import { describe, expect, it } from 'vitest';
import type { WeaknessTag } from '../types';
import { conceptContractByTag, conceptContracts, getConceptContract, type ConceptContract } from './conceptContracts';

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

// cont-3 (2026-07-02): dicas de discriminação para pares classicamente
// confundíveis (pin×skewer, fork×discovered, mate-in-1×mate-in-2,
// back-rank×mate-in-2, hanging-piece×blunder-rate).
describe('conceptContracts — discriminationCue (cont-3)', () => {
  const tags = new Set<WeaknessTag>(ALL_TAGS);
  const allContracts: readonly ConceptContract[] = conceptContracts;
  const withCue = allContracts.filter(
    (contract): contract is ConceptContract & { discriminationCue: NonNullable<ConceptContract['discriminationCue']> } =>
      contract.discriminationCue !== undefined,
  );

  it('todo confusedWith aponta para um weaknessTag existente', () => {
    for (const contract of withCue) {
      expect(
        tags.has(contract.discriminationCue.confusedWith),
        `${contract.id} -> discriminationCue.confusedWith='${contract.discriminationCue.confusedWith}'`,
      ).toBe(true);
    }
  });

  it('ao menos 5 nós têm discriminationCue não-vazio, em voz própria (sem jargão em inglês)', () => {
    expect(withCue.length).toBeGreaterThanOrEqual(5);

    for (const contract of withCue) {
      const cue = contract.discriminationCue.cue;
      expect(cue.trim().length, `${contract.id}.discriminationCue.cue`).toBeGreaterThan(20);
    }
  });

  it('cobre os pares pedidos: pin×skewer (os dois sentidos), fork×discovered, mate-in-1×mate-in-2, back-rank×mate-in-2, hanging-piece×blunder-rate', () => {
    const pairs = new Set(
      withCue.map((contract) => `${contract.id}->${contract.discriminationCue.confusedWith}`),
    );

    expect(pairs.has('pin->skewer')).toBe(true);
    expect(pairs.has('skewer->pin')).toBe(true);
    expect(pairs.has('fork->discovered') || pairs.has('discovered->fork')).toBe(true);
    expect(pairs.has('mate-in-1->mate-in-2') || pairs.has('mate-in-2->mate-in-1')).toBe(true);
    expect(pairs.has('back-rank->mate-in-2') || pairs.has('mate-in-2->back-rank')).toBe(true);
    expect(pairs.has('hanging-piece->blunder-rate') || pairs.has('blunder-rate->hanging-piece')).toBe(true);
  });

  it('não copia texto de livro: cue é curto (1-2 frases) e não repete verbatim o typicalError/observableGoal', () => {
    for (const contract of withCue) {
      const cue = contract.discriminationCue.cue;
      expect(cue).not.toBe(contract.typicalError);
      expect(cue).not.toBe(contract.observableGoal);
      // 1-2 frases: no máximo 2 pontos finais de frase (permite reticências/abreviações raras).
      const sentenceCount = cue.split('.').filter((chunk: string) => chunk.trim().length > 0).length;
      expect(sentenceCount).toBeLessThanOrEqual(3);
    }
  });
});
