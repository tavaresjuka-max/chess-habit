import type { WeaknessTag } from '../types';

export type ConceptContract = {
  id: WeaknessTag;
  title: string;
  prerequisiteTags: WeaknessTag[];
  typicalError: string;
  observableGoal: string;
  scaffoldCue: string;
  retrievalPrompt: string;
  postAttemptReflection: string;
  mastery: {
    blindCorrectStreak: number;
    minAttempts: number;
  };
  transfer: {
    mixedBlindCorrectStreak: number;
  };
  sourceInfluences: string[];
  cleanRoomNote: string;
  // cont-3 (2026-07-02): dica de discriminação para pares classicamente
  // confundíveis. confusedWith aponta para outro WeaknessTag; cue ensina a
  // diferença em 1-2 frases, voz do Professor Tavarez. Opcional: só os pares
  // com confusão documentada recebem o campo.
  discriminationCue?: {
    confusedWith: WeaknessTag;
    cue: string;
  };
};

const cleanRoomNote = 'Influência pedagógica abstrata; sem copiar texto, posições, diagramas ou problemas.';

export const conceptContracts = [
  {
    id: 'hanging-piece',
    title: 'Peças penduradas',
    prerequisiteTags: [],
    typicalError: 'Mover antes de conferir quais peças estão sem defesa.',
    observableGoal: 'Identificar peças indefesas dos dois lados antes do primeiro lance candidato.',
    scaffoldCue: 'Antes de mover, escolha uma peça sua e uma do rival: quem defende cada uma?',
    retrievalPrompt: 'Faça uma checagem curta de segurança antes de calcular.',
    postAttemptReflection: 'Você viu as peças sem defesa antes de escolher o lance?',
    mastery: { blindCorrectStreak: 5, minAttempts: 10 },
    transfer: { mixedBlindCorrectStreak: 3 },
    sourceInfluences: ['Heisman/LPDO', 'Capablanca fundamentos'],
    cleanRoomNote,
    discriminationCue: {
      confusedWith: 'blunder-rate',
      cue: 'Peça pendurada é o alvo parado no tabuleiro agora; segurança tática é o hábito de checar antes de cada lance, mesmo quando nada parece solto ainda.',
    },
  },
  {
    id: 'blunder-rate',
    title: 'Segurança tática',
    prerequisiteTags: ['hanging-piece'],
    typicalError: 'Confirmar um lance sem checar ameaça, captura ou peça solta.',
    observableGoal: 'Aplicar uma varredura mínima antes de cada decisão simples.',
    scaffoldCue: 'Entre no treino com uma regra simples: cheques, capturas, ameaças e peças sem defesa.',
    retrievalPrompt: 'Antes do lance, faça uma varredura mínima do perigo imediato.',
    postAttemptReflection: 'Você checou a ameaça do adversário antes de jogar?',
    mastery: { blindCorrectStreak: 5, minAttempts: 10 },
    transfer: { mixedBlindCorrectStreak: 3 },
    sourceInfluences: ['Heisman/LPDO', 'DAMP como detecção tática'],
    cleanRoomNote,
    discriminationCue: {
      confusedWith: 'hanging-piece',
      cue: 'Segurança tática é o hábito de checar antes de cada lance; peça pendurada é só um dos resultados que essa checagem pode revelar.',
    },
  },
  {
    id: 'fork',
    title: 'Garfos',
    prerequisiteTags: ['hanging-piece'],
    typicalError: 'Calcular um lance sem notar alvos múltiplos disponíveis.',
    observableGoal: 'Encontrar ameaça dupla sem depender do rótulo do tema.',
    scaffoldCue: 'Procure primeiro os dois alvos. O lance vem depois; o padrão vem antes.',
    retrievalPrompt: 'Procure uma ameaça forçada antes de escolher o lance.',
    postAttemptReflection: 'Você percebeu a ameaça dupla antes de calcular?',
    mastery: { blindCorrectStreak: 5, minAttempts: 10 },
    transfer: { mixedBlindCorrectStreak: 3 },
    sourceInfluences: ['Seirawan tática básica', 'Polgar padrões', 'Neiman detectar antes de calcular'],
    cleanRoomNote,
    discriminationCue: {
      confusedWith: 'discovered',
      cue: 'No garfo, uma peça sua ataca dois alvos ao mesmo tempo; no ataque descoberto, é o lance de uma peça que abre linha para OUTRA peça atacar por trás.',
    },
  },
  {
    id: 'pin',
    title: 'Cravadas',
    prerequisiteTags: ['hanging-piece'],
    typicalError: 'Mover ou capturar sem perceber uma peça presa por algo mais valioso atrás.',
    observableGoal: 'Reconhecer peças que não podem se mover livremente.',
    scaffoldCue: 'Antes do primeiro clique, pergunte qual peça não pode se mexer e o que está atrás dela.',
    retrievalPrompt: 'Observe as linhas abertas e as peças que têm pouca liberdade.',
    postAttemptReflection: 'Você viu uma peça limitada por uma linha?',
    mastery: { blindCorrectStreak: 5, minAttempts: 10 },
    transfer: { mixedBlindCorrectStreak: 3 },
    sourceInfluences: ['Seirawan tática básica', 'Heisman segurança'],
    cleanRoomNote,
    discriminationCue: {
      confusedWith: 'skewer',
      cue: 'Na cravada, a peça presa é a MENOS valiosa e fica na frente por obrigação; no espeto, a peça na frente é a MAIS valiosa e é forçada a fugir, expondo a de trás.',
    },
  },
  {
    id: 'skewer',
    title: 'Espetos',
    prerequisiteTags: ['pin'],
    typicalError: 'Olhar só a peça atacada e não a peça exposta atrás dela.',
    observableGoal: 'Enxergar a linha inteira antes de calcular capturas.',
    scaffoldCue: 'Veja a linha inteira: se a peça grande sair, o que fica exposto atrás?',
    retrievalPrompt: 'Confira se uma linha força uma peça valiosa a se mover.',
    postAttemptReflection: 'Você viu o que ficaria exposto depois da fuga?',
    mastery: { blindCorrectStreak: 5, minAttempts: 10 },
    transfer: { mixedBlindCorrectStreak: 3 },
    sourceInfluences: ['Seirawan tática básica', 'DAMP alinhamento'],
    cleanRoomNote,
    discriminationCue: {
      confusedWith: 'pin',
      cue: 'No espeto, a peça mais valiosa está na frente e é forçada a se mexer; na cravada, a peça mais fraca está na frente e não pode se mexer porque expõe algo maior atrás.',
    },
  },
  {
    id: 'discovered',
    title: 'Ataques descobertos',
    prerequisiteTags: ['pin', 'skewer'],
    typicalError: 'Calcular a peça que se move e esquecer a linha que ela libera.',
    observableGoal: 'Identificar a peça que sai da frente e a ameaça criada pela peça de trás.',
    scaffoldCue: 'Antes de calcular, identifique a peça que sai da frente e a linha que ela libera.',
    retrievalPrompt: 'Veja se mover uma peça abre uma ameaça maior.',
    postAttemptReflection: 'Você viu a linha que abriu antes do lance?',
    mastery: { blindCorrectStreak: 5, minAttempts: 10 },
    transfer: { mixedBlindCorrectStreak: 3 },
    sourceInfluences: ['Hertan/CCT', 'Neiman detectar antes de calcular'],
    cleanRoomNote,
    discriminationCue: {
      confusedWith: 'fork',
      cue: 'No ataque descoberto, a peça que se move não é quem ataca — ela só sai da frente para liberar outra peça; no garfo, quem se move É a peça que ataca os dois alvos.',
    },
  },
  {
    id: 'mate-in-1',
    title: 'Mate em 1',
    prerequisiteTags: ['hanging-piece'],
    typicalError: 'Calcular plano longo sem checar se o rei já não tem saída.',
    observableGoal: 'Checar fuga, defesa e captura do rei antes de procurar plano longo.',
    scaffoldCue: 'Procure casas de fuga, defesas e capturas do rei. Se todas somem, o lance aparece.',
    retrievalPrompt: 'Antes de calcular longo, confira a segurança do rei adversário.',
    postAttemptReflection: 'Você checou todas as respostas do rei?',
    mastery: { blindCorrectStreak: 5, minAttempts: 10 },
    transfer: { mixedBlindCorrectStreak: 3 },
    sourceInfluences: ['Capablanca fundamentos', 'Fischer padrões básicos'],
    cleanRoomNote,
    discriminationCue: {
      confusedWith: 'mate-in-2',
      cue: 'Mate em 1 é xeque-mate JÁ no seu próximo lance, sem resposta possível do rival; mate em 2 exige um lance intermediário que o rival ainda responde antes do mate final.',
    },
  },
  {
    id: 'mate-in-2',
    title: 'Mate em 2',
    prerequisiteTags: ['mate-in-1'],
    typicalError: 'Parar no primeiro cheque promissor sem verificar a continuação.',
    observableGoal: 'Calcular lance, resposta crítica e arremate.',
    scaffoldCue: 'Não corra para o lance bonito: primeiro veja a ameaça que continua depois da defesa.',
    retrievalPrompt: 'Procure uma sequência forçada curta antes de clicar.',
    postAttemptReflection: 'Você viu a resposta crítica antes do primeiro lance?',
    mastery: { blindCorrectStreak: 5, minAttempts: 10 },
    transfer: { mixedBlindCorrectStreak: 3 },
    sourceInfluences: ['Hertan/CCT', 'Polgar padrões'],
    cleanRoomNote,
    discriminationCue: {
      confusedWith: 'mate-in-1',
      cue: 'Mate em 2 tem uma etapa antes do golpe final: você dá um lance forçante, o rival responde de um jeito só possível, e aí sim vem o mate — não confunda com o mate direto em 1 lance.',
    },
  },
  {
    id: 'back-rank',
    title: 'Mate na última fileira',
    prerequisiteTags: ['mate-in-1'],
    typicalError: 'Afastar defesa ou atacar sem notar o rei preso.',
    observableGoal: 'Reconhecer rei sem escape e peça que controla a fileira crítica.',
    scaffoldCue: 'Olhe o rei preso, as peças que bloqueiam fuga e quem controla a última fileira.',
    retrievalPrompt: 'Confira se o rei adversário tem casa de fuga.',
    postAttemptReflection: 'Você viu a falta de escape do rei?',
    mastery: { blindCorrectStreak: 5, minAttempts: 10 },
    transfer: { mixedBlindCorrectStreak: 3 },
    sourceInfluences: ['Padrões clássicos de mate', 'Capablanca fundamentos'],
    cleanRoomNote,
    discriminationCue: {
      confusedWith: 'mate-in-2',
      cue: 'Mate na última fileira é um PADRÃO (rei preso pelos próprios peões, torre ou dama chega na fileira de trás); mate em 2 é uma PROFUNDIDADE de cálculo que pode ou não usar esse padrão.',
    },
  },
  {
    id: 'opening-principles',
    title: 'Princípios de abertura',
    prerequisiteTags: ['hanging-piece'],
    typicalError: 'Memorizar lance ou atacar cedo sem centro, desenvolvimento e rei seguro.',
    observableGoal: 'Escolher lances iniciais que desenvolvem peças, disputam centro ou protegem o rei.',
    scaffoldCue: 'Entre com uma pergunta só: meu lance disputa o centro, desenvolve ou melhora a segurança do rei?',
    retrievalPrompt: 'Confira se o próximo lance melhora uma necessidade básica da posição.',
    postAttemptReflection: 'Seu plano inicial melhorou centro, desenvolvimento ou rei?',
    mastery: { blindCorrectStreak: 5, minAttempts: 10 },
    transfer: { mixedBlindCorrectStreak: 3 },
    sourceInfluences: ['Capablanca princípios', 'Lasker desenvolvimento gradual', 'Lazzarotto vocabulário PT-BR'],
    cleanRoomNote,
  },
  {
    id: 'time-trouble',
    title: 'Gestão de tempo',
    prerequisiteTags: ['blunder-rate'],
    typicalError: 'Gastar tempo demais no simples e decidir no difícil por impulso.',
    observableGoal: 'Aplicar uma checagem mínima e parar de calcular quando a posição não exige profundidade.',
    scaffoldCue: 'O treino não é correr: é decidir uma checagem mínima antes de acelerar.',
    retrievalPrompt: 'Faça uma decisão simples com checagem mínima, sem transformar tudo em cálculo longo.',
    postAttemptReflection: 'Você decidiu o simples sem gastar energia demais?',
    mastery: { blindCorrectStreak: 5, minAttempts: 10 },
    transfer: { mixedBlindCorrectStreak: 3 },
    sourceInfluences: ['Rafael Leitão orçamento de tempo', 'prática deliberada'],
    cleanRoomNote,
  },
  {
    id: 'endgame-pawn',
    title: 'Finais de peões',
    prerequisiteTags: ['hanging-piece'],
    typicalError: 'Calcular corrida de peão sem contar rei ativo, oposição e promoção.',
    observableGoal: 'Decidir final de peões por plano simples antes de variantes.',
    scaffoldCue: 'Conte rei ativo, oposição e casa de promoção antes de calcular qualquer corrida.',
    retrievalPrompt: 'Antes da linha, confira rei ativo e casa de promoção.',
    postAttemptReflection: 'Você decidiu pelo plano do final antes de calcular?',
    mastery: { blindCorrectStreak: 5, minAttempts: 10 },
    transfer: { mixedBlindCorrectStreak: 3 },
    sourceInfluences: ['Capablanca finais', 'Keres finais práticos'],
    cleanRoomNote,
  },
  {
    id: 'endgame-rook',
    title: 'Finais de torres',
    prerequisiteTags: ['endgame-pawn'],
    typicalError: 'Defender passivamente sem ativar torre e rei.',
    observableGoal: 'Priorizar atividade da torre, rei ativo e peões passados.',
    scaffoldCue: 'Antes da linha, pergunte se a torre está ativa ou só defendendo passivamente.',
    retrievalPrompt: 'Confira atividade das peças antes de calcular a linha.',
    postAttemptReflection: 'Sua torre ficou ativa ou só presa à defesa?',
    mastery: { blindCorrectStreak: 5, minAttempts: 10 },
    transfer: { mixedBlindCorrectStreak: 3 },
    sourceInfluences: ['Capablanca finais', 'Nunn finais técnicos', 'Silman finais práticos'],
    cleanRoomNote,
  },
  {
    id: 'conversion',
    title: 'Conversão de vantagem',
    prerequisiteTags: ['hanging-piece', 'endgame-pawn'],
    typicalError: 'Ganhar vantagem e devolver contra-jogo por pressa ou plano vago.',
    observableGoal: 'Simplificar quando convém, ativar peças e reduzir contra-jogo.',
    scaffoldCue: 'Vantagem não é pressa: simplifique, ative peças e corte o contrajogo antes do golpe final.',
    retrievalPrompt: 'Procure o plano que reduz contra-jogo antes do lance tático.',
    postAttemptReflection: 'Você reduziu o contra-jogo ou só procurou golpe?',
    mastery: { blindCorrectStreak: 5, minAttempts: 10 },
    transfer: { mixedBlindCorrectStreak: 3 },
    sourceInfluences: ['Capablanca conversão', 'Silman plano simples', 'Watson dinamismo'],
    cleanRoomNote,
  },
] as const satisfies readonly ConceptContract[];

export const conceptContractByTag: Record<WeaknessTag, ConceptContract> = conceptContracts.reduce(
  (byTag, contract) => ({ ...byTag, [contract.id]: contract }),
  {} as Record<WeaknessTag, ConceptContract>,
);

export function getConceptContract(tag: WeaknessTag): ConceptContract {
  return conceptContractByTag[tag];
}
