// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAll,
  clearAutoBackupConfig,
  exportAllAsJson,
  loadBackupMeta,
  loadLichessOAuthToken,
  saveAutoBackupConfig,
} from '../infra/storage/appData';
import {
  isAutoBackupSupported,
  pickAutoBackupFile,
  writeAutoBackup,
} from '../infra/storage/autoBackup';
import { createSyncClient } from '../infra/sync/syncClient';
import { clearRemoteSyncData, useBackupActions, type UseBackupActionsInput } from './useBackupActions';

vi.mock('../infra/storage/appData', () => ({
  clearAll: vi.fn(),
  clearAutoBackupConfig: vi.fn(),
  exportAllAsJson: vi.fn(),
  loadBackupMeta: vi.fn(),
  loadLichessOAuthToken: vi.fn(),
  saveAutoBackupConfig: vi.fn(),
}));

vi.mock('../infra/storage/autoBackup', () => ({
  isAutoBackupSupported: vi.fn(),
  pickAutoBackupFile: vi.fn(),
  writeAutoBackup: vi.fn(),
}));

vi.mock('../infra/sync/syncClient', () => ({
  createSyncClient: vi.fn(() => ({
    deleteAllBlobs: vi.fn(() => Promise.resolve(0)),
  })),
}));

// operationEpoch is a side-effect module — mock to keep tests isolated
vi.mock('./operationEpoch', () => ({
  bumpOperationEpoch: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isAutoBackupSupported).mockReturnValue(true);
  vi.mocked(exportAllAsJson).mockResolvedValue('{"version":1}');
  vi.mocked(loadBackupMeta).mockResolvedValue({
    id: 'last-export',
    exportedAt: '2026-06-20T00:00:00.000Z',
    checksum: 'abc123',
    recordCount: 5,
  });
  vi.mocked(loadLichessOAuthToken).mockResolvedValue(undefined);
  vi.mocked(saveAutoBackupConfig).mockResolvedValue(undefined);
  vi.mocked(clearAutoBackupConfig).mockResolvedValue(undefined);
  vi.mocked(clearAll).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('clearRemoteSyncData', () => {
  it('apaga blobs remotos quando há backend e token', async () => {
    const deleteAllBlobs = vi.fn(() => Promise.resolve(4));

    await expect(
      clearRemoteSyncData({
        backendUrl: 'https://rotina-sync.chesshabit.workers.dev',
        loadToken: () => Promise.resolve('token-ok'),
        deleteAllBlobs,
      }),
    ).resolves.toBe(4);

    expect(deleteAllBlobs).toHaveBeenCalledWith('https://rotina-sync.chesshabit.workers.dev', 'token-ok');
  });

  it('não tenta apagar servidor sem token', async () => {
    const deleteAllBlobs = vi.fn(() => Promise.resolve(4));

    await expect(
      clearRemoteSyncData({
        backendUrl: 'https://rotina-sync.chesshabit.workers.dev',
        loadToken: () => Promise.resolve(undefined),
        deleteAllBlobs,
      }),
    ).resolves.toBe(0);

    expect(deleteAllBlobs).not.toHaveBeenCalled();
  });
});

describe('useBackupActions', () => {
  describe('enableAutoBackup', () => {
    it('saves config, sets fileName and status to enabled when file is picked and written', async () => {
      const handle = { name: 'backup.json' };
      vi.mocked(pickAutoBackupFile).mockResolvedValue(handle as never);
      vi.mocked(writeAutoBackup).mockResolvedValue('written');

      const input = createInput();
      const { result } = renderHook(() => useBackupActions(input));

      await act(async () => {
        await result.current.enableAutoBackup();
      });

      expect(writeAutoBackup).toHaveBeenCalledWith(handle, '{"version":1}', { allowPermissionRequest: true });
      expect(saveAutoBackupConfig).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true, fileName: 'backup.json', handle }),
      );
      expect(input.setAutoBackupFileName).toHaveBeenCalledWith('backup.json');
      expect(input.setAutoBackupStatus).toHaveBeenCalledWith('enabled');
      expect(input.setBackupMeta).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'last-export', exportedAt: '2026-06-20T00:00:00.000Z' }),
      );
    });

    it('sets status to disabled when user cancels file picker (handle undefined)', async () => {
      vi.mocked(pickAutoBackupFile).mockResolvedValue(undefined);

      const input = createInput();
      const { result } = renderHook(() => useBackupActions(input));

      await act(async () => {
        await result.current.enableAutoBackup();
      });

      expect(saveAutoBackupConfig).not.toHaveBeenCalled();
      expect(input.setAutoBackupStatus).toHaveBeenCalledWith('disabled');
      expect(input.setAutoBackupFileName).not.toHaveBeenCalled();
    });

    it('sets status to error when write fails', async () => {
      const handle = { name: 'backup.json' };
      vi.mocked(pickAutoBackupFile).mockResolvedValue(handle as never);
      vi.mocked(writeAutoBackup).mockResolvedValue('needs-permission');

      const input = createInput();
      const { result } = renderHook(() => useBackupActions(input));

      await act(async () => {
        await result.current.enableAutoBackup();
      });

      expect(saveAutoBackupConfig).not.toHaveBeenCalled();
      expect(input.setAutoBackupStatus).toHaveBeenCalledWith('error');
    });
  });

  describe('disableAutoBackup', () => {
    it('clears config and resets fileName and status', async () => {
      const input = createInput();
      const { result } = renderHook(() => useBackupActions(input));

      await act(async () => {
        await result.current.disableAutoBackup();
      });

      expect(clearAutoBackupConfig).toHaveBeenCalled();
      expect(input.setAutoBackupFileName).toHaveBeenCalledWith(undefined);
      expect(input.setAutoBackupStatus).toHaveBeenCalledWith('disabled');
    });
  });

  describe('clearAllData', () => {
    it('preserva aviso quando apagamento remoto falha', async () => {
      vi.mocked(loadLichessOAuthToken).mockResolvedValue({
        accessToken: 'token-ok',
        tokenType: 'Bearer',
        scopes: ['puzzle:read'],
        obtainedAt: '2026-06-20T00:00:00.000Z',
        expiresAt: '2026-06-21T00:00:00.000Z',
      });
      vi.mocked(createSyncClient).mockReturnValueOnce({
        deleteAllBlobs: vi.fn(() => Promise.reject(new Error('remote down'))),
      } as never);
      const input = createInput();
      const { result } = renderHook(() => useBackupActions(input));

      await act(async () => {
        await result.current.clearAllData();
      });

      expect(clearAll).toHaveBeenCalled();
      expect(input.setLichessMessage).toHaveBeenCalledWith(
        'Não foi possível apagar os dados do servidor agora; os dados locais foram apagados.',
      );
    });

    it('calls clearAll and resets all state setters to initial values', async () => {
      const input = createInput();
      const { result } = renderHook(() => useBackupActions(input));

      await act(async () => {
        await result.current.clearAllData();
      });

      expect(clearAll).toHaveBeenCalled();
      expect(input.setProfile).toHaveBeenCalledWith(undefined);
      expect(input.setTodayPlan).toHaveBeenCalledWith(undefined);
      expect(input.setSessionMinutes).toHaveBeenCalledWith(15);
      expect(input.setTrainingLogs).toHaveBeenCalledWith([]);
      expect(input.setAllTrainingLogs).toHaveBeenCalledWith([]);
      expect(input.setPendingItems).toHaveBeenCalledWith([]);
      expect(input.setDiplomaAttempts).toHaveBeenCalledWith([]);
      expect(input.setAchievements).toHaveBeenCalledWith([]);
      expect(input.setWeaknesses).toHaveBeenCalledWith([]);
      expect(input.setSignals).toHaveBeenCalledWith([]);
      expect(input.setLichessToken).toHaveBeenCalledWith(undefined);
      expect(input.setLichessStudyLink).toHaveBeenCalledWith(undefined);
      expect(input.setLichessConnectionState).toHaveBeenCalledWith('disconnected');
      expect(input.setLichessMessage).toHaveBeenCalledWith(undefined);
      expect(input.setDiagnosisState).toHaveBeenCalledWith('idle');
      expect(input.setDiagnosisMessage).toHaveBeenCalledWith(undefined);
      expect(input.setActiveView).toHaveBeenCalledWith('config');
      expect(input.setErrorMessage).toHaveBeenCalledWith(undefined);
      expect(input.setOnboardingCompletedAt).toHaveBeenCalledWith(undefined);
      expect(input.setBackupMeta).toHaveBeenCalledWith(undefined);
      expect(input.setAutoBackupFileName).toHaveBeenCalledWith(undefined);
      expect(input.setAutoBackupStatus).toHaveBeenCalledWith('disabled');
    });
  });
});

function createInput(overrides: Partial<UseBackupActionsInput> = {}): UseBackupActionsInput {
  return {
    setActiveView: vi.fn(),
    setAchievements: vi.fn(),
    setAllTrainingLogs: vi.fn(),
    setAutoBackupFileName: vi.fn(),
    setAutoBackupStatus: vi.fn(),
    setBackupMeta: vi.fn(),
    setDiagnosisMessage: vi.fn(),
    setDiagnosisState: vi.fn(),
    setDiplomaAttempts: vi.fn(),
    setErrorMessage: vi.fn(),
    setLichessConnectionState: vi.fn(),
    setLichessMessage: vi.fn(),
    setLichessStudyLink: vi.fn(),
    setLichessToken: vi.fn(),
    setOnboardingCompletedAt: vi.fn(),
    setPendingItems: vi.fn(),
    setProfile: vi.fn(),
    setSessionMinutes: vi.fn(),
    setSignals: vi.fn(),
    setTodayPlan: vi.fn(),
    setTrainingLogs: vi.fn(),
    setWeaknesses: vi.fn(),
    ...overrides,
  };
}
