import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      alias: {
        // O módulo virtual do vite-plugin-pwa não existe no vitest/jsdom.
        'virtual:pwa-register/react': fileURLToPath(new URL('./src/test/pwaRegisterMock.ts', import.meta.url)),
      },
    },
  }),
);
