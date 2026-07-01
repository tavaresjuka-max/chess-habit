import { expect, type Page, type TestInfo } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

type ChesscomDataset = 'many' | 'few' | 'none';
type LichessDataset = 'many' | 'few' | 'none';

type MockApiOptions = {
  chesscom?: Record<string, ChesscomDataset>;
  lichess?: Record<string, LichessDataset>;
  /** Override the mocked /api/account rapid rating (default: 1500, non-provisional, 50 games). */
  lichessAccountRating?: number;
};

const screenshotDir = path.join(process.cwd(), 'e2e', '__screenshots__');

export async function prepareBrowser(page: Page, options: MockApiOptions = {}): Promise<void> {
  await installBrowserGuards(page);
  await mockExternalApis(page, options);
}

export async function openApp(page: Page, url = '/'): Promise<void> {
  await page.goto(url);
  await expect(page.locator('#root')).not.toBeEmpty({ timeout: 30_000 });
  await expect(page.getByRole('button').first()).toBeVisible({ timeout: 30_000 });
}

export async function completeQuickStart(page: Page, testInfo: TestInfo): Promise<void> {
  await expect(page.getByRole('heading', { name: 'A aula pode começar.' })).toBeVisible();
  await saveScreenshot(page, testInfo, 'onboarding-welcome');
  await page.getByRole('button', { name: 'Começar rápido' }).click();
  await expect(page.getByRole('button', { name: 'Aprovar plano' })).toBeVisible({ timeout: 30_000 });
  await saveScreenshot(page, testInfo, 'onboarding-plan');
  await page.getByRole('button', { name: 'Aprovar plano' }).click();
  await expect(page.getByRole('heading', { name: 'Hoje' })).toBeVisible({ timeout: 30_000 });
}

export async function configureAccounts(input: {
  page: Page;
  lichessUsername?: string;
  chesscomUsername?: string;
  band?: string;
  minutes?: string;
}): Promise<void> {
  const { page, lichessUsername, chesscomUsername, band, minutes } = input;

  await page.getByRole('button', { name: 'Vamos configurar' }).click();

  const consent = page.getByRole('heading', { name: 'Seus dados e sua privacidade' });
  if (await consent.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Aceitar e continuar' }).click();
  }

  await expect(page.getByRole('heading', { name: 'Suas contas' })).toBeVisible({ timeout: 30_000 });

  if (lichessUsername !== undefined) {
    await page.getByLabel(/Usuário Lichess/).fill(lichessUsername);
  }
  if (chesscomUsername !== undefined) {
    await page.getByLabel(/Usuário Chess.com/).fill(chesscomUsername);
  }
  if (band !== undefined) {
    await page.getByLabel(/Faixa atual/).selectOption(band);
  }
  if (minutes !== undefined) {
    await page.getByLabel(/Tempo padrão/).selectOption(minutes);
  }

  await page.getByRole('button', { name: 'Continuar' }).click();
}

export async function approvePlanWhenVisible(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: 'Aprovar plano' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Aprovar plano' }).click();
  await expect(page.getByRole('heading', { name: 'Hoje' })).toBeVisible({ timeout: 30_000 });
}

export async function skipQuestionsAndApprovePlan(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Vamos calibrar seu plano' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: /Pular e usar a faixa/ }).click();
  await approvePlanWhenVisible(page);
}

export async function startAndCompleteFirstBlock(page: Page): Promise<void> {
  const openTraining = page.getByRole('link', { name: /Abrir no Lichess/ }).first();

  if ((await openTraining.count()) > 0) {
    await openTraining.click();
  } else {
    await page.getByRole('button', { name: 'Iniciar bloco' }).first().click();
  }

  await expect(page.getByText(/Treinando há|Tempo atingido/)).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Concluir' }).first().click();
  const ratingGroup = page.getByRole('group', { name: 'Como foi o treino?' });
  await expect(ratingGroup).toBeVisible();
  await ratingGroup.getByRole('button', { name: 'Bom' }).click();
  await expect(page.getByRole('progressbar', { name: 'Progresso do dia', exact: true })).toHaveAttribute(
    'aria-valuenow',
    /[1-9]/,
    { timeout: 30_000 },
  );
}

