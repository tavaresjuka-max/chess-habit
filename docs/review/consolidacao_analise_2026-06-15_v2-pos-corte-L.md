# Consolidação da Análise — lichess-tutor / "Rotina" (Diretor, 2026-06-15 v2, pós-Corte L)

> **Pacote de decisão, não resumo.** Julgo **cinco** auditorias 360° de hoje contra o **código do HEAD
> atual** (rodei os gates nesta sessão). Diretor: Claude Opus 4.8.
>
> **Por que esta consolidação substitui a `consolidacao_analise_2026-06-15.md` (v1, manhã):** a v1
> reconciliou 4 revisores contra um HEAD **anterior**. Entre a manhã e agora, o time **executou** os
> cortes J1–J4 (higiene, CI, durabilidade, pedagogia) e a refatoração **Corte L** (quebra do God-hook).
> **Quatro dos cinco relatórios (Gemini, DeepSeek, Codex, Claude-opus original) auditaram código que não
> existe mais** — citam `state.ts:1296`, `Config.tsx:61-62`, "sem CI", "sem manualChunks", "computeMastery
> morto", "8 testes quebrados". O quinto (meu `analise_completa_claude-opus-4.8_pos-corte-L`) e os gates
> de hoje são a verdade corrente. **A maioria dos achados válidos dos 4 já foi implementada.** Governança:
> relatório que contradiz o código perde; consenso entre revisores que rodaram um HEAD velho **não é prova**.

---

## 0. Veredito executivo

O app **subiu de fato** desde a v1: God-hook quebrado (`state.ts` 1.296→440 ln), **CI nasceu**
(`ci.yml`), leak de PII removido, `aria-current`/alvos 44px, sourcemaps+code-split, índice de review,
**e2e smoke offline**, `computeMastery`/diploma **ligados** (Corte K), e **82,99% de cobertura** medida.

**Gates rodados nesta sessão (a fonte da verdade):** `test` **524/525** (o "1 fail" é flaky de timing em
`trainingFlow.test.tsx:65`, passa 22/22 isolado); `lint` limpo; `tsc -b` exit 0; `build` exit 0
(sourcemaps + chunks); `coverage` **82,99% stmts / 76,18% branch / 89,29% funcs**.

**Nota global do diretor: 7,6 / 10** (sobe de 7,2 na v1). Não é média (média dos 5 daria ~7,7, inflada por
Gemini/Codex que rodaram HEAD velho): ponderei por evidência **contra o código atual**, creditando o que
foi corrigido e penalizando furos novos que o estado anterior escondia.

**As 5 decisões mais importantes:**
1. **ARQUIVAR como majoritariamente RESOLVIDOS** os relatórios Gemini/DeepSeek/Codex/Claude-opus(orig.):
   dos ~22 achados válidos da v1, **~14 estão FIXED** (CI, refator, leak, a11y, manualChunks, computeMastery,
   diploma, dedup de sync, índice, `persist()`). Não reabrir o que já foi feito.
2. **ACEITAR e corrigir já (Fase A, sem decisão de produto):** os achados que **sobreviveram** ao refator —
   `useAppData` gera plano de boot **sem `diplomaAttempts`** (`useAppData.ts:184`), `observedAt` do
   Chess.com anula frescor de 90d (`chesscomClient.ts:45`), `openExternalUrl` sem allowlist
   (`externalOpen.ts:1`), `ui/Config.tsx→infra/` (única quebra de camada), bloco `final` hardcoded
   (`generatePlan.ts:339`), atomicidade de `saveProfile`/reconcile, flaky test, doc drift, `output/playwright`
   fora do gitignore. Esforço P–M, alto ROI.
3. **DONO DECIDE (pedagogia/produto):** puzzle→fraqueza **durável** (hoje é inferência episódica),
   `accuracy<70` por banda, bloco `final` por banda, métricas de eficácia realimentam o plano? Define o
   "pronto" pedagógico.
4. **CALIBRAÇÃO DE PESO FUTURO:** **Codex** segue o mais confiável (achados que sobreviveram ao refator são
   dele); **DeepSeek** continua com alta taxa de falso-positivo nos *High* ("8 testes quebrados" = falso
   contra 524/525); **Gemini** infla notas e alucina falha de teste. Detalhe na §4.
