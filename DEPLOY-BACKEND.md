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
