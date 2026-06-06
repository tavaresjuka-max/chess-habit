import type { Signal } from '../../domain';
import type { ChesscomColor, ChesscomGame, ChesscomStatsResponse } from './types';

type OpeningAggregate = {
  eco: string;
  name: string;
  games: number;
  losses: number;
};

type TimeAggregate = {
  speed: string;
  games: number;
  losses: number;
  timeoutLosses: number;
};

type ColorAggregate = {
  color: ChesscomColor;
  games: number;
  losses: number;
};

type AccuracyAggregate = {
  games: number;
  lowAccuracyGames: number;
};

export function getPlayerSideChesscom(game: ChesscomGame, username: string): ChesscomColor | null {
  const normalizedUsername = normalizeUsername(username);
  const whiteUsername = normalizeUsername(game.white?.username);
  const blackUsername = normalizeUsername(game.black?.username);

  if (whiteUsername === normalizedUsername) {
    return 'white';
  }

  if (blackUsername === normalizedUsername) {
    return 'black';
  }

  return null;
}

export function extractSignalsFromChesscomStats(stats: ChesscomStatsResponse, observedAt: string): Signal[] {
  const entries = [
    ['rapid', stats.chess_rapid?.last?.rating],
    ['blitz', stats.chess_blitz?.last?.rating],
    ['bullet', stats.chess_bullet?.last?.rating],
  ] as const;

  return entries.flatMap(([perf, rating]) => {
    if (rating === undefined) {
      return [];
    }

    return [
      {
        source: 'chesscom',
        confidence: 'medium',
        observedAt,
        value: {
          kind: 'rating',
          perf,
          rating,
        },
      } satisfies Signal,
    ];
  });
}

export function extractSignalsFromChesscomGames(
  username: string,
  games: ChesscomGame[],
  observedAt: string,
): Signal[] {
  const openings = new Map<string, OpeningAggregate>();
  const timeControls = new Map<string, TimeAggregate>();
  const colors = new Map<ChesscomColor, ColorAggregate>();
  const accuracies: AccuracyAggregate = { games: 0, lowAccuracyGames: 0 };

  for (const game of games) {
    if (game.rules !== undefined && game.rules !== 'chess') {
      continue;
    }

    const side = getPlayerSideChesscom(game, username);

    if (side === null) {
      continue;
    }

    const result = getPlayerResult(game, side);

    if (result === undefined) {
      continue;
    }

    const didLose = isLossResult(result);
    addColor(colors, side, didLose);
    addTimeControl(timeControls, game.time_class ?? 'unknown', didLose, isTimeoutLoss(result));
    addAccuracy(accuracies, game.accuracies?.[side]);

    const opening = getOpeningFromGame(game);

    if (opening !== undefined) {
      addOpening(openings, opening, didLose);
    }
  }

  return [
    ...openingSignals(openings, observedAt),
    ...timeSignals(timeControls, observedAt),
    ...colorSignals(colors, observedAt),
    ...accuracySignals(accuracies, observedAt),
  ];
}

function addOpening(
  openings: Map<string, OpeningAggregate>,
  opening: { eco: string; name: string },
  didLose: boolean,
): void {
  const key = `${opening.eco}:${opening.name}`;
  const current = openings.get(key) ?? {
    eco: opening.eco,
    name: opening.name,
    games: 0,
    losses: 0,
  };

  openings.set(key, {
    ...current,
    games: current.games + 1,
    losses: current.losses + (didLose ? 1 : 0),
  });
}

function addTimeControl(
  timeControls: Map<string, TimeAggregate>,
  speed: string,
  didLose: boolean,
  didTimeout: boolean,
): void {
  const current = timeControls.get(speed) ?? {
    speed,
    games: 0,
    losses: 0,
    timeoutLosses: 0,
  };

  timeControls.set(speed, {
    ...current,
    games: current.games + 1,
    losses: current.losses + (didLose ? 1 : 0),
    timeoutLosses: current.timeoutLosses + (didTimeout ? 1 : 0),
  });
}

function addColor(colors: Map<ChesscomColor, ColorAggregate>, color: ChesscomColor, didLose: boolean): void {
  const current = colors.get(color) ?? {
    color,
    games: 0,
    losses: 0,
  };

  colors.set(color, {
    ...current,
    games: current.games + 1,
    losses: current.losses + (didLose ? 1 : 0),
  });
}

