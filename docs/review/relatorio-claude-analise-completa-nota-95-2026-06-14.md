# Relatório Claude — Análise Completa e Plano Nota 9,5

Data: 2026-06-14
Autor: Claude (Diretor de Produto-Arquitetura), Opus 4.8
Método: 5 auditorias paralelas (Sonnet 4.6) sobre o código **atual** (pós-Cortes A/B/C), arbitradas e consolidadas pelo Diretor.
Insumos: leitura direta de `src/ui/**`, `src/domain/**`, `src/infra/**`, `src/app/**`, configs; auditoria Codex 2026-06-13; arbitragem Claude 2026-06-14.

---

## 1. Veredito Geral

**Nota geral atual: 7,4 / 10.** Meta: 9,5.

O app tem fundações fortes e bordas recém-reforçadas (Cortes A/B/C: mobile/a11y, validação de shape no backup, fila serial de API). O que separa 7,4 de 9,5 não é polish — é **fechar os loops internos que hoje estão abertos**. O padrão se repete nas cinco frentes:

- **Pedagogia:** mastery é calculado mas nunca conectado ao plano; placement recalibra a banda mas não re-dispara o plano; a trilha de diplomas existe no enum mas nenhum código a ativa.
- **Dados:** backup cobre 10 das 16 tabelas; formato travado na v1 sem caminho de migração.
- **Rede:** a fila do Corte C não tem timeout nem cap; e um `catch {}` engole o 429 do replay, furando a própria invariante do Corte C.
- **Frontend:** a ação principal ("Próximo passo") fica abaixo da dobra no celular; tokens de contraste secundários ficaram de fora do Corte A.
- **Engenharia:** a camada `app/` (lógica de negócio crítica) não tem teste unitário; `state.ts` é um monólito de 1.278 linhas.

Cortes A/B/C protegeram o app contra fricção mobile, corrupção de backup e 429 acidental. O caminho para 9,5 é tornar o produto **adaptativo de verdade, durável de verdade e robusto sob falha** — não adicionar features.

---

## 2. Notas Por Área

| Área | Nota Agente | Nota Diretor | Leitura |
|------|:-----------:|:------------:|---------|
| Frontend / UX / A11y | 7,4 | **7,5** | Design tokenizado, dark mode e foco de teclado fortes; ação principal abaixo da dobra no mobile e contraste secundário incompleto pós-Corte A. |
| Pedagogia / Domínio | 7,2 | **7,2** | Método deliberado e bem fundamentado; adaptação ainda parcialmente cosmética (loops de mastery/placement/diploma abertos). É a alma do produto — peso máximo. |
| Dados / Storage / Privacidade | 7,2 | **7,5** | PKCE, checksum, transação atômica e `storage.persist` sólidos; backup incompleto (10/16 tabelas) e formato sem versionamento. |
| Rede / PWA / Offline | 7,2 | **7,3** | Fila do Corte C correta e testada; falta timeout/cap/retry e há bug que fura a invariante 429 no replay. |
| Engenharia / Testes / Build | 7,8 | **7,8** | Arquitetura limpa, TS estrito, testes de fluxo ricos; camada `app/` sem teste e bundle 527 kB sem `manualChunks`. |

**Ponderação da nota geral** (por impacto no dono): Pedagogia 25%, UX/mobile 25%, Dados 20%, Rede 15%, Engenharia 15% → **7,44 ≈ 7,4**.

A nota do dono não é média simples: é dominada pelos dois fluxos que ele vive todo dia — abrir o app no celular e receber um plano que de fato se adapta. Por isso UX e Pedagogia pesam mais.

---

## 3. Já Resolvido (não recontar)

- **Import de backup com erro de Dexie:** o Corte B envolveu a transação em try/catch e `importBackupFromJson` retorna `BackupImportResult`; `state.ts:1264` expõe esse resultado à UI. A "gap #8" do relatório de engenharia já está fechada.
- **Mobile density / touch targets / contraste primário / foco de teclado:** Corte A (df882b8) — verificado no CSS atual.
- **Fila serial + cooldown 429:** Corte C (c78bad3) — `providerQueue.ts` injetada como default em todos os clients.

