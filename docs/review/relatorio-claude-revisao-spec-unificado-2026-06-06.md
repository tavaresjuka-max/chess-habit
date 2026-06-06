# Relatório De Revisão: Spec Unificada — Análise Profunda

- IA/autoria: Claude (DeepSeek V4 Pro) — Diretor Geral
- Nome próprio do relatório: Relatório Consolidação — Revisão do Spec Unificado
- Data da análise: 2026-06-06
- Documento analisado: `docs/superpowers/specs/2026-06-06-chess-tutor-unified-app-design.md`
- Autoria do spec: Claude (claude-opus-4-8) — planejador; Codex — executor
- Sugestão de nome de arquivo: `relatorio-claude-revisao-spec-unificado-2026-06-06.md`

---

## 1. Contexto Deste Relatório

Este documento analisa a spec `2026-06-06-chess-tutor-unified-app-design.md`, encontrada em `docs/superpowers/specs/`. A spec foi gerada por uma instância diferente de Claude (`claude-opus-4-8`) atuando como **planejador**, com Codex como executor. Ela **não passou pelo processo de governança multi-IA** estabelecido no `AGENTS.md` e **não incorpora as decisões do Diretor Geral** emitidas hoje em `relatorio-claude-diretor-geral-consolidado-2026-06-06.md`.

Esta análise segue o mesmo rigor das auditorias anteriores (Codex, Antigravity) e avalia o spec sob três lentes:
1. **Governança** — conformidade com AGENTS.md, ADRs e decisões do Diretor Geral
2. **Produto/Estratégia** — qualidade da tese, escopo, riscos
3. **Técnica** — arquitetura, contratos, testes, implementabilidade

---

## 2. Veredito Executivo

**Recomendação: REJEITAR COMO ORDEM DE EXECUÇÃO. APROVEITAR COMO INSUMO DE DESIGN PARCIAL.**

Esta spec tem **qualidade técnica alta** como exercício de arquitetura de software. A separação Dominio/Infra, os contratos de tipos, o detector de fraquezas determinista e a estratégia de testes são bem pensados. No entanto, ela contém **violações de governança que a inviabilizam como ordem de execução** e **decisões de produto que contradizem a auditoria consolidada**.

**Nota técnica (design/arquitetura):** 7.5/10 — sólida, bem estruturada, testável.
**Nota de governança (conformidade):** 2.0/10 — múltiplas violações de regras inquebráveis e decisões vigentes.
**Nota consolidada:** 4.0/10 — não executável como está.

Se os conflitos forem resolvidos e o escopo alinhado às decisões do Diretor Geral, fragmentos deste spec podem ser reutilizados na Fase 1.

---

## 3. Violações De Governança (P0 — Bloqueiam Execução)

### P0.1 — Viola ADR-001 (Projetos Separados)

> Linha 6 da spec: "Base de codigo: evoluir o app existente em `chessking-tutor`"

**Problema:** A ADR-001, **aceita**, determinou que `chessking-tutor` e `lichess-tutor` são projetos separados. A spec propõe evoluir o código do app pago anterior, o que equivale a reverter a ADR-001 unilateralmente. A própria spec propõe ADR-004 para formalizar essa reversão (linha 338), mas isso não pode ser decidido pelo planejador de uma spec — exigiria uma nova rodada de auditoria e decisão do Diretor Geral.

**Por que importa:** Misturar os codebases reintroduz risco de contaminação de conteúdo proprietário, confusão de marca e arquitetura acoplada ao app pago. As Regras Inquebráveis do `AGENTS.md` dizem: *"Não importar codigo, assets, textos ou conteudo do app pago anterior."* A spec depende do `chessking-tutor/src/domain/types.ts` como ponto de partida (linha 81).

**Severidade:** P0. Bloqueia execução.

### P0.2 — ChessKing Como Fonte Mantém Vínculo Com App Pago

> Linhas 29, 177-180: ChessKing mantido como `SourceId` com registro manual de curso/secao/progresso.

**Problema:** Embora a spec diga "nao copiar conteudo proprietario" (linha 39), manter ChessKing como fonte dentro do app significa que a estrutura de cursos, seções e progressão DO APP PAGO permanece referenciada no código. O `do-not-do.md` é explícito: *"Nao misturar documentos do app pago anterior dentro desta pasta."* Ter `chessking` como `SourceId` no domain types do novo app é precisamente essa mistura.

**Por que importa:** Mesmo usando "apenas nomes", a taxonomia de cursos do ChessKing é propriedade intelectual de terceiros. O app gratuito não deveria referenciar, indexar ou espelhar a estrutura de um produto pago.

**Severidade:** P0. Viola regra inquebrável.

### P0.3 — Sync Com Backend Antes De Validação

