import { Chess } from 'chessops/chess';
import { makeFen, parseFen } from 'chessops/fen';
import { parseSan, makeSan } from 'chessops/san';
import { parseUci } from 'chessops/util';

// Domínio não pode importar infra (regra de lint `no-restricted-imports`);
// versão local mínima, mesmo padrão de `domain/method/sanitizeRestoredState.ts`.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export type AutopsySide = 'white' | 'black';

export type AutopsySeverity = 'blunder' | 'mistake' | 'inaccuracy';

export type AutopsyError = {
  ply: number;
  moveNumber: number;
  side: AutopsySide;
  sanPlayed: string;
  fenBefore: string;
  bestUci?: string;
  bestSan?: string;
  evalBeforeCp?: number;
  evalAfterCp?: number;
  severity: AutopsySeverity;
  lichessUrl: string;
};

export type AutopsyReport = {
  gameId: string;
  white: string;
  black: string;
  perspective: AutopsySide;
  errors: AutopsyError[];
  analysisAvailable: boolean;
};

/**
 * Valor sentinela para mate scores. O Lichess reporta `mate: N` (lances até o
 * mate, positivo = quem tem o turno mata, negativo = leva mate) em vez de
 * `eval` (centipawns) quando a linha é forçada. Convertemos para um cp
 * "quase decisivo" preservando o sinal, bem acima de qualquer eval real de
 * jogo (que raramente passa de ±2000cp fora de mate), para que comparações
 * de queda de avaliação continuem ordenando corretamente sem overflow.
 */
const MATE_SENTINEL_CP = 10_000;

// Convenção de índice: `analysis[i]` no export do Lichess descreve o
// half-move (ply) `i + 1` — ou seja, `analysis[0]` é a avaliação APÓS o
// primeiro lance (ply 1, jogado pelas brancas). Não há entrada para a
// posição inicial (ply 0). `judgment`/`eval`/`best`/`variation` em
// `analysis[i]` são sempre relativos à posição resultante do ply `i + 1`,
// do ponto de vista de quem tem o turno NAQUELA posição (ou seja, do
// oponente de quem acabou de jogar). Ao interpretar `eval` como "avaliação
// depois do lance na perspectiva de quem jogou", precisamos negar o valor
// bruto do Lichess (que é sempre da perspectiva de quem tem a vez a seguir).

type RawAnalysisEntry = {
  eval?: unknown;
  mate?: unknown;
  best?: unknown;
  variation?: unknown;
  judgment?: unknown;
};

type RawPlayer = {
  user?: { name?: unknown } | undefined;
  aiLevel?: unknown;
  name?: unknown;
};

type RawGameExport = {
  id?: unknown;
  moves?: unknown;
  players?: { white?: unknown; black?: unknown } | undefined;
  analysis?: unknown;
};

const SEVERITY_BY_JUDGMENT: Record<string, AutopsySeverity> = {
  Blunder: 'blunder',
  Mistake: 'mistake',
  Inaccuracy: 'inaccuracy',
};

export function buildAutopsyReport(exportJson: unknown, perspective: AutopsySide): AutopsyReport {
  const raw = isRecord(exportJson) ? (exportJson as RawGameExport) : {};
  const gameId = typeof raw.id === 'string' ? raw.id : '';
  const white = extractPlayerName(raw.players?.white, 'Brancas');
  const black = extractPlayerName(raw.players?.black, 'Pretas');
  const sanMoves = extractSanMoves(raw.moves);
  const analysisEntries = extractAnalysisEntries(raw.analysis);

  if (analysisEntries === undefined || sanMoves.length === 0) {
    return {
      gameId,
      white,
      black,
      perspective,
      errors: [],
      analysisAvailable: false,
    };
  }

  const candidates = replayAndDetectErrors({
    sanMoves,
    analysisEntries,
    perspective,
    gameId,
  });

  const errors = candidates
    .sort((left, right) => damageOf(right) - damageOf(left))
    .slice(0, 3)
    .sort((left, right) => left.ply - right.ply);

  return {
    gameId,
    white,
    black,
    perspective,
    errors,
    analysisAvailable: true,
  };
}

function replayAndDetectErrors(input: {
  sanMoves: string[];
  analysisEntries: (RawAnalysisEntry | undefined)[];
  perspective: AutopsySide;
  gameId: string;
}): AutopsyError[] {
  const { sanMoves, analysisEntries, perspective, gameId } = input;
  const errors: AutopsyError[] = [];

  const pos = Chess.default();
  let previousEvalCpFromMoverPerspective: number | undefined = evalBeforeGameCp();

  for (let index = 0; index < sanMoves.length; index += 1) {
    const ply = index + 1;
    const side: AutopsySide = index % 2 === 0 ? 'white' : 'black';
    const sanPlayed = sanMoves[index];
    if (sanPlayed === undefined) {
      break;
    }

    const fenBefore = makeFen(pos.toSetup());
    const move = parseSan(pos, sanPlayed);

    if (move === undefined) {
      // SAN inválido/imparseável nesta posição: paramos o replay aqui em vez
      // de arriscar FENs incorretos para os lances seguintes.
      break;
    }

    pos.play(move);

    const entry = analysisEntries[index];
    const evalAfterRaw = entry === undefined ? undefined : rawEvalCp(entry);
    // `analysis[index].eval`/`mate` vêm da perspectiva de quem tem a vez
    // DEPOIS do lance (ou seja, o oponente de `side`). Negamos para obter a
    // perspectiva de quem acabou de jogar (`side`), consistente com
    // `previousEvalCpFromMoverPerspective` abaixo.
    const evalAfterCp = evalAfterRaw === undefined ? undefined : -evalAfterRaw;

    const severity = detectSeverity({
      entry,
      evalBeforeCp: previousEvalCpFromMoverPerspective,
      evalAfterCp,
    });

    if (severity !== undefined) {
      const bestUci = extractBestUci(entry);
      const bestSanValue = bestUci === undefined ? undefined : bestSanFromUci(fenBefore, bestUci);

      errors.push({
        ply,
        moveNumber: Math.ceil(ply / 2),
        side,
        sanPlayed,
        fenBefore,
        bestUci,
        bestSan: bestSanValue,
        evalBeforeCp: previousEvalCpFromMoverPerspective,
        evalAfterCp,
        severity,
        lichessUrl: buildLichessUrl(gameId, perspective, ply),
      });
    }

    // Prepara a "avaliação antes" do próximo lance: o próximo lance é do
    // lado oposto, então a avaliação de referência (da perspectiva de quem
    // vai mover a seguir) é o `evalAfterRaw` cru (sem negar).
    previousEvalCpFromMoverPerspective = evalAfterRaw === undefined ? undefined : -evalAfterRaw;
  }

  return errors.filter((error) => error.side === perspective);
}