5. **REJEITAR (falsos contra o HEAD atual):** "8 testes quebrados", "sem dark mode", "sem CI",
   "computeMastery morto", "manualChunks ausente", "429 engolido", "usernames no bundle" — todos refutados
   por código (Apêndice).

---

## 1. Notas finais por área (diretor ≠ média)

Colunas dos revisores = o que eles deram (contra HEAD velho, exceto a última do Claude que é pós-Corte L).
"Diretor" = nota contra o **código atual**, justificada por evidência.

| Área | Gem | DS | Cdx | Cl(orig) | Cl(pósL) | **Diretor** | Justificativa (evidência atual) |
|---|:--:|:--:|:--:|:--:|:--:|:--:|---|
| Correção & Bugs | 7,5 | 6 | 8,2 | 6,5 | 7,0 | **7,0** | Suíte verde (1 flaky); bugs reais hoje: `observedAt`/freshness e `diplomaAttempts` no boot |
| Qualidade de código | 8,0 | 8 | 7,4 | 7,5 | 7,5 | **7,5** | Split de hooks limpo; `[input]` quebra memo; `isPuzzleTrainingLog` casa por string |
| Arquitetura | 8,0 | 9 | 7,8 | 7,0 | 7,5 | **7,5** | Domínio puro exemplar; única quebra `ui/Config.tsx→infra/`; DS 9 ignora threading |
| Domínio / Pedagogia | 7,5 | 7 | 8,0 | 6,5 | 6,5 | **6,5** | Engine ok; loop com furos (final hardcoded, freshness, puzzle→fraqueza não-persistido) |
| Dados & Estado | 8,5 | 7 | 8,1 | 7,5 | 7,5 | **7,5** | Log↔plano atômico✓+checksum; faltam atomicidade `saveProfile`/reconcile, shape no import |
| Testes & QA | 7,8 | 6 | 8,4 | 7,0 | 7,5 | **7,5** | 524 testes + 83% cobertura + e2e real; hooks sem teste direto, 1 flaky. DS 6 = falsos |
| Documentação & Memória | 8,5 | 9 | 7,1 | 8,0 | 7,5 | **7,5** | Índice criado✓; drift `privacy-and-data.md:50`, sem README raiz |
| Processo & Tooling | 8,0 | 6 | 7,0 | 4,0 | 6,5 | **6,5** | **CI existe**✓; falta pre-commit, `output/playwright/` fora do gitignore. Gem 8,0 insustentável |
| Visual & Design | 9,0 | 9 | 8,6 | 8,0 | 8,0 | **8,0** | Identidade coesa; arte SVG provisória por decisão do dono |
| UX | 8,0 | 8 | 8,0 | 7,5 | 7,5 | **7,5** | Hero action-first + números (TDAH); sem focus-mgmt no lazy load, "Pular" sem undo |
| UI | 9,0 | 8 | 8,5 | 7,0 | 7,5 | **7,5** | `window.confirm` removido✓; falta busy-state, `h2`-in-`summary` |
| Conteúdo & Comunicação | 8,5 | 8 | 8,4 | 8,0 | 7,5 | **7,5** | pt-BR firme; escopos OAuth e "atividade livre"/"sinais manuais" sem explicação |
| Plataforma & Performance | 8,8 | 9 | 7,6 | 7,0 | 7,5 | **7,5** | PWA limpa, ~156 kB gzip, smoke offline; sem versão semântica. 8,8/9 otimistas |
| Acessibilidade & i18n | 8,0 | **3** | 7,5 | 6,5 | 7,0 | **7,0** | `aria-current`/44px✓, dark+reduced-motion✓; `h2`-in-`summary`. DS 3 = "sem dark" falso |
| Segurança & Privacidade | 9,2 | 8 | 7,8 | 6,5 | 6,5 | **6,5** | Leak **FIXED**✓, PKCE S256✓, token no Dexie✓; faltam headers + allowlist. Gem 9,2 inconsistente |
| Build, Release & Operação | 8,0 | 6 | 7,0 | 6,0 | 6,5 | **6,5** | sourcemaps+CI✓; sem `__APP_VERSION__`, smoke fora do CI, versão 0.0.0 |