> Linhas 256-273, Fase C: Sync via Cloudflare Worker + KV com código compartilhado.

**Problema:** Ambos os consultores (Codex e Antigravity) e o Diretor Geral decidiram que **sync e backend são Fase 2**, após validação do MVP local-first. A spec coloca sync na Fase C (antes de multi-fonte e adaptação), com o argumento de que "o backend é mínimo". Mas o princípio não é sobre tamanho do backend — é sobre **não construir infraestrutura de servidor antes de provar que alguém quer o produto**.

**Por que importa:** Mesmo um Worker + KV "mínimo" introduz deploy, segurança de endpoint, gestão de segredos, domínio, monitoring e suporte. Isso desvia energia da validação de produto. O Diretor Geral foi explícito: "Nenhum backend antes da Fase 2."

**Severidade:** P0. Contradiz decisão executiva do Diretor Geral.

---

## 4. Conflitos Com Decisões Do Diretor Geral (P1 — Exigem Revisão)

### P1.1 — MVP 0-1600, Não 0-1200

> Linha 120: `band: '0-800' | '800-1200' | '1200-1600'` e linha 160: "MVP trava ate 1600"

**Problema:** O Diretor Geral decidiu travar MVP em 0-1200. A faixa 1200-1600 é Fase 3. A spec expande para 0-1600, o que dobra a complexidade pedagógica sem evidência de demanda.

**Severidade:** P1. Escopo maior que o aprovado.

### P1.2 — Chess.com No MVP (Fase D)

> Linhas 170-175, Fase D: importador Chess.com.

**Problema:** O Diretor Geral adiou Chess.com para Fase 2+. A spec o inclui na Fase D.

**Severidade:** P1. Reintroduz fonte antes da hora.

### P1.3 — Professor Lemos Como Coach Central

> Linha 275-281: "Voz do coach (Lemos)" com catálogo de mensagens e reuso do conceito atual.

**Problema:** O Diretor Geral decidiu que Lemos é **tom de voz (microcopy)**, não promessa de coach/personagem. A spec o posiciona como "coach" com catálogo de mensagens por contexto. A diferença é sutil mas relevante: "coach" promete personalização e diálogo; "tom" é estilo de escrita.

**Severidade:** P1. Naming e posicionamento importam.

---

## 5. Análise Técnica (Qualidade Do Design)

Esta seção avalia o spec **como exercício de arquitetura**, independentemente dos conflitos de governança.

### 5.1 Pontos Fortes

**Separação Dominio/Infra (linhas 57-78):** Excelente. A regra "Dominio nao importa Infra" é o padrão-ouro para testabilidade e evolução. O diagrama de camadas é claro e bem desacoplado. Isto deveria ser preservado em qualquer implementação futura.

**Detector de fraquezas determinista (seção 7):** Funções puras, testáveis, com `Signal[] -> Weakness[]`. A tabela de regras com níveis de confiança é pragmática. Usar `confidence` para qualificar sinais fracos (ex.: `low` para derrotas em partidas longas) é uma decisão madura que evita recomendações falsas.

**Contratos de tipo explícitos (seção 5):** `SourceId`, `Destination`, `Signal`, `Weakness`, `PlanBlock`, `DailyPlan` — tipos bem definidos, com responsabilidades claras. O campo `evidence` em `Weakness` (explicação curta do porquê) é um toque de produto excelente.

**Gerador sensível ao tempo (seção 9):** A progressão 5min -> 15min -> 30min -> 60min com estruturas diferentes por duração resolve o problema real de "tenho pouco tempo, o que faço?". A função `generatePlan(profile, weaknesses, sessionMinutes, date) -> DailyPlan` é pura e testável.

**Estratégia de testes (seção 16):** Testes unitários para domínio, testes de contrato para parsers, testes de merge para sync. Gate por fase com lint + test + build. Correto.

**Fases com Definition of Done (seção 14):** Cada fase tem objetivo, alvos e DoD explícito. A Fase 0 (refatorar domínio sem feature nova) é particularmente inteligente — reduz risco de regressão.

### 5.2 Pontos Fracos Técnicos

**`value: unknown` no tipo `Signal` (linha 106):** Perigoso. Um tipo `unknown` no contrato central do domínio enfraquece a segurança de tipos que o resto do spec preza. Cada `kind` deveria ter um payload tipado (ex.: `kind: 'rating'` -> `{rating: number, deviation: number}`). O spec diz "payload pequeno e derivado" mas não tipa. Isto é uma armadilha para bugs em runtime.

**Sync last-write-wins por "seção de topo" (linha 266):** A descrição é vaga. "Preservar sempre `status:'done'`" é uma regra razoável, mas "last-write-wins por secao de topo" sem definir quais seções e como detectar conflitos dentro de uma seção (ex.: dois dispositivos modificam o mesmo bloco) é insuficiente para implementar. O sync doc original (`docs/architecture/sync.md`) tem mais detalhes que este spec ignora.

