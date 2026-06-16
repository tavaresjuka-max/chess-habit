import { describe, expect, it } from 'vitest';
import {
  allowedLichessOAuthScopes,
  createLichessOAuthRequest,
  exchangeLichessOAuthCode,
  parseLichessOAuthCallback,
  revokeLichessOAuthToken,
  stripOAuthQuery,
} from './oauth';

describe('lichess oauth', () => {
  it('builds a PKCE authorization URL with only allowed scopes', async () => {
    const request = await createLichessOAuthRequest({
      clientId: 'lichess-tutor-local',
      redirectUri: 'http://127.0.0.1:5174/',
      username: 'jukasparov',
    });
    const url = new URL(request.authorizationUrl);

    expect(url.origin).toBe('https://lichess.org');
    expect(url.pathname).toBe('/oauth');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('scope')).toBe(allowedLichessOAuthScopes.join(' '));
    expect(url.searchParams.get('username')).toBe('jukasparov');
    expect(request.codeVerifier).not.toBe(request.state);
  });

  it('parses and strips an OAuth callback', () => {
    expect(parseLichessOAuthCallback('http://127.0.0.1:5174/?code=abc&state=xyz')).toEqual({
      kind: 'success',
      code: 'abc',
      state: 'xyz',
    });
    expect(stripOAuthQuery('http://127.0.0.1:5174/?code=abc&state=xyz&view=config')).toBe('/?view=config');
  });

  it('reports a cancelled OAuth callback as a recoverable error instead of throwing', () => {
    expect(parseLichessOAuthCallback('http://127.0.0.1:5174/?error=access_denied&state=xyz')).toEqual({
      kind: 'error',
      error: 'access_denied',
    });
  });

  it('reports no callback when there is no oauth query', () => {
    expect(parseLichessOAuthCallback('http://127.0.0.1:5174/?view=config')).toEqual({ kind: 'none' });
  });

  it('exchanges an authorization code for a local token record', async () => {
    const requested: Array<{ url: string; body: string }> = [];
    const fetcher = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      requested.push({
        url: requestUrl(input),
        body: requestBodyText(init?.body),
      });

      return Promise.resolve(
        Response.json({
          token_type: 'Bearer',
          access_token: 'lio_secret',
          expires_in: 31_536_000,
        }),
      );
    };

    const token = await exchangeLichessOAuthCode({
      code: 'oauth-code',
      codeVerifier: 'verifier',
      redirectUri: 'http://127.0.0.1:5174/',
      clientId: 'lichess-tutor-local',
      scopes: ['puzzle:read', 'study:write'],
      nowIso: '2026-06-06T10:00:00.000Z',
      fetcher,
    });

    expect(requested[0]?.url).toBe('https://lichess.org/api/token');
    expect(requested[0]?.body).toContain('grant_type=authorization_code');
    expect(requested[0]?.body).toContain('code_verifier=verifier');
    expect(token).toEqual({
      accessToken: 'lio_secret',
      tokenType: 'Bearer',
      scopes: ['puzzle:read', 'study:write'],
      obtainedAt: '2026-06-06T10:00:00.000Z',
      expiresAt: '2027-06-06T10:00:00.000Z',
    });
  });

  it('throws when the OAuth token exchange response has an unexpected shape', async () => {
    const fetcher = (): Promise<Response> =>
      Promise.resolve(Response.json({ unexpected: true }));

    await expect(
      exchangeLichessOAuthCode({
        code: 'abc',
        codeVerifier: 'verifier',
        redirectUri: 'http://127.0.0.1:5174/',
        clientId: 'lichess-tutor-local',
        scopes: ['puzzle:read'],
        nowIso: '2026-06-06T10:00:00.000Z',
        fetcher,
      }),
    ).rejects.toThrow('inesperada');
  });

  it('throws when the OAuth token exchange response has the wrong token_type', async () => {
    const fetcher = (): Promise<Response> =>
      Promise.resolve(
        Response.json({ token_type: 'Basic', access_token: 'tok', expires_in: 31536000 }),
      );

    await expect(
      exchangeLichessOAuthCode({
        code: 'abc',
        codeVerifier: 'verifier',
        redirectUri: 'http://127.0.0.1:5174/',
        clientId: 'lichess-tutor-local',
        scopes: ['puzzle:read'],
        nowIso: '2026-06-06T10:00:00.000Z',
        fetcher,
      }),
    ).rejects.toThrow('inesperada');
  });

  it('throws when token revocation fails with a non-401 status', async () => {
    const fetcher = (): Promise<Response> =>
      Promise.resolve(new Response('Server Error', { status: 500 }));

    await expect(revokeLichessOAuthToken({ token: 'tok', fetcher })).rejects.toThrow('500');
  });

  it('does not throw when token revocation responds with 401 (already expired)', async () => {
    const fetcher = (): Promise<Response> =>
      Promise.resolve(new Response(null, { status: 401 }));

    await expect(revokeLichessOAuthToken({ token: 'tok', fetcher })).resolves.toBeUndefined();
  });
});

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function requestBodyText(body: BodyInit | null | undefined): string {
  if (body instanceof URLSearchParams) {
    return body.toString();
  }

  if (typeof body === 'string') {
    return body;
  }

  return '';
}
