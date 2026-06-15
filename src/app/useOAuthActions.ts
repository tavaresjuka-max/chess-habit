import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { LearnerProfile, LichessOAuthToken } from '../domain';
import { revokeLichessOAuthToken } from '../infra/lichess/oauth';
import {
  clearLichessOAuthToken,
  loadLichessOAuthToken,
} from '../infra/storage/appData';
import { startLichessOAuthConnection } from './oauthFlow';
import type { LichessConnectionState } from './state';

export type UseOAuthActionsInput = {
  profile: LearnerProfile | undefined;
  setLichessConnectionState: Dispatch<SetStateAction<LichessConnectionState>>;
  setLichessMessage: Dispatch<SetStateAction<string | undefined>>;
  setLichessToken: Dispatch<SetStateAction<LichessOAuthToken | undefined>>;
};

export function useOAuthActions(input: UseOAuthActionsInput) {
  const { profile, setLichessConnectionState, setLichessMessage, setLichessToken } = input;

  const connectLichess = useCallback(async () => {
    await startLichessOAuthConnection(profile?.lichessUsername);
  }, [profile]);

  const disconnectLichess = useCallback(async () => {
    const token = await loadLichessOAuthToken();

    try {
      if (token !== undefined) {
        await revokeLichessOAuthToken({ token: token.accessToken });
      }
    } catch {
      // Revogar depende da rede; mesmo se falhar, o token local precisa sumir.
    } finally {
      await clearLichessOAuthToken();
      setLichessToken(undefined);
      setLichessConnectionState('disconnected');
      setLichessMessage('Conexão Lichess removida.');
    }
  }, []);

  return {
    connectLichess,
    disconnectLichess,
  };
}
