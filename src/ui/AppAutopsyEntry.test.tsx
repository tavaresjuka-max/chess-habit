// @vitest-environment jsdom
// GRUPO A3 (2026-07-02): porta de entrada autópsia-primeiro. Cobre o caminho
// welcome → "Ver onde errei na última partida" → (mesmo funil de "Começar
// rápido") → aprova o plano → pousa no Hoje com a dobra da Autópsia já
// aberta e rolada até ela (a Autópsia deixou de ser uma aba própria — virou
// uma seção dobrável dentro do Hoje, perto de Plano e O que vem agora).
// Arquivo separado de App.test.tsx (781 linhas, mockeia useAppState pesado)
// porque este teste precisa do funil REAL de ponta a ponta, como smoke.test.tsx.
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { clearAll } from '../infra/storage/appData';
import { App } from './App';

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

describe('App — entrada autópsia-primeiro (GRUPO A3)', () => {
  it('welcome mostra a terceira via "Ver onde errei na última partida"', async () => {
    render(<App />);

    expect(await screen.findByText('A aula pode começar.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Começar rápido' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ver onde errei na última partida' })).toBeTruthy();
  });

  it('"Ver onde errei na última partida" termina o onboarding e abre a dobra da Autópsia no Hoje', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Ver onde errei na última partida' }));

    // Mesmo caminho de "Começar rápido": cai na aprovação do plano (nenhum
    // passo novo, nenhum passo removido).
    expect(await screen.findByText('Entendi o que você precisa.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar plano' }));

    // Fim do funil: a nav não tem mais aba "Autópsia" — só Hoje/Progresso/Ajustes.
    const nav = await screen.findByRole('navigation', { name: /navegação principal/i });
    await waitFor(() => {
      expect(within(nav).getByRole('button', { name: 'Hoje' })).toHaveAttribute('aria-current', 'page');
    });
    expect(within(nav).queryByRole('button', { name: 'Autópsia' })).toBeNull();

    // A dobra da Autópsia dentro do Hoje já chega ABERTA (pedido one-shot do
    // GRUPO A3), com o conteúdo da AutopsyView visível.
    expect(await screen.findByRole('heading', { name: 'Autópsia' })).toBeTruthy();
    expect(screen.getByText(/Cole o link da sua última partida; eu mostro o que treinar\./i)).toBeTruthy();
  });

  it('"Começar rápido" continua pousando no Hoje sem abrir a dobra da Autópsia', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Começar rápido' }));
    expect(await screen.findByText('Entendi o que você precisa.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar plano' }));

    const nav = await screen.findByRole('navigation', { name: /navegação principal/i });
    await waitFor(() => {
      expect(within(nav).getByRole('button', { name: 'Hoje' })).toHaveAttribute('aria-current', 'page');
    });
    expect(within(nav).queryByRole('button', { name: 'Autópsia' })).toBeNull();
    // A dobra existe (o título "Autópsia" aparece no summary fechado) mas o
    // conteúdo da AutopsyView (texto de instrução) não é montado ainda.
    expect(await screen.findByText('Autópsia')).toBeTruthy();
    expect(screen.queryByText(/Cole o link da sua última partida; eu mostro o que treinar\./i)).toBeNull();
  });
});
