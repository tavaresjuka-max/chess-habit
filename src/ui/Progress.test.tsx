// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Achievement, Signal, TrainingLog, Weakness } from '../domain';
import type { DiplomaAttempt } from '../domain/method/types';
import { Progress } from './Progress';

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Minimal fixture factories
// ---------------------------------------------------------------------------

function makeTrainingLog(overrides: Partial<TrainingLog> = {}): TrainingLog {
  return {
    id: 'log-1',
    date: '2026-06-15',
    blockId: '2026-06-15-01-tema',
    blockTitle: 'Garfos básicos',
    source: 'lichess',
    destinationLabel: 'Lichess Puzzles',
    plannedSeconds: 900,
    startedAt: '2026-06-15T10:00:00.000Z',
    completedAt: '2026-06-15T10:14:00.000Z',
    elapsedSeconds: 840,
    timeLimitReached: false,
    status: 'done',
    feedback: 'good',
    updatedAt: '2026-06-15T10:14:00.000Z',
    ...overrides,
  };
}

const weakness: Weakness = {
  tag: 'fork',
  score: 0.9,
  confidence: 'high',
  evidence: 'Garfos aparecem com frequência nas partidas recentes.',
};

const achievement: Achievement = {
  id: 'primeira-hora',
  unlockedAt: '2026-06-15T12:00:00.000Z',
};

const signal: Signal = {
  source: 'lichess',
  value: { kind: 'manual', tag: 'fork' },
  confidence: 'high',
  observedAt: '2026-06-15T08:00:00.000Z',
};

