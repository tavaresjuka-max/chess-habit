# Revisão Técnica — Fechamento da Finalização (Professor Lemos Beta Pessoal)

---

## 1. Resumo

Rodada de finalização entregou 6 frentes (mobile, diagramas táticos, métricas honestas no timer, carrossel foco, pedagogia de estágios, progressão de banda) com gates verdes (80 arquivos, 652 testes). O saldo técnico é positivo: o app está funcional, testado, e as correções atacam dores reais de um beta pessoal. Porém, três itens pendentes criam um **desequilíbrio de coerência**: o Progresso ainda soma wall-clock enquanto o timer já migrou para exercícios; a banda foi implementada mas é no-op sem gravação de diploma; e o `computeMastery` é código morto. A dívida mais urgente é a **coerência métrica** (visível ao usuário), não features novas.

---

## 2. Pontos Fortes

- **Métricas honestas bem calibradas.** A heurística de `estimateActiveSeconds` (gaps < 3 min, piso 8s, teto 1h) é defensável para um beta pessoal. Testes cobrem edge cases (vazio, single, gaps longos, cap). A decisão de usar nº de exercícios como métrica principal é pedagogicamente correta e resistente a "deixar o timer rodando".
- **Migração para carrossel com fallback.** Embla Carousel com toggle "Ver lista" resolve o trade-off foco vs panorama. O fallback de lista cobre o risco de desktop (mouse awkward para swipe) e o `IntersectionObserver` mitiga o risco de 12 SVGs simultâneos. Acessibilidade razoável (`role="region"`, `aria-roledescription`, `aria-live`).
- **Diagramas táticos bem projetados.** 13 conceitos com validação programática (todas as peças/setas/marcas dentro do tabuleiro), lazy loading com fallback para jsdom, e `role="img"` + `aria-label`. A separação specs/componente é limpa e extensível.
- **Promoção de banda arquiteturalmente correta.** `promoteBandForDiplomas` é pura, testada, chamada no fluxo certo (`saveProfile` pós-`generatePlan`). O descasamento bandas-diplomas foi resolvido (2 bandas do learner por diploma). O fato de ser no-op não é defeito de código — é ausência de trigger na UI.
- **Gate verde consistente.** 652 testes passando, lint `--max-warnings=0`, build limpo. A disciplina de gate antes de fechar tarefa foi mantida.

---

## 3. Riscos / Lacunas

### HIGH

