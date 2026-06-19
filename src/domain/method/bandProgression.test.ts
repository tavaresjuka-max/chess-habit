import { describe, expect, it } from 'vitest';
import { diplomaForBand, promoteBandForDiplomas, targetBandForDiploma } from './bandProgression';
import { DIPLOMAS } from './diplomas';
import type { DiplomaAttempt, DiplomaId } from './types';

function passedAttempts(diplomaId: DiplomaId): DiplomaAttempt[] {
  const diploma = DIPLOMAS.find((definition) => definition.id === diplomaId);

  if (diploma === undefined) {
    throw new Error(`Diploma desconhecido: ${diplomaId}`);
  }

  return diploma.sections.map((section, index) => ({
    id: `${diplomaId}-${section.id}`,
    diplomaId,
    sectionId: section.id,
    scorePercent: 100,
    totalItems: 10,
    passed: true,
    source: 'local' as const,
    createdAt: `2026-06-1${String(index)}T10:00:00.000Z`,
    updatedAt: `2026-06-1${String(index)}T10:00:00.000Z`,
  }));
}

describe('progressão de banda', () => {
  it('mapeia banda → diploma e diploma → banda alvo (degrau, não salto)', () => {
    expect(diplomaForBand('0-400')).toBe('peao');
    expect(diplomaForBand('400-800')).toBe('peao');
    expect(diplomaForBand('800-1000')).toBe('torre');
    expect(diplomaForBand('1000-1200')).toBe('rei');
    expect(diplomaForBand('1200-1600')).toBeUndefined();

    expect(targetBandForDiploma('peao')).toBe('800-1000');
    expect(targetBandForDiploma('torre')).toBe('1000-1200');
    expect(targetBandForDiploma('rei')).toBe('1200-1600');
  });

  it('promove ao passar o diploma da banda atual', () => {
    expect(promoteBandForDiplomas('400-800', passedAttempts('peao'))).toBe('800-1000');
    expect(promoteBandForDiplomas('800-1000', passedAttempts('torre'))).toBe('1000-1200');
    expect(promoteBandForDiplomas('1000-1200', passedAttempts('rei'))).toBe('1200-1600');
  });

  it('não promove sem o diploma da banda atual conquistado', () => {
    expect(promoteBandForDiplomas('400-800', [])).toBe('400-800');
    // Passar o Peão estando em 800-1000 (gateada pelo Torre) não muda nada.
    expect(promoteBandForDiplomas('800-1000', passedAttempts('peao'))).toBe('800-1000');
  });

  it('não promove nem rebaixa bandas sem diploma (1200+)', () => {
    expect(promoteBandForDiplomas('1200-1600', passedAttempts('rei'))).toBe('1200-1600');
  });
});
