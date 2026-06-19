// @vitest-environment jsdom
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { type ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import type { PlanBlock } from '../domain';
import { BlockCarousel } from './BlockCarousel';

afterEach(cleanup);

function makeBlock(id: string, title: string): PlanBlock {
  return {
    id,
    title,
    source: 'lichess',
    destination: { source: 'lichess', label: 'Lichess', url: 'https://lichess.org/training/x' },
    estimatedMinutes: 10,
    task: 'tarefa',
    stopRule: 'pare',
    reason: 'motivo',
    coachNote: 'nota',
    status: 'pending',
    updatedAt: '2026-06-19T12:00:00.000Z',
  };
}

const blocks = [makeBlock('b1', 'Aquecimento'), makeBlock('b2', 'Tema'), makeBlock('b3', 'Revisão')];

function renderBlock(block: PlanBlock): ReactElement {
  return <p>{block.title}</p>;
}

describe('BlockCarousel', () => {
  it('renderiza um carrossel acessível com um slide por bloco e indicador de posição', () => {
    const { container } = render(<BlockCarousel blocks={blocks} renderBlock={renderBlock} />);

    const region = within(container).getByRole('region');
    expect(region.getAttribute('aria-roledescription')).toBe('carrossel');
    expect(within(container).getByText('Bloco 1 de 3')).toBeTruthy();
    expect(container.querySelectorAll('.block-carousel-slide')).toHaveLength(3);
    expect(container.querySelectorAll('.block-carousel-dot')).toHaveLength(3);
    expect(within(container).getByText('Aquecimento')).toBeTruthy();
  });

  it('alterna para o modo lista e de volta', () => {
    const { container } = render(<BlockCarousel blocks={blocks} renderBlock={renderBlock} />);

    fireEvent.click(within(container).getByRole('button', { name: /Ver lista/ }));

    // No modo lista não há carrossel, mas todos os blocos continuam visíveis.
    expect(within(container).queryByRole('region')).toBeNull();
    expect(container.querySelectorAll('.block-list > div')).toHaveLength(3);

    fireEvent.click(within(container).getByRole('button', { name: /Modo foco/ }));
    expect(within(container).getByRole('region')).toBeTruthy();
  });

  it('não renderiza nada sem blocos', () => {
    const { container } = render(<BlockCarousel blocks={[]} renderBlock={renderBlock} />);

    expect(container.firstChild).toBeNull();
  });
});
