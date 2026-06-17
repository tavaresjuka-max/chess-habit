# Consolidação Multi-IA — Diretor (Claude)

> Arbitragem dos 4 relatórios `analise-completa-sistema-2026-06-17-*.md` (Codex, Gemini, DeepSeek e a
> versão "Claude" consolidada pelo Codex). Dá nota a cada um, separa acerto de erro, e entrega o
> **relatório ideal** com o melhor de cada lente. Sem alteração em código de produção.
>
> **Verdade-base da arbitragem:** minha auditoria independente da rodada anterior (gates rodados a
> mão, **probe empírico do `addDays`**, 6 lentes críticas) + verificações pontuais feitas agora (ex.:
> confirmei o bug do `PlanBlockCard` lendo `Today.tsx:280` vs `:404`).

## 0. Nota metodológica importante

Os 4 relatórios **não são independentes**: os cabeçalhos dizem "consolidada por Codex a partir do
subagente X". Ou seja, foram **4 lentes de um mesmo orquestrador (Codex)**, rodando os mesmos gates e o
mesmo probe. Isso explica por que **compartilham os mesmos acertos e os mesmos erros** (todos marcam
`addDays` como off-by-one confirmado; todos dizem "coverage vermelho"; **nenhum** dos 4 viu o
diagnóstico mudo do Chess.com — a queixa nº 1 do dono). O segundo par de olhos real é a minha auditoria
da rodada anterior; por isso ela é a âncora aqui.

---

## 1. Notas das IAs

| Relatório | Nota | Em uma frase |
|---|:--:|---|
| **Codex** | **8,0** | O mais completo e o melhor método (script de UI manual com prints) — achou o melhor bug (card) e a fragilidade de coverage; mas mislabela o `addDays` e **perdeu o Chess.com mudo**. |
| **DeepSeek** | **7,6** | Melhor lente de segurança/privacidade: contrato E2EE correto, Retry-After, epoch de clear, `study:write` just-in-time. Mesmos erros de família. |
| **Gemini** | **7,5** | Melhor lente de UX/mobile: achou o caso real do **bloco de 0 min × "Sem treinos ainda"** e a microcopy técnica de OAuth. Mesmos erros de família. |
| **"Claude" (consolidada por Codex)** | **6,5** | Derivativa: repete os achados e os erros da família e **descarta** o que a lente Claude real tinha de melhor (refutação empírica do `addDays`, Chess.com mudo, a11y profunda, source maps, `getEvidenceLevel`). Usa o nome "Claude" sem o conteúdo Claude. |

*(Referência — a lente Claude independente da rodada anterior, que esta "Claude" sobrescreveu, valeria ~8,3: pegou o Chess.com mudo, a11y profunda, source maps, refutou o `addDays` por probe; mas **errou ao não pegar o bug do card** e teve sorte com um run de coverage verde, mascarando a flakiness que o Codex pegou.)*

### Onde cada uma ACERTOU (e merece entrar no relatório ideal)
- **Codex — melhor achado de todos:** `PlanBlockCard` no hero **sem `key={heroBlock.id}`** → o próximo
  bloco herda o modo "Como foi o treino?" (estado `isRating` preservado). **Verifiquei: real, P1.** Pior
  que cosmético — clicar a avaliação completaria o bloco 2 sem treino. Eu tinha perdido isso.
- **Codex — flakiness/coverage:** `npm run coverage` ficou **vermelho** para eles (timing/IndexedDB/
  ordem). No meu run isolado passou (85,6%). Conclusão arbitrada: a suíte é **flaky sob coverage/ordem**
  — risco de QA real que meu run verde mascarou. Crédito ao Codex.
- **Codex/DeepSeek — `oauthFlow.ts` `JSON.parse` sem `try/catch`** (storage corrompido derruba o
  callback): real, P3. Eu não tinha listado.
- **Codex/DeepSeek — import de backup lê o arquivo inteiro antes de checar tamanho** (`Config.tsx:111`):
  real, P2/P3.
- **DeepSeek — contrato E2EE do P4:** "a chave NÃO pode derivar da identidade pública do Lichess; o
  servidor nunca recebe token, plaintext nem chave; D1 cifrado em repouso ≠ E2EE de app". Correto e
  essencial — coincide com a minha recomendação de passphrase independente.
