// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);
import type { BackupMeta } from '../app/backupStatus';
import type { Achievement, DailyPlan, PlanBlock, TrainingLog } from '../domain';
import { Today } from './Today';

function makeBlock(overrides: Partial<PlanBlock> & { id: string }): PlanBlock {
  return {
    title: 'Tema do dia: garfos',
    source: 'lichess',
    destination: { source: 'lichess', label: 'Lichess Puzzles', url: 'https://lichess.org/training/fork' },
    estimatedMinutes: 10,
    task: 'Resolva os puzzles do tema com calma.',
    stopRule: 'Pare quando o tempo acabar.',
    reason: 'Tema do plano de hoje.',
    coachNote: 'Conte os defensores antes do lance.',
    status: 'pending',
    updatedAt: '2026-06-12T09:00:00.000Z',
    ...overrides,
  };
}

function makePlan(blocks: PlanBlock[], extra: Partial<DailyPlan> = {}): DailyPlan {
  return {
    date: '2026-06-12',
    sessionMinutes: 15,
    blocks,
    generatedFromWeaknessesAt: '2026-06-12T09:00:00.000Z',
    ...extra,
  };
}

function makeDoneLog(blockId: string, elapsedSeconds: number): TrainingLog {
  return {
    id: `2026-06-12:${blockId}`,
    date: '2026-06-12',
    blockId,
    blockTitle: 'Tema do dia: garfos',
    source: 'lichess',
    destinationLabel: 'Lichess Puzzles',
    plannedSeconds: 600,
    startedAt: '2026-06-12T10:00:00.000Z',
    completedAt: '2026-06-12T10:10:00.000Z',
    elapsedSeconds,
    timeLimitReached: false,
    status: 'done',
    updatedAt: '2026-06-12T10:10:00.000Z',
  };
}

const noop = vi.fn(() => Promise.resolve());

function renderToday({
  blocks,
  trainingLogs = [],
  achievements = [],
  backupMeta = recentBackupMeta,
  emptyState = false,
  onCreateNextSession = noop,
  showCalibrationInvite = false,
  onStartCalibration = () => undefined,
  chronicSupportSuggested = false,
  routingEmphasis,
}: {
  blocks: PlanBlock[];
  trainingLogs?: TrainingLog[];
  achievements?: Achievement[];
  backupMeta?: BackupMeta | null;
  emptyState?: boolean;
  onCreateNextSession?: typeof noop;
  showCalibrationInvite?: boolean;
  onStartCalibration?: () => void;
  chronicSupportSuggested?: boolean;
  routingEmphasis?: 'detection-volume' | 'calculation' | 'candidate-selection';
}) {
  return render(
    <Today
      plan={
        emptyState
          ? undefined
          : makePlan(blocks, {
              ...(chronicSupportSuggested ? { chronicSupportSuggested: true } : {}),
              ...(routingEmphasis !== undefined ? { routingEmphasis } : {}),
            })
      }
      roadmap={[]}
      sessionMinutes={15}
      learnerBand="0-400"
      trainingLogs={trainingLogs}
      allTrainingLogs={trainingLogs}
      pendingItems={[]}
      achievements={achievements}
      weaknesses={[]}
      lichessConnectionState="disconnected"
      backupMeta={backupMeta ?? undefined}
      onSessionMinutesChange={noop}
      onCreateNextSession={onCreateNextSession}
      onAnswerTutorQuestion={noop}
      onImportFreeActivity={noop}
      onReconcileLichessResults={noop}
      onApproveLearningPlan={noop}
      onRequestLearningPlanRevision={noop}
      onOpenPendingItem={noop}
      onDeferPendingItem={noop}
      onSavePendingFromHardFeedback={noop}
      onStartBlockTraining={noop}
      onCompleteBlockTraining={noop}
      onSkipBlockTraining={noop}
      showCalibrationInvite={showCalibrationInvite}
      onStartCalibration={onStartCalibration}
    />,
  );
}

