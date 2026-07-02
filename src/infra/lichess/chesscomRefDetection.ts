import { parseGameRef } from './autopsyClient';

export type ChesscomRefDetection =
  | { kind: 'chesscom-game-url' }
  | { kind: 'chesscom-username'; username: string };

const CHESSCOM_USERNAME_PATTERN = /^[A-Za-z0-9_-]{3,25}$/;

// Ambiguidade resolvida pela prioridade do parseGameRef: um id Lichess de 8
// chars alfanuméricos (ex.: "abcd1234") também satisfaria o regex de
// username chess.com (3-25 alfanumérico/hífen/underscore). Por isso
// parseGameRef é consultado PRIMEIRO — se ele reconhecer a entrada como
// referência de partida do Lichess, esta função sempre devolve null.
export function detectChesscomRef(input: string): ChesscomRefDetection | null {
  const trimmed = input.trim();

  if (trimmed === '') {
    return null;
  }

  if (parseGameRef(trimmed) !== null) {
    return null;
  }

  if (isChesscomUrl(trimmed)) {
    return { kind: 'chesscom-game-url' };
  }

  if (CHESSCOM_USERNAME_PATTERN.test(trimmed)) {
    return { kind: 'chesscom-username', username: trimmed };
  }

  return null;
}

function isChesscomUrl(input: string): boolean {
  const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    return false;
  }

  const host = url.hostname.replace(/^www\./i, '').toLowerCase();
  return host === 'chess.com';
}
