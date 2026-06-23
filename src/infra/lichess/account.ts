import { lichessFetch } from '../http/providerQueue';
import { isRecord } from '../utils/typeGuards';
import { LichessRateLimitError } from './puzzleActivity';

const lichessBaseUrl = 'https://lichess.org';

export type LichessPerf = {
  rating: number;
  games: number;
  provisional: boolean;
};

export type LichessAccountSummary = {
  id: string;
  username: string;
  puzzle?: LichessPerf;
  rapid?: LichessPerf;
  blitz?: LichessPerf;
  classical?: LichessPerf;
};

export type FetchLichessAccountOptions = {
  token: string;
  fetcher?: typeof fetch;
};

const PERF_KEYS = ['puzzle', 'rapid', 'blitz', 'classical'] as const;

// M2a: lê /api/account do Lichess (identidade + perfs). Best-effort: quem chama
// envolve em try/catch para não quebrar o sync (DD6). Só ratings de JOGO entram
// no cálculo da banda; puzzle fica disponível mas não vira número (DD2).
export async function fetchLichessAccount(
  options: FetchLichessAccountOptions,
): Promise<LichessAccountSummary | undefined> {
  const token = options.token.trim();

  if (token === '') {
    throw new Error('Token Lichess ausente para ler a conta.');
  }

  const response = await (options.fetcher ?? lichessFetch)(`${lichessBaseUrl}/api/account`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 429) {
    throw new LichessRateLimitError();
  }

  if (!response.ok) {
    throw new Error(`Lichess respondeu HTTP ${String(response.status)}.`);
  }

  return parseLichessAccount(await response.json());
}

export function parseLichessAccount(value: unknown): LichessAccountSummary | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.username !== 'string') {
    return undefined;
  }

  const perfs = isRecord(value.perfs) ? value.perfs : {};
  const summary: LichessAccountSummary = { id: value.id, username: value.username };

  for (const key of PERF_KEYS) {
    const perf = parsePerf(perfs[key]);
    if (perf !== undefined) {
      summary[key] = perf;
    }
  }

  return summary;
}

function parsePerf(value: unknown): LichessPerf | undefined {
  if (!isRecord(value) || typeof value.rating !== 'number' || typeof value.games !== 'number') {
    return undefined;
  }

  return { rating: value.rating, games: value.games, provisional: value.prov === true };
}
