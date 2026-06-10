import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export const pwaOptions = {
  injectRegister: 'auto',
  registerType: 'autoUpdate',
  workbox: {
    navigateFallback: 'index.html',
    // Apenas o subset latino entra no precache offline; os demais subsets do
    // Inter chegam por unicode-range so se o browser pedir.
    globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}', '**/inter-latin-wght-normal-*.woff2'],
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
        src: '/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  },
} satisfies Parameters<typeof VitePWA>[0];

export default defineConfig({
  plugins: [
    react(),
    VitePWA(pwaOptions),
  ],
});
