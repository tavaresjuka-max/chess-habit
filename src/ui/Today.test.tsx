// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);
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
}: {
  blocks: PlanBlock[];
  trainingLogs?: TrainingLog[];
  achievements?: Achievement[];
}) {
  return render(
    <Today
      plan={makePlan(blocks)}
      roadmap={[]}
      sessionMinutes={15}
      trainingLogs={trainingLogs}
      allTrainingLogs={trainingLogs}
      pendingItems={[]}
      diplomaAttempts={[]}
      achievements={achievements}
      weaknesses={[]}
      diagnosisState="idle"
      diagnosisMessage={undefined}
      lichessConnectionState="disconnected"
      lichessMessage={undefined}
      lichessStudyLink={undefined}
      onSessionMinutesChange={noop}
      onCreateNextSession={noop}
      onAnswerTutorQuestion={noop}
      onImportFreeActivity={noop}
      onSyncChesscomDiagnosis={noop}
      onSyncLichessDiagnosis={noop}
      onReconcileLichessResults={noop}
      onCreateLichessStudy={noop}
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
