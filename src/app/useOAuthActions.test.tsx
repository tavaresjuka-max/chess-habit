// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LearnerProfile, LichessOAuthToken } from '../domain';
import { revokeLichessOAuthToken } from '../infra/lichess/oauth';
import { clearLichessOAuthToken, loadLichessOAuthToken } from '../infra/storage/appData';
import { startLichessOAuthConnection } from './oauthFlow';
import { useOAuthActions, type UseOAuthActionsInput } from './useOAuthActions';

vi.mock('../infra/lichess/oauth', () => ({
  revokeLichessOAuthToken: vi.fn(),
}));

vi.mock('../infra/storage/appData', () => ({
  clearLichessOAuthToken: vi.fn(),
  loadLichessOAuthToken: vi.fn(),
}));

vi.mock('./oauthFlow', () => ({
  startLichessOAuthConnection: vi.fn(),
}));

const profile: LearnerProfile = {
  lichessUsername: 'jukasparov',
  band: '800-1000',
  defaultSessionMinutes: 15,
  goals: ['rotina'],
  updatedAt: '2026-06-20T00:00:00.000Z',
};

const storedToken: LichessOAuthToken = {
  accessToken: 'secret-token',
  tokenType: 'Bearer',
  scopes: ['puzzle:read'],
  obtainedAt: '2026-06-19T10:00:00.000Z',
  expiresAt: '2099-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(startLichessOAuthConnection).mockResolvedValue(undefined);
  vi.mocked(loadLichessOAuthToken).mockResolvedValue(storedToken);
  vi.mocked(revokeLichessOAuthToken).mockResolvedValue(undefined);
  vi.mocked(clearLichessOAuthToken).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useOAuthActions', () => {
  describe('connectLichess', () => {
    it('calls startLichessOAuthConnection with the profile username', async () => {
      const input = createInput({ profile });
      const { result } = renderHook(() => useOAuthActions(input));

      await act(async () => {
        await result.current.connectLichess();
      });

      expect(startLichessOAuthConnection).toHaveBeenCalledWith('jukasparov');
    });

    it('calls startLichessOAuthConnection with undefined when profile is not set', async () => {
      const input = createInput({ profile: undefined });
      const { result } = renderHook(() => useOAuthActions(input));

      await act(async () => {
        await result.current.connectLichess();
      });

      expect(startLichessOAuthConnection).toHaveBeenCalledWith(undefined);
    });
  });

  describe('disconnectLichess', () => {
    it('revokes the stored token, clears it, and resets connection state', async () => {
      const input = createInput({ profile });
      const { result } = renderHook(() => useOAuthActions(input));

      await act(async () => {
        await result.current.disconnectLichess();
      });

      expect(loadLichessOAuthToken).toHaveBeenCalled();
      expect(revokeLichessOAuthToken).toHaveBeenCalledWith({ token: 'secret-token' });
      expect(clearLichessOAuthToken).toHaveBeenCalled();
      expect(input.setLichessToken).toHaveBeenCalledWith(undefined);
      expect(input.setLichessConnectionState).toHaveBeenCalledWith('disconnected');
      expect(input.setLichessMessage).toHaveBeenCalledWith('Conexão Lichess removida.');
    });

    it('still clears local token and resets state even when revoke throws', async () => {
      vi.mocked(revokeLichessOAuthToken).mockRejectedValue(new Error('Network error'));

      const input = createInput({ profile });
      const { result } = renderHook(() => useOAuthActions(input));

      await act(async () => {
        await result.current.disconnectLichess();
      });

      // finaly block must run regardless
      expect(clearLichessOAuthToken).toHaveBeenCalled();
      expect(input.setLichessToken).toHaveBeenCalledWith(undefined);
      expect(input.setLichessConnectionState).toHaveBeenCalledWith('disconnected');
      expect(input.setLichessMessage).toHaveBeenCalledWith('Conexão Lichess removida.');
    });

    it('skips revoke when no token is stored but still clears state', async () => {
      vi.mocked(loadLichessOAuthToken).mockResolvedValue(undefined);

      const input = createInput({ profile });
      const { result } = renderHook(() => useOAuthActions(input));

      await act(async () => {
        await result.current.disconnectLichess();
      });

      expect(revokeLichessOAuthToken).not.toHaveBeenCalled();
      expect(clearLichessOAuthToken).toHaveBeenCalled();
      expect(input.setLichessToken).toHaveBeenCalledWith(undefined);
      expect(input.setLichessConnectionState).toHaveBeenCalledWith('disconnected');
    });
  });
});

function createInput(overrides: Partial<UseOAuthActionsInput> = {}): UseOAuthActionsInput {
  return {
    profile: undefined,
    setLichessConnectionState: vi.fn(),
    setLichessMessage: vi.fn(),
    setLichessToken: vi.fn(),
    ...overrides,
  };
}
