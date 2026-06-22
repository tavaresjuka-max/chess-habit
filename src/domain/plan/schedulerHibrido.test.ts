/**
 * Testes do scheduler híbrido bloco→intercalado (D1-D6)
 * SPEC: docs/superpowers/specs/2026-06-22-scheduler-hibrido-bloco-intercalado-design.md
 *
 * AC1 — aquisição (explain/guided): revisao + transferencia usam só primário
 * AC2 — pós-aquisição (retrieval/transfer) + pool: revisao usa pool ≠ primário; transferencia mistura
 * AC3 — pool determinístico (least-recently-reviewed), ≤ 2 temas por sessão
 * AC4 — ping-pong guard: erros de pool não tornam tema de pool o primário do dia seguinte
 * AC5 — graduação: stage===transfer + acurácia ≥ 80 sobre ≥ 30 puzzles → gradua, próximo primário escolhido
 * AC6 — teto: tema primário há > 12 sessões sem graduar → força rotação
 * AC7 — aquecimento permanece âncora em qualquer estágio
 */

import { describe, expect, it } from 'vitest';
import type { LearnerProfile, TrainingLog } from '../types';
import {
  buildDiagnosticThemeStats,
  buildInterleavePool,
  isThemeGraduated,
  shouldForceRotation,
} from '../coach/puzzleThemeStats';
import { generatePlan } from './generatePlan';
import { ACQUISITION_STAGES, INTERLEAVE_STAGES, PRIMARY_SESSION_CEILING } from './schedulerConstants';

// ---------------------------------------------------------------------------
// Helpers de fixture
// ---------------------------------------------------------------------------

const baseProfile: LearnerProfile = {
  lichessUsername: 'jukasparov',
  band: '800-1000',
  defaultSessionMinutes: 15,
  goals: ['estudar com consistência'],
  updatedAt: '2026-06-22T00:00:00.000Z',
};

function makeLog(
  blockId: string,
  themeStats?: { theme: string; attempts: number; losses: number }[],
): TrainingLog {
  return {
    id: `log-${blockId}`,
    date: '2026-06-20',
    blockId,
    blockTitle: 'Teste',
    source: 'lichess',
    destinationLabel: 'Teste',
    plannedSeconds: 600,
    startedAt: '2026-06-20T10:00:00.000Z',
    timeLimitReached: false,
    status: 'done',
    updatedAt: '2026-06-20T10:10:00.000Z',
    result:
      themeStats && themeStats.length > 0
        ? {
            source: 'lichess',
            kind: 'puzzle-activity',
            fetchedAt: '2026-06-20T10:10:00.000Z',
            since: '2026-06-15T00:00:00.000Z',
            until: '2026-06-20T00:00:00.000Z',
            puzzles: themeStats.reduce((s, t) => s + t.attempts, 0),
            wins: themeStats.reduce((s, t) => s + (t.attempts - t.losses), 0),
            losses: themeStats.reduce((s, t) => s + t.losses, 0),
            themes: themeStats.map((t) => t.theme),
            themeStats,
          }
        : undefined,
  };
}

// ---------------------------------------------------------------------------
// Constantes (D5 / §5)
// ---------------------------------------------------------------------------

describe('scheduler híbrido — constantes exportadas (§5)', () => {
  it('ACQUISITION_STAGES contém explain e guided', () => {
    expect(ACQUISITION_STAGES).toContain('explain');
    expect(ACQUISITION_STAGES).toContain('guided');
  });

  it('INTERLEAVE_STAGES contém retrieval e transfer', () => {
    expect(INTERLEAVE_STAGES).toContain('retrieval');
    expect(INTERLEAVE_STAGES).toContain('transfer');
  });

  it('PRIMARY_SESSION_CEILING é 12', () => {
    expect(PRIMARY_SESSION_CEILING).toBe(12);
  });
});

// ---------------------------------------------------------------------------
// D5 — guarda do sinal diagnóstico (buildDiagnosticThemeStats)
// ---------------------------------------------------------------------------

