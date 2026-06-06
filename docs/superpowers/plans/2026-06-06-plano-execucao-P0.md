# Plano De Execucao — Fase P0 (scaffold limpo + dominio + plano fixo + PWA minimo)

- Data: 2026-06-06
- Planejador: Claude (claude-opus-4-8). Executor: Codex.
- Spec base: `docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md` (com Adendo 22).
- Escopo: SOMENTE P0. Nao implementar P1+ (sem rede, sem detector, sem sync).

> Regras: uma tarefa por vez, na ordem. Commit atomico por tarefa. Rodar o gate
> (`npm run lint && npm run test && npm run build`) antes de fechar cada tarefa que toca codigo.
> Diante de ambiguidade ou contrato divergente: PARAR e perguntar. NAO abrir/ler/copiar
> `chessking-tutor/src/*` em hipotese alguma.

## Checklist clean-room (validar no fim de CADA tarefa)

- [ ] Nenhum arquivo veio de `chessking-tutor` ou `chessking-assets` (nem copia, nem referencia aberta).
- [ ] Nenhum nome de curso/secao/estrutura do ChessKing aparece no codigo.
- [ ] `SourceId` permanece `'lichess' | 'chesscom' | 'outro'`.

## Pre-condicoes

- Trabalhar dentro da pasta `lichess-tutor/`. O app nasce aqui, do zero.
- Node LTS. Gerenciador: npm.

---

## Tarefa 1 — Scaffold Vite limpo

- Inicializar app React + TypeScript com Vite na pasta `lichess-tutor/` (template `react-ts`).
- Fixar dependencias (versoes estaveis atuais; registrar as escolhidas):
  - runtime: `react`, `react-dom`, `dexie`.
  - dev: `typescript`, `vite`, `@vitejs/plugin-react`, `vitest`, `eslint`, `typescript-eslint`,
    `@types/react`, `@types/react-dom`, plugin PWA (`vite-plugin-pwa`).
- `tsconfig`: `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitAny: true`.
- Scripts em `package.json`: `dev`, `build` (`tsc -b && vite build`), `lint`, `test` (`vitest run`), `preview`.
- DoD: `npm install && npm run build` verdes. App inicial roda em `npm run dev`.
- Commit: `chore(p0): scaffold vite react-ts limpo`.

## Tarefa 2 — Estrutura de pastas e camadas

Criar a arvore (Dominio puro, sem rede/React):

```
src/
  domain/
    types.ts
    plan/generatePlan.ts
    plan/timeBudget.ts
    coach/coachCatalog.ts
    sources/destinations.ts        # allowlist estatica de slugs Lichess (sem fetch)
    index.ts
  infra/
    storage/db.ts                  # Dexie schema versionado
    storage/appData.ts             # load/save/export/clearAll
  app/
    state.ts                       # hooks de orquestracao
  ui/
    Today.tsx
    Config.tsx
    App.tsx
  main.tsx
```

- Regra lint: proibir import de `infra`/`react` dentro de `domain/**` (configurar ESLint
  `no-restricted-imports` para a pasta domain).
- DoD: build verde; teste bobo de barril `domain/index.ts` passa.
- Commit: `chore(p0): estrutura de camadas e regra de isolamento do dominio`.

## Tarefa 3 — Tipos do dominio (subset P0)

Em `domain/types.ts`, implementar exatamente os tipos do spec secao 6 necessarios a P0:
`SourceId`, `Destination`, `WeaknessTag`, `Confidence`, `SignalValue` (union discriminada),
`Signal`, `Weakness`, `LearnerProfile` (band `'0-800'|'800-1200'`, `defaultSessionMinutes 5|15|30|60`),
`PlanBlock` (com `updatedAt`), `DailyPlan`. Sem `value: unknown`.

- DoD: `tsc` estrito sem erros; nenhum `any`/`unknown` exportado.
- Commit: `feat(p0): tipos do dominio (Signal/Weakness/Plan)`.

## Tarefa 4 — Allowlist de destinos Lichess (estatica, sem scraping)

Em `domain/sources/destinations.ts`: mapa `WeaknessTag -> Destination` com URLs Lichess da allowlist
do spec secao 8 (validada manualmente; NENHUM fetch). `time-trouble`/`conversion` sem `url` (so texto).

- Teste: para cada tag, a `url` (quando existir) casa o formato `^https://lichess\.org/(training/[A-Za-z0-9]+|practice|learn|analysis)$`.
- DoD: teste de formato verde; sem chamada de rede.
- Commit: `feat(p0): allowlist estatica de destinos lichess`.

