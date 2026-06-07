import { ChesscomRateLimitError } from '../infra/chesscom/chesscomClient';
import { LichessRateLimitError } from '../infra/lichess/puzzleActivity';

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Nao foi possivel carregar os dados locais.';
}

export function toDiagnosisErrorMessage(error: unknown): string {
  if (error instanceof ChesscomRateLimitError || error instanceof LichessRateLimitError) {
    return error.message;
  }

  return error instanceof Error ? error.message : 'Nao foi possivel atualizar o diagnostico Chess.com.';
}

export function toLichessErrorMessage(error: unknown): string {
  if (error instanceof LichessRateLimitError) {
    return error.message;
  }

  return error instanceof Error ? error.message : 'Nao foi possivel atualizar o Lichess.';
}