describe('D5 — buildDiagnosticThemeStats (guarda do sinal)', () => {
  it('AC4: exclui logs de blocos -revisao do cômputo diagnóstico', () => {
    const logs = [
      // bloco diagnóstico: conta
      makeLog('2026-06-20-01-tema', [{ theme: 'fork', attempts: 5, losses: 4 }]),
      // bloco de pool em revisao: NÃO deve contar
      makeLog('2026-06-20-02-revisao', [{ theme: 'pin', attempts: 5, losses: 5 }]),
    ];

    const stats = buildDiagnosticThemeStats(logs);

    // 'pin' não deve aparecer — veio de -revisao (pool)
    const pinEntry = stats?.themes.find((t) => t.theme === 'pin');
    expect(pinEntry).toBeUndefined();

    // 'fork' deve aparecer — veio de -tema (diagnóstico)
    const forkEntry = stats?.themes.find((t) => t.theme === 'fork');
    expect(forkEntry).toBeDefined();
    expect(forkEntry?.losses).toBe(4);
  });

  it('AC4: exclui logs de blocos -transferencia do cômputo diagnóstico', () => {
    const logs = [
      makeLog('2026-06-20-01-tema', [{ theme: 'fork', attempts: 5, losses: 1 }]),
      // bloco de transferência misto: NÃO conta para diagnóstico
      makeLog('2026-06-20-03-transferencia', [{ theme: 'back-rank', attempts: 5, losses: 5 }]),
    ];

    const stats = buildDiagnosticThemeStats(logs);

    const backRankEntry = stats?.themes.find((t) => t.theme === 'back-rank');
    expect(backRankEntry).toBeUndefined();
  });

  it('AC4: inclui logs de blocos -aquecimento e -tema no cômputo diagnóstico', () => {
    const logs = [
      makeLog('2026-06-20-01-aquecimento', [{ theme: 'fork', attempts: 3, losses: 2 }]),
      makeLog('2026-06-20-02-tema', [{ theme: 'fork', attempts: 5, losses: 3 }]),
    ];

    const stats = buildDiagnosticThemeStats(logs);

    const forkEntry = stats?.themes.find((t) => t.theme === 'fork');
    expect(forkEntry).toBeDefined();
    expect(forkEntry?.losses).toBe(5); // 2 + 3
  });

  it('retorna undefined quando não há logs com themeStats', () => {
    const stats = buildDiagnosticThemeStats([makeLog('2026-06-20-01-tema')]);
    expect(stats).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// D1 — gate de intercalação por estágio (AC1 + AC7)
// ---------------------------------------------------------------------------

describe('D1 — gate de intercalação por estágio', () => {
  it('AC1: em estágio explain, -revisao usa só o tema primário (pool vazio)', () => {
    // themeStages[fork] = 'explain' → aquisição → sem intercalação
    const profile: LearnerProfile = {
      ...baseProfile,
      themeStages: { fork: 'explain' },
      graduatedThemes: [], // pool vazio
    };
    // 15 min é a sessão que contém um bloco de revisão (tema + revisao).
    const plan = generatePlan(
      profile,
      [{ tag: 'fork', score: 0.9, confidence: 'high', evidence: 'erros' }],
      15,
      '2026-06-22',
    );

    const revisao = plan.blocks.find((b) => b.id.endsWith('-revisao'));
    expect(revisao).toBeDefined();
    // Em aquisição, revisao usa tema primário
    expect(revisao?.weaknessTag).toBe('fork');
  });

  it('AC1: em estágio guided, -transferencia usa só o tema primário (pool vazio)', () => {
    const profile: LearnerProfile = {
      ...baseProfile,
      themeStages: { fork: 'guided' },
      graduatedThemes: [],
    };
    const plan = generatePlan(
      profile,
      [{ tag: 'fork', score: 0.9, confidence: 'high', evidence: 'erros' }],
      30,
      '2026-06-22',
    );

    const transferencia = plan.blocks.find((b) => b.id.endsWith('-transferencia'));
    expect(transferencia).toBeDefined();
    // Em aquisição, transferencia também usa tema primário
    expect(transferencia?.weaknessTag).toBe('fork');
  });

  it('AC7: -aquecimento permanece com weaknessTag blunder-rate em qualquer estágio', () => {
    // estágio retrieval (pós-aquisição) — aquecimento deve continuar sendo âncora
    const profile: LearnerProfile = {
      ...baseProfile,
      themeStages: { fork: 'retrieval' },
      graduatedThemes: ['pin'],
    };
    const plan = generatePlan(
      profile,
      [{ tag: 'fork', score: 0.9, confidence: 'high', evidence: 'erros' }],
      30,
      '2026-06-22',
    );

    const aquecimento = plan.blocks.find((b) => b.id.endsWith('-aquecimento'));
    expect(aquecimento).toBeDefined();
    expect(aquecimento?.weaknessTag).toBe('blunder-rate');
  });
});

// ---------------------------------------------------------------------------
// D2 — mapeamento por bloco (AC2)
// ---------------------------------------------------------------------------

describe('D2 — mapeamento por bloco (pós-aquisição com pool)', () => {
  it('AC2: em estágio retrieval com pool, -revisao usa tema do pool ≠ primário', () => {
    const profile: LearnerProfile = {
      ...baseProfile,
      themeStages: { fork: 'retrieval' },
      graduatedThemes: ['pin'], // pool: pin graduado
    };
    // 15 min é a sessão que contém um bloco de revisão (tema + revisao).
    const plan = generatePlan(
      profile,
      [{ tag: 'fork', score: 0.9, confidence: 'high', evidence: 'erros' }],
      15,
      '2026-06-22',
    );

    const revisao = plan.blocks.find((b) => b.id.endsWith('-revisao'));
    expect(revisao).toBeDefined();
    // Com pool ativo, revisao usa tema de pool (não fork)
    expect(revisao?.weaknessTag).not.toBe('fork');
    expect(revisao?.weaknessTag).toBe('pin');
  });

  it('AC2: em estágio transfer com pool, -transferencia mistura âncora e pool', () => {
    const profile: LearnerProfile = {
      ...baseProfile,
      themeStages: { fork: 'transfer' },
      graduatedThemes: ['pin'],
    };
    const plan = generatePlan(
      profile,
      [{ tag: 'fork', score: 0.9, confidence: 'high', evidence: 'erros' }],
      60,
      '2026-06-22',
    );

    const transferencia = plan.blocks.find((b) => b.id.endsWith('-transferencia'));
    expect(transferencia).toBeDefined();
    // Em transfer com pool, o bloco de transferência deve ter isDiscrimination = true
    // e a weaknessTag pode ser fork (âncora) — mas o bloco sinaliza que é discriminação
    expect(transferencia?.isDiscrimination).toBe(true);
  });

  it('AC2: sem pool (nenhum tema graduado), -revisao usa primário mesmo em retrieval', () => {
    const profile: LearnerProfile = {
      ...baseProfile,
      themeStages: { fork: 'retrieval' },
      graduatedThemes: [], // pool vazio
    };
    // 15 min é a sessão que contém um bloco de revisão (tema + revisao).
    const plan = generatePlan(
      profile,
      [{ tag: 'fork', score: 0.9, confidence: 'high', evidence: 'erros' }],
      15,
      '2026-06-22',
    );

    const revisao = plan.blocks.find((b) => b.id.endsWith('-revisao'));
    expect(revisao?.weaknessTag).toBe('fork');
  });
});

// ---------------------------------------------------------------------------
// D3 — pool de rotação (AC3)
// ---------------------------------------------------------------------------

describe('D3 — pool de rotação determinístico', () => {
  it('AC3: buildInterleavePool deriva temas do graduatedThemes excluindo o primário', () => {
    const profile: LearnerProfile = {
      ...baseProfile,
      graduatedThemes: ['pin', 'fork', 'back-rank'],
    };

    const pool = buildInterleavePool(profile, 'fork');

    expect(pool).not.toContain('fork'); // primário excluído
    expect(pool).toContain('pin');
    expect(pool).toContain('back-rank');
  });

  it('AC3: pool vazio quando nenhum tema foi graduado', () => {
    const profile: LearnerProfile = {
      ...baseProfile,
      graduatedThemes: [],
    };

    const pool = buildInterleavePool(profile, 'fork');

    expect(pool).toHaveLength(0);
  });

  it('AC3: pool vazio quando graduatedThemes é undefined', () => {
    const pool = buildInterleavePool(baseProfile, 'fork');

    expect(pool).toHaveLength(0);
  });

  it('AC3: máximo de 2 temas de pool distintos por sessão no plano gerado', () => {
    const profile: LearnerProfile = {
      ...baseProfile,
      themeStages: { fork: 'retrieval' },
      graduatedThemes: ['pin', 'back-rank', 'mate-in-1', 'skewer'], // 4 temas no pool
    };
    const plan = generatePlan(
      profile,
      [{ tag: 'fork', score: 0.9, confidence: 'high', evidence: 'erros' }],
      60,
      '2026-06-22',
    );

    const poolBlocks = plan.blocks.filter(
      (b) =>
        (b.id.endsWith('-revisao') || b.id.endsWith('-transferencia')) &&
        b.weaknessTag !== 'fork',
    );

    const distinctPoolThemes = new Set(poolBlocks.map((b) => b.weaknessTag));
    expect(distinctPoolThemes.size).toBeLessThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// D4 — critério de graduação (AC5)
// ---------------------------------------------------------------------------

describe('D4 — critério de graduação', () => {
  it('AC5: isThemeGraduated retorna true quando acurácia ≥ 80% sobre ≥ 30 tentativas', () => {
    // 24 wins / 30 attempts = 80%
    const result = isThemeGraduated({ attempts: 30, wins: 24 });

    expect(result).toBe(true);
  });

  it('AC5: isThemeGraduated retorna false quando tentativas < 30', () => {
    const result = isThemeGraduated({ attempts: 29, wins: 25 });

    expect(result).toBe(false);
  });

  it('AC5: isThemeGraduated retorna false quando acurácia < 80%', () => {
    // 23 wins / 30 attempts ≈ 76.7%
    const result = isThemeGraduated({ attempts: 30, wins: 23 });

    expect(result).toBe(false);
  });

  it('AC5: isThemeGraduated retorna false com 0 tentativas', () => {
    const result = isThemeGraduated({ attempts: 0, wins: 0 });

    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// D4 — teto anti-trava (AC6)
// ---------------------------------------------------------------------------

describe('D4 — teto anti-trava (PRIMARY_SESSION_CEILING)', () => {
  it('AC6: shouldForceRotation retorna false quando sessões < teto', () => {
    expect(shouldForceRotation(12)).toBe(false);
    expect(shouldForceRotation(11)).toBe(false);
  });

  it('AC6: shouldForceRotation retorna true quando sessões > 12', () => {
    expect(shouldForceRotation(13)).toBe(true);
  });

  it('AC6: generatePlan com sessionsOnPrimaryTheme > 12 marca forceRotation no plano', () => {
    const profile: LearnerProfile = {
      ...baseProfile,
      themeStages: { fork: 'retrieval' },
      sessionsOnPrimaryTheme: 13, // > teto de 12
    };
    const plan = generatePlan(
      profile,
      [{ tag: 'fork', score: 0.9, confidence: 'high', evidence: 'erros' }],
      30,
      '2026-06-22',
    );

    // O plano deve sinalizar que o tema primário está travado
    expect(plan.primaryThemeForced).toBe(true);
  });
});
