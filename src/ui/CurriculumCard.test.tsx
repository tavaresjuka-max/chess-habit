// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CurriculumCard } from './CurriculumCard';

afterEach(cleanup);

describe('CurriculumCard', () => {
  it('mostra todas as fases da jornada', () => {
    render(<CurriculumCard band="0-400" weeklyFocusTag={undefined} />);

    expect(screen.getByText('Fase 1 — Fundamentos')).toBeInTheDocument();
    expect(screen.getByText('Fase 2 — Tática nomeada')).toBeInTheDocument();
    expect(screen.getByText('Fase 3 — Cálculo e plano')).toBeInTheDocument();
    expect(screen.getByText('Fase 4 — Autonomia')).toBeInTheDocument();
  });

  it('abre a fase da banda atual com o marcador "você está aqui"', () => {
    render(<CurriculumCard band="800-1000" weeklyFocusTag={undefined} />);

    const currentPhase = screen.getByText('Fase 2 — Tática nomeada').closest('details');

    if (currentPhase === null) {
      throw new Error('fase atual não encontrada');
    }

    expect(currentPhase).toHaveAttribute('open');
    expect(within(currentPhase).getByText('você está aqui')).toBeInTheDocument();
  });

  it('destaca com "agora" a semana cujo tema é o foco do plano', () => {
    render(<CurriculumCard band="800-1000" weeklyFocusTag="discovered" />);

    const week = screen.getByText('Ataque descoberto e xeque duplo').closest('li');

    if (week === null) {
      throw new Error('semana não encontrada');
    }

    expect(within(week).getByText('agora')).toBeInTheDocument();
  });

  it('mostra a nota da fase sem detalhe semanal', () => {
    render(<CurriculumCard band="0-400" weeklyFocusTag={undefined} />);

    expect(screen.getByText(/Os mesmos temas voltam em posições mais difíceis/)).toBeInTheDocument();
  });
});
