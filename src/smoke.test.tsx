// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { App } from './ui/App';

afterEach(() => {
  cleanup();
});

describe('App smoke', () => {
  it('boots the local-first shell into the config view for a first run', async () => {
    render(<App />);

    expect(await screen.findByRole('button', { name: 'Config' })).toBeTruthy();
    expect(await screen.findByText('Usuario Lichess')).toBeTruthy();
  });
});