---

## 4. Plano de Execução — Cortes D a I

Continuação da sequência A/B/C. Ordenado por impacto-no-dono ÷ risco. Cada corte é atômico, com gate `lint && test && build` verde.

### Corte D — UX: trazer a ação para a primeira tela `[PRIORIDADE 1]`
**Por quê primeiro:** o dono sente em cada sessão. Esforço baixo, risco baixo, sem tocar lógica.
**Escopo:**
- Elevar o hero "Próximo passo" para logo após a barra de progresso, antes do `TutorCard` (`Today.tsx:309-348`). **Maior ganho isolado de toda a auditoria** para o perfil TDAH.
- `nav-button` → `min-height:44px` global (hoje 36px no desktop/landscape; `index.css:278`).
- `aria-label` contextual em "Abrir no Lichess"/"Concluir" do `PlanBlockCard` (linhas 181/202).
- Contraste: `.fold-meta` `--ink-500`→`--ink-600`; subir cor/tamanho de `.day-stats span` e `.session-milestone-stats span` (textos <14px).
- Remover usernames hardcoded do fallback da Config (`Config.tsx:61-62` → `?? ''`).
- `aria-label` na `<ul>` de reasons do `PlacementCard`; remover `<h2>` redundante do `TutorCard`.
**Arquivos:** `src/ui/Today.tsx`, `src/ui/PlanBlockCard.tsx`, `src/ui/Config.tsx`, `src/ui/PlacementCard.tsx`, `src/ui/TutorCard.tsx`, `src/index.css`.
**Esforço:** P–M (uma sessão). **Move:** UX 7,5 → ~9,3.

### Corte E — Pedagogia adaptativa real `[PRIORIDADE 1]`
**Por quê:** é o valor central do produto. Hoje a adaptação é parcialmente decorativa.
**Pacote de decisão do dono (aprovar antes):** estas mudanças alteram o comportamento do plano diário. Todas estão alinhadas à visão (metas pequenas, revisão frequente), mas mudam o que o dono vê.
**Escopo:**
- **Espaçamento adaptativo (SM-2 simplificado):** `advancePendingItem` passa a usar `lastFeedback` — 'hard' recua um nível, 'easy' pula um. Hoje `[1,3,7,14]` é fixo (`pendingItems.ts:76-87`). *Maior ganho pedagógico.*
- **Conectar `computeMastery` ao plano:** usar `MasteryResult` para definir `masteryTarget` dos blocos e acelerar/recuar `resourceStage`. Hoje o cálculo é código morto (`generatePlan.ts` não chama `computeMastery`).
- **Ativar trilha `progress-diplomas`:** `selectMethodTrack` nunca a retorna — conquista de diploma sem consequência no currículo (`selectMethodTrack.ts:17-41`).
- **Segunda fraqueza no bloco de transferência** em vez de repetir a primária (`generatePlan.ts:500-514`).
- **Threshold de blunder por banda** (0,3 para 0–800; 0,5 para 800+) — hoje fixo 0,5 quase nunca dispara nos iniciantes (`detectWeaknesses.ts:102`).
- **Coach notes específicas** para 4–6 temas prioritários (hoje só `fork` é rico; `coachCatalog.ts`).
- **Re-disparar plano após calibração de placement** (loop aberto: banda muda mas plano não; `placement.ts:132-153`).
**Arquivos:** `src/domain/method/pendingItems.ts`, `src/domain/method/mastery.ts`, `src/domain/method/selectMethodTrack.ts`, `src/domain/plan/generatePlan.ts`, `src/domain/weakness/detectWeaknesses.ts`, `src/domain/coach/coachCatalog.ts`.
**Esforço:** M–G. **Move:** Pedagogia 7,2 → ~9,0. (O restante até 9,5 depende do Corte 8 — currículo denso.)

