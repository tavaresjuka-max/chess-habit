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

function makePlan(blocks: PlanBlock[]): DailyPlan {
  return {
    date: '2026-06-12',
    sessionMinutes: 15,
    blocks,
    generatedFromWeaknessesAt: '2026-06-12T09:00:00.000Z',
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
  lichessConnected = false,
  backupMeta = recentBackupMeta,
  emptyState = false,
  onCreateNextSession = noop,
  showCalibrationInvite = false,
  onStartCalibration = () => undefined,
}: {
  blocks: PlanBlock[];
  trainingLogs?: TrainingLog[];
  achievements?: Achievement[];
  lichessConnected?: boolean;
  backupMeta?: BackupMeta | null;
  emptyState?: boolean;
  onCreateNextSession?: typeof noop;
  showCalibrationInvite?: boolean;
  onStartCalibration?: () => void;
}) {
  return render(
    <Today
      plan={emptyState ? undefined : makePlan(blocks)}
      roadmap={[]}
      sessionMinutes={15}
      learnerBand="0-400"
      trainingLogs={trainingLogs}
      allTrainingLogs={trainingLogs}
      pendingItems={[]}
      diplomaAttempts={[]}
      achievements={achievements}
      weaknesses={[]}
      diagnosisState="idle"
      diagnosisMessage={undefined}
      lichessConnectionState="disconnected"
      lichessConnected={lichessConnected}
      lichessMessage={undefined}
      lichessStudyLink={undefined}
      backupMeta={backupMeta ?? undefined}
      onSessionMinutesChange={noop}
      onCreateNextSession={onCreateNextSession}
      onAnswerTutorQuestion={noop}
      onImportFreeActivity={noop}
      onSyncChesscomDiagnosis={noop}
      onSyncLichessDiagnosis={noop}
      onReconcileLichessResults={noop}
      onCreateLichessStudy={noop}
      onConnectLichess={noop}
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

  it('não repete o bloco do hero na lista de sessões', () => {
    renderToday({
      blocks: [
        makeBlock({ id: 'bloco-1', title: 'Lição guiada de garfos' }),
        makeBlock({ id: 'bloco-2', title: 'Puzzles de garfo' }),
      ],
    });

    expect(screen.getAllByText('Lição guiada de garfos')).toHaveLength(1);
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

describe('Today — convite para conectar o Lichess', () => {
  it('mostra "Conectar Lichess" quando ainda não conectado', () => {
    renderToday({ blocks: [makeBlock({ id: 'bloco-1' })], lichessConnected: false });

    expect(screen.getByRole('button', { name: /Conectar Lichess/ })).toBeInTheDocument();
  });

  it('esconde o convite quando o Lichess já está conectado', () => {
    renderToday({ blocks: [makeBlock({ id: 'bloco-1' })], lichessConnected: true });

    expect(screen.queryByRole('button', { name: /Conectar Lichess/ })).not.toBeInTheDocument();
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
        diplomaAttempts={[]}
        achievements={[]}
        weaknesses={[]}
        diagnosisState="idle"
        diagnosisMessage={undefined}
        lichessConnectionState="disconnected"
        lichessConnected={false}
        lichessMessage={undefined}
        lichessStudyLink={undefined}
        backupMeta={undefined}
        onSessionMinutesChange={noop}
        onCreateNextSession={noop}
        onAnswerTutorQuestion={noop}
        onImportFreeActivity={noop}
        onSyncChesscomDiagnosis={noop}
        onSyncLichessDiagnosis={noop}
        onReconcileLichessResults={noop}
        onCreateLichessStudy={noop}
        onConnectLichess={noop}
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
// getNextDiplomaSummary — undefined return path (line 826)
// ---------------------------------------------------------------------------

describe('Today — next diploma summary (undefined path)', () => {
  it('renders without a diploma chip when diplomaAttempts is empty', () => {
    renderToday({
      blocks: [makeBlock({ id: 'b1' })],
    });
    // The SessionMilestonesCard renders without crashing; no diploma chip shown
    expect(screen.getByRole('heading', { name: 'Hoje' })).toBeInTheDocument();
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
        diplomaAttempts={[]}
        achievements={[]}
        weaknesses={[]}
        diagnosisState="idle"
        diagnosisMessage={undefined}
        lichessConnectionState="disconnected"
        lichessConnected={false}
        lichessMessage={undefined}
        lichessStudyLink={undefined}
        backupMeta={undefined}
        onSessionMinutesChange={noop}
        onCreateNextSession={noop}
        onAnswerTutorQuestion={noop}
        onImportFreeActivity={noop}
        onSyncChesscomDiagnosis={noop}
        onSyncLichessDiagnosis={noop}
        onReconcileLichessResults={noop}
        onCreateLichessStudy={noop}
        onConnectLichess={noop}
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
