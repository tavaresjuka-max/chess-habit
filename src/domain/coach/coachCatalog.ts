import type { PlanBlockKind } from '../plan/timeBudget';
import type { PlanResourceStage, WeaknessTag } from '../types';

export const coachNotesByBlockKind = {
  // A saudação é papel do Professor Tavarez no topo da tela — aqui é só a
  // dica de execução do bloco.
  aquecimento:
    'Não é prova de velocidade: olhe o tabuleiro inteiro, procure peças soltas e siga com calma.',
  tema:
    'Hoje é repetição deliberada de um padrão. Procure a ideia antes do lance: alvo, defensor e consequência material. Pare quando a regra de parada bater, mesmo embalado.',
  revisao:
    'Revise procurando causa, não culpa. Escolha uma posição recente e pergunte qual informação você ignorou. Uma resposta honesta vale mais que muitos lances no automático.',
  transferencia:
    'Agora leve o padrão para uma posição menos limpa. Antes de mover, diga em voz baixa o que mudou em relação aos puzzles. Aqui você reconhece o tema fora da vitrine.',
  final:
    'Feche com calma e precisão. Final bom nasce de rei ativo, peões contados e plano simples. Se a linha ficar nebulosa, volte um lance e reduza a uma pergunta concreta.',
} satisfies Record<PlanBlockKind, string>;

export function getCoachNote(
  kind: PlanBlockKind,
  context: { weaknessTag?: WeaknessTag; resourceStage?: PlanResourceStage } = {},
): string {
  if (
    kind === 'tema' &&
    context.weaknessTag === 'fork' &&
    (context.resourceStage === 'explain' || context.resourceStage === 'guided')
  ) {
    return 'Garfo é uma peça sua atacando dois alvos ao mesmo tempo. Hoje: garfos com cavalo, bispo, peão e dama. O rival salva um alvo, mas o outro pode cair. No começo você vê o desenho; com treino, prepara o garfo alguns lances antes.';
  }

  return coachNotesByBlockKind[kind];
}
