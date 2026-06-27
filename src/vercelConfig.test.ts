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
    expect(headerMap.get('Permissions-Policy')).toBe(
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    );
    expect(headerMap.get('Content-Security-Policy')).toBe(
      "default-src 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://lichess.org https://api.lichess.org https://api.chess.com; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests",
    );
    expect(headerMap.get('Content-Security-Policy')).not.toContain('unsafe-eval');
    // form-action 'self' impede que um <form> seja apontado para um destino externo (B5).
    expect(headerMap.get('Content-Security-Policy')).toContain("form-action 'self'");
    // object-src 'none' bloqueia plugins (Flash/applets) explicitamente, sem depender
    // da heranca de default-src.
    expect(headerMap.get('Content-Security-Policy')).toContain("object-src 'none'");
  });

  it('allow-lists in connect-src every host the app actually fetches', () => {
    const config: VercelConfig = vercelConfig;
    const routeHeaders = config.headers?.find((entry) => entry.source === '/(.*)')?.headers ?? [];
    const headerMap = new Map(routeHeaders.map((header) => [header.key, header.value]));
    const csp = headerMap.get('Content-Security-Policy');
    expect(csp).toBeDefined();
    const connectSrc = (csp ?? '').split(';').find((d) => d.trim().startsWith('connect-src')) ?? '';
    expect(connectSrc).toContain("'self'");
    expect(connectSrc).toContain('https://lichess.org');
    expect(connectSrc).toContain('https://api.chess.com');
    expect(connectSrc).not.toContain('*');
    expect(connectSrc).not.toContain('http:');
  });
});
