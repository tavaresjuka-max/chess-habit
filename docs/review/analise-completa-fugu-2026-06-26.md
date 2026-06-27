# Análise Completa do App — Lichess Tutor / Chess Habit

Data: 2026-06-26  
Analista: fugu-ultra via opencode  
Escopo: auditoria somente leitura de produto, pedagogia, engenharia, UX, privacidade, PWA, testes e plano.

---

# 0) Sumário executivo

**Nota geral do app: 8.0/10.**  
[FATO] O app já é um PWA local-first funcional, com domínio puro, integração Lichess/Chess.com, backup, OAuth PKCE, currículo adaptativo, 1108 testes unitários e 38 smokes Playwright verdes.  
[INFERÊNCIA] O principal teto hoje não é “quebrado técnico”, é **rigor pedagógico/semântico**: muito do método está bem estruturado, mas ainda depende de heurísticas e conteúdo curado/manual antes de virar prova forte de ensino.  
[OPINIÃO] O produto está acima de MVP: é um beta pessoal forte, mas ainda não é “estado-da-arte” porque retenção, eficácia e currículo alto não estão calibrados por dados reais.

**Pesos usados em todas as áreas:**  
Correção/robustez 25% · Valor pedagógico/UX 25% · Rigor de evidência 20% · Coerência com visão 15% · Manutenibilidade/risco 15%.

Motivo: para este app, pedagogia + dados pesam mais que estética; mas storage/privacidade continuam críticos.

## Tabela de notas por área

| Área | Agora | Teto |
|---|---:|---:|
| A. Visão & posicionamento | 8.4 | 9.4 |
| B. Pedagogia & currículo | 7.1 | 9.2 |
| C. Diagnóstico & coach | 7.8 | 9.0 |
| D. Motor de plano & agendamento | 8.2 | 9.1 |
| E. Repetição espaçada & retenção | 7.0 | 9.0 |
| F. Onboarding & placement | 8.0 | 9.0 |
| G. Tela Hoje | 8.6 | 9.3 |
| H. Tela Progresso | 8.1 | 9.0 |
| I. Gamificação | 8.0 | 9.0 |
| J. Persona & voz | 7.8 | 9.0 |
| K. Integração Lichess | 8.5 | 9.2 |
| L. Integração Chess.com | 7.8 | 8.6 |
| M. Dados, storage & backup | 8.8 | 9.4 |
| N. Privacidade & segurança | 8.2 | 9.0 |
| O. PWA & offline | 8.5 | 9.2 |
| P. Acessibilidade | 8.3 | 9.0 |
| Q. Design visual & hierarquia | 7.7 | 9.0 |
| R. Arquitetura & qualidade | 8.5 | 9.2 |
| S. Testes & gates | 8.4 | 9.2 |
| T. Medição de eficácia | 6.8 | 8.8 |
| U. i18n & conteúdo | 6.6 | 8.5 |
| V. Retorno após ausência | 8.0 | 9.1 |

## Top 5 forças

1. [FATO] **Local-first com backup/restore sério**: export transacional, checksum e restore validado `src/infra/storage/appData.ts:350-394`, `src/infra/storage/backup.ts:268-329`.
2. [FATO] **Loop Hoje é acionável**: próximo bloco fica no hero, com motivo/tarefa/stop rule `src/ui/Today.tsx:237-245`, `src/ui/PlanBlockCard.tsx:181-196`.
3. [FATO] **Lichess-first sem virar app de jogar**: destinos são URLs Lichess allowlisted `src/app/externalOpen.ts:25-27`, `src/infra/lichess/urlPolicy.ts:1-9`.
4. [FATO] **Gates fortes**: `npm run lint`, `npm test` 107 arquivos/1108 testes, `npm run build`, `npm run smoke:pwa` 38/38 verdes.
5. [FATO] **Currículo já tem spine e acoplamento tema→recurso**: fases 0→autonomia `src/domain/curriculum/curriculum.ts:51-196`; skill nodes ligam weakness→themes→resources `src/domain/sources/catalogSkills.ts:22-220`.

## Top 5 riscos/críticos

1. [Importante] **Currículo alto ainda é esboço**: fase autonomia tem `weeks: []` e “detalhes chegam” `src/domain/curriculum/curriculum.ts:188-195`; bandas altas reutilizam conteúdo improving `src/domain/bands.ts:21-29`.
2. [Importante] **Retenção não é SM-2/FSRS real**: escada fixa `[1,3,7,14]`, EF estreito e gate 30d fixo `src/domain/method/pendingItems.ts:7`, `:12-16`, `:91-96`.
3. [Importante] **Eficácia é descritiva, não causal**: código alerta para não usar slope como prova `src/domain/efficacy/ratingSlopes.ts:9-12`; baseline mede método, não aluno `src/domain/metrics/efficacyBaseline.ts:4-6`.
4. [Menor→Importante] **Warnings passam verdes**: mock incompleto em `src/app/useDiagnosisActions.test.tsx:27-29` aciona `console.warn` capturado em `src/app/useDiagnosisActions.ts:289-304`; teste de data inválida gera `NaN-NaN-NaN`.
5. [Importante] **Identidade/persona divergente**: prompt/projeto fala Professor Lemos, UI exibe “Professor Tavarez” `src/ui/TutorCard.tsx:57-63`; app identity agora é `Chess Habit` `src/config/appIdentity.ts:1-12`.

## As 3 apostas de maior ROI

1. **Pedagogia semântica auditável:** transformar cada conceito em contrato `explicar → recuperar → transferir → reter`, com golden tests por tema.
2. **Retenção calibrada por carga:** evoluir de escada fixa para modelo FSRS-inspired com limite diário e simulação de backlog.
3. **Eficácia honesta v2:** instrumentar coortes locais, marcos pré-registrados e análise within-subject sem alegar causalidade indevida.

---

# 1) Análise por área

## A. Visão & posicionamento de produto

**Contexto.** [FATO] A visão é “organizar estudo, não jogar xadrez”: `docs/VISAO.md:26-34`; o app abre treino no Lichess e não cria tabuleiro próprio `src/ui/PlanBlockCard.tsx:362-375`.

**Críticas.**
- [Importante] A promessa “não decida sozinho” é bem cumprida na Hoje, mas o onboarding ainda pede faixa manual antes da avaliação `src/ui/Onboarding.tsx:205-220`. Métrica: tempo até 1º treino e % usuários que pulam avaliação.
- [Menor] Nome público mudou para `Chess Habit`, mas muitos docs ainda falam Lichess Tutor/Rotina/Professor Lemos. Evidência: `src/config/appIdentity.ts:1-12`, `docs/VISAO.md:1`. Gate: teste documental/grep de identidade.

**Elogios.**
- [FATO] O produto evita virar tabuleiro: só abre Lichess externo `src/app/externalOpen.ts:5-27`.
- [FATO] A UI explicita dados reais e hipóteses, não promessa de rating `src/ui/Progress.tsx:63-65`, `:258-259`.

**Nota.** 8.4 — C 8.8 · UX 8.6 · Evid 8.0 · Coer 8.2 · Mant 8.4. Agora vs teto: falta unificar identidade e medir time-to-value.

**Estado-da-arte.** Lichess e Listudy mantêm escopo claro: jogar/treinar no ambiente próprio; Listudy declara spaced repetition como proposta central. Princípio: foco estreito + loop repetível.

**Propostas.**
1. P1: “Identity sweep” único (`APP_NAME`, persona, docs públicos). Impacto médio, esforço baixo, reversível. Aceite: zero divergências via grep.
2. P1: métrica local de 1º valor. Aceite: registrar tempo até primeiro bloco concluído sem PII.

## B. Pedagogia & currículo

**Contexto.** [FATO] Há spine de 8 bandas, incluindo teto organizador `src/domain/bands.ts:6-17`; currículo cobre fundamentos, tática nomeada, cálculo/plano e autonomia `src/domain/curriculum/curriculum.ts:51-196`.

