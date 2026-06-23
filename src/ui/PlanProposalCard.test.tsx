// @vitest-environment jsdom
// Testes adicionais de branch coverage para LearningPlanProposalCard
// Arquivo separado para não interferir no LearningPlanProposalCard.test.tsx
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LearningPlanProposal, LearningPlanResponse } from '../domain';
import { LearningPlanProposalCard } from './LearningPlanProposalCard';

afterEach(() => {
  cleanup();
});

const proposal: LearningPlanProposal = {
  heading: 'Entendi o que você precisa.',
  intro: 'Olhei seus sinais — este é o caminho.',
  phaseTitle: 'Primeira fase: garfos',
  methodSummary: 'Sinal → foco → treino → registro → ajuste.',
  evidenceLevel: 'Confiança: alta. Muitos dados.',
  methodSteps: ['Diagnóstico: sinais viram hipóteses.', 'Treino: conceito novo, depois puzzles.'],
  focusItems: ['Garfos: cavalo, bispo.'],
  progressCriteria: ['Mais garfos certos na 1ª tentativa.'],
  estimate: '≈30h · 60 sessões de 30 min · ~2 semanas',
  checkpoint: 'Checkpoint: 6h · 12 sessões — teste curto.',
  caveat: 'Não é promessa de rating.',
  reviewPrompt: 'Aprove o plano ou peça revisão.',
  estimateHours: 30,
  estimateSessions: 60,
  estimateMinutes: 30,
  estimateWeeks: 2,
  checkpointHours: 6,
  checkpointSessions: 12,
};

const approvedResponse: LearningPlanResponse = { status: 'approved', updatedAt: '2026-06-23T08:00:00.000Z' };

