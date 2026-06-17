# Relatorio overnight Codex - 2026-06-17

## Resultado

- **Milestone concluido:** M1 - harness E2E com prints.
- **Ponto de parada:** parado em milestone verde antes de abrir M2. M2 ainda nao foi iniciado.
- **Deploy:** nao houve deploy, push, provisionamento de nuvem nem uso de secrets de producao.

## Commits

- `96f3e22` - `M1: amplia harness E2E com prints`

Resumo do commit:

- adiciona helpers Playwright com mocks locais de Chess.com e Lichess;
- cobre 7 perfis de onboarding, Hoje, timer, feedback, Progresso, Configuracoes, backup, OAuth callback, reconciliacao de puzzles e PWA offline;
- gera screenshots em desktop e mobile em `e2e/__screenshots__/`;
- roda smoke Playwright em `pull_request`;
- inclui `@types/node` e expande `tsconfig.node.json` para cobrir tooling/e2e;
- registra decisoes em `DECISIONS.md`, memoria e fontes oficiais.

## Gates executados

- `npm run lint`: verde.
- `npm test`: verde, 72 arquivos de teste, 607 testes.
- `npm run build`: verde (`tsc -b && vite build`).
- `npm run coverage`: verde.
  - Statements: 85.64%.
  - Branches: 80.04%.
  - Functions: 89.95%.
  - Lines: 85.43%.
- `npm run smoke:pwa`: verde, 26 testes Playwright (13 desktop + 13 mobile), 1 worker.
- `npx eslint e2e/**/*.ts playwright.config.ts`: verde.
- `npx tsc -p tsconfig.node.json --noEmit`: verde.

## E2E e screenshots

Total gerado: 78 screenshots JPG, 39 desktop e 39 mobile, em `e2e/__screenshots__/`
(17.772.448 bytes no total).

Familias de caminhos versionados:

- `e2e/__screenshots__/desktop-chromium-onboarding-*.jpg`
- `e2e/__screenshots__/mobile-chromium-onboarding-*.jpg`
- `e2e/__screenshots__/desktop-chromium-hoje-*.jpg`
- `e2e/__screenshots__/mobile-chromium-hoje-*.jpg`
- `e2e/__screenshots__/desktop-chromium-config-*.jpg`
- `e2e/__screenshots__/mobile-chromium-config-*.jpg`
- `e2e/__screenshots__/desktop-chromium-oauth-*.jpg`
- `e2e/__screenshots__/mobile-chromium-oauth-*.jpg`
- `e2e/__screenshots__/desktop-chromium-abre-offline-*.jpg`
- `e2e/__screenshots__/mobile-chromium-abre-offline-*.jpg`

Fluxos jogados/cobertos:

- onboarding com comeco rapido sem conta;
- onboarding configurado sem conta, com avaliacao de entrada;
- onboarding apenas Chess.com com muitos dados;
- onboarding apenas Chess.com com poucos jogos;
- onboarding apenas Lichess sem OAuth;
- onboarding Lichess com OAuth callback;
- onboarding com Lichess + Chess.com;
- Hoje: iniciar bloco, timer, completar, feedback e log em Progresso;
- Hoje: reconciliar puzzles com OAuth;
- Configuracoes: exportar backup, restaurar backup e apagar dados locais;
- OAuth callback: sucesso e cancelamento recuperavel;
- PWA: abrir online, cachear service worker e recarregar offline.

## Bugs corrigidos

- Nenhum bug de produto foi corrigido em M1; o escopo foi reforco de harness e evidencia visual.
- Durante a preparacao do commit, foi corrigida uma falha de integracao do proprio harness: os arquivos
  Playwright/e2e passaram a ser cobertos por `tsconfig.node.json`, e `@types/node` foi adicionado para
  permitir `eslint --fix` + `tsc -b --noEmit` no pre-commit sem excluir o tooling novo.

## DECISIONS.md

Decisoes operacionais registradas:

- **M1 - Screenshots E2E como evidencia gerada:** os prints sao artefatos gerados em
  `e2e/__screenshots__/`, em desktop/mobile, sem transformar M1 em visual-regression bloqueante por
  diff de pixels. Motivo: ainda nao ha politica aprovada de tolerancia, SO/base de imagem ou revisao de
  baseline.
- **M1 - Smoke E2E em PR:** o job `smoke` do GitHub Actions roda tambem em `pull_request` com
  `npm run smoke:pwa`, porque a suite usa mocks locais e protege os fluxos principais antes do merge.

## Pesquisa e fontes oficiais

`docs/research/sources.md` foi atualizado com fontes oficiais usadas para M1:

- Playwright Screenshots: `https://playwright.dev/docs/screenshots`
- Playwright Continuous Integration: `https://playwright.dev/docs/ci`
- GitHub Actions pull_request event:
  `https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request`

## Riscos remanescentes

- Os screenshots de M1 sao evidencia visual versionada, nao baseline de regressao por pixel. Um corte
  futuro ainda precisa definir politica de tolerancia e revisao de baseline se o dono quiser diffs
  bloqueantes.
- M2 ainda precisa ampliar testes unitarios profundos para os hooks, `resourceSelector` e modulos sem
  cobertura citados no roadmap.
- M3 ainda concentra bugs reais conhecidos da auditoria, incluindo `pendingItems.ts`/`addDays` em GMT-3,
  double-count, corrida de sync, `clearAllData` in-flight, `getEvidenceLevel`, `observedAt`, backup 16
  tabelas, migracao e validacao de import.

## Proximo milestone

M2 deve comecar por uma leitura focal do roadmap e do mapa de cobertura atual, depois criar testes
unitarios profundos para:

- os 5 hooks citados no roadmap;
- `resourceSelector`;
- `learningPlanProposal`;
- `getEvidenceLevel`;
- demais modulos ainda abaixo do nivel esperado de cobertura.

Antes de fechar M2, repetir gates completos: `npm run lint`, `npm test`, `npm run build`,
`npm run coverage` e smoke quando UI/PWA for tocado.
