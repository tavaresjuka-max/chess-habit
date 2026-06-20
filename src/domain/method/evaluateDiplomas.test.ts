import { describe, expect, it } from 'vitest';
import type { SkillMapEntry } from '../metrics/progressOverview';
import { applyDiplomaProgress, evaluateDiplomaSections, mergeDiplomaAttempts } from './evaluateDiplomas';
import type { DiplomaAttempt } from './types';

const NOW = '2026-06-19T12:00:00.000Z';

function entry(theme: string, attempts: number, wins: number): SkillMapEntry {
  return { theme, attempts, wins, accuracyPercent: attempts === 0 ? 0 : Math.round((wins / attempts) * 100) };
}

describe('evaluateDiplomaSections', () => {
  it('grava as duas seções do Peão como passed quando acurácia e volume batem', () => {
    const evaluated = evaluateDiplomaSections([entry('hangingPiece', 30, 27), entry('mateIn1', 30, 24)], [], NOW);

    expect(evaluated.find((attempt) => attempt.sectionId === 'valor-pecas')).toMatchObject({
      id: 'peao:valor-pecas',
      diplomaId: 'peao',
      scorePercent: 90,
      totalItems: 30,
      passed: true,
      source: 'lichess',
    });
    expect(evaluated.find((attempt) => attempt.sectionId === 'mates-basicos')).toMatchObject({
      scorePercent: 80,
      totalItems: 30,
      passed: true,
    });
  });

  it('reprova por volume insuficiente (menos de 30 puzzles)', () => {
    const evaluated = evaluateDiplomaSections([entry('hangingPiece', 10, 10)], [], NOW);

    expect(evaluated.find((attempt) => attempt.sectionId === 'valor-pecas')).toMatchObject({
      scorePercent: 100,
      totalItems: 10,
      passed: false,
    });
  });

  it('reprova por acurácia abaixo de 80%', () => {
    const evaluated = evaluateDiplomaSections([entry('hangingPiece', 30, 20)], [], NOW);

    expect(evaluated.find((attempt) => attempt.sectionId === 'valor-pecas')).toMatchObject({
      scorePercent: 67,
      passed: false,
    });
  });

  it('soma temas no pool da seção (fork+pin+skewer)', () => {
    const evaluated = evaluateDiplomaSections([entry('fork', 12, 11), entry('pin', 10, 9), entry('skewer', 10, 8)], [], NOW);

    expect(evaluated.find((attempt) => attempt.sectionId === 'tatica-rotulada')).toMatchObject({
      totalItems: 32,
      scorePercent: 88,
      passed: true,
    });
  });

  it('não emite attempt para seção sem dado do tema', () => {
    const evaluated = evaluateDiplomaSections([entry('hangingPiece', 30, 30)], [], NOW);

    expect(evaluated.find((attempt) => attempt.sectionId === 'mates-basicos')).toBeUndefined();
  });

  it('não regride uma seção já conquistada quando a janela do dashboard piora', () => {
    const existing: DiplomaAttempt[] = [
      {
        id: 'peao:valor-pecas',
        diplomaId: 'peao',
        sectionId: 'valor-pecas',
        scorePercent: 90,
        totalItems: 30,
        passed: true,
        source: 'lichess',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      },
    ];

    // Janela rola e mostra acurácia/volume piores; a seção conquistada é pulada
    // (não re-emitida) e segue passed via mergeDiplomaAttempts.
    const evaluated = evaluateDiplomaSections([entry('hangingPiece', 30, 10)], existing, NOW);

    expect(evaluated.find((item) => item.id === 'peao:valor-pecas')).toBeUndefined();
    expect(mergeDiplomaAttempts(existing, evaluated).find((item) => item.id === 'peao:valor-pecas')?.passed).toBe(true);
  });

  it('preserva createdAt de attempt existente e atualiza updatedAt', () => {
    const existing: DiplomaAttempt[] = [
      {
        id: 'peao:valor-pecas',
        diplomaId: 'peao',
        sectionId: 'valor-pecas',
        scorePercent: 50,
        totalItems: 5,
        passed: false,
        source: 'lichess',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      },
    ];

    const valor = evaluateDiplomaSections([entry('hangingPiece', 30, 27)], existing, NOW).find(
      (attempt) => attempt.id === 'peao:valor-pecas',
    );

    expect(valor?.createdAt).toBe('2026-06-01T00:00:00.000Z');
    expect(valor?.updatedAt).toBe(NOW);
  });
});

describe('mergeDiplomaAttempts', () => {
  it('faz upsert por id mantendo os demais', () => {
    const existing: DiplomaAttempt[] = [
      attempt({ id: 'peao:valor-pecas', sectionId: 'valor-pecas', passed: false }),
      attempt({ id: 'legado', diplomaId: 'rei', sectionId: 'abertura-principios', source: 'local' }),
    ];
    const evaluated: DiplomaAttempt[] = [attempt({ id: 'peao:valor-pecas', sectionId: 'valor-pecas', passed: true })];

    const merged = mergeDiplomaAttempts(existing, evaluated);

    expect(merged).toHaveLength(2);
    expect(merged.find((item) => item.id === 'peao:valor-pecas')?.passed).toBe(true);
    expect(merged.find((item) => item.id === 'legado')).toBeDefined();
  });
});

describe('applyDiplomaProgress', () => {
  it('promove a banda quando o diploma da banda atual é conquistado', () => {
    const outcome = applyDiplomaProgress([entry('hangingPiece', 30, 27), entry('mateIn1', 30, 27)], [], '400-800', NOW);

    expect(outcome.bandChanged).toBe(true);
    expect(outcome.promotedBand).toBe('800-1000');
    // hangingPiece também alimenta Torre/seguranca-material, então avalia-se mais de
    // duas seções; o que importa é que as duas do Peão fecharam.
    expect(outcome.evaluated.filter((item) => item.diplomaId === 'peao' && item.passed)).toHaveLength(2);
  });

  it('não promove quando o diploma não fecha (só uma seção)', () => {
    const outcome = applyDiplomaProgress([entry('hangingPiece', 30, 27)], [], '400-800', NOW);

    expect(outcome.bandChanged).toBe(false);
    expect(outcome.promotedBand).toBe('400-800');
  });
});

function attempt(overrides: Partial<DiplomaAttempt>): DiplomaAttempt {
  return {
    id: 'peao:valor-pecas',
    diplomaId: 'peao',
    sectionId: 'valor-pecas',
    scorePercent: 90,
    totalItems: 30,
    passed: true,
    source: 'lichess',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}
