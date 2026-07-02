import type { TrainingLog } from '../types';

// Adesão como desfecho zero (docs/specs/falsification-protocol-DECISION.md,
// seção "Adesão — desfecho zero"): o método só pode causar retenção se antes
// causar retorno. Pré-condição de qualquer gate de retenção: adesão medida
// como % de dias com >= 1 bloco concluído na janela do gate. Abaixo do piso
// pré-registrado, o gate retorna 'not-evaluable' — nunca "passou" nem
// "falsificou".
//
// IMPORTANTE: a janela de adesão aqui é POR NÓ e configurável via
// `windowDays` (o protocolo usa 30d por nó). Ela é INDEPENDENTE da janela de
// dose mínima do pré-registro E3 (90d, ver e3-preregistration-FROZEN.md) —
// são gates distintos, não intercambiáveis.

const MS_PER_DAY = 86_400_000;

export type AdherenceVerdict = 'evaluable' | 'not-evaluable';

export type AdherenceResult = {
  adherencePercent: number;
  daysActive: number;
  windowDays: number;
  verdict: AdherenceVerdict;
};

export type ComputeAdherenceOptions = {
  /** Tamanho da janela de adesão, em dias (o protocolo usa 30 por nó). */
  windowDays: number;
  /** Instante de referência (fim da janela). */
  now: Date | number;
  /** Piso percentual pré-registrado abaixo do qual o gate é not-evaluable. */
  floorPercent: number;
};

function toUtcDayIndexFromDateString(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`Invalid date: ${date}`);
  }
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

function toUtcDayIndexFromNow(now: Date | number): number {
  const millis = now instanceof Date ? now.getTime() : now;
  return Math.floor(millis / MS_PER_DAY);
}

/**
 * Calcula a adesão (% de dias ativos) numa janela [now - windowDays, now].
 * Dia ativo = >= 1 TrainingLog com status 'done' cuja data cai na janela.
 * Múltiplos logs concluídos no mesmo dia contam como 1 dia ativo.
 */
export function computeAdherence(logs: TrainingLog[], opts: ComputeAdherenceOptions): AdherenceResult {
  const { windowDays, now, floorPercent } = opts;
  const nowDayIndex = toUtcDayIndexFromNow(now);
  const windowStartDayIndex = nowDayIndex - windowDays;

  const activeDayIndexes = new Set(
    logs
      .filter((log) => log.status === 'done')
      .map((log) => toUtcDayIndexFromDateString(log.date))
      .filter((dayIndex) => dayIndex >= windowStartDayIndex && dayIndex <= nowDayIndex),
  );

  const daysActive = activeDayIndexes.size;
  const adherencePercent = windowDays > 0 ? Math.round((daysActive / windowDays) * 100) : 0;
  const verdict: AdherenceVerdict = adherencePercent >= floorPercent ? 'evaluable' : 'not-evaluable';

  return {
    adherencePercent,
    daysActive,
    windowDays,
    verdict,
  };
}
