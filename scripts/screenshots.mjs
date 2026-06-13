// Prints automatizados das 3 telas em claro/escuro e desktop/mobile.
// Pré-requisito: dev server rodando em http://localhost:5173
// Run: node scripts/screenshots.mjs

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = 'http://localhost:5173';
const OUT = 'screenshots';

const SETUPS = [
  { name: 'mobile-claro', viewport: { width: 390, height: 844 }, colorScheme: 'light' },
  { name: 'mobile-escuro', viewport: { width: 390, height: 844 }, colorScheme: 'dark' },
  { name: 'desktop-claro', viewport: { width: 1280, height: 900 }, colorScheme: 'light' },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();

for (const setup of SETUPS) {
  const context = await browser.newContext({
    viewport: setup.viewport,
    colorScheme: setup.colorScheme,
  });
  const page = await context.newPage();

  await page.goto(BASE, { waitUntil: 'networkidle' });

  // Funil de primeira vez: Passo 1 (boas-vindas) → Começar rápido → Passo 3
  // (aprovar plano) → Hoje. Captura cada passo para auditoria.
  const vamosConfigurar = page.getByRole('button', { name: 'Vamos configurar' });

  if (await vamosConfigurar.isVisible().catch(() => false)) {
    await page.screenshot({ path: `${OUT}/${setup.name}-funil-1-boasvindas.png`, fullPage: true });
    await vamosConfigurar.click();
    await page.waitForSelector('#setup-title', { timeout: 10_000 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT}/${setup.name}-funil-2-config.png`, fullPage: true });
    await page.getByRole('button', { name: 'Salvar' }).click();
    await page.waitForSelector('#learning-plan-title', { timeout: 10_000 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT}/${setup.name}-funil-3-plano.png`, fullPage: true });
    await page.getByRole('button', { name: 'Aprovar plano' }).click();
    await page.waitForSelector('.hero-now, .day-completion-card', { timeout: 10_000 });
  }

  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${setup.name}-hoje.png`, fullPage: true });

  await page.getByRole('button', { name: 'Progresso' }).click();
  await page.waitForSelector('.fold', { timeout: 10_000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${setup.name}-progresso.png`, fullPage: true });

  await page.getByRole('button', { name: 'Config' }).click();
  await page.waitForSelector('.fold', { timeout: 10_000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${setup.name}-config.png`, fullPage: true });

  await context.close();
  console.log(`OK  ${setup.name} (hoje, progresso, config)`);
}

await browser.close();
console.log(`\n✓ Prints em ${OUT}/`);
