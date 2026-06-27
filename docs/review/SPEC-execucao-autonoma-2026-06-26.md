# SPEC — Execução autônoma (Fase 0 + Fase 1 reversível) · 2026-06-26

Fonte da verdade: [analise-completa-fugu-2026-06-26.md](analise-completa-fugu-2026-06-26.md).
Executor: **GLM 5.2** (`opencode run -m zai/glm-5.2 --dir .`). Revisor de rotina:
**Sonnet** (subagente). Selador de lote: **Fugu** (`opencode run -m sakana/fugu-ultra`).
Árbitro: **gates objetivos**. Dono da escrita/commit: o **orquestrador Sonnet**.

## NON-GOALS (proibido)
- NÃO mergear nada em `master`. Trabalho reversível vai em `auto/fase0-1`; classe
  de dados vai em `hold/data-integrity` (rascunho, **sem merge**).
- NÃO tocar/mergear schema/dados sem revisão do Opus: `src/infra/storage/db.ts`,
  `appData.ts`, `backup.ts`, `persistence.ts`, migrações Dexie. (Rascunho na
  branch hold é permitido; merge NÃO.)
- NÃO tocar `.env`, segredos, `opencode.jsonc`, `vercel.json` de produção.
- NÃO inventar conteúdo de xadrez novo (isso é Fase 2, precisa de revisão).

## Gates (rodar a cada tarefa, na ordem)
`npm run lint && npm test && npm run build` — e, se a tarefa toca UI/a11y,
`npm run smoke:pwa`. Verde obrigatório para commitar. Falhou 3x na mesma tarefa
→ PARA a tarefa, registra no relatório, segue para a próxima.

## Loop por tarefa
1. Orquestrador descreve a tarefa ao GLM (aponta este SPEC + arquivo-alvo; contexto
   mora no arquivo, prompt curto).
2. GLM devolve diff. Orquestrador aplica.
3. Roda os gates. Falhou → GLM corrige (até 3x) → senão enfileira p/ Opus.
4. Verde → **Sonnet revisa o diff** (risco, escopo, simplicidade).
5. Commit atômico em `auto/fase0-1` (mensagem clara + `Co-Authored-By`).
6. Ao fim de cada LOTE (3-4 tarefas), **Fugu sela** o diff acumulado do lote
   (não-bloqueante; se lento/cair, registra "Fugu pulado" e segue).

---

## CLASSE A — Autônoma (branch `auto/fase0-1`, reversível, gate cobre)

### T1 — Gate falha em console.warn/error inesperado *(Fase 0)*
Em `src/test/setup.ts`: fazer `console.error`/`console.warn` lançarem em teste
(com allowlist mínima se houver ruído legítimo conhecido).
**Aceite:** `npm test` falha se algum teste emitir warn/error não-allowlisted; suíte
atual fica verde após T2/T3.

### T2 — Corrigir mock incompleto Chess.com *(Fase 0)*
`src/app/useDiagnosisActions.test.tsx:27-29`: completar o mock
(`fetchChesscomGameRatings`) que dispara `console.warn` em
`useDiagnosisActions.ts:289-304`.
**Aceite:** teste sem warning; verde com T1 ligado.

### T3 — Eliminar `NaN-NaN-NaN` em data inválida *(Fase 0)*
Guardar a formatação de data inválida (React key/label) que gera `NaN-NaN-NaN`.
**Aceite:** teste de data inválida sem warning; sem `NaN-NaN-NaN` no DOM.

### T4 — Unificar identidade/persona *(Fase 0)*
Divergência: docs/skill = **"Professor Lemos"** (canônico); UI =
`src/ui/TutorCard.tsx:57-63` mostra "Professor Tavarez"; `APP_NAME` em
`src/config/appIdentity.ts`. **Decisão default (reversível): adotar "Professor
Lemos"** em toda a UI (alinha com docs/pedagogy/professor-lemos.md + skill
professor-lemos-voice). **FLAG no relatório**: confirmar com o dono (pode ser
intencional homenagear "Tavarez"). Também resolver `SOURCE_CODE_URL` pendente.
**Aceite:** grep de identidade sem divergência; teste documental se houver.

### T5 — Testes semânticos de roteamento *(Fase 1, test-only)*
`src/domain/method/selectMethodTrack.ts` não tem teste de decisão. Criar tabela
decisão→trilha cobrindo as 5 trilhas (pending-review, progress-diplomas,
active-defense, calculation-bridge, opening-as-plan) e o default.
**Aceite:** novo `selectMethodTrack.test.ts` com ≥1 caso por trilha + default; verde.

### T6 — `pedagogyConstants.ts` (centralizar + documentar + sensibilidade) *(Fase 1)*
Extrair constantes pedagógicas espalhadas para `src/domain/pedagogyConstants.ts`
com comentário de INTENÇÃO por constante. Inclui: thresholds de diagnóstico
(0.5, 3/2/0.5), graduação (75/80, 30, escape 2), SR (EF ±0.15/0.05/0.20,
[1,3,7,14], gate 30d), plano (FEEDBACK_EXPIRY_DAYS 14, MIN_ATTEMPTS 30,
PRIMARY_SESSION_CEILING 12, POOL_MAX 2). **Comportamento PRESERVADO** (mesmos
valores; só centraliza). Adicionar teste de sensibilidade documentando o efeito
de cada threshold.
**Aceite:** zero constante pedagógica fora do arquivo (grep); TODOS os testes
existentes verdes (prova de não-regressão); novo teste de sensibilidade passa.

### T7 — Labels PT-BR para temas Lichess na UI *(Fase 1, content/label)*
`src/ui/Progress.tsx:115-118` exibe slugs crus (`entry.theme`). Mapear todos os
temas exibidos para rótulo PT-BR.
**Aceite:** teste de cobertura: nenhum slug cru renderizado; verde.

### T8 — Medir cobertura *(Fase 1, informativo)*
Rodar `npm run coverage`; registrar % por módulo crítico (SR, plano, diagnóstico,
storage) no relatório. Não falhar build.
**Aceite:** números no relatório final.

---

## CLASSE B — Rascunho p/ revisão do Opus (branch `hold/data-integrity`, NÃO mergear)

### D1 — Validação range/FK/duplicidade no restore
`src/infra/storage/appData.ts:437-524` valida shape; falta range/FK/duplicidade.
Rascunhar validação que rejeita `easeFactor=99`, rating negativo, datas
impossíveis, IDs duplicados, FK órfã. **Property test** round-trip.

### D2 — Golden de migração Dexie
Teste golden v(n-1)→v(n) com dados reais preservando integridade (db.ts v1→v11).

### D3 — Reconciliação semântica restore↔sync *(achado crítico do selador)*
Guarda que reconcilia backup antigo + sync novo do Lichess (band defasada, tag
renomeada, duplicata) e **fail-loud** em inconsistência interna. Apenas rascunho +
testes de falsificação; **decisão de qual-fonte-vence fica para o Opus**.

**Aceite Classe B:** branch `hold/data-integrity` com diffs + testes que FALHAM
hoje (provando o gap) ou passam (provando a guarda), **sem merge**. Opus revisa
de manhã.

---

## Relatório final (um só, de manhã)
- Tarefas Classe A: feito/verde, ou parado-em-gate (com saída do erro).
- Cobertura medida (T8).
- FLAGS que precisam do dono: identidade Lemos/Tavarez (T4), qualquer decisão de
  produto que apareceu.
- Classe B: o que está pronto pra revisão no branch `hold/`.
- Saídas do Fugu por lote (selador).
