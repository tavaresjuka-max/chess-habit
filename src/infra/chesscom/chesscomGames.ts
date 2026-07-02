import { chesscomFetch } from '../http/providerQueue';

export type ChesscomGameSummary = {
  endTime: number;
  white: string;
  black: string;
  result: string;
  pgn: string;
  url: string;
  userColor: 'white' | 'black';
};

export type FetchChesscomGamesResult =
  | { kind: 'ok'; games: ChesscomGameSummary[] }
  | { kind: 'private-or-not-found' }
  | { kind: 'no-recent-games' }
  | { kind: 'rate-limited' }
  | { kind: 'network-error' };

// Resultado interno de UMA chamada mensal; distingue "ok com games" de
// "ok mas vazio" para permitir o fallback ao mês anterior.
type MonthFetchResult =
  | { kind: 'ok'; games: ChesscomGameSummary[] }
  | { kind: 'empty' }
  | { kind: 'private-or-not-found' }
  | { kind: 'rate-limited' }
  | { kind: 'network-error' };

type Month = { year: number; month: number };

function currentMonth(now: Date): Month {
  // UTC porque a API do chess.com publica arquivos por mês GMT.
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

function previousMonth(m: Month): Month {
  if (m.month === 1) {
    return { year: m.year - 1, month: 12 };
  }
  return { year: m.year, month: m.month - 1 };
}

function formatMonth(m: Month): string {
  return `${String(m.year)}/${String(m.month).padStart(2, '0')}`;
}

// Validação defensiva sobre `unknown`: o contrato real do chess.com pode mudar
// de forma silenciosa — preferimos descartar partidas mal-formadas a fabricar.
function mapGame(raw: unknown, usernameLower: string): ChesscomGameSummary | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const g = raw as Record<string, unknown>;
  const endTime = g.end_time;
  const pgn = g.pgn;
  const url = g.url;
  if (
    typeof endTime !== 'number' ||
    typeof pgn !== 'string' ||
    typeof url !== 'string' ||
    pgn === '' ||
    url === ''
  ) {
    return null;
  }
  const whiteObj = g.white;
  const blackObj = g.black;
  if (
    typeof whiteObj !== 'object' ||
    whiteObj === null ||
    typeof blackObj !== 'object' ||
    blackObj === null
  ) {
    return null;
  }
  const whiteU = (whiteObj as Record<string, unknown>).username;
  const blackU = (blackObj as Record<string, unknown>).username;
  if (typeof whiteU !== 'string' || typeof blackU !== 'string') {
    return null;
  }
  const userColor: 'white' | 'black' = whiteU.toLowerCase() === usernameLower ? 'white' : 'black';
  // No chess.com o `result` é por lado: white.result/win, black.result/checkmated.
  const userSide = (userColor === 'white' ? whiteObj : blackObj) as Record<string, unknown>;
  const result = userSide.result;
  if (typeof result !== 'string') {
    return null;
  }
  return {
    endTime,
    white: whiteU,
    black: blackU,
    result,
    pgn,
    url,
    userColor,
  };
}

async function fetchMonth(
  username: string,
  month: Month,
  fetcher: typeof fetch,
  usernameLower: string,
): Promise<MonthFetchResult> {
  const url = `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/${formatMonth(month)}`;
  let res: Response;
  try {
    res = await fetcher(url);
  } catch {
    return { kind: 'network-error' };
  }
  if (res.status === 404 || res.status === 403) {
    return { kind: 'private-or-not-found' };
  }
  if (res.status === 429) {
    return { kind: 'rate-limited' };
  }
  if (!res.ok) {
    return { kind: 'network-error' };
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { kind: 'network-error' };
  }
  if (typeof body !== 'object' || body === null) {
    return { kind: 'network-error' };
  }
  const gamesRaw = (body as Record<string, unknown>).games;
  if (!Array.isArray(gamesRaw)) {
    // O chess.com devolve `{ games: [] }` mesmo sem partidas; ausência do campo
    // é resposta inesperada → network-error (nunca fabricar lista vazia silenciosa).
    return { kind: 'network-error' };
  }
  const mapped: ChesscomGameSummary[] = [];
  for (const rawGame of gamesRaw) {
    const mappedGame = mapGame(rawGame, usernameLower);
    if (mappedGame !== null) {
      mapped.push(mappedGame);
    }
  }
  if (mapped.length === 0) {
    return { kind: 'empty' };
  }
  mapped.sort((a, b) => b.endTime - a.endTime);
  return { kind: 'ok', games: mapped.slice(0, 10) };
}

export async function fetchRecentChesscomGames(
  username: string,
  options?: { fetcher?: typeof fetch; now?: Date },
): Promise<FetchChesscomGamesResult> {
  const fetcher = options?.fetcher ?? chesscomFetch;
  const now = options?.now ?? new Date();
  const usernameLower = username.toLowerCase();

  const cur = currentMonth(now);
  const current = await fetchMonth(username, cur, fetcher, usernameLower);
  if (current.kind === 'ok') {
    return current;
  }
  if (current.kind !== 'empty') {
    return current;
  }

  // Mês corrente sem partidas — tenta o mês anterior (único fallback).
  const prev = await fetchMonth(username, previousMonth(cur), fetcher, usernameLower);
  if (prev.kind === 'ok') {
    return prev;
  }
  if (prev.kind === 'empty') {
    return { kind: 'no-recent-games' };
  }
  return prev;
}
