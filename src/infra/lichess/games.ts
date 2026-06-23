import type { Signal } from '../../domain';
import { lichessFetch } from '../http/providerQueue';
import { LichessRateLimitError } from './puzzleActivity';

export type LichessGameColor = 'white' | 'black';

export type LichessGameJson = {
  id: string;
  speed?: string;
  status?: string;
  winner?: LichessGameColor;
  opening?: {
    eco: string;
    name: string;
  };
  players: {
    white: LichessGamePlayer;
    black: LichessGamePlayer;
  };
};

export type LichessGamePlayer = {
  user?: {
    id?: string;
    name?: string;
  };
  analysis?: {
    inaccuracy: number;
    mistake: number;
    blunder: number;
    acpl?: number;
    accuracy?: number;
  };
};

export type ImportLichessSignalsOptions = {
  username: string;
  token?: string;
  observedAt?: string;
  max?: number;
  fetcher?: typeof fetch;
};

type OpeningAggregate = {
  eco: string;
  name: string;
  games: number;
  losses: number;
};

type ColorAggregate = {
  color: LichessGameColor;
  games: number;
  losses: number;
};

type JudgmentAggregate = {
  games: number;
  blunders: number;
  mistakes: number;
  inaccuracies: number;
  acplTotal: number;
  acplGames: number;
};

const lichessBaseUrl = 'https://lichess.org';

export async function importLichessSignals(options: ImportLichessSignalsOptions): Promise<Signal[]> {
  // Paralelo: partidas + rating de puzzles (API pública, sem OAuth).
  // A fila serial garante rate-limit; Promise.allSettled encaixa ambas sem
  // deixar um erro de puzzlePerf derrubar o import de partidas.
  const [gamesResult, puzzlePerfResult] = await Promise.allSettled([
    fetchLichessGames(options),
    fetchLichessPuzzlePerf(options.username, { fetcher: options.fetcher }),
  ]);

  if (gamesResult.status === 'rejected') {
    throw gamesResult.reason;
  }

  const observedAt = options.observedAt ?? new Date().toISOString();
  const gameSignals = extractSignalsFromLichessGames(options.username, gamesResult.value, observedAt);
  const puzzlePerf = puzzlePerfResult.status === 'fulfilled' ? puzzlePerfResult.value : null;
  const puzzleSignal = puzzlePerfToSignal(puzzlePerf, observedAt);

  return puzzleSignal === undefined ? gameSignals : [...gameSignals, puzzleSignal];
}

export async function fetchLichessGames(options: ImportLichessSignalsOptions): Promise<LichessGameJson[]> {
  const username = options.username.trim();

  if (username === '') {
    throw new Error('Usuário Lichess ausente para diagnóstico.');
  }

  const fetcher = options.fetcher ?? lichessFetch;
  const response = await fetcher(lichessGamesUrl(username, options.max), {
    headers: {
      Accept: 'application/x-ndjson',
      ...(options.token === undefined ? {} : { Authorization: `Bearer ${options.token}` }),
    },
  });

  if (response.status === 429) {
    throw new LichessRateLimitError();
  }

  if (!response.ok) {
    throw new Error(`Lichess respondeu HTTP ${String(response.status)} ao buscar partidas.`);
  }

  return parseLichessGamesNdjson(await response.text());
}

export function parseLichessGamesNdjson(ndjson: string): LichessGameJson[] {
  return ndjson
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map(parseJsonLineOrUndefined)
    .filter(isLichessGameJson);
}

function parseJsonLineOrUndefined(line: string): unknown {
  try {
    return JSON.parse(line) as unknown;
  } catch {
    return undefined;
  }
}

