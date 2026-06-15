// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from '../ui/App';
import { clearAll, markOnboardingCompleted, saveProfile } from '../infra/storage/appData';

beforeEach(async () => {
  // Salvar a config dispara auto-sync de fundo (Lichess/Chess.com). Sem stub, ele
  // bate na rede real e a promessa pendente deixava o teste instável (flake).
  vi.stubGlobal('fetch', () => Promise.reject(new TypeError('rede desativada no teste')));
  await clearAll();
  await saveProfile({
    lichessUsername: 'jukasparov',
    band: '800-1000',
    defaultSessionMinutes: 5,
    goals: [],
    updatedAt: '2026-06-06T00:00:00.000Z',
  });
  // Exercita o app principal (Hoje), não o funil de primeira vez.
  await markOnboardingCompleted();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('preserve progress across regeneration', () => {
  it('keeps a completed block done after the plan is regenerated', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Concluir' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Bom' }));

    await waitFor(
      () => {
        expect(screen.getByText('Feito')).toBeTruthy();
      },
      { timeout: 8000 },
    );

    // Salvar a config regenera o plano (mesmos minutos => mesmos ids de bloco).
    fireEvent.click(screen.getByRole('button', { name: 'Config' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }));

    // saveProfile volta para a tela Hoje; o bloco deve continuar "Feito".
    await waitFor(
      () => {
        expect(screen.getByText('Feito')).toBeTruthy();
      },
      { timeout: 8000 },
    );
    expect(screen.queryByText('Pendente')).toBeNull();
    // Teste de integração pesado (render + IndexedDB + reconcile + regeneração):
    // sob contenção da suíte cheia o fluxo passava de 5s e dava flake. O timeout
    // maior dá folga sem afrouxar as asserções.
  }, 15000);
});
