import { test } from '@playwright/test';
import { openOAuthCallback, prepareBrowser, saveScreenshot } from './helpers';

test('OAuth callback: sucesso salva token local e limpa query', async ({ page }, testInfo) => {
  await prepareBrowser(page);
  await openOAuthCallback({ page, kind: 'success' });
  await saveScreenshot(page, testInfo, 'oauth-callback-sucesso');
});

test('OAuth callback: cancelado mostra mensagem recuperável', async ({ page }, testInfo) => {
  await prepareBrowser(page);
  await openOAuthCallback({ page, kind: 'cancelled' });
  await saveScreenshot(page, testInfo, 'oauth-callback-cancelado');
});