**Críticas.**
- [Importante] O caminho 1200+ é reconhecidamente raso: `weeks: []` e nota de escopo futuro `src/domain/curriculum/curriculum.ts:188-195`. Teste: snapshot curricular exigindo semanas/objetivos para cada banda alta.
- [Importante] O conteúdo é mais “roteamento para recursos” que aula conceitual profunda; skill nodes têm `lemosCue`, temas e recursos `src/domain/sources/catalogSkills.ts:22-220`, mas não há banco de exemplos/goldens por conceito. Métrica: avaliação cega de conceito antes/depois.
- [Menor] Alguns thresholds são hard-coded: mastery 80/50 `src/domain/method/mastery.ts:19-35`.

**Elogios.**
- [FATO] Há acoplamento real conceito→retrieval: garfo aponta Practice/video/puzzle `src/domain/sources/catalogSkills.ts:47-56`; seletor prioriza puzzle em retrieval `src/domain/sources/resourceSelector.ts:41-50`.
- [FATO] Diplomas têm critério mensurável: 80% em 30 tentativas por seção `src/domain/method/diplomas.ts:8-9`, `src/domain/method/evaluateDiplomas.ts:54-56`.

**Nota.** 7.1 — C 7.2 · UX 7.4 · Evid 6.4 · Coer 7.8 · Mant 6.8. Teto: 9.2 com currículo alto + provas semânticas.

**Estado-da-arte.** Lichess Puzzle Themes oferece taxonomia ampla e pública; RetrievalPractice.org define retrieval como estratégia de aprendizagem, não avaliação; Listudy usa repetição sistemática para openings/tactics/endgames. Gap: o app usa a taxonomia, mas ainda não prova aprendizagem conceitual.

**Propostas.**
1. P1: contratos por conceito (`fork`, `pin`, `hangingPiece`): conceito, Lichess themes, critério de retenção. Aceite: golden test por conceito.
2. P2: preencher 1200–2200 com trilhas de cálculo/finais/conversão. Aceite: nenhuma banda com `weeks: []`.

## C. Diagnóstico & coach

**Contexto.** [FATO] Diagnóstico usa puzzle themes e fraquezas agregadas `src/domain/coach/diagnosis.ts:83-106`; detector de fraquezas usa sinais Chess.com/Lichess/manuais `src/domain/weakness/detectWeaknesses.ts:152-278`.

**Críticas.**
- [Importante] Thresholds são plausíveis, mas calibrados manualmente: `MIN_SCORE=0.5`, tema mínimo 3 tentativas/2 perdas/50% loss `src/domain/coach/diagnosis.ts:11-14`. Métrica: precisão/recall contra revisão manual de sessões.
- [Importante] Primeiro tema de puzzle com erro retorna uma fraqueza e para `src/domain/weakness/detectWeaknesses.ts:91-114`; pode perder múltiplas fraquezas simultâneas. Teste: themeStats com dois temas fortes deve gerar prioridade ranqueada.
- [Menor] O coach pergunta bem quando falta evidência `src/domain/coach/diagnosis.ts:105`, mas respostas são só 3 botões `src/ui/TutorCard.tsx:145-183`.

**Elogios.**
- [FATO] Boa trava de evidência: sem score/confiança suficiente, pergunta em vez de afirmar `src/domain/coach/diagnosis.ts:90-105`.
- [FATO] Sinais antigos decaem em 90 dias `src/domain/weakness/detectWeaknesses.ts:39-53`.

**Nota.** 7.8 — C 7.8 · UX 8.2 · Evid 7.0 · Coer 8.0 · Mant 8.0. Teto: 9.0 com validação contra dados reais.

**Estado-da-arte.** Aimchess/Chess.com usam dashboards de fraqueza a partir de partidas; Lichess Dashboard expõe improvement areas. Princípio: diagnóstico deve ser probabilístico e acionável, não sentença.

**Propostas.**
1. P1: registrar `diagnosisBasis` e “por que este tema venceu”. Aceite: UI mostra fonte+limiar.
2. P2: ranking multi-fraqueza por tema. Aceite: teste com 3 temas retorna top-N estável.

## D. Motor de plano & agendamento

**Contexto.** [FATO] `generatePlan` decide fraqueza, estágio, interleaving, pendências e trilha `src/domain/plan/generatePlan.ts:125-270`; time budget varia por 5/15/30/60 min `src/domain/plan/timeBudget.ts:10-33`.

**Críticas.**
- [Menor] O gerador está ficando grande: `generatePlan.ts` tem 876 linhas; risco de acoplamento entre pedagogia, scheduler e copy. Métrica: complexidade ciclomática/partição por responsabilidade.
- [Importante] Avanço de estágio exige 30 tentativas para promover `src/domain/plan/generatePlan.ts:69-75`, mas regressão pode ocorrer com 3 tentativas `:155-173`; é conservador, mas assimétrico. Teste: simular variância baixa amostra.
- [Menor] Time budgets são fixos `src/domain/plan/timeBudget.ts:10-33`; não há adaptação por fadiga/retorno exceto notas de retorno.

**Elogios.**
- [FATO] Scheduler híbrido existe: aquisição sem pool e pós-aquisição com interleaving `src/domain/plan/schedulerConstants.ts:7-14`, `src/domain/plan/generatePlan.ts:177-183`.
- [FATO] Protege TDAH limitando pool a 2 temas `src/domain/plan/schedulerConstants.ts:13-14`.

**Nota.** 8.2 — C 8.2 · UX 8.4 · Evid 7.8 · Coer 8.6 · Mant 7.8. Teto: 9.1 com modularização e simulação de carga.

**Estado-da-arte.** Anki limita reviews/dia para evitar backlog; interleaving é princípio de ciência de aprendizagem. Gap: há interleaving, mas não há simulação de carga futura.

**Propostas.**
1. P1: simulador de carga semanal. Aceite: snapshot “pendências futuras <= limite”.
2. P2: extrair policy objects do `generatePlan`. Aceite: testes existentes intactos.

## E. Repetição espaçada & retenção

**Contexto.** [FATO] Existe escada SR com `easeFactor`, pendências e gate de retenção 30d `src/domain/method/pendingItems.ts:7`, `:12-16`, `:284-295`.

**Críticas.**
- [Importante] Não é SM-2 completo nem FSRS: intervalos fixos `[1,3,7,14]` escalados por EF `src/domain/method/pendingItems.ts:91-96`. Métrica: retenção real por tema após 30/60/90 dias.
- [Importante] `easy` mexe em EF e pula níveis, duplicando o sinal de facilidade `src/domain/method/pendingItems.ts:181-185`. Teste: comparar carga/retention em simulação.
- [Menor] Gate 30d é bom, mas fixo e não calibrado `src/domain/method/pendingItems.ts:16`.

**Elogios.**
- [FATO] Há retenção real antes de graduar: `retentionPending` e reaprendizado se falhar `src/domain/method/pendingItems.ts:206-224`, `:284-295`.
- [FATO] Data de pendingItems foi corrigida para UTC, reduzindo risco GMT-3 `src/domain/method/pendingItems.ts:60-78`.

**Nota.** 7.0 — C 7.2 · UX 7.6 · Evid 6.0 · Coer 7.4 · Mant 6.8. Teto: 9.0 com calibração e carga sustentável.

**Estado-da-arte.** Anki FSRS modela retenção desejada e carga; Anki alerta que retenção alta aumenta reviews drasticamente. Princípio: scheduler deve otimizar retenção **e** carga.

**Propostas.**
1. P1: workload cap e backlog policy. Aceite: reviews/dia nunca excedem limite configurado.
2. P2: FSRS-inspired model, sem prometer FSRS completo. Aceite: simulação bate metas de retenção.

## F. Onboarding & placement

**Contexto.** [FATO] Funil é `welcome → accounts → importing → questions → plan` `src/ui/Onboarding.tsx:18`, `:58-100`.

