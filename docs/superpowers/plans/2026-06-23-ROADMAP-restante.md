# Roadmap do que falta — Chess Habit (2026-06-23)

> Artefato para council VERIFICAR. Depois vira PLAN.md por milestone p/ GLM executar.
> Executor: GLM 5.2 (opencode); Opus revisa risco + roda gates + commita. Deploy
> único no fim do ciclo. Gates (test+lint+build+E2E) são o árbitro.

## Estado atual (em produção)
M0 visual, M1 beta, M2a banda automática, M-Hardening, M-Pedagogia, M-Solidez
(DD-Ped6 + cobertura + E2E), fix anti-ratchet (≥30), M-Retenção (acumulação).
Gates: 969 testes unit + 38 E2E, lint, build, a11y 100, Lighthouse Perf 87.

## Inventário do que falta (classificado por executabilidade)

### A. EXECUTÁVEL AGORA (código puro, GLM)
- **R1 — Fix `addDays` GMT-3:** unificar as 2 impl divergentes (UTC em
  `planSessions.ts` vs hora local com off-by-one em `pendingItems.ts`) num único
  util UTC, com teste que reproduz GMT-3. Bug latente real (AGENTS.md + council).
- **R2 — Retenção Fase 2:** (a) heatmap/calendário de consistência (estende a
  faixa de 14 dias para uma visão mensal sóbria, mesma linguagem de acumulação);
  (b) mecanismo do floor crônico — quando a acurácia real fica baixa sob o floor
  por N ciclos, agir SEM exibir regressão.
- **R3 — Polish 9.5:** (a) perf — code-split de rotas não-críticas (React.lazy)
  p/ Lighthouse Perf 87→90+; (b) fechar branches UI restantes (App.tsx,
  Today.tsx ramos de PlacementCard/reload que sobraram).

### B. PRECISA DO DONO (arte/conteúdo — NÃO autônomo)
- **M3a — Cravadas (pins):** currículo tático novo + `diploma-cravada.webp`
  (você gera no ChatGPT Plus). Adicionar diploma-cravada ao style guide M0.
  Bloqueado por arte; o esqueleto de código pode ser preparado, mas o conteúdo
  pedagógico e a arte são seus.

### C. BLOQUEADO (infra externa)
- **M2b — Sync multi-device:** aguarda você provisionar Cloudflare Workers + D1.
  Nota: chave E2EE com seed = `id` imutável do /api/account (não username);
  LWW puro arriscado com clock skew → merge por campo.
- **M4 — Comunidade:** depende de M2b funcional.

### D. REBAIXADO (council)
- **M-Transparência (diagnósticos visíveis):** council 2026-06-23 priorizou
  retenção; diagnóstico é carga cognitiva. Manter adiado salvo decisão nova.

## Sequência proposta para execução autônoma (só A)
1. **R1 (addDays)** — menor, destrava correção de fuso que afeta spacing/expiração.
2. **R2 (Retenção Fase 2)** — maior valor p/ o aluno (retenção), na linha do council.
3. **R3 (Polish 9.5)** — perf + cobertura; fecha o ciclo de qualidade.
Deploy único ao fim de R1+R2+R3.

## Decisão de design pendente (R2 — floor crônico)
Council 1ª rodada divergiu: DeepSeek = dar AGÊNCIA (após N ciclos sem avanço sob
floor, perguntar "quer revisar os fundamentos?"); GLM = SONDA INVISÍVEL
(recalibração: puzzles um estágio abaixo, aluno sente "mais leve", nunca "regrediu").
Opus tende ao invisível (consistente com M-Retenção anti-placar). A confirmar no council.

## ROADMAP FINAL (pós-council, adjudicado — ESTE é o que vale)

Council (DeepSeek + GLM, VERIFICAR): R1 primeiro; sonda invisível > agência;
separar heatmap (cosmético) de floor (lógica de alto risco); cobertura junto do
floor; faltam migração/kill-switch/telemetria/gate-de-perf.

**CORTADO deste ciclo:** heatmap mensal (R2a) — risco de virar "streak
disfarçado" (dias em branco = culpa, o trap que M-Retenção matou). Volta ao
backlog para design cuidadoso (só-cresce, lacunas neutras).

