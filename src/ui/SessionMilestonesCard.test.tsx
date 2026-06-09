// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SessionMilestoneSummary } from '../domain';
import { SessionMilestonesCard } from './SessionMilestonesCard';

const summary: SessionMilestoneSummary = {
  heading: 'Metas da fase',
  intro: 'Vamos medir a fase por sessoes e horas concluidas, com checkpoints para ajustar o plano.',
  currentMilestone: {
    id: 'hours-6',
    label: 'Checkpoint 6h',
    targetHours: 6,
    targetSessions: 12,
    completedHours: 1.5,
    completedSessions: 3,
    progressPercent: 25,
    status: 'current',
  },
  milestones: [
    {
      id: 'hours-6',
      label: 'Checkpoint 6h',
      targetHours: 6,
      targetSessions: 12,
      completedHours: 1.5,
      completedSessions: 3,
      progressPercent: 25,
      status: 'current',
    },
    {
      id: 'hours-12',
      label: 'Checkpoint 12h',
      targetHours: 12,
      targetSessions: 24,
      completedHours: 1.5,
      completedSessions: 3,
      progressPercent: 13,
      status: 'future',
    },
  ],
  stats: {
    completedSessions: 3,
    completedHours: 1.5,
    completedBlocks: 5,
    skippedBlocks: 1,
    feedback: { easy: 1, good: 2, hard: 0 },
    puzzleAttempts: 20,
    puzzleWins: 15,
    puzzleLosses: 5,
    puzzleAccuracy: 75,
    bestTheme: 'Fork',
    weakTheme: 'Pin',
    improvementLines: [
      'Voce ja registrou 1.5h em 3 sessoes concluidas.',
      'Puzzles reconciliados: 15/20 acertos (75%).',
      'Tema mais estavel ate agora: Fork.',
    ],
  },
  nextCheckpoint: 'Proximo checkpoint: Checkpoint 6h. Faltam cerca de 4.5h para revisar o plano.',
};

describe('SessionMilestonesCard', () => {
  it('renders milestone progress, stats and observed evolution', () => {
    render(<SessionMilestonesCard summary={summary} />);

    expect(screen.getByRole('heading', { name: 'Metas da fase' })).toBeInTheDocument();
    expect(screen.getAllByText('Checkpoint 6h')).toHaveLength(2);
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('sessoes concluidas')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Puzzles reconciliados: 15/20 acertos (75%).')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Progresso de Checkpoint 6h' })).toHaveAttribute('value', '25');
  });
});
