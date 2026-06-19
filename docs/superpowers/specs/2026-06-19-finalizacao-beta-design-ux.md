# Spec — Finalização do beta: design, UX, imagens didáticas, pedagogia e métricas honestas

**Data:** 2026-06-19 (revisado após council + decisões do dono)
**Status:** direção visual e decisões de produto **travadas pelo dono**; correções técnicas do **council (DeepSeek-V4-Pro)** incorporadas. Pronto para `writing-plans`.
**Antecedente:** o beta local-first já foi fechado (a11y axe, CSP, privacidade in-app, doc E2EE — ver `docs/review/relatorio-finalizacao-beta-local-first-2026-06-19.md`). Esta fase é a **finalização de produto**: app com cara de **app de xadrez, não de livro**, impecável no mobile, com aprendizado que não enjoa e métricas honestas.

---

## 0. Decisões do dono (TRAVADAS 2026-06-19 — não reabrir)

1. **Direção de design aprovada:** menos livro, mais app de xadrez, **por etapas**.
2. **Plano do dia = modo foco com carrossel swipe**, que **convive** com um "ver lista completa" (não substitui).
3. **Sistema de imagens AMPLO** — imagens em todo lugar (não só táticas): diagrama de tabuleiro (estilo A) para conceitos + Professor parabenizando metas, reações por contexto, marcos, conquistas, estados vazios, ícone/splash. Eu construo os encaixes (SVG/placeholder); dono gera a arte premium **via GPT-5.5** (estética Gabinete) e eu integro.
4. **Métricas honestas — pivô:** o **número de exercícios** (real, puxado do Lichess) é a métrica principal; **tempo de relógio NÃO é prioridade**. Tempo, quando útil, é **estimado pelos timestamps do Lichess**, não pelo wall-clock do "abrir→concluir".
5. **Progressão de nível: implementar COMPLETO agora** — promover de banda por desempenho/diploma + ativar `computeMastery` no plano. (Maior e mais arriscada mudança; recebe os testes mais fortes.)
6. **Lógica de estágio: suavizar** — "fácil" avança 1 estágio (não pula tudo); "difícil" explica mas reavalia após N acertos.
7. **Offline (estudar no metrô): ADIADO** — Lichess externo não roda offline; o caminho real (cachear puzzles do dia + tabuleiro in-app) é feature grande → milestone próprio depois, fora desta finalização.

---

## 1. Council incorporado (DeepSeek-V4-Pro, 2026-06-19; GPT-5.5-Pro sem crédito)

Risco geral apontado: MEDIUM → LOW com estas correções, todas aceitas:

- **H1 (verificado):** `LearningPlanProposalCard` **já** é chunked com `<Fold>` ([`:161`,`:170`](../../../src/ui/LearningPlanProposalCard.tsx)). Frente B **rebaixa** essa tela (no máximo um indicador de passo) e foca esforço no carrossel + placement.
- **H2 → resolvido pelo pivô:** a lacuna do timer em background some, porque **não dependemos mais do wall-clock** (decisão 4).
- **H3 + M1:** carrossel e SVGs precisam de build-vs-buy + budget. **Carrossel = Embla** (4KB, a11y, drag+keyboard); diagramas com **lazy mount** (IntersectionObserver) e `will-change: transform` nos cards.
- **M2:** fallback de dedup definido → quando só há 1 fraqueza, o bloco de transferência vira **replay do recurso de menor acerto** (não repete o tema).
- **M3:** verificação mobile **automatizada** — teste Playwright em 375×812 com `toHaveScreenshot()` (threshold ~1%) + axe no mesmo viewport.
- **M4:** **gate de a11y por fase** (após TacticDiagram e após o carrossel), não só no fim.
- **M5:** cooldown de tema com **exceção por erro recente** — não repetir tema em dias seguidos, **a menos que** houve erro de peça nesse tema nos últimos N jogos.
- **L2 (verificado):** `Config` não tem "zona de perigo" separada ([`:384`](../../../src/ui/Config.tsx)) — a separação Status/Backup/Perigo é trabalho novo (correto).
- **L3:** validar cada diagrama contra o recurso canônico do Lichess já mapeado em `resourceCatalog.ts:852` (ex.: garfo → `practice:fundamental-tactics:the-fork`).

---

## 2. Princípios de design

1. Menos livro, mais app de xadrez. 2. Por etapas (progressive disclosure). 3. Plano do dia = modo foco (carrossel) + "ver lista". 4. Conceitos táticos viram diagrama de tabuleiro. 5. Premium "Gabinete" como camada de capa via GPT-5.5.

---

## 3. Frente A — Sistema de imagens (amplo: em todo lugar)

**Decisão do dono:** o app deve ser bastante visual — imagens em todo lugar, não só nos conceitos táticos.