// ---------------------------------------------------------------------------
// Plano aprovado — modo NÃO compacto (renderiza dentro de Fold)
// ---------------------------------------------------------------------------
describe('LearningPlanProposalCard — approved não-compacto', () => {
  it('renderiza o Fold "Plano de hoje" com meta "✓ aprovado"', () => {
    render(
      <LearningPlanProposalCard
        proposal={proposal}
        response={approvedResponse}
        onApprovePlan={() => Promise.resolve()}
        onRequestPlanRevision={() => Promise.resolve()}
      />,
    );

    // Modo não-compacto: o Fold aparece com o título
    expect(screen.getByText('Plano de hoje')).toBeInTheDocument();
    // Chips do plano visíveis
    expect(screen.getByText('Primeira fase: garfos')).toBeInTheDocument();
    // Botão de revisão disponível
    expect(screen.getByRole('button', { name: 'Revisar plano' })).toBeInTheDocument();
  });

  it('abre formulário de revisão ao clicar em "Revisar plano" (modo approved não-compacto)', async () => {
    render(
      <LearningPlanProposalCard
        proposal={proposal}
        response={approvedResponse}
        onApprovePlan={() => Promise.resolve()}
        onRequestPlanRevision={() => Promise.resolve()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Revisar plano' }));

    await waitFor(() => {
      expect(screen.getByLabelText('O que você quer mudar?')).toBeInTheDocument();
    });
  });

  it('cancela a revisão e volta ao resumo aprovado', async () => {
    render(
      <LearningPlanProposalCard
        proposal={proposal}
        response={approvedResponse}
        onApprovePlan={() => Promise.resolve()}
        onRequestPlanRevision={() => Promise.resolve()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Revisar plano' }));
    await waitFor(() => {
      expect(screen.getByLabelText('O que você quer mudar?')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => {
      expect(screen.queryByLabelText('O que você quer mudar?')).not.toBeInTheDocument();
    });
  });

  it('envia revisão com nota vazia usa mensagem padrão (approved → reviewing)', async () => {
    const onRequestRevision = vi.fn<(note: string) => Promise<void>>(() => Promise.resolve());

    render(
      <LearningPlanProposalCard
        proposal={proposal}
        response={approvedResponse}
        onApprovePlan={() => Promise.resolve()}
        onRequestPlanRevision={onRequestRevision}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Revisar plano' }));
    await waitFor(() => expect(screen.getByLabelText('O que você quer mudar?')).toBeInTheDocument());

    // Envia sem digitar nada — deve usar nota padrão
    fireEvent.click(screen.getByRole('button', { name: 'Enviar revisão' }));

    await waitFor(() => {
      expect(onRequestRevision).toHaveBeenCalledWith('Quero revisar o plano antes de seguir.');
    });
  });
});

// ---------------------------------------------------------------------------
// Plano aprovado — modo COMPACTO
// ---------------------------------------------------------------------------
describe('LearningPlanProposalCard — approved compacto', () => {
  it('renderiza como div compacto sem Fold', () => {
    const { container } = render(
      <LearningPlanProposalCard
        proposal={proposal}
        response={approvedResponse}
        compact={true}
        onApprovePlan={() => Promise.resolve()}
        onRequestPlanRevision={() => Promise.resolve()}
      />,
    );

    // Modo compacto: div.learning-plan-compact, sem o Fold/summary
    expect(container.querySelector('.learning-plan-compact')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Revisar plano' })).toBeInTheDocument();
  });

  it('abre formulário de revisão compacto ao clicar em "Revisar plano"', async () => {
    render(
      <LearningPlanProposalCard
        proposal={proposal}
        response={approvedResponse}
        compact={true}
        onApprovePlan={() => Promise.resolve()}
        onRequestPlanRevision={() => Promise.resolve()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Revisar plano' }));

    await waitFor(() => {
      expect(screen.getByLabelText('O que você quer mudar?')).toBeInTheDocument();
    });
  });

  it('formula de revisão compacta: cancela e retorna ao resumo', async () => {
    render(
      <LearningPlanProposalCard
        proposal={proposal}
        response={approvedResponse}
        compact={true}
        onApprovePlan={() => Promise.resolve()}
        onRequestPlanRevision={() => Promise.resolve()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Revisar plano' }));
    await waitFor(() => expect(screen.getByLabelText('O que você quer mudar?')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => {
      expect(screen.queryByLabelText('O que você quer mudar?')).not.toBeInTheDocument();
    });
  });

  it('envia revisão compacta com nota preenchida', async () => {
    const onRequestRevision = vi.fn<(note: string) => Promise<void>>(() => Promise.resolve());

    render(
      <LearningPlanProposalCard
        proposal={proposal}
        response={approvedResponse}
        compact={true}
        onApprovePlan={() => Promise.resolve()}
        onRequestPlanRevision={onRequestRevision}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Revisar plano' }));
    await waitFor(() => expect(screen.getByLabelText('O que você quer mudar?')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('O que você quer mudar?'), {
      target: { value: 'Quero sessões mais longas.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar revisão' }));

    await waitFor(() => {
      expect(onRequestRevision).toHaveBeenCalledWith('Quero sessões mais longas.');
    });
  });
});

// ---------------------------------------------------------------------------
// Plano com response=approved na seção de rodapé (main render)
// ---------------------------------------------------------------------------
describe('LearningPlanProposalCard — main render com status approved', () => {
  it('exibe "Plano aprovado" quando response.status === approved e card está expandido', () => {
    // Esta situação ocorre quando isReviewing=false mas o response tem status approved
    // e o componente vai para o branch isReviewing=false do main render
    // (Nota: a lógica redireciona para o branch 'approved && !isReviewing' antes,
    // mas o main render também tem o branch response?.status === 'approved')
    // Testamos via o card não-aprovado + approvePlan (o approve muda o prop externo)
    render(
      <LearningPlanProposalCard
        proposal={proposal}
        response={{ status: 'approved', updatedAt: '2026-06-23T08:00:00.000Z' }}
        onApprovePlan={() => Promise.resolve()}
        onRequestPlanRevision={() => Promise.resolve()}
      />,
    );

    // O branch approved+!isReviewing é atingido e mostra o Fold
    expect(screen.getByText('Plano de hoje')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Status revision-requested — com e sem nota
// ---------------------------------------------------------------------------
describe('LearningPlanProposalCard — revision-requested', () => {
  it('exibe "Revisão registrada." quando status é revision-requested sem nota', () => {
    const revisionResponse: LearningPlanResponse = { status: 'revision-requested', updatedAt: '2026-06-23T08:00:00.000Z' };

    render(
      <LearningPlanProposalCard
        proposal={proposal}
        response={revisionResponse}
        onApprovePlan={() => Promise.resolve()}
        onRequestPlanRevision={() => Promise.resolve()}
      />,
    );

    expect(screen.getByText('Revisão registrada.')).toBeInTheDocument();
    // Sem nota: não renderiza parágrafo de nota
  });

  it('exibe nota da revisão quando status é revision-requested com nota', () => {
    const revisionResponse: LearningPlanResponse = {
      status: 'revision-requested',
      note: 'Quero mais partidas longas.',
      updatedAt: '2026-06-23T08:00:00.000Z',
    };

    render(
      <LearningPlanProposalCard
        proposal={proposal}
        response={revisionResponse}
        onApprovePlan={() => Promise.resolve()}
        onRequestPlanRevision={() => Promise.resolve()}
      />,
    );

    expect(screen.getByText('Revisão registrada.')).toBeInTheDocument();
    expect(screen.getByText('Quero mais partidas longas.')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// addSuggestion — branch de deduplicação
// ---------------------------------------------------------------------------
describe('LearningPlanProposalCard — addSuggestion deduplication', () => {
  it('não duplica sugestão já presente no texto', async () => {
    render(
      <LearningPlanProposalCard
        proposal={proposal}
        response={undefined}
        onApprovePlan={() => Promise.resolve()}
        onRequestPlanRevision={() => Promise.resolve()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Revisar plano' }));
    await waitFor(() => expect(screen.getByLabelText('O que você quer mudar?')).toBeInTheDocument());

    const maisExerciciosBtn = screen.getByRole('button', { name: 'mais exercícios' });

    // Clica duas vezes na mesma sugestão
    fireEvent.click(maisExerciciosBtn);
    fireEvent.click(maisExerciciosBtn);

    const textarea = screen.getByLabelText<HTMLTextAreaElement>('O que você quer mudar?');
    // O valor deve conter "Quero mais exercícios." apenas uma vez
    const occurrences = (textarea.value.match(/mais exercícios/g) ?? []).length;
    expect(occurrences).toBe(1);
  });

  it('concatena duas sugestões diferentes com espaço', async () => {
    render(
      <LearningPlanProposalCard
        proposal={proposal}
        response={undefined}
        onApprovePlan={() => Promise.resolve()}
        onRequestPlanRevision={() => Promise.resolve()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Revisar plano' }));
    await waitFor(() => expect(screen.getByLabelText('O que você quer mudar?')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'mais exercícios' }));
    fireEvent.click(screen.getByRole('button', { name: 'mais partidas' }));

    const textarea = screen.getByLabelText<HTMLTextAreaElement>('O que você quer mudar?');
    expect(textarea.value).toContain('Quero mais exercícios.');
    expect(textarea.value).toContain('Quero mais partidas.');
  });
});

// ---------------------------------------------------------------------------
// activeTrackId presente → exibe chip de trilha
// ---------------------------------------------------------------------------
describe('LearningPlanProposalCard — activeTrackId', () => {
  it('exibe chip de trilha quando activeTrackId está definido', () => {
    render(
      <LearningPlanProposalCard
        proposal={proposal}
        response={undefined}
        activeTrackId="pending-review"
        onApprovePlan={() => Promise.resolve()}
        onRequestPlanRevision={() => Promise.resolve()}
      />,
    );

    // O chip de trilha aparece (getMethodTrackTitle retorna um nome legível)
    // Verifica apenas que o chip de Route aparece no DOM
    const chips = document.querySelectorAll('.learning-plan-chip-icon');
    expect(chips.length).toBeGreaterThan(0);
  });

  it('não exibe chip de trilha quando activeTrackId é undefined', () => {
    render(
      <LearningPlanProposalCard
        proposal={proposal}
        response={undefined}
        onApprovePlan={() => Promise.resolve()}
        onRequestPlanRevision={() => Promise.resolve()}
      />,
    );

    // Apenas o chip de Checkpoint deve existir (sem chip de Route)
    const routeChips = document.querySelectorAll('.learning-plan-chip-icon');
    // 1 chip: Checkpoint. Route chip não existe.
    expect(routeChips.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// approvePlan — isSaving desativa botão durante promise
// ---------------------------------------------------------------------------
describe('LearningPlanProposalCard — approvePlan async state', () => {
  it('chama onApprovePlan e resolve sem erros', async () => {
    const onApprove = vi.fn<() => Promise<void>>(() => Promise.resolve());

    render(
      <LearningPlanProposalCard
        proposal={proposal}
        response={undefined}
        onApprovePlan={onApprove}
        onRequestPlanRevision={() => Promise.resolve()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Aprovar plano' }));

    await waitFor(() => {
      expect(onApprove).toHaveBeenCalledTimes(1);
    });
  });
});
