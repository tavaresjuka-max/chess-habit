# SPEC — E1: ingestão da série temporal de rating do Lichess

## Contexto (decisão #3, beta-plan-council 2026-06-25)
Eficácia = within-subject pré/pós no rating EXTERNO do Lichess. O app já captura rating
ATUAL (`src/infra/lichess/account.ts`) + rating pontual de partidas (`games.ts`, Signal
`kind:'rating'`), mas **NÃO consome** `/api/user/{u}/rating-history` (a série temporal). Sem
ela não há "pré" (slope dos ~90d antes do uso do app). A rating-history é **RETROSPECTIVA**
(a API devolve o histórico inteiro), então dá pra reconstruir o pré mesmo começando depois.

**Outcome adjudicado (maestro, sobre a divergência O1/O2 do council):** primário = rating
externo geral, within-subject pré vs pós (O1). "Condicional à fraqueza" = gate de
dose/inclusão (E4), NÃO outcome por-motivo (O2 exige detecção de motivo nos jogos — sem
engine, adiado). **E1 é só a base de dados — vale pros dois caminhos.**

## Teste primeiro (vitest — TDD)
1. **Parser** — formato conhecido de `/api/user/{u}/rating-history` (uma entrada por
   categoria; cada ponto é `[ano, mês, dia, rating]`):
   ```json
   [
     { "name": "Blitz",     "points": [[2024, 0, 15, 1532], [2024, 1, 3, 1547]] },
     { "name": "Rapid",     "points": [] },
     { "name": "Classical", "points": [[2024, 2, 9, 1610]] }
   ]
   ```
   **GOTCHA: o `mês` é 0-indexed (0=jan, 11=dez), igual ao `Date` do JS** — `new Date(ano,
   mês, dia)` funciona direto; pra ISO `YYYY-MM-DD` é `mês+1`. `points: []` quando o usuário
   nunca jogou a categoria. A função extrai a série por categoria relevante
   (rapid/blitz/classical) como `[{date: ISO, rating}]`, descartando categorias irrelevantes
   e vazias. **Valide o shape contra UMA amostra real do endpoint antes de finalizar (o teste
   deve falhar se o formato divergir) — não invente campos.**
2. **Persistência** — a série é gravada e relida de forma idempotente.
3. **Falha de rede/404/usuário sem histórico** — degrada sem crash (retorna vazio ou erro
   tipado), NÃO quebra o sync existente.

Rode SÓ esses testes → VERMELHO antes.

## Fix (mínimo)
- Cliente novo em `src/infra/lichess/` espelhando `account.ts`/`games.ts`: fetch
  `/api/user/{u}/rating-history`, parse do formato `[[y, m0, d, rating]]` → `[{date, rating}]`
  por perf.
- Persistir a série (Dexie). **Se exigir migração de schema, seguir o padrão das migrações
  existentes (`src/infra/storage/db.ts`) — DATA: o maestro revisa.**
- NÃO calcular slope/pré-pós aqui (isso é E2). Só ingerir + persistir.

## NON-GOALS (fronteira de risco)
- NÃO calcular eficácia/slope (E2). NÃO criar pré-registro (E3). NÃO orquestrar dose (E4).
- NÃO tocar placement/`diplomas.ts`/`bandProgression.ts`. NÃO fazer chamada de rede real nos
  testes (mockar a API). NÃO inventar IDs. NÃO commitar. NÃO council. NÃO maestro.

## Gate de aceite (binário)
- Testes novos: VERMELHO antes, VERDE depois.
- `npm test` (suíte cheia) VERDE. `npm run lint` + `npm run build` VERDES.

## Entrega
Arquivos mudados + diff resumido + teste antes/depois + arquivos lidos + se mexeu em schema
Dexie (migração), DESTACAR explicitamente. NÃO commitar — o maestro revisa risco e commita.
