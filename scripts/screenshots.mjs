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

  // Primeiro uso: a Welcome do professor recebe o aluno.
  const comecar = page.getByRole('button', { name: 'Começar agora' });

  if (await comecar.isVisible().catch(() => false)) {
    await page.screenshot({ path: `${OUT}/${setup.name}-welcome.png`, fullPage: true });
    await comecar.click();
    await page.waitForSelector('.hero-now, .day-completion-card', { timeout: 10_000 });
  }

  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${setup.name}-hoje.png`, fullPage: true });

  await page.getByRole('button', { name: 'Progresso' }).click();
  await page.waitForSelector('.progress-section', { timeout: 10_000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${setup.name}-progresso.png`, fullPage: true });

  await page.getByRole('button', { name: 'Config' }).click();
  await page.waitForSelector('.config-section', { timeout: 10_000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${setup.name}-config.png`, fullPage: true });

  await context.close();
  console.log(`OK  ${setup.name} (hoje, progresso, config)`);
}

await browser.close();
console.log(`\n✓ Prints em ${OUT}/`);
