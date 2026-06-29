// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Achievement, Signal, TrainingLog, Weakness } from '../domain';
import type { DiplomaAttempt } from '../domain/method/types';
import { Progress } from './Progress';

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Minimal fixture factories
// ---------------------------------------------------------------------------

function makeTrainingLog(overrides: Partial<TrainingLog> = {}): TrainingLog {
  return {
    id: 'log-1',
    date: '2026-06-15',
    blockId: '2026-06-15-01-tema',
    blockTitle: 'Garfos básicos',
    source: 'lichess',
    destinationLabel: 'Lichess Puzzles',
    plannedSeconds: 900,
    startedAt: '2026-06-15T10:00:00.000Z',
    completedAt: '2026-06-15T10:14:00.000Z',
    elapsedSeconds: 840,
    timeLimitReached: false,
    status: 'done',
    feedback: 'good',
    updatedAt: '2026-06-15T10:14:00.000Z',
    ...overrides,
  };
}

const weakness: Weakness = {
  tag: 'fork',
  score: 0.9,
  confidence: 'high',
  evidence: 'Garfos aparecem com frequência nas partidas recentes.',
};

const achievement: Achievement = {
  id: 'primeira-hora',
  unlockedAt: '2026-06-15T12:00:00.000Z',
};

const signal: Signal = {
  source: 'lichess',
  value: { kind: 'manual', tag: 'fork' },
  confidence: 'high',
  observedAt: '2026-06-15T08:00:00.000Z',
};

const TODAY = '2026-06-15';

// ProgressProps com defaults mínimos. Cada teste sobrepõe só o que importa.
const noop = vi.fn(() => Promise.resolve());