### Corte F — Durabilidade total do dado `[PRIORIDADE 2]`
**Por quê:** dataset único e irreplicável. Risco de perda real, não hipotético.
**Escopo:**
- **Backup cobre o que o usuário cria:** incluir `lichessStudies` e `appMeta.onboardingCompletedAt` no export/import (hoje perdidos ao restaurar em outro dispositivo). Comentar explicitamente o que fica de fora e por quê (token por design; caches por escolha).
- **Versionar o formato:** `migrateBackup(raw, from, to)` com `migrateV1toV2` identidade — cria o padrão antes de precisar. Hoje `version !== 1` é rejeição não-recuperável: bomba-relógio (`backup.ts:216-222`).
- **Export atômico:** envolver os `.toArray()` em `db.transaction('r', ...)` para snapshot consistente (`appData.ts:301-324`).
- **Validação mais profunda** em `pendingItems`/`diplomaAttempts` (hoje só checa `id`; `backup.ts:156-172`).
- **Reforço de persistência iOS/Safari:** botão "Proteger meus dados" após a primeira ação significativa, re-solicitando `storage.persist()` (momento de maior sucesso no iOS).
**Arquivos:** `src/infra/storage/backup.ts`, `src/infra/storage/appData.ts`, `src/app/state.ts`.
**Esforço:** M. **Move:** Dados 7,5 → ~9,5.

### Corte G — Robustez de rede sob falha `[PRIORIDADE 2]`
**Por quê:** inclui correção de bug que fura a invariante do Corte C.
**Escopo:**
- **FIX (bug):** o `catch {}` em `createReplayLogIfPossible` (`trainingLogFlow.ts:258`) engole `LichessRateLimitError` — o 429 do replay não ativa o cooldown da fila. Trocar por `catch (e) { if (e instanceof LichessRateLimitError) throw e; return undefined; }`.
- **Timeout via `AbortController`** na fila (30 s configurável): desbloqueia a fila se uma chamada travar em 3G/4G fraco (`providerQueue.ts`).
- **Cap de histórico Lichess:** `DEFAULT_MAX_GAMES` no auto-sync (hoje pede histórico completo sem `max` e materializa tudo com `response.text()`; `games.ts:101,184-192`). Botão manual mantém histórico completo.
- **Retry com backoff** (1s→2s→4s) para 5xx/network error, centralizado na fila — não em cada client.
- **Mensagem offline dedicada** (`navigator.onLine` + `TypeError: Failed to fetch`) em vez de erro genérico.
**Arquivos:** `src/infra/http/providerQueue.ts`, `src/app/trainingLogFlow.ts`, `src/infra/lichess/games.ts`, `src/app/state.ts`, `src/app/errorMessages.ts`.
**Esforço:** M. **Move:** Rede 7,3 → ~9,2.

### Corte H — Cobertura e saúde de engenharia `[PRIORIDADE 3]`
**Por quê:** habilita refactors futuros (Corte 8) com segurança. Faz primeiro os testes, depois o refactor.
**Escopo (ordem importa):**
1. **Testes unitários da camada `app/`** (hoje zero): `trainingLogFlow.test.ts`, `oauthFlow.test.ts` — funções puras, sem jsdom. *Pré-requisito para os refactors abaixo.*
2. **Extrair `buildPlanContext`** (repetido 12× em `state.ts`) para `stateHelpers.ts` — elimina drift.
3. **Extrair `syncService.ts`** dedupando `runChesscomSync`/`runLichessSync` (~70 linhas quase idênticas cada).
4. **`manualChunks`** no Vite (dexie/lucide/vendor) — remove o warning, isola ~150 kB com cache longo.
5. **Coverage baseline** (`@vitest/coverage-v8` + thresholds) para tornar gaps mensuráveis.
**Arquivos:** `src/app/trainingLogFlow.ts`, `src/app/oauthFlow.ts`, `src/app/state.ts`, `src/app/stateHelpers.ts`, `src/app/syncService.ts` (novo), `vite.config.ts`, `vitest.config.ts`, `package.json`.
**Esforço:** G. **Move:** Engenharia 7,8 → ~9,4.

