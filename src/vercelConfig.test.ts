import { describe, expect, it } from 'vitest';
import vercelConfig from '../vercel.json';

type VercelConfig = {
  headers?: Array<{
    source?: string;
    headers?: Array<{
      key?: string;
      value?: string;
    }>;
  }>;
};

describe('vercel security headers', () => {
  it('sets defensive headers for every route without unsafe eval', () => {
    const config: VercelConfig = vercelConfig;
    const routeHeaders = config.headers?.find((entry) => entry.source === '/(.*)')?.headers ?? [];
    const headerMap = new Map(routeHeaders.map((header) => [header.key, header.value]));

    expect(headerMap.get('X-Robots-Tag')).toBe('noindex, nofollow');
    expect(headerMap.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headerMap.get('X-Frame-Options')).toBe('DENY');
    expect(headerMap.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headerMap.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()');
    expect(headerMap.get('Content-Security-Policy')).toBe(
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://lichess.org https://api.chess.com; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'",
    );
    expect(headerMap.get('Content-Security-Policy')).not.toContain('unsafe-eval');
  });
});
