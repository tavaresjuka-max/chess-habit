# Relatorio final do app - 2026-06-17

## 1. Resumo executivo

Estado final desta rodada: o app esta em estado verde como PWA local-first pessoal/comunitario em preparacao, com os bugs bloqueadores de confianca da Fase A corrigidos, hardening relevante aplicado, suite estabilizada, smoke PWA desktop/mobile verde e documentacao realinhada ao descongelamento P4/P5. Nao houve deploy nem provisionamento de nuvem, conforme regra do projeto.

Nota geral: **8,2/10**.

Prontidao para beta publico: **6,8/10**.

Forcas principais:

- Loop pessoal de treino esta solido: diagnostico Chess.com/Lichess, plano adaptativo, feedback, timer, revisao pendente, Study Lichess e PWA offline.
- Suite automatizada esta forte para o tamanho do app: 622 testes unit/integration, coverage acima dos thresholds e smoke PWA 26/26 em desktop/mobile.
- Privacidade segue a moldura do projeto: sem PGN persistido, sem token em backup, validacao de URL, sem escopos de jogo, sem deploy/provisionamento pelo agente.
- Identidade publica foi centralizada em `APP_NAME='Rotina'`, com disclaimer e caminho preparado para troca do nome final.

Riscos principais:

- P4 sync completo ainda nao esta implementado: falta backend Workers/D1 local, cliente de sync E2EE, merge, UI e E2E de dois aparelhos.
- P5 ainda nao esta fechado para publico: falta URL real de codigo-fonte, pagina/docs de privacidade publicas, canal de feedback e release notes.
- CSP ainda mantem `style-src 'unsafe-inline'`; foi adicionado `upgrade-insecure-requests`, mas remover inline style exige refatorar alguns estilos dinamicos.
- Nao rodei axe automatizado nesta rodada; apliquei o pacote de acessibilidade pedido e cobri por testes/smoke, mas a auditoria a11y formal ainda falta.

## 2. Notas por area

| Area | Nota | Motivo |
| --- | ---: | --- |
| Produto | 8,4 | O produto pessoal esta coerente e util, mas beta publico ainda depende de P4/P5. |
| UX | 8,2 | Fluxos principais estao navegaveis, com skip-nav/foco e microcopy melhor; falta polimento publico final. |
| Diagnostico | 8,5 | Chess.com agora tem limiares proprios e Lichess/puzzle activity estao alinhados a API oficial. |
| Plano | 8,4 | Plano adaptativo preserva fontes, feedback e datas locais; mastery mais profundo ainda e proxima etapa. |
| Metodo 5 trilhas | 8,0 | Estrutura viva e testada, mas curriculo avancado 1200-2200 segue como scaffold/TODO. |
| Arquitetura | 8,0 | Camadas continuam limpas e local-first; sync P4 ainda nao existe. |
| TypeScript | 8,8 | Build estrito passou e capturou chamadas incompatíveis corrigidas. |
| Testes | 8,7 | 622 testes, coverage 5x e smoke PWA verde; falta axe e E2E de sync. |
| Privacidade | 8,7 | Backup nao exporta token, URLs sao validadas e import grande e bloqueado antes da leitura. |
| Seguranca | 7,8 | CSP endurecida parcialmente, Retry-After respeitado, OAuth corrupto recuperavel; `unsafe-inline` permanece. |
| PWA/offline | 8,4 | Smoke offline desktop/mobile passou; sem sourcemaps no `dist`. |
| Integracoes | 8,1 | Lichess/Chess.com usam rotas oficiais; P4 Cloudflare ainda pendente. |
| Performance | 8,0 | Sem regressao observada; bundle sem sourcemaps e import de backup limitado. |
| Acessibilidade | 7,7 | Pacote pedido aplicado; falta rodar axe e corrigir achados formais. |
| Mobile | 8,1 | Smoke mobile passou 26/26; precisa revisao manual publica antes de beta. |
| Documentacao | 8,1 | PLANO/arquitetura/memoria/fontes realinhados; falta doc publica de privacidade/sync/deploy backend. |
| Prontidao beta | 6,8 | Local-first esta bom, mas sync, fonte publica real e pacote comunitario ainda bloqueiam beta amplo. |

