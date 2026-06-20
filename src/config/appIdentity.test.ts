import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  APP_DESCRIPTION,
  APP_LEGAL_DISCLAIMER,
  APP_MANIFEST_NAME,
  APP_NAME,
  FEEDBACK_URL,
  PRIVACY_SUMMARY,
} from './appIdentity';

describe('app identity', () => {
  it('keeps the public app name behind one constant', () => {
    expect(APP_NAME).toBe('Chess Habit');
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

describe('privacidade e feedback', () => {
  it('resumo de privacidade cobre os pontos essenciais', () => {
    const text = PRIVACY_SUMMARY.join(' ');

    expect(text).toMatch(/local/i);
    expect(text).toMatch(/token/i);
    expect(text).toMatch(/Lichess|Chess\.com/);
    expect(PRIVACY_SUMMARY.length).toBeGreaterThanOrEqual(3);
  });

  it('FEEDBACK_URL e opcional (undefined ate o dono definir)', () => {
    expect(FEEDBACK_URL === undefined || typeof FEEDBACK_URL === 'string').toBe(true);
  });
});

describe('acentuação dos textos visíveis', () => {
  const userFacing: readonly string[] = [APP_DESCRIPTION, APP_LEGAL_DISCLAIMER, ...PRIVACY_SUMMARY];

  // Formas sem acento que já apareceram em produção (rodapé + resumo de privacidade).
  const forbidden = [
    /\bnao\b/i,
    /\bso\b/i,
    /\bha\b/i,
    /\bhistorico\b/i,
    /\bpublicos?\b/i,
    /\bdiagnostico\b/i,
    /\bvoce\b/i,
    /\bconfiguracao\b/i,
    /\bproprio\b/i,
  ];

  it('não deixa palavras sem acento nos textos da UI', () => {
    for (const text of userFacing) {
      for (const pattern of forbidden) {
        expect(text, `"${text}" contém forma sem acento ${String(pattern)}`).not.toMatch(pattern);
      }
    }
  });

  it('o disclaimer usa "é" e "não"', () => {
    expect(APP_LEGAL_DISCLAIMER).toMatch(/é um app/);
    expect(APP_LEGAL_DISCLAIMER).toMatch(/não oficial/);
    expect(APP_LEGAL_DISCLAIMER).toMatch(/não afiliado/);
  });
});