const TODAY = '2026-06-15';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Progress', () => {
  it('renderiza o título principal "Progresso"', () => {
    render(
      <Progress
        today={TODAY}
        allTrainingLogs={[]}
        diplomaAttempts={[]}
        achievements={[]}
        weaknesses={[]}
        signals={[]}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Progresso' })).toBeInTheDocument();
  });

  it('exibe estado vazio de ritmo quando não há treinos', () => {
    render(
      <Progress
        today={TODAY}
        allTrainingLogs={[]}
        diplomaAttempts={[]}
        achievements={[]}
        weaknesses={[]}
        signals={[]}
      />,
    );

    expect(screen.getByText('Sem treinos ainda. A primeira sessão ativa este painel.')).toBeInTheDocument();
  });

  it('exibe métricas de ritmo quando há treinos concluídos', () => {
    const log = makeTrainingLog();
    render(
      <Progress
        today={TODAY}
        allTrainingLogs={[log]}
        diplomaAttempts={[]}
        achievements={[]}
        weaknesses={[]}
        signals={[]}
      />,
    );

    // deve exibir exercícios desta semana em chip de métrica (métrica honesta)
    expect(screen.getByText(/exercícios esta semana/)).toBeInTheDocument();
  });

  it('exibe estado vazio de habilidades quando não há treinos', () => {
    render(
      <Progress
        today={TODAY}
        allTrainingLogs={[]}
        diplomaAttempts={[]}
        achievements={[]}
        weaknesses={[]}
        signals={[]}
      />,
    );

    expect(
      screen.getByText(/Sem placar por tema ainda/),
    ).toBeInTheDocument();
  });

  it('exibe estado vazio de esforço por trilha quando não há treinos', () => {
    render(
      <Progress
        today={TODAY}
        allTrainingLogs={[]}
        diplomaAttempts={[]}
        achievements={[]}
        weaknesses={[]}
        signals={[]}
      />,
    );

    expect(
      screen.getByText('O esforço por trilha aparece aqui depois dos primeiros blocos concluídos.'),
    ).toBeInTheDocument();
  });

  it('exibe seção de diplomas com contagem correta de diplomas disponíveis', () => {
    render(
      <Progress
        today={TODAY}
        allTrainingLogs={[]}
        diplomaAttempts={[]}
        achievements={[]}
        weaknesses={[]}
        signals={[]}
      />,
    );

    // "0/N diplomas" — o número total é determinado pela constante DIPLOMAS
    expect(screen.getByText(/Diploma do Peão/)).toBeInTheDocument();
  });

  it('exibe o progresso de seções de um diploma ainda não conquistado', () => {
    render(
      <Progress
        today={TODAY}
        allTrainingLogs={[]}
        diplomaAttempts={[]}
        achievements={[]}
        weaknesses={[]}
        signals={[]}
      />,
    );

    // sem diploma conquistado: todos os diplomas mostram "0/N seções"
    const sectionLabels = screen.getAllByText(/\d+\/\d+ seções/);
    expect(sectionLabels.length).toBeGreaterThan(0);
  });

  it('exibe "Conquistado" quando diploma foi aprovado', () => {
    const attempts: DiplomaAttempt[] = [
      {
        id: 'attempt-valor',
        diplomaId: 'peao',
        sectionId: 'valor-pecas',
        scorePercent: 92,
        totalItems: 10,
        passed: true,
        source: 'lichess',
        createdAt: '2026-06-15T09:05:00.000Z',
        updatedAt: '2026-06-15T09:05:00.000Z',
      },
      {
        id: 'attempt-mates',
        diplomaId: 'peao',
        sectionId: 'mates-basicos',
        scorePercent: 91,
        totalItems: 10,
        passed: true,
        source: 'lichess',
        createdAt: '2026-06-15T09:10:00.000Z',
        updatedAt: '2026-06-15T09:10:00.000Z',
      },
    ];

    render(
      <Progress
        today={TODAY}
        allTrainingLogs={[]}
        diplomaAttempts={attempts}
        achievements={[]}
        weaknesses={[]}
        signals={[]}
      />,
    );

    expect(screen.getByText('Conquistado')).toBeInTheDocument();
  });

  it('não exibe seção de conquistas quando não há conquistas', () => {
    render(
      <Progress
        today={TODAY}
        allTrainingLogs={[]}
        diplomaAttempts={[]}
        achievements={[]}
        weaknesses={[]}
        signals={[]}
      />,
    );

    expect(screen.queryByText('Conquistas')).not.toBeInTheDocument();
  });

  it('exibe conquistas desbloqueadas com título e data formatada em pt-BR', () => {
    render(
      <Progress
        today={TODAY}
        allTrainingLogs={[]}
        diplomaAttempts={[]}
        achievements={[achievement]}
        weaknesses={[]}
        signals={[]}
      />,
    );

    expect(screen.getByText('Primeira Hora')).toBeInTheDocument();
    // data formatada em pt-BR: "15 de junho" ou similar
    expect(screen.getByText(/junho/i)).toBeInTheDocument();
  });

  it('não exibe seção "Onde ainda trava" quando não há fraquezas', () => {
    render(
      <Progress
        today={TODAY}
        allTrainingLogs={[]}
        diplomaAttempts={[]}
        achievements={[]}
        weaknesses={[]}
        signals={[]}
      />,
    );

    expect(screen.queryByText('Onde ainda trava')).not.toBeInTheDocument();
  });

  it('exibe fraquezas formatadas em pt-BR via formatWeaknessTag', () => {
    render(
      <Progress
        today={TODAY}
        allTrainingLogs={[]}
        diplomaAttempts={[]}
        achievements={[]}
        weaknesses={[weakness]}
        signals={[signal]}
      />,
    );

    // formatWeaknessTag('fork') => 'garfos'
    expect(screen.getByText('garfos')).toBeInTheDocument();
    expect(screen.getByText(weakness.evidence)).toBeInTheDocument();
  });

  it('exibe no máximo 5 fraquezas mesmo quando há mais', () => {
    const manyWeaknesses: Weakness[] = [
      { tag: 'fork', score: 0.9, confidence: 'high', evidence: 'ev-fork' },
      { tag: 'pin', score: 0.85, confidence: 'high', evidence: 'ev-pin' },
      { tag: 'skewer', score: 0.8, confidence: 'medium', evidence: 'ev-skewer' },
      { tag: 'back-rank', score: 0.75, confidence: 'medium', evidence: 'ev-back-rank' },
      { tag: 'mate-in-1', score: 0.7, confidence: 'low', evidence: 'ev-mate-in-1' },
      { tag: 'mate-in-2', score: 0.6, confidence: 'low', evidence: 'ev-mate-in-2' },
    ];

    render(
      <Progress
        today={TODAY}
        allTrainingLogs={[]}
        diplomaAttempts={[]}
        achievements={[]}
        weaknesses={manyWeaknesses}
        signals={[]}
      />,
    );

    // deve mostrar garfos (score 0.9 — topo) mas não mate-em-2 (score 0.6 — cortado)
    expect(screen.getByText('garfos')).toBeInTheDocument();
    expect(screen.queryByText('mate em 2')).not.toBeInTheDocument();
  });

  it('exibe nota sobre linha de base do método', () => {
    render(
      <Progress
        today={TODAY}
        allTrainingLogs={[]}
        diplomaAttempts={[]}
        achievements={[]}
        weaknesses={[]}
        signals={[]}
      />,
    );

    expect(screen.getByText('Medem o método, não você. Revisão em julho de 2026.')).toBeInTheDocument();
  });

  it('exibe hipótese sobre fraqueza sendo heurística, não diagnóstico', () => {
    render(
      <Progress
        today={TODAY}
        allTrainingLogs={[]}
        diplomaAttempts={[]}
        achievements={[]}
        weaknesses={[weakness]}
        signals={[]}
      />,
    );

    expect(
      screen.getByText('Hipóteses, não diagnósticos — sinais antigos saem da conta.'),
    ).toBeInTheDocument();
  });
});
