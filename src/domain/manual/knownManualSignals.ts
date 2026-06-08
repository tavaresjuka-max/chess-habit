import type { Signal, WeaknessTag } from '../types';

const knownWeaknessTags = ['fork', 'hanging-piece', 'discovered', 'mate-in-2', 'endgame-pawn'] satisfies WeaknessTag[];

export function createKnownManualSignals(observedAt: string): Signal[] {
  return knownWeaknessTags.map((tag) => ({
    source: 'outro',
    confidence: 'medium',
    observedAt,
    value: {
      kind: 'manual',
      tag,
      note: manualNoteByTag[tag],
    },
  }));
}

const manualNoteByTag = {
  fork: 'Sinal manual: vale testar garfos e ganho de material em treino curto.',
  'hanging-piece': 'Sinal manual: vale testar segurança de peças e capturas simples.',
  discovered: 'Sinal manual: vale testar ataques descobertos e cheque duplo.',
  'mate-in-2': 'Sinal manual: vale testar mates em 2 antes de subir volume.',
  'endgame-pawn': 'Sinal manual: vale testar finais de peões com revisão curta.',
} satisfies Record<(typeof knownWeaknessTags)[number], string>;
