// Gate duplo do protocolo de falsificação n=1 (docs/specs/falsification-protocol-DECISION.md,
// seção "O gate duplo (por nó conceitual, quando o dado existir)"). Função PURA: recebe os
// ingredientes já calculados (adesão, sonda, blunder-rate) e devolve um veredito + razões em
// pt-BR. Não busca dado nem decide fonte — quem chama monta o input.
//
// POSTURA (inegociável): "tenta se falsificar, não se provar". 'passou' aqui significa
// "não falsificado ainda" — NUNCA "eficácia comprovada". Nenhuma camada acima deste módulo
// pode reescrever esse rótulo.

export type FalsificationVerdict = 'aguardando' | 'sem-dados' | 'nao-avaliavel' | 'passou' | 'falsificado';

export type AdherenceInput = {
  percent: number;
  floorPercent: number;
};

export type ProbeInput = {
  accuracyPercent: number;
  itemCount: number;
};

export type BlunderInput = {
  ratePost: number;
  rateBaseline: number;
  baselineGameCount: number;
};

export type FalsificationGateInput = {
  daysElapsed?: number;
  adherence?: AdherenceInput;
  probe?: ProbeInput;
  blunder?: BlunderInput;
};

export type FalsificationGateResult = {
  verdict: FalsificationVerdict;
  reasons: string[];
};

// Limiares fixados pelo DECISION.md — não são "config", são o protocolo pré-registrado.
const PROBE_PASS_ACCURACY_PERCENT = 70;
const PROBE_MIN_ITEM_COUNT = 10;
const BLUNDER_BASELINE_MIN_GAMES = 20;

export function evaluateFalsificationGate(input: FalsificationGateInput): FalsificationGateResult {
  const { daysElapsed, adherence, probe, blunder } = input;

  // 1) Janela temporal: o gate só se aplica após 30 dias (RETENTION_GATE_DAYS) do início
  // do treino no nó. Antes disso, não há o que avaliar — nem falsificado nem sem-dados.
  if (daysElapsed === undefined || daysElapsed < 30) {
    return {
      verdict: 'aguardando',
      reasons: [
        daysElapsed === undefined
          ? 'Ainda não há data de início registrada para este nó — o relógio de 30 dias não começou.'
          : `Faltam ${String(30 - daysElapsed)} dia(s) para completar a janela de 30 dias do gate.`,
      ],
    };
  }

  // 2) Adesão é pré-condição de qualquer avaliação (desfecho zero). Abaixo do piso, o gate
  // nem tenta julgar retenção — devolve not-evaluable, nunca "passou" nem "falsificou".
  if (adherence !== undefined && adherence.percent < adherence.floorPercent) {
    return {
      verdict: 'nao-avaliavel',
      reasons: [
        `Adesão de ${String(adherence.percent)}% ficou abaixo do piso de ${String(adherence.floorPercent)}% — sem retorno mínimo, o gate não julga retenção.`,
      ],
    };
  }

  // 3) Sem os dois ingredientes do gate duplo, não há veredito possível ainda.
  if (probe === undefined || blunder === undefined) {
    const missing: string[] = [];
    if (probe === undefined) {
      missing.push('a sonda de transferência (10 itens inéditos)');
    }
    if (blunder === undefined) {
      missing.push('a taxa de blunder pós-treino e o baseline de 20 partidas');
    }
    return {
      verdict: 'sem-dados',
      reasons: [`Ainda falta medir: ${missing.join(' e ')}.`],
    };
  }

  // 4) Amostra curta nunca vira falso-positivo: sonda com <10 itens ou baseline com <20
  // partidas força sem-dados, mesmo que os números brutos pareçam favoráveis ou desfavoráveis.
  const reasons: string[] = [];
  let insufficientSample = false;

  if (probe.itemCount < PROBE_MIN_ITEM_COUNT) {
    insufficientSample = true;
    reasons.push(
      `A sonda tem só ${String(probe.itemCount)} item(ns) — precisa de pelo menos ${String(PROBE_MIN_ITEM_COUNT)} para valer como medida (amostra curta nunca vira falso-positivo).`,
    );
  }

  if (blunder.baselineGameCount < BLUNDER_BASELINE_MIN_GAMES) {
    insufficientSample = true;
    reasons.push(
      `O baseline tem só ${String(blunder.baselineGameCount)} partida(s) — precisa de pelo menos ${String(BLUNDER_BASELINE_MIN_GAMES)} para valer como referência (amostra curta nunca vira falso-positivo).`,
    );
  }

  if (insufficientSample) {
    return { verdict: 'sem-dados', reasons };
  }

  // 5) Gate duplo: passa só se AMBOS os critérios sobreviverem. Falha de qualquer um, com
  // dado suficiente, falsifica a hipótese para este nó.
  const probePassed = probe.accuracyPercent >= PROBE_PASS_ACCURACY_PERCENT;
  const blunderPassed = blunder.ratePost < blunder.rateBaseline / 2;

  if (probePassed) {
    reasons.push(
      `Sonda de transferência: ${String(probe.accuracyPercent)}% de acerto em ${String(probe.itemCount)} itens inéditos (meta: >= ${String(PROBE_PASS_ACCURACY_PERCENT)}%).`,
    );
  } else {
    reasons.push(
      `Sonda de transferência falhou: ${String(probe.accuracyPercent)}% de acerto em ${String(probe.itemCount)} itens inéditos, abaixo da meta de ${String(PROBE_PASS_ACCURACY_PERCENT)}%.`,
    );
  }

  if (blunderPassed) {
    reasons.push(
      `Blunder-rate caiu de ${String(blunder.rateBaseline)} (baseline, ${String(blunder.baselineGameCount)} partidas) para ${String(blunder.ratePost)} pós-treino — abaixo de metade do baseline.`,
    );
  } else {
    reasons.push(
      `Blunder-rate não caiu o suficiente: ${String(blunder.ratePost)} pós-treino não ficou abaixo de metade do baseline (${String(blunder.rateBaseline)}, ${String(blunder.baselineGameCount)} partidas).`,
    );
  }

  if (probePassed && blunderPassed) {
    return { verdict: 'passou', reasons };
  }

  return { verdict: 'falsificado', reasons };
}
