import type { PlanBlockKind } from '../plan/timeBudget';
import type { PlanResourceStage, WeaknessTag } from '../types';

export const coachNotesByBlockKind = {
  aquecimento:
    'Comece leve e observe o tabuleiro inteiro antes de clicar. O objetivo aqui é acordar a visão, não correr. Se errar, nomeie a ameaça que passou batida e siga para o próximo.',
  tema:
    'Hoje o foco é repetição deliberada de um padrão. Procure a ideia antes do lance: alvo, defensor e consequência material. Pare quando a regra de parada bater, mesmo se estiver embalado.',
  revisao:
    'Revise como quem procura causa, não culpa. Escolha uma posição recente e pergunte qual informação você ignorou. Uma resposta honesta vale mais que muitos lances passados no automático.',
  transferencia:
    'Agora leve o padrão para uma posição menos limpa. Antes de mover, diga em voz baixa o que mudou em relação aos puzzles. Esse bloco treina reconhecer o tema fora da vitrine.',
  final:
    'Feche com calma e precisão. Final bom nasce de rei ativo, peões contados e plano simples. Se a linha ficar nebulosa, volte um lance e reduza a posição a uma pergunta concreta.',
} satisfies Record<PlanBlockKind, string>;

export function getCoachNote(
  kind: PlanBlockKind,
  context: { weaknessTag?: WeaknessTag; resourceStage?: PlanResourceStage } = {},
): string {
  if (kind === 'tema' && context.weaknessTag === 'fork') {
    return 'Garfo é quando uma peça sua ataca dois alvos ao mesmo tempo. Neste treino você vai ver garfos com cavalo, bispo, peão e dama. Isso importa porque o rival consegue salvar um alvo, mas o outro pode cair. No começo você aprende a ver o desenho; com treino, começa a preparar o garfo alguns lances antes.';
  }

  return coachNotesByBlockKind[kind];
}
