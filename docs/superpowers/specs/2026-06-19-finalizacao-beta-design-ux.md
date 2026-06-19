# Spec — Finalização do beta: design, UX, imagens didáticas, pedagogia e timer honesto

**Data:** 2026-06-19
**Status:** direção visual **aprovada pelo dono**; demais frentes são **recomendações fundamentadas em auditoria**, marcadas para revisão do council.
**Antecedente:** o beta local-first já foi fechado (a11y axe, CSP, privacidade in-app, doc E2EE, gates verdes — ver `prompts/codex-finalizar-beta-local-first-2026-06-19.md` e `docs/review/relatorio-finalizacao-beta-local-first-2026-06-19.md`). Esta fase é a **finalização de produto**: deixar o app com cara de **app de xadrez, não de livro**, impecável no mobile, com aprendizado que não enjoa.

---

## 1. Princípios de design (APROVADOS pelo dono)

1. **Menos livro, mais app de xadrez.** Trocar paredões de texto por hierarquia visual, chips e imagens.
2. **Por etapas (progressive disclosure).** Mostrar uma coisa por vez em vez de tudo na mesma rolagem.
3. **Plano do dia = modo foco com swipe horizontal.** Um bloco grande por vez num carrossel; arrasta pro lado pra ver os próximos passos; pontinhos de progresso (●●○○○). Cada bloco traz o **tabuleiro ilustrando o que será estudado** e **uma ação clara** (ex.: "Abrir no Lichess →").
4. **Imagens didáticas = diagrama de tabuleiro (estilo A).** Cada conceito tático (garfo, cravada, espeto, descoberto…) ganha um mini-tabuleiro real com peças + setas mostrando o golpe. Precisão pedagógica primeiro.
5. **Camada premium artística = "Gabinete do Professor Lemos" (gouache quente), gerada via GPT-5.5.** Entra como capa/recompensa, não em cada conceito. Reaproveita os 41 prompts já escritos (`prompts/geracao-imagens-gabinete-2026-06-11.md`) e o pipeline de imagem existente (`output/imagegen/`, `public/art`).

---

## 2. Frente A — Sistema de imagens didáticas

**Objetivo:** reduzir texto e ajudar a memorizar via imagem.

