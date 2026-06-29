// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlanBlock } from '../domain';
import { TodayHero } from './TodayHero';

afterEach(() => {
  cleanup();
  trainSpy.mockClear();
  changeSpy.mockClear();
});

const trainSpy = vi.fn(() => Promise.resolve());
const changeSpy = vi.fn();

function makeBlock(overrides: Partial<PlanBlock> = {}): PlanBlock {
  return {
    id: 'bloco-1',
    title: 'Tema do dia: garfos',
    source: 'lichess',
    destination: {
      source: 'lichess',
      label: 'Lichess Puzzles',
      url: 'https://lichess.org/training/fork',
    },
    estimatedMinutes: 12,
    task: 'Resolva com calma.',
    stopRule: 'Pare no tempo.',
    reason: 'Plano de hoje.',
    coachNote: 'Conte os defensores antes do lance.',
    status: 'pending',
    updatedAt: '2026-06-29T09:00:00.000Z',
    ...overrides,
  };
}

function renderHero(overrides: Partial<Parameters<typeof TodayHero>[0]> = {}) {
  return render(
    <TodayHero
      heroBlock={makeBlock()}
      doneBlockCount={1}
      totalBlocks={3}
      currentStreakDays={4}
      learnerBand="800-1000"
      dueCount={0}
      checkpointLabel="Ciclo 6h"
      remainingSessions={2}
      onStartBlockTraining={trainSpy}
      onChangeFocus={changeSpy}
      {...overrides}
    />,
  );
}

describe('TodayHero — faixa de progresso', () => {
  it('renderiza a faixa com done/total, banda e progressbar acessível', () => {
    renderHero();

    const bar = screen.getByRole('progressbar', { name: /progresso do dia/i });
    expect(bar).toHaveAttribute('aria-valuenow', '1');
    expect(bar).toHaveAttribute('aria-valuemax', '3');

    expect(screen.getByText(/1\/3 blocos/)).toBeInTheDocument();
    expect(screen.getByText(/faixa 800-1000/)).toBeInTheDocument();
  });

  it('mostra a sequência quando >= 2 dias', () => {
    renderHero({ currentStreakDays: 4 });
    expect(screen.getByLabelText(/4 dias seguidos de treino/i)).toBeInTheDocument();
  });

  it('omite a sequência abaixo de 2 dias (sem vergonha de zero)', () => {
    renderHero({ currentStreakDays: 0 });
    expect(screen.queryByText('dias seguidos')).not.toBeInTheDocument();
  });
});

describe('TodayHero — badge de vencidas (Fugu #3 — progresso não mente)', () => {
  it('aparece quando dueCount > 0 (com accessible name para leitores de tela)', () => {
    renderHero({ dueCount: 3 });
    const badge = screen.getByText(/3 vencidas/);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAccessibleName(/3 revisões vencidas/i);
  });

  it('usa singular quando dueCount === 1', () => {
    renderHero({ dueCount: 1 });
    expect(screen.getByText(/1 vencida/)).toBeInTheDocument();
    expect(screen.queryByText(/1 vencidas/)).not.toBeInTheDocument();
  });

  it('some quando dueCount = 0', () => {
    renderHero({ dueCount: 0 });
    expect(screen.queryByText(/vencidas/i)).not.toBeInTheDocument();
  });
});

describe('TodayHero — card de missão a partir de heroBlock', () => {
  it('mostra título, minutos estimados e coachNote', () => {
    renderHero();

    expect(screen.getByText('Tema do dia: garfos')).toBeInTheDocument();
    expect(screen.getByText(/≈ 12 min/)).toBeInTheDocument();
    expect(screen.getByText(/Lichess Puzzles/)).toBeInTheDocument();
    expect(screen.getByText('Conte os defensores antes do lance.')).toBeInTheDocument();
  });

  it('renderiza o retrato do Tavarez grande com alt descritivo', () => {
    renderHero();

    const portrait = screen.getByAltText(/professor tavarez/i);
    expect(portrait).toBeInTheDocument();
    expect(portrait).toHaveAttribute('src', '/art/tavarez-hero-retrato.webp');
  });

  it('mostra estado "concluído" e SEM botão Treinar quando heroBlock undefined', () => {
    renderHero({ heroBlock: undefined });

    expect(screen.getByText('Treino de hoje fechado')).toBeInTheDocument();
    expect(screen.getByText(/Dia concluído/i)).toBeInTheDocument();
    expect(screen.queryByText('Treinar agora')).not.toBeInTheDocument();
    expect(screen.queryByText('Trocar o foco de hoje')).not.toBeInTheDocument();
  });
});

describe('TodayHero — botões de ação', () => {
  it('mostra os botões Treinar agora e Trocar o foco de hoje', () => {
    renderHero();

    expect(screen.getByText('Treinar agora')).toBeInTheDocument();
    expect(screen.getByText('Trocar o foco de hoje')).toBeInTheDocument();
  });

  it('Treinar agora reusa o handler onStartBlockTraining com o heroBlock (zero lógica nova)', () => {
    renderHero();

    fireEvent.click(screen.getByText('Treinar agora'));

    expect(trainSpy).toHaveBeenCalledTimes(1);
    expect(trainSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'bloco-1' }));
  });

  it('Trocar o foco de hoje dispara onChangeFocus (revela o carrossel existente)', () => {
    renderHero();

    fireEvent.click(screen.getByText('Trocar o foco de hoje'));

    expect(changeSpy).toHaveBeenCalledTimes(1);
  });

  it('treinar também funciona quando o bloco não tem URL permitida (vira button)', () => {
    renderHero({
      heroBlock: makeBlock({
        destination: { source: 'lichess', label: 'Sem link', url: undefined },
      }),
    });

    fireEvent.click(screen.getByText('Treinar agora'));

    expect(trainSpy).toHaveBeenCalledTimes(1);
  });
});

describe('TodayHero — chips glanceable (sempre visíveis)', () => {
  it('mostra os três chips: a recuperar, checkpoint, sessões restantes', () => {
    renderHero({ dueCount: 2, checkpointLabel: 'Ciclo 6h', remainingSessions: 3 });

    const chips = screen.getByRole('list', { name: /sinais de hoje/i });
    expect(chips).toHaveTextContent('A recuperar');
    expect(chips).toHaveTextContent('2');
    expect(chips).toHaveTextContent('Checkpoint');
    expect(chips).toHaveTextContent('Ciclo 6h');
    expect(chips).toHaveTextContent('Sessões restantes');
    expect(chips).toHaveTextContent('3');
  });
});
