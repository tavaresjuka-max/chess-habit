import type { PlanBlockKind } from '../plan/timeBudget';

export const coachNotesByBlockKind = {
  aquecimento:
    'Comece leve e observe o tabuleiro inteiro antes de clicar. O objetivo aqui e acordar a visao, nao correr. Se errar, nomeie a ameaca que passou batida e siga para o proximo.',
  tema:
    'Hoje o foco e repeticao deliberada de um padrao. Procure a ideia antes do lance: alvo, defensor e consequencia material. Pare quando a regra de parada bater, mesmo se estiver embalado.',
  revisao:
    'Revise como quem procura causa, nao culpa. Escolha uma posicao recente e pergunte qual informacao voce ignorou. Uma resposta honesta vale mais que muitos lances passados no automatico.',
  transferencia:
    'Agora leve o padrao para uma posicao menos limpa. Antes de mover, diga em voz baixa o que mudou em relacao aos puzzles. Esse bloco treina reconhecer o tema fora da vitrine.',
  final:
    'Feche com calma e precisao. Final bom nasce de rei ativo, peoes contados e plano simples. Se a linha ficar nebulosa, volte um lance e reduza a posicao a uma pergunta concreta.',
} satisfies Record<PlanBlockKind, string>;

export function getCoachNote(kind: PlanBlockKind): string {
  return coachNotesByBlockKind[kind];
}
