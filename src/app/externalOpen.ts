import { isAllowedLichessUrl } from '../infra/lichess/urlPolicy';

const invalidExternalUrlMessage = 'Link inválido — só abrimos páginas do lichess.org.';

export function openExternalUrl(url: string): string | undefined {
  if (!isAllowedExternalUrl(url)) {
    return invalidExternalUrlMessage;
  }

  const opened = window.open(url, '_blank');

  if (opened === null) {
    return 'Seu navegador bloqueou a nova aba. Toque de novo ou libere pop-ups para abrir.';
  }

  try {
    opened.opener = null;
  } catch {
    // Some browser handles are read-only; the user-triggered navigation still succeeds.
  }

  return undefined;
}

export function isAllowedExternalUrl(url: string): boolean {
  return isAllowedLichessUrl(url);
}
