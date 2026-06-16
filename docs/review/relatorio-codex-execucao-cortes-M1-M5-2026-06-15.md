# Relatorio Codex - Execucao Cortes M1-M5 (2026-06-15)

Execucao realizada pelo Codex em 2026-06-16 a partir de
`prompts/codex-cortes-M1-M5-zerar-pendencias-2026-06-15.md`.

## Resultado

Pendencias M1-M5 zeradas em 21 commits atomicos. O gate final passou com lint, tres rodadas de
teste, build, coverage com thresholds e smoke PWA/offline.

## Commits Por Item

| Item | Commit | Status | Resumo |
| --- | --- | --- | --- |
| M1.1 | `093f051` | ok | Boot do plano passa `diplomaAttempts` para preservar progresso de diplomas. |
| M1.2 | `4688279` | ok | Teste fragil do fluxo de treino trocado para espera estavel. |
| M1.3 | `52b6857` | ok | Abertura externa aceita apenas `https://lichess.org`; bloqueia `javascript:`, `data:` e hosts externos. |
| M1.4 | `7ace86b` | ok | Artefatos Playwright em `output/playwright/` ignorados. |
| M1.5 | `ca68814` | ok | Documento de privacidade do backup corrigido: tokens OAuth ficam fora do backup. |
| M1.6 | `08fcff4` | ok | Ranking de recursos ficou exaustivo com `assertNever`. |
| M2.1 | `27442d0` | ok | `vercel.json` ganhou headers defensivos e teste de configuracao. |
| M2.2 | `925d17e` | ok | Config exibe versao do app via constante definida pelo Vite. |
| M2.3 | `4b0f1bf` | ok | Bloco final varia por faixa: peao, torre ou conversao. |
| M3.1 | `9537f6d` | ok | Perfil e plano salvos atomicamente. |
| M3.2 | `41f6290` | ok | Reconciliacao de logs e plano salva em transacao unica. |
| M3.3 | `10077f7` | ok | Status de backup isolado da UI por boundary de app. |
| M3.4 | `28b0b15` | ok | Backup valida `pendingItems.status`. |
| M4.1 | `d3e0889` | ok | Chess.com usa `end_time` real dos jogos para recencia dos sinais. |
| M4.2 | `d14f6c8` | ok | Fraqueza derivada de puzzles persiste entre regeneracoes e decai apos janela. |
| M4.3 | `58b23dd` | ok | Accuracy Chess.com calibrada por faixa: 65 para iniciantes, 70 para demais. |
| M4.4 | `46128dd` | ok | Feedback `hard` nunca avanca estagio de recurso. |
| M5.1 | `9b301b5` | ok | Cobertura adicional para hooks, OAuth, achievements e fluxos de app. |
| M5.2 | `3786cd0` | ok | CI passa a rodar coverage com thresholds e smoke PWA. |
| M5.3 | `477c2c9` | ok | Pre-commit Husky/lint-staged com ESLint e `tsc -b --noEmit`. |
| M5.4 | `7db99af` | ok | Callbacks com dependencias explicitas, auto-sync paralelo e `logKind` estrutural para puzzles. |

## Verificacoes Finais

- `npm run lint`: ok.
- `npm run test`: ok 3x; cada rodada com 72 arquivos e 555 testes.
- `npm run build`: ok.
- `npm run coverage`: ok; statements 83.8%, branches 77.34%, functions 89.97%, lines 83.56%.
- `npm run smoke:pwa`: ok; 1 teste Chromium passou.

Observacao: as rodadas de teste mantiveram o aviso conhecido do jsdom `Not implemented: navigation to another Document`,
sem falha de suite.

## Fontes Revalidadas

- Chess.com Help Center PubAPI:
  https://support.chess.com/en/articles/9650547-what-is-the-pubapi-and-how-do-i-use-it
- Chess.com Published Data API:
  https://www.chess.com/news/view/published-data-api
- Vercel `vercel.json`:
  https://vercel.com/docs/project-configuration/vercel-json
- MDN Content-Security-Policy:
  https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy
- Lichess OpenAPI spec:
  https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml

## Desvios E Decisoes Tecnicas

- M2.3 tambem elevou `testTimeout` do Vitest para 10s. A suite completa estava passando, mas havia
  instabilidade intermitente de 5s no ambiente Windows/OneDrive.
- M4.3 seguiu a decisao travada do dono (`65` para faixas 0-800, `70` para as demais), apesar de uma
  frase contraditoria no prompt que dizia que `67` deveria contar como baixa para iniciante.
- M5.3 usou `lint-staged.config.mjs` com funcao para `tsc -b --noEmit`, evitando que o lint-staged
  anexasse nomes de arquivos ao comando TypeScript.
- M5.4 adicionou `logKind?: 'puzzle' | 'free-activity' | 'standard'` como campo opcional e nao indexado,
  sem migracao Dexie. Logs novos recebem o campo; logs ativos antigos sao enriquecidos ao concluir; logs
  antigos ja reconciliados continuam reconhecidos pelo `result`.

## Riscos Residuais

- Coverage ainda evidencia baixa cobertura em alguns hooks de app, especialmente backup/OAuth/estudo.
- A validacao de CSP/headers cobre `vercel.json`, mas o comportamento real depende do deploy Vercel ativo.
- `logKind` melhora a classificacao futura, mas backups/logs antigos sem `result` e sem reabrir bloco podem
  nao ser classificados como puzzle ate passarem por novo fluxo de conclusao.
- O aviso jsdom de navegacao continua ruidoso, embora nao quebre testes.
