import { describe, expect, it } from 'vitest';
import { APP_DESCRIPTION, APP_MANIFEST_NAME, APP_NAME } from './config/appIdentity';
import viteConfig, { CONTENT_SECURITY_POLICY, pwaOptions } from '../vite.config';

describe('PWA config', () => {
  it('keeps an offline app-shell configuration in the Vite PWA plugin', () => {
    const pwaPlugin = findPluginByName(viteConfig.plugins, 'vite-plugin-pwa');

    // jsdom does not provide a reliable ServiceWorkerContainer/caches stack for
    // an offline reload smoke. This locks the build config that creates the
    // service worker and can be paired with a browser smoke after `npm run build`.
    expect(pwaPlugin).toBeDefined();
    expect(pwaOptions.workbox.navigateFallback).toBe('index.html');
    // As artes .webp (Tavarez, molduras, texturas) fazem parte do app-shell offline.
    expect(viteConfig.build?.sourcemap).toBe(false);
    expect(pwaOptions.workbox.sourcemap).toBe(false);
    expect(pwaOptions.workbox.globPatterns).toContain('**/*.{js,css,html,ico,png,svg,webp,webmanifest}');
    expect(pwaOptions.manifest.name).toBe(APP_MANIFEST_NAME);
    expect(pwaOptions.manifest.short_name).toBe(APP_NAME);
    expect(pwaOptions.manifest.description).toBe(APP_DESCRIPTION);
    expect(pwaOptions.manifest.display).toBe('standalone');
    expect(pwaOptions.manifest.start_url).toBe('/');
    expect(pwaOptions.manifest.icons.map((icon) => icon.sizes)).toEqual(['192x192', '512x512', '512x512']);
    expect(pwaOptions.manifest.icons.at(-1)?.purpose).toBe('maskable');
  });

  it('injects the build-only CSP meta used by preview smoke tests', () => {
    const cspPlugin = findPluginByName(viteConfig.plugins, 'rotina-build-csp-meta') as
      | { transformIndexHtml?: () => unknown }
      | undefined;

    expect(cspPlugin).toBeDefined();
    expect(cspPlugin?.transformIndexHtml?.()).toEqual([
      {
        tag: 'meta',
        attrs: {
          'http-equiv': 'Content-Security-Policy',
          content: CONTENT_SECURITY_POLICY,
        },
        injectTo: 'head',
      },
    ]);
  });

  it('locks connect-src to the hosts the app fetches (lichess.org + api.chess.com)', () => {
    const connectSrc = CONTENT_SECURITY_POLICY.split(';').find((d) => d.trim().startsWith('connect-src')) ?? '';
    expect(connectSrc).toContain("'self'");
    expect(connectSrc).toContain('https://lichess.org');
    expect(connectSrc).toContain('https://api.chess.com');
    expect(connectSrc).not.toContain('*');
    expect(connectSrc).not.toContain('http:');
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
