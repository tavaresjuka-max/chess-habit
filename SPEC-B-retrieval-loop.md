# SPEC-B — Fechar o Loop de Retrieval (cue-fade + tagging pós-puzzle)

**Decisão:** Council Fugu (maestro, seat=fugu, 2026-06-30).
**Executor:** Fugu via opencode.
**Árbitro final:** gates (`npm run typecheck && npm test && npm run build`).

---

## ✅ STATUS 2026-07-01 — SUBSTANCIALMENTE ENTREGUE (loop já fechado)

> Council VERIFICAR (DeepSeek Pro + GLM) + verificação no código real, 2026-07-01.
> Maestro: Opus (Fugu sem quota). Decisão do dono: **loop considerado fechado; não
> adicionar mais fricção pós-puzzle.** Esta seção supersede o desenho original abaixo.

**O loop de retrieval JÁ está fechado em `master`** (commit `1aae7dd` + fluxo de feedback):

| Peça do loop | Onde | Status |
|---|---|---|
| Cegueira por estágio (`isBlindAttempt`) + mitigação honor-system (`platformThemeLeakRisk`) | `generatePlan.ts:616-628` (`getBlindAttemptMetadata`) | ✅ feito, em uso |
| Visibilidade da dica por estágio | `PlanBlockCard.tsx:151` | ✅ feito |
| Sinal de retenção cega (sem congelar SM-2) | `blindEvidence.ts` (consumido em diplomas/Progress/diagnóstico) | ✅ feito |
| Autorrelato de retrieval | `patternRecognition` = `yes/partial/no` (`PlanBlockCard.tsx:162`) | ✅ feito |
| Autoexplicação de 1 frase | `TrainingLog.selfExplanation` | ✅ feito |
| Taxonomia de erro (quando `hard`) | `TrainingLog.errorType` | ✅ feito |

**DROPADO do desenho original (refutado pela verificação no código):**
- ❌ **"Congelar SM-2 quando estágio ∈ {explain,guided}" (§4.5)** — o `blindEvidence.ts` já mede
  retenção cega SEM congelar spacing/ease; congelar criaria estado paralelo confuso. O estágio
  avança por FEEDBACK (`getThemeResourceStage`, generatePlan.ts:685-707), não por `attempts` —
  logo o "deadlock" temido pelo council NÃO existe.
- ❌ **Alegar que isto faz o DIPLOMA medir cegueira** — o diploma gate (80%/30) usa acurácia
  EXTERNA do Lichess (`evaluateDiplomas.ts:59-60`), que não sabe se mostramos a dica. O loop
  melhora o sinal INTERNO (blindEvidence), não o gate do diploma.

**DIFERIDO como polimento opcional (NÃO no escopo agora — decisão do dono 2026-07-01):**
- 🔸 `conceptTag` / `ConceptTagPicker` (múltipla escolha "qual conceito?"). Seria um 5º micro-passo
  pós-puzzle (já há feedback + patternRecognition + errorType + selfExplanation). Custo de fricção
  TDAH > valor incremental do diagnóstico. Reavaliar só se surgir necessidade de medir "o aluno
  sabe NOMEAR o conceito".
- 🔸 Injetar `tavarezCue` do catálogo nos blocos explain/guided (hoje mostra `coachNote` genérico).

_O desenho original abaixo fica como contexto histórico — não implementar §4.5 nem o tagging._

---

## 1. Contexto — onde paramos

### Git
- Branch: `master`
- 16 commits à frente de `origin/master` (não pushado — export manual semanal no Android é a rotina de deploy)
- Working tree limpo (só `UI-REVIEW.md` untracked — pode ignorar)

### O que foi feito nesta sessão (não tocar)
Todos mergeados em `master`:

| Commit | O que fez |
|---|---|
| `f1e2a35` | Gap 3: `reconcileLichessResults` relê `loadWeaknesses()` do storage (anti-race) |
| `887a978` | Gap 2: fallback `loadPendingItemById` + validação de appMeta no backup |
| `1e02e11` | Unificação de constantes SR em `pedagogyConstants.ts` |
| `a364790` | Guard local-mode 403 no backend + remove mode do `/health` |
| `6e4875f` | Tokens CSS hero + escala tipográfica |
| `e707411` | Renomeia aba "Config" → "Ajustes" |
| `63e96d7` | Breakpoint hero 430→519px |
| `69506c8` | Tokens undefined + aria-label progressbar |
| `8052f96` | Margens verticais Hoje 20→12px |
| `68dc8ff` | Vão morto nos folds eliminado |
| `286208c` | "Agora não" do convite de calibração persiste em localStorage |
| `fe4f61a` | Hero portrait empilha em telas estreitas |
| `3064f89` | Licença AGPL → proprietário (Juka Tavarez) |
| `d0f8dab` | Polimento Onda 2 (contraste, elevação, ícones, safe-area, sync status) |
| `1fc59bc` | Onda 0+1: coerência de contagens, duplo-clique, marcador verde |

