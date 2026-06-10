export type AutoBackupPermission = 'granted' | 'denied' | 'prompt';

export type FileSystemWritableLike = {
  write: (content: string) => Promise<void>;
  close: () => Promise<void>;
};

export type FileSystemFileHandleLike = {
  name?: string;
  queryPermission?: (descriptor: { mode: 'readwrite' }) => Promise<AutoBackupPermission>;
  requestPermission?: (descriptor: { mode: 'readwrite' }) => Promise<AutoBackupPermission>;
  createWritable: () => Promise<FileSystemWritableLike>;
};

export type SaveFilePicker = (options?: {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}) => Promise<FileSystemFileHandleLike>;

export function getSaveFilePicker(): SaveFilePicker | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const picker = (window as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;

  return typeof picker === 'function' ? picker : undefined;
}

export function isAutoBackupSupported(): boolean {
  return getSaveFilePicker() !== undefined;
}

export type AutoBackupWriteResult = 'written' | 'needs-permission' | 'error';

// Grava o backup no arquivo escolhido pelo usuario. Sem gesto do usuario o browser
// pode negar requestPermission; nesse caso o resultado honesto e needs-permission.
export async function writeAutoBackup(
  handle: FileSystemFileHandleLike,
  content: string,
  options?: { allowPermissionRequest?: boolean },
): Promise<AutoBackupWriteResult> {
  try {
    let permission: AutoBackupPermission = 'granted';

    if (handle.queryPermission !== undefined) {
      permission = await handle.queryPermission({ mode: 'readwrite' });
    }

    if (permission === 'prompt') {
      if (options?.allowPermissionRequest === true && handle.requestPermission !== undefined) {
        permission = await handle.requestPermission({ mode: 'readwrite' });
      } else {
        return 'needs-permission';
      }
    }

    if (permission !== 'granted') {
      return 'needs-permission';
    }

    const writable = await handle.createWritable();

    await writable.write(content);
    await writable.close();

    return 'written';
  } catch {
    return 'error';
  }
}

export async function pickAutoBackupFile(): Promise<FileSystemFileHandleLike | undefined> {
  const picker = getSaveFilePicker();

  if (picker === undefined) {
    return undefined;
  }

  try {
    return await picker({
      suggestedName: 'lichess-tutor-backup.json',
      types: [
        {
          description: 'Backup do lichess-tutor',
          accept: { 'application/json': ['.json'] },
        },
      ],
    });
  } catch {
    // Usuario cancelou o seletor de arquivo.
    return undefined;
  }
}

export type AutoBackupStatus =
  | 'unsupported'
  | 'disabled'
  | 'enabled'
  | 'needs-permission'
  | 'error';

export function describeAutoBackupStatus(status: AutoBackupStatus, fileName?: string): string {
  switch (status) {
    case 'unsupported':
      return 'Este navegador não suporta gravar backup automático em arquivo. Use a exportação manual com frequência.';
    case 'disabled':
      return 'Backup automático desligado. Ao ativar, o app grava um arquivo de backup toda vez que é aberto.';
    case 'enabled':
      return `Backup automático ativo${fileName === undefined ? '' : ` em "${fileName}"`}: gravado a cada abertura do app.`;
    case 'needs-permission':
      return 'Backup automático configurado, mas o navegador pede nova permissão. Clique em "Reativar backup automático".';
    case 'error':
      return 'O último backup automático falhou. Verifique o arquivo escolhido ou reative o backup automático.';
  }
}
