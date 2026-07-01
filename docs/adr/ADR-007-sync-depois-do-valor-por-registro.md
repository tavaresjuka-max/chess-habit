# ADR-007: Sync Depois Do Valor, Opt-In, Merge Por Registro

## Status

Aceito (2026-06-06). Parcialmente supersedido em 2026-06-30 pelo modelo conta-normal descrito em `docs/architecture/sync.md`.

## Contexto

O dono tem necessidade real de sync PC<->celular (estudar no celular em viagem/sala de espera). Um
spec anterior propos sync via Cloudflare KV com last-write-wins por secao de topo. Os relatorios
apontaram: (a) KV e eventualmente consistente; (b) LWW por secao pode apagar edicoes legitimas; (c)
sync e conveniencia e nao deve preceder o valor (loop de adaptacao).

## Decisao

- Sync opt-in via "Entrar com Lichess" como identidade; sem codigo de sync, sem senha propria e sem passphrase.
- Backend Cloudflare Workers + D1.
- Cliente envia mutacoes/JSON de progresso por HTTPS; progresso fica legivel no servidor por decisao de produto.
- Tokens OAuth ficam somente no aparelho e nao sao sincronizados.
- Mantido: merge por registro/tombstone, D1 em vez de KV, e nunca sincronizar imagens/screenshots.

## Consequencias

- Backend minimo (Worker + D1) so existe a partir da P3, com proposito unico de sync de um usuario.
- O algoritmo de merge por registro deve ter teste dedicado preservando `done` em conflito.
- Screenshots permanecem locais (IndexedDB), nunca remotos.
