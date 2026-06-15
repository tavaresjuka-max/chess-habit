import { test, expect } from '@playwright/test';

// O app é local-first/PWA: depois que o service worker cacheia, ele deve abrir
// inteiro offline (servido do cache, não a tela de erro do navegador). Este
// smoke prova isso contra o build de produção.
test('abre offline depois do service worker cachear', async ({ page, context }) => {
  // 1ª carga online: monta o app, registra o SW e popula o precache.
  await page.goto('/');
  await expect(page.locator('#root')).not.toBeEmpty();
  await expect(page.getByRole('button').first()).toBeVisible({ timeout: 30_000 });

  // Espera o service worker registrar e ativar.
  await page.waitForFunction(
    async () => {
      if (!('serviceWorker' in navigator)) {
        return false;
      }

      const registration = await navigator.serviceWorker.getRegistration();

      return Boolean(registration?.active);
    },
    undefined,
    { timeout: 30_000 },
  );
  // Folga para o Workbox terminar o precache antes de cortar a rede.
  await page.waitForTimeout(2_000);

  // Corta a rede e recarrega: o SW precisa servir o shell + assets do cache.
  await context.setOffline(true);
  await page.reload();

  await expect(page.locator('#root')).not.toBeEmpty();
  await expect(page.getByRole('button').first()).toBeVisible({ timeout: 30_000 });

  await context.setOffline(false);
});
