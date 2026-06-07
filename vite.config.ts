import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export const pwaOptions = {
  injectRegister: 'auto',
  registerType: 'autoUpdate',
  workbox: {
    navigateFallback: 'index.html',
    globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
  },
  manifest: {
    name: 'Rotina de Treino Lichess',
    short_name: 'Rotina',
    description: 'Ferramenta pessoal local-first para organizar treino de xadrez no Lichess.',
    start_url: '/',
    scope: '/',
    lang: 'pt-BR',
    display: 'standalone',
    background_color: '#f4f6f1',
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
