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
    expect(pwaOptions.workbox.globPatterns).toContain('**/*.{js,css,html,ico,png,svg,webmanifest}');
    expect(pwaOptions.manifest.display).toBe('standalone');
    expect(pwaOptions.manifest.start_url).toBe('/');
    expect(pwaOptions.manifest.icons.map((icon) => icon.sizes)).toEqual(['192x192', '512x512']);
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
