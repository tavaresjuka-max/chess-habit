import type { Signal, WeaknessTag } from '../types';

export type TutorQuestionAnswer = 'time' | 'calculation' | 'loose-piece';

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

export function createTutorQuestionSignal(answer: TutorQuestionAnswer, observedAt: string): Signal {
  const mapped = tutorQuestionAnswerByValue[answer];

  return {
    source: 'outro',
    confidence: 'medium',
    observedAt,
    value: {
      kind: 'manual',
      tag: mapped.tag,
      note: mapped.note,
    },
  };
}

const manualNoteByTag = {
  fork: 'Sinal manual: vale testar garfos e ganho de material em treino curto.',
  'hanging-piece': 'Sinal manual: vale testar seguranca de pecas e capturas simples.',
  discovered: 'Sinal manual: vale testar ataques descobertos e cheque duplo.',
  'mate-in-2': 'Sinal manual: vale testar mates em 2 antes de subir volume.',
  'endgame-pawn': 'Sinal manual: vale testar finais de peões com revisão curta.',
} satisfies Record<(typeof knownWeaknessTags)[number], string>;

const tutorQuestionAnswerByValue = {
  time: {
    tag: 'time-trouble',
    note: 'Resposta ao Professor Tavarez: tempo pesou mais hoje; vale testar decisao mais simples antes de calcular.',
  },
  calculation: {
    tag: 'fork',
    note: 'Resposta ao Professor Tavarez: cálculo pesou mais hoje; usar táticas curtas como proxy de cálculo prático.',
  },
  'loose-piece': {
    tag: 'hanging-piece',
    note: 'Resposta ao Professor Tavarez: peca solta pesou mais hoje; priorizar checagem de defensores.',
  },
} satisfies Record<TutorQuestionAnswer, { tag: WeaknessTag; note: string }>;
