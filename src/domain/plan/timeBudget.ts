import type { SessionMinutes } from '../types';

export type PlanBlockKind = 'aquecimento' | 'tema' | 'revisao' | 'transferencia' | 'final';

export type TimeBudgetBlock = {
  kind: PlanBlockKind;
  minutes: number;
};

export function getTimeBudget(sessionMinutes: SessionMinutes): TimeBudgetBlock[] {
  switch (sessionMinutes) {
    case 5:
      return [{ kind: 'tema', minutes: 5 }];
    case 15:
      return [
        { kind: 'tema', minutes: 10 },
        { kind: 'revisao', minutes: 5 },
      ];
    case 30:
      return [
        { kind: 'aquecimento', minutes: 5 },
        { kind: 'tema', minutes: 15 },
        { kind: 'transferencia', minutes: 10 },
      ];
    case 60:
      return [
        { kind: 'aquecimento', minutes: 10 },
        { kind: 'tema', minutes: 20 },
        { kind: 'transferencia', minutes: 20 },
        { kind: 'final', minutes: 10 },
      ];
  }
}