function evalBeforeGameCp(): number | undefined {
  // Nenhuma entrada de análise cobre a posição inicial; tratamos a
  // referência inicial como "desconhecida" (undefined) em vez de assumir
  // 0cp — evita fabricar uma queda de avaliação no primeiro lance quando só
  // temos `analysis[0]`.
  return undefined;
}

function detectSeverity(input: {
  entry: RawAnalysisEntry | undefined;
  evalBeforeCp: number | undefined;
  evalAfterCp: number | undefined;
}): AutopsySeverity | undefined {
  const { entry, evalBeforeCp, evalAfterCp } = input;

  // PRIMÁRIO: judgment explícito do Lichess.
  const judgment = entry?.judgment;
  if (isRecord(judgment) && typeof judgment.name === 'string') {
    const bySeverity = SEVERITY_BY_JUDGMENT[judgment.name];
    if (bySeverity !== undefined) {
      return bySeverity;
    }
  }

  // FALLBACK: queda de avaliação entre plies consecutivos, na perspectiva
  // de quem moveu. Só se aplica quando NÃO há judgment (partidas só-eval).
  if (evalBeforeCp === undefined || evalAfterCp === undefined) {
    return undefined;
  }

  const drop = evalBeforeCp - evalAfterCp;

  if (drop >= 300) {
    return 'blunder';
  }

  if (drop >= 150) {
    return 'mistake';
  }

  if (drop >= 80) {
    return 'inaccuracy';
  }

  return undefined;
}

function damageOf(error: AutopsyError): number {
  if (error.evalBeforeCp !== undefined && error.evalAfterCp !== undefined) {
    return error.evalBeforeCp - error.evalAfterCp;
  }

  // Sem evals (só judgment): ordena por severidade categórica.
  const severityRank: Record<AutopsySeverity, number> = { blunder: 3, mistake: 2, inaccuracy: 1 };
  return severityRank[error.severity];
}

function rawEvalCp(entry: RawAnalysisEntry): number | undefined {
  if (typeof entry.mate === 'number') {
    return entry.mate > 0 ? MATE_SENTINEL_CP : -MATE_SENTINEL_CP;
  }

  if (typeof entry.eval === 'number') {
    return entry.eval;
  }

  return undefined;
}

function extractBestUci(entry: RawAnalysisEntry | undefined): string | undefined {
  if (entry === undefined) {
    return undefined;
  }

  if (typeof entry.best === 'string' && entry.best !== '') {
    return entry.best;
  }

  if (typeof entry.variation === 'string' && entry.variation.trim() !== '') {
    const first = entry.variation.trim().split(/\s+/)[0];
    return first;
  }

  return undefined;
}

function bestSanFromUci(fenBefore: string, bestUci: string): string | undefined {
  const move = parseUci(bestUci);
  if (move === undefined) {
    return undefined;
  }

  const fenResult = parseFen(fenBefore);
  if (fenResult.isErr) {
    return undefined;
  }

  const chessResult = Chess.fromSetup(fenResult.unwrap());
  if (chessResult.isErr) {
    return undefined;
  }

  const pos = chessResult.unwrap();

  // `makeSan` não valida legalidade — para um lance ilegal na posição dada
  // ele devolve o placeholder `"--"` em vez de lançar. Verificamos
  // `isLegal` explicitamente para não vazar esse placeholder como SAN.
  if (!pos.isLegal(move)) {
    return undefined;
  }

  return makeSan(pos, move);
}

function buildLichessUrl(gameId: string, perspective: AutopsySide, ply: number): string {
  return `https://lichess.org/${gameId}/${perspective}#${String(ply)}`;
}

function extractPlayerName(player: unknown, fallback: string): string {
  if (!isRecord(player)) {
    return fallback;
  }

  const raw = player as RawPlayer;

  if (isRecord(raw.user) && typeof raw.user.name === 'string' && raw.user.name !== '') {
    return raw.user.name;
  }

  if (typeof raw.name === 'string' && raw.name !== '') {
    return raw.name;
  }

  if (typeof raw.aiLevel === 'number') {
    return `Stockfish nível ${String(raw.aiLevel)}`;
  }

  return fallback;
}

function extractSanMoves(moves: unknown): string[] {
  if (typeof moves !== 'string' || moves.trim() === '') {
    return [];
  }

  return moves.trim().split(/\s+/);
}

function extractAnalysisEntries(analysis: unknown): (RawAnalysisEntry | undefined)[] | undefined {
  if (!Array.isArray(analysis)) {
    return undefined;
  }

  return analysis.map((entry) => (isRecord(entry) ? (entry as RawAnalysisEntry) : undefined));
}
