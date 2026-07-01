import { expect, test } from '@playwright/test';
import path from 'node:path';
import {
  completeQuickStart,
  openApp,
  openOAuthCallback,
  prepareBrowser,
  saveScreenshot,
  startAndCompleteFirstBlock,
} from './helpers';

test('Hoje: iniciar bloco, timer, feedback e Progresso', async ({ page }, testInfo) => {
  await prepareBrowser(page);
  await openApp(page);
  await completeQuickStart(page, testInfo);
  await saveScreenshot(page, testInfo, 'hoje-inicial');

  const openTraining = page.getByRole('link', { name: /Abrir no Lichess/ }).first();
  if ((await openTraining.count()) > 0) {
    await openTraining.click();
  } else {
    await page.getByRole('button', { name: 'Iniciar bloco' }).first().click();
  }
  await expect(page.getByText(/Treinando há|Tempo atingido/)).toBeVisible({ timeout: 30_000 });
  await saveScreenshot(page, testInfo, 'hoje-timer');

  await page.getByRole('button', { name: 'Concluir' }).first().click();
  await saveScreenshot(page, testInfo, 'hoje-feedback-prompt');
  await page.getByRole('button', { name: 'Bom' }).click();
  await expect(page.getByRole('progressbar', { name: 'Progresso do dia', exact: true })).toHaveAttribute(
    'aria-valuenow',
    /[1-9]/,
    { timeout: 30_000 },
  );
  await saveScreenshot(page, testInfo, 'hoje-feedback-salvo');

  await page.getByRole('button', { name: 'Progresso' }).click();
  await expect(page.getByRole('heading', { name: 'Progresso' })).toBeVisible({ timeout: 30_000 });
  await saveScreenshot(page, testInfo, 'progresso-apos-treino');
});

test('Hoje: conferir puzzles com OAuth atualiza sinais agregados', async ({ page }, testInfo) => {
  await prepareBrowser(page);
  await openOAuthCallback({ page, kind: 'success' });
  await completeQuickStart(page, testInfo);
  await startAndCompleteFirstBlock(page);

  const reconcileButton = page.getByRole('button', { name: 'Conferir puzzles' });

  if ((await reconcileButton.count()) === 0) {
    const ratingGroup = page.getByRole('group', { name: 'Como foi o treino?' });

    if (await ratingGroup.isVisible().catch(() => false)) {
      await ratingGroup.getByRole('button', { name: 'Bom' }).click();
    } else {
      await startAndCompleteFirstBlock(page);
    }
  }

  await expect(reconcileButton).toBeVisible({ timeout: 30_000 });
  await saveScreenshot(page, testInfo, 'puzzle-pendente-de-conferencia');

  await reconcileButton.click();
  await page.getByRole('button', { name: 'Progresso' }).click();
  await expect(page.getByRole('heading', { name: 'Progresso' })).toBeVisible({ timeout: 30_000 });
  await page.locator('summary').filter({ hasText: 'Sincronizar e estudar' }).click();
  await expect(page.getByText(/sinais agregados de puzzle|Nenhum resultado novo/)).toBeVisible({ timeout: 30_000 });
  await saveScreenshot(page, testInfo, 'puzzle-reconciliado');
});

test('Config: exportar/restaurar backup e apagar dados locais', async ({ page }, testInfo) => {
  await prepareBrowser(page);
  await openApp(page);
  await completeQuickStart(page, testInfo);

  await page.getByRole('button', { name: 'Ajustes' }).click();
  await expect(page.getByRole('heading', { name: 'Configuração' })).toBeVisible({ timeout: 30_000 });
  await page.locator('summary').filter({ hasText: 'Dados locais' }).click();
  await saveScreenshot(page, testInfo, 'config-inicial');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar backup JSON' }).click();
  const download = await downloadPromise;
  const backupPath = path.join(testInfo.outputDir, 'rotina-backup-e2e.json');
  await download.saveAs(backupPath);
  await expect(page.getByText(/Backup exportado/)).toBeVisible({ timeout: 30_000 });
  await saveScreenshot(page, testInfo, 'config-backup-exportado');

  await page.setInputFiles('input[aria-label="Selecionar arquivo de backup para restaurar"]', backupPath);
  await expect(page.getByRole('group', { name: 'Confirmar restaurar backup' })).toBeVisible();
  await saveScreenshot(page, testInfo, 'config-backup-confirmar-restauracao');
  await page.getByRole('button', { name: 'Restaurar e recarregar' }).click();
  await expect(page.getByRole('heading', { name: 'Hoje' })).toBeVisible({ timeout: 30_000 });
  await saveScreenshot(page, testInfo, 'config-backup-restaurado');

  await page.getByRole('button', { name: 'Ajustes' }).click();
  await expect(page.getByRole('heading', { name: 'Configuração' })).toBeVisible({ timeout: 30_000 });
  await page.locator('summary').filter({ hasText: 'Dados locais' }).click();
  await page.getByRole('button', { name: /Apagar tudo/ }).click();
  await expect(page.getByRole('group', { name: 'Confirmar apagar tudo' })).toBeVisible();
  await saveScreenshot(page, testInfo, 'config-apagar-confirmar');
  await page.getByRole('button', { name: /Apagar definitivamente/ }).click();
  await expect(page.getByRole('heading', { name: 'A aula pode começar.' })).toBeVisible({ timeout: 30_000 });
  await saveScreenshot(page, testInfo, 'config-apagar-volta-onboarding');
});
