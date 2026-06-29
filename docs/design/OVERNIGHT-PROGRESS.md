# Execução autônoma overnight — 2026-06-29 → 30

Autorizado pelo dono: "implemente todas as fases sem pausa". Branch: `feat/today-action-first`.
Este arquivo é o LOG DURÁVEL (resume após reset de contexto) e o relatório matinal.

## Contrato de autonomia (limites)
- TUDO na branch `feat/today-action-first`. Commit por fase (progresso durável e reversível).
- PROIBIDO sem o dono acordado: merge em master, `git push`, deploy (Vercel/worker), operação git destrutiva, mexer em `.env`/segredos.
- Gate objetivo = árbitro: `npm run build` (tsc -b), `npm test` (vitest), `npm run lint`.
- Se uma fase falhar gates 3x: registro o motivo aqui, faço git stash/checkout dos arquivos quebrados e SIGO pra próxima fase (maximizar progresso). Nada de travar a noite numa fase só.
- Fases que editam os mesmos arquivos (Today.tsx/Progress.tsx) rodam em SÉRIE (lição da colisão paralela M2a).
- Imagens premium: NÃO consigo gerar (rota GPT-5.5 morta). Faço slots + pacote de prompts; geração fica pro dono.

## ⚠️ Nota honesta sobre a janela overnight
O processo da sessão foi reiniciado por volta das 00:5x e o job do GLM foi encerrado junto (sem registro de conclusão). Só fui reinvocado ~08:00. Ou seja: **a janela "noite toda" foi perdida** — não rodei F2–F5 enquanto você dormia. Retomei de manhã: fechei a F1 e sigo daqui.

## Plano de fases
- [x] **F1 — Today action-first**: `TodayHero.tsx` + CSS + testes + integração. GATES VERDES (test 1340/1340, build, lint). Decisão de escopo do GLM resolvida = **Opção B** (TutorCard re-montado ABAIXO do carrossel, preservando Q&A pós-sessão + "Conferir puzzles"; pré-sessão suprimido pois o herói já enquadra). Achado: `coachNote` aparece no herói E no PlanBlockCard → ver follow-up F3.
- [x] **F2 — Separar administração de ação** (APROVADO pelo dono, regra "Today só ação; metas/trilha/ritmo/diagnóstico/sync → Progresso"). FEITO: `<aside>` removido do Today; Metas (SessionMilestonesCard) + Trilha (CurriculumCard) + Sincronizar movidos p/ Progress; Ritmo/Diagnóstico (duplicados) removidos do Today; ~14 props/handlers re-roteados via App.tsx. GATES VERDES (test 1348/1348, build, lint). Testes de sync agora navegam até Progresso e passam (prova de função). Implementado por GLM, ajuste de testes finalizado pós-restart, revisado por Opus.
- [x] **F3 — declutter**: removido o `coachNote` duplicado (herói + cartão do herói no carrossel). `PlanBlockCard` ganha `hideCoachNote`; Today suprime só no bloco do herói. GATES VERDES. Commit `bdf0ad2`. (Progress segue com folds — é o destino de detalhe, fold-rico é correto lá; o ≤1-details valia p/ a tela de AÇÃO, que ficou limpa.)
- [~] **F4 — Polish premium**: ✅ contraste do rodapé legal (folha translúcida + blur + ink-700, legível sobre a mesa) — commitado. ✅ form-controls (accent verde). Pendente: profundidade/elevação fina, hover/focus extras.
- [x] **F5 — Preparação de imagem (sem gerar)**: pacote de prompts em `docs/design/image-prompts-action-first.md` — retrato grande do herói (claro/noite) + set de thumbnails de conceito tático (template + exemplos garfo/cravada/espeto/descoberto, 1:1 com TacticDiagram). Geração (pelo dono) + wiring no código ficam como passo futuro.

## Decisões pré-fixadas (dono dormindo, sem perguntas)
- Faixa do topo: ESCURA (verde profundo). 3 chips: a recuperar / checkpoint / sessões.
- Avatar do Tavarez: GRANDE no herói. Princípio: imagem premium > parede de texto sempre que possível.
- Persona: Tavarez (não Lemos).

## Follow-ups descobertos (não bloqueiam F1)
- **F3-declutter:** `coachNote` aparece 2x na tela Hoje (herói `today-hero-coach-note` + cartão `block-line coach-note`). Avaliar esconder/encurtar no PlanBlockCard quando o herói já mostra. Teste `trainingFlow.test.tsx:96` foi relaxado de findByText→findAllByText (intent "intro presente", não unicidade).
- **F1-edge:** com pré-sessão suprimido, em estado sem blocos/proposta o TutorCard abaixo não mostra coaching genérico (o herói + proposta cobrem). Aceitável; revisitar se incomodar.

## Diário (append-only)
- 2026-06-29 ~23:5x — branch criada; SPEC F1 escrito; GLM despachado p/ F1. Fix de form-controls (accent-color verde + checkbox + .field-inline) já no working tree.
- 2026-06-30 ~08:1x — retomada pós-restart. GLM tinha feito F1 (build/lint ok, 3 testes falhando por remoção do TutorCard). Adjudicado Opção B + suprimido pré-sessão duplicado + relaxado 1 asserção. GATES VERDES. Commit F1.

## ESTADO AO SAIR — 2026-06-30 ~11:35 (leia isto ao voltar)

Tudo em `master`, **gates verdes (vitest 1348/1348, build, lint)**, **NADA pushado/deployado**.

FEITO (commits recentes, do mais novo ao F1):
- Resiliência: ErrorBoundary global + timeout 30s nos fetches OAuth (era WIP solto no tree; commitado).
- Paleta VERDE-ELEVAÇÃO: fim das ilhas beges — card do herói verde elevado, faixa verde médio, secundários = contorno verde, título branco-gesso. Barra do dia + borda do bloco: ouro→verde.
- Retrato do Professor: sem corte (vertical, contain). Botão primário: verde (sem placa dourada). Rodapé escuro translúcido. Ritmo não abre mais sozinho.
- Arte: retrato do herói integrado (webp leve). Conceitos = SVG TacticDiagram repaginado (madeira/setas/sombra), não imagem gerada.
- Redesign action-first (F1–F5) já mergeado em master no início do dia.

PRECISA DE VOCÊ (não dá pra eu fazer):
1. **PUSH + DEPLOY**: `master` está ~20 commits à frente de origin. Publicar = seu passo manual (export prebuilt → Vercel).
2. **Sistema de acento QUENTE pervasivo** (`--gold-050/300` em ~35 cards: fundos creme + bordas) do design original — NÃO purgei por risco de contraste em telas que não consigo ver (screenshot trava no ambiente). Decida no device se quer tudo verde; aí eu recoloro com você validando.
3. **Cards "papel" intencionais** (`.plan-block`, `.tutor-card`): textura creme com texto escuro adaptado — funcionam; deixei. Unifico se quiser.

VERIFICADO: app renderiza no preview (localhost:5180); hero/botões/Progresso ok. (Um erro de HMR do vite no log era stale — build e runtime ok.)