- **Componente novo `TacticDiagram`** (SVG, em `src/ui/art/`): recebe um conceito (tag de fraqueza / tema Lichess) e renderiza um mini-tabuleiro com as peças e setas do golpe. Cores estilo Lichess (#f0d9b5 / #b58863) para reforçar "xadrez de verdade". Sem texto dentro da imagem (regra de assets já registrada).
- **Inventário de conceitos a ilustrar** (derivado de `resourceCatalog.ts:852` e das tags de fraqueza): `hanging-piece`, `fork`, `pin`, `skewer`, `discovered`, `mate-in-1`, `mate-in-2`, `opening-principles`, `endgame-pawn`, `endgame-rook`, `conversion`, `blunder-rate`. ~12 diagramas.
- **Onde aparece:** no card de bloco do modo foco (Frente B), no card de tema do dia, e como reforço nos pontos onde hoje há só texto explicando a tática.
- **Tema escuro:** SVG adapta via tokens; sem pares raster.
- **Camada premium (depois):** capa de tela/recompensa com a estética Gabinete, gerada via GPT-5.5. Não bloqueia esta fase.

**Acessibilidade:** cada diagrama precisa de `role="img"` + `aria-label` descrevendo o golpe ("Cavalo ataca rei e dama ao mesmo tempo — garfo").

---

## 3. Frente B — Modo foco / "por etapas"

**Objetivo:** o app deixa de ser uma lista-livro para rolar e passa a guiar uma etapa por vez.

- **Plano do dia (Today) → carrossel de blocos (swipe horizontal).** Um `PlanBlockCard` grande por vez; swipe/arrasto e/ou setas para navegar; indicador "Bloco N de M" + pontinhos. Mantém acessível por teclado (setas) e por toque. **Decisão de fallback:** um link "ver lista completa" para quem prefere a visão geral (mitiga risco de esconder informação).
- **`PlanBlockCard` enxuto:** ação e título sempre visíveis + tabuleiro do tema; "por que isto", "nota do coach" e "quando parar" viram conteúdo **recolhível** (não somem — ficam a um toque). Ref.: `PlanBlockCard.tsx:82-98`.
- **Placement uma pergunta por vez:** os 3 fieldsets (experiência, tática, finais) viram passos com indicador "1/3, 2/3, 3/3". Ref.: `PlacementCard.tsx:144-236`.
- **Aprovação do plano em passos:** estratégia → como foi montado → como medimos → aprovar, revelados um a um em vez de tudo na mesma rolagem. Ref.: `LearningPlanProposalCard.tsx:147-244`.
- **Config "Dados locais" em sub-cartões:** status (read-only) · backup/restaurar · zona de perigo (limpar tudo). Ref.: `Config.tsx:288-397`.
- **Marcos da sessão como linha do tempo visual** em vez de lista de stats. Ref.: `SessionMilestonesCard.tsx:42-57`.

---

## 4. Frente C — Mobile impecável

**Objetivo:** zero quebra feia, zero estouro, tudo legível e tocável em 375px.

- **Quebras órfãs:** balancear linhas (ex.: `text-wrap: balance`/`pretty` ou `&nbsp;` em pares como "no Lichess", "só executa") para palavras viúvas não caírem sozinhas. Confirmadas na tela de boas-vindas; varrer todas.
- **Acentuação faltando (correção objetiva):**
  - `src/config/appIdentity.ts:10` (rodapé): "Rotina **e** um app **nao** oficial, **nao** afiliado…" → "é", "não".
  - `src/config/appIdentity.ts:19-24` (`PRIVACY_SUMMARY`, adicionado na rodada anterior): `so→só`, `Nao→Não`, `ha→há`, `historico→histórico`, `publicos→públicos`, `diagnostico→diagnóstico`, `Voce→Você`, `Configuracao→Configuração`.
- **7 riscos de mobile a VERIFICAR no CSS real** (o agente não leu o CSS; **eu confirmo no app rodando** antes de corrigir, para não inventar bug): reflow de `today-columns`/`today-aside` em 1 coluna; `form-grid` em 1 coluna no celular; texto de botão estourando; truncamento do `fold-summary`; `skill-map-row` com `flex-wrap`; placeholder gigante em `LearningPlanProposalCard.tsx:205`; confirmações inline de "restaurar/limpar" virarem modal real.
- **Alvos de toque ≥ 44px** (já parcialmente feito) — reverificar nos novos componentes.

---

## 5. Frente D — Auditoria completa (com gates objetivos)

Substitui checkpoints humanos por gates verdes:

- `npm run lint` → exit 0
- `npm test` → exit 0
- `npm run coverage` → 5× verde (suíte flaky sob ordem; 5× é o gate de estabilidade) — não regredir thresholds
- `npm run build` → exit 0 (`tsc -b && vite build` estrito)
- `npm run smoke:pwa` → verde (inclui `a11y.spec.ts` e `csp.spec.ts`)
- **Verificação visual real:** rodar o app em 375px e inspeçar os pontos do item 4 com `preview_inspect`/`preview_snapshot` (screenshot está instável neste ambiente — usar inspeção de estilos, que é mais precisa para cor/espaçamento).

---

## 6. Frente E — Timer honesto

**Problema confirmado no código:** não existe cronômetro. O "tempo treinado" é `completedAt − startedAt` puro (`trainingSession.ts:80`, `elapsedSecondsBetween`). Abrir → distrair → voltar 2h → "concluir" registra 2h. Sem pausa, sem idle, sem teto. Para **estudos** (não-puzzle) nem há reconciliação.

**Insight decisivo:** o treino real acontece **no Lichess** (aba/app externo). Logo, "pausar quando a aba fica oculta" estaria errado — ocultar é justamente quando a pessoa está treinando lá. O app **não tem como saber** se você está no Lichess ou distraído.

**Recomendação (a validar no council):**
1. **Crédito honesto por padrão = tempo planejado**, não relógio de parede, quando o relógio de parede for absurdo. Se `wall-clock ≤ ~1.5× planned`, confiar no relógio; acima disso, creditar o planejado.
2. **Pergunta só na anomalia:** ao concluir um bloco aberto há muito tempo (ex.: > 2× planejado), um toque rápido — "Ficou Xh com este bloco aberto. Quanto você realmente treinou?" → [o planejado] [metade] [tudo] — em vez de inventar.
3. **Teto absoluto por bloco** (ex.: 90 min) como rede de segurança.
4. Para **puzzles**, aproveitar que já há reconciliação com a atividade Lichess para estimar tempo ativo a partir dos timestamps dos puzzles.

Métricas afetadas (consistência, tempo total, progresso) passam a refletir esforço real — crítico para um perfil TDAH, em que a distração é a regra, não a exceção.

---

## 7. Frente F — Testes de game (ponta a ponta + pedagogia)

**Parte 1 — jogar o app inteiro como usuário:** onboarding → placement → aprovar plano → abrir lição/estudo no Lichess → concluir → ver progresso/diploma. Caçar travas, confusões e textos que confundem. Registrar com evidência.

**Parte 2 — auditoria pedagógica (achados já levantados, com evidência):**
- **Lições batem com o nível?** Sim — `resourceSelector` filtra recursos por banda do aprendiz. ✓
- **Repetição/tédio — RISCOS REAIS:**
  - Sessão de 30 min com **uma só fraqueza detectada**: o bloco "transferência" repete o **mesmo tema** do principal (`generatePlan.ts:313, 577-581`).
  - **Sem cooldown** para fraquezas vindas de jogos — o mesmo tema pode voltar em dias seguidos.
  - **Replay duplicado:** tema com erros recentes pode ser escolhido para replay em sessões consecutivas (`resourceSelector.ts:136-185`).
- **Progressão de nível não existe de fato:** as 7 bandas são organização interna; **nada promove o aprendiz de banda** ao melhorar; diplomas são visíveis mas não "passam de fase". Dificuldade pode estagnar e enjoar.
- **`computeMastery` é código morto** no plano (`mastery.ts` definido, nunca chamado em `generatePlan`). Avanço é só por feedback, não por acerto. **Isto foi decisão prévia de adiar**, não bug acidental.
- **Lógica de estágio dura:** feedback "fácil" pula direto pra `retrieval` (pula consolidação); "difícil" trava em `explain` sem timeout (`generatePlan.ts:419-449`).
- **Rótulo de confiança:** `low` + score≥0.5 é exibido como "média" ao aprendiz (`learningPlanProposal.ts:76-96`).
- **Catálogo 100% em inglês** embora a UI seja PT (`resourceCatalog.ts`) — lacuna de localização, não erro pedagógico.

**O que proponho CORRIGIR nesta fase (baixo risco, serve direto ao "não enjoar"):**
- Dedup secundária = primária (não repetir o mesmo tema no bloco de transferência quando só há 1 fraqueza).
- Cooldown/spacing mínimo para repetir o mesmo tema em dias seguidos.
- Dedup de replay em sessões consecutivas.
- Corrigir o rótulo de confiança.

---

## 8. Decisões ABERTAS para o council (o dono delegou o "como")

1. **Quão "modo foco"?** Carrossel swipe substitui a lista, ou convivem (foco + "ver lista")? (Recomendo conviver.)
2. **Timer honesto:** a abordagem da Frente E (crédito planejado + pergunta na anomalia + teto) é a certa, ou outra?
3. **Progressão de banda:** implementar promoção de banda por desempenho/diploma agora, ou manter fora de escopo (é feature grande, havia decisão de adiar)?
4. **Ativar `computeMastery` no plano** ou manter adiado?
5. **Lógica de estágio** ("fácil" pular, "difícil" travar) — ajustar para algo mais gradual?

---

## 9. Fora de escopo (não fazer; registrar como follow-up)

- **P4 sync / backend Cloudflare** (só doc de contrato, já feito).
- **Currículo avançado 1200–2200** (scaffold; depende de validação futura).
- **Trocar `sonner`** (só se provar bloqueio de CSP).
- **Nome público final e URL do código-fonte** (dependem do dono; já centralizados).
- Camada premium raster completa (Gabinete) — preparar, mas geração é etapa à parte via GPT-5.5.

---

## 10. Plano de execução (fases longas e autônomas)

Cada fase termina em gates verdes; um relatório único no fim.

- **Fase 0 — Verificação mobile real:** rodar o app em 375px, confirmar/derrubar os 7 riscos de CSS; produzir lista de bugs reais com evidência.
- **Fase 1 — Correções objetivas:** acentuação (rodapé + PRIVACY_SUMMARY), quebras órfãs, riscos de mobile confirmados. (TDD onde houver lógica; CSS guiado por inspeção.)
- **Fase 2 — `TacticDiagram` + inventário de 12 diagramas** (estilo A), com a11y.
- **Fase 3 — Modo foco (carrossel swipe) + chunking** das telas paredão (placement em passos, aprovação em passos, Config em sub-cartões, marcos em timeline).
- **Fase 4 — Timer honesto** (conforme decisão do council).
- **Fase 5 — Correções de pedagogia de baixo risco** (dedup transferência, cooldown, dedup replay, rótulo de confiança).
- **Fase 6 — Testes de game ponta a ponta + gates finais + relatório único.**

Decisões de produto do council (seção 8) entram antes da fase correspondente.

---

## 11. Gate de revisão

Este spec vai ao **council** (`./council.ps1 docs/superpowers/specs/2026-06-19-finalizacao-beta-design-ux.md`) para revisão independente (GPT-5.5-Pro + DeepSeek-V4-Pro). As respostas HIGH/MEDIUM são incorporadas antes do `writing-plans`.
