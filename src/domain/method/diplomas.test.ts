import { describe, expect, it } from 'vitest';
import type { DiplomaAttempt } from './types';
import {
  DIPLOMAS,
  findDiplomaSectionForTheme,
  getDiploma,
  getDiplomaProgress,
  getRecentlyEarnedDiploma,
  isDiplomaPassed,
} from './diplomas';

describe('diplomas', () => {
  it('defines the three local checkpoints', () => {
    expect(DIPLOMAS.map((diploma) => diploma.id)).toEqual(['peao', 'torre', 'rei']);
  });

  it('uses 90 percent as the Peão threshold', () => {
    expect(getDiploma('peao')?.threshold).toBe(90);
  });

  it('liga um tema de puzzle à seção de diploma (findDiplomaSectionForTheme)', () => {
    const fork = findDiplomaSectionForTheme('fork');
    expect(fork?.diploma.id).toBe('torre');
    expect(fork?.section.id).toBe('tatica-rotulada');

    expect(findDiplomaSectionForTheme('mateIn1')?.section.id).toBe('mates-basicos');
    expect(findDiplomaSectionForTheme('tema-inexistente')).toBeUndefined();
  });

  it('mede o Peão por duas seções de acurácia (coordenadas saiu do gate)', () => {
    const peao = getDiploma('peao');

    expect(peao?.sections.map((section) => section.id)).toEqual(['valor-pecas', 'mates-basicos']);
    expect(peao?.sections.every((section) => section.kind === 'accuracy')).toBe(true);
    expect(peao?.sections.flatMap((section) => section.lichessThemes ?? [])).toEqual(['hangingPiece', 'mateIn1']);
  });

  it('does not pass a diploma without attempts', () => {
    expect(isDiplomaPassed([], 'peao')).toBe(false);
  });

  it('passa quando toda seção tem attempt com passed=true', () => {
    expect(
      isDiplomaPassed(
        [
          createAttempt({ sectionId: 'valor-pecas', passed: true }),
          createAttempt({ sectionId: 'mates-basicos', passed: true }),
        ],
        'peao',
      ),
    ).toBe(true);
  });

  it('reprova quando alguma seção não está passed, mesmo com scorePercent alto', () => {
    expect(
      isDiplomaPassed(
        [
          createAttempt({ sectionId: 'valor-pecas', scorePercent: 100, passed: false }),
          createAttempt({ sectionId: 'mates-basicos', passed: true }),
        ],
        'peao',
      ),
    ).toBe(false);
  });

  it('returns section progress with passed flags', () => {
    const progress = getDiplomaProgress(
      [
        createAttempt({ sectionId: 'valor-pecas', scorePercent: 90, passed: true }),
        createAttempt({ sectionId: 'mates-basicos', scorePercent: 60, passed: false }),
      ],
      'peao',
    );

    expect(progress).not.toBeNull();
    expect(progress?.sections).toEqual([
      expect.objectContaining({ id: 'valor-pecas', scorePercent: 90, passed: true, attempted: true }),
      expect.objectContaining({ id: 'mates-basicos', scorePercent: 60, passed: false, attempted: true }),
    ]);
    expect(progress?.overallPassed).toBe(false);
  });

  it('detecta diploma conquistado dentro da janela recente', () => {
    const attempts = [
      createAttempt({ sectionId: 'valor-pecas', passed: true, createdAt: '2026-06-14T10:00:00.000Z' }),
      createAttempt({ sectionId: 'mates-basicos', passed: true, createdAt: '2026-06-14T10:00:00.000Z' }),
    ];

    expect(getRecentlyEarnedDiploma(attempts, '2026-06-15T10:00:00.000Z')).toBe('peao');
  });

  it('ignora diploma conquistado fora da janela de dias', () => {
    const attempts = [
      createAttempt({ sectionId: 'valor-pecas', passed: true, createdAt: '2026-05-01T10:00:00.000Z' }),
      createAttempt({ sectionId: 'mates-basicos', passed: true, createdAt: '2026-05-01T10:00:00.000Z' }),
    ];

    expect(getRecentlyEarnedDiploma(attempts, '2026-06-15T10:00:00.000Z')).toBeUndefined();
  });

  it('não retorna diploma ainda não concluído', () => {
    const attempts = [
      createAttempt({ sectionId: 'valor-pecas', passed: true, createdAt: '2026-06-14T10:00:00.000Z' }),
    ];

    expect(getRecentlyEarnedDiploma(attempts, '2026-06-15T10:00:00.000Z')).toBeUndefined();
  });
});

function createAttempt(overrides: Partial<DiplomaAttempt>): DiplomaAttempt {
  return {
    id: `attempt-${overrides.sectionId ?? 'valor-pecas'}`,
    diplomaId: 'peao',
    sectionId: 'valor-pecas',
    scorePercent: 90,
    totalItems: 10,
    passed: true,
    source: 'local',
    createdAt: '2026-06-10T10:00:00.000Z',
    updatedAt: '2026-06-10T10:00:00.000Z',
    ...overrides,
  };
}
