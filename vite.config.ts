import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export const pwaOptions = {
  injectRegister: 'auto',
  // 'prompt': o ReloadPrompt avisa que ha versao nova e aplica na hora,
  // em vez do autoUpdate silencioso que so pegava na segunda reabertura.
  registerType: 'prompt',
  workbox: {
    navigateFallback: 'index.html',
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
    name: 'Rotina de Treino Lichess',
    short_name: 'Rotina',
    description: 'Ferramenta pessoal local-first para organizar treino de xadrez no Lichess.',
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

export default defineConfig({
  plugins: [
    react(),
    VitePWA(pwaOptions),
  ],
  build: {
    // Source maps de produção: erros no Vercel e no service worker chegam com
    // stack rastreável (antes só apareciam minificados, sem origem).
    sourcemap: true,
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
