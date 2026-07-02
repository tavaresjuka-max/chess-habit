import { describe, expect, it } from 'vitest';
import { classifyTheme, type ThemeClassifierTag } from './themeClassifier';
import {
  BACK_RANK_NEGATIVE,
  BACK_RANK_POSITIVE,
  FORK_NEGATIVE,
  FORK_POSITIVE,
  HANGING_PIECE_NEGATIVE,
  HANGING_PIECE_POSITIVE,
  MATE_IN_1_NEGATIVE,
  MATE_IN_1_POSITIVE,
  PIN_NEGATIVE,
  PIN_POSITIVE,
  type ThemeFixture,
} from './themeClassifier.fixtures';

/** Acessa `arr[index]`, lançando se ausente — evita non-null assertion nos testes. */
function requireAt<T>(arr: readonly T[], index: number): T {
  const item = arr[index];
  if (item === undefined) {
    throw new Error(`fixture ausente no índice ${String(index)} (array tem ${String(arr.length)} itens)`);
  }
  return item;
}

/**
 * Mede precisão de um detector num conjunto positivo (deve disparar a tag) e
 * negativo (NÃO deve disparar a tag) de fixtures, e imprime o resultado no
 * console de teste — os números aqui viram a tabela do
 * `docs/specs/spike-d1-theme-classifier-RESULT.md` (medidos, não estimados).
 */
function measurePrecision(
  tag: ThemeClassifierTag,
  positives: ThemeFixture[],
  negatives: ThemeFixture[],
): { truePositives: number; falseNegatives: number; trueNegatives: number; falsePositives: number } {
  let truePositives = 0;
  let falseNegatives = 0;
  for (const fixture of positives) {
    const hits = classifyTheme(fixture.fenBefore, fixture.bestUci);
    const hit = hits.some((h) => h.tag === tag);
    if (hit) truePositives += 1;
    else falseNegatives += 1;
  }

  let trueNegatives = 0;
  let falsePositives = 0;
  for (const fixture of negatives) {
    const hits = classifyTheme(fixture.fenBefore, fixture.bestUci);
    const hit = hits.some((h) => h.tag === tag);
    if (hit) falsePositives += 1;
    else trueNegatives += 1;
  }

  return { truePositives, falseNegatives, trueNegatives, falsePositives };
}

describe('classifyTheme — mate-in-1', () => {
  it('detecta todos os positivos (mate real confirmado por isCheckmate)', () => {
    for (const fixture of MATE_IN_1_POSITIVE) {
      const hits = classifyTheme(fixture.fenBefore, fixture.bestUci);
      expect(hits.some((h) => h.tag === 'mate-in-1' && h.confidence === 'high'), fixture.label).toBe(
        true,
      );
    }
  });

  it('rejeita todos os negativos (xeque sem mate, lance neutro)', () => {
    for (const fixture of MATE_IN_1_NEGATIVE) {
      const hits = classifyTheme(fixture.fenBefore, fixture.bestUci);
      expect(hits.some((h) => h.tag === 'mate-in-1'), fixture.label).toBe(false);
    }
  });

  it('mede precisão 100% no conjunto (detector exaustivo via isCheckmate)', () => {
    const result = measurePrecision('mate-in-1', MATE_IN_1_POSITIVE, MATE_IN_1_NEGATIVE);
    expect(result).toEqual({
      truePositives: MATE_IN_1_POSITIVE.length,
      falseNegatives: 0,
      trueNegatives: MATE_IN_1_NEGATIVE.length,
      falsePositives: 0,
    });
  });
});

describe('classifyTheme — fork', () => {
  it('detecta todos os positivos (cavalo ataca >=2 peças qualificadas)', () => {
    for (const fixture of FORK_POSITIVE) {
      const hits = classifyTheme(fixture.fenBefore, fixture.bestUci);
      expect(hits.some((h) => h.tag === 'fork'), fixture.label).toBe(true);
    }
  });

  it('marca confidence high quando o garfo inclui rei ou dama', () => {
    // Primeiro fixture inclui o rei — deve ser high.
    const kingFork = requireAt(FORK_POSITIVE, 0);
    const hits = classifyTheme(kingFork.fenBefore, kingFork.bestUci);
    const fork = hits.find((h) => h.tag === 'fork');
    expect(fork?.confidence).toBe('high');
  });

  it('rejeita todos os negativos (peças de baixo valor, peão, rei, alvo único)', () => {
    for (const fixture of FORK_NEGATIVE) {
      const hits = classifyTheme(fixture.fenBefore, fixture.bestUci);
      expect(hits.some((h) => h.tag === 'fork'), fixture.label).toBe(false);
    }
  });

  it('mede precisão no conjunto', () => {
    const result = measurePrecision('fork', FORK_POSITIVE, FORK_NEGATIVE);
    expect(result).toEqual({
      truePositives: FORK_POSITIVE.length,
      falseNegatives: 0,
      trueNegatives: FORK_NEGATIVE.length,
      falsePositives: 0,
    });
  });
});