---

## 2. Matriz de achados — status no HEAD atual

Reconcilia os 5 relatórios + minha auditoria pós-L. Veredito = o que o código provou **hoje**.

| # | Achado | Quem apontou | Evidência atual (file:line) | Veredito | Sev × Esf |
|---|---|---|---|---|---|
| 1 | `useAppData` gera plano de boot sem `diplomaAttempts` | Cl(pósL); Codex(espírito "buildPlanContext no load") | `useAppData.ts:184,191` | **OPEN — confirmado (li)** | Alto × P |
| 2 | `observedAt` Chess.com = data do import → anula frescor 90d | **Codex A1** (solo orig.); Cl(pósL) | `chesscomClient.ts:45`; `detectWeaknesses.ts:39` | **OPEN — confirmado** | Alto × M |
| 3 | `openExternalUrl` sem allowlist (vetor via backup) | **Codex A2**; Cl(pósL) | `externalOpen.ts:1`; `usePendingActions.ts:37` | **OPEN — confirmado (li)** | Médio × P |
| 4 | `ui/Config.tsx` importa de `infra/` (quebra de camada) | Cl(pósL); Gemini #5 (espírito) | `Config.tsx:5,7,11,12` | **OPEN — confirmado** | Médio × M |
| 5 | Bloco `final` 60min sempre `endgame-pawn` | Cl(pósL) | `generatePlan.ts:339-346` | **OPEN — confirmado** | Alto × P |
| 6 | Puzzle→fraqueza não persiste `Weakness` | Cl(pósL); DeepSeek #11 (mapping) | `generatePlan.ts:547-561` | **PARCIAL — bridge é inferência** | Médio × M |
| 7 | `saveProfile`/`reconcile` não-atômicos | Cl(pósL) | `state.ts:211`; `useStudyActions.ts:84` | **OPEN — confirmado** | Médio × P |
| 8 | Sem headers de segurança no deploy | **Codex A4**; DeepSeek #57; Gemini(implícito) | `vercel.json` (só X-Robots-Tag) | **OPEN** | Médio × P |
| 9 | `accuracy<70` Chess.com não calibrado por banda | Cl(pósL); v1 | `extractSignals.ts:180` | **PARCIAL — `kind:'accuracy'`, limiar fixo** | Médio × M |
| 10 | Teste flaky a timing | Cl(pósL) | `trainingFlow.test.tsx:65` | **OPEN — verificado (passa isolado)** | Médio × P |
| 11 | Drift doc: Study links no backup | **Codex A6** (auto-sinalizou); Cl(pósL) | `privacy-and-data.md:50` vs `appData.test.ts:457-459` | **OPEN — corrigir doc** | Médio × P |
| 12 | `output/playwright/` fora do `.gitignore` | Cl(pósL) | `.gitignore` (14 untracked) | **OPEN** | Baixo × P |
| 13 | Sem pre-commit; sem `__APP_VERSION__`; smoke fora do CI | DeepSeek #28; Cl(pósL); Codex A3 | `.husky` ausente; `vite.config.ts`; `ci.yml` | **OPEN** | Baixo–Médio × P |
| 14 | `resourceCatalog` switches sem `assertNever`; `[input]` deps; `isPuzzleTrainingLog` string | Cl(pósL) | `resourceCatalog.ts:981/991`; vários hooks; `trainingLogFlow.ts:230` | **OPEN — débito** | Baixo–Médio × P |
| 15 | Feedback `hard` em `explain` → `retrieval` (lógica?) | **DeepSeek #14** (solo) | `generatePlan.ts:376` | **INVESTIGAR — defensável, sem doc** | Baixo × P |
| 16 | `chesscomMonthSignals` cresce sem limite / cache sobrevive a restore | **DeepSeek #16/#19**; Cl(pósL) | `appData.ts` (import não limpa cache) | **PARCIAL — real, baixo** | Baixo × P |
| 17 | Recência Chess.com (sync lento, 60+ fetch) | DeepSeek #49; Codex A3 | `chesscomClient.ts:51-64` | **PARCIAL — UX, não bug** | Baixo × M |
| — | **JÁ FEITOS (FIXED)** ↓ | | | | |
| F1 | Sem CI/CD | Gem, DS, Cdx, Cl | `.github/workflows/ci.yml` | **FIXED** | — |
| F2 | God-hook `state.ts` 1.296 ln | todos | `state.ts` 440 ln + 8 hooks | **FIXED** | — |
| F3 | `computeMastery` morto / diploma inativo | Gem #2/#17, Cl | `useTrainingActions.ts:142` (Corte K) | **FIXED** | — |
| F4 | Usernames no bundle | Gem #3, Cl | `state.ts:428-440` (`undefined`) | **FIXED** | — |
| F5 | Sem manualChunks / bundle >500kB | Gem #12 | `vite.config.ts` chunks; ~156 kB gzip | **FIXED** | — |
| F6 | Duplicação chesscom/lichess sync | DS #3, Cl | `runDiagnosisSync` `useDiagnosisActions.ts:88` | **FIXED** | — |
| F7 | `window.confirm` no restore | Cl | `Config.tsx:96-98` inline | **FIXED** | — |
| F8 | nav sem `aria-current` / radios <44px | Cl | `App.tsx:144`; `index.css:2399` | **FIXED** | — |
| F9 | Playwright dep morta | Cl, DS #31 | `playwright.config.ts` + `e2e/pwa-offline.spec.ts` | **FIXED** | — |
| F10 | `persist()` cedo demais | Codex A5 | `useAppData.ts:96` | **FIXED** | — |
| F11 | Study links não exportados | Gemini #18 | `appData.test.ts:457-459` (entram) | **FIXED** (doc é que está stale → #11) | — |
| F12 | 429 do replay engolido | Gemini #6 | `trainingLogFlow.ts:264-266` propaga (Corte C) | **FIXED/FALSO** | — |

