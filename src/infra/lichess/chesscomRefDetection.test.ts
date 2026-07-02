import { describe, expect, it } from 'vitest';
import { detectChesscomRef } from './chesscomRefDetection';

describe('detectChesscomRef', () => {
  it('rejeita string vazia ou só espaços', () => {
    expect(detectChesscomRef('')).toBeNull();
    expect(detectChesscomRef('   ')).toBeNull();
  });

  it('devolve null quando o input é um id Lichess de 8 chars (prioridade do parseGameRef)', () => {
    expect(detectChesscomRef('abcd1234')).toBeNull();
    expect(detectChesscomRef('AbCd12EF')).toBeNull();
  });

  it('devolve null quando o input é uma URL de partida do Lichess', () => {
    expect(detectChesscomRef('https://lichess.org/abcd1234')).toBeNull();
    expect(detectChesscomRef('lichess.org/abcd1234')).toBeNull();
  });

  it('reconhece URL de chess.com completa como chesscom-game-url', () => {
    expect(detectChesscomRef('https://www.chess.com/game/live/123456789')).toEqual({ kind: 'chesscom-game-url' });
    expect(detectChesscomRef('https://chess.com/game/live/123456789')).toEqual({ kind: 'chesscom-game-url' });
  });

  it('reconhece URL de chess.com sem protocolo', () => {
    expect(detectChesscomRef('chess.com/game/live/123456789')).toEqual({ kind: 'chesscom-game-url' });
    expect(detectChesscomRef('www.chess.com/game/live/123456789')).toEqual({ kind: 'chesscom-game-url' });
  });

  it('rejeita domínio que não é chess.com', () => {
    expect(detectChesscomRef('https://notchess.com/game/live/123')).toBeNull();
    expect(detectChesscomRef('https://evil-chess.com/game/live/123')).toBeNull();
  });

  it('reconhece username simples de chess.com (3-25 chars, alfanumérico/hífen/underscore)', () => {
    expect(detectChesscomRef('jukatavares')).toEqual({ kind: 'chesscom-username', username: 'jukatavares' });
    expect(detectChesscomRef('juka_tavares')).toEqual({ kind: 'chesscom-username', username: 'juka_tavares' });
    expect(detectChesscomRef('juka-tavares')).toEqual({ kind: 'chesscom-username', username: 'juka-tavares' });
  });

  it('rejeita username com menos de 3 ou mais de 25 chars', () => {
    expect(detectChesscomRef('ab')).toBeNull();
    expect(detectChesscomRef('a'.repeat(26))).toBeNull();
  });

  it('rejeita username com caracteres inválidos (espaço, símbolo)', () => {
    expect(detectChesscomRef('user name')).toBeNull();
    expect(detectChesscomRef('user@name')).toBeNull();
  });

  it('faz trim de espaços ao redor do input', () => {
    expect(detectChesscomRef('  jukatavares  ')).toEqual({ kind: 'chesscom-username', username: 'jukatavares' });
  });

  it('trata um username de 8 chars alfanuméricos como referência Lichess, não chess.com (ambiguidade documentada)', () => {
    // "abcd1234" bate tanto no padrão de id Lichess quanto no de username
    // chess.com — a prioridade do parseGameRef resolve a favor do Lichess.
    expect(detectChesscomRef('abcd1234')).toBeNull();
  });

  it('rejeita texto arbitrário não reconhecido', () => {
    expect(detectChesscomRef('não é um link nem um username')).toBeNull();
  });
});
