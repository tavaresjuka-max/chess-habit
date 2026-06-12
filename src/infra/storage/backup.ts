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
  // Opcional para ler backups exportados antes do Corte 7 (conquistas).
  achievements?: unknown[];
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
  digest: (algorithm: string, data: BufferSource) => Promise<ArrayBuffer>;
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

export type BackupChecksumAlgorithm = 'sha256' | 'fnv1a';

export async function computeBackupChecksum(
  serializedData: string,
  algorithm?: BackupChecksumAlgorithm,
): Promise<string> {
  const subtle = getSubtleCrypto();
  const chosen = algorithm ?? (subtle === undefined ? 'fnv1a' : 'sha256');

  if (chosen === 'fnv1a' || subtle === undefined) {
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
  const required = backupTableNames.reduce((total, table) => total + data[table].length, 0);

  return required + (data.achievements?.length ?? 0);
}

export type ParsedBackup = { ok: true; file: BackupFile } | { ok: false; error: string };

export async function parseBackupFile(json: string): Promise<ParsedBackup> {
  let raw: unknown;

  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: 'O arquivo não é um JSON válido.' };
  }

  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'O arquivo não tem a estrutura de um backup.' };
  }

  const candidate = raw as Record<string, unknown>;

  if (candidate.format !== backupFormatName) {
    return { ok: false, error: 'O arquivo não é um backup do lichess-tutor.' };
  }

  if (candidate.version !== backupFormatVersion) {
    return {
      ok: false,
      error: `Versão de backup não suportada: ${String(candidate.version)}. Esta versão do app lê backups v${String(backupFormatVersion)}.`,
    };
  }

  if (typeof candidate.exportedAt !== 'string' || typeof candidate.checksum !== 'string') {
    return { ok: false, error: 'O backup não tem data de exportação ou checksum.' };
  }

  const data: unknown = candidate.data;

  if (typeof data !== 'object' || data === null) {
    return { ok: false, error: 'O backup não contém dados.' };
  }

  const dataRecord = data as Record<string, unknown>;

  for (const table of backupTableNames) {
    if (!Array.isArray(dataRecord[table])) {
      return { ok: false, error: `O backup está incompleto: tabela "${table}" ausente ou inválida.` };
    }
  }

  const algorithm: BackupChecksumAlgorithm = candidate.checksum.startsWith('fnv1a:') ? 'fnv1a' : 'sha256';
  const recomputed = await computeBackupChecksum(JSON.stringify(data), algorithm);

  if (recomputed !== candidate.checksum) {
    return { ok: false, error: 'Checksum não confere: o arquivo pode estar corrompido ou alterado.' };
  }

  return {
    ok: true,
    file: {
      format: backupFormatName,
      version: backupFormatVersion,
      exportedAt: candidate.exportedAt,
      checksum: candidate.checksum,
      data: data as BackupData,
    },
  };
}
