import { defineConfig, devices } from '@playwright/test';

// Smoke PWA + harness E2E de M1. Roda via `npm run smoke:pwa` em build
// fresco numa porta dedicada (não conflita com o `vite preview` default 4173).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 2,
  timeout: 90_000,
  use: {
    baseURL: 'http://127.0.0.1:4188',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // --host 127.0.0.1 evita o mismatch IPv6(::1)/IPv4: o Playwright sonda o
    // url em 127.0.0.1 e o vite preview default às vezes sobe só em ::1.
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4188 --strictPort',
    url: 'http://127.0.0.1:4188',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
