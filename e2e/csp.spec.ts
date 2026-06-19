import { expect, test, type Page } from '@playwright/test';
import { openApp, prepareBrowser } from './helpers';

async function completeQuickStartForCsp(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: 'A aula pode começar.' })).toBeVisible();
  await page.getByRole('button', { name: 'Começar rápido' }).click();
  await expect(page.getByRole('button', { name: 'Aprovar plano' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Aprovar plano' }).click();
  await expect(page.getByRole('heading', { name: 'Hoje' })).toBeVisible({ timeout: 30_000 });
}

test('CSP: nenhum bloqueio de style/script no console ao usar o app', async ({ page }) => {
  const cspErrors: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (
      /Refused to apply inline style|Refused to execute inline script|Refused to load|violates the following Content Security Policy|blocked by Content Security Policy/i.test(
        text,
      )
    ) {
      cspErrors.push(text);
    }
  });

  await prepareBrowser(page);
  await openApp(page);
  await completeQuickStartForCsp(page);
  await page.getByRole('button', { name: 'Progresso' }).click();
  await expect(page.getByRole('heading', { name: 'Progresso' })).toBeVisible({ timeout: 30_000 });

  expect(cspErrors, `Violações de CSP detectadas:\n${cspErrors.join('\n')}`).toEqual([]);
});
