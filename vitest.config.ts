import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Só os testes unitários de src. Isola o e2e/*.spec.ts do Playwright, que
      // o include default do vitest (.spec) pegaria por engano.
      include: ['src/**/*.test.{ts,tsx}'],
      alias: {
        // O módulo virtual do vite-plugin-pwa não existe no vitest/jsdom.
        'virtual:pwa-register/react': fileURLToPath(new URL('./src/test/pwaRegisterMock.ts', import.meta.url)),
      },
      // Cobertura é baseline (sem threshold bloqueante) e roda só via
      // `npm run coverage` — o `npm test` default segue rápido.
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.test.{ts,tsx}',
          'src/**/*.d.ts',
          'src/test/**',
          'src/main.tsx',
        ],
      },
    },
  }),
);