**Críticas.**
- [Importante] Usuário informa faixa manual antes de placement `src/ui/Onboarding.tsx:205-220`; pode ancorar errado. Teste: fluxo sem faixa manual obrigatório.
- [Menor] Calibração por puzzles é autorrelato se não houver OAuth `src/ui/PlacementCard.tsx:252-280`, com confiança elevada para self-report `src/domain/placement/placement.ts:133-153`.
- [Menor] Rating informado pesa 70% `src/domain/placement/placement.ts:109-112`; bom, mas não distingue plataforma/time-control.

**Elogios.**
- [FATO] Placement combina questionário + rating externo + calibração `src/domain/placement/placement.ts:99-154`.
- [FATO] Funil sobrevive a OAuth via sessionStorage `src/ui/App.tsx:21-28`, `src/app/oauthFlow.ts:40-46`.

**Nota.** 8.0 — C 8.0 · UX 8.2 · Evid 7.4 · Coer 8.4 · Mant 8.0. Teto: 9.0.

**Estado-da-arte.** Apps de aprendizagem reduzem atrito até 1º valor; rating real como âncora é melhor que autorrelato puro.

**Propostas.**
1. P1: “Não sei minha faixa” como default. Aceite: onboarding completo sem tocar select de faixa.
2. P2: diferenciar rating Lichess/Chess.com/perf. Aceite: placement reasons explicitam fonte.

## G. Tela Hoje

**Contexto.** [FATO] Hoje escolhe hero block: ativo ou primeiro pendente `src/ui/Today.tsx:237-245`; renderiza TutorCard antes da ação `src/ui/Today.tsx:391-405`.

**Críticas.**
- [Menor] Há muita informação lateral/dobras; para TDAH pode virar ruído após o hero `src/ui/Today.tsx:487-729`. Métrica: cliques até abrir Lichess.
- [Menor] O usuário pode concluir sem abrir Lichess; isso é útil para treino externo, mas facilita “gaming” de tempo. Teste: logs diferenciam `manual done` vs `opened`.
- [Menor] Emoji no chip de diploma `src/ui/PlanBlockCard.tsx:174` destoa do tom sóbrio e da regra usual de evitar emoji.

**Elogios.**
- [FATO] Bloco mostra motivo, tarefa, nota do coach e stop rule `src/ui/PlanBlockCard.tsx:181-196`.
- [FATO] Pular tem confirmação e foco seguro `src/ui/PlanBlockCard.tsx:52-61`, `:396-430`.

**Nota.** 8.6 — C 8.6 · UX 8.8 · Evid 8.2 · Coer 8.8 · Mant 8.4. Teto: 9.3.

**Estado-da-arte.** Duolingo/Anki reduzem decisão por sessão: “faça o próximo item”. O app já faz isso bem.

**Propostas.**
1. P1: métrica “hero-to-lichess”. Aceite: evento local sem PII.
2. P2: modo ultra-foco escondendo aside por padrão no mobile. Aceite: a11y/smoke verde.

## H. Tela Progresso

**Contexto.** [FATO] Progresso mostra ritmo, habilidades, trilhas, diplomas, baseline e fraquezas `src/ui/Progress.tsx:68-259`.

**Críticas.**
- [Importante] Skill map usa nomes crus de temas (`entry.theme`) `src/ui/Progress.tsx:115-118`; falta tradução pedagógica. Teste: todos os temas exibidos têm label PT-BR.
- [Menor] Baseline “revisão em julho de 2026” está hard-coded na copy `src/ui/Progress.tsx:241`.
- [Menor] Sem gráficos de evolução por faixa ainda; mostra snapshot e tendência semanal.

**Elogios.**
- [FATO] Copy evita cassino: “Medem o método, não você” `src/ui/Progress.tsx:224-242`.
- [FATO] Habilidade é acurácia real por tema `src/domain/metrics/progressOverview.ts:41-88`.

**Nota.** 8.1 — C 8.0 · UX 8.1 · Evid 8.0 · Coer 8.5 · Mant 7.9. Teto: 9.0.

**Estado-da-arte.** Anki mostra retenção e carga; Chessable/Chess.com mostram progresso por curso/tema. Gap: falta linha temporal pedagógica.

**Propostas.**
1. P1: labels PT-BR para todos os Lichess themes. Aceite: teste de cobertura label.
2. P2: tendência por tema 30/90 dias. Aceite: gráfico textual com dados reais.

## I. Gamificação

**Contexto.** [FATO] Conquistas são esforço/hábito, nunca rating `src/domain/badges/evaluateAchievements.ts:1-5`.

**Críticas.**
- [Menor] “Semana Inteira” pode virar mini-streak; exige 5 dias na semana `src/domain/badges/evaluateAchievements.ts:170-180`. Métrica: retorno após falha de semana.
- [Menor] Diplomas não regridem após earned `src/domain/method/evaluateDiplomas.ts:29-35`; bom para motivação, mas reduz validade longitudinal.
- [Importante] Diploma pode ser “treinado no tema” até bater 80/30; risco de gaming limitado, mas real `src/domain/method/diplomas.ts:8-9`.

**Elogios.**
- [FATO] Badges têm qualidade acoplada: primeira hora em 3 dias, pendências com 4 revisões, calibrado com confiança `src/domain/badges/evaluateAchievements.ts:142-168`.
- [FATO] Diplomas usam acurácia por tema Lichess, não rating `src/domain/method/evaluateDiplomas.ts:54-64`.

**Nota.** 8.0 — C 8.0 · UX 8.3 · Evid 7.6 · Coer 8.6 · Mant 7.5. Teto: 9.0.

**Estado-da-arte.** Duolingo usa streak; Anki usa retenção/carga. Melhor princípio aqui: recompensa esforço + aprendizagem, sem punição.

**Propostas.**
1. P1: diploma exigir mistura de temas + replay de retenção. Aceite: seção só passa com 30 tentativas + retenção posterior.
2. P2: badge de retorno, não só semana. Já existe `retorno-de-ouro` `src/domain/badges/evaluateAchievements.ts:36-40`; destacar mais na UI.

## J. Persona “Professor Lemos” & voz

**Contexto.** [FATO] O coach gera mensagens com banlist `src/domain/coach/sessionMessage.ts:12`; UI exibe “Professor Tavarez” `src/ui/TutorCard.tsx:57-63`.

**Críticas.**
- [Importante] Divergência de persona: docs/prompt dizem Lemos, UI Tavarez. Gate: teste de identidade de persona.
- [Menor] Banlist inclui “parabéns” `src/domain/coach/sessionMessage.ts:12`; bom contra bajulação, mas pode limitar reforço positivo natural.
- [Menor] Respostas ao tutor são 3 categorias `src/ui/TutorCard.tsx:145-183`; falta anotação livre nesse ponto.

**Elogios.**
- [FATO] Tom evita bronca: feedback hard diz revisar amanhã `src/ui/PlanBlockCard.tsx:511-512`.
- [FATO] Retorno após pausa é tratado sem vergonha via achievements/copy `src/domain/badges/evaluateAchievements.ts:36-40`.

**Nota.** 7.8 — C 7.7 · UX 8.3 · Evid 7.2 · Coer 7.2 · Mant 8.2. Teto: 9.0.

**Estado-da-arte.** Coaching efetivo usa feedback específico, sem humilhação. O app acerta o tom; precisa consolidar identidade.

**Propostas.**
1. P0: decidir Lemos vs Tavarez e aplicar. Aceite: grep único.
2. P1: voice snapshot tests. Aceite: frases proibidas não aparecem.

## K. Integração Lichess

**Contexto.** [FATO] OAuth usa PKCE, state e escopos mínimos `src/infra/lichess/oauth.ts:24-44`; app valida state `src/app/oauthFlow.ts:64-73`.

**Críticas.**
- [Menor] `urlPolicy` só permite hostname exato `lichess.org` `src/infra/lichess/urlPolicy.ts:1-9`; isso bloqueia subdomínios legítimos, mas é seguro.
- [Menor] `puzzleActivityUrl` usa `before` e filtra localmente since/until `src/infra/lichess/puzzleActivity.ts:59-63`, `:160-170`; pode baixar mais do que precisa.
- [Menor] Study PGN transiente inclui destino e comentários do plano `src/infra/lichess/study.ts:170-180`; ok, mas revisar se algum texto sensível entrar em `block.reason`.

