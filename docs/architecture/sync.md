# Sincronizacao

## Objetivo

Permitir que o aluno use computador e mobile sem perder progresso.

## Modelo Vigente

Sync e opt-in e segue o modelo normal de conta de app de estudo:

- O cliente grava primeiro no IndexedDB.
- Quando o usuario liga a sincronizacao, o app usa "Entrar com Lichess" como identidade.
- O cliente envia mutacoes de entidades para o Worker Cloudflare + D1 por HTTPS.
- O progresso fica legivel no servidor pelo operador, por decisao de produto do dono.
- Tokens OAuth, passphrases inexistentes, PGN completo e cache bruto nao sao sincronizados.
- Sem E2EE/passphrase no modelo vigente.

## API

- `GET /health` — healthcheck publico.
- `POST /blobs` — push/upsert de mutacao.
- `GET /blobs?collection=<nome>` — pull por colecao.
- `GET /snapshot` — pull de todas as colecoes sincronizaveis.
- `DELETE /blobs` — apaga todos os blobs do usuario autenticado.

## Auth

- Producao: `SYNC_AUTH_MODE='oauth'`; o Worker valida `Authorization: Bearer <token>` contra `https://lichess.org/api/account` e deriva o `userId` do usuario Lichess.
- Dev/teste: `SYNC_AUTH_MODE='local'`; aceita `X-Sync-User` apenas em ambiente local/testavel.
- O token OAuth e usado para validar identidade, mas nao e armazenado como dado de sync.

## Regras

- Persistir primeiro localmente.
- Sincronizar apenas colecoes allowlist deny-by-default.
- Preservar tombstones e resolver conflito simples por `updatedAt`/LWW.
- Nao sincronizar tokens OAuth, backups, cache Chess.com, PGN completo, solucoes de puzzle ou dados brutos desnecessarios.
- Manter politica de privacidade honesta: progresso sincronizado e legivel no servidor.

## Falhas

- Offline: o app continua local-first; sync tenta novamente quando houver conectividade.
- 401: pausar sync e pedir novo login Lichess.
- 429 externo: pausar chamadas externas por no minimo 1 minuto.
- Blob malformado: pular item ruim sem derrubar o pull inteiro.
- Conflito: LWW por registro; itens mais sensiveis a conflito devem ganhar entidade propria ou log de eventos antes de escala maior.

## Pendencias/Riscos

- Teste E2E real em dois aparelhos ainda deve ser repetido antes de confiar em uso amplo.
- Retencao/compactacao de blobs antigos ainda precisa politica segura; evitar compactacao por hash fraco de entidade.
- Se o sync for divulgado alem do beta pessoal, revisar LGPD, retencao, suporte e canal de feedback.
