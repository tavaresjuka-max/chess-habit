# Contrato: Cloudflare Sync

## Objetivo

Sincronizar progresso do tutor entre dispositivos.

## Componentes

- Cloudflare Workers para API.
- Cloudflare D1 para dados.
- Identidade via "Entrar com Lichess" (OAuth validado no Worker), sem sessao propria do app.

## Dados

Salvar mutacoes de entidades allowlist de progresso do tutor. Conteudo fica legivel no servidor em modelo conta-normal, sem E2EE/passphrase.

Nao salvar por padrao:

- PGN completo;
- token OAuth como dado de sync;
- cache Chess.com bruto;
- backups locais;
- dados financeiros;
- senha.

## APIs

- `GET /health`
- `POST /blobs`
- `GET /blobs?collection=<nome>`
- `GET /snapshot`
- `DELETE /blobs`