**Elogios.**
- [FATO] 429 vira erro com espera mínima 60s `src/infra/lichess/puzzleActivity.ts:26-33`, `:51-53`.
- [FATO] Study é privado, não cloneable/shareable/chat nobody `src/infra/lichess/study.ts:83-92`.

**Nota.** 8.5 — C 8.6 · UX 8.5 · Evid 8.4 · Coer 8.8 · Mant 8.2. Teto: 9.2.

**Estado-da-arte.** Lichess API Tips exige uma requisição por vez e 1 min após 429. O app segue via queue `src/infra/http/providerQueue.ts:23-69`.

**Propostas.**
1. P1: teste liveness periódico de endpoints oficiais. Aceite: smoke read-only com mocks+contract.
2. P2: sanitizar comentários de Study por allowlist. Aceite: nenhum campo de usuário livre no PGN.

## L. Integração Chess.com

**Contexto.** [FATO] Usa PubAPI read-only `/stats` e arquivos mensais `src/infra/chesscom/chesscomClient.ts:52-79`.

**Críticas.**
- [Importante] Sinais de abertura/accuracy dependem de PGN transiente e accuracies quando existem `src/infra/chesscom/extractSignals.ts:290-355`; cobertura semântica é limitada pela API. Métrica: taxa de jogos sem `accuracies`.
- [Menor] Chess.com 429 ignora Retry-After e usa default 60s `src/infra/chesscom/chesscomClient.ts:148-150`; providerQueue já entende Retry-After, mas erro específico não.
- [Menor] `filterRecentArchives` existe, mas decisão atual lê histórico completo `src/infra/chesscom/chesscomClient.ts:114-119`.

**Elogios.**
- [FATO] Acesso serial via `chesscomFetch` `src/infra/chesscom/chesscomClient.ts:3`, alinhado à PubAPI.
- [FATO] PGN não é persistido; só tags derivadas são extraídas em memória `src/infra/chesscom/extractSignals.ts:290-355`.

**Nota.** 7.8 — C 7.8 · UX 7.5 · Evid 7.6 · Coer 8.4 · Mant 7.7. Teto: 8.6.

**Estado-da-arte.** Chess.com PubAPI declara read-only, dados públicos e recomenda serial access; o app respeita.

**Propostas.**
1. P1: registrar cobertura dos campos (`accuracies`, `eco`, `end_time`). Aceite: relatório local por import.
2. P2: user-agent/contact se PubAPI permitir no ambiente. Aceite: header testado.

## M. Dados, storage & backup

**Contexto.** [FATO] Dexie tem schema versionado v1–v11 `src/infra/storage/db.ts:117-197`; export/import usa backup versionado `src/infra/storage/backup.ts:3-42`.

**Críticas.**
- [Menor] Checksum cai para FNV-1a em contexto inseguro `src/infra/storage/backup.ts:59-89`; adequado para corrupção acidental, não adulteração.
- [Menor] Backup não é criptografado; para local-first pessoal ok, mas P4 público exigirá E2EE.
- [Menor] `createRecordId` usa Math.random fallback se `randomUUID` ausente `src/infra/storage/appData.ts:581-589`; baixo risco, mas sync futuro prefere crypto forte.

**Elogios.**
- [FATO] Restore é transacional e valida shape antes de limpar/gravar `src/infra/storage/appData.ts:437-524`.
- [FATO] OAuth tokens não entram no backup exportado: export lista tabelas e omite `lichessOAuthTokens` `src/infra/storage/appData.ts:350-382`.

**Nota.** 8.8 — C 9.0 · UX 8.6 · Evid 8.8 · Coer 9.0 · Mant 8.5. Teto: 9.4.

**Estado-da-arte.** PWA local-first precisa backup explícito e restore testado; o app está forte aqui.

**Propostas.**
1. P1: opção “backup criptografado com senha” antes de P5. Aceite: arquivo ilegível sem senha.
2. P1: teste de restore com banco grande/quota. Aceite: erro amigável e sem perda.

## N. Privacidade & segurança

**Contexto.** [FATO] CSP existe em Vite e Vercel `vite.config.ts:12-13`, `vercel.json:28-29`; privacidade resumida na UI `src/config/appIdentity.ts:17-23`.

**Críticas.**
- [Importante] `style-src 'unsafe-inline'` permanece `vite.config.ts:12-13`, `vercel.json:28-29`; documentado, mas ainda reduz CSP. Gate: remover quando `sonner` permitir.
- [Menor] `SOURCE_CODE_URL` e `FEEDBACK_URL` apontam GitHub público `src/config/appIdentity.ts:12-25`; se repo privado/URL muda, footer quebra expectativa.
- [Menor] Sync Cloudflare contract ainda diz “eventos pequenos e sinais derivados”, mas sem E2EE detalhado no contrato `plugins/cloudflare-sync/CONTRACT.md:13-30`.

**Elogios.**
- [FATO] OAuth escopos restritos a `puzzle:read` e `study:write` `src/infra/lichess/oauth.ts:24`, `src/app/oauthFlow.ts:159-160`.
- [FATO] URL externa só Lichess HTTPS `src/app/externalOpen.ts:25-27`, `src/infra/lichess/urlPolicy.ts:1-9`.

**Nota.** 8.2 — C 8.2 · UX 8.0 · Evid 8.4 · Coer 8.8 · Mant 7.6. Teto: 9.0.

**Estado-da-arte.** Local-first + token minimization + CSP + noindex é boa base; P5 exige docs públicas e E2EE.

**Propostas.**
1. P1: threat model P5 público. Aceite: documento com assets/actors/gates.
2. P1: CSP sem unsafe-inline ou justificativa automatizada. Aceite: csp.spec verde.

## O. PWA & offline

**Contexto.** [FATO] vite-plugin-pwa precacheia shell/assets `vite.config.ts:15-61`; ReloadPrompt avisa atualização `src/ui/ReloadPrompt.tsx:7-41`.

**Críticas.**
- [Menor] Precache inclui muitos assets/artes; build mostra 3.2MB precache. Métrica: Lighthouse/PWA install time em Android.
- [Menor] Atualizar SW imediatamente pode recarregar em meio a estado mental; há botão “Depois” `src/ui/ReloadPrompt.tsx:29-37`, bom.
- [Menor] Offline shell é testado, mas não fluxo offline com escrita IndexedDB prolongada.

**Elogios.**
- [FATO] Smoke offline real passou em desktop/mobile; teste cobre reload offline `e2e/pwa-offline.spec.ts:7-40`.
- [FATO] Build sem sourcemaps `vite.config.ts:91-94`.

**Nota.** 8.5 — C 8.6 · UX 8.4 · Evid 8.8 · Coer 8.5 · Mant 8.2. Teto: 9.2.

**Estado-da-arte.** PWA confiável precisa cache shell + update prompt + testes em build real. O app atende.

**Propostas.**
1. P1: smoke offline de treino já iniciado. Aceite: iniciar/concluir bloco offline e persistir.
2. P2: orçamento de precache. Aceite: limite KB com teste.

## P. Acessibilidade

**Contexto.** [FATO] Há skip-link `src/ui/App.tsx:297-300`, `aria-current` na nav `src/ui/App.tsx:305-330`, axe E2E `e2e/a11y.spec.ts:5-20`.

**Críticas.**
- [Menor] Axe só falha serious/critical `e2e/a11y.spec.ts:10-20`; moderate pode acumular. Gate: relatório de moderates.
- [Menor] Carrossel pode ser complexo para leitor de tela; há labels, mas navegação por swipe/dots precisa UAT real.
- [Menor] Emojis/ícones decorativos quase sempre aria-hidden; chip de diploma com emoji textual `src/ui/PlanBlockCard.tsx:174`.

**Elogios.**
- [FATO] Smoke axe cobre Welcome, Hoje, Config, Progresso e onboarding em desktop/mobile `e2e/a11y.spec.ts:31-59`.
- [FATO] Confirmação de pular move foco para opção segura `src/ui/PlanBlockCard.tsx:52-61`.

