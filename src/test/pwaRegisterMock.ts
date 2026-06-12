// Mock do módulo virtual do vite-plugin-pwa para o ambiente de testes:
// o vitest não resolve 'virtual:pwa-register/react' (sem service worker em jsdom).
import { useState } from 'react';

export function useRegisterSW(): {
  needRefresh: [boolean, (value: boolean) => void];
  offlineReady: [boolean, (value: boolean) => void];
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
} {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  return {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker: () => Promise.resolve(),
  };
}
