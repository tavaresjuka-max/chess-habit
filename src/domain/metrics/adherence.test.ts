import { describe, expect, it } from 'vitest';
import type { TrainingLog } from '../types';
import { computeAdherence } from './adherence';

const NOW = Date.UTC(2026, 6, 2); // 2026-07-02T00:00:00.000Z

function doneLog(date: string, id: string): TrainingLog {
  return {
    id,
    date,
    blockId: `${date}-01-tema`,
    blockTitle: 'Tema do dia',
    source: 'lichess',
    destinationLabel: 'Lichess',
    plannedSeconds: 600,
    startedAt: `${date}T10:00:00.000Z`,
    completedAt: `${date}T10:08:00.000Z`,
    elapsedSeconds: 480,
    timeLimitReached: false,
    status: 'done',
    updatedAt: `${date}T10:08:00.000Z`,
  };
}

describe('computeAdherence', () => {
  it('marca not-evaluable quando adesão fica abaixo do piso (3/30 dias => 10%, floor 40)', () => {
    const logs = [
      doneLog('2026-07-02', 'a'),
      doneLog('2026-07-01', 'b'),
      doneLog('2026-06-30', 'c'),
    ];
    const result = computeAdherence(logs, { windowDays: 30, now: NOW, floorPercent: 40 });
    expect(result.daysActive).toBe(3);
    expect(result.adherencePercent).toBe(10);
    expect(result.windowDays).toBe(30);
    expect(result.verdict).toBe('not-evaluable');
  });

  it('marca evaluable quando adesão atinge o piso (15/30 dias => 50%, floor 40)', () => {
    const logs: TrainingLog[] = [];
    for (let i = 0; i < 15; i += 1) {
      const dayMillis = NOW - i * 2 * 86_400_000; // um dia ativo a cada 2 dias, 15 no total
      const date = new Date(dayMillis).toISOString().slice(0, 10);
      logs.push(doneLog(date, `log-${String(i)}`));
    }
    const result = computeAdherence(logs, { windowDays: 30, now: NOW, floorPercent: 40 });
    expect(result.daysActive).toBe(15);
    expect(result.adherencePercent).toBe(50);
    expect(result.verdict).toBe('evaluable');
  });

  it('retorna 0% not-evaluable quando não há logs na janela', () => {
    const result = computeAdherence([], { windowDays: 30, now: NOW, floorPercent: 40 });
    expect(result.daysActive).toBe(0);
    expect(result.adherencePercent).toBe(0);
    expect(result.verdict).toBe('not-evaluable');
  });

  it('ignora logs fora da janela', () => {
    const logs = [
      doneLog('2026-07-02', 'inside'),
      doneLog('2026-05-01', 'too-old'), // fora da janela de 30d
      doneLog('2026-07-03', 'future'), // depois de "now", fora da janela
    ];
    const result = computeAdherence(logs, { windowDays: 30, now: NOW, floorPercent: 40 });
    expect(result.daysActive).toBe(1);
    expect(result.adherencePercent).toBe(3);
  });

  it('conta múltiplos logs no mesmo dia como 1 dia ativo', () => {
    const logs = [
      doneLog('2026-07-02', 'a'),
      doneLog('2026-07-02', 'b'),
      doneLog('2026-07-02', 'c'),
    ];
    const result = computeAdherence(logs, { windowDays: 30, now: NOW, floorPercent: 40 });
    expect(result.daysActive).toBe(1);
    expect(result.adherencePercent).toBe(3);
  });

  it('ignora logs com status diferente de done', () => {
    const logs: TrainingLog[] = [
      { ...doneLog('2026-07-02', 'a'), status: 'skipped', completedAt: undefined },
      { ...doneLog('2026-07-01', 'b'), status: 'active', completedAt: undefined },
    ];
    const result = computeAdherence(logs, { windowDays: 30, now: NOW, floorPercent: 40 });
    expect(result.daysActive).toBe(0);
    expect(result.verdict).toBe('not-evaluable');
  });
});
