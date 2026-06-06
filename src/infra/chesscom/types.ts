export type ChesscomColor = 'white' | 'black';

export type ChesscomPlayer = {
  username?: string;
  rating?: number;
  result?: string;
};

export type ChesscomGame = {
  white?: ChesscomPlayer;
  black?: ChesscomPlayer;
  accuracies?: Partial<Record<ChesscomColor, number>>;
  eco?: string;
  end_time?: number;
  pgn?: string;
  rated?: boolean;
  rules?: string;
  time_class?: string;
  time_control?: string;
  url?: string;
};

export type ChesscomStatsCategory = {
  last?: {
    rating?: number;
    date?: number;
  };
  record?: {
    win?: number;
    loss?: number;
    draw?: number;
    timeout_percent?: number;
  };
};

export type ChesscomStatsResponse = {
  chess_rapid?: ChesscomStatsCategory;
  chess_blitz?: ChesscomStatsCategory;
  chess_bullet?: ChesscomStatsCategory;
};

export type ChesscomArchivesResponse = {
  archives?: string[];
};

export type ChesscomMonthlyArchiveResponse = {
  games?: ChesscomGame[];
};