---

## 2. O problema a resolver

O loop pedagógico atual tem um **vazamento de retrieval**:

```
tavarezCue (dica conceitual)  ← aparece ANTES da tentativa
          ↓
    usuário faz puzzle no Lichess
          ↓
    feedback (easy/good/hard)
          ↓
    SM-2 avança / diploma gate
```

**Problema:** o aluno nunca é obrigado a recuperar o padrão da memória — a dica já está na frente. O loop de retrieval não fecha. Diplomas e SM-2 medem acerto-com-muleta, não retenção real.

---

## 3. Decisão de design (Fugu como maestro, TDAH-safe)

### Cue-fade por estágio

| Estágio do bloco (`resourceStage`) | `tavarezCue` | Promoção SM-2/diploma |
|---|---|---|
| `explain`, `guided` (1ª exposição) | ✅ visível | não conta para mastery |
| `retrieval`, `transfer`, `review` | 🚫 oculto (tentativa CEGA) | só acerto cego promove |

Regra simples: `isBlindAttempt = ['retrieval','transfer','review'].includes(block.resourceStage)`

### Tagging pós-puzzle (sempre, inclusive na 1ª exposição)

Após o usuário marcar feedback (easy/good/hard), exibir **1 pergunta de tagging**:
- "Qual padrão você usou neste bloco?"
- **3–5 opções** de conceito (multiple-choice), derivadas de `catalogSkillNode.weaknessTag` ou `block.methodTrackId`
- Texto livre: **só opcional** (não bloqueia)
- Resultado gravado em `TrainingLog.conceptTag?: string` (novo campo opcional)
- Tag **errada** = diagnóstico, **não bloqueia** promoção inicial
- Acurácia de tag ≥ 70% = sinal de saúde pedagógica (benchmark de produto)

### O que NÃO muda
- SM-2 ease-factor e spacing continuam em `pendingItems.ts` / `pedagogyConstants.ts` — não tocar
- Diploma gate (80%/30 puzzles) — não tocar nesta SPEC
- `tavarezCue` nos nós do catálogo — não tocar (só controlar exibição)

---

## 4. Arquitetura — onde mexer

### 4.1 Tipos de domínio

**`src/domain/types.ts`** — `PlanBlock` (linha ~168):
```ts
// ADICIONAR campo:
tavarezCue?: string;      // injetado por generatePlan quando stageFit inclui o nó
isBlindAttempt?: boolean; // true quando resourceStage ∈ {retrieval, transfer, review}
```

**`src/domain/types.ts`** — `TrainingLog` (linha ~288):
```ts
// ADICIONAR campo:
conceptTag?: string; // tag escolhida no tagging pós-puzzle (opcional, diagnóstico)
```

**`src/domain/method/types.ts`** — `PendingTrainingItem` (linha ~24):
- Não precisa de novo campo. O `attempts` + `resourceStage` do bloco já carregam a informação.

### 4.2 Geração de plano

**`src/domain/plan/generatePlan.ts`**

Na função `createPlanBlock` (ou equivalente que monta o bloco tema, linha ~330–368):

1. Buscar o `CatalogSkillNode` correspondente ao `weaknessTag` do bloco.
2. Injetar `tavarezCue: node.tavarezCue` no PlanBlock.
3. Calcular `isBlindAttempt` baseado em `resourceStage`:
   ```ts
   isBlindAttempt: ['retrieval', 'transfer', 'review'].includes(resourceStage)
   ```

**`src/domain/sources/catalogSkills.ts`** — não tocar. `tavarezCue` já existe em todos os 14 nós.

### 4.3 UI — exibição condicional do cue

**`src/ui/PlanBlockCard.tsx`** (ou o componente que renderiza um bloco de treino):

```tsx
// Mostrar tavarezCue SOMENTE se !block.isBlindAttempt
{!block.isBlindAttempt && block.tavarezCue && (
  <p className="coach-cue">{block.tavarezCue}</p>
)}
```

**`src/ui/Today.tsx`** (898 linhas) — provavelmente onde PlanBlockCard é usado. Só passa o bloco; a lógica fica no PlanBlockCard.

### 4.4 Tagging pós-puzzle

**Novo componente** `src/ui/ConceptTagPicker.tsx`:
- Props: `block: PlanBlock`, `onTag: (tag: string | null) => void`
- Renderiza 3–5 botões de conceito + botão "Pular" (opcional)
- Os conceitos são derivados do `block.methodTrackId` ou `weaknessTag` — ver `src/domain/sources/catalogSkills.ts` para os `id` disponíveis

