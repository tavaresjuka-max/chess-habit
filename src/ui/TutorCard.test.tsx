// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DailyPlan, TrainingLog, TutorQuestionAnswer, Weakness } from '../domain';
import { TutorCard } from './TutorCard';

const plan: DailyPlan = {
  date: '2026-06-08',
  sessionMinutes: 15,
  blocks: [],
  generatedFromWeaknessesAt: '2026-06-08T09:00:00.000Z',
};

const fallbackPlan: DailyPlan = {
  ...plan,
  weeklyFocus: {
    tag: 'fork',
    title: 'garfos',
    reason: 'Tema conservador da faixa atual enquanto ainda faltam sinais suficientes do histÃ³rico real.',
    startsOn: '2026-06-08',
  },
};

const weakness: Weakness = {
  tag: 'fork',
  score: 0.9,
  confidence: 'high',
  evidence: 'Garfos apareceram com frequência nas partidas recentes.',
};

const answerTutorQuestion = vi.fn<(answer: TutorQuestionAnswer) => Promise<void>>(() => Promise.resolve());
const reconcileLichessResults = vi.fn<() => Promise<void>>(() => Promise.resolve());

function doneLog(): TrainingLog {
  return {
    id: 'log-1',
    date: '2026-06-08',
    blockId: '2026-06-08-01-tema',
    blockTitle: 'Tema do dia',
    source: 'lichess',
    destinationLabel: 'Lichess',
    plannedSeconds: 600,
    startedAt: '2026-06-08T10:00:00.000Z',
    completedAt: '2026-06-08T10:08:00.000Z',
    elapsedSeconds: 480,
    timeLimitReached: false,
    status: 'done',
    feedback: 'hard',
    updatedAt: '2026-06-08T10:08:00.000Z',
  };
}

describe('TutorCard', () => {
  it('shows the welcome reason before any training is done', () => {
    render(
      <TutorCard
        plan={plan}
        weaknesses={[weakness]}
        trainingLogs={[]}
        today="2026-06-08"
        onAnswerTutorQuestion={answerTutorQuestion}
        onReconcileLichessResults={reconcileLichessResults}
      />,
    );
    expect(screen.getByText('Professor Lemos')).toBeInTheDocument();
    expect(screen.getByText(weakness.evidence)).toBeInTheDocument();
  });

  it('makes the initial fallback explicit when there are no real weakness signals', () => {
    render(
      <TutorCard
        plan={fallbackPlan}
        weaknesses={[]}
        trainingLogs={[]}
        today="2026-06-08"
        onAnswerTutorQuestion={answerTutorQuestion}
        onReconcileLichessResults={reconcileLichessResults}
      />,
    );
    expect(screen.getByText(/Faltam sinais do seu histórico/)).toBeInTheDocument();
  });

  it('shows the close message and the diagnosis after a done log', () => {
    render(
      <TutorCard
        plan={plan}
        weaknesses={[weakness]}
        trainingLogs={[doneLog()]}
        today="2026-06-08"
        onAnswerTutorQuestion={answerTutorQuestion}
        onReconcileLichessResults={reconcileLichessResults}
      />,
    );
    expect(screen.getByText(/reduzir a carga/)).toBeInTheDocument();
    expect(screen.getByText(/dois alvos/)).toBeInTheDocument();
  });

  it('uses reconciled puzzle theme stats for the post-training diagnosis', () => {
    const log = doneLog();
    render(
      <TutorCard
        plan={plan}
        weaknesses={[{ ...weakness, tag: 'blunder-rate' }]}
        trainingLogs={[
          {
            ...log,
            result: {
              source: 'lichess',
              kind: 'puzzle-activity',
              fetchedAt: '2026-06-08T10:10:00.000Z',
              since: '2026-06-08T10:00:00.000Z',
              until: '2026-06-08T10:10:00.000Z',
              puzzles: 5,
              wins: 2,
              losses: 3,
              themes: ['fork'],
              themeStats: [{ theme: 'fork', attempts: 5, losses: 3 }],
            },
          },
        ]}
        today="2026-06-08"
        onAnswerTutorQuestion={answerTutorQuestion}
        onReconcileLichessResults={reconcileLichessResults}
      />,
    );

    expect(screen.getByText(/garfos concentrou 3 erros em 5 tentativas/)).toBeInTheDocument();
  });

  it('offers question answers as manual tutor signals when diagnosis has no clear cause', () => {
    const onAnswer = vi.fn<(answer: TutorQuestionAnswer) => Promise<void>>(() => Promise.resolve());

    render(
      <TutorCard
        plan={plan}
        weaknesses={[]}
        trainingLogs={[doneLog()]}
        today="2026-06-08"
        onAnswerTutorQuestion={onAnswer}
        onReconcileLichessResults={reconcileLichessResults}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Peça solta' }));

    expect(onAnswer).toHaveBeenCalledWith('loose-piece');
  });

  it('offers puzzle reconciliation from the tutor card when a puzzle log has no result yet', () => {
    const onReconcile = vi.fn<() => Promise<void>>(() => Promise.resolve());

    render(
      <TutorCard
        plan={plan}
        weaknesses={[]}
        trainingLogs={[{ ...doneLog(), destinationLabel: 'Puzzles Lichess: Fork' }]}
        today="2026-06-08"
        onAnswerTutorQuestion={answerTutorQuestion}
        onReconcileLichessResults={onReconcile}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Conferir puzzles' }));

    expect(onReconcile).toHaveBeenCalledTimes(1);
  });
});
