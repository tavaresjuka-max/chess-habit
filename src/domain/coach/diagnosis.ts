import type { Confidence, Diagnosis, PuzzleThemeStats, Weakness, WeaknessTag } from '../types';

const confidenceRank: Record<Confidence, number> = { low: 0, medium: 1, high: 2 };
const MIN_SCORE = 0.5;

const causeByTag: Partial<Record<WeaknessTag, { message: string; procedure: string }>> = {
  'blunder-rate': {
    message: 'O padrão recente é deixar peça vulnerável antes da hora.',
    procedure: 'Antes do ataque, conte os defensores da peça que você quer mover.',
  },
  'time-trouble': {
    message: 'O relógio tem decidido partidas contra você.',
    procedure: 'Decida o plano em uma frase antes de calcular variantes.',
  },
  'opening-principles': {
    message: 'A abertura tem saído do trilho dos princípios.',
    procedure: 'Desenvolva as peças e proteja o rei antes de atacar.',
  },
  'hanging-piece': {
    message: 'Peça solta aparece antes de checar o tabuleiro inteiro.',
    procedure: 'Antes de mover, verifique o que está sem defensor dos dois lados.',
  },
  fork: {
    message: 'Garfos têm passado batido na sua visão.',
    procedure: 'Procure dois alvos do mesmo cavalo ou peão antes de calcular.',
  },
  pin: {
    message: 'Cravadas têm escapado do seu radar.',
    procedure: 'Antes de mover, veja se há peça presa contra o rei ou a dama.',
  },
  skewer: {
    message: 'Espetos têm sido difíceis de enxergar a tempo.',
    procedure: 'Cheque linhas onde a peça maior está na frente da menor.',
  },
  discovered: {
    message: 'Descobertas têm surpreendido você.',
    procedure: 'Antes de mover, veja qual peça atrás abre linha ao se mover.',
  },
  'back-rank': {
    message: 'A última fileira tem ficado frágil.',
    procedure: 'Confira escape do rei antes de afastar as torres.',
  },
};

const QUESTION_MESSAGE = 'O que pesou mais hoje: tempo, cálculo ou peça solta?';

export function diagnose(weaknesses: Weakness[], _puzzleThemeStats?: PuzzleThemeStats): Diagnosis {
  const primary = weaknesses[0];

  if (primary !== undefined && confidenceRank[primary.confidence] >= confidenceRank.medium && primary.score >= MIN_SCORE) {
    const cause = causeByTag[primary.tag];
    if (cause !== undefined) {
      return {
        kind: 'cause',
        weaknessTag: primary.tag,
        basis: 'aggregate',
        message: cause.message,
        procedure: cause.procedure,
      };
    }
  }

  return { kind: 'question', message: QUESTION_MESSAGE };
}