const recentBackupMeta: BackupMeta = {
  checksum: 'recent',
  exportedAt: '2026-06-12T10:00:00.000Z',
  recordCount: 12,
};

describe('Today — hero "Agora"', () => {
  it('mostra o primeiro bloco pendente como Próximo passo', () => {
    renderToday({
      blocks: [
        makeBlock({ id: 'bloco-1', title: 'Lição guiada de garfos' }),
        makeBlock({ id: 'bloco-2', title: 'Puzzles de garfo' }),
      ],
    });

    const hero = screen.getByRole('region', { name: /próximo passo/i });

    expect(within(hero).getByText('Lição guiada de garfos')).toBeInTheDocument();
  });

  it('mostra o bloco do hero no TodayHero e no carrossel (sem lista de sessões dedicada)', () => {
    renderToday({
      blocks: [
        makeBlock({ id: 'bloco-1', title: 'Lição guiada de garfos' }),
        makeBlock({ id: 'bloco-2', title: 'Puzzles de garfo' }),
      ],
    });

    // O título do hero aparece agora no cabeçalho action-first (TodayHero) e no
    // carrossel de treino (fluxo real preservado). Não há mais uma "lista de
    // sessões" separada que duplicasse o bloco.
    expect(screen.getAllByText('Lição guiada de garfos')).toHaveLength(2);
    // O bloco que NÃO é hero aparece só no carrossel.
    expect(screen.getAllByText('Puzzles de garfo')).toHaveLength(1);
  });

  it('promove o bloco com treino ativo a "Treinando agora"', () => {
    const activeLog: TrainingLog = {
      ...makeDoneLog('bloco-2', 0),
      status: 'active',
      elapsedSeconds: undefined,
      completedAt: undefined,
    };

    renderToday({
      blocks: [
        makeBlock({ id: 'bloco-1', status: 'done' }),
        makeBlock({ id: 'bloco-2', title: 'Puzzles de garfo' }),
      ],
      trainingLogs: [activeLog],
    });

    const hero = screen.getByRole('region', { name: /treinando agora/i });

    expect(within(hero).getByText('Puzzles de garfo')).toBeInTheDocument();
  });

  it('some quando todos os blocos terminam', () => {
    renderToday({
      blocks: [
        makeBlock({ id: 'bloco-1', status: 'done' }),
        makeBlock({ id: 'bloco-2', status: 'done' }),
      ],
      trainingLogs: [makeDoneLog('bloco-1', 600), makeDoneLog('bloco-2', 300)],
    });

    expect(screen.queryByRole('region', { name: /próximo passo/i })).not.toBeInTheDocument();
  });

  it('arquiva o plano e mostra o fecho "Dia completo" quando todos terminam', () => {
    renderToday({
      blocks: [
        makeBlock({ id: 'bloco-1', status: 'done' }),
        makeBlock({ id: 'bloco-2', status: 'done' }),
      ],
      trainingLogs: [makeDoneLog('bloco-1', 600), makeDoneLog('bloco-2', 300)],
    });

    expect(screen.getByRole('heading', { name: 'Dia completo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Plano do dia' }).closest('section')).toHaveClass('plan-archived');
  });
});

describe('Today — empty-state', () => {
  it('mostra um CTA para montar o plano quando não há plano (não "Configure o app")', () => {
    const onCreateNextSession = vi.fn(() => Promise.resolve());
    renderToday({ blocks: [], emptyState: true, onCreateNextSession });

    expect(screen.queryByText(/Configure o app/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Montar meu plano de hoje/i }));
    expect(onCreateNextSession).toHaveBeenCalledWith(15);
  });
});

