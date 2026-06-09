// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { generatePlan, type LearnerProfile, type PlanBlockFeedback, type PlanResourceStage } from '../domain';
import { App } from '../ui/App';
import {
  clearAll,
  getPlan,
  getTrainingLog,
  loadWeaknesses,
  saveLichessOAuthToken,
  savePlan,
  saveProfile,
} from '../infra/storage/appData';

const profile: LearnerProfile = {
  lichessUsername: 'jukasparov',
  chesscomUsername: 'jukatavares',
  band: '800-1200',
  defaultSessionMinutes: 5,
  goals: [],
  updatedAt: '2026-06-06T00:00:00.000Z',
};

beforeEach(async () => {
  await clearAll();
  await saveProfile(profile);
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
  it('starts the local timer from a real Lichess link without relying on window.open', async () => {
    render(<App />);

    const openLink = await screen.findByRole('link', { name: /Abrir no Lichess/i });

    expect(openLink.getAttribute('href')).toBe('https://lichess.org/training/fork');
    expect(openLink.getAttribute('target')).toBe('_blank');

    fireEvent.click(openLink);

    await waitFor(() => {
      expect(screen.getByText(/Treinando há/i)).toBeTruthy();
    });

    const log = await getFirstBlockLog();

    expect(window.open).toHaveBeenCalledWith(
      'https://lichess.org/training/fork',
      '_blank',
      'noopener,noreferrer',
    );
    expect(log?.status).toBe('active');
  });

  it('hides destructive completion controls after a block is already done', async () => {
    render(<App />);

    await clickFirstButton('Concluir');
    fireEvent.click(await screen.findByRole('button', { name: 'Bom' }));

    await waitFor(() => {
      expect(screen.getByText('Feito')).toBeTruthy();
    });

    expect(screen.queryByRole('button', { name: 'Concluir' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Fácil' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Bom' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Difícil' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Pular' })).toBeNull();
    expect(screen.getByRole('link', { name: /Abrir de novo/i })).toBeTruthy();
  });

  it('shows a day completion summary after the final planned block is done', async () => {
    render(<App />);

    await clickFirstButton('Concluir');
    fireEvent.click(await screen.findByRole('button', { name: 'Bom' }));

    expect(await screen.findByRole('heading', { name: 'Dia concluído. Bom trabalho.' })).toBeTruthy();
    expect(screen.getByText('1/1 bloco feito')).toBeTruthy();
    expect(screen.getByText(/Feedback do dia: bom: 1/)).toBeTruthy();
    expect(screen.getByText(/Na próxima sessão vamos estudar/)).toBeTruthy();
  });

  it('records zero elapsed seconds honestly when completing without starting first', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Concluir' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Bom' }));

    await waitFor(() => {
      expect(screen.getByText(/Treinou por menos de 1 min/i)).toBeTruthy();
    });

    const log = await getFirstBlockLog();

    expect(log?.status).toBe('done');
    expect(log?.elapsedSeconds).toBe(0);
  });

  it.each([
    ['Fácil', 'easy', 'retrieval', 'https://lichess.org/training/short'],
    ['Bom', 'good', 'retrieval', 'https://lichess.org/training/short'],
    ['Difícil', 'hard', 'explain', 'https://lichess.org/training/short'],
  ] satisfies Array<[string, PlanBlockFeedback, PlanResourceStage, string]>)(
    'uses feedback %s to adapt the next generated plan',
    async (buttonName, expectedFeedback, expectedStage, expectedUrl) => {
      render(<App />);

      fireEvent.click(await screen.findByRole('button', { name: 'Concluir' }));
      fireEvent.click(await screen.findByRole('button', { name: buttonName }));

      await waitFor(async () => {
        expect((await getFirstBlockLog())?.feedback).toBe(expectedFeedback);
      });

      fireEvent.click(await screen.findByRole('button', { name: /Fazer/ }));

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

  it('reopens a done block without recreating an active log', async () => {
    render(<App />);

    await clickFirstButton('Concluir');
    fireEvent.click(await screen.findByRole('button', { name: 'Bom' }));

    await waitFor(() => {
      expect(screen.getByText('Feito')).toBeTruthy();
    });

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
      'noopener,noreferrer',
    );
    expect(screen.queryByText(/Treinando há/i)).toBeNull();
  });

  it('registers Professor Lemos question answer as a manual signal for the next session', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Concluir' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Bom' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Peça solta' }));

    await waitFor(async () => {
      expect((await loadWeaknesses())[0]?.tag).toBe('hanging-piece');
    });

    fireEvent.click(screen.getByRole('button', { name: /Fazer/ }));

    await waitFor(async () => {
      const plan = await getPlan(getTodayDateForTest());
      const nextThemeBlock = plan?.blocks.find((block) => block.sessionNumber === 2);

      expect(nextThemeBlock?.weaknessTag).toBe('hanging-piece');
      expect(nextThemeBlock?.destination.url).toBe('https://lichess.org/training/hangingPiece');
    });
  });

  it('cancels completion with Voltar without finishing the block', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Concluir' }));
    expect(await screen.findByText('Como foi o treino?')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));

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

    fireEvent.click(await screen.findByText('Diagnóstico'));
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar Lichess' }));

    expect(await screen.findByText(/Lichess atualizado com/i)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses Conferir puzzles to update dashboard/replay signals and pending training blocks', async () => {
    await clearAll();
    await saveProfile({ ...profile, defaultSessionMinutes: 30 });
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

    await clickFirstButton('Concluir');
    fireEvent.click(await screen.findByRole('button', { name: 'Bom' }));
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

    const dashboardLog = await getTrainingLog(`${getTodayDateForTest()}:lichess-puzzle-dashboard`);
    const replayLog = await getTrainingLog(`${getTodayDateForTest()}:lichess-puzzle-replay-fork`);

    expect(dashboardLog?.result?.kind).toBe('puzzle-dashboard');
    expect(replayLog?.result?.kind).toBe('puzzle-replay-summary');
    expect(JSON.stringify(replayLog?.result)).not.toContain('abc12');
  });

  it('asks for Lichess connection before creating a Study', async () => {
    render(<App />);

    fireEvent.click(await screen.findByText('Diagnóstico'));
    fireEvent.click(screen.getByRole('button', { name: 'Gerar Study' }));

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

async function clickFirstButton(name: string): Promise<void> {
  const [button] = await screen.findAllByRole('button', { name });

  if (button === undefined) {
    throw new Error(`Expected at least one button named ${name}.`);
  }

  fireEvent.click(button);
}