---

## 3. Divergências resolvidas (com código)

**D1 — A suíte passa? (a divergência mais cara, de novo).** DeepSeek: "**8 testes quebrados**"
(`trainingFlow.test.tsx:84,161,…`); Gemini: "408 passaram, **1 falhou**" (`preserveProgress.test.tsx:36`).
**Rodei `npm run test` nesta sessão: 524/525.** O único fail é `trainingFlow.test.tsx:65`, que **passa
22/22 isolado** (4,2 s) e só falhou sob contenção de CPU com lint+build concorrentes — **flaky de timing,
não regressão**. As linhas que o DeepSeek cita nem batem com o arquivo atual. **Veredito: falso contra o
HEAD; existe 1 fragilidade de timing real (Médio).** Certos: ninguém exatamente — eu, ao classificar o
flaky por execução isolada.

**D2 — `computeMastery`/diploma estão ligados?** Gemini #2/#17 e a auditoria da manhã: "morto/inativo".
**Corte K (`233049e`) ligou** `advancePendingItem` na conclusão do bloco; `masteryTargetFromCompletedLog`
→ `computeMastery` é chamado de `useTrainingActions.ts:142`. **Veredito: FIXED.** A crítica era correta no
HEAD velho; o trabalho do dia a resolveu.

**D3 — "Sem dark mode" → a11y 3 (DeepSeek) vs 8 (Gemini).** `index.css:1920`
`@media (prefers-color-scheme: dark)` existe (override completo). **Dark mode existe.** DeepSeek leu só
`index.css:74` e parou. **A11y real ~7,0** (`aria-current`/44px já corrigidos; resta `h2`-in-`summary`).
Certo: **Gemini** na existência; nenhum na nota (Gemini infla, DeepSeek despenca por premissa falsa).

**D4 — `applyAdaptiveReviewRatio` muta in-place? (DeepSeek High).** `.map(b => ({...b, kind}))` — **função
pura**. IDs criados depois. **Falso** (refutado já na v1). Certo: Claude.

