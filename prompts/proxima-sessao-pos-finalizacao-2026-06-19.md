# Prompt para a próxima sessão — pós-rodada de finalização (lichess-tutor)

> Cole isto como primeira mensagem numa sessão nova. É autossuficiente.

## Contexto

PWA local-first de treino de xadrez (Professor Lemos): React 19 + Vite + Dexie (IndexedDB), camadas `domain`/`app`/`infra`/`ui` puras, testes Vitest + Playwright. Deploy estático na Vercel (só o dono deploya). Em 2026-06-19 rodou uma **rodada de finalização** (design/UX/imagens/métricas/pedagogia). Esta sessão **continua de onde parou**, num estado verde e estável.

**Gates atuais (verificados):** `npm run lint` limpo · `npm test` = **80 arquivos / 655 testes** verdes · `npm run build` ok. Tudo commitado em `master`. Pré-commit (husky) roda eslint --fix + tsc.

## O que já foi entregue (NÃO refazer)

- **Mobile:** acentuação corrigida (`src/config/appIdentity.ts`); quebras órfãs via `text-wrap: balance/pretty` (`src/index.css`). Os "7 riscos mobile" de um audit antigo eram falsos (CSS já responsivo) — não reabrir.
- **Imagens didáticas:** `src/ui/art/TacticDiagram.tsx` + `tacticDiagrams.ts` — 13 conceitos táticos (diagrama de tabuleiro SVG, lazy via IntersectionObserver, `role="img"`). Renderizado no `PlanBlockCard` via `block.weaknessTag`.
- **Métricas honestas:** nº de exercícios é a métrica principal; tempo estimado por timestamp do Lichess (`estimateActiveSeconds` em `src/infra/lichess/puzzleActivity.ts`); bloco done mostra "N exercícios" ou "Concluído." (sem wall-clock). **Progresso** (`progressOverview.ts` + `Progress.tsx`) também migrado para **exercícios + blocos** (não horas).
- **Modo foco:** `src/ui/BlockCarousel.tsx` (Embla) integrado no `Today.tsx` — o plano do dia é um carrossel (swipe, pontinhos, "ver lista"). Stubs globais de teste em `src/test/setup.ts` (matchMedia/ResizeObserver/IntersectionObserver no jsdom; o stub de IO dispara "visível" na hora).
- **Pedagogia:** rótulo de confiança honesto (`learningPlanProposal.ts`); estágio "fácil" avança 1 nível, não pula (`advanceThemeStage` em `generatePlan.ts`, com teste de regressão direto).
- **Progressão de banda (parcial):** `src/domain/method/bandProgression.ts` (`promoteBandForDiplomas`: Peão→800-1000, Torre→1000-1200, Rei→1200-1600) + chamada no `saveProfile` (`src/app/state.ts`). **Está pronto e testado, mas é NO-OP** — ver decisão aberta abaixo.

Pareceres do council (DeepSeek; GPT-5.5 estava fora por cota de API) em `docs/review/REVIEWS-fase6-deepseek-2026-06-19.md` e `docs/review/REVIEWS-fechamento-2026-06-19.md`. Spec da rodada: `docs/superpowers/specs/2026-06-19-finalizacao-beta-design-ux.md`.

## DECISÃO ABERTA #1 (a principal) — como se ganha um diploma?

A promoção de banda só dispara quando há `DiplomaAttempt` registrado, e **nada registra em produção** (`saveDiplomaAttempt` em `src/infra/storage/appData.ts` não tem chamador de UI). Tentei o gatilho "auto por treino" e esbarrei num bloqueio real:

- Cada diploma tem 3 seções com destinos Lichess específicos. **Várias não são puzzles com acurácia** (ex.: Peão = Coordenadas + Valor das Peças + **Mates Básicos**; coordenadas e mates básicos são prática, sem acurácia medível).
- O plano diário é **guiado por fraqueza** → não passa pelos destinos do diploma. E `TrainingLog` não guarda a URL do destino para casar com a seção.
- Logo, "auto por treino" **nunca fecha o Peão** → a banda nunca sobe. Fica fake.

**Escolher uma das saídas (decisão do dono):**
1. **Redefinir o diploma para acurácia de tema** — "atinja X% nos temas Y,Z no Lichess" (usa `themeStats`/`buildSkillMap`). Auto funciona de verdade. Muda o modelo do diploma (hoje 3 seções fixas, usadas na UI do currículo). Recomendado se o objetivo é progressão automática.
2. **Tela "fazer o diploma" dedicada** — fluxo separado onde o aluno faz as seções de propósito (avaliação real). Pedagogicamente mais correto; feature maior.
3. **Deixar dormente** — manter a promoção de banda pronta e sem trigger; focar noutra coisa.

Sem isso resolvido, a banda não evolui (a estagnação que o dono queria corrigir continua, apesar do código pronto).

## Itens menores / follow-ups (o council marcou como baixa prioridade p/ beta pessoal)

- **5b anti-repetição** (dedup de replay): o council chamou de **desperdício** para 1 usuário (a penalidade -900 em `resourceSelector` já cobre). Só fazer se incomodar na prática.
- **6b — `computeMastery` nos blocos normais:** hoje `masteryTarget` é hardcoded `'review'` em `generatePlan.ts:230`. Ativar exige spec de composição com `resourceStage` (council pediu fase separada). Para <100 sessões, dados de maestria são esparsos — baixa prioridade.
- **Diagnóstico Chess.com mudo** (294 sinais → 0 fraquezas): bug antigo, fonte primária do dono; recalibrar limiares em `detectWeaknesses.ts`. Alto valor para o dono, fora do escopo da finalização.
- **`npm audit fix`** — 1 vuln "high" no `undici` (transitiva, dev-only, não vai no bundle).
- **Cobertura de `SessionMilestonesCard`** (174 linhas, 1 teste).
- **Botão "Pular" sem confirmação** (`PlanBlockCard.tsx`) — toque acidental no mobile.

## Imagens premium (paralelo, depende do dono)

A direção "Gabinete do Professor Lemos" (gouache) tem 41 prompts em `prompts/geracao-imagens-gabinete-2026-06-11.md`. **O dono gera as imagens no app do ChatGPT** (a API da OpenAI do opencode está sem cota — só ChatGPT funciona) e traz os arquivos; o agente integra nos slots (recorte, WebP, pares claro/escuro, poses ligadas ao coach). Mapa de onde cada imagem entra: ver memória `visual-premium-images`.

## Como começar esta sessão

1. Confirmar os gates verdes (`npm test`, `npm run build`).
2. **Resolver a DECISÃO ABERTA #1** com o dono antes de codar a parte de diploma/banda.
3. Opcional: o dono fazer um **teste de game manual** (`npm run dev`, porta 5173) — onboarding → carrossel do plano → abrir lição → concluir → ver "N exercícios" no progresso — e reportar travas.
4. Modelo: decisões de produto/pedagogia e a refatoração do diploma ficam no **Opus 4.8**; tarefas de rotina guiadas por teste descem para **Sonnet 4.6/Haiku 4.5** em subagentes.
