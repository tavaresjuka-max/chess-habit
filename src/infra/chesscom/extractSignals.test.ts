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
    const accuracySignal = signals.find((signal) => signal.value.kind === 'accuracy');

    expect(openingSignal?.value).toEqual({
      kind: 'opening',
      eco: 'C20',
      name: 'King Pawn Game',
      games: 6,
      lossRate: 0.667,
    });
    expect(accuracySignal?.value).toEqual({
      kind: 'accuracy',
      lowAccuracyGames: 4,
      games: 6,
    });
    expect(serializedSignals).not.toContain('1. e4');
    expect(serializedSignals).not.toContain('[Event');
  });

  it('calibrates low-accuracy threshold by learner band', () => {
    const games: ChesscomGame[] = [
      {
        white: { username: 'jukatavares', result: 'resigned' },
        black: { username: 'opponent', result: 'win' },
        accuracies: { white: 67 },
        rules: 'chess',
      },
    ];

    const beginnerAccuracy = extractSignalsFromChesscomGames('jukatavares', games, observedAt, '400-800').find(
      (signal) => signal.value.kind === 'accuracy',
    );
    const higherAccuracy = extractSignalsFromChesscomGames('jukatavares', games, observedAt, '1000-1200').find(
      (signal) => signal.value.kind === 'accuracy',
    );

    expect(beginnerAccuracy?.value).toEqual({ kind: 'accuracy', lowAccuracyGames: 0, games: 1 });
    expect(higherAccuracy?.value).toEqual({ kind: 'accuracy', lowAccuracyGames: 1, games: 1 });
  });
});
