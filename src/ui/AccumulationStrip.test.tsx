// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AccumulationStrip } from './AccumulationStrip';

afterEach(cleanup);

const sampleDays = [
  { date: '2026-06-10', active: false },
  { date: '2026-06-11', active: true },
  { date: '2026-06-12', active: false },
  { date: '2026-06-13', active: true },
  { date: '2026-06-14', active: true },
];

describe('AccumulationStrip', () => {
  it('renderiza a faixa com aria-label factual (N de M dias com treino)', () => {
    render(<AccumulationStrip recentDays={sampleDays} />);
    expect(screen.getByRole('img', { name: /3 de 5 dias com treino/ })).toBeInTheDocument();
  });

  it('aceita aria-label customizado', () => {
    render(<AccumulationStrip recentDays={sampleDays} ariaLabel="Personalizado" />);
    expect(screen.getByRole('img', { name: 'Personalizado' })).toBeInTheDocument();
  });

  it('renderiza um span por dia', () => {
    const { container } = render(<AccumulationStrip recentDays={sampleDays} />);
    const spans = container.querySelectorAll('.accumulation-day');
    expect(spans).toHaveLength(5);
  });

  it('dias ativos têm a classe accumulation-day--active', () => {
    const { container } = render(<AccumulationStrip recentDays={sampleDays} />);
    const active = container.querySelectorAll('.accumulation-day--active');
    expect(active).toHaveLength(3); // 3 dias ativos no sampleDays
  });

  it('dias inativos NÃO têm a classe accumulation-day--active', () => {
    const days = [{ date: '2026-06-10', active: false }];
    const { container } = render(<AccumulationStrip recentDays={days} />);
    const inactive = container.querySelector('.accumulation-day');
    expect(inactive).not.toHaveClass('accumulation-day--active');
  });

  it('com lista vazia renderiza faixa sem spans e aria-label "0 de 0 dias com treino"', () => {
    render(<AccumulationStrip recentDays={[]} />);
    expect(screen.getByRole('img', { name: /0 de 0 dias com treino/ })).toBeInTheDocument();
  });

  it('não exibe texto visível — a semântica é via aria-label, blocos são aria-hidden', () => {
    const { container } = render(<AccumulationStrip recentDays={sampleDays} />);
    const spans = container.querySelectorAll('.accumulation-day');
    for (const span of spans) {
      expect(span).toHaveAttribute('aria-hidden', 'true');
    }
  });
});
