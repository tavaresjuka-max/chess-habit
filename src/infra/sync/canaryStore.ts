import { SYNC_CANARY_STORAGE_KEY } from '../../config/syncConfig';
import { parseEncryptedBlob, serializeEncryptedBlob, type EncryptedBlob } from './crypto';

export interface CanaryStore {
  load(): EncryptedBlob | undefined;
  save(blob: EncryptedBlob): boolean;
  clear(): boolean;
}

function getLocalStorage(): Storage | undefined {
  try {
    const ls = (globalThis as { localStorage?: Storage }).localStorage;
    return ls ?? undefined;
  } catch {
    return undefined;
  }
}

export const defaultCanaryStore: CanaryStore = {
  load(): EncryptedBlob | undefined {
    const ls = getLocalStorage();
    if (ls === undefined) return undefined;
    let raw: string | null;
    try {
      raw = ls.getItem(SYNC_CANARY_STORAGE_KEY);
    } catch {
      return undefined;
    }
    if (raw === null) return undefined;
    try {
      return parseEncryptedBlob(raw);
    } catch {
      return undefined;
    }
  },

  save(blob: EncryptedBlob): boolean {
    const ls = getLocalStorage();
    if (ls === undefined) return false;
    try {
      ls.setItem(SYNC_CANARY_STORAGE_KEY, serializeEncryptedBlob(blob));
      return true;
    } catch {
      return false;
    }
  },

  clear(): boolean {
    const ls = getLocalStorage();
    if (ls === undefined) return false;
    try {
      ls.removeItem(SYNC_CANARY_STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  },
};
