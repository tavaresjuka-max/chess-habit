// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LearningPlanProposal } from '../domain';
import { LearningPlanProposalCard } from './LearningPlanProposalCard';

const proposal: LearningPlanProposal = {
  heading: 'Entendi o que você precisa.',
  intro: 'Olhei seus sinais — este é o caminho.',
  phaseTitle: 'Primeira fase: garfos',
  methodSummary: 'Sinal → foco → treino → registro → ajuste.',
  evidenceLevel: 'Confiança: média. Hipótese prática.',
  methodSteps: ['Diagnóstico: sinais viram hipóteses.', 'Treino: conceito novo, depois puzzles variados.'],
  focusItems: ['Garfos: cavalo, bispo, peão, dama.', 'Puzzles variados de garfo.'],
  progressCriteria: ['Mais garfos certos na 1ª tentativa.', 'Registrar: fácil / bom / difícil.'],
  estimate: '≈30h · 60 sessões de 30 min · ~2 semanas',
  checkpoint: 'Marco: 6h · 12 sessões — teste curto, plano ajustado.',
  caveat: 'Não é promessa de rating.',
  reviewPrompt: 'Aprove o plano ou peça revisão.',
  estimateHours: 30,
  estimateSessions: 60,
  estimateMinutes: 30,
  estimateWeeks: 2,
  checkpointHours: 6,
  checkpointSessions: 12,
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
    expect(screen.getByText('Como o plano foi montado')).toBeInTheDocument();
    expect(screen.getByText('Sinal → foco → treino → registro → ajuste.')).toBeInTheDocument();
    expect(screen.getByText('Como vamos medir progresso')).toBeInTheDocument();
    expect(screen.getByText('Mais garfos certos na 1ª tentativa.')).toBeInTheDocument();
    // Números da estimativa renderizados como destaque, não como frase.
    expect(screen.getByText('≈30')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText(/Marco: 6h · 12 sessões/)).toBeInTheDocument();

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