## Tarefa 5 — Time budget + gerador de plano fixo (P0)

- `domain/plan/timeBudget.ts`: divisao EXATA (Adendo 22.3):
  5 -> [tema 5]; 15 -> [tema 10, revisao 5]; 30 -> [aquecimento 5, tema 15, transferencia 10];
  60 -> [aquecimento 10, tema 20, transferencia 20, final 10].
- `domain/coach/coachCatalog.ts`: catalogo fixo de `coachNote` por tipo de bloco (3-5 frases cada,
  tom adulto, sem prometer rating).
- `domain/plan/generatePlan.ts`: `generatePlan(profile, weaknesses, sessionMinutes, date): DailyPlan`.
  **P0 ignora `weaknesses`**; tema fixo por band (`0-800` -> `hanging-piece`; `800-1200` -> `fork`);
  monta blocos pelo time budget; cada bloco recebe `destination` do mapa, `task`/`stopRule` por tipo,
  `coachNote` do catalogo, `status:'pending'`, `updatedAt`.
- DoD (testes Vitest): para 5/15/30/60 gera o numero certo de blocos, soma de minutos correta, tema
  correto por band, destinos validos, funcao pura (sem efeitos).
- Commit: `feat(p0): gerador de plano fixo sensivel ao tempo`.

## Tarefa 6 — Persistencia local (Dexie)

- `infra/storage/db.ts`: Dexie `version(1)` com stores `profile`, `plans`, `logs`, `signals`,
  `weaknesses` (indices por chave/data conforme necessario).
- `infra/storage/appData.ts`: `loadProfile/saveProfile`, `savePlan/getPlan(date)`,
  `exportAllAsJson(): string`, `clearAll(): Promise<void>`.
- DoD: teste com fake-indexeddb (dependencia de dev) cobrindo save->load e clearAll; build verde.
- Commit: `feat(p0): persistencia local com dexie + export/clear`.

## Tarefa 7 — UI minima (Hoje + Config)

- `Config.tsx`: campo `lichessUsername` (default editavel `jukasparov`), `band`, `defaultSessionMinutes`.
  Botao "Exportar backup (JSON)" e "Apagar tudo".
- `Today.tsx`: gera/mostra o `DailyPlan` do dia; por bloco: titulo, motivo, minutos, botao "Abrir no
  Lichess" (so quando `destination.url` existir; quando undefined, mostrar so texto), "Concluir",
  "Pular". Override rapido de `sessionMinutes` do dia.
- `App.tsx`: navegacao simples Hoje/Config.
- Estado vazio: se nao ha username/band, levar a Config.
- DoD: fluxo manual no browser (desktop e mobile via devtools): preencher config -> ver plano ->
  marcar feito -> exportar JSON. Sem erros de console com objeto de dominio completo.
- Commit: `feat(p0): telas Hoje e Config com export/delete`.

## Tarefa 8 — PWA minimo

- `vite-plugin-pwa`: manifest (`name`, `short_name`, icones 192/512, `start_url`, `display:standalone`),
  service worker de offline-shell (app carrega offline e mostra ultimo plano salvo).
- DoD: build gera manifest + SW; Lighthouse/devtools indica instalavel; abrir offline mostra o app.
- Commit: `feat(p0): pwa instalavel + offline-shell`.

## Tarefa 9 — Gate final de P0 e privacidade

- Rodar `npm run lint && npm run test && npm run build` (tudo verde).
- Verificar guardrails: nenhum fetch de rede no codigo P0; nenhum `console.log` com objeto de dominio
  completo; sem token/PII; checklist clean-room ok.
- Atualizar `memory/progress.md` (marcar P0) e `memory/state.md`.
- Commit: `chore(p0): fechar fase P0 (gate verde, privacidade, progresso)`.

---

## Definition of Done da Fase P0

- App PWA instalavel roda sem backend e sem rede.
- Gera plano fixo coerente para 5/15/30/60 por band, com destinos Lichess validos.
- Persiste local (Dexie), exporta JSON e apaga tudo.
- Dominio puro e testado; isolamento de camadas garantido por lint.
- `lint+test+build` verdes. Checklist clean-room cumprido em todas as tarefas.

## Fora de P0 (NAO fazer agora)

Coletor Lichess, detector de fraquezas, feedback/adaptacao, sync, Chess.com, OAuth, engine, renomeacao.
Esses entram em planos proprios (P1, P2, ...), um por vez.

## Confirmacoes do dono

- `band` inicial: **800-1200** (confirmada). Tema fixo de P0 = `fork`.
- short_name do PWA: "Rotina" (provisorio; nao bloqueia).
