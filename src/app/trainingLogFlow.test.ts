import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrainingLog } from '../domain';
import { loadLichessOAuthToken } from '../infra/storage/appData';
import { reconcileLogIfPossible } from './trainingLogFlow';

vi.mock('../infra/storage/appData', () => ({
  loadLichessOAuthToken: vi.fn(),
}));

const loadLichessOAuthTokenMock = vi.mocked(loadLichessOAuthToken);

function doneLog(overrides?: Partial<TrainingLog>): TrainingLog {
  return {
    id: '2026-06-15:block-1',
    date: '2026-06-15',
    blockId: 'block-1',
    blockTitle: 'Treino',
    source: 'lichess',
    destinationLabel: 'Puzzle review video',
    logKind: 'standard',
    plannedSeconds: 600,
    startedAt: '2026-06-15T10:00:00.000Z',
    completedAt: '2026-06-15T10:10:00.000Z',
    elapsedSeconds: 600,
    timeLimitReached: false,
    status: 'done',
    updatedAt: '2026-06-15T10:10:00.000Z',
    ...overrides,
  };
}

describe('reconcileLogIfPossible', () => {
  beforeEach(() => {
    loadLichessOAuthTokenMock.mockReset();
  });

  it('does not reconcile a standard log just because the visible label says Puzzle', async () => {
    const log = doneLog();

    await expect(reconcileLogIfPossible(log)).resolves.toEqual({ log });

    expect(loadLichessOAuthTokenMock).not.toHaveBeenCalled();
  });

  it('uses the explicit puzzle log kind to decide reconciliation eligibility', async () => {
    loadLichessOAuthTokenMock.mockResolvedValue(undefined);

    await expect(reconcileLogIfPossible(doneLog({ logKind: 'puzzle' }))).resolves.toMatchObject({
      log: { logKind: 'puzzle' },
    });

    expect(loadLichessOAuthTokenMock).toHaveBeenCalledTimes(1);
  });
});
