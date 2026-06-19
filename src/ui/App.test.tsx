// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PRIVACY_SUMMARY } from '../config/appIdentity';

describe('LegalFooter privacidade', () => {
  it('mostra o resumo de privacidade ao expandir', async () => {
    const { LegalFooter } = await import('./App');

    render(<LegalFooter />);

    expect(screen.getByText(/Privacidade/i)).toBeInTheDocument();
    expect(screen.getByText(PRIVACY_SUMMARY[0])).toBeInTheDocument();
  });
});
