# ADR-003: PWA Lichess-first Com Sync

## Status

Aceito.

## Contexto

O app precisa funcionar em computador e mobile, com login e progresso sincronizado.

## Decisao

Usar PWA como distribuicao inicial, Lichess OAuth PKCE para login e backend minimo Cloudflare Workers + D1 para sync.

## Consequencias

Evita criar apps nativos cedo demais. Sync exige backend e politica de privacidade desde o MVP. Atualizacao automatica de dados externos deve respeitar minimo armazenamento e pode exigir ADR futura se envolver tokens long-lived.

