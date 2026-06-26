import { describe, expect, it } from 'vitest';
import { learnerBands } from '../bands';
import { buildCurriculumOutlook, CURRICULUM, getCurriculumPhaseForBand, ORGANIZER_CEILING_MESSAGE } from './curriculum';
import { BANNED_PHRASES } from '../coach/sessionMessage';

describe('CURRICULUM', () => {
  it('cobre todas as bandas do spine exatamente uma vez', () => {
    for (const band of learnerBands) {
      const phasesWithBand = CURRICULUM.filter((phase) => phase.bands.includes(band));

      expect(phasesWithBand).toHaveLength(1);
    }
  });

  it('numera as semanas de cada fase em sequência a partir de 1', () => {
    for (const phase of CURRICULUM) {
      phase.weeks.forEach((week, index) => {
        expect(week.number).toBe(index + 1);
      });
    }
  });

  it('fases com diploma detalham semanas; a fase sem semanas tem nota', () => {
    for (const phase of CURRICULUM) {
      if (phase.weeks.length === 0) {
        expect(phase.note).toBeDefined();
      } else {
        expect(phase.diplomaId).toBeDefined();
      }
    }
  });
});

describe('getCurriculumPhaseForBand', () => {
  it('mapeia bandas iniciantes para Fundamentos', () => {
    expect(getCurriculumPhaseForBand('0-400').id).toBe('fundamentos');
    expect(getCurriculumPhaseForBand('400-800').id).toBe('fundamentos');
  });

  it('mapeia bandas intermediárias e altas para as fases seguintes', () => {
    expect(getCurriculumPhaseForBand('800-1000').id).toBe('tatica-nomeada');
    expect(getCurriculumPhaseForBand('1000-1200').id).toBe('calculo-e-plano');
    expect(getCurriculumPhaseForBand('1200-1600').id).toBe('autonomia');
    expect(getCurriculumPhaseForBand('2000-2200').id).toBe('autonomia');
  });
});

describe('buildCurriculumOutlook', () => {
  it('marca fases anteriores como past, a da banda como current e as demais como future', () => {
    const outlook = buildCurriculumOutlook('800-1000', undefined);

    expect(outlook.map((entry) => entry.status)).toEqual(['past', 'current', 'future', 'future']);
  });

  it('destaca a semana cujo tema coincide com o foco semanal do plano', () => {
    const outlook = buildCurriculumOutlook('800-1000', 'discovered');
    const current = outlook.find((entry) => entry.status === 'current');

    expect(current?.currentWeekNumber).toBe(4);
  });

  it('não destaca semana quando o foco pertence a outra fase', () => {
    const outlook = buildCurriculumOutlook('0-400', 'conversion');
    const current = outlook.find((entry) => entry.status === 'current');

    expect(current?.currentWeekNumber).toBeUndefined();
  });

  it('não destaca semana em fases que não são a atual', () => {
    const outlook = buildCurriculumOutlook('1000-1200', 'fork');

    for (const entry of outlook) {
      if (entry.status !== 'current') {
        expect(entry.currentWeekNumber).toBeUndefined();
      }
    }
  });

  it('sem banda definida, começa a jornada em Fundamentos', () => {
    const outlook = buildCurriculumOutlook(undefined, undefined);

    expect(outlook[0]?.status).toBe('current');
  });
});

describe('ORGANIZER_CEILING_MESSAGE (teto explícito FM)', () => {
  it('passa pela banlist do Professor Tavarez (BANNED_PHRASES)', () => {
    for (const banned of BANNED_PHRASES) {
      expect(ORGANIZER_CEILING_MESSAGE.toLowerCase()).not.toContain(banned);
    }
  });

  it('é honesta: sem promessa de rating, sem exclamação, enquadra como organizador', () => {
    expect(ORGANIZER_CEILING_MESSAGE).not.toContain('!');
    expect(ORGANIZER_CEILING_MESSAGE.toLowerCase()).toContain('organizador');
    expect(ORGANIZER_CEILING_MESSAGE).not.toMatch(/rating|elo/i);
  });
});
