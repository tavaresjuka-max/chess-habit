// Install prompt próprio do PWA: intercepta o beforeinstallprompt do Chrome
// para o app controlar QUANDO sugerir a instalação real (WebAPK) — em vez do
// banner do navegador (ou do "atalho", que gera o ícone com fundo branco).
// Regras: nunca sugerir se já instalou (appinstalled/standalone) e respeitar
// a dispensa por 14 dias.

import { useEffect, useRef, useState } from 'react';

// O evento não existe em lib.dom (é específico de Chromium).
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const INSTALL_DONE_KEY = 'rotina:install-done';
const DISMISSED_AT_KEY = 'rotina:install-dismissed-at';
const DISMISS_SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

function shouldOffer(): boolean {
  let isDone = false;
  let isDismissedRecently = false;

  try {
    if (localStorage.getItem(INSTALL_DONE_KEY) === '1') {
      isDone = true;
    }
    const dismissedAt = localStorage.getItem(DISMISSED_AT_KEY);
    if (dismissedAt !== null) {
      const elapsed = Date.now() - new Date(dismissedAt).getTime();
      if (Number.isFinite(elapsed) && elapsed < DISMISS_SNOOZE_MS) {
        isDismissedRecently = true;
      }
    }
  } catch {
    // localStorage pode falhar (modo privado); na dúvida, seguimos oferecendo.
  }

  // Já rodando instalado (tela cheia): nunca sugerir. jsdom não tem matchMedia.
  const isStandalone =
    typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;

  return !isDone && !isDismissedRecently && !isStandalone;
}

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      // Sem o preventDefault o Chrome mostra o mini-banner dele por cima do nosso.
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      setCanInstall(shouldOffer());
    };

    const handleAppInstalled = () => {
      try {
        localStorage.setItem(INSTALL_DONE_KEY, '1');
      } catch {
        // Sem localStorage o pior caso é reoferecer numa visita futura.
      }
      deferredPromptRef.current = null;
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    const promptEvent = deferredPromptRef.current;
    if (promptEvent === null) {
      return;
    }

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;

    if (choice.outcome === 'accepted') {
      try {
        localStorage.setItem(INSTALL_DONE_KEY, '1');
      } catch {
        // Idem: falha silenciosa, sem quebrar o fluxo de instalação.
      }
    }

    // O Chrome só permite usar o evento uma vez.
    deferredPromptRef.current = null;
    setCanInstall(false);
  };

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_AT_KEY, new Date().toISOString());
    } catch {
      // Sem persistência a dispensa vale só para esta sessão.
    }
    setCanInstall(false);
  };

  return { canInstall, promptInstall, dismiss };
}
