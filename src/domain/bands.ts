import type { LearnerBand } from './types';

// Spine 0-2200 aprovado pelo dono em 2026-06-10 (rodada 2): degraus menores no
// inicio (metas pequenas), referencia INTERNA de sequenciamento — nunca promessa
// de rating na UI ou comunicacao. Conteudo denso acima de 1200 e escopo do Corte 8.
export const learnerBands = [
  '0-400',
  '400-800',
  '800-1000',
  '1000-1200',
  '1200-1600',
  '1600-2000',
  '2000-2200',
  // Teto aspiracional (FM) — council 2026-06-24. Acima de 2200 o app vira mais
  // organizador de autoestudo; currículo desta faixa é esboço honesto.
  '2200-2400',
] as const satisfies readonly LearnerBand[];

export const beginnerBands = ['0-400', '400-800'] as const satisfies readonly LearnerBand[];

// Stage 1 do beta: faixas com currículo denso validado. 0-400 tem rota própria
// (orientação de iniciante absoluto, ITEM 3 da Fase 1); 1200+ é Corte 8, ainda
// vazio — o Onboarding oferece só estas três, e o Placement avisa + clampa.
export const betaEligibleBands = ['400-800', '800-1000', '1000-1200'] as const satisfies readonly LearnerBand[];

// Ate o Corte 8 (curriculo denso 1200-2200), as bandas altas reutilizam o
// conteudo improving existente em vez de ficarem sem recurso algum.
export const improvingAndUpBands = [
  '800-1000',
  '1000-1200',
  '1200-1600',
  '1600-2000',
  '2000-2200',
  '2200-2400',
] as const satisfies readonly LearnerBand[];

export function isLearnerBand(value: string): value is LearnerBand {
  return (learnerBands as readonly string[]).includes(value);
}

export function isBeginnerBand(band: LearnerBand | undefined): boolean {
  return band !== undefined && (beginnerBands as readonly string[]).includes(band);
}

// Banda de TETO (FM 2200-2400). Council 2026-06-24: acima de ~2200 o sinal local
// satura e o app não ensina tier novo — assume papel de organizador de autoestudo.
// A escada de ENSINO vai até 2200; esta banda é o teto explícito, não um tier falso.
export function isOrganizerCeilingBand(band: LearnerBand | undefined): boolean {
  return band === '2200-2400';
}

// Migracao dos perfis criados antes do spine: as bandas antigas eram '0-800' e
// '800-1200'. Sem placement ainda, mapeia para a metade inferior do intervalo
// antigo equivalente; o Placement v1 (Corte 3) refina depois.
export function migrateLegacyBand(value: string): LearnerBand {
  if (isLearnerBand(value)) {
    return value;
  }

  if (value === '0-800') {
    return '400-800';
  }

  return '800-1000';
}
