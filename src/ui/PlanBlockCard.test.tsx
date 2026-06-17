// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlanBlock } from '../domain';
import { PlanBlockCard } from './PlanBlockCard';

afterEach(cleanup);

describe('PlanBlockCard', () => {
  it('resets transient feedback state when the block changes', () => {
    const { rerender } = renderPlanBlockCard(makeBlock({ id: 'block-1', title: 'Aquecimento' }));

    fireEvent.click(screen.getByRole('button', { name: /Concluir/ }));
    expect(screen.getByText('Como foi o treino?')).toBeInTheDocument();

    rerender(
      <PlanBlockCard
        {...makeProps({
          block: makeBlock({ id: 'block-2', title: 'Puzzles de garfo' }),
        })}
      />,
    );

    expect(screen.queryByText('Como foi o treino?')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Abrir no Lichess: Puzzles de garfo/ })).toBeInTheDocument();
  });

  it('does not render an external href when the destination is not a Lichess HTTPS URL', () => {
    renderPlanBlockCard(
      makeBlock({
        id: 'unsafe-block',
        destination: {
          source: 'lichess',
          label: 'Destino quebrado',
          url: 'javascript:alert(1)',
        },
      }),
    );

    expect(screen.queryByRole('link', { name: /Abrir no Lichess/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar bloco' })).toBeInTheDocument();
  });
});

function renderPlanBlockCard(block: PlanBlock) {
  return render(<PlanBlockCard {...makeProps({ block })} />);
}

function makeProps(overrides: Partial<Parameters<typeof PlanBlockCard>[0]> = {}): Parameters<typeof PlanBlockCard>[0] {
  return {
    block: makeBlock({ id: 'block-1' }),
    nowIso: '2026-06-17T12:00:00.000Z',
    trainingLog: undefined,
    hasSavedPending: false,
    onSavePendingFromHardFeedback: vi.fn(() => Promise.resolve()),
    onStartBlockTraining: vi.fn(() => Promise.resolve()),
    onCompleteBlockTraining: vi.fn(() => Promise.resolve()),
    onSkipBlockTraining: vi.fn(() => Promise.resolve()),
    ...overrides,
  };
}

function makeBlock(overrides: Partial<PlanBlock> & { id: string }): PlanBlock {
  const { id, ...restOverrides } = overrides;

  return {
    id,
    title: 'Tema do dia: garfos',
    source: 'lichess',
    destination: {
      source: 'lichess',
      label: 'Puzzles Lichess: Fork',
      url: 'https://lichess.org/training/fork',
    },
    estimatedMinutes: 10,
    task: 'Resolva os puzzles do tema com calma.',
    stopRule: 'Pare quando o tempo acabar.',
    reason: 'Tema do plano de hoje.',
    coachNote: 'Conte os defensores antes do lance.',
    status: 'pending',
    updatedAt: '2026-06-17T12:00:00.000Z',
    ...restOverrides,
  };
}