**D5 — Feedback `hard` em `explain` é bug? (DeepSeek #14, solo).** `generatePlan.ts:376`:
`feedback==='hard' ? (stage==='explain' ? 'retrieval' : 'explain')`. **Verifiquei à mão:** é uma transição
**defensável** (achou a *explicação* difícil → ir para recuperação ativa em vez de reler), mas **sem
comentário/documentação**. **Veredito: INVESTIGAR (pergunta ao dono), não bug High.** DeepSeek merece
crédito por achar o ramo não-óbvio, demérito por gradá-lo High.

**D6 — `App.tsx` reload perde query params? (DeepSeek #44).** `App.tsx:185`
`window.location.assign(window.location.pathname)` está no botão de **recuperação de erro** — descartar um
`?code=&state=` de callback OAuth velho é **intencional**. **Veredito: by-design, rejeitar como bug.**

**D7 — Severidade dos headers de segurança (Codex Baixo/Médio, DeepSeek Baixo).** App single-user,
local-first, sem UGC, sem scripts de terceiros, `noindex`. CSP/X-Frame são **defesa em profundidade
Médio**, não Crítico. Mas o **allowlist de `openExternalUrl` é Médio real** (vetor concreto via import) e
barato. Certo: **Codex** (que ligou os dois).

---

## 4. Qualidade dos revisores (calibração de peso futuro)

Cinco relatórios. Calibração **contra o código atual** — e contra o fato de que 4 rodaram HEAD velho (não
é culpa deles, mas muda o peso das suas afirmações fortes).

| Revisor | Nota global dada | Qualidade (diretor) | Por quê |
|---|:--:|:--:|---|
| **Codex** | 8,0 | **8,5** | Melhor ancoragem `file:line`. **Seus achados sobreviveram ao refator**: recência/`observedAt`, allowlist de backup, headers de deploy, drift de Study links — são exatamente os que **continuam OPEN** hoje. Honesto (auto-sinalizou contradição A6). Falha: não marcou nada Crítico; sub-pesou alguns. **Peso futuro: alto.** |
| **Claude pós-Corte L** | 7,6 | **8,5** | Único contra o HEAD atual; rodou todos os gates, classificou o flaky por execução isolada, achou os 5 furos novos (`diplomaAttempts`, `observedAt`, camada `Config`, `final` hardcoded). *Auto-avaliação — conflito de interesse declarado; desconto aplicado.* **Peso: alto.** |
| **Claude (orig. manhã)** | 7,0 | **8,0** | Rodou gates, pegou leak + `computeMastery` morto + rótulo SM-2. HEAD velho. **Peso: alto.** |
| **Gemini 3.5 Flash** | 8,1 | **6,0** | Acertos reais no momento (`computeMastery`/diploma inativos, manualChunks, abaixo-da-dobra) — **todos já corrigidos**. Mas **alucinou "1 teste falhou"**, **Segurança 9,2 citando o próprio leak + XSS** (inconsistência interna), sub-pesou o leak para Low. **Peso: médio-baixo; reverificar afirmações fortes.** |
| **DeepSeek** | 7,4 | **5,0** | Insights solo reais (auto-sync sem `.catch`, dedup `runDiagnosisSync`, ramo `hard`→`retrieval`, crescimento de `chesscomMonthSignals`). Mas **maioria dos High é falsa**: "8 testes quebrados" (524/525), a11y 3 por "sem dark" (existe), `applyAdaptiveReviewRatio` muta (puro). **Peso: baixo nos High; minerar só Médios/Baixos.** |

**Lição de calibração:** o **consenso "sem CI / state.ts gigante / computeMastery morto" estava certo no
HEAD velho e já foi executado** — provando que o time agiu. Hoje, a **minoria que ancorou em débito
arquitetural durável (Codex) vale mais** que a maioria que listou sintomas já corrigidos. Reports que
rodam um HEAD velho devem ser lidos como "lista de regressão a fechar", não como estado atual.

---

## 5. Backlog priorizado (severidade × impacto ÷ esforço)

Dono: **Exec** = implementação guiada (Sonnet 4.6); **Dono** = Juka (produto); **Diretor** = Opus
(desenho). Prazos relativos a 2026-06-15. Gate entre cortes: `lint && test && build` verdes (CI já roda).

**Corte M1 — Quick wins & correção (esforço P, sem decisão de produto) — Exec, até 2026-06-16**
1. `buildPlanContext` nas 2 chamadas de `useAppData` → corrige `diplomaAttempts` no boot (`#1`).
2. Flaky: `waitFor(expect)` → `findByText(/Treinando há/i,{},{timeout:5000})` (`#10`).
3. Allowlist `https://lichess.org/` em `openExternalUrl` (`#3`).
4. `output/playwright/` no `.gitignore` (`#12`).
5. Corrigir drift `privacy-and-data.md:50` (links de Study **entram** no backup) (`#11`).
6. `assertNever` em `resourceCatalog.ts:981/991` (`#14`).

**Corte M2 — Endurecimento de borda (esforço P) — Exec/Diretor, até 2026-06-17**
7. Headers de segurança no `vercel.json` (CSP `connect-src` lichess+chess.com, X-Frame, nosniff, Referrer) (`#8`).
8. `__APP_VERSION__` via `define` no `vite.config.ts`; exibir em Config (`#13`).
9. Bloco `final` por banda (`finalThemeByBand`) (`#5`).

**Corte M3 — Durabilidade & camada (esforço M) — Exec, até 2026-06-18**
10. Transação Dexie em `saveProfile`+`savePlan` e em `reconcileLichessResults` (`#7`).
11. Desacoplar `ui/Config.tsx` de `infra/` (reexportar via `app/backupStatus.ts`) (`#4`).
12. Validação de shape no import (`pendingItems`/`methodTracks`) (Dados).

**Corte M4 — Pedagogia adaptativa (esforço M/G, EXIGE dono — §6) — após aprovação**
13. `observedAt` = data real da partida (corrige frescor de 90d) (`#2`).
14. Puzzle→fraqueza **durável**: `createWeaknessFromPuzzleStats` (`#6`).
15. `accuracy<70` por banda (`#9`).
16. Decidir transição `hard`→`retrieval` (documentar ou inverter) (`#15`).

**Corte M5 — Débito de teste/processo (oportunístico) — Diretor + Exec**
17. `renderHook` nos hooks de risco (`useDiagnosisActions`, `useTrainingActions`).
18. Threshold de cobertura no CI + smoke `smoke:pwa` como job separado.
19. pre-commit (husky + lint-staged).
20. `[input]` dep-arrays → desestruturar; `isPuzzleTrainingLog` por discriminante estrutural.

---

## 6. Decisões que exigem o dono (pacote único de aprovação)

Responda de uma vez; cada "sim/não" destrava um corte.

1. **Puzzle→fraqueza durável (maior ganho pedagógico):** autorizo perdas de puzzle virarem `Weakness`
   persistido (o tutor "lembra" de temas táticos entre sessões sem jogo)? — destrava M4-14.
2. **`accuracy<70` Chess.com:** remover ou recalibrar por banda (65 p/ iniciante)? — M4-15.
3. **Bloco `final` de 60 min:** por banda ou sempre peão (intencional)? — M2-9.
4. **Transição `hard`→`retrieval`** (`generatePlan.ts:376`): é intencional (documentar) ou inverter para
   `hard` sempre regredir? — M4-16.
5. **Métricas de eficácia** (`buildEfficacyBaseline`, skill map, track effort): realimentam o plano ou
   ficam só display (status atual)?
6. **"Pronto" do marco:** é M1+M2+M3 (quick wins + borda + durabilidade) **ou** inclui M4 (pedagogia)?
7. **Atomicidade `saveProfile`/reconcile:** entra no marco ou aceito a janela curta para 1 usuário? — M3-10.
8. **Headers de segurança + pre-commit + threshold de cobertura:** aplico agora (barato) mesmo com P5
   congelado? — M2-7, M5-18/19.

---

## 7. Roadmap consolidado (fases longas até o release pessoal estável)

Gate objetivo entre fases: `lint && test && build` verdes (CI roda no push).

- **Fase A — Quick wins + borda (½–1 dia):** Cortes M1+M2. Sem decisão de produto. **Começa já.** Gate:
  verde + `diplomaAttempts` no boot coberto por teste de regressão.
- **Fase B — Durabilidade + camada (½–1 dia):** Corte M3. Gate: verde + teste de transação
  `saveProfile`/reconcile.
- **Fase C — Pedagogia adaptativa (1–2 dias):** Corte M4, **somente após** respostas 1–4 do §6. Gate:
  verde + teste de `observedAt` por data de partida e de fraqueza-puzzle persistida.
- **Fase D — Débito de teste/processo (oportunístico):** Corte M5. Gate: verde, sem regressão de bundle.

A e B **não** precisam do dono (pode despachar já, em paralelo se quiser velocidade); só C abre com o
pacote §6 aprovado.

---

## 8. O que NÃO fazer (rejeitado, com motivo)

- **Não "consertar 8 testes quebrados"** — não existem (524/525; 1 flaky verificado). Falso (DeepSeek).
- **Não adicionar dark mode** — já existe (`index.css:1920`). Falso (DeepSeek).
- **Não recriar CI / manualChunks / quebrar state.ts / ligar computeMastery** — **já feitos** (J1–J4 + K + L).
- **Não trocar `App.tsx:185` por `reload()`** — o `assign(pathname)` descarta callback OAuth velho de
  propósito (by-design). Rejeitar DeepSeek #44.
- **Não implementar SM-2 completo com ease-factor** — 4 slots `[1,3,7,14]` bastam p/ 0–1200. YAGNI.
- **Não adicionar i18n/l10n** (DeepSeek #51) — ferramenta pessoal pt-BR; escopo P5.
- **Não criptografar token em repouso** (Gemini §2.15) — local-first, 1 usuário, escopos mínimos; ROI baixo.
- **Não quebrar `LearnerBand 1600-2000`** (DeepSeek #10) — fora do alcance 0–1200 do produto. YAGNI.
- **Não perseguir % de cobertura cega** — priorizar `renderHook` nos hooks de risco.
- **Não suíte CSP/firewall completa nem telemetria/RUM** (Gemini #14, DeepSeek #48) — P5 congelado; só o
  básico defensivo agora.

---

## Apêndice — achados refutados com prova (para não voltarem)

| Achado refutado | Quem | Prova (file:line / ação) | Por que é falso/obsoleto |
|---|---|---|---|
| "8 testes quebrados" (linhas específicas) | DeepSeek | `npm run test` → 524/525; o 1 fail passa 22/22 isolado | Flaky de timing; linhas citadas nem batem com o arquivo atual |
| "1 teste falhou (408/409)" | Gemini | idem | idem |
| "Sem dark mode → a11y 3" | DeepSeek | `index.css:1920` `@media(prefers-color-scheme:dark)` | Leu só `:74` e parou |
| "`applyAdaptiveReviewRatio` muta in-place" | DeepSeek | `generatePlan.ts` `.map(b=>({...b,kind}))` | Função pura |
| "`computeMastery` morto / diploma inativo" | Gemini #2/#17 | `useTrainingActions.ts:142` (Corte K `233049e`) | Ligado hoje |
| "Sem CI/CD" | Gem, DS, Cdx | `.github/workflows/ci.yml` | Criado (J2) |
| "Sem manualChunks / bundle >500kB" | Gemini #12 | `vite.config.ts` chunks; ~156 kB gzip | Code-split feito (H.1) |
| "Usernames hardcoded no bundle" | Gemini #3 | `state.ts:428-440` (`undefined`) | Removidos (J1) |
| "429 do replay engolido sem aviso" | Gemini #6 | `trainingLogFlow.ts:264-266` propaga (invariante Corte C) | Intencionalmente propagado |
| "`persist()` cedo demais" | Codex A5 | `useAppData.ts:96` (dentro do load async) | Movido |
| "Study links não entram no backup" | Gemini #18 | `appData.test.ts:457-459` (entram) | Já incluídos (F.2); o **doc** é que está stale |
| "`App.tsx` reload perde query params" (bug) | DeepSeek #44 | `App.tsx:185` no botão de erro | Descarta callback OAuth velho de propósito |

**Notas de confiança:** tudo "FIXED/OPEN/confirmado" foi lido no código nesta sessão. "Hero abaixo da
dobra" e impacto de runtime ficam **confiança média** (sem device). A auto-avaliação do revisor Claude
pós-L tem conflito de interesse declarado (desconto aplicado). Esta consolidação **substitui** a
`consolidacao_analise_2026-06-15.md` (v1) como estado corrente; a v1 permanece como registro do HEAD
da manhã. Detalhe por área no relatório-fonte
`analise_completa_claude-opus-4.8_pos-corte-L_2026-06-15.md`.
