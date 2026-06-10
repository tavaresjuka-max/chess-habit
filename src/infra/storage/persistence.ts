export type StoragePersistenceStatus = 'persisted' | 'not-persisted' | 'unsupported';

type StorageManagerLike = {
  persisted?: () => Promise<boolean>;
  persist?: () => Promise<boolean>;
};

function getStorageManager(): StorageManagerLike | undefined {
  if (typeof navigator === 'undefined') {
    return undefined;
  }

  // lib.dom assume navigator.storage sempre presente; browsers antigos não têm.
  const storage: StorageManagerLike | undefined = navigator.storage;

  return storage;
}

export async function requestPersistentStorage(): Promise<StoragePersistenceStatus> {
  const storage = getStorageManager();

  if (storage?.persist === undefined || storage.persisted === undefined) {
    return 'unsupported';
  }

  try {
    if (await storage.persisted()) {
      return 'persisted';
    }

    return (await storage.persist()) ? 'persisted' : 'not-persisted';
  } catch {
    return 'unsupported';
  }
}

export function describePersistenceStatus(status: StoragePersistenceStatus): string {
  switch (status) {
    case 'persisted':
      return 'Armazenamento persistente ativo: o navegador não deve apagar seus dados automaticamente.';
    case 'not-persisted':
      return 'O navegador NÃO garantiu persistência: em falta de espaço, seus dados locais podem ser apagados. Exporte backups com frequência.';
    case 'unsupported':
      return 'Este navegador não informa persistência de armazenamento. Exporte backups com frequência.';
  }
}
