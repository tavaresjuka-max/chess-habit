import type { BackupMeta } from '../app/backupStatus';
import type { LichessConnectionState } from '../app/state';
import type { LichessOAuthToken } from '../domain';

// Dispara o download de um JSON pelo navegador (blob -> link temporário -> revoke).
// Compartilhado pelos exports de backup e de log de erros no fold de Dados locais.
export function downloadJsonFile(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function formatBackupMeta(meta: BackupMeta | undefined): string {
  if (meta === undefined) {
    return 'Nenhum backup exportado ainda.';
  }

  const date = new Date(meta.exportedAt);
  const formatted = Number.isNaN(date.getTime())
    ? meta.exportedAt
    : date.toLocaleString('pt-BR');

  return `Último backup: ${formatted} (${String(meta.recordCount)} registros).`;
}

export function formatLichessConnection(
  token: LichessOAuthToken | undefined,
  state: LichessConnectionState,
): string {
  if (state === 'syncing') {
    return 'Sincronizando com o Lichess.';
  }

  if (state === 'error') {
    return 'Conexão Lichess precisa de atenção.';
  }

  // O benefício de conectar já está no hint da seção — aqui só o estado.
  if (token === undefined) {
    return 'Desconectado.';
  }

  return `Conectado com escopos: ${token.scopes.join(', ')}.`;
}
