// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PendingTrainingItem } from '../domain/method/types';
import { PendingReviewCard } from './PendingReviewCard';

const today = new Date().toISOString().slice(0, 10);

afterEach(() => {
  cleanup();
});

describe('PendingReviewCard', () => {
  it('renders the due pending count', () => {
    render(<PendingReviewCard pendingItems={[createItem()]} onOpenItem={() => undefined} onDeferItem={() => undefined} />);

    expect(screen.getByRole('heading', { name: 'Pendências de hoje (1)' })).toBeInTheDocument();
  });

  it('shows the Professor Lemos message', () => {
    render(<PendingReviewCard pendingItems={[createItem()]} onOpenItem={() => undefined} onDeferItem={() => undefined} />);

    expect(screen.getByText(/Antes de avançar/)).toBeInTheDocument();
  });

  it('calls onOpenItem from the Lichess button', () => {
    const item = createItem();
    const onOpen = vi.fn<(pendingItem: PendingTrainingItem) => void>();

    render(<PendingReviewCard pendingItems={[item]} onOpenItem={onOpen} onDeferItem={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: /Abrir no Lichess/ }));

    expect(onOpen).toHaveBeenCalledWith(item);
  });

  it('calls onDeferItem from the defer button', () => {
    const item = createItem();
    const onDefer = vi.fn<(pendingItem: PendingTrainingItem) => void>();

    render(<PendingReviewCard pendingItems={[item]} onOpenItem={() => undefined} onDeferItem={onDefer} />);
    fireEvent.click(screen.getByRole('button', { name: 'Adiar' }));

    expect(onDefer).toHaveBeenCalledWith(item);
  });

  it('renders nothing without pending items', () => {
    const { container } = render(<PendingReviewCard pendingItems={[]} onOpenItem={() => undefined} onDeferItem={() => undefined} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the all-clear state when items exist but none are due today', () => {
    const scheduled = createItem({ dueAt: '2999-01-01' });

    render(<PendingReviewCard pendingItems={[scheduled]} onOpenItem={() => undefined} onDeferItem={() => undefined} />);

    expect(screen.getByRole('heading', { name: 'Tudo em dia' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Abrir no Lichess/ })).not.toBeInTheDocument();
  });
});

function createItem(overrides: Partial<PendingTrainingItem> = {}): PendingTrainingItem {
  return {
    id: 'pending-1',
    origin: 'puzzle',
    title: 'Revisar tema: fork',
    weaknessTag: 'fork',
    methodTrackId: 'pending-review',
    lichessTheme: 'fork',
    lichessUrl: 'https://lichess.org/training/fork',
    prompt: 'Qual sinal do tabuleiro você ignorou?',
    dueAt: today,
    attempts: 0,
    status: 'open',
    createdAt: `${today}T00:00:00.000Z`,
    updatedAt: `${today}T00:00:00.000Z`,
    ...overrides,
  };
}