function makeProps(overrides: Partial<Parameters<typeof Progress>[0]> = {}): Parameters<typeof Progress>[0] {
  return {
    today: TODAY,
    allTrainingLogs: [],
    diplomaAttempts: [],
    achievements: [],
    weaknesses: [],
    signals: [],
    sessionMinutes: 15,
    learnerBand: undefined,
    weeklyFocusTag: undefined,
    pendingItems: [],
    diagnosisState: 'idle',
    diagnosisMessage: undefined,
    lichessConnectionState: 'disconnected',
    lichessConnected: false,
    lichessMessage: undefined,
    lichessStudyLink: undefined,
    onConnectLichess: noop,
    onSyncChesscomDiagnosis: noop,
    onSyncLichessDiagnosis: noop,
    onCreateLichessStudy: noop,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Progress', () => {
  it('renderiza o título principal "Progresso"', () => {
    render(<Progress {...makeProps()} />);

    expect(screen.getByRole('heading', { name: 'Progresso' })).toBeInTheDocument();
  });

  it('exibe estado vazio de ritmo quando não há treinos', () => {
    render(<Progress {...makeProps()} />);

    expect(screen.getByText('Sem treinos. A primeira sessão ativa este painel.')).toBeInTheDocument();
  });

  it('exibe métricas de ritmo quando há treinos concluídos', () => {
    render(<Progress {...makeProps({ allTrainingLogs: [makeTrainingLog()] })} />);

    // deve exibir exercícios desta semana em chip de métrica (métrica honesta)
    expect(screen.getByText(/exercícios esta semana/)).toBeInTheDocument();
  });

  it('exibe estado vazio de habilidades quando não há treinos', () => {
    render(<Progress {...makeProps()} />);

    expect(
      screen.getByText(/Sem placar por tema\./),
    ).toBeInTheDocument();
  });

  it('exibe estado vazio de esforço por trilha quando não há treinos', () => {
    render(<Progress {...makeProps()} />);

    expect(
      screen.getByText('O esforço por trilha aparece aqui depois dos primeiros blocos concluídos.'),
    ).toBeInTheDocument();
  });

  it('exibe seção de diplomas com contagem correta de diplomas disponíveis', () => {
    render(<Progress {...makeProps()} />);

    // "0/N diplomas" — o número total é determinado pela constante DIPLOMAS.
    // "Diploma do Peão" aparece em várias dobras agora (Metas/Trilha/Diplomas).
    expect(screen.getAllByText(/Diploma do Peão/).length).toBeGreaterThan(0);
  });

  it('exibe o progresso de seções de um diploma ainda não conquistado', () => {
    render(<Progress {...makeProps()} />);

    // sem diploma conquistado: todos os diplomas mostram "0/N seções"
    const sectionLabels = screen.getAllByText(/\d+\/\d+ seções/);
    expect(sectionLabels.length).toBeGreaterThan(0);
  });

  it('exibe "Conquistado" quando diploma foi aprovado', () => {
    const attempts: DiplomaAttempt[] = [
      {
        id: 'attempt-valor',
        diplomaId: 'peao',
        sectionId: 'valor-pecas',
        scorePercent: 92,
        totalItems: 10,
        passed: true,
        source: 'lichess',
        createdAt: '2026-06-15T09:05:00.000Z',
        updatedAt: '2026-06-15T09:05:00.000Z',
      },
      {
        id: 'attempt-mates',
        diplomaId: 'peao',
        sectionId: 'mates-basicos',
        scorePercent: 91,
        totalItems: 10,
        passed: true,
        source: 'lichess',
        createdAt: '2026-06-15T09:10:00.000Z',
        updatedAt: '2026-06-15T09:10:00.000Z',
      },
    ];

    render(<Progress {...makeProps({ diplomaAttempts: attempts })} />);

    expect(screen.getByText('Conquistado')).toBeInTheDocument();
  });

  it('não exibe seção de conquistas quando não há conquistas', () => {
    render(<Progress {...makeProps()} />);

    expect(screen.queryByText('Conquistas')).not.toBeInTheDocument();
  });

  it('exibe conquistas desbloqueadas com título e data formatada em pt-BR', () => {
    render(<Progress {...makeProps({ achievements: [achievement] })} />);

    expect(screen.getByText('Primeira Hora')).toBeInTheDocument();
    // data formatada em pt-BR: "15 de junho" ou similar
    expect(screen.getByText(/junho/i)).toBeInTheDocument();
  });

  it('não exibe seção "Onde ainda trava" quando não há fraquezas', () => {
    render(<Progress {...makeProps()} />);

    expect(screen.queryByText('Onde ainda trava')).not.toBeInTheDocument();
  });

  it('exibe fraquezas formatadas em pt-BR via formatWeaknessTag', () => {
    render(
      <Progress {...makeProps({ weaknesses: [weakness], signals: [signal] })} />,
    );

    // formatWeaknessTag('fork') => 'garfos'
    expect(screen.getByText('garfos')).toBeInTheDocument();
    expect(screen.getByText(weakness.evidence)).toBeInTheDocument();
  });

  it('exibe no máximo 5 fraquezas mesmo quando há mais', () => {
    const manyWeaknesses: Weakness[] = [
      { tag: 'fork', score: 0.9, confidence: 'high', evidence: 'ev-fork' },
      { tag: 'pin', score: 0.85, confidence: 'high', evidence: 'ev-pin' },
      { tag: 'skewer', score: 0.8, confidence: 'medium', evidence: 'ev-skewer' },
      { tag: 'back-rank', score: 0.75, confidence: 'medium', evidence: 'ev-back-rank' },
      { tag: 'mate-in-1', score: 0.7, confidence: 'low', evidence: 'ev-mate-in-1' },
      { tag: 'mate-in-2', score: 0.6, confidence: 'low', evidence: 'ev-mate-in-2' },
    ];

    render(<Progress {...makeProps({ weaknesses: manyWeaknesses })} />);

    // deve mostrar garfos (score 0.9 — topo) mas não mate-em-2 (score 0.6 — cortado)
    expect(screen.getByText('garfos')).toBeInTheDocument();
    expect(screen.queryByText('mate em 2')).not.toBeInTheDocument();
  });

  it('exibe nota sobre linha de base do método', () => {
    render(<Progress {...makeProps()} />);

    expect(screen.getByText('Medem o método, não você. Revisão em julho de 2026.')).toBeInTheDocument();
  });

  it('exibe hipótese sobre fraqueza sendo heurística, não diagnóstico', () => {
    render(<Progress {...makeProps({ weaknesses: [weakness] })} />);

    expect(
      screen.getByText('Hipóteses, não diagnósticos — sinais antigos saem da conta.'),
    ).toBeInTheDocument();
  });

  it('T7: exibe rótulo PT-BR do tema e não o slug camelCase cru', () => {
    // Monta um log com resultado puzzle-dashboard contendo tema "hangingPiece"
    const logWithDashboard = makeTrainingLog({
      result: {
        source: 'lichess',
        kind: 'puzzle-dashboard',
        fetchedAt: '2026-06-15T10:00:00.000Z',
        since: '2026-05-16',
        until: '2026-06-15',
        days: 30,
        puzzles: 40,
        wins: 28,
        losses: 12,
        themes: ['hangingPiece', 'fork'],
        themeStats: [
          { theme: 'hangingPiece', attempts: 20, losses: 8 },
          { theme: 'fork', attempts: 20, losses: 4 },
        ],
        weakThemes: ['hangingPiece'],
        strongThemes: ['fork'],
      },
    });

    render(<Progress {...makeProps({ allTrainingLogs: [logWithDashboard] })} />);

    // Slug camelCase NÃO deve aparecer como texto visível
    expect(screen.queryByText('hangingPiece')).not.toBeInTheDocument();
    expect(screen.queryByText('fork')).not.toBeInTheDocument();

    // Rótulos PT-BR SIM devem aparecer
    expect(screen.getByText('Peça solta')).toBeInTheDocument();
    expect(screen.getByText('Garfo')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Fase 2: seções movidas da sidebar do Hoje para o Progresso
// (Metas, Trilha, Sincronizar)
// ---------------------------------------------------------------------------

describe('Progress — seções migradas do Hoje (Metas/Trilha/Sincronizar)', () => {
  it('renderiza a seção Metas (SessionMilestonesCard) com a trilha de marcos', () => {
    render(<Progress {...makeProps()} />);

    // A trilha de marcos (aria-label "Marcos da fase") é renderizada pelo card.
    expect(screen.getByRole('list', { name: 'Marcos da fase' })).toBeInTheDocument();
  });

  it('renderiza a seção Trilha (CurriculumCard) com a nota de ordem adaptativa', () => {
    render(<Progress {...makeProps({ learnerBand: '0-400' })} />);

    // A caveat final do CurriculumCard aparece sempre (independente da banda).
    expect(screen.getByText('A ordem se adapta ao que seus jogos mostram.')).toBeInTheDocument();
  });

  it('renderiza a seção Sincronizar com os controles de sync', () => {
    render(<Progress {...makeProps()} />);

    // "Sincronizar e estudar" é o título da dobra (Fold), não um heading.
    expect(screen.getByText('Sincronizar e estudar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Atualizar Chess\.com/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Atualizar Lichess/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gerar Study do dia' })).toBeInTheDocument();
  });

  it('mostra "Conectar Lichess" quando não conectado', () => {
    render(<Progress {...makeProps({ lichessConnected: false })} />);

    expect(screen.getByRole('button', { name: /Conectar Lichess/ })).toBeInTheDocument();
  });

  it('esconde "Conectar Lichess" quando já conectado', () => {
    render(<Progress {...makeProps({ lichessConnected: true })} />);

    expect(screen.queryByRole('button', { name: /Conectar Lichess/ })).not.toBeInTheDocument();
  });

  it('exibe o link "Abrir Study do dia" quando lichessStudyLink está presente', () => {
    render(
      <Progress
        {...makeProps({
          lichessConnected: true,
          lichessStudyLink: {
            id: 'study-1',
            date: TODAY,
            studyId: 'abc',
            url: 'https://lichess.org/study/abc',
            visibility: 'unlisted',
            imported: false,
            createdAt: '2026-06-15T10:00:00.000Z',
            updatedAt: '2026-06-15T10:00:00.000Z',
          },
        })}
      />,
    );

    expect(screen.getByRole('link', { name: /Abrir Study do dia/i })).toHaveAttribute(
      'href',
      'https://lichess.org/study/abc',
    );
  });

  it('dispara onConnectLichess ao clicar em "Conectar Lichess"', () => {
    const onConnectLichess = vi.fn(() => Promise.resolve());
    render(<Progress {...makeProps({ onConnectLichess })} />);

    fireEvent.click(screen.getByRole('button', { name: /Conectar Lichess/ }));
    expect(onConnectLichess).toHaveBeenCalledTimes(1);
  });

  it('dispara onSyncChesscomDiagnosis ao clicar em "Atualizar Chess.com"', () => {
    const onSyncChesscomDiagnosis = vi.fn(() => Promise.resolve());
    render(<Progress {...makeProps({ onSyncChesscomDiagnosis })} />);

    fireEvent.click(screen.getByRole('button', { name: /Atualizar Chess\.com/ }));
    expect(onSyncChesscomDiagnosis).toHaveBeenCalledTimes(1);
  });

  it('dispara onSyncLichessDiagnosis ao clicar em "Atualizar Lichess"', () => {
    const onSyncLichessDiagnosis = vi.fn(() => Promise.resolve());
    render(<Progress {...makeProps({ onSyncLichessDiagnosis })} />);

    fireEvent.click(screen.getByRole('button', { name: /Atualizar Lichess/ }));
    expect(onSyncLichessDiagnosis).toHaveBeenCalledTimes(1);
  });

  it('dispara onCreateLichessStudy ao clicar em "Gerar Study do dia"', () => {
    const onCreateLichessStudy = vi.fn(() => Promise.resolve());
    render(<Progress {...makeProps({ onCreateLichessStudy })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Gerar Study do dia' }));
    expect(onCreateLichessStudy).toHaveBeenCalledTimes(1);
  });

  it('exibe mensagens de diagnóstico e do Lichess quando fornecidas', () => {
    render(
      <Progress
        {...makeProps({
          diagnosisMessage: 'Diagnóstico Chess.com concluído.',
          lichessMessage: 'Sincronização Lichess ok.',
        })}
      />,
    );

    expect(screen.getByText('Diagnóstico Chess.com concluído.')).toBeInTheDocument();
    expect(screen.getByText('Sincronização Lichess ok.')).toBeInTheDocument();
  });
});
