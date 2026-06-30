import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openApp, prepareBrowser } from './helpers';

async function expectNoSeriousViolations(page: Page, context: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const serious = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );

  const summary = serious
    .map((violation) => {
      return `${violation.id} [${String(violation.impact)}] x${String(violation.nodes.length)}: ${violation.help}`;
    })
    .join('\n');

  expect(serious, `${context} tem violações sérias de a11y:\n${summary}`).toEqual([]);
}

async function completeQuickStartForAudit(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: 'A aula pode começar.' })).toBeVisible();
  await page.getByRole('button', { name: 'Começar rápido' }).click();
  await expect(page.getByRole('button', { name: 'Aprovar plano' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Aprovar plano' }).click();
  await expect(page.getByRole('heading', { name: 'Hoje' })).toBeVisible({ timeout: 30_000 });
}

test('a11y: tela de boas-vindas sem violações sérias', async ({ page }) => {
  await prepareBrowser(page);
  await openApp(page);
  await expect(page.getByRole('heading', { name: 'A aula pode começar.' })).toBeVisible();
  await expectNoSeriousViolations(page, 'Boas-vindas');
});

test('a11y: Hoje, Config e Progresso sem violações sérias', async ({ page }) => {
  await prepareBrowser(page);
  await openApp(page);
  await completeQuickStartForAudit(page);
  await expectNoSeriousViolations(page, 'Hoje');

  await page.getByRole('button', { name: 'Config' }).click();
  await expect(page.getByRole('heading', { name: 'Configuração' })).toBeVisible({ timeout: 30_000 });
  await expectNoSeriousViolations(page, 'Config');

  await page.getByRole('button', { name: 'Progresso' }).click();
  await expect(page.getByRole('heading', { name: 'Progresso' })).toBeVisible({ timeout: 30_000 });
  await expectNoSeriousViolations(page, 'Progresso');
});

test('a11y: passo "Suas contas" do onboarding sem violações sérias', async ({ page }) => {
  await prepareBrowser(page, { lichess: { joaninha: 'many' } });
  await openApp(page);
  await page.getByRole('button', { name: 'Vamos configurar' }).click();
  // Fase 3 (62932c4) inseriu o consentimento informado antes das contas.
  await expect(page.getByRole('heading', { name: 'Seus dados e sua privacidade' })).toBeVisible();
  await expectNoSeriousViolations(page, 'Onboarding · Consentimento');
  await page.getByRole('button', { name: 'Aceitar e continuar' }).click();
  await expect(page.getByRole('heading', { name: 'Suas contas' })).toBeVisible();
  await expectNoSeriousViolations(page, 'Onboarding · Suas contas');
});

test('a11y: pontos do carrossel têm alvo de pelo menos 44px no Hoje', async ({ page }) => {
  await prepareBrowser(page);
  await openApp(page);
  await completeQuickStartForAudit(page);

  const dots = page.locator('.block-carousel-dot');
  await expect(dots.first()).toBeVisible({ timeout: 30_000 });
  expect(await dots.count()).toBeGreaterThan(0);

  const box = await dots.first().boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(box?.width).toBeGreaterThanOrEqual(44);
});
