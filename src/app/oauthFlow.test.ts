// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exchangeLichessOAuthCode } from '../infra/lichess/oauth';
import { saveLichessOAuthToken } from '../infra/storage/appData';
import type { LichessOAuthToken } from '../domain';
import { completeLichessOAuthIfNeeded } from './oauthFlow';

vi.mock('../infra/lichess/oauth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../infra/lichess/oauth')>();

  return {
    ...actual,
    exchangeLichessOAuthCode: vi.fn(),
  };
});

vi.mock('../infra/storage/appData', () => ({
  saveLichessOAuthToken: vi.fn(),
}));

const token: LichessOAuthToken = {
  accessToken: 'lio_token',
  tokenType: 'Bearer',
  scopes: ['puzzle:read', 'study:write'],
  obtainedAt: '2026-06-15T12:00:00.000Z',
  expiresAt: '2027-06-15T12:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  sessionStorage.clear();
  window.history.pushState(null, '', '/?code=abc&state=state-1');
  vi.mocked(exchangeLichessOAuthCode).mockResolvedValue(token);
  vi.mocked(saveLichessOAuthToken).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  sessionStorage.clear();
  window.history.pushState(null, '', '/');
});

describe('completeLichessOAuthIfNeeded', () => {
  it('exchanges a valid callback once, saves the token and clears the query', async () => {
    sessionStorage.setItem(
      'lichess-tutor:oauth-pending',
      JSON.stringify({
        state: 'state-1',
        codeVerifier: 'verifier',
        redirectUri: 'http://localhost/',
        scopes: ['puzzle:read', 'study:write'],
      }),
    );

    const result = await completeLichessOAuthIfNeeded();

    expect(exchangeLichessOAuthCode).toHaveBeenCalledWith({
      code: 'abc',
      codeVerifier: 'verifier',
      redirectUri: 'http://localhost/',
      clientId: 'lichess-tutor-local',
      scopes: ['puzzle:read', 'study:write'],
      nowIso: '2026-06-15T12:00:00.000Z',
    });
    expect(saveLichessOAuthToken).toHaveBeenCalledWith(token);
    expect(result).toEqual({ kind: 'connected', token });
    expect(sessionStorage.getItem('lichess-tutor:oauth-pending')).toBeNull();
    expect(window.location.search).toBe('');
  });

  it('treats corrupted pending OAuth storage as a recoverable cancellation', async () => {
    sessionStorage.setItem('lichess-tutor:oauth-pending', '{broken json');

    const result = await completeLichessOAuthIfNeeded();

    expect(result).toEqual({
      kind: 'cancelled',
      message: 'O retorno do Lichess não confere com a solicitação local. Tente conectar de novo.',
    });
    expect(exchangeLichessOAuthCode).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('lichess-tutor:oauth-pending')).toBeNull();
    expect(window.location.search).toBe('');
  });
});
