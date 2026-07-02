import { describe, expect, it } from 'vitest';
import { evaluateFalsificationGate, type FalsificationGateInput } from './falsificationGate';

const FLOOR = { percent: 80, floorPercent: 40 };

describe('evaluateFalsificationGate', () => {
  it('devolve "aguardando" quando daysElapsed é undefined (relógio não começou)', () => {
    const result = evaluateFalsificationGate({});
    expect(result.verdict).toBe('aguardando');
    expect(result.reasons[0]).toMatch(/não começou/);
  });

  it('devolve "aguardando" quando daysElapsed < 30', () => {
    const result = evaluateFalsificationGate({ daysElapsed: 15 });
    expect(result.verdict).toBe('aguardando');
    expect(result.reasons[0]).toMatch(/Faltam 15/);
  });

  it('devolve "aguardando" no limite (daysElapsed = 29)', () => {
    const result = evaluateFalsificationGate({ daysElapsed: 29 });
    expect(result.verdict).toBe('aguardando');
  });

  it('devolve "nao-avaliavel" quando adesão fica abaixo do piso', () => {
    const input: FalsificationGateInput = {
      daysElapsed: 30,
      adherence: { percent: 20, floorPercent: 40 },
    };
    const result = evaluateFalsificationGate(input);
    expect(result.verdict).toBe('nao-avaliavel');
    expect(result.reasons[0]).toMatch(/Adesão de 20%/);
  });

  it('devolve "sem-dados" quando adesão está ok (ou ausente) mas faltam sonda e blunder', () => {
    const result = evaluateFalsificationGate({ daysElapsed: 30, adherence: FLOOR });
    expect(result.verdict).toBe('sem-dados');
    expect(result.reasons[0]).toMatch(/sonda de transferência/);
    expect(result.reasons[0]).toMatch(/blunder/);
  });

  it('devolve "sem-dados" quando só falta a sonda', () => {
    const result = evaluateFalsificationGate({
      daysElapsed: 30,
      adherence: FLOOR,
      blunder: { ratePost: 1, rateBaseline: 3, baselineGameCount: 20 },
    });
    expect(result.verdict).toBe('sem-dados');
    expect(result.reasons[0]).toMatch(/sonda de transferência/);
  });

  it('devolve "sem-dados" quando só falta o blunder', () => {
    const result = evaluateFalsificationGate({
      daysElapsed: 30,
      adherence: FLOOR,
      probe: { accuracyPercent: 80, itemCount: 10 },
    });
    expect(result.verdict).toBe('sem-dados');
    expect(result.reasons[0]).toMatch(/taxa de blunder/);
  });

  it('devolve "sem-dados" quando a sonda tem menos de 10 itens (amostra curta, mesmo com nota alta)', () => {
    const result = evaluateFalsificationGate({
      daysElapsed: 30,
      adherence: FLOOR,
      probe: { accuracyPercent: 100, itemCount: 5 },
      blunder: { ratePost: 1, rateBaseline: 3, baselineGameCount: 20 },
    });
    expect(result.verdict).toBe('sem-dados');
    expect(result.reasons.join(' ')).toMatch(/5 item/);
  });

  it('devolve "sem-dados" quando o baseline tem menos de 20 partidas (amostra curta, mesmo com queda grande)', () => {
    const result = evaluateFalsificationGate({
      daysElapsed: 30,
      adherence: FLOOR,
      probe: { accuracyPercent: 90, itemCount: 10 },
      blunder: { ratePost: 0, rateBaseline: 5, baselineGameCount: 10 },
    });
    expect(result.verdict).toBe('sem-dados');
    expect(result.reasons.join(' ')).toMatch(/10 partida/);
  });

  it('devolve "sem-dados" quando AMBAS as amostras são curtas', () => {
    const result = evaluateFalsificationGate({
      daysElapsed: 30,
      adherence: FLOOR,
      probe: { accuracyPercent: 100, itemCount: 3 },
      blunder: { ratePost: 0, rateBaseline: 5, baselineGameCount: 5 },
    });
    expect(result.verdict).toBe('sem-dados');
    expect(result.reasons).toHaveLength(2);
    expect(result.reasons.join(' ')).toMatch(/3 item/);
    expect(result.reasons.join(' ')).toMatch(/5 partida/);
  });

  it('devolve "passou" quando AMBOS os critérios do gate duplo são satisfeitos', () => {
    const result = evaluateFalsificationGate({
      daysElapsed: 30,
      adherence: FLOOR,
      probe: { accuracyPercent: 70, itemCount: 10 },
      blunder: { ratePost: 1.4, rateBaseline: 3, baselineGameCount: 20 },
    });
    expect(result.verdict).toBe('passou');
    expect(result.reasons.some((r) => r.includes('70%'))).toBe(true);
  });

  it('devolve "falsificado" quando a sonda falha mas o blunder passa', () => {
    const result = evaluateFalsificationGate({
      daysElapsed: 30,
      adherence: FLOOR,
      probe: { accuracyPercent: 69, itemCount: 10 },
      blunder: { ratePost: 1, rateBaseline: 3, baselineGameCount: 20 },
    });
    expect(result.verdict).toBe('falsificado');
    expect(result.reasons.some((r) => r.includes('falhou'))).toBe(true);
  });

  it('devolve "falsificado" quando o blunder falha mas a sonda passa', () => {
    const result = evaluateFalsificationGate({
      daysElapsed: 30,
      adherence: FLOOR,
      probe: { accuracyPercent: 80, itemCount: 10 },
      blunder: { ratePost: 1.5, rateBaseline: 3, baselineGameCount: 20 },
    });
    expect(result.verdict).toBe('falsificado');
    expect(result.reasons.some((r) => r.includes('não caiu o suficiente'))).toBe(true);
  });

  it('devolve "falsificado" quando AMBOS os critérios falham', () => {
    const result = evaluateFalsificationGate({
      daysElapsed: 45,
      adherence: FLOOR,
      probe: { accuracyPercent: 50, itemCount: 10 },
      blunder: { ratePost: 2.9, rateBaseline: 3, baselineGameCount: 20 },
    });
    expect(result.verdict).toBe('falsificado');
  });

  it('trata blunder.ratePost exatamente na metade do baseline como falha (< estrito)', () => {
    const result = evaluateFalsificationGate({
      daysElapsed: 30,
      adherence: FLOOR,
      probe: { accuracyPercent: 80, itemCount: 10 },
      blunder: { ratePost: 1.5, rateBaseline: 3, baselineGameCount: 20 },
    });
    expect(result.verdict).toBe('falsificado');
  });

  it('sem adherence informado, segue direto para checar sonda/blunder (adesão é opcional no input)', () => {
    const result = evaluateFalsificationGate({
      daysElapsed: 30,
      probe: { accuracyPercent: 80, itemCount: 10 },
      blunder: { ratePost: 1, rateBaseline: 3, baselineGameCount: 20 },
    });
    expect(result.verdict).toBe('passou');
  });
});
