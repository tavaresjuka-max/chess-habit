// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { clearAll } from './infra/storage/appData';
import { App } from './ui/App';

beforeEach(async () => {
  await clearAll();
});

afterEach(() => {
  cleanup();
});

describe('App onboarding funnel (primeira vez)', () => {
  it('abre no Passo 1 — boas-vindas do professor, não um formulário', async () => {
    render(<App />);

    expect(await screen.findByText('A aula pode começar.')).toBeTruthy();
    expect(screen.getByText('Passo 1 de 3')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Vamos configurar' })).toBeTruthy();
    // Sem abas durante o funil.
    expect(screen.queryByRole('button', { name: 'Progresso' })).toBeNull();
  });

  it('avança para o Passo 2 (configuração essencial) em "Vamos configurar"', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Vamos configurar' }));

    expect(await screen.findByText('Passo 2 de 3')).toBeTruthy();
    expect(screen.getByText('Usuário Lichess')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeTruthy();
  });

  it('volta do Passo 2 para as boas-vindas', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Vamos configurar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Voltar' }));

    expect(await screen.findByText('A aula pode começar.')).toBeTruthy();
  });

  it('"Começar rápido" leva ao Passo 3 (aprovar plano) e aprovar cai no Hoje', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Começar rápido' }));

    expect(await screen.findByText('Entendi o que você precisa.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar plano' }));

    // Fim do funil: as abas aparecem (cai no app principal).
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Hoje' })).toBeTruthy();
    });
  });
});
