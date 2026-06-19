import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { APP_DESCRIPTION, APP_MANIFEST_NAME, APP_NAME } from './src/config/appIdentity';

declare const process: {
  env: {
    npm_package_version?: string;
  };
};

export const CONTENT_SECURITY_POLICY =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://lichess.org https://api.chess.com; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; upgrade-insecure-requests";

export const pwaOptions = {
  injectRegister: 'auto',
  // 'prompt': o ReloadPrompt avisa que ha versao nova e aplica na hora,
  // em vez do autoUpdate silencioso que so pegava na segunda reabertura.
  registerType: 'prompt',
  workbox: {
    navigateFallback: 'index.html',
    sourcemap: false,
    // Apenas o subset latino entra no precache offline; os demais subsets do
    // Inter chegam por unicode-range so se o browser pedir. As artes .webp
    // (Lemos, molduras, texturas) entram para o app abrir inteiro offline.
    globPatterns: [
      '**/*.{js,css,html,ico,png,svg,webp,webmanifest}',
      '**/inter-latin-wght-normal-*.woff2',
      '**/fraunces-latin-wght-normal-*.woff2',
    ],
  },
  manifest: {
    name: APP_MANIFEST_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: '/',
    scope: '/',
    lang: 'pt-BR',
    display: 'standalone',
    background_color: '#f5f3ec',
    theme_color: '#1f3f36',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
} satisfies Parameters<typeof VitePWA>[0];

function buildCspMetaPlugin() {
  return {
    name: 'rotina-build-csp-meta',
    apply: 'build' as const,
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: {
            'http-equiv': 'Content-Security-Policy',
            content: CONTENT_SECURITY_POLICY,
          },
          injectTo: 'head' as const,
        },
      ];
    },
  };
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  plugins: [
    buildCspMetaPlugin(),
    react(),
    VitePWA(pwaOptions),
  ],
  build: {
    // Beta publico: nao publicar source maps no build estatico.
    sourcemap: false,
    rollupOptions: {
      output: {
        // Isola dependências estáveis em chunks próprios: melhora o cache de
        // longa duração (mudar o app não invalida o vendor) e remove o aviso de
        // chunk principal acima de 500 kB. Forma de função (rolldown-vite).
        manualChunks(id: string): string | undefined {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/dexie')) {
            return 'dexie';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          return undefined;
        },
      },
    },
  },
});