describe('Today — convite de calibração', () => {
  it('mostra o convite, navega ao calibrar e some ao dispensar', () => {
    const onStartCalibration = vi.fn();
    renderToday({ blocks: [makeBlock({ id: 'b1' })], showCalibrationInvite: true, onStartCalibration });

    fireEvent.click(screen.getByRole('button', { name: 'Ajustar meu nível' }));
    expect(onStartCalibration).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Agora não' }));
    expect(screen.queryByText(/Quer ajustar seu nível/)).not.toBeInTheDocument();
  });

  it('não mostra o convite por padrão', () => {
    renderToday({ blocks: [makeBlock({ id: 'b1' })] });

    expect(screen.queryByText(/Quer ajustar seu nível/)).not.toBeInTheDocument();
  });
});

describe('Today — números do dia', () => {
  it('mostra blocos concluídos e minutos reais de hoje', () => {
    renderToday({
      blocks: [
        makeBlock({ id: 'bloco-1', status: 'done' }),
        makeBlock({ id: 'bloco-2' }),
      ],
      trainingLogs: [makeDoneLog('bloco-1', 540)],
    });

    const stats = screen.getByRole('list', { name: /números de hoje/i });

    expect(within(stats).getByText('1/2')).toBeInTheDocument();
    expect(within(stats).getByText('9')).toBeInTheDocument();
    expect(within(stats).getByText('min hoje')).toBeInTheDocument();
  });

  it('não mostra streak de 0 ou 1 dia (sem vergonha de zero)', () => {
    renderToday({
      blocks: [makeBlock({ id: 'bloco-1' })],
    });

    expect(screen.queryByText('dias seguidos')).not.toBeInTheDocument();
  });
});

describe('Today — lembrete de backup', () => {
  it('mostra aviso quando ainda nao existe backup exportado (com treino feito)', () => {
    renderToday({
      blocks: [makeBlock({ id: 'bloco-1' })],
      trainingLogs: [makeDoneLog('bloco-1', 540)],
      backupMeta: null,
    });

    expect(screen.getByText(/Backup local: ainda não há export JSON/i)).toBeInTheDocument();
  });

  it('nao mostra aviso de backup no dia 1, antes de qualquer treino', () => {
    renderToday({ blocks: [makeBlock({ id: 'bloco-1' })], backupMeta: null });

    expect(screen.queryByText(/Backup local: ainda não há export/i)).not.toBeInTheDocument();
  });

  it('mostra aviso quando o backup local esta atrasado', () => {
    renderToday({
      blocks: [makeBlock({ id: 'bloco-1' })],
      backupMeta: {
        checksum: 'old',
        exportedAt: '2026-06-01T10:00:00.000Z',
        recordCount: 12,
      },
    });

    expect(screen.getByText('Backup local: último export há 11 dias.')).toBeInTheDocument();
  });

  it('nao mostra aviso quando o backup e recente', () => {
    renderToday({ blocks: [makeBlock({ id: 'bloco-1' })] });

    expect(screen.queryByText(/Backup local:/i)).not.toBeInTheDocument();
  });
});

describe('Today — conquistas no relatório do dia', () => {
  it('inclui a linha sóbria da conquista desbloqueada hoje no fechamento', () => {
    renderToday({
      blocks: [makeBlock({ id: 'bloco-1', status: 'done' })],
      trainingLogs: [makeDoneLog('bloco-1', 600)],
      achievements: [{ id: 'primeira-hora', unlockedAt: '2026-06-12T10:10:00.000Z' }],
    });

    expect(
      screen.getByText('Sua primeira hora de treino real, construída em mais de um dia. Isso é rotina se formando.'),
    ).toBeInTheDocument();
  });

  it('não mostra linha de conquista de outro dia', () => {
    renderToday({
      blocks: [makeBlock({ id: 'bloco-1', status: 'done' })],
      trainingLogs: [makeDoneLog('bloco-1', 600)],
      achievements: [{ id: 'primeira-hora', unlockedAt: '2026-06-10T10:10:00.000Z' }],
    });

    expect(
      screen.queryByText('Sua primeira hora de treino real, construída em mais de um dia. Isso é rotina se formando.'),
    ).not.toBeInTheDocument();
  });
});

