import { EpistemicBadge } from './EpistemicBadge';
import { Fold } from './Fold';

// Postura epistêmica do método, em linguagem leiga. Deriva de
// docs/specs/falsification-protocol-DECISION.md — "tenta se falsificar, não
// se provar". Nenhuma frase aqui pode alegar eficácia comprovada; ver o gate
// de grep no fim da Onda 1 (GRUPO F).
export function EpistemicStanceFold() {
  return (
    <Fold concept="linha-base" title="Honestidade do método">
      <EpistemicBadge />

      <h3>O que este app pode dizer</h3>
      <p className="config-hint">
        Ele mede o que você faz, tenta ativamente encontrar sinal de que o método{' '}
        <strong>não</strong> funciona e publica o resultado — inclusive quando o resultado é
        nulo (sem efeito detectado). A meta não é confirmar uma crença, é resistir a ela.
      </p>

      <h3>O que ele não pode dizer</h3>
      <p className="config-hint">
        Não pode alegar eficácia comprovada, relação de causa e efeito garantida, nem que o
        resultado de uma pessoa vale para qualquer outra. Um estudo com poucos dados prova pouco
        — e nunca prova o contrário do que já foi medido.
      </p>

      <h3>Como funciona o teste</h3>
      <p className="config-hint">
        Depois de um tempo mínimo de treino num tema, dois números precisam bater ao mesmo
        tempo: acerto numa sonda com posições nunca vistas e queda de erros graves do mesmo tema
        em partidas reais. Se qualquer um dos dois falhar, a hipótese é considerada falsificada
        para aquele tema — e isso é registrado, não escondido. Sem uso suficiente na janela do
        teste, o resultado fica marcado como <strong>ainda sem dado suficiente</strong>, o que é
        diferente de <strong>em teste</strong> (dado chegando, resultado pendente) e diferente de{' '}
        <strong>falsificado</strong> (o método não se sustentou naquele tema).
      </p>
    </Fold>
  );
}
