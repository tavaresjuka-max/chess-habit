# SPEC — Autópsia de Derrotas (porta de entrada do produto)

- **Status:** SPEC aprovado em direção (dono: "siga", 2026-07-02); implementação em fases
- **Origem:** missão de difusão declarada pelo dono + council DIVERGIR 2026-07-02
  (DeepSeek V4 Pro + GLM 5.2; Fugu Ultra como maestro do rodízio; selo leve do maestro da sessão)
- **Relacionados:** `falsification-protocol-DECISION.md` (postura), ADR-006 (sem engine no app),
  `pedagogical-concept-contracts-blind-retrieval-SPEC.md` (retrieval/SM-2)

## Por quê (a decisão de produto)

O gap-raiz da difusão é **fricção epistêmica**: o app hoje exige que o visitante compre uma
epistemologia antes de sentir valor. O estranho chega com uma dor concreta — **acabou de
perder uma partida** — e vai embora se o primeiro contato for protocolo/gate/rigidez.

A autópsia inverte a porta: *"Cole sua partida do Lichess; eu digo os 2 erros que você vai
repetir se não treinar."* O motor pedagógico inteiro (retrieval cego, SM-2, medição honesta)
já existe e é **reaproveitado** — muda só a origem do item de treino: a posição REAL em que
o aluno errou.

**Duas propriedades técnicas que tornam isso viável já** (selo do maestro):

1. Importar **uma** partida por link = 1 chamada de export — não é o sync em massa que
   ameaça rate-limit (contorna a maior parte do bloqueio D1).
2. Injetar a **posição exata** do erro no SM-2 **dispensa o classificador de temas** em
   posição arbitrária — a posição real É o item; nenhum mapeamento aos 14 nós é necessário.

## Fluxo (produto mínimo)

1. **Landing** (1 tela): proposta em 1 frase + campo "cole o link da sua partida do Lichess".
2. **Guest mode:** sem conta, sem OAuth — partidas públicas exportam sem auth; tudo local
   (a arquitetura local-first já garante).
3. **Análise:** o app busca o export da partida **com a análise do Lichess** (evals/judgments
   `inaccuracy|mistake|blunder` + melhor lance vêm do servidor do Lichess — **zero engine no
   app**, ADR-006 respeitado). Se a partida não tem análise: instrução de 1 toque para
   solicitá-la no Lichess e voltar (mensagem honesta, não silêncio).
4. **Autópsia:** os 1–3 lances com maior dano (queda de avaliação) viram cartões: posição,
   o que foi jogado, o que o Lichess aponta como melhor, e a pergunta do Tavarez ("o que
   você não viu?"). Persona Tavarez dá o tom — professor, não juiz.
5. **Treino imediato:** cada erro vira item de retrieval (tentativa cega na posição antes do
   erro) e entra no SM-2 (`pendingItems`) com origem `autopsy` — revisões em 1/3/7/14 dias
   como qualquer item, com gate de retenção.
6. **Retorno:** "volte depois da próxima partida" + revisões agendadas visíveis.

## Medição (postura: falsificar, não provar)

- O que a autópsia MEDE: retenção da correção via tentativas cegas do SM-2 (instrumento já
  existente) + contagem declarada de "erros graves por partida" nas partidas seguintes
  importadas (proxy agregado, rotulado como proxy).
- O que ela NÃO alega: que o treino causou a melhora. Badge epistemológico (vis-6) presente
  em qualquer número exibido.

## Gate de produto (do Fugu — objetivo, pré-registrado)

30 iniciantes PT-BR sem contato prévio com o projeto, sem explicação verbal do dono.
Em ≤ 2 minutos o usuário deve: entrar como guest → colar link → receber 1–3 erros
treináveis → fazer o 1º exercício → entender quando voltar. Critérios mínimos:

- ≥ **60%** completam o fluxo inicial;
- ≥ **40%** retornam em D7;
- ≥ **25%** completam uma revisão agendada;
- ≥ **10%** compartilham a autópsia ou pedem outra.

Falhou ⇒ não falta pedagogia; falta produto de difusão — iterar a porta, não o motor.

## Gate técnico

- Playwright E2E: landing → guest → import → cartões de erro → 1º exercício → revisão agendada.
- Autópsia útil em < **15s** para partida típica (1 fetch + parse local).
- Rate-limit: cache por gameId; 1 chamada por partida; backoff com mensagem honesta.
- Backup/export do progresso guest em 1 toque (risco local-first: troca de aparelho).
- `npm test`/typecheck/lint verdes; zero violação de ADR-006.

## Decisões de implementação em aberto (para o início da Fase A1)

1. **Parser de lances** (SAN→FEN): exige lib leve (`chessops` ou `chess.js`) como dependência
   nova — única dependência prevista; aprovar na abertura da fase de implementação.
2. **Guest → conta:** como migrar o progresso guest quando o usuário conectar o Lichess
   (merge local já existe; definir UX).
3. **Partidas sem análise:** volume real disso em iniciantes (blitz/bullet sem análise) —
   medir na Fase A1 e decidir se vale pedir análise automaticamente via API autenticada.

## Fases de implementação

- **A1 — Núcleo (sem UI nova de tabuleiro):** fetch por link + extração de erros + cartões
  (reusa o fluxo de puzzle/posição existente). Gate: E2E do fluxo até o cartão.
- **A2 — Injeção no SM-2:** origem `autopsy` em `pendingItems` + revisões + tentativa cega.
  Gate: item de autópsia gradua e agenda como item normal (testes de domínio).
- **A3 — Porta:** landing + guest mode + export de progresso. Gate: fluxo completo ≤ 2 min
  medido; Playwright verde.
- **A4 — Gate de produto:** rodar com 30 iniciantes reais (recrutamento do dono) e publicar
  o resultado — inclusive se falhar (changelog de falsificação).

## Non-goals

- NÃO substitui o curso profundo (14 nós/bandas/diplomas) — a autópsia é a porta; o curso é
  a jornada de quem fica.
- NÃO roda engine no app (ADR-006); toda avaliação vem da análise do Lichess.
- NÃO classifica o erro em tema/nó na v1 (posição exata dispensa; classificador é pesquisa
  futura via spike da D1).
- NÃO exige conta/OAuth para a primeira autópsia.
- NÃO promete "aprenda com seus erros" como eficácia — mede e conta, no máximo.
