import { describe, expect, it } from 'vitest';
import { extractSignalsFromChesscomGames, extractSignalsFromChesscomStats, getPlayerSideChesscom } from './extractSignals';
import type { ChesscomGame } from './types';

const observedAt = '2026-06-06T00:00:00.000Z';

describe('getPlayerSideChesscom', () => {
  it('finds the player side case-insensitively', () => {
    const game: ChesscomGame = {
      white: { username: 'JukaTavares' },
      black: { username: 'opponent' },
    };

    expect(getPlayerSideChesscom(game, 'jukatavares')).toBe('white');
  });

  it('returns null when the player is not in the game', () => {
    const game: ChesscomGame = {
      white: { username: 'other' },
      black: { username: 'opponent' },
    };

    expect(getPlayerSideChesscom(game, 'jukatavares')).toBeNull();
  });
});

describe('extractSignalsFromChesscomStats', () => {
  it('extracts rating signals without profile PII', () => {
    const signals = extractSignalsFromChesscomStats(
      {
        chess_rapid: { last: { rating: 1010, date: 1 } },
      },
      observedAt,
    );

    expect(signals).toEqual([
      {
        source: 'chesscom',
        confidence: 'medium',
        observedAt,
        value: { kind: 'rating', perf: 'rapid', rating: 1010 },
      },
    ]);
  });
});

describe('extractSignalsFromChesscomGames', () => {
  it('extracts only derived signals and discards full PGN text', () => {
    const pgn = [
      '[Event "Live Chess"]',
      '[ECO "C20"]',
      '[Opening "King Pawn Game"]',
      '',
      '1. e4 e5 2. Qh5 Nc6 0-1',
    ].join('\n');

    const games: ChesscomGame[] = Array.from({ length: 6 }, (_, index) => ({
      white: { username: 'jukatavares', result: index < 4 ? 'resigned' : 'win' },
      black: { username: 'opponent', result: index < 4 ? 'win' : 'resigned' },
      accuracies: { white: index < 4 ? 62 : 82 },
      eco: 'https://www.chess.com/openings/King-Pawn-Game',
      pgn,
      rules: 'chess',
      time_class: 'rapid',
      end_time: 1_765_000_000 + index,
    }));

    const signals = extractSignalsFromChesscomGames('jukatavares', games, observedAt);
    const serializedSignals = JSON.stringify(signals);

    const openingSignal = signals.find((signal) => signal.value.kind === 'opening');
    const judgmentSignal = signals.find((signal) => signal.value.kind === 'judgment');

    expect(openingSignal?.value).toEqual({
      kind: 'opening',
      eco: 'C20',
      name: 'King Pawn Game',
      games: 6,
      lossRate: 0.667,
    });
    expect(judgmentSignal?.value).toEqual({
      kind: 'judgment',
      blunders: 4,
      mistakes: 0,
      inaccuracies: 0,
      games: 6,
    });
    expect(serializedSignals).not.toContain('1. e4');
    expect(serializedSignals).not.toContain('[Event');
  });
});
