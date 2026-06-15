import { describe, expect, it, vi } from 'vitest';
import type { TrainingResult } from '../domain';
import { LichessRateLimitError } from '../infra/lichess/puzzleActivity';
import { createReplayLogIfPossible } from './trainingLogFlow';

function dashboardResult(
  weakThemes: string[],
): Extract<TrainingResult, { kind: 'puzzle-dashboard' }> {
  return {
    source: 'lichess',
    kind: 'puzzle-dashboard',
    fetchedAt: '2026-06-14T10:00:00.000Z',
    since: '2026-05-15T00:00:00.000Z',
    until: '2026-06-14T10:00:00.000Z',
    days: 30,
    puzzles: 10,
    wins: 6,
    losses: 4,
    themes: ['fork'],
    themeStats: [{ theme: 'fork', attempts: 10, losses: 4 }],
    weakThemes,
    strongThemes: [],
  };
}

describe('createReplayLogIfPossible — propagação de rate limit (Corte D0)', () => {
  it('propaga LichessRateLimitError no 429 para ativar o cooldown da fila', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(new Response('', { status: 429 })));

    await expect(
      createReplayLogIfPossible('token-x', dashboardResult(['fork']), '2026-06-14T10:00:00.000Z', fetcher),
    ).rejects.toBeInstanceOf(LichessRateLimitError);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('engole erro de rede não-crítico (500) e devolve undefined', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(new Response('', { status: 500 })));

    const result = await createReplayLogIfPossible(
      'token-x',
      dashboardResult(['fork']),
      '2026-06-14T10:00:00.000Z',
      fetcher,
    );

    expect(result).toBeUndefined();
  });

  it('não chama a rede quando não há tema fraco', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(new Response('', { status: 200 })));

    const result = await createReplayLogIfPossible(
      'token-x',
      dashboardResult([]),
      '2026-06-14T10:00:00.000Z',
      fetcher,
    );

    expect(result).toBeUndefined();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
