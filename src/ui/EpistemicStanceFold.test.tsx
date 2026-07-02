// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { EpistemicStanceFold } from './EpistemicStanceFold';

afterEach(cleanup);

// O Fold usa <details> nativo, fechado por padrão. Abrimos clicando no
// <summary> antes de checar o conteúdo interno (mesmo padrão de Config.test.tsx).
function openFold(titleText: string) {
  const title = screen.getByText(titleText);
  const summary = title.closest('summary');
  if (summary) fireEvent.click(summary);
}

describe('EpistemicStanceFold', () => {
  it('renders the fold title', () => {
    render(<EpistemicStanceFold />);

    expect(screen.getByText('Honestidade do método')).toBeInTheDocument();
  });

  it('shows the "não prova" language once expanded', () => {
    render(<EpistemicStanceFold />);
    openFold('Honestidade do método');

    expect(screen.getByText(/prova pouco/)).toBeInTheDocument();
  });

  it('distinguishes "ainda sem dado suficiente" from "em teste" once expanded', () => {
    render(<EpistemicStanceFold />);
    openFold('Honestidade do método');

    expect(screen.getByText(/ainda sem dado suficiente/)).toBeInTheDocument();
    expect(screen.getByText(/em teste/)).toBeInTheDocument();
  });

  it('renders the epistemic badge inside the fold', () => {
    render(<EpistemicStanceFold />);

    expect(screen.getByRole('status')).toHaveTextContent('medição em andamento — nada comprovado');
  });
});
