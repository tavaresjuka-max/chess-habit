// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { EpistemicBadge } from './EpistemicBadge';

afterEach(cleanup);

describe('EpistemicBadge', () => {
  it('renders the default honest label with an appropriate ARIA role', () => {
    render(<EpistemicBadge />);

    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('medição em andamento — nada comprovado');
  });

  it('renders a custom label when provided', () => {
    render(<EpistemicBadge label="ainda sem dado suficiente" />);

    expect(screen.getByRole('status')).toHaveTextContent('ainda sem dado suficiente');
  });
});