- **DeepSeek — `study:write` just-in-time** (pedir só ao criar Study, não no login): boa ideia de produto/consentimento.
- **Gemini — bloco de 0 min × Progresso "Sem treinos ainda":** contradição de estado real, concreta,
  que nenhuma outra lente teve. Keeper.
- **Gemini — microcopy de OAuth técnica demais** (`puzzle:read`/`study:write` cru na Config): bom para P5.
- **Codex/Gemini — smoke depende de porta fixa 4188** (`reuseExistingServer:false`): bom achado de workflow de QA.
- **Codex — `APP_NAME` não centralizado** com grep concreto (`vite.config.ts:28`, `README.md:1`,
  `backup.ts:1`): mais acionável que a minha menção genérica.
- **Todos — race condition multi-fonte** (`replaceWeaknesses` concorrente): convergência boa — a minha
  lente também confirmou. Vale como consenso forte.

### Onde cada uma ERROU (ou ficou aquém)
- **TODAS — `addDays` "off-by-one P1 confirmado": ERRADO no rótulo e na severidade.** O **probe
  empírico** (`tmp/audits/Claude/addDays-probe.mjs`) mostra `setDate ≡ setUTCDate` em GMT-3 e até em
  fusos com DST, para instantes reais. O exemplo deles (`2026-06-18T01:30Z +1 → 2026-06-19`) está
  **aritmeticamente correto** (é +1 dia UTC). O que eles chamaram de "salta um/dois dias" é uma
  **má-ancoragem ao calendário local** — o sistema usa "hoje" em **UTC** em todo lugar (`isDueToday`,
  constância), então a virada do dia cai ~21h local para o dono. Isso É um problema real (P2, de
  percepção/fronteira), mas **não é** um off-by-one na aritmética do `addDays`, e a causa é o "hoje" em
  UTC, não `setDate` vs `setUTCDate`. **A correção que eles propõem (helper de data local) é a certa —
  pelo motivo errado.**
- **TODAS — "coverage está vermelho / não fecha" é absoluto demais.** É **flaky**: passou para mim,
  falhou para eles. O fix é estabilizar (DB por teste, menos timing), não "consertar uma falha determinística".
- **TODAS — perderam o diagnóstico mudo do Chess.com (294 sinais → 0 fraquezas).** É a **queixa nº 1 do
  dono** e o coração do produto. `extractSignals` só gera `rating/opening/time-control/color/accuracy`;
  `detectWeaknesses` silencia `rating/time-control/color`; e o Chess.com **não dá `judgment` (blunders)**
  — parte é limitação estrutural da API (pesquisa oficial confirma: `accuracies` só se já calculada).
  Nenhuma das 4 lentes destacou isso. **É o maior buraco da rodada Codex.**
- **TODAS — a11y rasa.** As 4 deram ~6,8–7,0 dizendo "não auditada com leitor de tela", mas **não
  acharam violações concretas**. A lente Claude real achou 10 (WCAG): `<h2>` dentro de `<summary>`,
  sem skip-nav, foco não move no lazy-load, `<button>` dentro de `<p role="alert">`, `aria-busy` em
  `<a>`, link externo sem aviso de nova aba, 44px só no mobile.