describe('classifyTheme — hanging-piece', () => {
  it('detecta todos os positivos (captura de peça sem defensores)', () => {
    for (const fixture of HANGING_PIECE_POSITIVE) {
      const hits = classifyTheme(fixture.fenBefore, fixture.bestUci);
      expect(hits.some((h) => h.tag === 'hanging-piece' && h.confidence === 'high'), fixture.label).toBe(
        true,
      );
    }
  });

  it('rejeita todos os negativos (peça defendida, não-captura)', () => {
    for (const fixture of HANGING_PIECE_NEGATIVE) {
      const hits = classifyTheme(fixture.fenBefore, fixture.bestUci);
      expect(hits.some((h) => h.tag === 'hanging-piece'), fixture.label).toBe(false);
    }
  });

  it('mede precisão 100% no conjunto (geometria de defensores é exaustiva)', () => {
    const result = measurePrecision('hanging-piece', HANGING_PIECE_POSITIVE, HANGING_PIECE_NEGATIVE);
    expect(result).toEqual({
      truePositives: HANGING_PIECE_POSITIVE.length,
      falseNegatives: 0,
      trueNegatives: HANGING_PIECE_NEGATIVE.length,
      falsePositives: 0,
    });
  });
});

describe('classifyTheme — back-rank', () => {
  it('detecta os positivos com confidence correta (high = mate, low = só xeque)', () => {
    const mate1 = requireAt(BACK_RANK_POSITIVE, 0);
    const mate2 = requireAt(BACK_RANK_POSITIVE, 1);
    const checkOnly = requireAt(BACK_RANK_POSITIVE, 2);

    for (const fixture of [mate1, mate2]) {
      const hits = classifyTheme(fixture.fenBefore, fixture.bestUci);
      const hit = hits.find((h) => h.tag === 'back-rank');
      expect(hit?.confidence, fixture.label).toBe('high');
    }

    const checkHits = classifyTheme(checkOnly.fenBefore, checkOnly.bestUci);
    const checkHit = checkHits.find((h) => h.tag === 'back-rank');
    expect(checkHit?.confidence, checkOnly.label).toBe('low');
  });

  it('rejeita todos os negativos (rei tem fuga, fora da back-rank, sem xeque)', () => {
    for (const fixture of BACK_RANK_NEGATIVE) {
      const hits = classifyTheme(fixture.fenBefore, fixture.bestUci);
      expect(hits.some((h) => h.tag === 'back-rank'), fixture.label).toBe(false);
    }
  });

  it('mede precisão no conjunto', () => {
    const result = measurePrecision('back-rank', BACK_RANK_POSITIVE, BACK_RANK_NEGATIVE);
    expect(result).toEqual({
      truePositives: BACK_RANK_POSITIVE.length,
      falseNegatives: 0,
      trueNegatives: BACK_RANK_NEGATIVE.length,
      falsePositives: 0,
    });
  });
});

describe('classifyTheme — pin', () => {
  it('detecta todos os positivos (cravada absoluta geométrica)', () => {
    for (const fixture of PIN_POSITIVE) {
      const hits = classifyTheme(fixture.fenBefore, fixture.bestUci);
      expect(hits.some((h) => h.tag === 'pin' && h.confidence === 'low'), fixture.label).toBe(true);
    }
  });

  it('rejeita todos os negativos (rei fora da linha, peça não-deslizante, bloqueio duplo)', () => {
    for (const fixture of PIN_NEGATIVE) {
      const hits = classifyTheme(fixture.fenBefore, fixture.bestUci);
      expect(hits.some((h) => h.tag === 'pin'), fixture.label).toBe(false);
    }
  });

  it('mede precisão no conjunto', () => {
    const result = measurePrecision('pin', PIN_POSITIVE, PIN_NEGATIVE);
    expect(result).toEqual({
      truePositives: PIN_POSITIVE.length,
      falseNegatives: 0,
      trueNegatives: PIN_NEGATIVE.length,
      falsePositives: 0,
    });
  });
});

describe('classifyTheme — contrato geral', () => {
  it('retorna lista vazia para FEN inválido', () => {
    expect(classifyTheme('lixo-nao-e-fen', 'e2e4')).toEqual([]);
  });

  it('retorna lista vazia quando bestUci não é fornecido', () => {
    expect(classifyTheme('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1')).toEqual([]);
  });

  it('retorna lista vazia quando bestUci não é legal na posição', () => {
    const hits = classifyTheme(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      'e2e4', // peça branca, mas é a vez das pretas
    );
    expect(hits).toEqual([]);
  });

  it('um lance pode disparar múltiplas tags simultaneamente (ex. mate-in-1 + back-rank)', () => {
    const fixture = requireAt(MATE_IN_1_POSITIVE, 1); // Re8# — também back-rank
    const hits = classifyTheme(fixture.fenBefore, fixture.bestUci);
    const tags = hits.map((h) => h.tag);
    expect(tags).toContain('mate-in-1');
    expect(tags).toContain('back-rank');
  });
});