function addAccuracy(accuracies: AccuracyAggregate, accuracy: number | undefined): void {
  if (accuracy === undefined) {
    return;
  }

  accuracies.games += 1;
  accuracies.lowAccuracyGames += accuracy < 70 ? 1 : 0;
}

function openingSignals(openings: Map<string, OpeningAggregate>, observedAt: string): Signal[] {
  return [...openings.values()].map((opening) => ({
    source: 'chesscom',
    confidence: 'medium',
    observedAt,
    value: {
      kind: 'opening',
      eco: opening.eco,
      name: opening.name,
      games: opening.games,
      lossRate: toRate(opening.losses, opening.games),
    },
  }));
}

function timeSignals(timeControls: Map<string, TimeAggregate>, observedAt: string): Signal[] {
  return [...timeControls.values()].flatMap((timeControl) => {
    const timeControlSignal: Signal = {
      source: 'chesscom',
      confidence: 'low',
      observedAt,
      value: {
        kind: 'time-control',
        speed: timeControl.speed,
        games: timeControl.games,
        lossRate: toRate(timeControl.losses, timeControl.games),
      },
    };

    const clockSignal: Signal = {
      source: 'chesscom',
      confidence: 'medium',
      observedAt,
      value: {
        kind: 'clock',
        timeoutLosses: timeControl.timeoutLosses,
        games: timeControl.games,
      },
    };

    return [timeControlSignal, clockSignal];
  });
}

function colorSignals(colors: Map<ChesscomColor, ColorAggregate>, observedAt: string): Signal[] {
  return [...colors.values()].map((color) => ({
    source: 'chesscom',
    confidence: 'low',
    observedAt,
    value: {
      kind: 'color',
      color: color.color,
      games: color.games,
      lossRate: toRate(color.losses, color.games),
    },
  }));
}

function accuracySignals(accuracies: AccuracyAggregate, observedAt: string): Signal[] {
  if (accuracies.games === 0) {
    return [];
  }

  return [
    {
      source: 'chesscom',
      confidence: 'low',
      observedAt,
      value: {
        kind: 'judgment',
        blunders: accuracies.lowAccuracyGames,
        mistakes: 0,
        inaccuracies: 0,
        games: accuracies.games,
      },
    },
  ];
}

function getOpeningFromGame(game: ChesscomGame): { eco: string; name: string } | undefined {
  const tags = parsePgnTags(game.pgn ?? '');
  const ecoUrl = game.eco ?? tags.ECOUrl;
  const eco = tags.ECO ?? openingEcoFromUrl(ecoUrl);
  const name = tags.Opening ?? openingNameFromUrl(ecoUrl);

  if (eco === undefined && name === undefined) {
    return undefined;
  }

  return {
    eco: eco ?? 'unknown',
    name: name ?? 'Abertura sem nome',
  };
}

export function parsePgnTags(pgn: string): Record<string, string> {
  const tags: Record<string, string> = {};

  for (const line of pgn.split(/\r?\n/)) {
    const match = /^\[([A-Za-z0-9_]+)\s+"((?:\\.|[^"\\])*)"\]$/.exec(line.trim());

    if (match === null) {
      continue;
    }

    const key = match[1];
    const value = match[2];

    if (key === undefined || value === undefined) {
      continue;
    }

    tags[key] = value.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }

  return tags;
}

function openingEcoFromUrl(url: string | undefined): string | undefined {
  if (url === undefined) {
    return undefined;
  }

  const match = /\/openings\/([A-E][0-9]{2})(?:-|$)/i.exec(url);
  return match?.[1]?.toUpperCase();
}

function openingNameFromUrl(url: string | undefined): string | undefined {
  if (url === undefined) {
    return undefined;
  }

  const slug = url.split('/').at(-1);

  if (slug === undefined || slug.trim() === '') {
    return undefined;
  }

  return decodeURIComponent(slug).replace(/-/g, ' ');
}

function getPlayerResult(game: ChesscomGame, side: ChesscomColor): string | undefined {
  return side === 'white' ? game.white?.result : game.black?.result;
}

function isLossResult(result: string): boolean {
  return lossResults.has(result);
}

function isTimeoutLoss(result: string): boolean {
  return result === 'timeout';
}

function normalizeUsername(username: string | undefined): string {
  return username?.trim().toLocaleLowerCase('en-US') ?? '';
}

function toRate(count: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((count / total) * 1000) / 1000;
}

const lossResults = new Set([
  'checkmated',
  'timeout',
  'resigned',
  'lose',
  'abandoned',
  'kingofthehill',
  'threecheck',
  'bughousepartnerlose',
]);
