import { getDestinationForWeakness, normalizeDestination } from '../sources/destinations';
import type { DailyPlan, Destination } from '../types';

export function normalizePlanDestinations(plan: DailyPlan): DailyPlan {
  return {
    ...plan,
    blocks: plan.blocks.map((block) => {
      const weaknessTag = getNormalizedWeaknessTag(block, plan);
      const destination = normalizeGenericAnalysisDestination(
        normalizeRejectedStudyDestination(
          normalizeGenericVideoFilterDestination(
            normalizeDestination(block.destination, block.resourceStage),
            block.resourceStage,
            weaknessTag,
          ),
          block.resourceStage,
          weaknessTag,
        ),
        block.resourceStage,
        weaknessTag,
        block.task,
      );
      const upgradedDestination = block.destination.url !== destination.url;
      const normalizedTask = getNormalizedTaskForDestinationUrl(destination.url);
      const shouldUseNormalizedTask =
        normalizedTask !== undefined && (upgradedDestination || block.resourceStage === 'retrieval');

      return {
        ...block,
        sessionNumber: block.sessionNumber ?? 1,
        ...(weaknessTag === undefined ? {} : { weaknessTag }),
        destination,
        source: destination.source,
        task: shouldUseNormalizedTask ? normalizedTask : block.task,
      };
    }),
  };
}

function getNormalizedWeaknessTag(
  block: DailyPlan['blocks'][number],
  plan: DailyPlan,
): DailyPlan['blocks'][number]['weaknessTag'] {
  // Planos persistidos antes da correção de acentos usam 'Revisao curta'.
  if (
    (block.title === 'Revisão curta' || block.title === 'Revisao curta') &&
    block.weaknessTag === 'conversion'
  ) {
    return plan.weeklyFocus?.tag ?? block.weaknessTag;
  }

  return block.weaknessTag;
}

function normalizeGenericAnalysisDestination(
  destination: Destination,
  resourceStage: DailyPlan['blocks'][number]['resourceStage'],
  weaknessTag: DailyPlan['blocks'][number]['weaknessTag'],
  task: string,
): Destination {
  if (
    destination.url !== 'https://lichess.org/analysis' ||
    weaknessTag === undefined ||
    (resourceStage !== 'review' && resourceStage !== 'transfer') ||
    mentionsFinishedGame(task)
  ) {
    return destination;
  }

  return getDestinationForWeakness(weaknessTag, resourceStage);
}

function normalizeRejectedStudyDestination(
  destination: Destination,
  resourceStage: DailyPlan['blocks'][number]['resourceStage'],
  weaknessTag: DailyPlan['blocks'][number]['weaknessTag'],
): Destination {
  const replacementTag = getRejectedStudyReplacementTag(destination.url);

  if (replacementTag === undefined) {
    return destination;
  }

  return getDestinationForWeakness(weaknessTag ?? replacementTag, resourceStage ?? 'guided');
}

function normalizeGenericVideoFilterDestination(
  destination: Destination,
  resourceStage: DailyPlan['blocks'][number]['resourceStage'],
  weaknessTag: DailyPlan['blocks'][number]['weaknessTag'],
): Destination {
  if (destination.url?.startsWith('https://lichess.org/video?tags=') !== true || weaknessTag === undefined) {
    return destination;
  }

  return getDestinationForWeakness(weaknessTag, resourceStage ?? 'guided');
}

function getRejectedStudyReplacementTag(url: string | undefined): DailyPlan['blocks'][number]['weaknessTag'] {
  switch (url) {
    case 'https://lichess.org/study/dXKWlrkg':
    case 'https://lichess.org/study/izZ71JC2':
      return 'endgame-pawn';
    case 'https://lichess.org/study/APSzIEsV':
      return 'mate-in-2';
    default:
      return undefined;
  }
}

function mentionsFinishedGame(task: string): boolean {
  return task.toLowerCase().includes('partida terminada');
}

