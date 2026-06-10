# Spec De Design (As-Built): Método Professor Lemos — 5 Trilhas

- Data: 2026-06-10
- Autoria: Claude (claude-fable-5)
- Natureza: **spec as-built** — documenta o design do método 5 trilhas JÁ IMPLEMENTADO,
  escrito retroativamente por decisão do dono (rodada 2 de 2026-06-10, item A-3). O método
  foi implementado a partir do prompt de execução arquivado em `prompts/archive/2026-06-method/`;
  este documento é a fonte canônica de design daquela implementação.
- Base de código: `lichess-tutor` (React + Vite + TS, local-first, Dexie)
- Status: vigente. Mudanças no método exigem atualizar este spec ANTES de alterar o código.

> Este spec descreve o estado implementado e verificado no código em 2026-06-10. Toda âncora
> `arquivo:linha` foi conferida nesta data. Se o código divergir deste documento, o documento
> está stale e deve ser corrigido junto com a mudança.

---

## 1. Objetivo

Transformar o planejador adaptativo em um **método de estudo estruturado**: cinco trilhas
pedagógicas com prioridade fixa, tratamento espaçado de pendências (erros do próprio aluno),
critério determinístico de maestria (avançar/revisar/regredir) e marcos de progresso por
diplomas teóricos — nunca por rating.

