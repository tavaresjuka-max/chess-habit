// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import {
  createTrainingLog,
  generatePlan,
  type LearnerProfile,
  type PlanBlockFeedback,
  type PlanResourceStage,
} from '../domain';
import { App } from '../ui/App';
import {
  clearAll,
  getPlan,
  getTrainingLog,
  loadOpenPendingItems,
  loadWeaknesses,
  markOnboardingCompleted,
  saveLichessOAuthToken,
  saveDiplomaAttempt,
  savePendingItem,
  savePlan,
  saveProfile,
  saveTrainingLog,
} from '../infra/storage/appData';
import type { DiplomaAttempt, PendingTrainingItem } from '../domain/method/types';

const profile: LearnerProfile = {
  lichessUsername: 'jukasparov',
  chesscomUsername: 'jukatavares',
  band: '800-1000',
  defaultSessionMinutes: 5,
  goals: [],
  updatedAt: '2026-06-06T00:00:00.000Z',
};

beforeEach(async () => {
  await clearAll();
  await saveProfile(profile);
  // Estes testes exercitam o app principal (Hoje), não o funil de primeira vez.
  await markOnboardingCompleted();
  vi.spyOn(window, 'open').mockReturnValue({} as Window);
});

afterEach(async () => {
  vi.useRealTimers();
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
  await clearAll();
});

