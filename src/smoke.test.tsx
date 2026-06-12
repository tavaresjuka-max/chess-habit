// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { App } from './ui/App';

afterEach(() => {
  cleanup();
});

describe('App smoke', () => {
  it('boots the first run into the professor welcome, not a form', async () => {
    render(<App />);

    expect(await screen.findByText('A aula pode começar.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Começar agora' })).toBeTruthy();
  });

  it('opens manual setup from the welcome when asked', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Ajustar antes' }));

    expect(await screen.findByText('Usuário Lichess')).toBeTruthy();
  });
});