**Nota.** 8.3 — C 8.4 · UX 8.3 · Evid 8.6 · Coer 8.4 · Mant 7.8. Teto: 9.0.

**Estado-da-arte.** WCAG automation não substitui teste manual com teclado/leitor. O app tem boa base automatizada.

**Propostas.**
1. P1: gate de teclado-only. Aceite: Playwright navega onboarding→treino sem mouse.
2. P2: registrar moderates axe. Aceite: relatório sem regressão.

## Q. Design visual & hierarquia

**Contexto.** [FATO] Design system central usa tokens, Inter/Fraunces e tema papel/tabuleiro `src/index.css:1-10`, `:92-105`.

**Críticas.**
- [Importante] Problema principal é densidade/hierarquia, não beleza: Hoje tem hero + proposta + pendências + plano + roadmap + aside `src/ui/Today.tsx:391-729`. Métrica: usuário identifica “o que faço agora?” em 5s.
- [Menor] Tema escuro automático não foi verificado nesta rodada por leitura completa; docs dizem existir, mas eu não li o bloco `prefers-color-scheme`.
- [Menor] Artes premium ajudam, mas podem inflar precache.

**Elogios.**
- [FATO] Tokens centralizados evitam hex solto em componentes; CSS define sistema amplo `src/index.css:9-93`.
- [FATO] Alvos de carrossel têm 44px `src/index.css:238-244`.

**Nota.** 7.7 — C 7.8 · UX 7.4 · Evid 7.2 · Coer 8.2 · Mant 8.0. Teto: 9.0.

**Estado-da-arte.** Linear/Stripe vencem por hierarquia; Lichess por familiaridade e baixa fricção. Princípio: uma ação primária dominante.

**Propostas.**
1. P1: teste visual “5-second task” com dono. Aceite: usuário aponta próximo clique.
2. P2: mobile ultra-focus default. Aceite: aside recolhido no mobile.

## R. Arquitetura & qualidade de código

**Contexto.** [FATO] Camadas existem: `domain/`, `app/`, `ui/`, `infra/`; ESLint proíbe React/Dexie no domain `eslint.config.js:17-44`.

**Críticas.**
- [Importante] `generatePlan.ts` concentra muitas políticas `src/domain/plan/generatePlan.ts:125-270`; risco de regressão por mudança pedagógica.
- [Menor] Alguns contratos de plugin são rasos, ex. Cloudflare sync sem E2EE detalhado `plugins/cloudflare-sync/CONTRACT.md:13-30`.
- [Menor] Tests mocks incompletos não quebram build, geram stderr `src/app/useDiagnosisActions.test.tsx:27-29`.

**Elogios.**
- [FATO] Domínio puro é protegido por lint `eslint.config.js:17-44`.
- [FATO] `assertNever` é usado em switches sensíveis `src/domain/weakness/detectWeaknesses.ts:276-278`.

**Nota.** 8.5 — C 8.6 · UX 8.0 · Evid 8.6 · Coer 8.8 · Mant 8.3. Teto: 9.2.

**Estado-da-arte.** Sistemas adaptativos precisam policy objects e testes semânticos; app está próximo, mas gerador central cresce.

**Propostas.**
1. P1: dividir `generatePlan` em policies. Aceite: testes sem snapshot quebrado.
2. P1: CI falhar em console.warn não esperado. Aceite: stderr limpo.

## S. Testes & gates

**Contexto.** [FATO] Scripts: lint/test/build/smoke/a11y `package.json:6-15`; coverage thresholds `vitest.config.ts:20-35`; Playwright build real `playwright.config.ts:18-24`.

**Críticas.**
- [Importante] Warnings passam verdes: React key `NaN-NaN-NaN` e Vitest mock faltando export. Evidência: teste mock `src/app/useDiagnosisActions.test.tsx:27-29`; código avisando `src/app/useDiagnosisActions.ts:302-304`.
- [Menor] `smoke:pwa` e `a11y` rodam ambos Playwright; `npm run a11y` filtra por nome de arquivo via Playwright, ok, mas implícito `package.json:12-13`.
- [Menor] Coverage é threshold, mas não mede qualidade semântica de conteúdo.

**Elogios.**
- [FATO] 107 arquivos/1108 testes unitários verdes; 38 Playwright verdes.
- [FATO] E2E cobre onboarding, OAuth, offline, backup, a11y, CSP `e2e/*.spec.ts`.

**Nota.** 8.4 — C 8.5 · UX 8.0 · Evid 8.8 · Coer 8.6 · Mant 8.0. Teto: 9.2.

**Estado-da-arte.** Gates bons falham em warnings inesperados e cobrem fluxos reais. O app já cobre muito; falta “stderr zero” e goldens pedagógicos.

**Propostas.**
1. P0: fail on unexpected console.warn/error in tests. Aceite: suite limpa.
2. P1: goldens pedagógicos. Aceite: cada weakness tem expected plan/copy/resource.

## T. Medição de eficácia

**Contexto.** [FATO] Rating slopes são explicitamente descritivos, não causais `src/domain/efficacy/ratingSlopes.ts:9-12`; baseline calcula métricas locais `src/domain/metrics/efficacyBaseline.ts:65-80`.

**Críticas.**
- [Importante] Não há DiD implementado; só ingredientes within-subject descritivos `src/domain/efficacy/ratingSlopes.ts:94-123`.
- [Importante] UI pode sugerir “método” forte, mas ainda não prova ensino `src/ui/Progress.tsx:224-242`.
- [Menor] OLS aceita n=2 `src/domain/efficacy/ratingSlopes.ts:45-79`; estatisticamente fraco.

**Elogios.**
- [FATO] O código impede leitura causal ingênua em comentário explícito `src/domain/efficacy/ratingSlopes.ts:9-12`.
- [FATO] Baseline mede acurácia, conclusão, retorno e blunders `src/domain/metrics/efficacyBaseline.ts:65-80`.

**Nota.** 6.8 — C 7.0 · UX 7.0 · Evid 5.8 · Coer 7.6 · Mant 6.8. Teto: 8.8.

**Estado-da-arte.** Evidência educacional exige pré-registro, comparação temporal e controle de confundidores. Princípio: causalidade só com desenho adequado.

**Propostas.**
1. P1: pré-registro local de métrica antes do uso. Aceite: baseline locked.
2. P2: análise escalonada dentro da própria coorte. Aceite: relatório separa descritivo/causal.

## U. Internacionalização & conteúdo

**Contexto.** [FATO] UI é PT-BR hard-coded em componentes `src/ui/Onboarding.tsx:160-164`, `src/ui/Progress.tsx:63-65`; manifest lang PT-BR `vite.config.ts:32-39`.

**Críticas.**
- [Importante] Não há camada i18n; migração futura será cara. Gate: strings extraídas por namespace.
- [Importante] Conteúdo de xadrez é curado, mas sem verificação por engine ou especialista em cada microcopy. Ex.: currículo “torre ativa decide o final” `src/domain/curriculum/curriculum.ts:165-167` é pedagógico, mas não formalmente validado.
- [Menor] Temas Lichess em inglês aparecem na UI `src/ui/Progress.tsx:115-118`.

**Elogios.**
- [FATO] PT-BR é claro, adulto e alinhado ao dono.
- [FATO] Conteúdo não copia assets/PGN/livros pagos; usa Lichess/public APIs.

**Nota.** 6.6 — C 6.8 · UX 7.0 · Evid 5.8 · Coer 7.2 · Mant 6.0. Teto: 8.5.

**Estado-da-arte.** Apps públicos internacionalizam cedo; xadrez precisa taxonomia consistente. Gap: extração de strings e revisão técnica.

**Propostas.**
1. P2: labels PT-BR de todos os themes. Aceite: zero slug cru.
2. P4: i18n mínimo. Aceite: troca `pt-BR/en` sem alterar lógica.

## V. Retorno após ausência & engajamento sustentável

**Contexto.** [FATO] Retorno após pausa é tratado por consistency e achievement `src/domain/metrics/consistency.ts:54-59`, `src/domain/badges/evaluateAchievements.ts:125-140`.