**A1 — Conceitos táticos (SVG, eu faço agora):**
- **`TacticDiagram` (SVG, `src/ui/art/`)**: mini-tabuleiro real (cores Lichess #f0d9b5/#b58863) com peças + setas. Sem texto na imagem. `role="img"` + `aria-label`. Tema escuro por tokens. Lazy mount via IntersectionObserver (council H3).
- **Inventário (~12):** `hanging-piece`, `fork`, `pin`, `skewer`, `discovered`, `mate-in-1`, `mate-in-2`, `opening-principles`, `endgame-pawn`, `endgame-rook`, `conversion`, `blunder-rate`. Cada posição **validada contra o recurso canônico** (council L3).

**A2 — Encaixes (slots) de imagem em todo o app** (eu construo os slots com SVG/placeholder; dono gera premium via GPT-5.5 e eu integro):
- **Boas-vindas/onboarding:** Professor recebendo; ícone por etapa do placement.
- **Plano do dia:** diagrama do tema por bloco; Professor reagindo por contexto; cena do gabinete.
- **Conclusão de bloco/dia:** Professor parabenizando metas ("treinou 6h"); imagem de marco; selo de bloco + contagem de exercícios.
- **Progresso:** diplomas como pergaminhos; cena de subida de banda; ícones por tema; conquistas.
- **Feedback do exercício:** Professor reagindo a acerto/erro.
- **Estados vazios/erros:** Professor pose neutra; ilustração "sem dados/conexão".
- **PWA:** ícone/splash do Lemos; imagem social.
- **Integração premium:** WebP, pares claro/escuro, poses ligadas aos tipos de mensagem do coach; arte dos 41 prompts (`prompts/geracao-imagens-gabinete-2026-06-11.md`).

---

## 4. Frente B — Modo foco / "por etapas"

- **Plano do dia → carrossel (Embla):** um `PlanBlockCard` grande por vez; swipe/drag + setas + teclado; "Bloco N de M" + pontinhos; **link "ver lista completa"** sempre disponível (decisão 2). a11y: `role="region"` + `aria-roledescription="carousel"`.
- **`PlanBlockCard` enxuto:** ação + título + `TacticDiagram` sempre visíveis; "por que / nota do coach / quando parar" recolhíveis.
- **Placement uma pergunta por vez:** 3 fieldsets viram passos com indicador 1/3, 2/3, 3/3 (`PlacementCard.tsx:144`).
- **Aprovação do plano:** já é colapsável (H1) — só adicionar indicador de passo se a revisão pedir; **não recriar colapso**.
- **Config "Dados locais" → 3 sub-cartões:** Status (read-only) · Backup (export/restaurar) · **Zona de Perigo** (apagar tudo, com cor de alerta e separador) — trabalho novo (L2).
- **Marcos da sessão → linha do tempo visual** (`SessionMilestonesCard.tsx:42`).

---

## 5. Frente C — Mobile impecável

- **Quebras órfãs:** `text-wrap: balance/pretty` e/ou `&nbsp;` em pares ("no Lichess", "só executa").
- **Acentuação (correção objetiva):** rodapé `appIdentity.ts:10` ("e"→"é", "nao"→"não") e `PRIVACY_SUMMARY` `appIdentity.ts:19-24` (`so→só`, `Nao→Não`, `ha→há`, `historico→histórico`, `publicos→públicos`, `diagnostico→diagnóstico`, `Voce→Você`, `Configuracao→Configuração`).
- **7 riscos de CSS — confirmar no app real (375px) antes de corrigir:** reflow `today-columns`/`aside`; `form-grid` 1 coluna; texto de botão estourando; `fold-summary` truncando; `skill-map-row` `flex-wrap`; placeholder gigante `LearningPlanProposalCard.tsx:205`; confirmações inline → modal.
- **Alvos ≥ 44px** nos componentes novos.

---

## 6. Frente D — Auditoria + gates

- Gates: `lint` 0 · `test` 0 · `coverage` **5× verde** · `build` 0 (`tsc -b && vite build`) · `smoke:pwa` verde.
- **Teste mobile automatizado** (council M3): Playwright 375×812 + `toHaveScreenshot()` + axe.
- **a11y por fase** (council M4), não só no fim.
- Verificação visual real via `preview_inspect`/`preview_snapshot` (screenshot instável neste ambiente).

---

## 7. Frente E — Métricas honestas (substitui "timer")

**Pivô do dono (decisão 4):** o **tempo de relógio sai de cena como fonte de verdade.**

- **Métrica principal = exercícios feitos**, real, já puxada do Lichess (`summarizePuzzleActivity.puzzles`). Destacar contagem/acertos no progresso e no fechamento de bloco.
- **Tempo (secundário) = estimado pelos timestamps do Lichess:** somar intervalos entre puzzles consecutivos, **descartando pausas longas** (ex.: gap > 5 min não conta) e com **teto por bloco**. Para blocos sem atividade Lichess (estudos/lições), **não exibir tempo** — só "concluído".
- **Remover a dependência de `elapsedSeconds` wall-clock** como verdade: `trainingSession.ts:80` deixa de definir métrica; passa a marcar "concluído" e, quando houver, anexar o tempo estimado. Manter `timeLimitReached` só como sinal opcional.
- Resultado: consistência/progresso refletem **esforço real** (exercícios), não tempo de aba aberta — crítico para perfil TDAH.

---

## 8. Frente F — Pedagogia (a mais pesada; TDD obrigatório)

**8.1 Progressão de banda COMPLETA (decisão 5) — maior risco:**
- **Promover `profile.band`** quando: (a) o diploma da banda atual é conquistado (diplomas já gatekeeping bandas '0-600'/'600-1000'/'1000-1200', `diplomas.ts:32`), e/ou (b) `computeMastery` sustenta `'advance'` numa janela.
- **Ativar `computeMastery` no plano:** `generatePlan` deixa de usar `masteryTarget` hardcoded `'review'` e passa a derivar de `computeMastery` (hoje código morto, `mastery.ts:19`).
- **UI:** feedback sóbrio de subida de faixa; sem promessa de rating (regra `bands.ts:3`).
- **Risco/gate:** muda o núcleo do plano → testes primeiro, `coverage` 5× verde, sem regressão de thresholds.

**8.2 Suavizar lógica de estágio (decisão 6):** "fácil" → avança 1 estágio (não pula consolidação); "difícil" → `explain` mas **reavalia após N acertos** (sem trava permanente) (`generatePlan.ts:419-449`).

**8.3 Anti-repetição (serve direto ao "não enjoar"):**
- Dedup transferência: quando só há 1 fraqueza, transferência = **replay do recurso de menor acerto** (council M2), não o mesmo tema (`generatePlan.ts:313,577`).
- **Cooldown** de tema entre dias, **com exceção por erro recente** (council M5).
- Dedup de replay em sessões consecutivas (`resourceSelector.ts:136`).
- **Corrigir rótulo de confiança:** não exibir `low`+score≥0.5 como "média" (`learningPlanProposal.ts:76`).

**8.4 Testes de game (ponta a ponta):** jogar onboarding → placement → aprovar plano → abrir lição → concluir → progresso/diploma/subida de banda; registrar travas com evidência.

*(Catálogo 100% em inglês com UI PT = follow-up de localização, não bloqueia beta.)*

---

## 9. Fora de escopo (follow-up no relatório)

- P4 sync / backend Cloudflare (só doc, feito).
- Currículo avançado 1200–2200.
- Trocar `sonner` (só se provar bloqueio de CSP).
- Localização do catálogo Lichess (EN→PT).
- Nome público final e URL do código-fonte (dependem do dono; centralizados).
- Geração raster premium (Gabinete) — preparar, geração é etapa à parte via GPT-5.5.
- **Treino offline in-app (estudar no metrô)** — milestone próprio depois: cachear puzzles do dia + tabuleiro interativo in-app + sincronizar; verificar licença do banco de puzzles (clean-room).

---

## 10. Plano de execução (fases longas e autônomas; gates verdes encerram cada fase)

- **Fase 0 — Verificação mobile real:** rodar em 375px, confirmar/derrubar os 7 riscos de CSS; lista de bugs reais com evidência. Criar o teste Playwright 375px.
- **Fase 1 — Correções objetivas:** acentuação, quebras órfãs, riscos de mobile confirmados.
- **Fase 2 — `TacticDiagram`** + 12 diagramas (validados contra recurso canônico) + lazy mount + gate a11y.
- **Fase 3 — Métricas honestas (Frente E):** contagem de exercícios como métrica principal; tempo estimado por timestamp; remover wall-clock como verdade.
- **Fase 4 — Modo foco (Embla) + chunking** (carrossel + "ver lista", placement em passos, Config zona de perigo, marcos em timeline) + gate a11y.
- **Fase 5 — Anti-repetição + estágio suave + rótulo de confiança** (8.2, 8.3) — TDD.
- **Fase 6 — Progressão de banda + `computeMastery` (8.1)** — a mais arriscada, isolada e com os testes mais fortes; coverage 5×.
- **Fase 7 — Testes de game ponta a ponta + gates finais + relatório único.**

---

## 11. Gate de revisão

Council já rodou sobre a v1 deste spec (`docs/review/REVIEWS-finalizacao-design-ux-20260619.md`) e foi incorporado. Próximo passo: `writing-plans` para detalhar as fases em tarefas executáveis com testes.
