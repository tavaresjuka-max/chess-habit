// @vitest-environment jsdom
import { render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TacticDiagram } from './TacticDiagram';

describe('TacticDiagram', () => {
  it('renderiza o diagrama do garfo com role img e aria-label', () => {
    const { container } = render(<TacticDiagram tag="fork" />);

    const img = within(container).getByRole('img');
    expect(img.getAttribute('aria-label')).toMatch(/garfo/i);
  });

  it('desenha o tabuleiro completo (size×size casas)', () => {
    const { container } = render(<TacticDiagram tag="fork" />);

    // fork usa size 5 → 25 casas.
    expect(container.querySelectorAll('rect')).toHaveLength(25);
  });

  it('não renderiza nada para conceito sem diagrama (time-trouble)', () => {
    const { container } = render(<TacticDiagram tag="time-trouble" />);

    expect(container.firstChild).toBeNull();
  });

  it('não renderiza nada sem tag', () => {
    const { container } = render(<TacticDiagram tag={undefined} />);

    expect(container.firstChild).toBeNull();
  });
});
