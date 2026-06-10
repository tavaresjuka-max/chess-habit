import { describe, expect, it } from 'vitest';
import { filterRecentArchives } from './chesscomClient';

const base = 'https://api.chess.com/pub/player/jukatavares/games';

describe('filterRecentArchives', () => {
  it('keeps only the last 3 months by default', () => {
    const archives = [
      `${base}/2024/01`,
      `${base}/2026/03`,
      `${base}/2026/04`,
      `${base}/2026/05`,
      `${base}/2026/06`,
    ];

    expect(filterRecentArchives(archives, '2026-06-10T00:00:00.000Z')).toEqual([
      `${base}/2026/04`,
      `${base}/2026/05`,
      `${base}/2026/06`,
    ]);
  });

  it('handles the year boundary', () => {
    const archives = [`${base}/2025/11`, `${base}/2025/12`, `${base}/2026/01`];

    expect(filterRecentArchives(archives, '2026-01-15T00:00:00.000Z')).toEqual([
      `${base}/2025/11`,
      `${base}/2025/12`,
      `${base}/2026/01`,
    ]);
  });

  it('drops malformed archive urls', () => {
    expect(filterRecentArchives([`${base}/extra/2026/06/x`], '2026-06-10T00:00:00.000Z')).toEqual([]);
  });
});
