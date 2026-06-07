// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from '../ui/App';
import { clearAll, saveProfile } from '../infra/storage/appData';

beforeEach(async () => {
  await clearAll();
  await saveProfile({
    lichessUsername: 'jukasparov',
    band: '800-1200',
    defaultSessionMinutes: 5,
    goals: [],
    updatedAt: '2026-06-06T00:00:00.000Z',
  });
});

afterEach(() => {
  cleanup();
});

describe('preserve progress across regeneration', () => {
  it('keeps a completed block done after the plan is regenerated', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Concluir' }));

    await waitFor(() => {
      expect(screen.getByText('Feito')).toBeTruthy();
    });

    // Salvar a config regenera o plano (mesmos minutos => mesmos ids de bloco).
    fireEvent.click(screen.getByRole('button', { name: 'Config' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }));

    // saveProfile volta para a tela Hoje; o bloco deve continuar "Feito".
    await waitFor(() => {
      expect(screen.getByText('Feito')).toBeTruthy();
    });
    expect(screen.queryByText('Pendente')).toBeNull();
  });
});
