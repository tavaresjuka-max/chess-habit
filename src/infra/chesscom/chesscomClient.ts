import type { Signal } from '../../domain';
import { extractSignalsFromChesscomGames, extractSignalsFromChesscomStats } from './extractSignals';
import type { ChesscomArchivesResponse, ChesscomMonthlyArchiveResponse, ChesscomStatsResponse } from './types';

export type ChesscomMonthCache = {
  id: string;
  username: string;
  archiveUrl: string;
  signals: Signal[];
  updatedAt: string;
  expiresAt: string;
};

export type ChesscomSignalCache = {
  loadMonth: (cacheId: string, nowIso: string) => Promise<ChesscomMonthCache | undefined>;
  saveMonth: (cache: ChesscomMonthCache) => Promise<void>;
};

export type ImportChesscomOptions = {
  fetcher?: typeof fetch;
  cache?: ChesscomSignalCache;
  observedAt?: string;
};

const chesscomApiBaseUrl = 'https://api.chess.com';

export class ChesscomRateLimitError extends Error {
  readonly retryAfterMs: number;

  constructor(retryAfterMs = 60_000) {
    super('Chess.com limitou as requisições agora. Espere pelo menos 1 minuto antes de tentar de novo.');
    this.name = 'ChesscomRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

export async function importChesscomSignals(username: string, options: ImportChesscomOptions = {}): Promise<Signal[]> {
  const normalizedUsername = username.trim();

  if (normalizedUsername === '') {
    throw new Error('Informe um usuário Chess.com antes de atualizar o diagnóstico.');
  }

  const observedAt = options.observedAt ?? new Date().toISOString();
  const fetcher = options.fetcher ?? fetch;
  const stats = await fetchJson<ChesscomStatsResponse>(statsUrl(normalizedUsername), fetcher);
  const archives = await fetchJson<ChesscomArchivesResponse>(archivesUrl(normalizedUsername), fetcher);
  const signals: Signal[] = [...extractSignalsFromChesscomStats(stats, observedAt)];

  for (const archiveUrl of filterRecentArchives(archives.archives ?? [], observedAt)) {
    const cachedSignals = await loadCachedSignals(options.cache, normalizedUsername, archiveUrl, observedAt);

    if (cachedSignals !== undefined) {
      signals.push(...cachedSignals);
      continue;
    }

    const month = await fetchJson<ChesscomMonthlyArchiveResponse>(archiveUrl, fetcher);
    const monthSignals = extractSignalsFromChesscomGames(normalizedUsername, month.games ?? [], observedAt);

    signals.push(...monthSignals);
    await saveCachedSignals(options.cache, normalizedUsername, archiveUrl, monthSignals, observedAt);
  }

  return signals;
}

// Bound de recencia exigido por AGENTS.md (achado Codex 2026-06-10): o
// diagnostico le no maximo os ultimos meses de arquivos, nunca o historico todo.
const recencyBoundMonths = 3;

export function filterRecentArchives(archiveUrls: string[], nowIso: string, months = recencyBoundMonths): string[] {
  const now = new Date(nowIso);

  if (Number.isNaN(now.getTime())) {
    return archiveUrls;
  }

  const cutoffIndex = now.getUTCFullYear() * 12 + now.getUTCMonth() - (months - 1);

  return archiveUrls.filter((url) => {
    const match = /\/games\/(\d{4})\/(\d{2})$/.exec(url);
    const year = match?.[1];
    const month = match?.[2];

    if (year === undefined || month === undefined) {
      return false;
    }

    return Number(year) * 12 + (Number(month) - 1) >= cutoffIndex;
  });
}

async function fetchJson<T>(url: string, fetcher: typeof fetch): Promise<T> {
  const response = await fetcher(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (response.status === 429) {
    throw new ChesscomRateLimitError();
  }

  if (!response.ok) {
    throw new Error(`Chess.com respondeu HTTP ${String(response.status)}.`);
  }

  const json = (await response.json()) as unknown;
  return json as T;
}

async function loadCachedSignals(
  cache: ChesscomSignalCache | undefined,
  username: string,
  archiveUrl: string,
  nowIso: string,
): Promise<Signal[] | undefined> {
  if (cache === undefined) {
    return undefined;
  }

  const cached = await cache.loadMonth(monthCacheId(username, archiveUrl), nowIso);

  if (cached === undefined) {
    return undefined;
  }

  return cached.signals;
}

async function saveCachedSignals(
  cache: ChesscomSignalCache | undefined,
  username: string,
  archiveUrl: string,
  signals: Signal[],
  nowIso: string,
): Promise<void> {
  if (cache === undefined) {
    return;
  }

  await cache.saveMonth({
    id: monthCacheId(username, archiveUrl),
    username: username.toLocaleLowerCase('en-US'),
    archiveUrl,
    signals,
    updatedAt: nowIso,
    expiresAt: expiresAtForArchive(archiveUrl, nowIso),
  });
}

export function monthCacheId(username: string, archiveUrl: string): string {
  return `${username.toLocaleLowerCase('en-US')}:${archiveUrl}`;
}

function statsUrl(username: string): string {
  return `${chesscomApiBaseUrl}/pub/player/${encodeURIComponent(username)}/stats`;
}

function archivesUrl(username: string): string {
  return `${chesscomApiBaseUrl}/pub/player/${encodeURIComponent(username)}/games/archives`;
}

function expiresAtForArchive(archiveUrl: string, nowIso: string): string {
  const now = new Date(nowIso);
  const archiveMonth = archiveUrl.match(/\/games\/(\d{4})\/(\d{2})$/);
  const archiveYear = archiveMonth?.[1];
  const archiveMonthNumber = archiveMonth?.[2];
  const isCurrentMonth =
    archiveYear === String(now.getUTCFullYear()) &&
    archiveMonthNumber === String(now.getUTCMonth() + 1).padStart(2, '0');
  const ttlMs = isCurrentMonth ? 12 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000;

  return new Date(now.getTime() + ttlMs).toISOString();
}
