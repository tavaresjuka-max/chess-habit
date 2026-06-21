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
