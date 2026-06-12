import { describe, expect, it } from 'vitest';
import viteConfig, { pwaOptions } from '../vite.config';

describe('PWA config', () => {
  it('keeps an offline app-shell configuration in the Vite PWA plugin', () => {
    const pwaPlugin = findPluginByName(viteConfig.plugins, 'vite-plugin-pwa');

    // jsdom does not provide a reliable ServiceWorkerContainer/caches stack for
    // an offline reload smoke. This locks the build config that creates the
    // service worker and can be paired with a browser smoke after `npm run build`.
    expect(pwaPlugin).toBeDefined();
    expect(pwaOptions.workbox.navigateFallback).toBe('index.html');
    // As artes .webp (Lemos, molduras, texturas) fazem parte do app-shell offline.
    expect(pwaOptions.workbox.globPatterns).toContain('**/*.{js,css,html,ico,png,svg,webp,webmanifest}');
    expect(pwaOptions.manifest.display).toBe('standalone');
    expect(pwaOptions.manifest.start_url).toBe('/');
    expect(pwaOptions.manifest.icons.map((icon) => icon.sizes)).toEqual(['192x192', '512x512', '512x512']);
    expect(pwaOptions.manifest.icons.at(-1)?.purpose).toBe('maskable');
  });
});

function findPluginByName(value: unknown, name: string): unknown {
  if (Array.isArray(value)) {
    for (const item of value) {
      const plugin = findPluginByName(item, name);

      if (plugin !== undefined) {
        return plugin;
      }
    }

    return undefined;
  }

  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const candidate = value as { name?: unknown };

  if (candidate.name === name) {
    return value;
  }

  return undefined;
}
