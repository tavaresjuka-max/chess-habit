/**
 * errorRouting.ts — Roteamento do gerador pela taxonomia de erro (Fase 1, 2026-06-24)
 *
 * Dado o errorType predominante nos erros recentes de um tema (derivado dos
 * TrainingLogs com feedback='hard' + errorType preenchido), retorna a ênfase
 * de drill que o gerador deve priorizar.
 *
 * REGRAS:
 * - Só conta logs com status='done' E feedback='hard' E errorType definido.
 * - Janela: os 10 mais recentes (por date desc) que passam nos filtros acima.
 * - Mínimo de 2 logs eligible: 1 amostra isolada não é sinal (ruído → default).
 * - Predominância = maioria simples (>50% dos registros com errorType).
 * - Empate ou sem maioria clara → 'default' (mantém comportamento atual).
 * - Sem rating. Não toca DD-Ped6/floor, M-Retenção, R2b.
 */

import type { ErrorType, TrainingLog } from '../types';

export type ErrorRoutingEmphasis =
  /** nao-vi predominante → subir volume de detecção (DAMP-scan, temas rotulados) */
  | 'detection-volume'
  /** errei-conta predominante → drill de cálculo (CCT/forcings) */
  | 'calculation'
  /** escolhi-errado predominante → seleção de candidatos */
  | 'candidate-selection'
  /** sem dado suficiente / empate → mantém comportamento atual do gerador */
  | 'default';

/** Janela máxima de logs considerados (mais recentes por data). */
const ERROR_ROUTING_WINDOW = 10;

/** Mínimo de logs eligible para produzir uma ênfase (abaixo disso = ruído). */
const ERROR_ROUTING_MIN_ELIGIBLE = 2;

/**
 * Labels de exibição para o seletor de 1 toque na UI.
 * Tom Professor Lemos: descritivo, sem juízo.
 */
export const ERROR_TYPE_LABELS: Record<ErrorType, string> = {
  'nao-vi': 'NÃO VI',
  'errei-conta': 'ERREI A CONTA',
  'escolhi-errado': 'ESCOLHI ERRADO',
};

/** Prompt exibido acima dos botões de seleção de errorType. */
export const SELF_EXPLANATION_PROMPT = 'O que falhou?';

/** Prompt para o campo de autoexplicação (opcional, não obrigatório). */
export const SELF_EXPLANATION_FIELD_LABEL = 'Por que esse lance? (opcional)';

/**
 * Calcula a ênfase de drill predominante a partir dos logs de treino recentes.
 *
 * @param logs - Todos os TrainingLogs do perfil (ou do tema relevante).
 *               A função filtra internamente por done+hard+errorType.
 * @returns A ênfase de drill a priorizar, ou 'default' se sem sinal claro.
 */
export function getErrorRoutingEmphasis(logs: TrainingLog[]): ErrorRoutingEmphasis {
  // Filtra: done + hard + errorType definido
  const eligible = logs
    .filter((log) => log.status === 'done' && log.feedback === 'hard' && log.errorType !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date)) // mais recentes primeiro
    .slice(0, ERROR_ROUTING_WINDOW);

  if (eligible.length === 0) {
    return 'default';
  }

  // Mínimo de 2 logs eligible: 1 amostra isolada é ruído, não sinal pedagógico.
  // (Council: sinal local precisa de corroboração antes de mover o gerador.)
  if (eligible.length < ERROR_ROUTING_MIN_ELIGIBLE) {
    return 'default';
  }

  // Contagem por tipo
  const counts: Record<ErrorType, number> = {
    'nao-vi': 0,
    'errei-conta': 0,
    'escolhi-errado': 0,
  };

  for (const log of eligible) {
    if (log.errorType !== undefined) {
      counts[log.errorType] += 1;
    }
  }

  const total = eligible.length;
  const [top, second] = (Object.entries(counts) as [ErrorType, number][])
    .sort(([, a], [, b]) => b - a);

  // Sem maioria simples (>50%) → empate ou distribuição uniforme → default
  if (top === undefined || top[1] === 0) return 'default';
  // Empate entre os dois primeiros → default
  if (second !== undefined && top[1] === second[1]) return 'default';
  // Verifica maioria (>50%)
  if (top[1] / total <= 0.5) return 'default';

  switch (top[0]) {
    case 'nao-vi':
      return 'detection-volume';
    case 'errei-conta':
      return 'calculation';
    case 'escolhi-errado':
      return 'candidate-selection';
  }
}

/**
 * Copy pedagógica derivada da ênfase de erro (tom Professor Lemos, sem juízo).
 * Consumida pelo gerador para ajustar coachNote/guidingQuestion do bloco tema.
 * Retorna undefined para 'default' — o gerador mantém sua copy usual.
 *
 * Fase 1 (1c): o errorType refina O QUE o gerador prescreve, sem tocar estágio,
 * track, floor ou retenção (ADITIVO puro).
 */
export type ErrorRoutingCoach = {
  coachNote: string;
  guidingQuestion: string;
};

export function getErrorRoutingCoach(emphasis: ErrorRoutingEmphasis): ErrorRoutingCoach | undefined {
  switch (emphasis) {
    case 'detection-volume':
      return {
        coachNote: 'O lance certo estava à vista. Antes de calcular, passe os olhos por todo o tabuleiro e nomeie os alvos.',
        guidingQuestion: 'Que ameaça esteve à vista e você deixou passar?',
      };
    case 'calculation':
      return {
        coachNote: 'A ideia era a certa; a linha ficou pela metade. Calcule até a resposta final do adversário antes de confirmar.',
        guidingQuestion: 'Qual é a melhor resposta do adversário no fim desta linha?',
      };
    case 'candidate-selection':
      return {
        coachNote: 'Liste 2 candidatos e preveja a resposta de cada um antes de escolher o lance.',
        guidingQuestion: 'Quais são seus 2 candidatos e o que muda entre eles?',
      };
    case 'default':
      return undefined;
  }
}

/**
 * Transparência (A1', council 2026-06-24): explica AO ALUNO o porquê do roteamento,
 * na linguagem dele. Mostrar o "porquê" é a validação honesta da hipótese de
 * roteamento num app de 1 usuário (telemetria de dev não tem significância em n=1).
 * Retorna undefined para 'default' (sem ênfase = sem nota). Tom Lemos, sem promessa
 * de rating, sem exclamação; passa BANNED_PHRASES.
 */
export function buildRoutingWhy(emphasis: ErrorRoutingEmphasis): string | undefined {
  switch (emphasis) {
    case 'detection-volume':
      return 'Seu padrão recente: lances que estavam à vista passaram. Por isso o foco de hoje é olhar o tabuleiro inteiro antes de calcular.';
    case 'calculation':
      return 'Seu padrão recente: a ideia certa, mas a conta pela metade. Por isso o foco de hoje é calcular até o fim da linha.';
    case 'candidate-selection':
      return 'Seu padrão recente: o lance escolhido não era o melhor candidato. Por isso o foco de hoje é comparar candidatos antes de decidir.';
    case 'default':
      return undefined;
  }
}
