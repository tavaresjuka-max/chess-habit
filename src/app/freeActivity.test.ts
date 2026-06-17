import { describe, expect, it } from 'vitest';
import type { TrainingLog } from '../domain';
import { freeActivityBlockId, importFreeActivity } from './trainingLogFlow';

function createNdjsonResponse(lines: object[]): Response {
  return new Response(lines.map((line) => JSON.stringify(line)).join('\n'), {
    status: 200,
    headers: { 'Content-Type': 'application/x-ndjson' },
  });
}

function createBlockLog(overrides?: Partial<TrainingLog>): TrainingLog {
  return {
    id: '2026-06-10:b1',
    date: '2026-06-10',
    blockId: 'b1',
    blockTitle: 'Garfos',
    source: 'lichess',
    destinationLabel: 'Puzzles Lichess',
    plannedSeconds: 600,
    startedAt: '2026-06-10T10:00:00.000Z',
    completedAt: '2026-06-10T10:10:00.000Z',
    elapsedSeconds: 600,
    timeLimitReached: false,
    status: 'done',
    updatedAt: '2026-06-10T10:10:00.000Z',
    ...overrides,
  };
}

const nowIso = '2026-06-10T12:00:00.000Z';

describe('importFreeActivity', () => {
  it('imports puzzles done outside planned block windows', async () => {
    const fetcher = (() =>
      Promise.resolve(
        createNdjsonResponse([
          // Dentro da janela do bloco: nao conta de novo.
          { date: Date.parse('2026-06-10T10:05:00.000Z'), win: true, puzzle: { id: 'a', rating: 900, themes: ['fork'] } },
          // Fora da janela: atividade livre legitima.
          { date: Date.parse('2026-06-10T11:00:00.000Z'), win: true, puzzle: { id: 'b', rating: 920, themes: ['fork'] } },
          { date: Date.parse('2026-06-10T11:05:00.000Z'), win: false, puzzle: { id: 'c', rating: 940, themes: ['pin'] } },
        ]),
      )) as unknown as typeof fetch;

    const outcome = await importFreeActivity({
      token: 'lio_test',
      existingLogs: [createBlockLog()],
      today: '2026-06-10',
      nowIso,
      fetcher,
    });

    expect(outcome.log?.blockId).toBe(freeActivityBlockId);
    expect(outcome.log?.logKind).toBe('free-activity');
    expect(outcome.log?.result?.puzzles).toBe(2);
    expect(outcome.log?.result?.wins).toBe(1);
    expect(outcome.log?.plannedSeconds).toBe(0);
    expect(outcome.log?.elapsedSeconds).toBe(0);
    expect(outcome.message).toContain('2 puzzles');
  });

  it('reports honestly when there is nothing new to import', async () => {
    const fetcher = (() => Promise.resolve(createNdjsonResponse([]))) as unknown as typeof fetch;

    const outcome = await importFreeActivity({
      token: 'lio_test',
      existingLogs: [],
      today: '2026-06-10',
      nowIso,
      fetcher,
    });

    expect(outcome.log).toBeUndefined();
    expect(outcome.message).toContain('Nenhum puzzle novo');
  });

  it('continues from the last import instead of re-importing the same window', async () => {
    const fetcher = (() =>
      Promise.resolve(
        createNdjsonResponse([
          { date: Date.parse('2026-06-10T10:30:00.000Z'), win: false, puzzle: { id: 'old', rating: 900, themes: ['pin'] } },
          { date: Date.parse('2026-06-10T11:30:00.000Z'), win: true, puzzle: { id: 'new', rating: 930, themes: ['fork'] } },
        ]),
      )) as unknown as typeof fetch;

    const previousImport = createBlockLog({
      id: '2026-06-10:atividade-livre-x',
      blockId: freeActivityBlockId,
      plannedSeconds: 0,
      result: {
        source: 'lichess',
        kind: 'puzzle-activity',
        fetchedAt: '2026-06-10T11:00:00.000Z',
        since: '2026-06-10T09:00:00.000Z',
        until: '2026-06-10T11:00:00.000Z',
        puzzles: 3,
        wins: 2,
        losses: 1,
        themes: ['fork'],
      },
    });

    const outcome = await importFreeActivity({
      token: 'lio_test',
      existingLogs: [previousImport],
      today: '2026-06-10',
      nowIso,
      fetcher,
    });

    expect(outcome.log?.result?.puzzles).toBe(1);
    expect(outcome.log?.result?.wins).toBe(1);
    expect(outcome.log?.result?.losses).toBe(0);
    expect(outcome.log?.result?.since).toBe('2026-06-10T11:00:00.000Z');
  });
});