export function extractSignalsFromLichessGames(
  username: string,
  games: LichessGameJson[],
  observedAt: string,
): Signal[] {
  const openings = new Map<string, OpeningAggregate>();
  const colors = new Map<LichessGameColor, ColorAggregate>();
  const judgment: JudgmentAggregate = {
    games: 0,
    blunders: 0,
    mistakes: 0,
    inaccuracies: 0,
    acplTotal: 0,
    acplGames: 0,
  };

  for (const game of games) {
    const side = getPlayerSideLichess(game, username);

    if (side === null) {
      continue;
    }

    const didLose = game.winner !== undefined && game.winner !== side;
    addColor(colors, side, didLose);

    if (game.opening !== undefined) {
      addOpening(openings, game.opening, didLose);
    }

    addJudgment(judgment, game.players[side].analysis);
  }

  return [
    ...openingSignals(openings, observedAt),
    ...colorSignals(colors, observedAt),
    ...judgmentSignals(judgment, observedAt),
  ];
}

export type LichessPuzzlePerf = {
  rating: number;
  games: number;
  deviation: number;
  provisional: boolean;
};

export async function fetchLichessPuzzlePerf(
  username: string,
  options: { fetcher?: typeof fetch } = {},
): Promise<LichessPuzzlePerf | null> {
  const trimmed = username.trim();
  if (trimmed === '') return null;

  const fetcher = options.fetcher ?? lichessFetch;
  const url = `${lichessBaseUrl}/api/user/${encodeURIComponent(trimmed)}/perf/puzzle`;
  const response = await fetcher(url, { headers: { Accept: 'application/json' } });

  if (response.status === 404) return null;
  if (response.status === 429) throw new LichessRateLimitError();
  if (!response.ok) return null;

  return parsePuzzlePerf((await response.json()) as unknown);
}

function parsePuzzlePerf(data: unknown): LichessPuzzlePerf | null {
  if (!isRecord(data)) return null;
  const perf = data.perf;
  if (!isRecord(perf)) return null;
  const glicko = perf.glicko;
  if (!isRecord(glicko)) return null;
  const stat = data.stat;
  const count = isRecord(stat) && isRecord(stat.count) ? stat.count : undefined;
  const rating = glicko.rating;
  const deviation = glicko.deviation;
  const provisional = glicko.provisional;
  const games = count?.all;

  if (typeof rating !== 'number' || typeof deviation !== 'number') return null;

  return {
    rating: Math.round(rating),
    games: typeof games === 'number' ? games : 0,
    deviation: Math.round(deviation),
    provisional: provisional === true,
  };
}

function puzzlePerfToSignal(perf: LichessPuzzlePerf | null, observedAt: string): Signal | undefined {
  // Gates do council: ≥10 partidas, não provisório, desvio ≤ 110.
  // provisional=true indica RD alto (conta nova/inativa) — o rating é instável
  // e não deve ancorar a seleção de banda. Threshold 110 ≈ 2× o RD de referência
  // do Glicko-2; acima disso o IC de 95% cobre mais de 4 bandas.
  if (perf === null || perf.games < 10 || perf.provisional || perf.deviation > 110) {
    return undefined;
  }

  return {
    source: 'lichess',
    value: { kind: 'puzzle-perf', rating: perf.rating, games: perf.games },
    confidence: 'high',
    observedAt,
  };
}

export function getPlayerSideLichess(game: LichessGameJson, username: string): LichessGameColor | null {
  const normalizedUsername = normalizeUsername(username);
  const white = game.players.white.user;
  const black = game.players.black.user;

  if (normalizeUsername(white?.name ?? white?.id) === normalizedUsername) {
    return 'white';
  }

  if (normalizeUsername(black?.name ?? black?.id) === normalizedUsername) {
    return 'black';
  }

  return null;
}

function lichessGamesUrl(username: string, max?: number): string {
  // Sem `max`: a API exporta o histórico completo (decisão do dono 2026-06-13,
  // "tudo possível"). Com `max`, limita — usado por testes/chamadas pontuais.
  const params = new URLSearchParams({
    moves: 'false',
    pgnInJson: 'false',
    opening: 'true',
    accuracy: 'true',
    finished: 'true',
    sort: 'dateDesc',
  });

  if (max !== undefined) {
    params.set('max', String(max));
  }

  return `${lichessBaseUrl}/api/games/user/${encodeURIComponent(username)}?${params.toString()}`;
}

