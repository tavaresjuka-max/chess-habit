// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { LearnerProfile, PlanBlockFeedback, PlanResourceStage } from '../domain';
import { App } from '../ui/App';
import { clearAll, getPlan, getTrainingLog, saveProfile } from '../infra/storage/appData';

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
});

afterEach(async () => {
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

    expect(openLink.getAttribute('href')).toBe(
      'https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p',
    );
    expect(openLink.getAttribute('target')).toBe('_blank');

    fireEvent.click(openLink);

    await waitFor(() => {
      expect(screen.getByText(/Treinando há/i)).toBeTruthy();
    });

    const log = await getFirstBlockLog();

    expect(log?.status).toBe('active');
  });

  it('hides destructive completion controls after a block is already done', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Concluir' }));
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
    ['Fácil', 'easy', 'retrieval', 'https://lichess.org/training/fork'],
    ['Bom', 'good', 'guided', 'https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p'],
    ['Difícil', 'hard', 'explain', 'https://lichess.org/video?tags=beginner%2Ftactics'],
  ] satisfies Array<[string, PlanBlockFeedback, PlanResourceStage, string]>)(
    'uses feedback %s to adapt the next generated plan',
    async (buttonName, expectedFeedback, expectedStage, expectedUrl) => {
      render(<App />);

      fireEvent.click(await screen.findByRole('button', { name: 'Concluir' }));
      fireEvent.click(await screen.findByRole('button', { name: buttonName }));

      await waitFor(async () => {
        expect((await getFirstBlockLog())?.feedback).toBe(expectedFeedback);
      });

      fireEvent.click(screen.getByRole('button', { name: 'Config' }));
      fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }));

      await waitFor(async () => {
        const plan = await getPlan(getTodayDateForTest());

        expect(plan?.blocks[0]?.resourceStage).toBe(expectedStage);
        expect(plan?.blocks[0]?.destination.url).toBe(expectedUrl);
      });
    },
  );

  it('reopens a done block without recreating an active log', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Concluir' }));
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
    expect(screen.queryByText(/Treinando há/i)).toBeNull();
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
