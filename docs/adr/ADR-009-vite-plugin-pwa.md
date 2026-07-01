# ADR-009: vite-plugin-pwa Para O App-Shell Offline

## Status

Aceito (2026-07-01, registro retroativo da decisao ja vigente em codigo). Formaliza a escolha
usada desde P0/P2; nenhuma mudanca de implementacao acompanha este ADR.

## Contexto

O app e uma PWA local-first: precisa abrir e funcionar **offline** (o dono treina no celular,
nem sempre com rede), instalar na tela inicial e atualizar sem loja de apps. Isso exige service
worker com precache do app-shell, `manifest.webmanifest` e uma estrategia de atualizacao. A
alternativa seria escrever o service worker a mao (mais controle, muito mais manutencao) ou nao
ter offline (inaceitavel para a rotina do dono).

## Decisao

Usar **`vite-plugin-pwa`** (Workbox `generateSW`) integrado ao build do Vite. Config em
`vite.config.ts:15-61` (`pwaOptions`):

- **`registerType: 'prompt'`** — um `ReloadPrompt` avisa que ha versao nova e aplica na hora, em
  vez do `autoUpdate` silencioso que so pegava na segunda reabertura.
- **`injectRegister: 'script-defer'`** — registro do SW sem bloquear o carregamento.
- **Precache do app-shell** (`workbox.globPatterns`): `.js/.css/.html/.ico/.png/.svg/.webp/.webmanifest`
  + os subsets **latinos** das fontes Inter e Fraunces (`*-latin-wght-normal-*.woff2`). As artes
  `.webp` (persona Tavarez, molduras, texturas, selos) entram no precache para o app abrir **inteiro**
  offline. Os demais subsets de fonte (cirilico/grego/latin-ext) chegam por `unicode-range` sob demanda.
- **`navigateFallback: 'index.html'`** — fallback de SPA para navegacao offline.
- **`sourcemap: false`** no service worker.
- **Manifest** (`display: 'standalone'`, `lang: 'pt-BR'`, `background_color: #f5f3ec`,
  `theme_color: #1f3f36`): icones `192`, `512` e `512 maskable` (Android 8+), servidos de `public/`.

Versoes fixadas em `package.json`: **`vite-plugin-pwa` 1.3.0**, **`vite` 8.0.16**.

## Consequencias

- **Melhora:** offline completo (app-shell + artes precacheadas, ~81 entradas / ~3.3 MB no
  `generateSW`); atualizacao previsivel via prompt; instalavel; zero manutencao de SW escrito a mao.
- **Trava de regressao:** `src/pwaConfig.test.ts` valida a config (presenca do plugin, `globPatterns`
  com `.webp`, `navigateFallback`, `sourcemap:false`, manifest/icones, e a whitelist de `connect-src`
  do CSP: `lichess.org`, `api.chess.com`, `api.lichess.org`, worker de sync). Mudar a config sem
  atualizar o teste quebra o gate.
- **Piora/risco:** o precache de `.webp` infla o bundle offline conforme as artes crescem — se o total
  passar de alguns MB, revisar quais assets entram no precache vs. cache sob demanda. Fontes nao-latinas
  dependem de rede na primeira vez (aceitavel: UI e pt-BR).

## Fontes

- `vite.config.ts:15-61` (`pwaOptions`)
- `src/pwaConfig.test.ts` (gate da config)
- `package.json` (devDependencies: `vite`, `vite-plugin-pwa`)
- Relacionado: ADR-003 (Lichess-first PWA + sync)