**Críticas.**
- [Menor] Não há “plano de volta” completo além de nota/recalibração e 15min em histórico; precisa UAT de abandono real.
- [Menor] Semana inteira pode gerar pressão leve `src/domain/badges/evaluateAchievements.ts:170-180`.
- [Menor] Beep de timer existe, mas respeita reduced motion `src/ui/Today.tsx:859-887`; ainda pode incomodar sensorialmente.

**Elogios.**
- [FATO] Hard feedback vira revisão, não bronca `src/ui/PlanBlockCard.tsx:511-512`.
- [FATO] Retorno de ouro celebra voltar sem vergonha `src/domain/badges/evaluateAchievements.ts:36-40`.

**Nota.** 8.0 — C 8.0 · UX 8.4 · Evid 7.2 · Coer 8.6 · Mant 7.8. Teto: 9.1.

**Estado-da-arte.** Duolingo usa streak, mas apps saudáveis reduzem vergonha após pausa. O app está bem posicionado.

**Propostas.**
1. P1: “modo retorno” com só 1 bloco e sem backlog visível. Aceite: após gap ≥7d, hero único.
2. P2: medir retorno após ausência. Aceite: taxa de concluir 1ª sessão pós-gap.

---

# 2) Achados transversais

1. **Gates fortes, mas toleram ruído.** [FATO] Testes passam com warnings; isso enfraquece confiança futura.
2. **Promessa pedagógica > prova pedagógica.** [FATO] Há currículo e recursos, mas eficácia causal é explicitamente não implementada.
3. **Local-first está maduro.** [FATO] Storage/backup/restore são uma das áreas mais fortes.
4. **Alto nível ainda é “organizador”.** [FATO] Código assume teto honesto em 2200+ `src/domain/curriculum/curriculum.ts:42-49`.
5. **Identidade precisa congelar.** [FATO] Lichess Tutor/Rotina/Chess Habit/Professor Lemos/Tavarez coexistem.
6. **A UI acertou “ação única”, mas acumulou contexto.** Hero é forte; laterais/dobras podem pesar.

---

# 3) Norte do produto — como o app DEVE ser

O app ideal é um **tutor local-first que decide o próximo treino pequeno, explica por que, abre o recurso certo no Lichess, mede se o aluno reteve, e ajusta a rotina sem humilhar quando ele some**.

Princípios inegociáveis:
- Uma ação principal por sessão.
- Sem tabuleiro próprio, sem engine em partida viva, sem scraping.
- Diagnóstico como hipótese, não sentença.
- Retenção real > tempo gasto.
- Privacidade local-first por padrão.
- Gamificação só por esforço/qualidade, nunca rating.
- Eficácia honesta: descritivo quando for descritivo, causal só com desenho adequado.

Non-goals:
- Virar Chess.com/Lichess clone.
- Prometer rating.
- Criar curso genérico sem medir retenção.
- Copiar conteúdo pago.
- Viciar por streak.

Experiência ideal:
1. Usuário chega e entende em 30s: “vou estudar o que importa hoje”.
2. Informa conta ou responde 3 perguntas.
3. App dá 1 bloco claro: motivo, tarefa, stop rule.
4. Abre Lichess.
5. Volta, marca fácil/bom/difícil.
6. App agenda revisão e mostra progresso real.
7. Após 30 dias, o conceito volta como prova de retenção.
8. Primeiro diploma só sai com acurácia + retenção.
9. Se o usuário some, retorna com 1 bloco leve, sem culpa.

---

# 4) Plano faseado

## Fase 0 — Correções críticas

Objetivo: eliminar ruído de gate e divergência de identidade.

Itens:
- Falhar testes em `console.warn/error` inesperado. Aceite: `npm test` sem stderr não esperado.
- Corrigir mock `fetchChesscomGameRatings`. Aceite: sem warnings em `useDiagnosisActions.test.tsx`.
- Resolver `NaN-NaN-NaN` em data inválida. Aceite: teste inválido sem warning.
- Unificar persona/nome público. Aceite: grep sem divergência.

Gate: `npm run lint && npm test && npm run build && npm run smoke:pwa`.  
Não entra: feature nova.

## Fase 1 — Rigor de evidência

Objetivo: transformar heurísticas em critérios testáveis.

Itens:
- Golden tests por weakness→plan→resource.
- Registro local de métricas de 1º valor, hero-to-lichess, conclusão pós-gap.
- Pré-registro local de baseline de eficácia.
- Workload cap de pendências.

Gate: goldens + simulação de backlog + smoke verde.  
Não entra: i18n completo.

## Fase 2 — Pedagogia de verdade

Objetivo: quebrar teto de conteúdo genérico.

Itens:
- Contrato por conceito: explicar, retrieval, transfer, retenção.
- Currículo 1200–2200 com semanas e critérios.
- Labels PT-BR para themes.
- Diploma exige retenção posterior além de 80%/30.

Gate: nenhuma banda sem plano; cada conceito tem teste semântico.  
Risco: médio, reversível se versionar currículo.

## Fase 3 — UX/hierarquia/visual premium

Objetivo: reduzir carga cognitiva sem perder riqueza.

Itens:
- Modo ultra-foco no mobile.
- Aside recolhido por padrão.
- Teste 5-second task com dono.
- Reduzir ruído visual/emoji.

Gate: Playwright desktop/mobile + UAT dono: próximo clique identificado em ≤5s.

## Fase 4 — Polimento, i18n, escala

Objetivo: preparar público.

Itens:
- i18n pt-BR/en.
- Threat model P5.
- Backup criptografado opcional.
- CSP sem unsafe-inline se possível.
- Docs públicas de privacidade/sync.

Gate: smoke público, audit privacy, AGPL/disclaimer, noindex decidido.

---

# 5) Apêndice

## Matriz ICE/RICE resumida

| Item | Impacto | Esforço | Confiança | Prioridade |
|---|---:|---:|---:|---:|
| Fail on unexpected warnings | Alto | Baixo | Alta | P0 |
| Unificar identidade/persona | Alto | Baixo | Alta | P0 |
| Corrigir mock Chess.com | Médio | Baixo | Alta | P0 |
| Goldens pedagógicos | Alto | Médio | Alta | P1 |
| Workload cap SR | Alto | Médio | Média | P1 |
| Labels PT-BR themes | Médio | Baixo | Alta | P1 |
| Métrica 1º valor | Alto | Baixo | Média | P1 |
| Retenção calibrada | Alto | Alto | Média | P2 |
| Currículo 1200–2200 | Alto | Alto | Média | P2 |
| Ultra-focus mobile | Médio | Médio | Média | P3 |
| Backup criptografado | Alto | Médio | Média | P4 |
| i18n | Médio | Alto | Média | P4 |

## Hipóteses ainda não comprovadas

- Retenção 30d melhora aprendizagem vs revisão mais curta. Experimento: comparar cohorts locais por tema.
- Interleaving pool=2 é ideal para TDAH. Experimento: UAT com pool 1/2/3.
- Diplomas aumentam constância sem gaming. Experimento: comparar conclusão e acurácia pós-diploma.
- Hero-first reduz carga cognitiva. Experimento: 5-second task + tempo até abrir Lichess.
- Chess.com accuracy é sinal confiável suficiente. Experimento: taxa de cobertura e correlação com puzzle errors.

## Não verificado

- Council externo GLM/Fugu foi disparado via opencode, mas excedeu 600s; não usei como evidência.
- Não revisei todos os 1034 linhas de `resourceCatalog.ts`; li estrutura e trechos críticos.
- Não rodei coverage nesta rodada.
- Não rodei teste real em dispositivo Android físico.
- Não validei dark mode completo por leitura de todo CSS.

## Verificações feitas

- `npm run lint` — OK.
- `npm test` — OK, 107 arquivos / 1108 testes.
- `npm run build` — OK.
- `npm run smoke:pwa` — OK, 38/38 Playwright desktop/mobile.
- Pesquisa externa consultada: Lichess API Tips, Lichess Puzzle Themes, Chess.com PubAPI, Anki FSRS, RetrievalPractice.org, Listudy.

