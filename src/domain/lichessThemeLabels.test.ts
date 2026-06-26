import { describe, expect, it } from 'vitest';
import { lichessThemeLabel } from './lichessThemeLabels';

/**
 * Testes de cobertura de rótulos PT-BR (SPEC T7).
 *
 * Critério de aceite: nenhum slug cru (camelCase) renderizado na UI.
 * Estes testes verificam que os slugs mais frequentes têm rótulo PT-BR definido,
 * e que slugs desconhecidos recebem fallback seguro (o próprio slug).
 */
describe('lichessThemeLabel', () => {
  it('retorna rótulo PT-BR para temas táticos comuns', () => {
    expect(lichessThemeLabel('fork')).toBe('Garfo');
    expect(lichessThemeLabel('pin')).toBe('Cravada');
    expect(lichessThemeLabel('skewer')).toBe('Espeto');
    expect(lichessThemeLabel('hangingPiece')).toBe('Peça solta');
    expect(lichessThemeLabel('trappedPiece')).toBe('Peça presa');
    expect(lichessThemeLabel('discoveredAttack')).toBe('Ataque descoberto');
    expect(lichessThemeLabel('defensiveMove')).toBe('Lance defensivo');
    expect(lichessThemeLabel('deflection')).toBe('Desvio');
    expect(lichessThemeLabel('quietMove')).toBe('Lance silencioso');
    expect(lichessThemeLabel('xRayAttack')).toBe('Ataque raio-X');
    expect(lichessThemeLabel('sacrifice')).toBe('Sacrifício');
  });

  it('retorna rótulo PT-BR para mates', () => {
    expect(lichessThemeLabel('mate')).toBe('Xeque-mate');
    expect(lichessThemeLabel('mateIn1')).toBe('Mate em 1');
    expect(lichessThemeLabel('mateIn2')).toBe('Mate em 2');
    expect(lichessThemeLabel('mateIn3')).toBe('Mate em 3');
    expect(lichessThemeLabel('backRankMate')).toBe('Mate na última fileira');
    expect(lichessThemeLabel('smotheredMate')).toBe('Mate sufocado');
  });

  it('retorna rótulo PT-BR para fases da partida', () => {
    expect(lichessThemeLabel('opening')).toBe('Abertura');
    expect(lichessThemeLabel('middlegame')).toBe('Meio-jogo');
    expect(lichessThemeLabel('endgame')).toBe('Final');
    expect(lichessThemeLabel('pawnEndgame')).toBe('Final de peões');
    expect(lichessThemeLabel('rookEndgame')).toBe('Final de torres');
  });

  it('retorna rótulo PT-BR para movimentos especiais e metas', () => {
    expect(lichessThemeLabel('castling')).toBe('Roque');
    expect(lichessThemeLabel('promotion')).toBe('Promoção');
    expect(lichessThemeLabel('enPassant')).toBe('En passant');
    expect(lichessThemeLabel('advantage')).toBe('Vantagem');
    expect(lichessThemeLabel('crushing')).toBe('Esmagamento');
    expect(lichessThemeLabel('mix')).toBe('Mistura');
  });

  it('retorna rótulo PT-BR para comprimento do puzzle', () => {
    expect(lichessThemeLabel('short')).toBe('Puzzle curto');
    expect(lichessThemeLabel('long')).toBe('Puzzle longo');
    expect(lichessThemeLabel('oneMove')).toBe('Um lance');
  });

  it('retorna o próprio slug como fallback para slug desconhecido', () => {
    // Fallback seguro: nunca quebra a UI para slug novo do Lichess
    expect(lichessThemeLabel('unknownFutureTheme')).toBe('unknownFutureTheme');
    expect(lichessThemeLabel('someNewTactic')).toBe('someNewTactic');
  });

  it('nenhum slug camelCase dos temas principais fica sem rótulo', () => {
    // Slugs usados em catalogSkills.ts e resourceCatalog.ts que aparecem no skillMap
    const knownSlugs = [
      'fork', 'pin', 'skewer', 'hangingPiece', 'trappedPiece',
      'discoveredAttack', 'discoveredCheck', 'doubleCheck', 'defensiveMove',
      'deflection', 'mate', 'mateIn1', 'mateIn2', 'mateIn3', 'backRankMate',
      'opening', 'endgame', 'pawnEndgame', 'rookEndgame', 'advantage',
      'crushing', 'promotion', 'short', 'long', 'mix', 'castling',
    ];

    for (const slug of knownSlugs) {
      const label = lichessThemeLabel(slug);
      // Rótulo não é o slug cru (indica que tem mapeamento PT-BR)
      expect(label, `slug "${slug}" deveria ter rótulo PT-BR, recebeu o próprio slug`).not.toBe(slug);
    }
  });
});
