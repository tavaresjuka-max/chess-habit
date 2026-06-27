import {
  decryptJson,
  encryptJson,
  type EncryptedBlob,
  type EncryptOptions,
} from './crypto';

export const CANARY_MAGIC = 'rotina-sync-canary-v1';

export async function createCanary(
  passphrase: string,
  options?: EncryptOptions,
): Promise<EncryptedBlob> {
  return encryptJson(CANARY_MAGIC, passphrase, options);
}

export async function verifyCanary(
  canary: EncryptedBlob,
  passphrase: string,
): Promise<boolean> {
  try {
    const value = await decryptJson(canary, passphrase);
    return value === CANARY_MAGIC;
  } catch {
    return false;
  }
}