### Corte I — Acabamento de UX e interação `[PRIORIDADE 3]`
**Escopo:** substituir `window.confirm()` por confirmação inline (padrão `isReviewing` já existente) em "Restaurar"/"Apagar tudo"; testes diretos de `PlanBlockCard` e `Onboarding`; coach note específica para sessão de 5 min.
**Esforço:** M–G. **Move:** UX/Eng +0,2 cada.

---

## 5. Sequência Recomendada

```
Batch 1 (impacto diário, baixo risco — começar já):
  Corte D (UX: hero + a11y + contraste)
  Corte E (Pedagogia adaptativa)   ← requer pacote de decisão do dono

Batch 2 (protege dado e rede):
  Corte F (durabilidade do dado)
  Corte G (robustez de rede + fix bug do replay 429)

Batch 3 (saúde de engenharia, habilita Corte 8):
  Corte H (testes app/ → refactors → chunks → coverage)
  Corte I (acabamento)

Data fixa (já planejado, sem corte novo):
  Revisão pedagógica ~2026-07-08 (usar tela Progresso)
```

**Dependências:**
- Corte H.1 (testes) **antes** de H.2/H.3 (refactors) — refatorar sem rede de proteção é risco.
- Corte G inclui o fix do bug que eu introduzi conceitualmente no Corte C — pode subir de prioridade se o dono usar "Conferir puzzles" com frequência.
- Cortes D, F, G são independentes entre si (podem ir em paralelo se houver banda de execução).

---

## 6. Decisões Necessárias do Dono

Só o **Corte E** muda comportamento visível do plano. Pacote único de aprovação:
1. Plano pode passar a alternar fraqueza secundária (menos monotonia) — **ok?**
2. Revisão espaçada passa a recuar/avançar conforme "Fácil/Bom/Difícil" — **ok?**
3. Conquistar um diploma passa a mudar a trilha de método por alguns dias — **ok?**

Recomendação: aprovar os três — todos reforçam a visão (metas pequenas, revisão frequente, números visíveis). Cortes D, F, G, H, I não precisam de decisão nova; respeitam todas as restrições do contrato (P4/P5 congeladas, APIs oficiais, sem engine, sem backend).

---

## 7. O Que Fica Para Depois (sem perseguir 9,5 agora)

- Criptografia do token OAuth (ROI baixo para ferramenta pessoal local-first; risco esperado e aceito).
- Cache offline das APIs via Workbox (`NetworkFirst`) — nice-to-have; o shell já abre offline.
- Currículo denso 1200–2200 e sub-temas de `conversion` — **Corte 8**, já planejado.
- E2E Playwright completo — antes do Corte 8, quando mudanças de currículo precisarão de regressão protegida.

---

## 8. Resumo Executivo

| Frente | Hoje | Após cortes propostos | Corte |
|--------|:----:|:---------------------:|-------|
| UX / mobile | 7,5 | 9,3 | D, I |
| Pedagogia | 7,2 | 9,0 (9,5 no Corte 8) | E |
| Dados | 7,5 | 9,5 | F |
| Rede | 7,3 | 9,2 | G |
| Engenharia | 7,8 | 9,4 | H, I |
| **Geral** | **7,4** | **~9,3–9,5** | D–I |

O caminho para 9,5 não é mais features — é fechar os loops abertos. Cortes A/B/C blindaram as bordas; D–I tornam o núcleo adaptativo, durável e robusto. A revisão pedagógica de 2026-07-08 e o Corte 8 (currículo denso) levam a Pedagogia ao teto.
