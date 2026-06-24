import { describe, expect, it } from 'vitest';
import { pickRouteByHistory, type RouteCandidate, type RouteOutcome } from './routeHistory';

const candidates: RouteCandidate[] = [{ id: 'study:fork' }, { id: 'puzzle:fork' }];

function outcomes(routeId: string, weaknessTag: string, moved: boolean[]): RouteOutcome[] {
  return moved.map((movedScore) => ({ routeId, weaknessTag, movedScore }));
}

describe('pickRouteByHistory (Pilar C — roteamento aprendido, council 2026-06-24)', () => {
  it('sem candidatos → undefined', () => {
    expect(pickRouteByHistory([], [], 'fork')).toBeUndefined();
  });

  it('cold-start (sem histórico) → ordem atual (primeiro candidato)', () => {
    expect(pickRouteByHistory(candidates, [], 'fork')).toEqual({ id: 'study:fork' });
  });

  it('histórico insuficiente (< amostra mínima) → mantém a ordem atual', () => {
    // 2 desfechos positivos na 2ª rota, mas abaixo do mínimo (3) → não sobrepõe.
    const history = outcomes('puzzle:fork', 'fork', [true, true]);
    expect(pickRouteByHistory(candidates, history, 'fork')).toEqual({ id: 'study:fork' });
  });

  it('rota não-primeira com histórico robusto e positivo → sobrepõe a ordem atual', () => {
    const history = outcomes('puzzle:fork', 'fork', [true, true, true]);
    expect(pickRouteByHistory(candidates, history, 'fork')).toEqual({ id: 'puzzle:fork' });
  });

  it('histórico robusto porém majoritariamente negativo → não sobrepõe (mantém ordem atual)', () => {
    const history = outcomes('puzzle:fork', 'fork', [true, false, false]); // 1/3, não é maioria
    expect(pickRouteByHistory(candidates, history, 'fork')).toEqual({ id: 'study:fork' });
  });

  it('histórico de OUTRO conceito é ignorado (escopo por conceito) → ordem atual', () => {
    const history = outcomes('puzzle:fork', 'pin', [true, true, true]); // robusto, mas para 'pin'
    expect(pickRouteByHistory(candidates, history, 'fork')).toEqual({ id: 'study:fork' });
  });

  it('entre duas rotas robustas, prefere a de melhor taxa de sucesso', () => {
    const history = [
      ...outcomes('study:fork', 'fork', [true, true, false]), // 2/3 ≈ 0,67
      ...outcomes('puzzle:fork', 'fork', [true, true, true]), // 3/3 = 1,0
    ];
    expect(pickRouteByHistory(candidates, history, 'fork')).toEqual({ id: 'puzzle:fork' });
  });
});
