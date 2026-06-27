// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlanBlock } from '../domain';
import { PlanBlockCard } from './PlanBlockCard';

afterEach(cleanup);

describe('PlanBlockCard', () => {
  it('resets transient feedback state when the block changes', () => {
    const { rerender } = renderPlanBlockCard(makeBlock({ id: 'block-1', title: 'Aquecimento' }));

    fireEvent.click(screen.getByRole('button', { name: /Concluir/ }));
    expect(screen.getByText('Como foi o treino?')).toBeInTheDocument();

    rerender(
      <PlanBlockCard
        {...makeProps({
          block: makeBlock({ id: 'block-2', title: 'Puzzles de garfo' }),
        })}
      />,
    );

    expect(screen.queryByText('Como foi o treino?')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Abrir no Lichess: Puzzles de garfo/ })).toBeInTheDocument();
  });

  it('does not render an external href when the destination is not a Lichess HTTPS URL', () => {
    renderPlanBlockCard(
      makeBlock({
        id: 'unsafe-block',
        destination: {
          source: 'lichess',
          label: 'Destino quebrado',
          url: 'javascript:alert(1)',
        },
      }),
    );

    expect(screen.queryByRole('link', { name: /Abrir no Lichess/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar bloco' })).toBeInTheDocument();
  });

  it('mostra o diagrama do conceito quando o bloco tem weaknessTag', () => {
    renderPlanBlockCard(makeBlock({ id: 'fork-block', weaknessTag: 'fork' }));

    expect(screen.getByRole('img', { name: /garfo/i })).toBeInTheDocument();
  });

  it('asks for confirmation before skipping a block', () => {
    const onSkipBlockTraining = vi.fn(() => Promise.resolve());

    render(<PlanBlockCard {...makeProps({ onSkipBlockTraining })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pular' }));

    expect(onSkipBlockTraining).not.toHaveBeenCalled();
    expect(screen.getByRole('group', { name: 'Confirmar pular bloco' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Pular mesmo' }));

    expect(onSkipBlockTraining).toHaveBeenCalledWith('block-1');
  });

  it('move o foco para Voltar ao confirmar e o devolve ao Pular ao cancelar (a11y)', () => {
    render(<PlanBlockCard {...makeProps()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pular' }));
    expect(screen.getByRole('button', { name: 'Voltar' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.getByRole('button', { name: 'Pular' })).toHaveFocus();
  });

  it('mostra o chip de progresso do diploma quando informado (PROD-5)', () => {
    render(
      <PlanBlockCard {...makeProps({ diplomaProgress: { label: 'Tática Rotulada', attempts: 18, target: 30 } })} />,
    );

    expect(screen.getByText(/Tática Rotulada: 18\/30/)).toBeInTheDocument();
  });

  it('limita o numerador do chip ao alvo e some sem progresso', () => {
    const { rerender } = render(
      <PlanBlockCard {...makeProps({ diplomaProgress: { label: 'Tática Rotulada', attempts: 42, target: 30 } })} />,
    );
    expect(screen.getByText(/Tática Rotulada: 30\/30/)).toBeInTheDocument();

    rerender(<PlanBlockCard {...makeProps()} />);
    expect(screen.queryByText(/🏅/)).not.toBeInTheDocument();
  });

  it('carimba "Boa!" na transição para concluído (council)', () => {
    const { rerender } = render(<PlanBlockCard {...makeProps({ block: makeBlock({ id: 'b1', status: 'pending' }) })} />);
    expect(screen.queryByText('Boa!')).not.toBeInTheDocument();

    rerender(<PlanBlockCard {...makeProps({ block: makeBlock({ id: 'b1', status: 'done' }) })} />);
    expect(screen.getByText('Boa!')).toBeInTheDocument();
  });

  it('não carimba um bloco que já monta concluído (sem recarimbar no reload)', () => {
    render(<PlanBlockCard {...makeProps({ block: makeBlock({ id: 'b2', status: 'done' }) })} />);

    expect(screen.queryByText('Boa!')).not.toBeInTheDocument();
  });

  it('não mostra diagrama quando o bloco não tem weaknessTag', () => {
    renderPlanBlockCard(makeBlock({ id: 'no-tag' }));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('mostra a pergunta-guia quando o bloco tem guidingQuestion', () => {
    renderPlanBlockCard(
      makeBlock({ id: 'guiding-block', guidingQuestion: 'Quais são meus 2 candidatos?' }),
    );

    expect(screen.getByText('Quais são meus 2 candidatos?')).toBeInTheDocument();
  });

  it('não mostra a pergunta-guia quando o bloco não tem guidingQuestion', () => {
    const { container } = renderPlanBlockCard(makeBlock({ id: 'no-guiding' }));

    expect(container.querySelector('.guiding-question')).not.toBeInTheDocument();
  });

  // Fase 1 (1a, 2026-06-24): seletor de taxonomia de erro aparece SÓ no fluxo
  // de feedback 'hard'. Não aparece em easy/good. Não bloqueia (há "Registrar assim").
  describe('seletor de errorType (Fase 1)', () => {
    it('mostra o seletor "O que falhou?" apenas após clicar em Difícil', () => {
      renderPlanBlockCard(makeBlock({ id: 'block-1' }));

      fireEvent.click(screen.getByRole('button', { name: /Concluir/ }));
      // ainda no grupo easy/good/hard — seletor não aparece
      expect(screen.queryByRole('group', { name: 'O que falhou?' })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Difícil' }));

      // agora o seletor aparece no lugar do grupo easy/good/hard
      expect(screen.getByRole('group', { name: 'O que falhou?' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'NÃO VI' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ERREI A CONTA' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ESCOLHI ERRADO' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Registrar assim' })).toBeInTheDocument();
    });

    it('não mostra o seletor após clicar em Fácil (easy)', () => {
      const onCompleteBlockTraining = vi.fn(() => Promise.resolve());
      render(<PlanBlockCard {...makeProps({ onCompleteBlockTraining })} />);

      fireEvent.click(screen.getByRole('button', { name: /Concluir/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Fácil' }));

      expect(screen.queryByRole('group', { name: 'O que falhou?' })).not.toBeInTheDocument();
      expect(onCompleteBlockTraining).toHaveBeenCalledWith('block-1', 'easy');
    });

    it('não mostra o seletor após clicar em Bom (good)', () => {
      const onCompleteBlockTraining = vi.fn(() => Promise.resolve());
      render(<PlanBlockCard {...makeProps({ onCompleteBlockTraining })} />);

      fireEvent.click(screen.getByRole('button', { name: /Concluir/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Bom' }));

      expect(screen.queryByRole('group', { name: 'O que falhou?' })).not.toBeInTheDocument();
      expect(onCompleteBlockTraining).toHaveBeenCalledWith('block-1', 'good');
    });

    it('clicar em NÃO VI completa o bloco com errorType=nao-vi (1 toque)', () => {
      const onCompleteBlockTraining = vi.fn(() => Promise.resolve());
      render(<PlanBlockCard {...makeProps({ onCompleteBlockTraining })} />);

      fireEvent.click(screen.getByRole('button', { name: /Concluir/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Difícil' }));
      fireEvent.click(screen.getByRole('button', { name: 'NÃO VI' }));

      expect(onCompleteBlockTraining).toHaveBeenCalledWith('block-1', 'hard', 'nao-vi', undefined);
    });

    it('Registrar assim completa sem errorType (não bloqueia o fluxo)', () => {
      const onCompleteBlockTraining = vi.fn(() => Promise.resolve());
      render(<PlanBlockCard {...makeProps({ onCompleteBlockTraining })} />);

      fireEvent.click(screen.getByRole('button', { name: /Concluir/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Difícil' }));
      fireEvent.click(screen.getByRole('button', { name: 'Registrar assim' }));

      expect(onCompleteBlockTraining).toHaveBeenCalledWith('block-1', 'hard', undefined, undefined);
    });

    it('envia a autoexplicação quando preenchida antes do 1-toque', () => {
      const onCompleteBlockTraining = vi.fn(() => Promise.resolve());
      render(<PlanBlockCard {...makeProps({ onCompleteBlockTraining })} />);

      fireEvent.click(screen.getByRole('button', { name: /Concluir/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Difícil' }));
      fireEvent.change(screen.getByPlaceholderText(/Por que esse lance/), {
        target: { value: 'Não vi a torre desprotegida.' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'ESCOLHI ERRADO' }));

      expect(onCompleteBlockTraining).toHaveBeenCalledWith(
        'block-1',
        'hard',
        'escolhi-errado',
        'Não vi a torre desprotegida.',
      );
    });
  });
});

function renderPlanBlockCard(block: PlanBlock) {
  return render(<PlanBlockCard {...makeProps({ block })} />);
}

function makeProps(overrides: Partial<Parameters<typeof PlanBlockCard>[0]> = {}): Parameters<typeof PlanBlockCard>[0] {
  return {
    block: makeBlock({ id: 'block-1' }),
    nowIso: '2026-06-17T12:00:00.000Z',
    trainingLog: undefined,
    hasSavedPending: false,
    onSavePendingFromHardFeedback: vi.fn(() => Promise.resolve()),
    onStartBlockTraining: vi.fn(() => Promise.resolve()),
    onCompleteBlockTraining: vi.fn(() => Promise.resolve()),
    onSkipBlockTraining: vi.fn(() => Promise.resolve()),
    ...overrides,
  };
}

function makeBlock(overrides: Partial<PlanBlock> & { id: string }): PlanBlock {
  const { id, ...restOverrides } = overrides;

  return {
    id,
    title: 'Tema do dia: garfos',
    source: 'lichess',
    destination: {
      source: 'lichess',
      label: 'Puzzles Lichess: Fork',
      url: 'https://lichess.org/training/fork',
    },
    estimatedMinutes: 10,
    task: 'Resolva os puzzles do tema com calma.',
    stopRule: 'Pare quando o tempo acabar.',
    reason: 'Tema do plano de hoje.',
    coachNote: 'Conte os defensores antes do lance.',
    status: 'pending',
    updatedAt: '2026-06-17T12:00:00.000Z',
    ...restOverrides,
  };
}