- **Família Codex não pegou:** `getEvidenceLevel` (infla confiança), `buildPuzzleThemeStats`
  (double-count dashboard+activity), `puzzleActivity` envia `since` inexistente (trunca >200 puzzles),
  `computeMastery` desconectado do `generatePlan`, **source maps públicos** (eles trataram como "decisão
  a tomar", não exposição confirmada — eu confirmei via `curl`), `href` de treino não sanitizado
  (open-redirect via backup malicioso), drift do `weaknessTitleByTag` em 4 cópias.
- **"Claude" consolidada:** o pior pecado é **misattribution** — assina como Claude um texto que joga
  fora os achados mais fortes da lente Claude e ainda carrega o erro do `addDays`.

---

## 2. Arbitragem dos 3 pontos onde a verdade importa

1. **`addDays`/datas (todas dizem P1 confirmado):** REBAIXAR para **P2** e **corrigir o rótulo**. Não é
   off-by-one de `addDays`; é o uso de "hoje" em UTC em todo o domínio de datas. Sintoma real em GMT-3:
   sessões noturnas (após 21h local) contam para o dia seguinte; revisões/streak deslocam. Fix certo:
   **primitiva de data local injetável (`nowFn`)** usada em `isDueToday`, constância e `getNextDueDate`
   — o que também torna tudo testável. (As 3 lentes acertaram o fix, erraram o diagnóstico.)
2. **Coverage (todas dizem vermelho/P1):** reclassificar como **suíte flaky sob coverage/ordem (P2 de
   QA)**, não falha determinística. Fix: DB nomeado por arquivo/teste, teardown agressivo, reduzir
   dependência de timing real; rodar `npm test`/`coverage` 5× em loop como gate de estabilidade.
3. **Chess.com mudo (nenhuma pegou):** **P1, é o item mais importante para o dono.** Entra no topo do
   relatório ideal.

---

## 3. Relatório ideal (achados consolidados, melhor de cada lente)

### P1 — bloqueiam confiança/produto
- **[Chess.com mudo]** 294 sinais → 0 fraquezas. Causa: API não dá blunders + limiares de Lichess.
  Fix: limiares Chess.com-aware (`opening`>0,5; `clock` 1 timeout se jogos≥15) **+** comunicar a
  limitação **+** tornar a avaliação de entrada o caminho forte de quem só tem Chess.com.
  *(fonte: lente Claude independente)*
- **[Card herda feedback]** hero `PlanBlockCard` sem `key={heroBlock.id}` (Today.tsx:280) → bloco 2
  abre em "Como foi o treino?". Fix: `key={heroBlock.id}` no hero **e/ou** reset de `isRating/
  isOpening/isSavingPending/openWarning` por `useEffect([block.id])`. *(fonte: Codex — verificado)*
- **[Race de fraquezas]** `saveProfile`/`runOnboardingImport` dispara Chess.com+Lichess em paralelo;
  `replaceWeaknesses` é replace-total → o último sync apaga as fraquezas do outro. Fix:
  `replaceWeaknessesForSource(source, …)` **ou** serializar (mutex/singleflight). *(consenso: todas + Claude)*

### P2 — qualidade, privacidade, beta
- **[Suíte flaky sob coverage]** estabilizar DB/timing. *(Codex)*
- **[`clearAllData` não cancela sync em voo]** dado apagado ressurge. Fix: `operationEpoch`/AbortController. *(todas + Claude)*
- **[Datas em UTC]** primitiva de data local injetável (ver §2.1). *(todas, rótulo corrigido)*
- **[Source maps públicos]** `sourcemap:'hidden'` ou 404 em `/assets/*.map`. *(Claude — confirmado via curl)*
- **[`getEvidenceLevel` infla confiança]** `switch(confidence)` em vez de `|| score>=0.5`. *(Claude)*
- **[`buildPuzzleThemeStats` double-count]** filtrar `result.kind==='puzzle-dashboard'`. *(Claude)*
- **[`puzzleActivity` `since` inexistente]** remover param + paginar por `before`. *(Claude)*
- **[`computeMastery` desconectado]** ligar ao `generatePlan`; ativar trilha `progress-diplomas`. *(Claude)*
- **[Import de backup lê tudo antes de validar tamanho]** limite de bytes + `migrateBackup` v1→v2 + backup 16 tabelas. *(Codex/DeepSeek + Claude)*
- **[`href` de treino não sanitizado / URLs de backup não validadas]** open-redirect via backup malicioso. *(Claude)*
- **[A11y pack]** skip-nav, foco no lazy-load, `<h2>` fora do `<summary>`, `<div role="alert">`,
  remover `aria-busy` de `<a>`, "abre em nova aba", 44px via `pointer:coarse`. *(Claude)*
- **[`APP_NAME` central]** `src/config/appIdentity.ts` + grep no CI contra nome público antigo. *(Codex)*
- **[CSP]** remover `unsafe-inline` de style-src se possível; `upgrade-insecure-requests`. *(Claude)*
- **[Bloco de 0 min × Progresso]** definir contrato de "treino mínimo" ou "feito fora do app". *(Gemini)*

### P3 — robustez
- `oauthFlow` `JSON.parse` em `try/catch` *(Codex/DeepSeek)* · `Retry-After`-aware cooldown *(todas + Claude)* ·
  `chesscomClient`/`importPgnToStudy` validar shape em runtime *(Claude)* · smoke com porta parametrizável
  *(Gemini)* · microcopy de OAuth em 2 camadas *(Gemini)* · `games` sem `max` bufferiza histórico *(DeepSeek + Claude)*.

### Conformidade P5 (antes do beta público)
- Link "Código-fonte" visível (**AGPL §13**), disclaimer de não-afiliação na UI, rename via `APP_NAME`,
  doação como link externo. *(Codex/DeepSeek/Gemini + Claude)*

### Contrato P4 (sync) — decidir antes de codar
- **Chave E2EE de passphrase/segredo do aparelho, nunca da identidade Lichess; token nunca sobe; merge
  por `updatedAt`/tombstone (não replace destrutivo).** D1 free (150M leituras/3M escritas/5GB) cobre o
  escopo. *(DeepSeek + Claude)*

---

## 4. O que fazer

**Ordem recomendada (Fase A — estabilizar antes de qualquer feature):**
1. Card herda feedback (`key` no hero) — P1, esforço P. *(Sonnet)*
2. Race de fraquezas (por fonte ou serializar) — P1, esforço M, decisão de design. *(Opus)*
3. Diagnóstico Chess.com (limiares + comunicação + avaliação) — P1, esforço M. *(Sonnet, design Opus)*
4. Estabilizar suíte flaky + fazer `coverage` passar 5× — P2, esforço M. *(Sonnet)*
5. `clearAllData` epoch/abort — P2, esforço M. *(Sonnet)*
6. Datas locais (`nowFn`) — P2, esforço P, **com o rótulo correto** (não "addDays off-by-one"). *(Sonnet)*
7. `sourcemap:'hidden'` + `getEvidenceLevel` + a11y pack — P2, esforço P–M. *(Sonnet/Haiku)*

**Fase B — pedagogia/conteúdo:** `computeMastery`→plano, `progress-diplomas`, double-count, `puzzleActivity` paginação, backup 16 tabelas + `migrateBackup`.

**Fase C — beta público (P5):** `APP_NAME` + AGPL/disclaimer visíveis; contrato E2EE escrito; depois backend P4.

**Decisões do dono (consenso das 4 + Claude):**
1. **Nome público** — destrava `APP_NAME`, AGPL e rename. *(pendente desde a rodada de roadmap)*
2. **Diagnóstico Chess.com** — baixar limiar (mais sensível) **ou** comunicar limitação + reforçar avaliação? (Recomendo o 2º, com leve no 1º.)
3. **Beta = local-first com backup robusto, ou espera o P4 sync?** (DeepSeek/Codex/Gemini convergem: pode abrir local-first se a promessa pública for honesta e o backup endurecido.)
4. **Chave do E2EE** — passphrase do dono (recomendado), não identidade Lichess.

---

## 5. Veredito

- **Saúde como ferramenta pessoal:** boa (~7,0–7,3 no consenso; minha leitura: 6,8 por causa dos 2 P1
  do produto). **Não pronto para beta público** (consenso ~5,7; minha leitura: 4,5 com a11y + P5 + bugs).
- **A rodada Codex foi forte em método (UI manual, gates, segurança) e fraca em cobertura de produto**
  (perdeu o Chess.com mudo e a a11y concreta) e em rigor de rótulo (`addDays`, coverage).
- **A combinação ideal** = o bug do card + a flakiness + o contrato E2EE + o 0-min-block (do Codex/
  DeepSeek/Gemini) **com** o Chess.com mudo + a11y profunda + source maps + `getEvidenceLevel` +
  double-count + a refutação empírica do `addDays` (da lente Claude independente).
- **Próximo corte mais inteligente:** Fase A acima (card → race → Chess.com → coverage → clear → datas).
- **Primeira decisão do dono:** o **nome público** e a **política do diagnóstico Chess.com** — destravam
  trabalho que já está na fila.

---

*Consolidação por Claude (Opus 4.8), 2026-06-17. Bug do `PlanBlockCard` verificado no código; `addDays`
refutado por probe (`tmp/audits/Claude/addDays-probe.mjs`); Chess.com mudo e a11y vêm da lente Claude
independente. As 4 lentes Codex são úteis mas correlacionadas — tratar como uma fonte, não quatro.*
