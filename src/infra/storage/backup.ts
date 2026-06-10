export const backupFormatName = 'lichess-tutor-backup' as const;
export const backupFormatVersion = 1 as const;

export type BackupData = {
  profile: unknown[];
  plans: unknown[];
  logs: unknown[];
  signals: unknown[];
  weaknesses: unknown[];
  methodTracks: unknown[];
  pendingItems: unknown[];
  diplomaAttempts: unknown[];
};

export const backupTableNames = [
  'profile',
  'plans',
  'logs',
  'signals',
  'weaknesses',
  'methodTracks',
  'pendingItems',
  'diplomaAttempts',
] as const satisfies readonly (keyof BackupData)[];

export type BackupFile = {
  format: typeof backupFormatName;
  version: typeof backupFormatVersion;
  exportedAt: string;
  checksum: string;
  data: BackupData;
};

type SubtleCryptoLike = {
  digest: (algorithm: string, data: Uint8Array) => Promise<ArrayBuffer>;
};

function getSubtleCrypto(): SubtleCryptoLike | undefined {
  if (typeof globalThis.crypto === 'undefined') {
    return undefined;
  }

  // subtle so existe em contexto seguro (https/localhost); fora dele cai no fallback.
  const subtle: SubtleCryptoLike | undefined = globalThis.crypto.subtle;

  return subtle;
}

// Fallback nao-criptografico (FNV-1a) para contexto inseguro: detecta corrupcao
// acidental, nao adulteracao. O prefixo do algoritmo fica gravado no checksum.
function fnv1a(text: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash.toString(16).padStart(8, '0');
}

export async function computeBackupChecksum(serializedData: string): Promise<string> {
  const subtle = getSubtleCrypto();

  if (subtle === undefined) {
    return `fnv1a:${fnv1a(serializedData)}`;
  }

  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(serializedData));
  const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

  return `sha256:${hex}`;
}

export async function createBackupFile(data: BackupData, exportedAt: string): Promise<BackupFile> {
  return {
    format: backupFormatName,
    version: backupFormatVersion,
    exportedAt,
    checksum: await computeBackupChecksum(JSON.stringify(data)),
    data,
  };
}

export function countBackupRecords(data: BackupData): number {
  return backupTableNames.reduce((total, table) => total + data[table].length, 0);
}