## Arquivos alterados/criados

- Criado: `docs/review/analise-completa-fugu-2026-06-26.md`.

**Próxima ação recomendada:** executar a Fase 0 (warnings + identidade + mocks). Modelo recomendado: Sonnet 4.6 para implementação; Haiku 4.5 para grep/renomeações mecânicas.

---
---

# ADENDO — Verificação Council + Síntese Final (Sakana Ultra · maestro Opus 4.8)

> **Data:** 2026-06-26 · **O que é isto:** o relatório acima é a *baseline* do
> consultor (fugu-ultra, gerada via opencode com acesso ao repo e **gates rodados**:
> lint/test/build/smoke verdes, 1108 testes, 38 Playwright). Este adendo é a
> camada de **adjudicação do maestro**: rodei um council adversarial externo
> (DeepSeek V4 Pro + GLM 5.2, modo VERIFICAR, mesmo artefato abstrato) **e
> verifiquei cada alegação contra o código real**. Regra-mor mantida: **o árbitro
> é o gate objetivo, não o voto** — e foi o gate que derrubou metade dos achados.

## 1. O que a verificação mudou (a lição metodológica)

Houve **três leituras** do mesmo app, e nenhuma estava inteiramente certa:
- **Baseline fugu (otimista, 8.0):** rodou os gates, leu o repo — forte em
  robustez, talvez generosa em pedagogia/eficácia.
- **Rascunho adversarial do maestro (pessimista, ~6.9):** baseado em extração por
  subagentes Haiku — **errou 3 fatos por leitura incompleta** (ver §2).
- **Council externo (DeepSeek+GLM):** refutou bem o rascunho, mas — trabalhando
  sobre *abstração*, sem o código — **levantou riscos que o código já mitiga** (§4).

**Veredito adjudicado: a verdade fica em ~7.6.** O app é **mais robusto** do que a
leitura pessimista (persistência, expiração de token, Retry-After, restore
transacional — tudo já existe e testado) e **menos *provado*** do que a leitura
otimista sugere (conteúdo de banda alta é esboço, constantes pedagógicas não
calibradas, eficácia só descritiva, warnings passam verdes, identidade divergente).

## 2. Correções factuais do maestro (refutadas por leitura do código)

Três "achados" do rascunho adversarial são **FALSOS** — registrados para não
contaminarem decisão:
- **"`mastery` é dead code"** → FALSO. `masteryTargetFromCompletedLog` alimenta
  `advancePendingItem` em [useTrainingActions.ts:160](src/app/useTrainingActions.ts:160); `computeMastery` roda em
  [generatePlan.ts:102,161](src/domain/plan/generatePlan.ts:102). (O council também marcou A1 como o achado mais frágil
  — convergência.)
- **"Tema forçado claro"** → FALSO. Tema é forçado **escuro** via `@media all`
  sobrescrevendo `:root` ([index.css:2403-2467](src/index.css:2403)).
- **"Plugins não existem"** → FALSO. Há 4 `plugins/*/CONTRACT.md`.

## 3. Refutações do council ao rascunho adversarial (incorporadas)

Onde DeepSeek **e** GLM convergiram contra o rascunho — e o código confirmou:
- **A1 "Crítico-hipótese" é oximoro** e degrada para o default seguro (`review`):
  é otimização perdida, não bug de corretude. **Aceito** — rebaixado.
- **A4 "adicionar retry/jitter/backoff" está ERRADO** para app single-user que
  bate na API do Lichess: retry-storm **piora** o 429; o correto é respeitar
  `Retry-After` + cooldown bom-cidadão. **Verifiquei: o app já respeita
  `Retry-After`** ([providerQueue.test.ts:54,163](src/infra/http/providerQueue.test.ts:54)). Proposta **retirada**.
- **A8 "não prova causalidade" não deve punir a nota** — é limite do problema, não
  da implementação; a nota reflete "descritivo bem feito". **Aceito.**
- **Severidades infladas sem teste que falhe** (A1, A3, A6, A7). **Aceito** — todo
  candidato a bug aqui exige reprodução antes de virar ação.

Divergência preservada (UNICO): GLM apontou que **sincronizar mapa
conceito→tema "com o Lichess" é impossível** (o Lichess não expõe essa API) — a
curadoria manual é necessária, não preguiça. **Aceito**: a proposta vira
*fail-loud em tema desconhecido + teste de sensibilidade dos thresholds*, não
"sincronizar".

## 4. Riscos que o council levantou — e o veredito do gate (verifiquei cada um)

| Risco do council | Fonte | Verificação no código | Veredito |
|---|---|---|---|
| Evicção de IndexedDB sem `storage.persist()` | GLM #1 | `requestPersistentStorage` existe e é chamado ([persistence.ts](src/infra/storage/persistence.ts), useAppData.ts:48, com testes) | **MITIGADO** |
| Token expira sem tratamento (401) | DeepSeek #7 | `expiresAt` calculado + 401 tratado ([oauth.ts:117,130](src/infra/lichess/oauth.ts:117), account.test.ts:103) | **MITIGADO** |
| Sem respeitar `Retry-After` (storms) | ambos | Respeitado quando > cooldown ([providerQueue.test.ts:54,163](src/infra/http/providerQueue.test.ts:54)) | **MITIGADO** |
| Over-scope de `study:write` | GLM | App cria Study real no Lichess ([study.ts](src/infra/lichess/study.ts)) — escopo justificado | **JUSTIFICADO** |
| Validação interna de backup (range/FK) | maestro+GLM | Restore valida *shape* transacional ([appData.ts:437-524](src/infra/storage/appData.ts:437)), mas **não** ranges/FK/duplicidade | **REAL (Importante)** |
| Migração de schema Dexie sem golden test completo | ambos | Há upgrades + teste de migração de bandas ([bands.test.ts](src/domain/bands.test.ts)); **falta golden v(n-1)→v(n) abrangente** | **REAL (parcial)** |
| Corrida de escrita multi-aba (Dexie) | DeepSeek #2 | Sem `BroadcastChannel`/`liveQuery` | **REAL (Menor, single-user)** |
| Manipulação de relógio quebra SM-2 | GLM #6 | Timestamps confiados, sem sanidade | **REAL (Menor→Importante)** |
| Export sem cifragem vaza histórico | GLM #7 | Confirma proposta M-P1 da baseline | **REAL (converge)** |
| Sem telemetria de erro (bugs silenciosos) | DeepSeek #6 | Local-first sem crash report | **REAL, em tensão com privacidade** |

**Síntese §4:** dos 7 "riscos grandes" que o council disse que o auditor "passou
reto", **3 já estavam mitigados no código** (persist, token-expiry, Retry-After) e
**1 é justificado** (study:write). Isso reforça a regra global: *convergência de
IAs valida raciocínio, não realidade — o gate decide.* Os **5 que sobrevivem**
(validação interna de range/FK, golden de migração, multi-aba, relógio,
cifragem/telemetria) entram no plano final abaixo.

### 4.1 Achado do Selador Final (fugu-ultra) — o risco que emergiu do quadro todo

Numa passada adversarial **final** sobre o artefato (após DeepSeek+GLM e o
maestro), o `sakana/fugu-ultra` contribuiu um risco transversal que ninguém mais
articulou — e que adoto como **achado de primeira classe**:

> **[Crítico] Integridade SEMÂNTICA pós-sync/restore.** O app pode ter schema
> **válido** e ainda tomar decisão pedagogicamente **errada**: backup antigo
> restaurado + sync novo do Lichess + banda de rating defasada + tags externas
> que mudaram + duplicatas/progresso sobrescrito → o plano fica plausível porém
> incorreto, **sem quebrar nenhum gate**. É a falha silenciosa clássica de um
> app que passa em todos os testes. Cobre M (dados) ∩ B (pedagogia) ∩ K (sync).