### R1 — Fix `addDays` GMT-3 (mecânico, GLM)
Unificar as 2 impl divergentes num único util UTC (`src/infra/utils/dates.ts` ou
similar), `pendingItems.ts` passa a usá-lo. Teste que reproduz o off-by-one em
GMT-3 (timestamp ~23h local). NOTA migração: `dueAt` é persistido como string —
itens existentes NÃO são reescritos (sem migração de dados); só o cálculo futuro
corrige. Documentar isso. Gates verdes.

### R2b — Floor crônico: sonda invisível (pedagogia — Opus revisa de perto)
Quando a acurácia real fica baixa por N ciclos COM o estágio segurado pelo floor
(feedback expirado, sem ≥30 p/ avançar nem regredir exibido), o plano injeta
puzzles de UM estágio abaixo SEM mudar o estágio persistido/exibido (modulação no
generatePlan, derivada de logs/stats no momento do plano — SEM novo campo no schema).
- Histerese: entra na sonda com acurácia baixa sustentada; sai quando recupera.
- Medidor de acumulação SÓ SOBE (nunca exibe regressão).
- **Kill-switch:** constante/flag p/ desligar a sonda (reversível; lógica invisível
  de risco tem que ser desligável).
- **Telemetria local:** registrar (log local/diagnóstico) quando a sonda atua, p/
  saber se ajuda — não shipar às cegas.
- **Cobertura JUNTO** (council): testes dos caminhos novos nesta fase, não no R3.
- Sem migração de schema (deriva em tempo de plano).

### R3 — Perf + gate anti-regressão (mecânico, GLM/Sonnet)
- Code-split de rotas não-críticas (`React.lazy`/`Suspense`) → Lighthouse Perf 87→90+.
- **Gate de regressão:** registrar o número-alvo de perf e um teste/script que
  falhe se o bundle principal crescer além de um teto (senão 90+ dura 1 sprint).
- Antes de ADICIONAR cobertura: auditar redundância dos 969 testes (app 1-usuário);
  remover dívida em vez de inflar.

### Execução — REALIDADE VERIFICADA (2026-06-23, durante a preparação)
Ao escrever os PLAN.md, verifiquei o código e descobri que o roadmap estava
parcialmente OBSOLETO:
- **R1 (addDays GMT-3): JÁ CORRIGIDO.** `addDays` em pendingItems.ts:51 e
  planSessions.ts:159 usam UTC (`Date.UTC`/`T..Z` + setUTCDate); `getPurgeCutoff`
  (appData.ts:124) usa UTC com comentário do fix B1 do council; recentActivity usa
  meio-dia local DST-safe. Bug refutado (obs 7102) e corrigido (obs 7886, 19/jun).
  NÃO há bug aberto — só duplicação cosmética (2 addDays UTC idênticos em comportamento).
- **R3 code-split: JÁ FEITO.** Config e Progress são `lazy()`+Suspense (App.tsx:41-42).
  Perf 87→90 exigiria outra otimização incerta (difícil verificar sem rodar Lighthouse).
  Resta valor real só no **gate de regressão de bundle** (orçamento de tamanho).
- **R2b: TRAP DESCOBERTO.** `extractThemeStages(plan)` (usePlanLifecycleActions.ts:97)
  PERSISTE o estágio do bloco-tema em profile.themeStages. Logo, baixar o estágio
  do bloco (sonda) VAZA para o estágio exibido — regressão visível e permanente, o
  oposto do "invisível". R2b correto precisa de bloco de APOIO extra (não rebaixar o
  tema) OU um conceito de dificuldade desacoplado do estágio persistido. É decisão de
  design deliberada, não fire-and-forget — e é edge-case raro num app de 1 usuário
  (alerta de over-engineering do GLM). PARADO para decisão do dono.

**Conclusão:** o ciclo de "código que falta" está quase vazio — a dívida real já
foi paga em ciclos anteriores. Itens com valor genuíno restante: (1) R2b com design
correto (bloco de apoio), se o dono quiser; (2) gate de orçamento de bundle (barato).
Resto: bloqueado (M2b/M4) ou precisa do dono (M3a arte).

### Fora do ciclo (registrado)
- R2a heatmap: backlog (design só-cresce).
- M3a cravadas: precisa de arte/conteúdo do dono.
- M2b sync: bloqueado (Cloudflare). M4: depende de M2b.
- M-Transparência: rebaixada.
