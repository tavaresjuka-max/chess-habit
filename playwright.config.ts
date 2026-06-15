import { defineConfig, devices } from '@playwright/test';

// Smoke de PWA/offline em PRODUÇÃO — isolado do vitest (testDir ./e2e, .spec.ts).
// Roda só via `npm run smoke:pwa`, FORA do gate `npm test`/CI. Sobe num build
// fresco numa porta dedicada (não conflita com o `vite preview` default 4173).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  use: {
    baseURL: 'http://127.0.0.1:4188',
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // --host 127.0.0.1 evita o mismatch IPv6(::1)/IPv4: o Playwright sonda o
    // url em 127.0.0.1 e o vite preview default às vezes sobe só em ::1.
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4188 --strictPort',
    url: 'http://127.0.0.1:4188',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