describe('Today — faixa de acumulação (substitui contador de dias seguidos)', () => {
  it('exibe a faixa de acumulação (aria-label com N de M dias)', () => {
    renderToday({ blocks: [makeBlock({ id: 'b1' })] });
    // Deve ter uma faixa com role="img" e aria-label informativo
    expect(screen.getByRole('img', { name: /de \d+ dias com treino/ })).toBeInTheDocument();
  });

  it('não exibe mais "dias seguidos" nos números do dia', () => {
    renderToday({
      blocks: [makeBlock({ id: 'b1' })],
      trainingLogs: [
        makeDoneLog('bloco-streak-1', 600),
        makeDoneLog('bloco-streak-2', 600),
        makeDoneLog('bloco-streak-3', 600),
      ],
    });
    expect(screen.queryByText('dias seguidos')).not.toBeInTheDocument();
  });

  it('exibe o rodapé factual com minutos e sessões da semana', () => {
    renderToday({
      blocks: [makeBlock({ id: 'b1' })],
      trainingLogs: [makeDoneLog('bloco-1', 600)],
    });
    // O rodapé deve conter "min" e indicativo de sessões
    expect(screen.getByText(/min · Esta semana:/)).toBeInTheDocument();
  });

  it('marca de recorde aparece no relatório do dia quando bate sequência recorde (≥3)', () => {
    // Para ter streak de 3 dias e longest=3, precisamos de logs em 3 dias consecutivos
    // O plano é 2026-06-12. Logs em 10, 11, 12 → streak=3, longest=3.
    const streakLogs = [
      {
        id: '2026-06-10:bloco-streak',
        date: '2026-06-10',
        blockId: 'bloco-streak',
        blockTitle: 'Tema',
        source: 'lichess' as const,
        destinationLabel: 'Lichess',
        plannedSeconds: 600,
        startedAt: '2026-06-10T10:00:00.000Z',
        completedAt: '2026-06-10T10:10:00.000Z',
        elapsedSeconds: 600,
        timeLimitReached: false,
        status: 'done' as const,
        updatedAt: '2026-06-10T10:10:00.000Z',
      },
      {
        id: '2026-06-11:bloco-streak',
        date: '2026-06-11',
        blockId: 'bloco-streak',
        blockTitle: 'Tema',
        source: 'lichess' as const,
        destinationLabel: 'Lichess',
        plannedSeconds: 600,
        startedAt: '2026-06-11T10:00:00.000Z',
        completedAt: '2026-06-11T10:10:00.000Z',
        elapsedSeconds: 600,
        timeLimitReached: false,
        status: 'done' as const,
        updatedAt: '2026-06-11T10:10:00.000Z',
      },
      makeDoneLog('bloco-1', 600), // 2026-06-12 (hoje no plano)
    ];

    renderToday({
      blocks: [makeBlock({ id: 'bloco-1', status: 'done' })],
      trainingLogs: streakLogs,
    });

    // A marca de recorde deve aparecer no relatório do dia (DayCompletionCard)
    expect(screen.getByText('Esta é a sua sequência mais longa até aqui.')).toBeInTheDocument();
  });

  it('marca de recorde não aparece em dia normal (sem bater recorde)', () => {
    // Apenas 1 log hoje, sem streak histórico
    renderToday({
      blocks: [makeBlock({ id: 'bloco-1', status: 'done' })],
      trainingLogs: [makeDoneLog('bloco-1', 600)],
    });
    expect(screen.queryByText('Esta é a sua sequência mais longa até aqui.')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// formatRoadmapStatus — covers 'done' and 'future' branches (lines 859-866)
// ---------------------------------------------------------------------------

describe('Today — roadmap status labels', () => {
  function renderWithRoadmap(items: import('../domain').TrainingRoadmapItem[]) {
    return render(
      <Today
        plan={makePlan([makeBlock({ id: 'b1' })])}
        roadmap={items}
        sessionMinutes={15}
        learnerBand="0-400"
        trainingLogs={[]}
        allTrainingLogs={[]}
        pendingItems={[]}
        achievements={[]}
        weaknesses={[]}
        lichessConnectionState="disconnected"
        backupMeta={undefined}
        onSessionMinutesChange={noop}
        onCreateNextSession={noop}
        onAnswerTutorQuestion={noop}
        onImportFreeActivity={noop}
        onReconcileLichessResults={noop}
        onApproveLearningPlan={noop}
        onRequestLearningPlanRevision={noop}
        onOpenPendingItem={noop}
        onDeferPendingItem={noop}
        onSavePendingFromHardFeedback={noop}
        onStartBlockTraining={noop}
        onCompleteBlockTraining={noop}
        onSkipBlockTraining={noop}
      />,
    );
  }

  it('renders "Planejado" for a current roadmap item', () => {
    renderWithRoadmap([
      {
        id: 'r1',
        date: '2026-06-12',
        label: 'Garfos',
        minutes: 10,
        title: 'Puzzles de garfo',
        destinationLabel: 'Lichess',
        status: 'current',
      },
    ]);
    expect(screen.getByText(/Planejado/)).toBeInTheDocument();
  });

  it('renders "Feito" for a done roadmap item', () => {
    renderWithRoadmap([
      {
        id: 'r2',
        date: '2026-06-11',
        label: 'Garfos',
        minutes: 10,
        title: 'Puzzles de garfo (feito)',
        destinationLabel: 'Lichess',
        status: 'done',
      },
    ]);
    expect(screen.getByText(/Feito/)).toBeInTheDocument();
  });

  it('renders "Próximo" for a future roadmap item', () => {
    renderWithRoadmap([
      {
        id: 'r3',
        date: '2026-06-13',
        label: 'Pregadas',
        minutes: 10,
        title: 'Puzzles de pregada',
        destinationLabel: 'Lichess',
        status: 'future',
      },
    ]);
    // formatRoadmapStatus('future') returns 'Próximo' in a <small> element inside the roadmap list
    const roadmapList = screen.getByRole('list', { name: /próximos passos do roteiro/i });
    expect(within(roadmapList).getByText(/Próximo/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// playTimerBeep — prefers-reduced-motion early return (line 833)
// ---------------------------------------------------------------------------

describe('Today — timer beep (prefers-reduced-motion)', () => {
  it('does NOT create AudioContext when prefers-reduced-motion is active', () => {
    // Mock matchMedia to report prefers-reduced-motion: reduce
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const AudioContextSpy = vi.fn();
    const originalAudioContext = (window as unknown as Record<string, unknown>).AudioContext;
    (window as unknown as Record<string, unknown>).AudioContext = AudioContextSpy;

    // Render with an active training log to trigger the timer effect
    const activeLog: TrainingLog = {
      id: '2026-06-12:bloco-1',
      date: '2026-06-12',
      blockId: 'bloco-1',
      blockTitle: 'Tema do dia',
      source: 'lichess',
      destinationLabel: 'Lichess',
      plannedSeconds: 1, // already expired
      startedAt: new Date(Date.now() - 5000).toISOString(),
      completedAt: undefined,
      elapsedSeconds: undefined,
      timeLimitReached: false,
      status: 'active',
      updatedAt: new Date().toISOString(),
    };

    renderToday({
      blocks: [makeBlock({ id: 'bloco-1' })],
      trainingLogs: [activeLog],
    });

    // AudioContext should never have been constructed
    expect(AudioContextSpy).not.toHaveBeenCalled();

    // Restore
    window.matchMedia = originalMatchMedia;
    (window as unknown as Record<string, unknown>).AudioContext = originalAudioContext;
  });
});

// ---------------------------------------------------------------------------
// getBackupReminder — NaN date branch (line 744)
// ---------------------------------------------------------------------------

describe('Today — backup reminder NaN date', () => {
  it('shows "data do último export não pôde ser lida" when exportedAt is invalid', () => {
    renderToday({
      blocks: [makeBlock({ id: 'b1' })],
      trainingLogs: [makeDoneLog('b1', 600)],
      backupMeta: {
        checksum: 'x',
        exportedAt: 'data-invalida',
        recordCount: 5,
      },
    });
    expect(screen.getByText(/data do último export não pôde ser lida/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// formatFriendlyDate — invalid date falls back to raw string (line 709)
// ---------------------------------------------------------------------------

describe('Today — formatFriendlyDate invalid date', () => {
  it('falls back to the raw date string when plan.date is not a valid date', () => {
    render(
      <Today
        plan={{
          date: 'nao-e-data',
          sessionMinutes: 15,
          blocks: [],
          generatedFromWeaknessesAt: '2026-06-12T09:00:00.000Z',
        }}
        roadmap={[]}
        sessionMinutes={15}
        learnerBand="0-400"
        trainingLogs={[]}
        allTrainingLogs={[]}
        pendingItems={[]}
        achievements={[]}
        weaknesses={[]}
        lichessConnectionState="disconnected"
        backupMeta={undefined}
        onSessionMinutesChange={noop}
        onCreateNextSession={noop}
        onAnswerTutorQuestion={noop}
        onImportFreeActivity={noop}
        onReconcileLichessResults={noop}
        onApproveLearningPlan={noop}
        onRequestLearningPlanRevision={noop}
        onOpenPendingItem={noop}
        onDeferPendingItem={noop}
        onSavePendingFromHardFeedback={noop}
        onStartBlockTraining={noop}
        onCompleteBlockTraining={noop}
        onSkipBlockTraining={noop}
      />,
    );
    // The raw string 'nao-e-data' should appear in the subtitle line
    expect(screen.getByText(/nao-e-data/)).toBeInTheDocument();
  });
});

describe('Today — R2b suporte crônico', () => {
  it('mostra a nota "reforçar a base" quando plan.chronicSupportSuggested é true', () => {
    renderToday({ blocks: [makeBlock({ id: 'b1' })], chronicSupportSuggested: true });

    expect(screen.getByText(/reforçar a base/i)).toBeInTheDocument();
  });

  it('não mostra a nota quando a flag está ausente', () => {
    renderToday({ blocks: [makeBlock({ id: 'b1' })] });

    expect(screen.queryByText(/reforçar a base/i)).not.toBeInTheDocument();
  });
});

describe("Today — nota de transparência do roteamento (A1')", () => {
  it('mostra o porquê quando plan.routingEmphasis está setado (detection-volume)', () => {
    renderToday({ blocks: [makeBlock({ id: 'b1' })], routingEmphasis: 'detection-volume' });

    // Linhas curadas do buildRoutingWhy para detection-volume, scoped à nota de
    // roteamento (o botão "Trocar o foco de hoje" do TodayHero também contém
    // "foco de hoje", então consultamos dentro da nota, não no documento todo).
    const note = screen.getByRole('note');
    expect(note).toHaveTextContent(/à vista/i);
    expect(note).toHaveTextContent(/foco de hoje/i);
  });

  it('mostra o porquê para calculation', () => {
    renderToday({ blocks: [makeBlock({ id: 'b1' })], routingEmphasis: 'calculation' });

    expect(screen.getByText(/conta pela metade/i)).toBeInTheDocument();
  });

  it('não mostra a nota quando routingEmphasis está ausente (default)', () => {
    renderToday({ blocks: [makeBlock({ id: 'b1' })] });

    // Sem routingEmphasis a nota de roteamento (role="note") não existe.
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('a nota tem role="note" (acessibilidade)', () => {
    renderToday({ blocks: [makeBlock({ id: 'b1' })], routingEmphasis: 'candidate-selection' });

    const note = screen.getByRole('note');
    expect(note).toHaveTextContent(/comparar candidatos/i);
  });
});
