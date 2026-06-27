import { describe, expect, it } from 'vitest';
import { puzzleThemeLabelByTheme } from './puzzleThemeLabels';

describe('puzzleThemeLabelByTheme', () => {
  it('mantém a copy byte-idêntica para todos os temas cobertos', () => {
    expect(puzzleThemeLabelByTheme).toEqual({
      backRankMate: 'mate na última fileira',
      discoveredAttack: 'ataque descoberto',
      discoveredCheck: 'xeque descoberto',
      fork: 'garfos',
      hangingPiece: 'peças penduradas',
      mate: 'mates',
      mateIn1: 'mate em 1',
      mateIn2: 'mate em 2',
      pin: 'cravadas',
      skewer: 'espetos',
      advantage: 'vantagem',
      crushing: 'conversão de vantagem',
      defensiveMove: 'defesa precisa',
      capturingDefender: 'capturar defensor',
      deflection: 'desvio',
      pawnEndgame: 'finais de peões',
      advancedPawn: 'peão avançado',
      promotion: 'promoção',
      underPromotion: 'subpromoção',
      rookEndgame: 'finais de torre',
    });
  });
});