Fundamentos pedagógicos registrados em `memory/decisions.md` (seção "Integração de
Metacognição Científica", 2026-06-10) e `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md`:

- **Tratamento de Pendências** (Christofoletti 2007; Gevorgyan 2024, r=0.29 para
  autorreflexão sobre erros não resolvidos) — re-resolver ativamente os próprios erros.
- **Diplomas** (Tirado & Silva 1999) — marcos teóricos de avaliação, travas didáticas
  que substituem rating como medida de avanço.
- **Justificação verbal da lógica** (Gevorgyan 2024, r=0.18) — implementada como
  `guidingQuestion` por bloco de treino.
- **DAMP como algoritmo de detecção tática** (acervo 2026-06-09) — drill `damp-scan`.

## 2. As cinco trilhas

Catálogo estático em `src/domain/method/methodTracks.ts:5` (`METHOD_TRACKS`). Tipos em
`src/domain/method/types.ts:3-20`.

| Prioridade | id | Título | focusWeaknessTags |
|---|---|---|---|
| 1 | `pending-review` | Tratamento de Pendências | hanging-piece, fork, discovered, pin, skewer |
| 2 | `calculation-bridge` | Cálculo Ponte 800-1200 | fork, discovered, mate-in-2, conversion |
| 3 | `active-defense` | Defesa Ativa | hanging-piece, blunder-rate |
| 4 | `opening-as-plan` | Abertura Como Plano | opening-principles |
| 5 | `progress-diplomas` | Diplomas de Progresso | (nenhuma — trilha de avaliação) |

Estados possíveis: `active | review | paused | completed` (`MethodTrackStatus`). Hoje todas
nascem `active` com `startedAt = 2026-06-10`.

## 3. Seleção de trilha ativa

Função pura `selectMethodTrack` em `src/domain/method/selectMethodTrack.ts:17`. Ordem de
decisão (primeira regra que casa vence):

1. **Pendência vencida hoje** (`isDueToday`) → `pending-review`. Pendência sempre tem
   prioridade máxima — o erro do aluno é o material de estudo mais valioso.
2. **Tema fraco de defesa** (`defensiveMove`, `hangingPiece`, `trappedPiece`) ou fraqueza
   primária em {hanging-piece, blunder-rate} → `active-defense`.
3. **Tema fraco de cálculo** (`fork`, `discoveredAttack`, `mateIn2`, `deflection`,
   `quietMove`) ou fraqueza primária em {fork, discovered, mate-in-2, conversion} →
   `calculation-bridge`.
4. **Fraqueza primária `opening-principles`** → `opening-as-plan`.
5. **Default** → `calculation-bridge` (a trilha-ponte é o eixo do progresso 800-1200).

A trilha `progress-diplomas` não é selecionada por sinal: entra no plano por marco
(quando o aluno se candidata a uma seção de diploma).

## 4. Tratamento de Pendências (repetição espaçada)

Módulo `src/domain/method/pendingItems.ts`. Tipos em `types.ts:22-40`.

- **Origem** (`PendingItemOrigin`): `puzzle | game-review | manual | diploma`.
- **Criação**: feedback `hard` num bloco de treino gera pendência
  (`createPendingItemFromFeedback`, com `lastFeedback: 'hard'`); tema de puzzle com
  perdas repetidas gera pendência temática (`createPendingItemFromTheme`, com deep link
  `https://lichess.org/training/<tema>`).
- **Espaçamento**: `SPACING_DAYS = [1, 3, 7, 14]` (`pendingItems.ts:4`). Cada tentativa
  avança o intervalo; após a 4ª tentativa o item fecha (`status: 'done'`) —
  `advancePendingItem` (`pendingItems.ts:75`).
- **Vencimento**: `isDueToday` compara `dueAt` (YYYY-MM-DD) com hoje; só itens `open`.
- **Pergunta-guia por trilha** (`buildGuidingPrompt`, `pendingItems.ts:98`) — justificação
  verbal de Gevorgyan, uma pergunta fixa por trilha (ex.: pending-review: "Qual sinal do
  tabuleiro você ignorou quando jogou o lance errado?").

## 5. Maestria (avançar / revisar / regredir)

Função pura `computeMastery` em `src/domain/method/mastery.ts:9`:

- volume mínimo não atingido → `review` (nunca avança sem volume);
- acerto ≥ 80% **e** sem `hard` nos 2 feedbacks mais recentes → `advance`;
- acerto ≥ 50% → `review`;
- abaixo disso → `regress`.

O resultado alimenta `PlanBlock.masteryTarget` (`src/domain/types.ts:145`) e orienta o
gerador de plano a subir, manter ou descer o estágio do recurso
(`PlanResourceStage: explain → guided → retrieval → transfer → review`).

## 6. Diplomas de progresso

Módulo `src/domain/method/diplomas.ts` (catálogo `DIPLOMAS`, `diplomas.ts:32`). Estrutura
de Tirado & Silva (1999), três marcos com seções avaliáveis e destino de treino no Lichess:

| Diploma | Banda didática | Nota de corte | Seções |
|---|---|---|---|
| Peão | 0-600 | 90% | coordenadas, valor das peças, mates básicos |
| Torre | 600-1000 | 80% | tática rotulada, segurança material, finais de peão |
| Rei | 1000-1200 | 75% | cálculo 2-3 lances, princípios de abertura, finais básicos |

Cortes em `DIPLOMA_THRESHOLDS` (`mastery.ts:27`). Aprovação: TODAS as seções com a última
tentativa ≥ corte (`isDiplomaPassed`, `diplomas.ts:120`). Progresso por seção exposto via
`getDiplomaProgress`. Tentativas persistidas como `DiplomaAttempt` (origem `local` ou
`lichess`).

Nota (rodada 2, 2026-06-10): as bandas dos diplomas (0-600, 600-1000, 1000-1200) são
**didáticas** e independentes das bandas técnicas do `LearnerBand`. O Corte 2 (spine
0-2200, 7 bandas) NÃO altera os diplomas existentes; diplomas para bandas acima de 1200
são escopo do Corte 8 (currículo denso).

## 7. Formatos de drill

`DrillFormatId` em `types.ts:56-63` — sete formatos, cada um ancorado numa fonte do acervo:

| id | Fonte pedagógica |
|---|---|
| `pendency-treatment` | Christofoletti 2007 (re-resolver erros próprios) |
| `thinking-system-soltis` | Soltis (sistema de pensamento/candidatos) |
| `defense-checklist-crouch` | Crouch (checklist defensivo) |
| `opening-principle-emms` | Emms (princípios de abertura) |
| `diagnostic-profile` | perfil diagnóstico interno |
| `lpdo-scan` | LPDO — "loose pieces drop off" (peças soltas) |
| `damp-scan` | DAMP como algoritmo de detecção tática (acervo 2026-06-09) |

## 8. Integração com o gerador de plano

`src/domain/plan/generatePlan.ts`:

- `generatePlan.ts:73` chama `selectMethodTrack` com pendências abertas, fraqueza primária
  e temas fracos de puzzle.
- Blocos normais recebem `methodTrackId` da trilha ativa e `guidingQuestion` da trilha
  (`generatePlan.ts:159-160`).
- Pendência vencida vira bloco dedicado com `methodTrackId: 'pending-review'`,
  `drillFormatId: 'pendency-treatment'`, `pendingItemId` e a pergunta-guia do próprio item
  (`generatePlan.ts:196-203`).
- Campos de método no `PlanBlock` (`src/domain/types.ts:142-147`): `methodTrackId`,
  `methodStepId`, `pendingItemId`, `masteryTarget`, `drillFormatId`, `guidingQuestion` —
  todos opcionais para retrocompatibilidade com planos antigos.

## 9. Persistência

Dexie v4 (`src/infra/storage/db.ts:79-82`):

- `methodTracks: 'id, status, updatedAt'`
- `pendingItems: 'id, status, dueAt, methodTrackId, weaknessTag, updatedAt'`
- `diplomaAttempts: 'id, diplomaId, sectionId, createdAt, updatedAt'`

As três tabelas entram no export de backup (`src/infra/storage/appData.ts:195-197`).
Atenção (auditoria Codex 2026-06-10): o schema ainda precisa da passada sync-meta do
Corte 1 (UUID/merge-key, `updatedAt` universal, soft delete, fim de replaces destrutivos
em `signals`/`weaknesses`).

## 10. Superfícies de UI

- `TutorCard` — voz do tutor na sessão (envelope do spec 2026-06-08).
- `PendingReviewCard` — pendência vencida do dia, com pergunta-guia.
- `LearningPlanProposalCard` — proposta de plano com método, etapas e critérios.
- `SessionMilestonesCard` / progresso de diplomas na tela Hoje.

## 11. Não-objetivos (idênticos ao spec do tutor 2026-06-08)

- Sem engine, sem promessa de rating, sem PGN persistido, sem tabuleiro próprio.
- Sem diagnóstico lance a lance; trava de evidência vale para toda explicação do método.
- Tom Professor Lemos: PT-BR, sóbrio, sem emoji, respeitando a banlist de
  `docs/pedagogy/professor-lemos.md`.

## 12. Relação com outros documentos

- `docs/superpowers/specs/2026-06-08-professor-lemos-tutor-design.md` — tutor (envelope de
  sessão, diagnóstico, constância). O método 5 trilhas COMPÕE com o tutor: o tutor fala, o
  método decide o que treinar.
- `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md` e `docs/pedagogy/professor-lemos.md`
  — base pedagógica e persona.
- `memory/decisions.md` — decisões de 2026-06-10 (ondas de pesquisa, rodada 2).
- Prompt de execução original: `prompts/archive/2026-06-method/` (histórico, não vigente).
