import { describe, expect, it } from 'vitest';
import { BANNED_PHRASES } from './sessionMessage';
import { buildMilestoneLine, buildFactualFooter } from './retentionCopy';

// Utilitário: verifica que nenhuma string usa frases banidas.
function assertNoBannedPhrases(lines: (string | undefined)[]): void {
  for (const line of lines) {
    if (line === undefined) continue;
    for (const banned of BANNED_PHRASES) {
      expect(line.toLowerCase()).not.toContain(banned);
    }
  }
}

describe('buildMilestoneLine', () => {
  it('emite linha sóbria quando currentStreakDays === longestStreakDays && >= 3', () => {
    const line = buildMilestoneLine({ currentStreakDays: 5, longestStreakDays: 5 });
    expect(line).not.toBeUndefined();
    expect(line).toBeTruthy();
  });

  it('retorna undefined quando currentStreakDays < longestStreakDays (não é recorde)', () => {
    expect(buildMilestoneLine({ currentStreakDays: 4, longestStreakDays: 7 })).toBeUndefined();
  });

  it('retorna undefined quando currentStreakDays < 3 mesmo que seja igual ao longestStreakDays', () => {
    expect(buildMilestoneLine({ currentStreakDays: 2, longestStreakDays: 2 })).toBeUndefined();
    expect(buildMilestoneLine({ currentStreakDays: 1, longestStreakDays: 1 })).toBeUndefined();
    expect(buildMilestoneLine({ currentStreakDays: 0, longestStreakDays: 0 })).toBeUndefined();
  });

  it('retorna undefined em dia normal (não é recorde)', () => {
    expect(buildMilestoneLine({ currentStreakDays: 3, longestStreakDays: 5 })).toBeUndefined();
  });

  it('passa por BANNED_PHRASES quando emite linha', () => {
    const line = buildMilestoneLine({ currentStreakDays: 3, longestStreakDays: 3 });
    assertNoBannedPhrases([line]);
  });

  it('não usa exclamação nem ícone festivo na linha emitida', () => {
    const line = buildMilestoneLine({ currentStreakDays: 10, longestStreakDays: 10 });
    if (line !== undefined) {
      expect(line).not.toContain('!');
    }
  });

  it('a linha descreve sequência de forma factual (sem elogio)', () => {
    const line = buildMilestoneLine({ currentStreakDays: 3, longestStreakDays: 3 });
    // Deve mencionar "sequência" ou conteúdo similar, de forma factual
    expect(line).toMatch(/sequência|seguidos|recorde/i);
  });
});

describe('buildFactualFooter', () => {
  it('formata corretamente com minutos e sessões da semana', () => {
    const footer = buildFactualFooter({ todayMinutes: 20, weekSessions: 4 });
    expect(footer).toContain('20');
    expect(footer).toContain('4');
  });

  it('passa por BANNED_PHRASES', () => {
    const footer = buildFactualFooter({ todayMinutes: 15, weekSessions: 3 });
    assertNoBannedPhrases([footer]);
  });

  it('não usa exclamação', () => {
    const footer = buildFactualFooter({ todayMinutes: 30, weekSessions: 5 });
    expect(footer).not.toContain('!');
  });

  it('quando todayMinutes é 0, inclui 0 min de forma neutra', () => {
    const footer = buildFactualFooter({ todayMinutes: 0, weekSessions: 0 });
    expect(footer).toContain('0');
  });

  it('inclui "min" e algum indicador de sessões da semana', () => {
    const footer = buildFactualFooter({ todayMinutes: 10, weekSessions: 2 });
    expect(footer).toMatch(/min/i);
    expect(footer).toMatch(/semana|sessão|sessões/i);
  });
});