Isso eleva a validação de dados de "shape + range/FK" (§4) para **coerência
temporal/semântica**: ao restaurar+sincronizar, o app precisa **reconciliar**
(qual fonte vence? band atual vs band do backup? tag renomeada?) e **fail-loud**
quando os dados são internamente inconsistentes, não só malformados. Entra na
Fase 1 como *teste de reconciliação restore↔sync*.

Mais dois cortes do selador, adotados: **(a)** a segurança real do token é
**XSS/CSP**, não "plaintext isolado" (qualquer JS comprometido lê o IDB) →
endurecer CSP/sanitização entra na Fase 4; **(b)** acurácia de puzzle pode medir
**memorização, não transferência** → o diploma/retenção precisa de prova de
*transferência* (tema aplicado em contexto novo), não só repetição — reforça a
Fase 2.

## 5. Tabela de notas — ADJUDICADA (reconciliando baseline + council + gate)

| Área | fugu | maestro(rasc.) | **Final** | Por que o ajuste |
|---|:--:|:--:|:--:|---|
| A Visão | 8.4 | 8.0 | **8.2** | Promessa cumprida; arco de retenção ainda invisível |
| B Pedagogia | 7.1 | 6.0 | **6.8** | Banda alta é esboço (`weeks:[]`); "sync" refutado, gap real é conteúdo |
| C Diagnóstico | 7.8 | 6.5 | **7.4** | Trava de evidência forte; thresholds sem teste de sensibilidade |
| D Motor de plano | 8.2 | 6.5 | **7.8** | Sofisticação real e rodada; gerador grande (876 ln) é dívida |
| E SR/retenção | 7.0 | 7.5 | **7.2** | Retenção real testada; escada fixa + sem workload cap |
| F Onboarding | 8.0 | 7.5 | **7.8** | Robusto; foco lazy + faixa manual ancorando |
| G Tela Hoje | 8.6 | 8.0 | **8.4** | Loop acionável exemplar; densidade lateral pesa |
| H Progresso | 8.1 | 8.5 | **8.2** | Anti-cassino honesto; slugs crus de tema |
| I Gamificação | 8.0 | 8.5 | **8.2** | Qualidade acoplada; checar dark-pattern "semana inteira" |
| J Persona | 7.8 | 7.5 | **7.6** | Tom sem bronca; **identidade Lemos vs Tavarez** divergente |
| K Lichess | 8.5 | 7.0 | **8.3** | PKCE+429+Retry-After+token-expiry sólidos (verificado) |
| L Chess.com | 7.8 | 6.5 | **7.5** | Read-only correto; `provisional` por `games<10` e cobertura `accuracies` |
| M Storage/backup | 8.8 | 6.5 | **8.0** | Restore transacional real; **falta range/FK + golden de migração** |
| N Privacidade | 8.2 | 7.5 | **8.0** | Local-first+escopos+token-fora-do-backup; `unsafe-inline` + vazamento em trânsito |
| O PWA | 8.5 | 6.5 | **8.2** | Smoke offline real + update prompt; precache 3.2 MB a enxugar |
| P A11y | 8.3 | 6.0 | **8.0** | axe E2E **existe** (verificado); falta teclado-only + moderates |
| Q Visual | 7.7 | 7.0 | **7.5** | Tokens coesos; hierarquia/densidade é o gap (não beleza) |
| R Arquitetura | 8.5 | 8.0 | **8.3** | Pureza por lint; `generatePlan` concentra políticas |
| S Testes | 8.4 | 6.5 | **7.8** | 1108 verdes + E2E amplo; **warnings passam verdes** + sem golden pedagógico |
| T Eficácia | 6.8 | 6.0 | **6.8** | Honestidade rara; sem DiD, OLS aceita n=2 |
| U i18n/conteúdo | 6.6 | 4.5 | **6.2** | Single-locale ok; conteúdo sem verificação por engine; slugs crus |
| V Retorno-ausência | 8.0 | 8.5 | **8.0** | Recalibra sem culpa; falta "modo retorno" pleno |

**NOTA GERAL ADJUDICADA: 7.6 / 10** · **Teto realista: 9.0.** (A baseline 8.0 era
levemente otimista; o rascunho 6.9 era injusto com a robustez já existente.)

## 6. Relatório Final — **como deve ser feito** (plano adjudicado)

O plano da baseline (Fases 0–4) está **correto e mantido**. O adendo faz 3
ajustes que o council + gate impõem: **(a) retirar** a falsa prioridade de
retry/jitter; **(b) elevar integridade de dados** de "está forte" para "à prova de
corrupção e migração"; **(c) adicionar** as 5 lacunas sobreviventes do §4.

**Fase 0 — Higiene de gate e identidade** *(mantida da baseline)*
Falhar testes em `console.warn/error` inesperado; corrigir mock Chess.com e
`NaN-NaN-NaN`; **congelar a identidade** (decidir Lemos vs Tavarez; "Chess Habit"
vs "lichess-tutor"; resolver `SOURCE_CODE_URL`). *Aceite:* suíte sem stderr; grep
de identidade sem divergência. *(Sonnet executa; Haiku faz o grep/rename.)*

**Fase 1 — Rigor de evidência + integridade de dados** *(reforçada)*
- Baseline: goldens `weakness→plan→resource`; métricas locais de 1º valor;
  pré-registro de baseline; workload cap de pendências.
- **+ Integridade (novo, do §4):** validação de **range/FK/duplicidade** no restore
  ([appData.ts:437-524](src/infra/storage/appData.ts:437)) + **property test** round-trip + **golden de migração
  Dexie** v(n-1)→v(n) com dados reais. *Aceite:* restaurar item fora de range é
  rejeitado; migração de golden preserva integridade.
- **+ `pedagogyConstants.ts`:** centralizar thresholds (0.40, 0.2, 75/80, 30, 2,
  EF, 30d) com intenção documentada + **teste de sensibilidade** (não "sync").

**Fase 2 — Pedagogia de verdade** *(mantida)*
Contrato por conceito (explicar→recuperar→transferir→reter); preencher
1200–2200 (zero `weeks:[]`); labels PT-BR para todos os temas; diploma exige
**retenção posterior** além de 80%/30; **fail-loud em tema Lichess desconhecido**.

**Fase 3 — UX / hierarquia / visual** *(mantida + relógio)*
Modo ultra-foco mobile (aside recolhido); teste "5-second task"; reduzir
emoji/ruído; arte premium com **orçamento de precache**. **+ Sanidade de relógio**
(detectar timestamp retrocedido para não quebrar SR).

**Fase 4 — Privacidade, escala, i18n** *(mantida + cifragem/multi-aba)*
DiD within-subject (decisão do dono pendente); threat model P5; **backup
criptografado por senha** (§4); CSP sem `unsafe-inline`; i18n pt-BR/en. **+ Guarda
multi-aba** (BroadcastChannel/lock) se P4 sync ligar. *Cortado:* P5 comunidade até
o núcleo ≥8.5; telemetria de erro só com consentimento explícito (tensão privacidade).

**As 3 apostas de maior ROI (adjudicadas):**
1. **Fase 0 + integridade da Fase 1** — higiene de gate (warnings verdes,
   identidade) + restore à prova de range/FK + golden de migração. Barato, mata o
   risco que mais corrói confiança (dado do aluno) e a falsa segurança dos gates.
2. **`pedagogyConstants` + goldens semânticos** — transforma a sofisticação
   latente do motor (que **já roda**) em comportamento *provado*.
3. **Conteúdo concreto por banda (piloto) + retenção visível** — o salto de
   "organizador esperto" para "ensina e prova que reteve".

---

**Adjudicação do maestro (Opus 4.8).** A baseline fugu é um bom relatório e
**fica preservada acima**. O council cumpriu seu papel — não por estar certo
(metade dos seus "riscos grandes" o gate refutou), mas por **forçar a
verificação** que corrigiu tanto o otimismo da baseline quanto o pessimismo do
rascunho. Nota final **7.6**, teto **9.0**, e o caminho entre os dois é
**integridade de dados + prova pedagógica**, não mais features.

*— Sakana Ultra (河豚). O veneno do fugu está nos detalhes; a iguaria, na
verificação.*
