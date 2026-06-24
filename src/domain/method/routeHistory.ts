// Roteamento APRENDIDO por aluno (Pilar C, council 2026-06-24, ver SPEC gap1-roteamento).
// O Lichess não deixa controlar dificuldade; o que PODEMOS aprender é qual ROTA (resource)
// de fato MOVEU a fraqueza DESTE aluno num conceito — e preferi-la da próxima vez. Para 1
// aluno (n=1) o histórico por rota é esparso: o cold-start DOMINA. Por isso só sobrepomos a
// ordem atual quando há registro ROBUSTO e majoritariamente POSITIVO; senão devolvemos a
// ordem de hoje — sem fabricar sinal de ruído (mesmo princípio do gate observado do Pilar B).
// Os limiares são o único botão e ficam isolados aqui (ajustáveis depois do council).

export type RouteCandidate = { id: string };

// Um desfecho de rota: usei `routeId` para o conceito `weaknessTag` e, depois da sessão, o
// score de fraqueza CAIU (melhorou) ou não. movedScore = a rota funcionou para este aluno.
export type RouteOutcome = {
  routeId: string;
  weaknessTag: string;
  movedScore: boolean;
};

// n=1: amostra pequena, mas > 1 para não preferir uma rota por um único acerto de sorte.
// Abaixo disso a rota não é elegível a sobrepor a ordem atual (segue no cold-start).
const MIN_ROUTE_OUTCOMES = 3;
// Só sobrepõe a ordem atual a rota que moveu o score na MAIORIA das vezes (> 50%).
const MIN_SUCCESS_RATE = 0.5;

// Escolhe a rota a seguir entre `candidates` (já na ordem de preferência atual). `history`
// é a lista de desfechos do aluno; `weaknessTag` é o conceito que estamos roteando agora.
// Devolve `candidates[0]` (ordem atual) salvo quando alguma rota tem histórico robusto e
// majoritariamente positivo PARA ESTE CONCEITO — aí prefere a de melhor taxa de sucesso.
export function pickRouteByHistory(
  candidates: RouteCandidate[],
  history: RouteOutcome[],
  weaknessTag: string,
): RouteCandidate | undefined {
  const coldStart = candidates[0];
  if (coldStart === undefined) {
    return undefined;
  }

  const forConcept = history.filter((outcome) => outcome.weaknessTag === weaknessTag);

  let best = coldStart;
  // Começa no limiar de sucesso: só supera quem moveu o score na maioria das vezes.
  let bestRate = MIN_SUCCESS_RATE;

  for (const candidate of candidates) {
    const uses = forConcept.filter((outcome) => outcome.routeId === candidate.id);
    if (uses.length < MIN_ROUTE_OUTCOMES) {
      continue; // sinal insuficiente para este aluno — não sobrepõe a ordem atual
    }

    const moved = uses.filter((outcome) => outcome.movedScore).length;
    const rate = moved / uses.length;

    if (rate > bestRate) {
      best = candidate;
      bestRate = rate;
    }
  }

  return best;
}