function addOpening(
  openings: Map<string, OpeningAggregate>,
  opening: { eco: string; name: string },
  didLose: boolean,
): void {
  const key = `${opening.eco}:${opening.name}`;
  const current = openings.get(key) ?? {
    eco: opening.eco,
    name: opening.name,
    games: 0,
    losses: 0,
  };

  openings.set(key, {
    ...current,
    games: current.games + 1,
    losses: current.losses + (didLose ? 1 : 0),
  });
}

function addColor(colors: Map<LichessGameColor, ColorAggregate>, color: LichessGameColor, didLose: boolean): void {
  const current = colors.get(color) ?? {
    color,
    games: 0,
    losses: 0,
  };

  colors.set(color, {
    ...current,
    games: current.games + 1,
    losses: current.losses + (didLose ? 1 : 0),
  });
}

function addJudgment(judgment: JudgmentAggregate, analysis: LichessGamePlayer['analysis']): void {
  if (analysis === undefined) {
    return;
  }

  judgment.games += 1;
  judgment.blunders += analysis.blunder;
  judgment.mistakes += analysis.mistake;
  judgment.inaccuracies += analysis.inaccuracy;

  if (analysis.acpl !== undefined) {
    judgment.acplTotal += analysis.acpl;
    judgment.acplGames += 1;
  }
}

function openingSignals(openings: Map<string, OpeningAggregate>, observedAt: string): Signal[] {
  return [...openings.values()].map((opening) => ({
    source: 'lichess',
    confidence: 'medium',
    observedAt,
    value: {
      kind: 'opening',
      eco: opening.eco,
      name: opening.name,
      games: opening.games,
      lossRate: toRate(opening.losses, opening.games),
    },
  }));
}

function colorSignals(colors: Map<LichessGameColor, ColorAggregate>, observedAt: string): Signal[] {
  return [...colors.values()].map((color) => ({
    source: 'lichess',
    confidence: 'low',
    observedAt,
    value: {
      kind: 'color',
      color: color.color,
      games: color.games,
      lossRate: toRate(color.losses, color.games),
    },
  }));
}

function judgmentSignals(judgment: JudgmentAggregate, observedAt: string): Signal[] {
  if (judgment.games === 0) {
    return [];
  }

  return [
    {
      source: 'lichess',
      confidence: 'medium',
      observedAt,
      value: {
        kind: 'judgment',
        blunders: judgment.blunders,
        mistakes: judgment.mistakes,
        inaccuracies: judgment.inaccuracies,
        acpl: judgment.acplGames === 0 ? undefined : Math.round(judgment.acplTotal / judgment.acplGames),
        games: judgment.games,
      },
    },
  ];
}

function isLichessGameJson(value: unknown): value is LichessGameJson {
  if (!isRecord(value) || !isRecord(value.players)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    isPlayer(value.players.white) &&
    isPlayer(value.players.black)
  );
}

function isPlayer(value: unknown): value is LichessGamePlayer {
  if (!isRecord(value)) {
    return false;
  }

  if (value.analysis !== undefined && !isAnalysis(value.analysis)) {
    return false;
  }

  return value.user === undefined || isRecord(value.user);
}

function isAnalysis(value: unknown): value is NonNullable<LichessGamePlayer['analysis']> {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.inaccuracy === 'number' &&
    typeof value.mistake === 'number' &&
    typeof value.blunder === 'number'
  );
}

function normalizeUsername(username: string | undefined): string {
  return username?.trim().toLocaleLowerCase('en-US') ?? '';
}

function toRate(count: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((count / total) * 1000) / 1000;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