**Integração:** mostrar `ConceptTagPicker` logo após o usuário registrar feedback (easy/good/hard) num bloco. Fluxo em `src/app/useTrainingActions.ts` ou no componente que captura o feedback.

**Persistência:** gravar `conceptTag` no `TrainingLog` via `saveTrainingLog` em `src/infra/storage/appData.ts`.

**Schema Dexie:** `src/infra/storage/db.ts` — adicionar `conceptTag` ao índice se quiser consultar por tag depois (opcional nesta SPEC).

### 4.5 Promoção SM-2/diploma com acerto cego

**`src/domain/method/pendingItems.ts`** (lógica de atualização do item após feedback):

Adicionar guarda: se `isBlindAttempt === false` (cue visível), o feedback **não** avança `attempts` nem `easeFactor`. Só registra no log.

```ts
// Em updatePendingItem ou equivalente:
if (!block.isBlindAttempt) {
  // cue visível: não promove SM-2; só log
  return item; // sem mudança
}
// cue oculto: aplica SM-2 normalmente
```

---

## 5. Arquivos-chave (mapa rápido)

```
src/
  domain/
    types.ts                    ← PlanBlock + TrainingLog (adicionar campos)
    plan/
      generatePlan.ts           ← injetar tavarezCue + isBlindAttempt no bloco
    sources/
      catalogSkills.ts          ← 14 nós com tavarezCue (só leitura)
    method/
      pendingItems.ts           ← SM-2: guarda isBlindAttempt antes de promover
      pedagogyConstants.ts      ← constantes SR (não tocar)
      types.ts                  ← PendingTrainingItem (provavelmente não tocar)
  ui/
    PlanBlockCard.tsx           ← esconder tavarezCue se isBlindAttempt
    Today.tsx                   ← 898 linhas; onde os blocos são renderizados
    ConceptTagPicker.tsx        ← NOVO: multiple-choice pós-puzzle
  app/
    useTrainingActions.ts       ← captura feedback; integrar tagging aqui
  infra/
    storage/
      appData.ts                ← saveTrainingLog (adicionar conceptTag)
      db.ts                     ← schema Dexie (adicionar conceptTag se necessário)
```

---

## 6. Gate objetivo

```bash
npm run typecheck
npm test
npm run build
```

### Critérios funcionais (testes obrigatórios)

1. Em bloco com `resourceStage='retrieval'`: `isBlindAttempt === true` e `tavarezCue` não renderiza.
2. Em bloco com `resourceStage='explain'`: `isBlindAttempt === false` e `tavarezCue` renderiza.
3. Feedback em bloco com `isBlindAttempt === false` **não avança** `attempts` no `PendingTrainingItem`.
4. Feedback em bloco com `isBlindAttempt === true` avança `attempts` normalmente (SM-2).
5. `ConceptTagPicker` aparece após feedback; "Pular" fecha sem gravar tag; tag gravada aparece em `TrainingLog.conceptTag`.

### Benchmark de produto (validar manualmente após ship)

- Completion rate não cai mais que 10–15% (churn TDAH).
- Acurácia de tag ≥ 70% após 30d (diagnóstico pedagógico).
- Abandono/rage-quit não sobe (monitorar via logs de sessão).

---

## 7. O que NÃO fazer nesta SPEC

- ❌ Fichar os 67 livros PT-BR (decisão adiada; próxima frente = auditar 121 fichados + patch 30–50 itens de endgame/posicional)
- ❌ Mudar o diploma gate (80%/30 puzzles) — não está no escopo
- ❌ Texto livre obrigatório no tagging — só opcional
- ❌ Gate cego punitivo na 1ª exposição — cue visível nas fases explain/guided
- ❌ Mexer em SM-2 ease-factor / spacing / SPACING_DAYS — já testado e mergeado
- ❌ Novos livros ou conteúdo — só mecânica de retrieval sobre o catálogo existente

---

## 8. Contexto pedagógico (para Fugu entender o porquê)

**App:** lichess-tutor — PWA de treino de xadrez para aprendiz TDAH (0→+).
**Tutor:** Professor Tavarez (persona, NÃO Lemos).
**Loop atual:** placement → curriculum → 14 skill nodes → SM-2 (30d retention gate) → diplomas → 5 trilhas de método.
**Licença:** proprietária (Juka Tavarez), código fechado.
**Backend:** Cloudflare Worker + D1; sync local ou OAuth Lichess; plaintext (não E2EE, por design divulgado).
**Deploy:** export manual semanal; `npm run deploy:worker` para o Worker.

**Por que B antes de A (fichar livros):**
O gargalo causal é retenção, não inventário. Adicionar mais conteúdo a um loop de retrieval vazando amplifica o defeito. B custa 3–5 dias; A custa 2–4 semanas. Validar B primeiro no catálogo existente (14 nós) — depois auditar os 121 fichados e criar patch de endgame/posicional.
