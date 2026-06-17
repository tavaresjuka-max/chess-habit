import { expect, test } from '@playwright/test';
import {
  approvePlanWhenVisible,
  configureAccounts,
  openApp,
  openOAuthCallback,
  prepareBrowser,
  saveScreenshot,
  skipQuestionsAndApprovePlan,
} from './helpers';

test('onboarding: começo rápido sem conta cai no Hoje', async ({ page }, testInfo) => {
  await prepareBrowser(page);
  await openApp(page);
  await saveScreenshot(page, testInfo, 'sem-conta-welcome');

  await page.getByRole('button', { name: 'Começar rápido' }).click();
  await expect(page.getByRole('button', { name: 'Aprovar plano' })).toBeVisible({ timeout: 30_000 });
  await saveScreenshot(page, testInfo, 'sem-conta-plano');
  await approvePlanWhenVisible(page);
  await saveScreenshot(page, testInfo, 'sem-conta-hoje');
});

test('onboarding: configurar sem conta usa avaliação de entrada', async ({ page }, testInfo) => {
  await prepareBrowser(page);
  await openApp(page);
  await configureAccounts({ page, band: '800-1000', minutes: '15' });
  await saveScreenshot(page, testInfo, 'sem-conta-avaliacao');

  await skipQuestionsAndApprovePlan(page);
  await saveScreenshot(page, testInfo, 'sem-conta-avaliacao-hoje');
});

test('onboarding: só Chess.com com muitos dados mostra plano com diagnóstico', async ({ page }, testInfo) => {
  await prepareBrowser(page, { chesscom: { muitosdados: 'many' } });
  await openApp(page);
  await configureAccounts({ page, chesscomUsername: 'muitosdados', band: '800-1000', minutes: '30' });

  await expect(page.getByRole('button', { name: 'Aprovar plano' })).toBeVisible({ timeout: 30_000 });
  await saveScreenshot(page, testInfo, 'chesscom-muitos-dados-plano');
  await approvePlanWhenVisible(page);
  await saveScreenshot(page, testInfo, 'chesscom-muitos-dados-hoje');
});

test('onboarding: só Chess.com com poucos jogos pede calibração', async ({ page }, testInfo) => {
  await prepareBrowser(page, { chesscom: { poucosjogos: 'few' } });
  await openApp(page);
  await configureAccounts({ page, chesscomUsername: 'poucosjogos', band: '800-1000', minutes: '15' });

  await expect(page.getByRole('heading', { name: 'Vamos calibrar seu plano' })).toBeVisible({ timeout: 30_000 });
  await saveScreenshot(page, testInfo, 'chesscom-poucos-jogos-avaliacao');
  await skipQuestionsAndApprovePlan(page);
  await saveScreenshot(page, testInfo, 'chesscom-poucos-jogos-hoje');
});

test('onboarding: só Lichess sem OAuth importa partidas públicas', async ({ page }, testInfo) => {
  await prepareBrowser(page, { lichess: { lichessonly: 'many' } });
  await openApp(page);
  await configureAccounts({ page, lichessUsername: 'lichessonly', band: '800-1000', minutes: '15' });

  await expect(page.getByRole('button', { name: 'Aprovar plano' })).toBeVisible({ timeout: 30_000 });
  await saveScreenshot(page, testInfo, 'lichess-sem-oauth-plano');
  await approvePlanWhenVisible(page);
  await saveScreenshot(page, testInfo, 'lichess-sem-oauth-hoje');
});

test('onboarding: Lichess com OAuth volta conectado e segue o funil', async ({ page }, testInfo) => {
  await prepareBrowser(page, { lichess: { oauthlichess: 'many' } });
  await openOAuthCallback({ page, kind: 'success' });
  await saveScreenshot(page, testInfo, 'oauth-sucesso-welcome');

  await configureAccounts({ page, lichessUsername: 'oauthlichess', band: '800-1000', minutes: '15' });
  await expect(page.getByRole('button', { name: 'Aprovar plano' })).toBeVisible({ timeout: 30_000 });
  await saveScreenshot(page, testInfo, 'lichess-com-oauth-plano');
  await approvePlanWhenVisible(page);
  await saveScreenshot(page, testInfo, 'lichess-com-oauth-hoje');
});

test('onboarding: Lichess e Chess.com juntos chegam ao plano', async ({ page }, testInfo) => {
  await prepareBrowser(page, {
    chesscom: { contadupla: 'many' },
    lichess: { contadupla: 'many' },
  });
  await openApp(page);
  await configureAccounts({
    page,
    lichessUsername: 'contadupla',
    chesscomUsername: 'contadupla',
    band: '800-1000',
    minutes: '30',
  });

  await expect(page.getByRole('button', { name: 'Aprovar plano' })).toBeVisible({ timeout: 30_000 });
  await saveScreenshot(page, testInfo, 'ambas-contas-plano');
  await approvePlanWhenVisible(page);
  await saveScreenshot(page, testInfo, 'ambas-contas-hoje');
});
