import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { APP_MANIFEST_NAME, APP_NAME } from './appIdentity';

describe('app identity', () => {
  it('keeps the public app name behind one constant', () => {
    expect(APP_NAME).toBe('Rotina');
    expect(APP_MANIFEST_NAME).toBe(APP_NAME);
  });

  it('blocks the rejected public name in public entry points', () => {
    const publicFiles = ['README.md', 'index.html', 'vite.config.ts', 'src/ui/App.tsx', 'src/infra/lichess/study.ts'];

    for (const file of publicFiles) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');

      expect(content, file).not.toMatch(/\bLichess Tutor\b/);
    }
  });
});