describe('training flow', () => {
  it('starts the local timer from a real Lichess link and opens one external tab', async () => {
    render(<App />);

    const openLink = await screen.findByRole('link', { name: /Abrir no Lichess/i });

    expect(openLink.getAttribute('href')).toBe('https://lichess.org/training/fork');
    expect(openLink.getAttribute('target')).toBe('_blank');

    fireEvent.click(openLink);

    expect(await screen.findByText(/Treinando há/i, {}, { timeout: 5000 })).toBeTruthy();

    const log = await getFirstBlockLog();

    expect(window.open).toHaveBeenCalledWith(
      'https://lichess.org/training/fork',
      '_blank',
    );
    expect(log?.status).toBe('active');
  });

  it('keeps the Tavarez screen when the training tab is blocked', async () => {
    vi.mocked(window.open).mockReturnValueOnce(null);
    render(<App />);

    const openLink = await screen.findByRole('link', { name: /Abrir no Lichess/i });
    const currentUrl = window.location.href;

    fireEvent.click(openLink);

    expect(await screen.findByText(/bloqueou a nova aba/i, {}, { timeout: 5000 })).toBeTruthy();

    expect(window.location.href).toBe(currentUrl);
    expect(screen.getByRole('heading', { name: 'Hoje' })).toBeTruthy();
    expect((await getFirstBlockLog())?.status).toBe('active');
  });

  it('shows a simple Professor Tavarez introduction before the guided fork lesson', async () => {
    render(<App />);

    // Redesign action-first: o enquadramento do conceito aparece no herói (TodayHero)
    // E no cartão de treino (PlanBlockCard). O contrato do teste é "o intro está presente
    // antes da lição", não unicidade — alinhado às asserções getAllByText abaixo.
    expect((await screen.findAllByText(/Garfo é uma peça sua atacando dois alvos ao mesmo tempo/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/cavalo, bispo, peão e dama/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/prepara o garfo alguns lances antes/).length).toBeGreaterThan(0);
  });

  it('stores approval of the Professor Tavarez learning plan proposal', async () => {
    render(<App />);

    expect(await screen.findByText('Entendi o que você precisa.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar plano' }));

    await waitFor(async () => {
      const plan = await getPlan(getTodayDateForTest());

      expect(plan?.learningPlanResponse?.status).toBe('approved');
    });
    // Plano aprovado: o botão "Aprovar plano" some — vira o resumo compacto
    // dentro da dobra "Plano".
    expect(screen.queryByRole('button', { name: 'Aprovar plano' })).toBeNull();
  });

  it('stores a revision request for the Professor Tavarez learning plan proposal', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Revisar plano' }));
    fireEvent.change(screen.getByLabelText('O que você quer mudar?'), {
      target: { value: 'Quero mais exercícios e partidas de 15+10.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar revisão' }));

    await waitFor(async () => {
      const plan = await getPlan(getTodayDateForTest());

      expect(plan?.learningPlanResponse).toMatchObject({
        status: 'revision-requested',
        note: 'Quero mais exercícios e partidas de 15+10.',
      });
    });
    expect(screen.getByText('Revisão registrada.')).toBeTruthy();
  });

  it('hides destructive completion controls after a block is already done', async () => {
    render(<App />);

    await completeFirstBlockWithFeedback('Bom');

    expect(await screen.findByText('Feito', {}, { timeout: 5000 })).toBeTruthy();

    expect(screen.queryByRole('button', { name: 'Concluir' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Fácil' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Bom' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Difícil' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Pular' })).toBeNull();
    expect(screen.getByRole('link', { name: /Abrir de novo/i })).toBeTruthy();
  });

  it('shows a day completion summary after the final planned block is done', async () => {
    render(<App />);

    await completeFirstBlockWithFeedback('Bom');

    expect(await screen.findByRole('heading', { name: 'Dia concluído. Bom trabalho.' })).toBeTruthy();
    expect(screen.getByText('1/1 bloco feito')).toBeTruthy();
    expect(screen.getByText(/Feedback do dia: bom: 1/)).toBeTruthy();
    expect(screen.getByText(/Na próxima sessão:/)).toBeTruthy();
  });

  it('updates accumulated phase milestones after completing a block', async () => {
    render(<App />);

    expect(await screen.findByText('Metas da fase')).toBeTruthy();

    await completeFirstBlockWithFeedback('Bom');

    expect(await screen.findByText('0h de 6h - 1 de 72 sessões.', {}, { timeout: 5000 })).toBeTruthy();
    expect(screen.getByText('sessão')).toBeTruthy();
  });

  it('records zero elapsed seconds honestly when completing without starting first', async () => {
    render(<App />);

    await completeFirstBlockWithFeedback('Bom');

    // Sem reconciliação (sem token), o bloco concluído mostra só "Concluído." —
    // métrica honesta, sem inventar tempo de relógio.
    expect(await screen.findByText('Concluído.', {}, { timeout: 5000 })).toBeTruthy();

    const log = await getFirstBlockLog();

    expect(log?.status).toBe('done');
    expect(log?.elapsedSeconds).toBe(0);
  });

  it.each([
    ['Fácil', 'easy', 'retrieval', 'https://lichess.org/training/short'],
    ['Bom', 'good', 'retrieval', 'https://lichess.org/training/short'],
    ['Difícil', 'hard', 'guided', 'https://lichess.org/training/short'],
  ] satisfies Array<[string, PlanBlockFeedback, PlanResourceStage, string]>)(
    'uses feedback %s to adapt the next generated plan',
    async (buttonName, expectedFeedback, expectedStage, expectedUrl) => {
      render(<App />);

      await completeFirstBlockWithFeedback(buttonName);

      await waitFor(async () => {
        expect((await getFirstBlockLog())?.feedback).toBe(expectedFeedback);
      });

      fireEvent.click(await screen.findByText('O que vem agora'));
      fireEvent.click(await screen.findByRole('button', { name: 'Fazer próxima sessão' }));

      await waitFor(async () => {
        const plan = await getPlan(getTodayDateForTest());
        const nextThemeBlock = plan?.blocks.find(
          (block) => block.sessionNumber === 2 && block.title.includes('garfos'),
        );

        expect(plan?.blocks[0]?.resourceStage).toBe('guided');
        expect(plan?.blocks[0]?.status).toBe('done');
        expect(nextThemeBlock?.resourceStage).toBe(expectedStage);
        expect(nextThemeBlock?.destination.url).toBe(expectedUrl);
      });
    },
  );

  it('uses yesterday feedback when creating a new daily plan', async () => {
    const sessionProfile: LearnerProfile = { ...profile, defaultSessionMinutes: 30 };
    const yesterdayPlan = generatePlan(sessionProfile, [], 30, '2026-06-07');

    await clearAll();
    await saveProfile(sessionProfile);
    await markOnboardingCompleted();
    await savePlan({
      ...yesterdayPlan,
      blocks: yesterdayPlan.blocks.map((block) =>
        block.title.includes('garfos')
          ? {
              ...block,
              status: 'done',
              feedback: 'good',
            }
          : block,
      ),
    });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-08T10:00:00.000-03:00'));

    render(<App />);

    await waitFor(async () => {
      const plan = await getPlan('2026-06-08');

      expect(plan?.blocks[1]?.title).toContain('garfos');
      expect(plan?.blocks[1]?.resourceStage).toBe('retrieval');
      expect(plan?.blocks[1]?.destination.url).toBe('https://lichess.org/training/fork');
    });
  });

  it('uses recent diploma attempts when generating the first boot plan', async () => {
    const today = '2026-06-08';
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${today}T10:00:00.000-03:00`));
    await Promise.all(createPassedPeaoDiplomaAttempts(today).map(saveDiplomaAttempt));

    render(<App />);

    await waitFor(async () => {
      const plan = await getPlan(today);

      expect(plan?.blocks.every((block) => block.methodTrackId === 'progress-diplomas')).toBe(true);
    });
  });

  it('does not reopen yesterday guided Practice lesson when it had no feedback yet', async () => {
    const sessionProfile: LearnerProfile = { ...profile, defaultSessionMinutes: 15 };
    const yesterdayPlan = generatePlan(sessionProfile, [], 15, '2026-06-08');

    await clearAll();
    await saveProfile(sessionProfile);
    await markOnboardingCompleted();
    await savePlan(yesterdayPlan);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-09T10:00:00.000-03:00'));

    render(<App />);

    await waitFor(async () => {
      const plan = await getPlan('2026-06-09');

      expect(plan?.blocks[0]?.resourceStage).toBe('retrieval');
      expect(plan?.blocks[0]?.destination.url).toBe('https://lichess.org/training/fork');
    });

    const [firstTrainingLink] = await screen.findAllByRole('link', { name: /Abrir no Lichess/i });

    expect(firstTrainingLink?.getAttribute('href')).toBe('https://lichess.org/training/fork');
  });

  it('repairs a saved guided fork lesson after it was already opened locally', async () => {
    const sessionProfile: LearnerProfile = { ...profile, defaultSessionMinutes: 15 };
    const stalePlan = generatePlan(sessionProfile, [], 15, '2026-06-09');
    const staleBlock = stalePlan.blocks[0];

    if (staleBlock === undefined) {
      throw new Error('Expected a stale fork block.');
    }

    await clearAll();
    await saveProfile(sessionProfile);
    await markOnboardingCompleted();
    await savePlan(stalePlan);
    await saveTrainingLog(
      createTrainingLog({
        block: staleBlock,
        date: '2026-06-09',
        startedAt: '2026-06-09T10:00:00.000Z',
      }),
    );
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-09T10:05:00.000-03:00'));

    render(<App />);

    await waitFor(async () => {
      const plan = await getPlan('2026-06-09');

      expect(plan?.blocks[0]?.resourceStage).toBe('retrieval');
      expect(plan?.blocks[0]?.destination.url).toBe('https://lichess.org/training/fork');
    });

    const [firstTrainingLink] = await screen.findAllByRole('link', { name: /Abrir no Lichess/i });

    expect(firstTrainingLink?.getAttribute('href')).toBe('https://lichess.org/training/fork');
  });

  it('reopens a done block without recreating an active log', async () => {
    render(<App />);

    await completeFirstBlockWithFeedback('Bom');

    expect(await screen.findByText('Feito', {}, { timeout: 5000 })).toBeTruthy();

    const completedLog = await getFirstBlockLog();
    const reopenLink = screen.getByRole('link', { name: /Abrir de novo/i });

    fireEvent.click(reopenLink);

    await waitFor(async () => {
      const reopenedLog = await getFirstBlockLog();

      expect(reopenedLog?.status).toBe('done');
      expect(reopenedLog?.completedAt).toBe(completedLog?.completedAt);
    });
    expect(window.open).toHaveBeenCalledWith(
      'https://lichess.org/training/fork',
      '_blank',
    );
    expect(screen.queryByText(/Treinando há/i)).toBeNull();
  });

  it('registers Professor Tavarez question answer as a manual signal for the next session', async () => {
    render(<App />);

    await completeFirstBlockWithFeedback('Bom');

    fireEvent.click(await screen.findByRole('button', { name: 'Peça solta' }));

    await waitFor(async () => {
      expect((await loadWeaknesses())[0]?.tag).toBe('hanging-piece');
    });

    fireEvent.click(await screen.findByText('O que vem agora'));
    fireEvent.click(screen.getByRole('button', { name: 'Fazer próxima sessão' }));

    await waitFor(async () => {
      const plan = await getPlan(getTodayDateForTest());
      const nextThemeBlock = plan?.blocks.find((block) => block.sessionNumber === 2);

      expect(nextThemeBlock?.weaknessTag).toBe('hanging-piece');
      expect(nextThemeBlock?.destination.url).toBe('https://lichess.org/training/hangingPiece');
    });
  });

  it('cancels completion with Voltar without finishing the block', async () => {
    render(<App />);

    const ratingGroup = await openFirstCompletionRating();
    expect(within(ratingGroup).getByText('Como foi o treino?')).toBeTruthy();

    fireEvent.click(within(ratingGroup).getByRole('button', { name: 'Voltar' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Concluir' })).toBeTruthy();
    });
    expect(screen.queryByText('Como foi o treino?')).toBeNull();
    expect((await getFirstBlockLog())?.status).not.toBe('done');
  });

  it('syncs Lichess diagnosis even when the NDJSON stream has a broken line', async () => {
    const validGame = {
      id: 'game1',
      winner: 'black',
      opening: { eco: 'C20', name: 'King Pawn Game' },
      players: {
        white: {
          user: { name: 'jukasparov' },
          analysis: { inaccuracy: 1, mistake: 1, blunder: 1, acpl: 100 },
        },
        black: { user: { name: 'opponent' } },
      },
    };
    const fetchMock = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response(`${JSON.stringify(validGame)}\n{ "id": "broken", \n`, { status: 200 })),
    );

    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    fireEvent.click(await screen.findByText('Sincronizar e estudar'));
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar Lichess' }));

    expect(await screen.findByText(/Lichess atualizado com/i)).toBeTruthy();
    // 2 chamadas: 1 para partidas (NDJSON) + 1 para perf/puzzle (M2a)
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('uses Conferir puzzles to update dashboard/replay signals and pending training blocks', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-08T10:00:00.000-03:00'));
    await clearAll();
    await saveProfile({ ...profile, defaultSessionMinutes: 30 });
    await markOnboardingCompleted();
    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = requestUrl(input);

      if (url.includes('/api/puzzle/activity')) {
        return Promise.resolve(
          new Response(
            `${JSON.stringify({
              date: Date.parse('2026-06-08T10:05:00.000Z'),
              win: false,
              puzzle: { id: 'discarded', rating: 1000, themes: ['fork'] },
            })}\n`,
            { status: 200 },
          ),
        );
      }

      if (url.includes('/api/puzzle/dashboard/30')) {
        return Promise.resolve(
          Response.json({
            days: 30,
            global: { nb: 4, firstWins: 1, replayWins: 0, puzzleRatingAvg: 1000, performance: 900 },
            themes: {
              fork: { theme: 'Fork', results: { nb: 4, firstWins: 1, replayWins: 0, puzzleRatingAvg: 1000 } },
            },
          }),
        );
      }

      if (url.includes('/api/puzzle/replay/30/fork')) {
        return Promise.resolve(
          Response.json({
            replay: { days: 30, theme: 'fork', nb: 3, remaining: ['abc12', 'def34'] },
            angle: { key: 'fork', name: 'Fork', desc: 'not stored' },
          }),
        );
      }

      return Promise.resolve(new Response('', { status: 404 }));
    });

    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    await completeFirstBlockWithFeedback('Bom');
    await saveLichessOAuthToken({
      accessToken: 'secret-token',
      tokenType: 'Bearer',
      scopes: ['puzzle:read'],
      obtainedAt: '2026-06-08T10:00:00.000Z',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Conferir puzzles' }));

    await waitFor(async () => {
      const plan = await getPlan(getTodayDateForTest());
      const transferBlock = plan?.blocks.find((block) => block.resourceStage === 'transfer');

      expect(transferBlock?.destination).toMatchObject({
        label: 'Puzzles Lichess: Fork',
        url: 'https://lichess.org/training/fork',
      });
    });

    // O log do dashboard é gravado junto com o plano no mesmo saveTrainingLogsAndPlan;
    // esperar por ele explicitamente evita ler o DB antes do save (corrida latente do
    // teste, exposta pelas leituras frescas anti-race do reconcile).
    await waitFor(async () => {
      const log = await getTrainingLog(`${getTodayDateForTest()}:lichess-puzzle-dashboard`);
      expect(log?.result?.kind).toBe('puzzle-dashboard');
    });
    const replayLog = await getTrainingLog(`${getTodayDateForTest()}:lichess-puzzle-replay-fork`);

    expect(replayLog?.result?.kind).toBe('puzzle-replay-summary');
    expect(JSON.stringify(replayLog?.result)).not.toContain('abc12');
  });

  it('advances and persists a pending review item when its block is completed', async () => {
    const today = getTodayDateForTest();
    await savePendingItem(createPendingItem({ dueAt: today, attempts: 2 }));
    await saveLichessOAuthToken({
      accessToken: 'secret-token',
      tokenType: 'Bearer',
      scopes: ['puzzle:read'],
      obtainedAt: `${today}T10:00:00.000Z`,
      expiresAt: '2099-01-01T00:00:00.000Z',
    });
    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = requestUrl(input);
      const before = Number(new URL(url).searchParams.get('before') ?? Date.now());
      const activities = [0, 1, 2].map((index) => ({
        date: before,
        win: true,
        puzzle: { id: `discarded-${String(index)}`, rating: 1000, themes: ['fork'] },
      }));

      return Promise.resolve(new Response(activities.map((activity) => JSON.stringify(activity)).join('\n')));
    });

    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    expect((await screen.findAllByText('Revisar tema: fork')).length).toBeGreaterThan(0);
    await completeFirstBlockWithFeedback('Bom');

    await waitFor(async () => {
      // Gate de retenção (2026-06-24): no teto, o item NÃO gradua direto — entra no
      // resgate cego de longo prazo (status 'open' + retentionPending). Persiste avançado.
      const openPendingItems = await loadOpenPendingItems();

      expect(openPendingItems[0]).toMatchObject({
        id: 'pending-1',
        attempts: 4,
        status: 'open',
        retentionPending: true,
        lastFeedback: 'good',
      });
    });
    // 2 fetches: o auto-fetch SILENCIOSO de puzzles no boot (Decisão #3 — token
    // salvo + onboarding concluído) + o fetch do próprio fluxo de conclusão.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('asks for Lichess connection before creating a Study', async () => {
    render(<App />);

    fireEvent.click(await screen.findByText('Sincronizar e estudar'));
    fireEvent.click(screen.getByRole('button', { name: 'Gerar Study do dia' }));

    expect(await screen.findByText('Conecte o Lichess para criar o Study do dia.')).toBeTruthy();
  });
});

async function getFirstBlockLog() {
  const plan = await getPlan(getTodayDateForTest());
  const block = plan?.blocks[0];

  if (plan === undefined || block === undefined) {
    return undefined;
  }

  return getTrainingLog(`${plan.date}:${block.id}`);
}

function getTodayDateForTest(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${String(year)}-${month}-${day}`;
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

async function openFirstCompletionRating(): Promise<HTMLElement> {
  const [button] = await screen.findAllByRole('button', { name: 'Concluir' });

  if (button === undefined) {
    throw new Error('Expected at least one completion button.');
  }

  fireEvent.click(button);

  const ratingGroup = await screen.findByRole('group', { name: 'Como foi o treino?' });

  return ratingGroup;
}

async function completeFirstBlockWithFeedback(feedbackButtonName: string): Promise<void> {
  const ratingGroup = await openFirstCompletionRating();

  fireEvent.click(within(ratingGroup).getByRole('button', { name: feedbackButtonName }));

  // Fase 1: após clicar 'Difícil', o seletor de errorType aparece.
  // Para não bloquear os testes existentes, confirma imediatamente sem errorType.
  if (feedbackButtonName === 'Difícil') {
    const errorSelector = await screen.findByRole('group', { name: 'O que falhou?' });
    fireEvent.click(within(errorSelector).getByRole('button', { name: 'Registrar assim' }));
  }
}

function createPendingItem(overrides: Partial<PendingTrainingItem>): PendingTrainingItem {
  const today = getTodayDateForTest();

  return {
    id: 'pending-1',
    origin: 'puzzle',
    title: 'Revisar tema: fork',
    weaknessTag: 'fork',
    methodTrackId: 'pending-review',
    lichessTheme: 'fork',
    lichessUrl: 'https://lichess.org/training/fork',
    prompt: 'Qual sinal do tabuleiro você ignorou?',
    dueAt: today,
    attempts: 0,
    status: 'open',
    createdAt: `${today}T00:00:00.000Z`,
    updatedAt: `${today}T00:00:00.000Z`,
    ...overrides,
  };
}

function createPassedPeaoDiplomaAttempts(date: string): DiplomaAttempt[] {
  return ['valor-pecas', 'mates-basicos'].map((sectionId) => ({
    id: `attempt-${sectionId}`,
    diplomaId: 'peao',
    sectionId,
    scorePercent: 95,
    totalItems: 10,
    passed: true,
    source: 'local',
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
  }));
}
