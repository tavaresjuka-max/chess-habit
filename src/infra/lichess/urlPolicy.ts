export function isAllowedLichessUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    return parsed.protocol === 'https:' && parsed.hostname === 'lichess.org';
  } catch {
    return false;
  }
}
