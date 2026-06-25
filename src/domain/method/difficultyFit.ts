// Gate por resultado OBSERVADO (council 2026-06-24, ver memory routing-concept-puzzle-decision).
// O Lichess serve puzzles pelo rating GLOBAL do aluno, não por estágio — a dificuldade é
// INGOVERNÁVEL na URL. Em vez de FINGIR controlá-la, medimos o solve-rate observado e
// classificamos o "encaixe" (fit). Mismatch (difícil demais) cai pro layer controlável
// (Study) ou adia o conceito — nunca repete volume duro em silêncio.

export type DifficultyFit = 'insufficient' | 'too-hard' | 'fit' | 'too-easy';
export type MismatchAction = 'route-study' | 'defer' | 'continue';

export type ObservedResult = { attempts: number; losses: number };

// solveRate < 0.40 = difícil demais (aluno falha a maioria); > 0.85 = fácil demais (pode
// acelerar). Entre = encaixe. Limiares conservadores; o árbitro de aceite é o teste, não o palpite.
const TOO_HARD_BELOW = 0.4;
const TOO_EASY_ABOVE = 0.85;
// Abaixo deste nº de tentativas observadas não há sinal confiável — não classifica (evita
// adiar um conceito por azar em 1-2 puzzles). Cold-start cai aqui e segue a rota normal.
const DEFAULT_MIN_ATTEMPTS = 4;

export function solveRate({ attempts, losses }: ObservedResult): number {
  if (attempts <= 0) {
    return 0;
  }
  const wins = Math.max(0, attempts - losses);

  return wins / attempts;
}

export function classifyDifficultyFit(
  observed: ObservedResult,
  options: { minAttempts?: number } = {},
): DifficultyFit {
  const minAttempts = options.minAttempts ?? DEFAULT_MIN_ATTEMPTS;

  if (observed.attempts < minAttempts) {
    return 'insufficient';
  }

  const rate = solveRate(observed);

  if (rate < TOO_HARD_BELOW) {
    return 'too-hard';
  }
  if (rate > TOO_EASY_ABOVE) {
    return 'too-easy';
  }

  return 'fit';
}

// Mismatch só dispara em 'too-hard' (decisão do dono 2026-06-24, UX TDAH): cai pro layer
// controlável (Study curada) se houver; senão ADIA o conceito com nota honesta. Nunca repete
// volume duro nem finge. 'too-easy'/'fit'/'insufficient' seguem normal ('continue').
export function decideMismatchAction(
  fit: DifficultyFit,
  context: { hasCuratedStudy: boolean },
): MismatchAction {
  if (fit !== 'too-hard') {
    return 'continue';
  }

  return context.hasCuratedStudy ? 'route-study' : 'defer';
}
