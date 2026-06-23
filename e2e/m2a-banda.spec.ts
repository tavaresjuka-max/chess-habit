/**
 * M2a — banda sobe sozinha pelo rating de jogo do Lichess.
 *
 * Fluxo principal:
 *   1. Onboarding SEM OAuth (sem token) → banda '400-800', muitos jogos → plano aprovado.
 *      Nesta etapa, runLichessSync é chamado mas sem token, logo /api/account NÃO é
 *      chamado e derivedBand fica undefined → banda não sobe durante o onboarding.
 *   2. Injeta token Lichess diretamente no IndexedDB (Dexie: 'lichess-tutor' /
 *      lichessOAuthTokens) sem recarregar a página.
 *   3. Abre fold "Sincronizar e estudar", clica "Atualizar Lichess".
 *   4. Mock de /api/account devolve rapid 1500 (não-provisório) →
 *      bandFromEstimate(1500) → '1200-1600' → indexOf > indexOf('400-800') → sobe.
 *   5. Mensagem final contém "Subi sua faixa para 1200-1600".
 */

import { expect, test } from '@playwright/test';
import {
  approvePlanWhenVisible,
  configureAccounts,
  openApp,
  prepareBrowser,
  saveScreenshot,
} from './helpers';

/** Injeta um token Lichess válido direto no IndexedDB sem recarregar a página. */
async function injectLichessToken(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('lichess-tutor');
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('lichessOAuthTokens', 'readwrite');
        const store = tx.objectStore('lichessOAuthTokens');
        store.put({
          id: 'lichess',
          accessToken: 'e2e-token',
          tokenType: 'Bearer',
          scopes: ['puzzle:read', 'study:write'],
          obtainedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
        });
        tx.oncomplete = () => { resolve(); };
        tx.onerror = () => { reject(tx.error ?? new Error('IndexedDB transaction failed')); };
      };
      request.onerror = () => { reject(request.error ?? new Error('IndexedDB request failed')); };
    });
  });
}

test('M2a: sync manual Lichess promove banda quando rating de jogo é maior', async ({ page }, testInfo) => {
  // lichessAccountRating: 1500 → bandFromEstimate(1500) < 1600 → '1200-1600'
  // Banda inicial: '400-800' (índice 1) → '1200-1600' (índice 4): sobe.
  await prepareBrowser(page, {
    lichess: { m2auser: 'many' },
    lichessAccountRating: 1500,
  });

  // Onboarding SEM OAuth: openApp direto (sem token no IndexedDB).
  // runOnboardingImport → runLichessSync → token ausente → /api/account não chamado
  // → derivedBand undefined → banda permanece '400-800' após o onboarding.
  await openApp(page);
  await configureAccounts({ page, lichessUsername: 'm2auser', band: '400-800', minutes: '15' });

  // Com muitos jogos Lichess, onboarding vai direto ao plano (sem calibração).
  await approvePlanWhenVisible(page);
  await saveScreenshot(page, testInfo, 'hoje-inicial-banda-baixa');

  // Injeta o token OAuth no IndexedDB APÓS o onboarding, SEM recarregar a página.
  // Na próxima chamada ao runLichessSync, o token será lido e /api/account será chamado.
  await injectLichessToken(page);

  // Abre o fold "Sincronizar e estudar" que contém o botão de sync do Lichess.
  const syncFold = page.locator('summary').filter({ hasText: 'Sincronizar e estudar' });
  await expect(syncFold).toBeVisible({ timeout: 15_000 });
  await syncFold.click();

  // Clica "Atualizar Lichess" → runLichessSync → carrega token → /api/account
  // → rapid 1500 → bandFromEstimate → '1200-1600' → índice maior → promove.
  const syncButton = page.getByRole('button', { name: 'Atualizar Lichess' });
  await expect(syncButton).toBeVisible({ timeout: 10_000 });
  await syncButton.click();

  await saveScreenshot(page, testInfo, 'sync-em-andamento');

  // Aguarda mensagem de promoção (aria-live="polite" na diagnosis-strip).
  // Formato: "Lichess atualizado com X sinais derivados. Subi sua faixa para 1200-1600."
  await expect(page.getByText(/Subi sua faixa para 1200-1600/)).toBeVisible({ timeout: 30_000 });
  await saveScreenshot(page, testInfo, 'banda-promovida');

  // Confirma que a mensagem base de sucesso também está presente.
  await expect(page.getByText(/Lichess atualizado com/)).toBeVisible({ timeout: 5_000 });
});

test('M2a: sync Lichess sem token OAuth não promove banda (best-effort)', async ({ page }, testInfo) => {
  // Sem OAuth → token ausente → /api/account não é chamado → banda não sobe.
  // Garante que o sync ainda funciona sem travar (DD6: best-effort).
  await prepareBrowser(page, {
    lichess: { m2anooauth: 'many' },
    lichessAccountRating: 1500,
  });

  // Onboarding SEM OAuth — sem token em nenhum momento.
  await openApp(page);
  await configureAccounts({ page, lichessUsername: 'm2anooauth', band: '400-800', minutes: '15' });
  await approvePlanWhenVisible(page);
  await saveScreenshot(page, testInfo, 'hoje-sem-oauth');

  const syncFold = page.locator('summary').filter({ hasText: 'Sincronizar e estudar' });
  await expect(syncFold).toBeVisible({ timeout: 15_000 });
  await syncFold.click();

  const syncButton = page.getByRole('button', { name: 'Atualizar Lichess' });
  await expect(syncButton).toBeVisible({ timeout: 10_000 });
  await syncButton.click();

  // Sem token: sem promoção. Mensagem de sync aparece mas SEM "Subi sua faixa".
  await expect(page.getByText(/Lichess atualizado com/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Subi sua faixa/)).not.toBeVisible();
  await saveScreenshot(page, testInfo, 'sync-sem-promocao');
});

// DEFERIDO: nudge de puzzle E2E ("seu rating de puzzles ... perto do teto da faixa").
// O nudge lê loadSignals() após o sync de /api/puzzle/dashboard/30. O mock atual
// devolve performance: 830 e o mock de /api/puzzle/activity devolve puzzles com
// rating ~870. Para banda '1200-1600' o upperBound é 1600 → 90% = 1440; ambos os
// ratings estão bem abaixo do limiar. Disparar o nudge exigiria sobrescrever o mock
// do dashboard com performance ≥ 1440, mas isso quebraria os outros specs que
// dependem do dataset padrão de iniciante. Deixar para spec dedicada quando o mock
// de /api/puzzle/dashboard/30 for parametrizável por teste (MockApiOptions).
