# Contrato: Cloudflare Sync

## Objetivo

Sincronizar progresso do tutor entre dispositivos.

## Componentes Planejados

- Cloudflare Workers para API.
- Cloudflare D1 para dados.
- Sessao segura do app.

## Dados

Salvar eventos pequenos e sinais derivados.

Nao salvar por padrao:

- PGN completo;
- token long-lived;
- dados financeiros;
- senha.

## APIs

- `POST /api/sync/push`
- `GET /api/sync/pull`
- `GET /api/export`
- `POST /api/delete-account`

