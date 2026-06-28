import { describe, expect, it } from 'vitest';
import { betaEligibleBands, isLearnerBand, learnerBands, migrateLegacyBand } from './bands';

describe('learner bands spine 0-2200', () => {
  it('has 8 bands with smaller steps at the start (teto aspiracional FM 2200-2400)', () => {
    expect(learnerBands).toEqual([
      '0-400',
      '400-800',
      '800-1000',
      '1000-1200',
      '1200-1600',
      '1600-2000',
      '2000-2200',
      '2200-2400',
    ]);
  });

  it('validates band membership', () => {
    expect(isLearnerBand('800-1000')).toBe(true);
    expect(isLearnerBand('0-800')).toBe(false);
    expect(isLearnerBand('800-1200')).toBe(false);
  });

  it('migrates legacy bands to the new spine', () => {
    expect(migrateLegacyBand('0-800')).toBe('400-800');
    expect(migrateLegacyBand('800-1200')).toBe('800-1000');
    expect(migrateLegacyBand('1200-1600')).toBe('1200-1600');
    expect(migrateLegacyBand('desconhecida')).toBe('800-1000');
  });
});

describe('betaEligibleBands (Fase 1 — Stage 1 do beta)', () => {
  it('contém exatamente as 3 faixas com currículo denso validado', () => {
    expect(betaEligibleBands).toEqual(['400-800', '800-1000', '1000-1200']);
  });

  it('NÃO inclui 0-400 (rota própria) nem 1200+ (Corte 8, vazio)', () => {
    expect(betaEligibleBands).not.toContain('0-400');
    expect(betaEligibleBands).not.toContain('1200-1600');
    expect(betaEligibleBands).not.toContain('1600-2000');
  });
});
