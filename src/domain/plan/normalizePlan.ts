import { normalizeDestination } from '../sources/destinations';
import type { DailyPlan } from '../types';

export function normalizePlanDestinations(plan: DailyPlan): DailyPlan {
  return {
    ...plan,
    blocks: plan.blocks.map((block) => {
      const destination = normalizeDestination(block.destination, block.resourceStage);
      const upgradedDestination = block.destination.url !== destination.url;
      const normalizedTask = getNormalizedTaskForDestinationUrl(destination.url);
      const shouldUseNormalizedTask =
        normalizedTask !== undefined && (upgradedDestination || block.resourceStage === 'retrieval');

      return {
        ...block,
        destination,
        source: destination.source,
        task: shouldUseNormalizedTask ? normalizedTask : block.task,
      };
    }),
  };
}

function getNormalizedTaskForDestinationUrl(url: string | undefined): string | undefined {
  switch (url) {
    case 'https://lichess.org/training/fork':
      return 'Resolva puzzles de garfos e confirme a ideia antes do primeiro lance.';
    case 'https://lichess.org/training/hangingPiece':
      return 'Resolva puzzles de pecas penduradas e confirme quem defende cada alvo.';
    case 'https://lichess.org/training/pin':
      return 'Resolva puzzles de cravadas e confirme a peca-alvo antes do primeiro lance.';
    case 'https://lichess.org/training/skewer':
      return 'Resolva puzzles de espetos e procure o alinhamento antes do primeiro lance.';
    case 'https://lichess.org/training/discoveredAttack':
      return 'Resolva puzzles de ataques descobertos e identifique a linha que sera aberta.';
    case 'https://lichess.org/training/mateIn1':
      return 'Resolva mates em 1 e fale a ameaca antes de clicar.';
    case 'https://lichess.org/training/mateIn2':
      return 'Resolva mates em 2 e confirme a resposta forcada do adversario.';
    case 'https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p':
      return 'Estude a licao guiada de garfo e procure dois alvos antes de confirmar o lance.';
    case 'https://lichess.org/practice/fundamental-tactics/the-pin/9ogFv8Ac':
    case 'https://lichess.org/practice/fundamental-tactics/the-skewer/tuoBxVE5':
    case 'https://lichess.org/practice/fundamental-tactics/discovered-attacks/MnsJEWnI':
      return 'Estude a licao guiada do padrao tatico e confirme a peca-alvo antes de escolher o lance.';
    case 'https://lichess.org/practice/checkmates/piece-checkmates-i/BJy6fEDf':
    case 'https://lichess.org/practice/checkmates/checkmate-patterns-i/fE4k21MW':
      return 'Estude o bloco guiado de mates curtos e fale a ameaca antes de clicar no primeiro lance.';
    case 'https://lichess.org/practice/pawn-endgames/key-squares/xebrDvFe':
    case 'https://lichess.org/practice/rook-endgames/basic-rook-endgames/pqUSUw8Y':
      return 'Estude a licao guiada de final simples e conte plano, oposicao ou atividade antes de calcular.';
    case 'https://lichess.org/video?tags=beginner%2Fopening':
    case 'https://lichess.org/video/gpsZAim-mYc?tags=opening+principles':
      return 'Assista uma aula curta de abertura e anote uma regra para testar na proxima partida: centro, desenvolvimento ou rei seguro.';
    default:
      return undefined;
  }
}