**Cache do Lichess "TTL de re-fetch ao abrir o app" (linha 168):** Muito vago. Se o usuário mantém o app aberto por horas, os dados envelhecem. Se ele abre e fecha rapidamente, múltiplos fetches em sequência violam rate limit. Precisaria de um TTL explícito (ex.: 30 min) com bypass manual.

**Mapa fraqueza->destino usa slugs hardcoded (seção 8, linhas 210-225):** A spec reconhece que os slugs devem ser validados, mas os lista como se fossem estáveis. Slugs de temas do Lichess mudam. O ideal seria um fetch inicial de `lichess.org/training/themes` para construir o mapa dinamicamente, com fallback para os slugs conhecidos. Isso está nas instruções mas não no contrato.

**Phase C (sync) antes de Phase D (adaptação com feedback):** Ordem questionável. O feedback `easy/ok/hard` é o que gera valor de produto (adaptação real). Sync é conveniência. Construir conveniência antes de valor é priorização invertida.

**Fase A gera plano fixo sem detector (linha 243):** Isso significa que na Fase A o app mostra um plano "falso" — tarefas que não vêm das fraquezas reais do usuário. Para um MVP que está sendo testado com usuários reais, isso pode gerar feedback enganoso ("o plano não faz sentido para mim").

### 5.3 Omissões

- **Sem tratamento de erro de rede:** O spec menciona rate limit mas não descreve o que acontece na UI quando o fetch do Lichess falha (timeout, 429, 503). O usuário vê o quê?
- **Sem estratégia de migração de dados:** A Fase 0 altera tipos do domínio. Se há usuários do `chessking-tutor` com dados em IndexedDB, o que acontece com eles?
- **Sem fallback offline:** A spec diz "local-first" mas o fluxo depende de fetch do Lichess para gerar o plano do dia. Se offline, o plano de ontem é repetido? O app mostra mensagem?
- **Sem critério de saída entre fases:** A Fase A tem DoD técnico (lint+test+build), mas não tem DoD de produto (ex.: "plano fixo foi testado com 5 usuários e entenderam o fluxo").

---

## 6. Análise De Produto E Estratégia

### 6.1 A Tese Unificada

A spec propõe uma tese diferente da auditada: em vez de um app separado focado em Lichess, um **app unificado multi-fonte** que serve Lichess, ChessKing e Chess.com como "fontes de treino" intercambiáveis.

**O que funciona nesta tese:**
- A abstração `Source`/`Destination` é elegante e permite adicionar fontes no futuro sem reescrever o núcleo.
- O detector de fraquezas funciona com sinais de qualquer fonte — isso é reutilização real, não duplicação.
- Para um usuário que JÁ USA ChessKing e Lichess, integrar ambos faz sentido de produto.

**O que não funciona:**
- ChessKing é um produto pago de terceiros. Incluí-lo como fonte primária no app gratuito cria dependência de um produto que o time não controla, não pode auditar e cuja estrutura de cursos pode mudar ou desaparecer.
- A spec diz "não copiar conteúdo", mas a própria seleção de qual curso/seção do ChessKing estudar é uma recomendação baseada em estrutura proprietária. Isso é zona cinzenta legal.
- A unificação aumenta o escopo do MVP significativamente (4 fontes: Lichess, ChessKing, Chess.com, screenshot) quando o consenso da auditoria foi cortar para 1 fonte (Lichess).

### 6.2 O Problema Do Nome

A spec não menciona o problema do nome "Lichess Tutor" nem a decisão de renomeação. O título "Chess Tutor Unificado" sugere que o autor do spec não estava ciente do P0 de marca identificado por ambos os consultores.

---

## 7. Riscos Identificados

| Risco | Classe | Problema | Severidade | Solução |
|---|---|---|---|---|
| Violação de ADR-001 | P0 | Spec evolui código do app pago, revertendo separação decidida | Bloqueante | Manter separação. Este spec não pode evoluir o chessking-tutor. |
| ChessKing como fonte | P0 | App gratuito referencia estrutura de produto pago de terceiros | Bloqueante | Remover ChessKing como SourceId. Se o usuário quiser, que registre manualmente sem estrutura predefinida. |
| Sync antes de validação | P0 | Backend (Worker+KV) introduzido antes de provar demanda | Bloqueante | Sync vai para Fase 2 (pós-MVP). Nenhum backend na Fase 1. |
| Escopo 0-1600 | P1 | Banda maior que a aprovada (0-1200) | Alta | Travar em 0-1200. 1200-1600 é Fase 3. |
| Chess.com na Fase D | P1 | Fonte adicional antes da hora | Alta | Mover Chess.com para Fase 2+. |
| `value: unknown` | P1 | Tipo frágil no contrato central | Média | Tipar payload por `kind`. |
| Slugs hardcoded do Lichess | P2 | Mapa quebra se Lichess mudar URL | Média | Fetch dinâmico de temas com fallback. |
| Sem tratamento de erro/offline | P2 | UX quebrada em rede ruim | Média | Especificar estados de erro e offline no design. |

