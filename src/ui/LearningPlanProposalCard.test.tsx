// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LearningPlanProposal } from '../domain';
import { LearningPlanProposalCard } from './LearningPlanProposalCard';

const proposal: LearningPlanProposal = {
  heading: 'Entendi o que você precisa.',
  intro: 'Olhei seus sinais de treino.',
  phaseTitle: 'Primeira fase: garfos',
  focusItems: ['Ver garfos com cavalo, bispo, peão e dama.', 'Repetir puzzles variados de garfo.'],
  estimate: 'Estimativa inicial: 30 horas, cerca de 60 sessões de 30 min.',
  checkpoint: 'Depois de 6 horas fazemos um teste curto.',
  caveat: 'Isso não é promessa de rating.',
  reviewPrompt: 'Você pode aprovar o plano ou pedir revisão.',
};

afterEach(() => {
  cleanup();
});

describe('LearningPlanProposalCard', () => {
  it('renders the proposal and approves it', async () => {
    const onApprove = vi.fn<() => Promise<void>>(() => Promise.resolve());

    render(
      <LearningPlanProposalCard
        proposal={proposal}
        response={undefined}
        onApprovePlan={onApprove}
        onRequestPlanRevision={() => Promise.resolve()}
      />,
    );

    expect(screen.getByText('Entendi o que você precisa.')).toBeInTheDocument();
    expect(screen.getByText('Primeira fase: garfos')).toBeInTheDocument();
    expect(screen.getByText(/60 sessões de 30 min/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Aprovar plano' }));

    await waitFor(() => {
      expect(onApprove).toHaveBeenCalledTimes(1);
    });
  });

  it('records a revision request with suggested preferences', async () => {
    const onRequestRevision = vi.fn<(note: string) => Promise<void>>(() => Promise.resolve());

    render(
      <LearningPlanProposalCard
        proposal={proposal}
        response={undefined}
        onApprovePlan={() => Promise.resolve()}
        onRequestPlanRevision={onRequestRevision}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Revisar plano' }));
    fireEvent.click(screen.getByRole('button', { name: 'mais exercícios' }));
    fireEvent.change(screen.getByLabelText('O que você quer mudar?'), {
      target: { value: 'Também quero partidas de 15+10.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar revisão' }));

    await waitFor(() => {
      expect(onRequestRevision).toHaveBeenCalledWith('Também quero partidas de 15+10.');
    });
  });
});
