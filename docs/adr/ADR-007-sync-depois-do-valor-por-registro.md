# ADR-007: Sync Depois Do Valor, Opt-In, Merge Por Registro

## Status

Aceito (2026-06-06). Atualiza `docs/architecture/sync.md` (que passa a ser a referencia de modelo de
eventos para esta fase).

## Contexto

O dono tem necessidade real de sync PC<->celular (estudar no celular em viagem/sala de espera). Um
spec anterior propos sync via Cloudflare KV com last-write-wins por secao de topo. Os relatorios
apontaram: (a) KV e eventualmente consistente; (b) LWW por secao pode apagar edicoes legitimas; (c)
sync e conveniencia e nao deve preceder o valor (loop de adaptacao).

## Decisao

- **Sync entra na Fase P3**, depois do loop de valor (P2). Conveniencia nao precede valor.
- **Opt-in**, por **codigo de sync** forte (>= 24 chars; chave = `hash(codigo)`), sem conta e sem OAuth.
- **Merge por registro**: sincronizar itens individuais com `updatedAt`; comparar timestamp por item;
  nunca sobrescrever secao inteira; **preservar sempre `status:'done'`**.
- **Cloudflare D1** preferido a KV para o estado sincronizavel (consistencia imediata). Reutilizar o
  modelo de eventos de `docs/architecture/sync.md`.
- **Nunca** sincronizar imagens/screenshots. Codigo de sync tratado como senha (sem log).

## Consequencias

- Backend minimo (Worker + D1) so existe a partir da P3, com proposito unico de sync de um usuario.
- O algoritmo de merge por registro deve ter teste dedicado preservando `done` em conflito.
- Screenshots permanecem locais (IndexedDB), nunca remotos.
