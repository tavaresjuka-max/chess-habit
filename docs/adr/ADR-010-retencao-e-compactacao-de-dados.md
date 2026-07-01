# ADR-010: Retencao E Compactacao De Dados

## Status

Parcialmente aceito (2026-07-01). A politica de retencao **local** esta implementada e testada
(secao "Decisao — vigente"). A **compactacao de blobs antigos de sync** continua **em aberto**
(decisao do dono), como gate anterior a divulgacao ampla — nao para o beta pessoal.

## Contexto

Os dados crescem com o uso: `signals` (extraidos de partidas), `logs` de treino, `plans` diarios,
`pendingItems` de revisao. Com o sync opt-in (P4/P5, Cloudflare Worker + D1), esses registros tambem
viram blobs no servidor. Sem politica, dois problemas aparecem: (1) o IndexedDB local incha no celular;
(2) os blobs de sync acumulam versoes antigas indefinidamente. Precisa-se decidir o que expira, quando,
e como isso interage com o merge por registro do sync.

## Decisao — vigente (implementada)

**Local (IndexedDB / Dexie v14):**

- **Soft-delete + purga fisica em 90 dias.** Substituir sinais de uma fonte (`replaceSignalsForSource`)
  marca os antigos com `deletedAt` em vez de apagar; registros com `deletedAt` mais velho que 90 dias
  sao apagados fisicamente. Preserva janela de historico para o merge por registro do sync.
  `src/infra/storage/appData.ts:121-164` (`getPurgeCutoff`, UTC-safe via `setUTCDate`).
- **Retencao de diagnostico por fonte** (`filterSignalsForDiagnosis`, `useDiagnosisActions.ts:640-668`):
  - Lichess / `outro`: **90 dias** (janela padrao).
  - Chess.com `accuracy`/`opening`: **365 dias** (derivam da data real do jogo; 90d matava dado valido → fraqueza-fantasma).
  - Chess.com `rating`: **90 dias** (rating e retrato do momento; rating velho gera fraqueza-fantasma).
- **Cache Chess.com** (`chesscomMonthSignals`, schema v2): expira por `expiresAt`; arquivos mensais
  passados sao imutaveis e cacheados.
- **Nunca expira:** `achievements` (conquista desbloqueada e permanente) e os carimbos write-once de
  `appMeta` (`adoptedAt`, `consentedAt`).
- **Backup** (`backup.ts`): inclui `signals`/`weaknesses` com `deletedAt` (preserva historico para
  auditoria/recover). Nao exporta tokens OAuth, `errorLog`, `syncState` nem caches.

## Decisao — em aberto (do dono)

**Compactacao/retencao de BLOBS antigos de sync (servidor D1):** **nao implementada.** Hoje o sync usa
**LWW (last-write-wins) por registro**, aceitavel para o beta pessoal. Antes de escalar para coorte:

1. Definir por quanto tempo guardar versoes antigas de blob e quando compactar/apagar.
2. Tratar colecoes **path-dependent** (ex.: `plans` por data, `signals` por `source`+`observedAt`),
   onde LWW cego pode perder ordem — precisa de cuidado antes de escala.
3. E2EE foi **descartado** (decisao registrada): exagero para dado de baixa sensibilidade; modelo
   vigente e conta-normal legivel no servidor, com privacidade honesta e divulgada.

Isso e um **gate pre-divulgacao ampla**, nao um bloqueio do beta pessoal.

## Consequencias

- **Melhora:** comportamento local previsivel, testado e timezone-safe; sem inchaco descontrolado;
  historico de 90 dias sustenta o merge por registro.
- **Fica em aberto:** compactacao de blobs e conflitos path-dependent do sync sob escala. Enquanto o
  uso e pessoal (1-2 aparelhos do dono), LWW por registro basta.
- **Risco assumido:** validacao de backup e **shape-only** (`validateBackupData`), nao checa FK/faixa/
  duplicata semantica — aceitavel para restore do proprio dono, a revisitar se houver import de terceiros.

## Fontes

- `src/infra/storage/appData.ts:121-164` (`getPurgeCutoff`, `replaceSignalsForSource`)
- `src/app/useDiagnosisActions.ts:640-668` (`filterSignalsForDiagnosis`, janelas 90d/365d)
- `src/infra/storage/db.ts` (schema Dexie v14), `src/infra/storage/backup.ts` (export)
- `docs/architecture/FASE-5-SYNC-PLAN.md:23-32` (gate de compactacao/retencao; E2EE descartado)
- Relacionado: ADR-007 (sync depois do valor por registro), ADR-008 (Chess.com fonte primaria)
