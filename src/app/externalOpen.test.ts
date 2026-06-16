// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openExternalUrl } from './externalOpen';

describe('openExternalUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,<h1>x</h1>',
    'https://evil.com/x',
  ])('rejects unsafe external URL %s', (url) => {
    const open = vi.spyOn(window, 'open').mockReturnValue({} as Window);

    expect(openExternalUrl(url)).toBe('Link inválido — só abrimos páginas do lichess.org.');
    expect(open).not.toHaveBeenCalled();
  });

  it('accepts HTTPS pages on lichess.org', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue({} as Window);

    expect(openExternalUrl('https://lichess.org/training')).toBeUndefined();
    expect(open).toHaveBeenCalledWith('https://lichess.org/training', '_blank');
  });
});
