export function openExternalUrl(url: string): string | undefined {
  const opened = window.open(url, '_blank', 'noopener,noreferrer');

  if (opened === null) {
    return 'Seu navegador bloqueou a nova aba. Toque de novo ou libere pop-ups para abrir.';
  }

  return undefined;
}