export async function openOAuthCallback(input: {
  page: Page;
  kind: 'success' | 'cancelled';
}): Promise<void> {
  const { page, kind } = input;

  if (kind === 'success') {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'lichess-tutor:oauth-pending',
        JSON.stringify({
          state: 'e2e-state',
          codeVerifier: 'e2e-code-verifier',
          redirectUri: `${window.location.origin}${window.location.pathname}`,
          scopes: ['puzzle:read', 'study:write'],
        }),
      );
    });
    await openApp(page, '/?code=e2e-code&state=e2e-state');
    await expect(page.getByText('Lichess conectado.')).toBeVisible({ timeout: 30_000 });
    return;
  }

  await openApp(page, '/?error=access_denied');
  await expect(page.getByText(/cancelou a conexão com o Lichess/)).toBeVisible({ timeout: 30_000 });
}

export async function saveScreenshot(page: Page, testInfo: TestInfo, name: string): Promise<string> {
  await mkdir(screenshotDir, { recursive: true });
  const screenshotPath = path.join(
    screenshotDir,
    `${slugify(testInfo.project.name)}-${slugify(testInfo.title)}-${slugify(name)}.jpg`,
  );

  await page.screenshot({
    path: screenshotPath,
    type: 'jpeg',
    quality: 72,
    fullPage: true,
    animations: 'disabled',
  });
  await testInfo.attach(name, { path: screenshotPath, contentType: 'image/jpeg' });

  return screenshotPath;
}

async function installBrowserGuards(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'open', {
      configurable: true,
      value: (url?: string | URL) => {
        const openedUrls = ((window as unknown as { __rotinaOpenedUrls?: string[] }).__rotinaOpenedUrls ??= []);
        openedUrls.push(String(url ?? ''));

        return { opener: null } as Window;
      },
    });
  });
}

async function mockExternalApis(page: Page, options: MockApiOptions): Promise<void> {
  await page.route('https://api.chess.com/**', async (route) => {
    const url = new URL(route.request().url());
    const username = chesscomUsernameFromPath(url.pathname);
    const dataset = username === undefined ? 'none' : (options.chesscom?.[username.toLowerCase()] ?? 'none');

    if (url.pathname.endsWith('/stats')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ chess_rapid: { last: { rating: dataset === 'none' ? undefined : 875 } } }),
      });
      return;
    }

    if (url.pathname.endsWith('/games/archives')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          archives: dataset === 'none' || username === undefined
            ? []
            : [`https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/2026/05`],
        }),
      });
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ games: username === undefined ? [] : chesscomGames(username, dataset) }),
    });
  });

  await page.route('https://lichess.org/**', async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname === '/api/account') {
      // M2a: retorna conta com rating de jogo alto e não-provisório para disparar
      // a promoção de banda (só sobe). `prov: false` = não-provisório (parseLichessAccount
      // usa `value.prov === true` para marcar provisional).
      const rapidRating = options.lichessAccountRating ?? 1500;
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'e2euser',
          username: 'e2eUser',
          perfs: {
            rapid: { rating: rapidRating, games: 50, prov: false },
          },
        }),
      });
      return;
    }

    if (url.pathname === '/api/token') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ token_type: 'Bearer', access_token: 'e2e-token', expires_in: 3600 }),
      });
      return;
    }

    if (url.pathname.startsWith('/api/games/user/')) {
      const username = decodeURIComponent(url.pathname.split('/').at(-1) ?? '');
      const dataset = options.lichess?.[username.toLowerCase()] ?? 'none';

      await route.fulfill({
        contentType: 'application/x-ndjson',
        body: lichessGames(username, dataset).map((game) => JSON.stringify(game)).join('\n'),
      });
      return;
    }

    if (url.pathname.startsWith('/api/puzzle/activity')) {
      await route.fulfill({
        contentType: 'application/x-ndjson',
        body: [
          JSON.stringify({ date: Date.now() - 1_000, win: false, puzzle: { id: 'e2e-a', rating: 850, themes: ['fork'] } }),
          JSON.stringify({ date: Date.now() - 500, win: true, puzzle: { id: 'e2e-b', rating: 870, themes: ['fork'] } }),
        ].join('\n'),
      });
      return;
    }

    if (url.pathname === '/api/puzzle/dashboard/30') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          days: 30,
          global: { nb: 6, firstWins: 3, replayWins: 1, puzzleRatingAvg: 865, performance: 830 },
          themes: {
            fork: { theme: 'Fork', results: { nb: 4, firstWins: 1, replayWins: 1, puzzleRatingAvg: 850 } },
            mateIn1: { theme: 'Mate in 1', results: { nb: 2, firstWins: 2, replayWins: 0, puzzleRatingAvg: 700 } },
          },
        }),
      });
      return;
    }

    if (url.pathname.startsWith('/api/puzzle/replay/30/')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ replay: { days: 30, theme: 'fork', nb: 4, remaining: ['a', 'b'] } }),
      });
      return;
    }

    if (url.pathname === '/api/study') {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: 'e2estudy' }) });
      return;
    }

    if (url.pathname.startsWith('/api/study/') && url.pathname.endsWith('/import-pgn')) {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify([{ id: 'chapter', name: 'Plano do dia' }]) });
      return;
    }

    await route.fulfill({ status: 204, body: '' });
  });
}

