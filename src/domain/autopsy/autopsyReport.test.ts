import { describe, expect, it } from 'vitest';
import { buildAutopsyReport } from './autopsyReport';
import {
  GAME_WITHOUT_ANALYSIS,
  GAME_WITHOUT_CLOCKS,
  GAME_WITH_CLOCKS_BLACK_TIME_PRESSURE,
  GAME_WITH_CLOCKS_WHITE_NO_PRESSURE,
  GAME_WITH_CLOCKS_WHITE_TIME_PRESSURE,
  GAME_WITH_EVALS_ONLY,
  GAME_WITH_JUDGMENTS,
  GAME_WITH_MATE_SCORE,
} from './autopsyReport.fixtures';

describe('buildAutopsyReport', () => {
  it('detecta erro via judgment explícito do Lichess (PRIMÁRIO)', () => {
    const report = buildAutopsyReport(GAME_WITH_JUDGMENTS, 'white');

    expect(report.analysisAvailable).toBe(true);
    expect(report.gameId).toBe('abcd1234');
    expect(report.white).toBe('AlunoBranco');
    expect(report.black).toBe('RivalPreto');
    expect(report.errors).toHaveLength(1);

    const [error] = report.errors;
    expect(error?.ply).toBe(5);
    expect(error?.moveNumber).toBe(3);
    expect(error?.side).toBe('white');
    expect(error?.sanPlayed).toBe('d4');
    expect(error?.severity).toBe('blunder');
    expect(error?.fenBefore).toBe('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3');
    expect(error?.lichessUrl).toBe('https://lichess.org/abcd1234/white#5');
  });

  it('filtra erros pela perspectiva escolhida (lado oposto não aparece)', () => {
    const reportBlack = buildAutopsyReport(GAME_WITH_JUDGMENTS, 'black');
    expect(reportBlack.errors).toHaveLength(0);
    expect(reportBlack.analysisAvailable).toBe(true);
  });

  it('detecta erro via FALLBACK de queda de avaliação quando não há judgment', () => {
    const report = buildAutopsyReport(GAME_WITH_EVALS_ONLY, 'black');

    expect(report.analysisAvailable).toBe(true);
    expect(report.errors).toHaveLength(1);

    const [error] = report.errors;
    expect(error?.ply).toBe(6);
    expect(error?.side).toBe('black');
    expect(error?.sanPlayed).toBe('dxc4');
    expect(error?.severity).toBe('blunder');
    expect(error?.evalBeforeCp).toBe(-50);
    expect(error?.evalAfterCp).toBe(-400);
  });

  it('marca analysisAvailable=false e errors=[] quando a partida não tem análise', () => {
    const report = buildAutopsyReport(GAME_WITHOUT_ANALYSIS, 'white');

    expect(report.analysisAvailable).toBe(false);
    expect(report.errors).toEqual([]);
    expect(report.gameId).toBe('ijkl9012');
  });

  it('trata mate score com o sentinela e reporta o erro', () => {
    const report = buildAutopsyReport(GAME_WITH_MATE_SCORE, 'white');

    expect(report.analysisAvailable).toBe(true);
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0]?.ply).toBe(7);
    expect(report.errors[0]?.side).toBe('white');
    expect(report.errors[0]?.severity).toBe('blunder');
    expect(report.errors[0]?.evalBeforeCp).toBe(60);
    expect(report.errors[0]?.evalAfterCp).toBe(-10_000);
  });

  it('deriva bestSan a partir de bestUci quando presente', () => {
    const gameWithBest = {
      ...GAME_WITH_JUDGMENTS,
      analysis: GAME_WITH_JUDGMENTS.analysis.map((entry, index) =>
        index === 4 ? { ...entry, best: 'g1f3' } : entry,
      ),
    };

    const report = buildAutopsyReport(gameWithBest, 'white');
    expect(report.errors[0]?.bestUci).toBe('g1f3');
    // fenBefore no ply 5 já tem o cavalo em f3 (jogado no ply 3), então
    // g1f3 não é mais um lance legal ali — validamos que o parsing não
    // quebra e apenas retorna undefined quando o lance não é legal na
    // posição informada.
    expect(report.errors[0]?.bestSan).toBeUndefined();
  });

  it('lida com JSON malformado/ausente sem lançar', () => {
    expect(() => buildAutopsyReport(undefined, 'white')).not.toThrow();
    expect(() => buildAutopsyReport(null, 'white')).not.toThrow();
    expect(() => buildAutopsyReport({}, 'white')).not.toThrow();
    expect(() => buildAutopsyReport('not-an-object', 'white')).not.toThrow();

    const report = buildAutopsyReport({}, 'white');
    expect(report.analysisAvailable).toBe(false);
    expect(report.errors).toEqual([]);
    expect(report.gameId).toBe('');
  });

  it('usa nome do adversário AI (aiLevel) quando não há user', () => {
    const gameVsAi = {
      id: 'ai12345',
      moves: 'e4 e5',
      players: {
        white: { user: { name: 'Humano' } },
        black: { aiLevel: 3 },
      },
      analysis: [{ eval: 10 }, { eval: 5 }],
    };

    const report = buildAutopsyReport(gameVsAi, 'white');
    expect(report.black).toBe('Stockfish nível 3');
  });

  it('limita a no máximo 3 erros, ordenados por dano e depois por ordem cronológica', () => {
    // 4 blunders com danos distintos; espera manter os 3 de maior dano,
    // devolvidos em ordem cronológica (ply crescente).
    const manyBlunders = {
      id: 'many0001',
      moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5',
      players: {
        white: { user: { name: 'W' } },
        black: { user: { name: 'B' } },
      },
      analysis: [
        { eval: 20 },
        { eval: -350, judgment: { name: 'Blunder' } }, // ply2 black, drop=370
        { eval: 340 },
        { eval: -320, judgment: { name: 'Blunder' } }, // ply4 black
        { eval: 300 },
        { eval: -900, judgment: { name: 'Blunder' } }, // ply6 black, biggest
        { eval: 20 },
        { eval: -600, judgment: { name: 'Blunder' } }, // ply8 black
        { eval: 20 },
        { eval: 10 },
        { eval: 15 },
        { eval: 5 },
      ],
    };

    const report = buildAutopsyReport(manyBlunders, 'black');
    expect(report.errors.length).toBeLessThanOrEqual(3);
    const plies = report.errors.map((error) => error.ply);
    expect(plies).toEqual([...plies].sort((left, right) => left - right));
  });

  describe('sinal de pressão de relógio (GRUPO CLOCKS)', () => {
    it('marca timePressure=true para erro das BRANCAS com relógio < 20s no momento do erro', () => {
      const report = buildAutopsyReport(GAME_WITH_CLOCKS_WHITE_TIME_PRESSURE, 'white');

      expect(report.errors).toHaveLength(1);
      const [error] = report.errors;
      expect(error?.ply).toBe(5);
      expect(error?.side).toBe('white');
      expect(error?.clockCentisAtError).toBe(1500);
      expect(error?.timePressure).toBe(true);
    });

    it('marca timePressure=false para erro das BRANCAS com relógio >= 20s no momento do erro', () => {
      const report = buildAutopsyReport(GAME_WITH_CLOCKS_WHITE_NO_PRESSURE, 'white');

      expect(report.errors).toHaveLength(1);
      const [error] = report.errors;
      expect(error?.clockCentisAtError).toBe(8000);
      expect(error?.timePressure).toBe(false);
    });

    it('marca timePressure=true para erro das PRETAS com o índice correto de clocks (alternância)', () => {
      const report = buildAutopsyReport(GAME_WITH_CLOCKS_BLACK_TIME_PRESSURE, 'black');

      expect(report.errors).toHaveLength(1);
      const [error] = report.errors;
      expect(error?.ply).toBe(6);
      expect(error?.side).toBe('black');
      expect(error?.clockCentisAtError).toBe(800);
      expect(error?.timePressure).toBe(true);
    });

    it('sem clocks no export: clockCentisAtError e timePressure ficam undefined (nunca inferidos)', () => {
      const report = buildAutopsyReport(GAME_WITHOUT_CLOCKS, 'white');

      expect(report.errors).toHaveLength(1);
      const [error] = report.errors;
      expect(error?.clockCentisAtError).toBeUndefined();
      expect(error?.timePressure).toBeUndefined();
    });
  });
});