function getNormalizedTaskForDestinationUrl(url: string | undefined): string | undefined {
  switch (url) {
    case 'https://lichess.org/training/fork':
      return 'Resolva puzzles de garfos e confirme a ideia antes do primeiro lance.';
    case 'https://lichess.org/training/hangingPiece':
      return 'Resolva puzzles de peças penduradas e confirme quem defende cada alvo.';
    case 'https://lichess.org/training/pin':
      return 'Resolva puzzles de cravadas e confirme a peça-alvo antes do primeiro lance.';
    case 'https://lichess.org/training/skewer':
      return 'Resolva puzzles de espetos e procure o alinhamento antes do primeiro lance.';
    case 'https://lichess.org/training/discoveredAttack':
      return 'Resolva puzzles de ataques descobertos e identifique a linha que será aberta.';
    case 'https://lichess.org/training/mateIn1':
      return 'Resolva mates em 1 e fale a ameaça antes de clicar.';
    case 'https://lichess.org/training/mateIn2':
      return 'Resolva mates em 2 e confirme a resposta forçada do adversário.';
    case 'https://lichess.org/practice/fundamental-tactics/the-fork/Qj281y1p':
      return 'Estude a lição guiada de garfo e procure dois alvos antes de confirmar o lance.';
    case 'https://lichess.org/practice/fundamental-tactics/the-pin/9ogFv8Ac':
    case 'https://lichess.org/practice/fundamental-tactics/the-skewer/tuoBxVE5':
    case 'https://lichess.org/practice/fundamental-tactics/discovered-attacks/MnsJEWnI':
      return 'Estude a lição guiada do padrão tático e confirme a peça-alvo antes de escolher o lance.';
    case 'https://lichess.org/practice/checkmates/piece-checkmates-i/BJy6fEDf':
    case 'https://lichess.org/practice/checkmates/checkmate-patterns-i/fE4k21MW':
      return 'Estude o bloco guiado de mates curtos e fale a ameaça antes de clicar no primeiro lance.';
    case 'https://lichess.org/practice/pawn-endgames/key-squares/xebrDvFe':
    case 'https://lichess.org/practice/rook-endgames/basic-rook-endgames/pqUSUw8Y':
      return 'Estude a lição guiada de final simples e conte plano, oposição ou atividade antes de calcular.';
    case 'https://lichess.org/video?tags=beginner%2Fopening':
    case 'https://lichess.org/video?tags=opening+principles':
    case 'https://lichess.org/video/gpsZAim-mYc?tags=opening+principles':
    case 'https://lichess.org/video/gpsZAim-mYc':
      return 'Assista uma aula curta de abertura e anote uma regra para testar na próxima partida: centro, desenvolvimento ou rei seguro.';
    case 'https://lichess.org/video/wod7uXzkrTc':
      return 'Assista uma aula curta de pecas penduradas e anote uma checagem para usar antes de jogar.';
    case 'https://lichess.org/video/mbiR0tcdqBY':
      return 'Assista uma aula curta de garfos e anote como confirmar dois alvos antes do lance.';
    case 'https://lichess.org/video/VjwSudAqLn8':
      return 'Assista uma aula curta de cravadas e anote como reconhecer a peca presa.';
    case 'https://lichess.org/video/ZexQ1kow1MM':
      return 'Assista uma aula curta de espetos e anote como reconhecer o alinhamento.';
    case 'https://lichess.org/video/nMADfn1scbI':
      return 'Assista uma aula curta de ataque descoberto e anote qual linha abre quando a peca sai.';
    case 'https://lichess.org/video/uhQhasudq9M':
      return 'Assista uma aula curta de padroes de mate e anote uma ameaca tipica para procurar nos puzzles.';
    case 'https://lichess.org/video/QUqq7wSLE78':
      return 'Assista uma aula curta de finais de peões e anote uma regra prática antes de treinar.';
    case 'https://lichess.org/video/0-ouahZH8X4':
      return 'Assista uma aula curta de conversao de vantagem e anote um plano simples para testar.';
    default:
      return undefined;
  }
}
