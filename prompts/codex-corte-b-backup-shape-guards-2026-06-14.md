# Handoff Codex — Corte B: Backup Shape Guards

Data: 2026-06-14
Autorizacao: Claude (Diretor) via `docs/review/relatorio-claude-arbitragem-nota-95-2026-06-13.md`
Pre-requisito: Corte A commitado (df882b8) — gates verdes.

## Contexto

O backup ja tem envelope forte: formato, versao, checksum SHA-256 e verificacao de que cada
tabela e um array. O que falta e validar os itens dentro dos arrays — hoje o codigo faz cast
cego com `as ProfileRecord[]`, `as PlanRecord[]`, etc. Um backup com `signals: [1, 2, 3]` ou
`plans: [{ foo: "bar" }]` passa pela validacao atual e e escrito no Dexie sem protecao.

Ha tambem um bug: a transacao Dexie em `importBackupFromJson` nao tem try/catch. Se o
`bulkPut` lancar (e.g., schema inválido), o erro vira throw nao tratado — a funcao promete
retornar `BackupImportResult` mas na pratica pode rejeitar a Promise. O chamador no estado
da UI nao esta preparado para isso.

## Gate De Entrada

```
npm run lint   # verde
npm run test   # verde (>= 373 testes)
npm run build  # verde
```

## Arquivos Relevantes

- `src/infra/storage/backup.ts` — parseBackupFile, BackupData, tipos
- `src/infra/storage/appData.ts` — importBackupFromJson (linha ~367), transacao Dexie
- `src/infra/storage/backup.test.ts` — testes de parseBackupFile (adicionar aqui)
- `src/infra/storage/db.ts` — tipos de record (ProfileRecord, SignalRecord, etc.) — ler antes

## Contrato Que Nao Pode Ser Violado

- Guards sao funcoes puras sem efeito colateral — nao importam Dexie, nao importam React.
- Backups antigos (pre-Corte 7) sem `achievements` ou `placementResults` devem importar sem erro.
- Campos opcionais ausentes em itens individuais (ex.: signal sem `deletedAt`) nao devem rejeitar.
- Nenhuma mudanca em logica de negocio, state.ts, domain/ ou infra de rede.
- Nenhuma dependencia nova.

## Tarefa 1 — Adicionar `validateBackupData` em `backup.ts`

Criar e exportar funcao pura:

```ts
export function validateBackupData(data: BackupData): string | null
```

Retorna `null` se valido, ou uma mensagem de erro em PT-BR descrevendo o primeiro problema
encontrado (entidade + campo + indice do item).

Guards minimos por tabela (verificar apenas campos obrigatorios; ignorar campos extras):

| Tabela | Campos obrigatorios por item |
|--------|------------------------------|
| `profile` | `band` (string), `updatedAt` (string) |
| `plans` | `id` (string), `date` (string que bata `/^\d{4}-\d{2}-\d{2}$/`), `blocks` (array) |
| `logs` | `id` (string), `startedAt` (string), `elapsedSeconds` (numero >= 0) |
| `signals` | `id` (string), `kind` (string nao-vazio) |
| `weaknesses` | `id` (string), `tag` (string nao-vazio) |
| `methodTracks` | `id` (string) |
| `pendingItems` | `id` (string) |
| `diplomaAttempts` | `id` (string) |
| `achievements` (opcional) | se presente: `id` (string), `unlockedAt` (string) |
| `placementResults` (opcional) | se presente: `id` (string) |

Regra de compatibilidade retroativa: se `data.achievements` for `undefined`, nao validar
(ausencia e ok; so valida se o campo existir). O mesmo vale para `placementResults`.

O guard de cada item deve verificar `typeof item === 'object' && item !== null` antes de
checar os campos.

## Tarefa 2 — Plugar a Validacao em `parseBackupFile`

Em `backup.ts`, apos validar checksum e antes de retornar `{ ok: true, ... }`, chamar
`validateBackupData(data as BackupData)`. Se retornar string, retornar
`{ ok: false, error: <string> }`.

Isso garante que a validacao de shape acontece antes de qualquer escrita no Dexie.

## Tarefa 3 — Corrigir Try/Catch em `importBackupFromJson`

Em `appData.ts`, a chamada `await db.transaction(...)` dentro de `importBackupFromJson`
nao esta em try/catch. Envolver:

```ts
try {
  await db.transaction('rw', [...tabelas...], async () => {
    // bulkPuts existentes
  });
} catch (err) {
  return {
    ok: false,
    error: `Erro ao restaurar dados: ${err instanceof Error ? err.message : 'falha desconhecida'}.`,
  };
}
```

A funcao nunca deve lancar — sempre retorna `BackupImportResult`. Isso resolve o bug onde
falha de Dexie durante `bulkPut` vira Promise rejeitada nao tratada.

## Tarefa 4 — Testes (adicionar em `backup.test.ts`)

Adicionar bloco `describe('validateBackupData')` com os seguintes casos:

1. **Backup valido com todas as tabelas preenchidas** — retorna `null`.
2. **plans com item sem `date`** — retorna string com "plans" e "date".
3. **signals com item onde `kind` nao e string** — retorna string com "signals" e "kind".
4. **logs com `elapsedSeconds` negativo** — retorna string com "logs" e "elapsedSeconds".
5. **achievements invalido (item sem `unlockedAt`)** — retorna string com "achievements".
6. **Backup antigo sem campo `achievements`** — retorna `null` (retrocompatibilidade).
7. **Backup antigo sem campo `placementResults`** — retorna `null`.

Tambem adicionar em `describe('parseBackupFile')`:

8. **Backup com checksum valido mas signal com kind nao-string** — `parsed.ok === false`.

Nao e necessario testar `importBackupFromJson` (requer Dexie mock pesado). Os guards sao
puros e testam-se diretamente.

## Gate De Saida (DoD)

- [ ] `validateBackupData` exportada de `backup.ts`, pura, sem imports de Dexie/React
- [ ] Chamada integrada em `parseBackupFile` antes do `return { ok: true }`
- [ ] `importBackupFromJson` em `appData.ts` nunca lanca — sempre retorna `BackupImportResult`
- [ ] 8 cenarios de teste passando em `backup.test.ts`
- [ ] `npm run lint` verde
- [ ] `npm run test` verde (contagem >= entrada + 8 novos)
- [ ] `npm run build` verde
- [ ] Nenhuma mudanca em state.ts, domain/, infra de rede ou componentes UI

## Commit

```
feat: Corte B — backup shape guards + fix silent DB error on import

- validateBackupData() pure guard per entity with required-field checks
- plugged into parseBackupFile before any Dexie write
- importBackupFromJson try/catch: always returns BackupImportResult, never throws
- 8 unit tests covering valid, invalid-field, and legacy-format scenarios
```

## Depois Do Corte B

Reportar:
1. Resultado dos 8 testes (passar/falhar e nome do caso).
2. Contagem final de testes (deve ser >= 381).
3. Qualquer campo obrigatorio que pareceu ambiguo durante a implementacao.

O proximo corte apos aprovacao sera o Corte C (API queue/cooldown).
