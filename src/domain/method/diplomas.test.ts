import { describe, expect, it } from 'vitest';
import type { DiplomaAttempt } from './types';
import { DIPLOMAS, getDiploma, getDiplomaProgress, getRecentlyEarnedDiploma, isDiplomaPassed } from './diplomas';

describe('diplomas', () => {
  it('defines the three local checkpoints', () => {
    expect(DIPLOMAS.map((diploma) => diploma.id)).toEqual(['peao', 'torre', 'rei']);
  });

  it('uses 90 percent as the Peão threshold', () => {
    expect(getDiploma('peao')?.threshold).toBe(90);
  });

  it('does not pass a diploma without attempts', () => {
    expect(isDiplomaPassed([], 'peao')).toBe(false);
  });

  it('passes when every section reaches the diploma threshold', () => {
    expect(
      isDiplomaPassed(
        [
          createAttempt({ sectionId: 'coordenadas', scorePercent: 95 }),
          createAttempt({ sectionId: 'valor-pecas', scorePercent: 90 }),
          createAttempt({ sectionId: 'mates-basicos', scorePercent: 100 }),
        ],
        'peao',
      ),
    ).toBe(true);
  });

  it('returns section progress with passed flags', () => {
    const progress = getDiplomaProgress(
      [
        createAttempt({ sectionId: 'coordenadas', scorePercent: 95 }),
        createAttempt({ sectionId: 'valor-pecas', scorePercent: 80 }),
      ],
      'peao',
    );

    expect(progress).not.toBeNull();
    expect(progress?.sections).toEqual([
      expect.objectContaining({ id: 'coordenadas', scorePercent: 95, passed: true, attempted: true }),
      expect.objectContaining({ id: 'valor-pecas', scorePercent: 80, passed: false, attempted: true }),
      expect.objectContaining({ id: 'mates-basicos', scorePercent: 0, passed: false, attempted: false }),
    ]);
    expect(progress?.overallPassed).toBe(false);
  });

  it('detecta diploma conquistado dentro da janela recente', () => {
    const attempts = [
      createAttempt({ sectionId: 'coordenadas', scorePercent: 95, createdAt: '2026-06-14T10:00:00.000Z' }),
      createAttempt({ sectionId: 'valor-pecas', scorePercent: 92, createdAt: '2026-06-14T10:00:00.000Z' }),
      createAttempt({ sectionId: 'mates-basicos', scorePercent: 100, createdAt: '2026-06-14T10:00:00.000Z' }),
    ];

    expect(getRecentlyEarnedDiploma(attempts, '2026-06-15T10:00:00.000Z')).toBe('peao');
  });

  it('ignora diploma conquistado fora da janela de dias', () => {
    const attempts = [
      createAttempt({ sectionId: 'coordenadas', scorePercent: 95, createdAt: '2026-05-01T10:00:00.000Z' }),
      createAttempt({ sectionId: 'valor-pecas', scorePercent: 92, createdAt: '2026-05-01T10:00:00.000Z' }),
      createAttempt({ sectionId: 'mates-basicos', scorePercent: 100, createdAt: '2026-05-01T10:00:00.000Z' }),
    ];

    expect(getRecentlyEarnedDiploma(attempts, '2026-06-15T10:00:00.000Z')).toBeUndefined();
  });

  it('não retorna diploma ainda não concluído', () => {
    const attempts = [
      createAttempt({ sectionId: 'coordenadas', scorePercent: 95, createdAt: '2026-06-14T10:00:00.000Z' }),
      createAttempt({ sectionId: 'valor-pecas', scorePercent: 50, createdAt: '2026-06-14T10:00:00.000Z' }),
    ];

    expect(getRecentlyEarnedDiploma(attempts, '2026-06-15T10:00:00.000Z')).toBeUndefined();
  });
});

function createAttempt(overrides: Partial<DiplomaAttempt>): DiplomaAttempt {
  return {
    id: `attempt-${overrides.sectionId ?? 'section'}`,
    diplomaId: 'peao',
    sectionId: 'coordenadas',
    scorePercent: 90,
    totalItems: 10,
    passed: true,
    source: 'local',
    createdAt: '2026-06-10T10:00:00.000Z',
    updatedAt: '2026-06-10T10:00:00.000Z',
    ...overrides,
  };
}