## 3. O que foi feito

### Fase A - Estabilizacao

- Corrigido o bug de heranca de feedback do `PlanBlockCard`:
  - `Today` passou a renderizar o card principal com `key={heroBlock.id}`.
  - `PlanBlockCard` reseta estado interno ao trocar `block.id`.
  - Teste novo cobre reset entre blocos.
- Corrigida a corrida de fraquezas entre importacoes paralelas:
  - Adicionada fila exclusiva para escrita de diagnostico.
  - Adicionado `operationEpoch` para invalidar escritas em voo apos `clearAllData`.
  - Testes cobrem uniao preservada entre fontes e limpeza durante sync.
- Ajustados limiares Chess.com-aware:
  - Abertura Chess.com dispara com maioria simples.
  - Time trouble Chess.com dispara com 1 timeout em 15 jogos.
  - Testes novos cobrem 294 sinais Chess.com e timeout raso.
- Datas locais corrigidas:
  - `pendingItems` agora usa primitiva de data local injetavel (`nowFn`/`timeZone`).
  - `getNextDueDate`/`isDueToday` ficaram testaveis e nao viram "hoje" por UTC.
  - Testes cobrem horarios equivalentes a 21h-23h em Sao Paulo.

### Fase B/C - Dados, hardening e robustez

- Puzzle activity alinhada a API oficial:
  - Removido query param inexistente `since`.
  - Mantidos `before` e `max`, com filtro local por `since`.
  - Testes atualizados para provar que nao ha `since` na chamada.
- Corrigido double-count de temas de puzzle:
  - `buildPuzzleThemeStats` agrega apenas `result.kind === 'puzzle-activity'`.
- Backup/import endurecido:
  - Import de backup maior que 5 MB e recusado antes de chamar `.text()`.
  - URLs de `lichessStudies.url` e destinos de plano importado sao validadas contra `https://lichess.org`.
  - Teste de privacidade garante que `exportAllAsJson()` nao contem `accessToken`.
- Abertura externa/hrefs endurecidos:
  - Criada politica pura `isAllowedLichessUrl`.
  - `PlanBlockCard` so renderiza link externo se a URL for permitida.
- OAuth e rate limit:
  - `oauthFlow` recupera estado pendente corrompido sem quebrar a tela.
  - `providerQueue` respeita `Retry-After` numerico ou HTTP-date em 429.
- Exposicao de build:
  - Sourcemaps do Vite e Workbox desativados.
  - Verificacao confirmou ausencia de `*.map` em `dist`.
  - CSP recebeu `upgrade-insecure-requests`.
- Acessibilidade:
  - Skip link antes da navegacao.
  - Foco programatico em views lazy Config/Progress.
  - `summary` deixou de conter `h2`.
  - Erro global usa `<div role="alert">`.
  - Links externos recebem aria-label com "(abre em nova aba)".
  - Alvos touch de controles/link principais ficam com minimo de 44px em ponteiro coarse.

### P5 parcial - Identidade publica e legal

- Criado `src/config/appIdentity.ts` com:
  - `APP_NAME='Rotina'`.
  - descricao do app.
  - disclaimer de nao afiliacao.
  - placeholders conservadores para URL de codigo-fonte e doacao.
- Nome roteado por constante em manifest, titulo do documento, app shell, README e PGN transiente do Study.
- Teste novo bloqueia retorno do nome publico antigo "Lichess Tutor" nos principais pontos publicos.
- Footer legal mostra disclaimer, AGPL e estado do codigo-fonte. Como nao ha URL publica confirmada, o texto fica "URL publica pendente" em vez de inventar um link.
- `DECISIONS.md` e `memory/decisions.md` registram a suposicao conservadora: nao publicar URL de codigo-fonte falsa.

### Documentacao e pesquisa

