import {
  evaluateFalsificationGate,
  type FalsificationGateInput,
  type FalsificationVerdict,
} from '../domain/efficacy/falsificationGate';
import { EpistemicBadge } from './EpistemicBadge';

export type FalsificationPanelProps = {
  // Estado atual do gate para o nó em avaliação (hoje, provavelmente vazio — ver
  // docs/specs/falsification-protocol-DECISION.md). Quando não houver nenhum nó em
  // janela de 30 dias, passe {} (daysElapsed undefined) — o gate devolve 'aguardando'.
  gateInput: FalsificationGateInput;
  // Sinal secundário e NÃO-causal (rating slope pré/pós corrigido por RTM), só exibido
  // quando disponível. Nunca é usado no veredito do gate — é só contexto.
  proxySignal?: {
    correctedDeltaLabel: string;
  };
};

const verdictCopy: Record<FalsificationVerdict, { title: string; tone: string }> = {
  aguardando: { title: 'Em teste', tone: 'falsification-tone-waiting' },
  'sem-dados': { title: 'Ainda sem dado suficiente', tone: 'falsification-tone-nodata' },
  'nao-avaliavel': { title: 'Não avaliável agora', tone: 'falsification-tone-nodata' },
  passou: { title: 'Não falsificado (até agora)', tone: 'falsification-tone-pass' },
  falsificado: { title: 'Falsificado', tone: 'falsification-tone-fail' },
};

// Painel do protocolo de falsificação n=1 — mostra o estado ATUAL do gate duplo (sonda de
// transferência + queda de blunder-rate) para o nó em avaliação, chamando a função pura
// evaluateFalsificationGate com o dado real disponível hoje. Ver
// docs/specs/falsification-protocol-DECISION.md — postura "tenta se falsificar, não se
// provar". 'aguardando' e 'sem-dados' são estados DIFERENTES (importa para quem tem TDAH
// não confundir "ainda não chegou a hora" com "chegou a hora e não há dado"), por isso têm
// classes visuais distintas.
export function FalsificationPanel({ gateInput, proxySignal }: FalsificationPanelProps) {
  const result = evaluateFalsificationGate(gateInput);
  const copy = verdictCopy[result.verdict];

  return (
    <div className="falsification-panel">
      <EpistemicBadge />

      <p className="config-hint">
        Este placar testa se o método sobrevive a duas provas ao mesmo tempo: acertar uma
        sonda com posições nunca vistas e reduzir erros graves do mesmo tema em partidas
        reais. As duas precisam bater — falhar em qualquer uma conta como falha do método
        para este tema, não do aluno. O placar começa vazio de propósito: não há atalho para
        "provar" o método antes da hora.
      </p>

      <div className={`falsification-status ${copy.tone}`} role="status">
        <span className="falsification-status-title">{copy.title}</span>
        <ul className="falsification-reasons">
          {result.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>

      {result.verdict === 'sem-dados' || result.verdict === 'aguardando' ? (
        <p className="config-hint">
          Ainda não há partidas ou sondas suficientes medidas — o placar começa vazio de
          propósito, para não simular um resultado que ainda não existe.
        </p>
      ) : null}

      {proxySignal !== undefined ? (
        <div className="falsification-proxy">
          <p className="config-hint">
            <strong>Proxy global — não é prova:</strong> {proxySignal.correctedDeltaLabel} (sinal
            descritivo agregado do método inteiro, corrigido por regressão-à-média; não é
            atribuível a este tema e nunca substitui o gate duplo acima).
          </p>
        </div>
      ) : null}
    </div>
  );
}
