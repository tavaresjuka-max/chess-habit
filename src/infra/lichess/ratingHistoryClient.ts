import { lichessFetch } from '../http/providerQueue';
import { LichessRateLimitError } from './puzzleActivity';
import { parseRatingHistory, type LichessRatingSeries } from './ratingHistory';

const lichessBaseUrl = 'https://lichess.org';

export type FetchLichessRatingHistoryOptions = {
  fetcher?: typeof fetch;
};

// E1b: lê a série temporal de rating (endpoint público, sem token). Best-effort:
// quem chama envolve em try/catch. Delega o parse ao E1a (parseRatingHistory).
export async function fetchLichessRatingHistory(
  username: string,
  options: FetchLichessRatingHistoryOptions = {},
): Promise<LichessRatingSeries[]> {
  const normalized = username.trim();
  if (normalized === '') {
    return [];
  }

  const response = await (options.fetcher ?? lichessFetch)(
    `${lichessBaseUrl}/api/user/${encodeURIComponent(normalized)}/rating-history`,
    { headers: { Accept: 'application/json' } },
  );

  if (response.status === 429) {
    throw new LichessRateLimitError();
  }

  if (!response.ok) {
    throw new Error(`Lichess respondeu HTTP ${String(response.status)}.`);
  }

  return parseRatingHistory(await response.json());
}
