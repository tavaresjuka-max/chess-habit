import { describe, expect, it } from 'vitest';
import type { TrainingLog } from '../types';
import { computeRecentActivity } from './recentActivity';

// Helper: cria um log 'done' com elapsedSeconds para a data informada.
function doneLog(date: string, id: string, elapsedSeconds = 480): TrainingLog {
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
    elapsedSeconds,
    timeLimitReached: false,
    status: 'done',
    updatedAt: `${date}T10:08:00.000Z`,
  };
}

describe('computeRecentActivity', () => {
  it('retorna zeros e recentDays todos inativos quando não há logs', () => {
    const result = computeRecentActivity([], '2026-06-23', 7);
    expect(result.todayMinutes).toBe(0);
    expect(result.weekSessions).toBe(0);
    expect(result.recentDays).toHaveLength(7);
    expect(result.recentDays.every((d) => !d.active)).toBe(true);
  });

  it('marca apenas os dias com log done como ativos — buracos não resetam nada', () => {
    const logs = [
      doneLog('2026-06-20', 'a'), // ativo
      // 21 inativo (buraco)
      doneLog('2026-06-22', 'b'), // ativo
      // 23 hoje, sem log
    ];
    const result = computeRecentActivity(logs, '2026-06-23', 7);
    // Os buracos são false; a janela é contínua
    const activeMap = Object.fromEntries(result.recentDays.map((d) => [d.date, d.active]));
    expect(activeMap['2026-06-20']).toBe(true);
    expect(activeMap['2026-06-21']).toBe(false); // buraco = espaço em branco
    expect(activeMap['2026-06-22']).toBe(true);
    expect(activeMap['2026-06-23']).toBe(false); // sem treino hoje
  });

  it('recentDays tem exatamente windowDays entradas em ordem cronológica', () => {
    const result = computeRecentActivity([], '2026-06-23', 14);
    expect(result.recentDays).toHaveLength(14);
    expect(result.recentDays.at(0)?.date).toBe('2026-06-10'); // 14 dias atrás (inclusive hoje = 14)
    expect(result.recentDays.at(-1)?.date).toBe('2026-06-23'); // hoje
  });

  it('recentDays de 7 dias começa há 6 dias (inclusive hoje = 7)', () => {
    const result = computeRecentActivity([], '2026-06-23', 7);
    expect(result.recentDays.at(0)?.date).toBe('2026-06-17');
    expect(result.recentDays.at(-1)?.date).toBe('2026-06-23');
  });

  it('weekSessions conta dias distintos com sessão nos últimos 7 dias', () => {
    const logs = [
      doneLog('2026-06-17', 'a'), // 7 dias atrás = dentro da janela
      doneLog('2026-06-17', 'b'), // mesmo dia → conta 1
      doneLog('2026-06-19', 'c'),
      doneLog('2026-06-23', 'd'), // hoje
      doneLog('2026-06-16', 'e'), // 8 dias atrás = fora da janela de 7 dias
    ];
    const result = computeRecentActivity(logs, '2026-06-23', 14);
    // Janela de 7 dias: 17,18,19,20,21,22,23 → 17(ativo), 19(ativo), 23(ativo) = 3 dias distintos
    expect(result.weekSessions).toBe(3);
  });

  it('todayMinutes soma elapsedSeconds/60 (arredondado) dos logs done de hoje', () => {
    const logs = [
      doneLog('2026-06-23', 'a', 600), // 10 min
      doneLog('2026-06-23', 'b', 300), // 5 min
      doneLog('2026-06-22', 'c', 9999), // outro dia — ignorar
    ];
    const result = computeRecentActivity(logs, '2026-06-23', 7);
    expect(result.todayMinutes).toBe(15); // 900/60 = 15
  });

  it('todayMinutes arredonda (450s → 8 min)', () => {
    const logs = [doneLog('2026-06-23', 'a', 450)]; // 7.5 → 8
    const result = computeRecentActivity(logs, '2026-06-23', 7);
    expect(result.todayMinutes).toBe(8);
  });

  it('ignora logs com status diferente de done', () => {
    const skipped: TrainingLog = { ...doneLog('2026-06-23', 'a'), status: 'skipped', completedAt: undefined };
    const active: TrainingLog = { ...doneLog('2026-06-23', 'b'), status: 'active', completedAt: undefined, elapsedSeconds: undefined };
    const result = computeRecentActivity([skipped, active], '2026-06-23', 7);
    expect(result.todayMinutes).toBe(0);
    expect(result.weekSessions).toBe(0);
    expect(result.recentDays.find((d) => d.date === '2026-06-23')?.active).toBe(false);
  });

  it('usa data local (YYYY-MM-DD) — o mesmo padrão de consistency.ts sem conversão UTC', () => {
    // Verificação: um log cuja date é '2026-06-23' deve ser ativo em '2026-06-23'
    const log = doneLog('2026-06-23', 'a');
    const result = computeRecentActivity([log], '2026-06-23', 7);
    expect(result.recentDays.find((d) => d.date === '2026-06-23')?.active).toBe(true);
  });

  it('virada de semana — domingo para segunda — sem reset de nada', () => {
    // 2026-06-21 = domingo, 2026-06-22 = segunda
    const logs = [doneLog('2026-06-21', 'a'), doneLog('2026-06-22', 'b')];
    const result = computeRecentActivity(logs, '2026-06-23', 7);
    const activeMap = Object.fromEntries(result.recentDays.map((d) => [d.date, d.active]));
    expect(activeMap['2026-06-21']).toBe(true);
    expect(activeMap['2026-06-22']).toBe(true);
  });
});
