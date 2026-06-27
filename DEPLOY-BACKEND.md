# Runbook do backend de sync (P4) - operado pelo DONO

> O agente constroi e testa **localmente** (wrangler/miniflare). **Quem provisiona a nuvem, cria contas
> e administra secrets e o dono.** Este arquivo e o checklist do dono quando a fase P4 comecar.

## Pre-requisitos

- Conta Cloudflare (criada pelo dono).
- `wrangler` autenticado pelo dono (`wrangler login`) - nunca pelo agente.

## Passos (quando P4 estiver implementado)

1. `wrangler d1 create rotina-sync` -> copiar o `database_id` para `wrangler.toml`.
2. Aplicar schema: `wrangler d1 execute rotina-sync --file=./backend/schema.sql`.
3. Definir secrets do dono (ex.: `wrangler secret put ...`) - nunca commitar.
4. `wrangler deploy`.
5. Apontar `connect-src` da CSP para a URL do Worker.

## Regras inviolaveis

- Servidor nunca recebe token, passphrase, chave nem plaintext (ver contrato E2EE em
  `docs/architecture/sync.md`).
- Sem PGN completo, sem PII.

## Estado M12 (local-only, key-agnostic)

O worker existe e e testado **sem nuvem e sem wrangler/miniflare**: o handler `fetch`
(`backend/worker.ts`) e puro e os testes (`npm run test:worker`) injetam um fake D1 em
memoria (`backend/fakeD1.ts`) com a mesma forma da API D1. Isso mantem M12 isolado da
decisao de KDF/passphrase (M13).

- Schema: `backend/schema.sql` (tabela `blobs`, PK `(userId, collection, clientMutationId)`,
  coluna unica de conteudo = `ciphertext`, opaca).
- API: `GET /health` (publico), `POST /blobs` (push), `GET /blobs?collection=X` (pull por
  colecao), `GET /snapshot` (pull de todas as colecoes). Servidor jamais decodifica
  `ciphertext`; `userId` vem do auth, nunca do payload.
- Auth: **modo local apenas**. `SYNC_AUTH_MODE='local'` confia no header `X-Sync-User`
  (exclusivo para teste/dev). Qualquer outro valor (ou ausente) recusa com **501** apontando
  para M13 - o worker nunca confia em header por padrao. **Producao exige validacao OAuth
  Lichess (M13), ainda nao implementada.**
- Gates locais: `npm run typecheck:worker && npm run test:worker`.

### Quando o dono quiser rodar com wrangler/miniflare (opcional, local)

1. Instalar `wrangler` (devDependency, a cargo do dono): `npm i -D wrangler`.
2. `cp backend/wrangler.toml ./wrangler.toml` (ou rodar dentro de `backend/`) e substituir
   `database_id` apos `wrangler d1 create rotina-sync`.
3. Aplicar schema: `wrangler d1 execute rotina-sync --local --file=./backend/schema.sql`.
4. `wrangler dev` (local). Ainda assim, OAuth real fica para M13.