function chesscomUsernameFromPath(pathname: string): string | undefined {
  const parts = pathname.split('/');

  return parts[1] === 'pub' && parts[2] === 'player' ? decodeURIComponent(parts[3] ?? '') : undefined;
}

function chesscomGames(username: string, dataset: ChesscomDataset) {
  if (dataset === 'none') {
    return [];
  }

  const gameCount = dataset === 'many' ? 12 : 2;
  const endTime = Date.UTC(2026, 4, 10, 12, 0, 0) / 1000;

  return Array.from({ length: gameCount }, (_, index) => ({
    white: { username, result: dataset === 'many' ? 'resigned' : 'win' },
    black: { username: `opponent-${String(index)}`, result: dataset === 'many' ? 'win' : 'resigned' },
    accuracies: { white: dataset === 'many' ? 55 : 88 },
    eco: 'https://www.chess.com/openings/C20-King-Pawn-Game',
    end_time: endTime + index * 86_400,
    pgn: '[ECO "C20"]\n[Opening "King Pawn Game"]\n\n1. e4 e5 *',
    rated: true,
    rules: 'chess',
    time_class: 'rapid',
    time_control: '600',
    url: `https://www.chess.com/game/live/${String(index + 1)}`,
  }));
}

function lichessGames(username: string, dataset: LichessDataset) {
  if (dataset === 'none') {
    return [];
  }

  const gameCount = dataset === 'many' ? 8 : 2;

  return Array.from({ length: gameCount }, (_, index) => ({
    id: `e2e-${String(index)}`,
    speed: 'rapid',
    status: 'mate',
    winner: dataset === 'many' ? 'black' : 'white',
    opening: { eco: 'C20', name: 'King Pawn Game' },
    players: {
      white: {
        user: { id: username.toLowerCase(), name: username },
        analysis: {
          inaccuracy: dataset === 'many' ? 2 : 0,
          mistake: dataset === 'many' ? 1 : 0,
          blunder: dataset === 'many' ? 4 : 0,
          acpl: dataset === 'many' ? 120 : 30,
        },
      },
      black: {
        user: { id: `op-${String(index)}`, name: `Opponent ${String(index)}` },
        analysis: { inaccuracy: 0, mistake: 0, blunder: 0, acpl: 20 },
      },
    },
  }));
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}
