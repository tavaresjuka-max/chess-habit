import type { Diagnosis, PuzzleThemeStat, PuzzleThemeStats, Weakness, WeaknessTag } from '../types';
import { confidenceRank } from '../confidence';
import { weaknessTagFromPuzzleTheme } from './puzzleThemeStats';

type PuzzleThemeCandidate = {
  stat: PuzzleThemeStat;
  weaknessTag: WeaknessTag;
  lossRate: number;
};

const MIN_SCORE = 0.5;
const MIN_PUZZLE_THEME_ATTEMPTS = 3;
const MIN_PUZZLE_THEME_LOSSES = 2;
const MIN_PUZZLE_THEME_LOSS_RATE = 0.5;

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

Object.assign(
  causeByTag,
  {
    'mate-in-1': {
      message: 'Mates imediatos ainda estão passando sem a varredura final.',
      procedure: 'Antes de calcular longo, cheque fuga, defesa e captura do rei.',
    },
    'mate-in-2': {
      message: 'Mates curtos pedem mais calma na primeira ameaça.',
      procedure: 'Veja a continuação antes de clicar no primeiro lance promissor.',
    },
    'endgame-pawn': {
      message: 'Finais de peões estão cobrando plano antes de cálculo.',
      procedure: 'Conte rei ativo, oposição e casa de promoção antes da corrida.',
    },
    'endgame-rook': {
      message: 'Finais de torre estão pedindo mais atividade e técnica.',
      procedure: 'Antes de defender, veja se a torre pode ficar ativa atrás do peão.',
    },
    conversion: {
      message: 'A vantagem aparece, mas a conversão ainda perde clareza.',
      procedure: 'Simplifique quando puder, ative peças e reduza o contra-jogo.',
    },
  } satisfies Partial<Record<WeaknessTag, { message: string; procedure: string }>>,
);

const QUESTION_MESSAGE = 'O que pesou mais hoje: tempo, cálculo ou peça solta?';

export function diagnose(weaknesses: Weakness[], puzzleThemeStats?: PuzzleThemeStats): Diagnosis {
  const puzzleThemeCause = diagnosePuzzleTheme(puzzleThemeStats);

  if (puzzleThemeCause !== undefined) {
    return puzzleThemeCause;
  }

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

function diagnosePuzzleTheme(puzzleThemeStats: PuzzleThemeStats | undefined): Diagnosis | undefined {
  if (puzzleThemeStats === undefined) {
    return undefined;
  }

  const [candidate] = puzzleThemeStats.themes
    .map((stat): PuzzleThemeCandidate | undefined => {
      const weaknessTag = weaknessTagFromPuzzleTheme(stat.theme);

      if (weaknessTag === undefined) {
        return undefined;
      }

      return {
        stat,
        weaknessTag,
        lossRate: stat.attempts === 0 ? 0 : stat.losses / stat.attempts,
      };
    })
    .filter((candidate): candidate is PuzzleThemeCandidate => candidate !== undefined)
    .filter(
      (candidate) =>
        candidate.stat.attempts >= MIN_PUZZLE_THEME_ATTEMPTS &&
        candidate.stat.losses >= MIN_PUZZLE_THEME_LOSSES &&
        candidate.lossRate >= MIN_PUZZLE_THEME_LOSS_RATE,
    )
    .sort(
      (left, right) =>
        right.stat.losses - left.stat.losses ||
        right.lossRate - left.lossRate ||
        right.stat.attempts - left.stat.attempts ||
        left.stat.theme.localeCompare(right.stat.theme),
    );

  if (candidate === undefined) {
    return undefined;
  }

  const cause = causeByTag[candidate.weaknessTag];

  if (cause === undefined) {
    return undefined;
  }

  const themeLabel = puzzleThemeLabelByTheme[candidate.stat.theme] ?? candidate.stat.theme;

  return {
    kind: 'cause',
    weaknessTag: candidate.weaknessTag,
    basis: 'puzzle-theme',
    message: `Nos puzzles conferidos, ${themeLabel} concentrou ${String(candidate.stat.losses)} erros em ${String(candidate.stat.attempts)} tentativas.`,
    procedure: cause.procedure,
  };
}

const puzzleThemeLabelByTheme: Partial<Record<string, string>> = {
  backRankMate: 'mate na última fileira',
  discoveredAttack: 'ataque descoberto',
  discoveredCheck: 'xeque descoberto',
  fork: 'garfos',
  hangingPiece: 'peças penduradas',
  mate: 'mates',
  mateIn1: 'mate em 1',
  mateIn2: 'mate em 2',
  pin: 'cravadas',
  skewer: 'espetos',
  advantage: 'vantagem',
  crushing: 'conversão de vantagem',
  defensiveMove: 'defesa precisa',
  capturingDefender: 'capturar defensor',
  deflection: 'desvio',
  pawnEndgame: 'finais de peões',
  advancedPawn: 'peão avançado',
  promotion: 'promoção',
  underPromotion: 'subpromoção',
  rookEndgame: 'finais de torre',
};
