import { learnerBands } from '../bands';
import type { LearnerBand } from '../types';
import { isDiplomaPassed } from './diplomas';
import type { DiplomaAttempt, DiplomaId } from './types';

// Banda alvo ao passar cada diploma (council 2026-06-19, H2): degrau, não salto.
// O aluno que passa o Peão (cobre 0-600) já viu material de 400-800 na preparação;
// promover para 800-1000 é o degrau natural, não repete faixa.
const TARGET_BAND_BY_DIPLOMA: Record<DiplomaId, LearnerBand> = {
  peao: '800-1000',
  torre: '1000-1200',
  rei: '1200-1600',
};

/** Qual diploma "gate" a banda atual. Bandas 1200+ ainda não têm diploma (council L1). */
export function diplomaForBand(band: LearnerBand): DiplomaId | undefined {
  switch (band) {
    case '0-400':
    case '400-800':
      return 'peao';
    case '800-1000':
      return 'torre';
    case '1000-1200':
      return 'rei';
    case '1200-1600':
    case '1600-2000':
    case '2000-2200':
      return undefined;
  }
}

export function targetBandForDiploma(diploma: DiplomaId): LearnerBand {
  return TARGET_BAND_BY_DIPLOMA[diploma];
}

function bandRank(band: LearnerBand): number {
  return learnerBands.indexOf(band);
}

/**
 * Promoção de banda (council 2026-06-19): se o diploma da banda atual foi
 * conquistado e a banda alvo é mais alta, sobe para ela. Sobe, nunca desce.
 * Função pura — a camada de app a chama após o generatePlan e persiste o perfil,
 * para a banda nova valer só no PRÓXIMO plano (mantém generatePlan como query).
 */
export function promoteBandForDiplomas(currentBand: LearnerBand, diplomaAttempts: DiplomaAttempt[]): LearnerBand {
  const diploma = diplomaForBand(currentBand);

  if (diploma === undefined || !isDiplomaPassed(diplomaAttempts, diploma)) {
    return currentBand;
  }

  const target = targetBandForDiploma(diploma);
  return bandRank(target) > bandRank(currentBand) ? target : currentBand;
}
