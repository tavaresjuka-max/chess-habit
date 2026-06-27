import {
  decryptJson,
  encryptJson,
  parseEncryptedBlob,
  serializeEncryptedBlob,
  type EncryptedBlob,
} from './crypto';
import { verifyCanary } from './passphraseCanary';
import type { PushBlobInput, StoredBlob, SyncClient } from './syncClient';

export interface PushEncryptedInput {
  readonly passphrase: string;
  readonly canary: EncryptedBlob;
  readonly client: SyncClient;
  readonly collection: string;
  readonly clientMutationId: string;
  readonly value: unknown;
  readonly updatedAt: number;
  readonly iterations?: number;
}

export interface PullDecryptedInput {
  readonly passphrase: string;
  readonly canary: EncryptedBlob;
  readonly client: SyncClient;
  readonly collection?: string;
}

export type SyncPassphraseResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'wrong-passphrase' };

export interface PulledItem {
  readonly collection: string;
  readonly clientMutationId: string;
  readonly updatedAt: number;
  readonly value: unknown;
}

export type PullResult =
  | { readonly ok: true; readonly items: readonly PulledItem[] }
  | { readonly ok: false; readonly reason: 'wrong-passphrase' };

async function ensurePassphraseMatchesCanary(
  canary: EncryptedBlob,
  passphrase: string,
): Promise<boolean> {
  return verifyCanary(canary, passphrase);
}

export async function pushEncrypted(input: PushEncryptedInput): Promise<SyncPassphraseResult> {
  if (!(await ensurePassphraseMatchesCanary(input.canary, input.passphrase))) {
    return { ok: false, reason: 'wrong-passphrase' };
  }
  const envelope = await encryptJson(input.value, input.passphrase, {
    iterations: input.iterations,
  });
  const ciphertext = serializeEncryptedBlob(envelope);
  const pushInput: PushBlobInput = {
    collection: input.collection,
    clientMutationId: input.clientMutationId,
    ciphertext,
    updatedAt: input.updatedAt,
  };
  await input.client.pushBlob(pushInput);
  return { ok: true };
}

export async function pullAndDecrypt(input: PullDecryptedInput): Promise<PullResult> {
  if (!(await ensurePassphraseMatchesCanary(input.canary, input.passphrase))) {
    return { ok: false, reason: 'wrong-passphrase' };
  }
  const stored: StoredBlob[] =
    input.collection === undefined
      ? await input.client.snapshot()
      : await input.client.listBlobs(input.collection);

  const items: PulledItem[] = [];
  for (const entry of stored) {
    try {
      const envelope = parseEncryptedBlob(entry.ciphertext);
      const value = await decryptJson(envelope, input.passphrase);
      items.push({
        collection: entry.collection,
        clientMutationId: entry.clientMutationId,
        updatedAt: entry.updatedAt,
        value,
      });
    } catch {
      return { ok: false, reason: 'wrong-passphrase' };
    }
  }
  return { ok: true, items };
}
