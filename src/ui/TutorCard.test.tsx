// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DailyPlan, TrainingLog, Weakness } from '../domain';
import { TutorCard } from './TutorCard';

const plan: DailyPlan = {
  date: '2026-06-08',
  sessionMinutes: 15,
  blocks: [],
  generatedFromWeaknessesAt: '2026-06-08T09:00:00.000Z',
};

const weakness: Weakness = {
  tag: 'fork',
  score: 0.9,
  confidence: 'high',
  evidence: 'Garfos apareceram com frequência nas partidas recentes.',
};

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
    render(<TutorCard plan={plan} weaknesses={[weakness]} trainingLogs={[]} today="2026-06-08" />);
    expect(screen.getByText('Professor Lemos')).toBeInTheDocument();
    expect(screen.getByText(weakness.evidence)).toBeInTheDocument();
  });

  it('shows the close message and the diagnosis after a done log', () => {
    render(<TutorCard plan={plan} weaknesses={[weakness]} trainingLogs={[doneLog()]} today="2026-06-08" />);
    expect(screen.getByText(/reduzir a carga/)).toBeInTheDocument();
    expect(screen.getByText(/dois alvos/)).toBeInTheDocument();
  });
});
