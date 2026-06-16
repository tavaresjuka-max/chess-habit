// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { clearAll } from './infra/storage/appData';
import { App } from './ui/App';

beforeEach(async () => {
  await clearAll();
  try {
    sessionStorage.clear();
  } catch {
    // jsdom sempre tem sessionStorage; o guard é só por consistência.
  }
});

afterEach(() => {
  cleanup();
});

describe('App onboarding funnel (primeira vez)', () => {
  it('abre nas boas-vindas do professor, não num formulário', async () => {
    render(<App />);

    expect(await screen.findByText('A aula pode começar.')).toBeTruthy();
    expect(screen.getByText('Boas-vindas')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Vamos configurar' })).toBeTruthy();
    // Sem abas durante o funil.
    expect(screen.queryByRole('button', { name: 'Progresso' })).toBeNull();
  });

  it('avança para "Suas contas" em "Vamos configurar"', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Vamos configurar' }));

    expect(await screen.findByRole('heading', { name: 'Suas contas' })).toBeTruthy();
    expect(screen.getByText('Usuário Lichess')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeTruthy();
  });

  it('volta de "Suas contas" para as boas-vindas', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Vamos configurar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Voltar' }));

    expect(await screen.findByText('A aula pode começar.')).toBeTruthy();
  });

  it('sem conta: continuar em branco leva à avaliação de entrada', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Vamos configurar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Continuar' }));

    // Sem usuário informado: cai direto nas perguntas de calibração (sem rede).
    expect(await screen.findByText('Vamos calibrar seu plano')).toBeTruthy();
    expect(screen.getByText('Qual é a sua experiência com xadrez?')).toBeTruthy();
  });

  it('"Começar rápido" leva ao plano e aprovar cai no Hoje', async () => {
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
