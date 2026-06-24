import { learnerBands } from '../bands';
import type { Confidence, LearnerBand } from '../types';

// Placement v1 (Corte 3): questionario curto + rating conhecido opcional +
// calibracao externa por puzzles no Lichess (autorrelato ou leitura puzzle:read).
// A banda e organizacao interna de conteudo; a UI nunca promete rating.

export type PlacementExperience =
  | 'nunca-joguei'
  | 'sei-as-regras'
  | 'jogo-casual'
  | 'jogo-online-regular'
  | 'jogo-competitivo';

export type PlacementTactics =
  | 'nao-sei-nomear'
  | 'reconheco-basicos'
  | 'resolvo-rotineiro'
  | 'resolvo-avancado';

export type PlacementEndgames =
  | 'nao-sei-mate-simples'
  | 'sei-mates-basicos'
  | 'sei-finais-peao'
  | 'sei-finais-torre';

export type PlacementAnswers = {
  experience: PlacementExperience;
  tactics: PlacementTactics;
  endgames: PlacementEndgames;
  knownRating?: number;
};

export type PlacementCalibrationReport =
  | 'quase-todos'
  | 'mais-da-metade'
  | 'menos-da-metade'
  | 'quase-nenhum';

export type PlacementCalibration = {
  report: PlacementCalibrationReport;
  source: 'self-report' | 'lichess';
};

export type PlacementResult = {
  band: LearnerBand;
  confidence: Confidence;
  reasons: string[];
  calibrationTheme: string;
};

const experienceScore: Record<PlacementExperience, number> = {
  'nunca-joguei': 150,
  'sei-as-regras': 300,
  'jogo-casual': 600,
  'jogo-online-regular': 900,
  'jogo-competitivo': 1300,
};

const tacticsScore: Record<PlacementTactics, number> = {
  'nao-sei-nomear': 0,
  'reconheco-basicos': 100,
  'resolvo-rotineiro': 250,
  'resolvo-avancado': 450,
};

const endgamesScore: Record<PlacementEndgames, number> = {
  'nao-sei-mate-simples': 0,
  'sei-mates-basicos': 100,
  'sei-finais-peao': 200,
  'sei-finais-torre': 350,
};

// Tema de calibracao por banda hipotetica: dificil o bastante para separar,
// facil o bastante para nao frustrar.
const calibrationThemeByBand: Record<LearnerBand, string> = {
  '0-400': 'mateIn1',
  '400-800': 'hangingPiece',
  '800-1000': 'fork',
  '1000-1200': 'mateIn2',
  '1200-1600': 'discoveredAttack',
  '1600-2000': 'quietMove',
  '2000-2200': 'quietMove',
  '2200-2400': 'quietMove',
};

export function bandFromEstimate(estimate: number): LearnerBand {
  for (const band of learnerBands) {
    const upper = Number(band.split('-')[1]);

    if (estimate < upper) {
      return band;
    }
  }

  return learnerBands[learnerBands.length - 1] ?? '2000-2200';
}

export function computePlacement(answers: PlacementAnswers): PlacementResult {
  const questionnaireEstimate =
    experienceScore[answers.experience] + tacticsScore[answers.tactics] + endgamesScore[answers.endgames];

  const reasons: string[] = [];
  let estimate = questionnaireEstimate;
  let confidence: Confidence = 'low';

  reasons.push('Suas respostas sobre experiência, tática e finais.');

  if (answers.knownRating !== undefined && answers.knownRating > 0) {
    // Rating online conhecido pesa mais que o questionario, sem dominar sozinho.
    estimate = Math.round(answers.knownRating * 0.7 + questionnaireEstimate * 0.3);
    confidence = 'medium';
    reasons.push('O rating online que você informou.');
  }

  const band = bandFromEstimate(estimate);

  return {
    band,
    confidence,
    reasons,
    calibrationTheme: calibrationThemeByBand[band],
  };
}

const bandShift: Record<PlacementCalibrationReport, number> = {
  'quase-todos': 1,
  'mais-da-metade': 0,
  'menos-da-metade': -1,
  'quase-nenhum': -2,
};

export function applyCalibration(result: PlacementResult, calibration: PlacementCalibration): PlacementResult {
  const currentIndex = learnerBands.indexOf(result.band);
  const nextIndex = Math.min(Math.max(currentIndex + bandShift[calibration.report], 0), learnerBands.length - 1);
  const band = learnerBands[nextIndex] ?? result.band;

  const confidence: Confidence =
    calibration.source === 'lichess' || result.confidence !== 'low' ? 'high' : 'medium';

  const reasons = [
    ...result.reasons,
    calibration.source === 'lichess'
      ? 'Seu resultado real nos puzzles de calibração do Lichess.'
      : 'Sua autoavaliação nos puzzles de calibração.',
  ];

  return {
    band,
    confidence,
    reasons,
    calibrationTheme: calibrationThemeByBand[band],
  };
}

export function describePlacementConfidence(confidence: Confidence): string {
  switch (confidence) {
    case 'high':
      return 'confiança alta';
    case 'medium':
      return 'confiança média';
    case 'low':
      return 'confiança baixa — calibrar com puzzles melhora a sugestão';
  }
}