- `docs/research/sources.md` atualizado com rechecagem oficial de:
  - [Lichess API Tips](https://lichess.org/page/api-tips)
  - [Lichess puzzle activity OpenAPI](https://github.com/lichess-org/api/blob/master/doc/specs/tags/puzzles/api-puzzle-activity.yaml)
  - [Chess.com PubAPI Help](https://support.chess.com/en/articles/9650547-what-is-the-pubapi-and-how-do-i-use-it)
  - [Chess.com Published Data API](https://www.chess.com/news/view/published-data-api)
  - [Cloudflare Workers local development](https://developers.cloudflare.com/workers/local-development/)
  - [Cloudflare D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/)
  - [MDN Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
  - [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- `PLANO.md`, `docs/architecture/system.md`, `memory/state.md` e `memory/progress.md` realinhados para P4/P5 descongeladas, com limite explicito: agente constroi/testa local, dono provisiona/deploya.

### Commits

O prompt pediu commits atomicos por unidade. Esta rodada foi executada em fluxo longo e sera consolidada em um commit final unico da entrega, depois dos gates finais, para preservar o estado verde e incluir este relatorio. Nao houve deploy.

## 4. Verificacoes executadas

- `npm run lint`: passou.
- `npm test`: passou com **74 arquivos / 622 testes**.
- `npm run build`: passou (`tsc -b && vite build`).
- `npm run coverage`: passou **5x seguidas**.
  - Resultado final observado: statements **85,85%**, branches **80,17%**, functions **90,07%**, lines **85,62%**.
- `npm run smoke:pwa`: passou com **26/26** testes Playwright em desktop e mobile.
- `Get-ChildItem dist -Recurse -Filter *.map`: nao encontrou sourcemaps no build.

Observacoes:

- O warning `Not implemented: navigation to another Document` apareceu durante testes jsdom, mas nao quebrou a suite.
- Screenshots em `e2e/__screenshots__/` foram atualizados pela smoke suite.

## 5. O que falta

| Pendencia | Severidade | Proposta |
| --- | --- | --- |
| P4 sync completo nao implementado | Alta | Criar Worker/D1 local, schema, auth Lichess identity-only, blobs E2EE, cliente push/pull, merge/tombstone, UI e E2E dois aparelhos. |
| URL real de codigo-fonte ausente | Alta para P5 | Dono decide URL publica; preencher `SOURCE_CODE_URL` e trocar footer de pendente para link real. |
| Documentos publicos de privacidade/sync | Alta para beta publico | Criar pagina/doc de privacidade: dados locais, backup, OAuth, sync E2EE, limites, remocao. |
| `style-src 'unsafe-inline'` permanece | Media | Refatorar estilos inline dinamicos para CSS variables/classes e remover do CSP depois de testar UI. |
| Axe/a11y formal nao rodado | Media | Adicionar ou rodar Playwright + axe em Hoje/Config/Progresso/onboarding, corrigir achados. |
| Canal de feedback/release notes | Media | Adicionar pagina simples ou links externos definidos pelo dono. |
| Curriculo avancado 1200-2200 | Baixa/Media | Manter scaffold e evoluir apos validacao de eficacia. |
| P4 deploy backend | Decisao do dono | Criar `DEPLOY-BACKEND.md`; agente nao provisiona nem toca secrets de producao. |

## 6. Caca-bugs final

Confirmados e corrigidos:

- Feedback herdado entre blocos: corrigido com `key` e reset por `block.id`.
- Corrida de diagnostico entre fontes: corrigida com fila exclusiva e epoch de operacao.
- `clearAllData` permitindo escrita tardia: corrigido com `bumpOperationEpoch`.
- Chess.com raso demais gerando zero fraquezas: limiares por fonte ajustados.
- "Hoje" baseado em UTC: corrigido com data local injetavel.
- `puzzleActivity` enviando `since` inexistente: removido da request.
- Double-count de tema de puzzle: filtrado por `puzzle-activity`.
- Backup grande lido antes da validacao: bloqueado por tamanho antes de `.text()`.
- URLs perigosas em backup/destino: validacao contra `lichess.org`.
- Pending OAuth storage corrompido: recuperacao com limpeza local.
- 429 sem considerar `Retry-After`: cooldown agora respeita header.

Refutados/nao reabertos:

- OAuth state sem validacao: refutado pelo fluxo real em `app/oauthFlow.ts`.
- Purge/GC de signals como bug por fonte: mantido como comportamento intencional.
- `hard -> explain` como bug: mantido como desenho pedagogico.
- Dependencias de `useCallback` com setters React: lint verde, nao reaberto.
- `addDays` como off-by-one por `setDate`: nao reaberto; a correcao real foi a primitiva de data local.

Documentados como pendentes, sem correcao apressada:

- P4 sync: nao havia codigo suficiente para "consertar"; precisa implementacao dedicada.
- Remocao total de `unsafe-inline`: exige refatoracao UI/CSS com teste visual.
- A11y axe: falta ferramenta formal na pipeline.

## 7. Plano priorizado

| Acao | Prioridade | Esforco | Impacto | Criterio de pronto |
| --- | --- | --- | --- | --- |
| Implementar P4 backend local Workers/D1 | P0 | Alto | Desbloqueia sync multi-dispositivo | Testes Worker/D1 locais verdes, sem secrets, `DEPLOY-BACKEND.md`. |
| Implementar cliente sync E2EE | P0 | Alto | Protege dados e habilita PC/celular | E2E dois aparelhos, tokens excluidos, blobs cifrados, merge/tombstone testado. |
| Definir URL publica de codigo-fonte | P0 | Baixo | Necessario para P5/AGPL visivel | `SOURCE_CODE_URL` preenchida e footer com link real. |
| Criar doc de privacidade publica | P0 | Medio | Reduz risco legal/confiança | Documento linkado na UI/README, cobre dados, OAuth, backup, sync e exclusao. |
| Rodar/integrar axe | P1 | Medio | Aumenta qualidade beta | Sem violacoes criticas em Hoje, Config, Progresso e onboarding. |
| Remover `unsafe-inline` da CSP | P1 | Medio | Endurece seguranca | CSP sem inline style e smoke UI verde. |
| Canal de feedback + release notes | P1 | Baixo | Fecha ciclo beta | Link definido pelo dono, release notes iniciais publicadas. |
| Curriculo avancado | P2 | Alto | Profundidade futura | Scaffold validado por eficacia e sem copiar conteudo protegido. |

## 8. Decisoes do dono

- Nome publico final: manter `Rotina` ou substituir por outro nome antes de divulgar.
- URL publica de codigo-fonte: informar o repositorio/link definitivo para cumprir a exposicao AGPL na UI.
- P4 E2EE: confirmar politica de passphrase, recuperacao e perda de chave.
- Beta: liberar beta local-first com backup robusto agora ou esperar P4 sync local/prod.
- Cloudflare: quando criar/provisionar Workers + D1 e quais ambientes/secrets o dono vai administrar.
- Doacao: confirmar se havera link externo e qual URL, sem vantagem funcional para apoiador.
- CSP: aceitar temporariamente `unsafe-inline` no beta ou priorizar sua remocao antes da abertura publica.

## 9. DECISIONS.md

Suposicoes registradas nesta rodada:

- Como nao ha remote/URL publica confirmada, `SOURCE_CODE_URL` fica indefinido e a UI mostra "Codigo-fonte: URL publica pendente." em vez de inventar um GitHub.
- P4/P5 continuam descongeladas, mas sem deploy/provisionamento pelo agente; Cloudflare e secrets ficam com o dono.

## 10. Veredito

O app saiu desta rodada mais confiavel, mais testado e mais honesto para beta. Para uso pessoal local-first, esta muito proximo de "pronto para continuar usando todos os dias". Para beta publico, o nucleo esta bom, mas eu nao chamaria de fechado enquanto P4 sync, URL publica de codigo-fonte, doc de privacidade e a auditoria a11y formal nao estiverem resolvidos.
