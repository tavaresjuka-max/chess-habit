// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { App } from '../ui/App';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

describe('oauth callback recovery', () => {
  it('recovers from a cancelled lichess oauth without crashing and strips the error query', async () => {
    window.history.pushState({}, '', '/?error=access_denied&state=xyz');

    render(<App />);

    expect(await screen.findByText(/cancelou a conexao com o Lichess/i)).toBeTruthy();
    // O app continua utilizavel (view de config), nao caiu numa tela de erro.
    expect(screen.getByRole('button', { name: 'Config' })).toBeTruthy();

    await waitFor(() => {
      expect(window.location.search).toBe('');
    });
  });
});