---

## 8. O Que Deve Ser Aproveitado Deste Spec

Apesar dos conflitos de governança, este spec contém **excelente material de arquitetura** que deve ser preservado e reutilizado quando a Fase 1 for implementada:

1. **Separação Dominio/Infra (seção 4):** O diagrama de camadas e a regra "Dominio nao importa Infra" devem ser o fundamento arquitetural da Fase 1.

2. **Tipos base (seção 5):** `SourceId`, `Destination`, `Signal`, `Weakness`, `PlanBlock`, `DailyPlan` — refinados (com `value: unknown` tipado) — são o contrato de domínio correto.

3. **Detector de fraquezas (seção 7):** As regras deterministas com `confidence` são o caminho certo. Devem ser implementadas como funções puras testáveis.

4. **Gerador sensível ao tempo (seção 9):** A assinatura `generatePlan(profile, weaknesses, sessionMinutes, date) -> DailyPlan` e a progressão 5/15/30/60 são o coração do produto.

5. **Mapa fraqueza->destino (seção 8):** A tabela de Lichess é diretamente reutilizável, com a ressalva de validar slugs dinamicamente.

6. **Estratégia de testes (seção 16):** Testes unitários para domínio + contratos para parsers + gate por fase.

7. **Fase 0 de refatoração (seção 14):** O conceito de uma fase inicial que só mexe em tipos e generaliza destinos, mantendo comportamento existente, é a abordagem correta para começar.

---

## 9. O Que Deve Ser Descartado

1. **A premissa de evoluir o chessking-tutor:** O código do novo app nasce do zero na pasta `lichess-tutor`. Pode aprender com a arquitetura do antigo, mas não herdar seu código.

2. **ChessKing como SourceId:** Remover do domínio. Se algum dia fizer sentido, que seja como plugin externo, não como fonte nativa.

3. **Sync na Fase C:** Mover para após validação do MVP local-first.

4. **Fase D inteira (multi-fonte + adaptação):** Chess.com e screenshots vão para fases posteriores. O feedback `easy/ok/hard` pode ser simplificado para o MVP (ex.: só "fácil/difícil").

5. **ADR-004 como proposta:** A unificação de projetos está rejeitada pelo Diretor Geral. A ADR-004 que este spec propõe não deve ser registrada.

---

## 10. Perguntas Abertas Para O Autor Do Spec

1. Este spec foi gerado antes ou depois de ler os relatórios Codex e Antigravity? Ele parece desconhecer os P0s identificados.
2. O autor do spec sabia da decisão do Diretor Geral sobre separação de projetos (ADR-001)?
3. A pasta `docs/superpowers/` é um canal paralelo de planejamento? Se sim, como se relaciona com a governança do `AGENTS.md`?
4. O Codex listado como executor (linha 6) é o mesmo Codex que atua como Executor no framework de governança? Ele tem autoridade para receber ordens de execução desta spec?

---

## 11. Recomendação Final

**Não executar esta spec como ordem de implementação.**

A spec contém decisões de produto e arquitetura que **não passaram pelo processo de governança** e **contradizem decisões vigentes** do Diretor Geral. Ela foi criada por uma instância de Claude atuando fora do papel estabelecido no `AGENTS.md`.

**Ação recomendada:** Extrair os componentes tecnicamente sólidos (separação Dominio/Infra, tipos, detector de fraquezas, gerador de plano, estratégia de testes) e incorporá-los ao planejamento da Fase 1 sob as restrições do MVP aprovado (local-first, 0-1200, sem ChessKing, sem Chess.com, sem backend, sem sync).

Se o autor do spec deseja propor a unificação como alternativa estratégica, isso deve ser submetido como **nova tese à auditoria**, com a devida justificativa para reverter ADR-001, e passar pelo mesmo escrutínio que o plano original recebeu.

---

## 12. Resumo

| Dimensão | Avaliação |
|---|---|
| Qualidade técnica do design | 7.5/10 — sólido, bem estruturado |
| Conformidade com governança | 2.0/10 — múltiplas violações |
| Viabilidade como ordem de execução | NÃO executável |
| Aproveitamento parcial | ALTO — ~60% do conteúdo técnico é reutilizável |
| Decisão | **Rejeitar execução. Aproveitar fragmentos de design.** |