| # | Achado | Evidência |
|---|--------|-----------|
| **H1** | **Incoerência métrica Progresso vs Timer.** `SessionMilestonesCard` e `progressOverview` (funções `buildTrackEffort`, `buildProgressTrend`) ainda usam `elapsedSeconds` (wall-clock), enquanto o `PlanBlockCard.formatTimerStatus` já migrou para `activeSeconds` (exercícios). O usuário vê "X exercícios" no timer mas "Y horas" no Progresso. | `progressOverview.ts:84,110` (ainda soma `elapsedSeconds`); `puzzleActivity.ts:70-101` (já calcula exercícios). Confirmado na doc de fechamento. |
| **H2** | **`computeMastery` é código morto.** Definido em `mastery.ts`, testado, mas `masteryTarget` em `generatePlan` é hardcoded `'review'`. A trilha `progress-diplomas` existe em `selectMethodTrack` mas nunca é ativada. Isso significa que **toda a camada de adaptação por domínio está desligada**. | `generatePlan.ts` (sem chamada a `computeMastery`); `roadmap-beta-2026-06-16.md` (bug #3: "Pedagogia adaptativa morta"). |

### MEDIUM

| # | Achado | Evidência |
|---|--------|-----------|
| **M1** | **Promoção de banda entregue como no-op.** `saveDiplomaAttempt` não tem chamador em produção. A banda só sobe se houver `DiplomaAttempt` registrado — e nunca há. Para beta pessoal, o usuário pode passar meses sem nunca subir de banda, apesar do código estar pronto. | `appData.ts:326` (função existe, sem caller de UI); confirmado na doc de fechamento. |
| **M2** | **`advanceThemeStage` sem teste unitário direto.** A função controla a progressão pedagógica de estágios (explain→guided→retrieval→transfer) mas só é testada indiretamente via `generatePlan.test.ts`. O bug corrigido (fácil pulava consolidação) não tem teste de regressão dedicado. | Busca por `advanceThemeStage` em `*.test.*` retornou zero resultados. |
| **M3** | **`SessionMilestonesCard` (174 linhas) com 1 teste.** Cobertura insuficiente para um componente que renderiza 6 seções distintas (progresso, badges, stats, sinais, timeline, evolução). Auditoria anterior já sinalizou isso. | `SessionMilestonesCard.test.tsx` — 1 teste de renderização básica. |
| **M4** | **Chess.com diagnóstico mudo (294 sinais → 0 fraquezas).** Bug #1 do roadmap-beta. Limiares de `judgment` e `clock` calibrados para Lichess (blunders individuais); Chess.com expõe accuracy agregada. Para o dono (que joga no Chess.com), o diagnóstico da fonte primária é inútil. | `roadmap-beta-2026-06-16.md` (bug #1, CRÍTICO). Fora do escopo desta finalização, mas bloqueia valor da feature P1. |

### LOW

| # | Achado | Evidência |
|---|--------|-----------|
| **L1** | **Botão "Pular" sem confirmação.** `PlanBlockCard.tsx:228` — clique único pula o bloco sem undo. Em mobile, toque acidental é plausível. | Código; mencionado em auditoria anterior. |
| **L2** | **CSP `style-src 'unsafe-inline'` por dependência do `sonner`.** Documentado, assumido. Para beta pessoal é aceitável; para P5 comunidade precisa de mitigação. | `relatorio-finalizacao-beta-local-first-2026-06-19.md`. |
| **L3** | **`getEvidenceLevel` rotula low-confidence (score ≥ 0.5) como "média".** Bug #9 do roadmap. Distorce rótulo de confiança; já parcialmente corrigido pela Fase 5a (não vira "média"), mas a função subjacente continua errada. | `roadmap-beta-2026-06-16.md` (bug #9, BAIXO). |

---

## 4. Sugestões Concretas

### Imediatas (fechar AGORA, antes de declarar beta pessoal concluído)

1. **Corrigir a incoerência métrica (H1).** Migrar `buildTrackEffort` e `buildProgressTrend` de `elapsedSeconds` para `activeSeconds` (somar exercícios). Em `SessionMilestonesCard`, trocar "X horas" por "X exercícios" (ou "X puzzles"). Isso é cirurgia de ~30 linhas em 2 arquivos (`progressOverview.ts` + `SessionMilestonesCard.tsx`) com ajuste de tipos e testes. **Maior valor visível para o usuário.**

2. **Implementar gatilho mínimo de gravação de diploma (resolve M1).** Após completar todos os blocos do dia (estado "done" em todos), verificar `isDiplomaPassed` para a banda atual e, se passar, chamar `saveDiplomaAttempt`. Sem UI dedicada — um toast "Diploma de Peão conquistado!" basta. Isso destrava a progressão de banda que já está 100% implementada no backend. ~40 linhas em `Today.tsx` ou `trainingFlow.ts`.

3. **Adicionar teste unitário para `advanceThemeStage` (M2).** 4 casos: sem estágio anterior → `guided`; `good` → avança 1 (capped em `retrieval`); `easy` → avança 1 (capped em `transfer`); `hard` → `explain`. ~20 linhas de teste. Previne regressão do bug pedagógico já corrigido.

### Próxima rodada (follow-up de alto valor)

4. **Ativar `computeMastery` nos blocos normais (H2).** Conectar `computeMastery` ao `generatePlan` para que `masteryTarget` não seja hardcoded `'review'`. Isso fecha o bug #3 do roadmap e faz a pedagogia adaptativa funcionar de fato.

5. **Corrigir diagnóstico Chess.com (M4).** Recalibrar limiares ou extrair sinais diferentes para Chess.com (accuracy em vez de blunder individual). É a queixa do dono e bloqueia valor da feature P1.

### Deixar como follow-up (não travar o beta pessoal)

6. **5b anti-repetição.** Para 1 usuário, 1 sessão/dia, com catálogo grande, repetição de URL é rara. A penalidade -900 no `resourceSelector` já cobre 80% dos casos. Fechar depois.
7. **Ampliar cobertura do `SessionMilestonesCard` (M3).** Importante, mas não bloqueia beta pessoal se o componente funciona.
8. **Confirmação no botão "Pular" (L1).** Baixo impacto; toque acidental em mobile é chato mas não perde dados.

---

## 5. Risco Geral: **MEDIUM**

O app está **funcional e seguro** para beta pessoal. Nenhum HIGH é corrupção de dados, vazamento de privacidade, ou crash. Os dois HIGH (H1, H2) são de **coerência de produto**: métricas contraditórias e pedagogia adaptativa desligada. O primeiro é visível ao usuário; o segundo é invisível mas limita a eficácia do treino. Ambos têm correção de baixo risco (cirurgia localizada, testes existentes como rede de segurança). O MEDIUM mais preocupante (M1 — banda no-op) é estrutural mas também de correção simples com o gatilho mínimo sugerido.

**Recomendação:** Fechar H1 + M1 + M2 (~2h de trabalho) e declarar o beta pessoal concluído. H2 + M4 entram na próxima rodada. 5b, cobertura de teste e polish de UX seguem como backlog.

---

### Respostas diretas às 5 perguntas

1. **Prioridade: agregação do Progresso (H1) > gatilho de diploma (M1) > 5b.** A coerência métrica é o que o usuário vê todo dia. O diploma destrava a banda com zero atrito. Anti-repetição é overkill para 1 usuário.

2. **Aceitável entregar com banda no-op? Sim, mas não recomendável.** O código está limpo e testado — o risco é zero de quebrar algo. Mas implementar o gatilho mínimo (verificar diploma após completar todos os blocos do dia) custa ~40 linhas e transforma uma feature dormente em funcional. Para um beta pessoal, eu implementaria o gatilho agora.

3. **Risco em decisões já entregues?** A heurística de `estimateActiveSeconds` (gaps < 3 min) é honesta e tem piso/teto — baixo risco. O carrossel tem fallback de lista — risco médio-baixo de UX frustrante em desktop, mitigado pelo toggle. O avanço de "fácil" até `transfer` é **correto pedagogicamente** — o risco seria se ainda pulasse consolidação, mas isso foi corrigido.

4. **Over-engineering ou incoerências?** `computeMastery` código morto é incoerência (testado, nunca chamado). O sistema de diplomas (3 tiers, bandas, thresholds) está completo no backend mas sem trigger — é "half-built". Fora isso, a arquitetura está coerente: as 6 frentes se encaixam sem conflito.

5. **Desperdício fechar agora vs follow-up:** 5b (anti-repetição) é o maior desperdício para beta pessoal — o catálogo é grande, 1 sessão/dia, repetição é rara. `computeMastery` (6b) também: para <100 sessões, os dados de maestria são esparsos demais para informar decisões confiáveis. O que **não** é desperdício fechar agora: métricas coerentes (H1) e gatilho mínimo de diploma (M1) — juntos, ~2h e o beta pessoal fica redondo.

---

**Próxima ação recomendada:** Implementar H1 (métricas coerentes) + M1 (gatilho diploma) + M2 (teste advanceThemeStage). Modelo: **Sonnet 4.6** (implementação de rotina com plano claro). Após isso, rodar gates e declarar beta pessoal concluído.
