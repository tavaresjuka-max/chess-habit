# Analise Completa - lichess-tutor (Codex GPT-5, 2026-06-16)

## 0. Sumario executivo

O `lichess-tutor` esta em um bom ponto para ferramenta pessoal: a promessa local-first esta bem refletida na arquitetura, o dominio tem tipos claros, ha 525 testes unitarios/componentes quando a suite recebe timeout adequado, o build PWA passa e o smoke offline passa. A nota global ponderada e **7.7/10**: solido, com dividas claras. O principal freio hoje nao e produto ou visual; e confiabilidade do gate oficial (`npm test`/`coverage`), documentacao contraditoria sobre backup/Study, e alguns endurecimentos de API/privacidade que ficam baratos agora e caros se a P5 for descongelada.

| Area | Peso | Nota | Leitura curta |
|---|---:|---:|---|
| Correcao & Bugs | 10 | 7.0 | Sem bug funcional deterministico confirmado, mas gate oficial falhou. |
| Qualidade de codigo | 7 | 8.0 | TypeScript bom, dominio limpo, pouca sujeira estatica. |
| Arquitetura | 8 | 8.0 | Local-first coerente; docs ainda carregam pendencias ja resolvidas. |
| Dominio / Logica central | 9 | 7.5 | Bom loop Signal -> Weakness -> Plan; validacao externa ainda irregular. |
| Dados & Estado | 8 | 8.0 | Dexie versionado e transacoes boas; backup/documento divergem. |
| Testes & QA | 10 | 7.0 | Volume alto; timeout/coverage quebram confianca do gate. |
| Documentacao & memoria | 6 | 7.0 | Rica, mas ha contradicoes e memorias vencidas. |
| Processo & tooling | 5 | 7.5 | Scripts e CI existem; CI herda flake local. |
| Visual & design | 5 | 8.5 | Identidade forte e primeira tela muito acima de MVP. |
| UX | 6 | 8.0 | Fluxo rapido bom; texto longo pode cansar no mobile. |
| UI | 5 | 8.0 | Responsivo sem overflow; densidade e transparencia pedem contraste continuo. |
| Conteudo & comunicacao | 4 | 8.5 | PT-BR adulto e util; linguagem de hipotese correta. |
| Plataforma & performance | 5 | 8.0 | Build enxuto o bastante; PWA offline validada. |
| Acessibilidade & i18n | 5 | 7.5 | Boa base semantica; beep/audio e axe automatizado faltam. |
| Seguranca & privacidade | 7 | 7.0 | Regras fortes; token local e CSP precisam revisao antes de publico. |
| Build, release & operacao | 5 | 7.0 | Build/smoke bons; coverage e release observability fracos. |

Pesos: dei mais peso a correcao, QA, dominio, dados, privacidade e arquitetura porque este app mede treino pessoal, usa APIs externas e guarda progresso local. Visual pesa menos que confiabilidade, embora esteja bem acima da media.

### 3-5 acertos reais que eu nao mexeria

- **Moldura local-first sem backend** esta coerente no plano e na arquitetura: `PLANO.md:29-37`, `docs/architecture/system.md:5-14`.
- **Nao cria tabuleiro proprio nem sugere lance ao vivo**; o app abre destinos Lichess e separa treino do jogo: `PLANO.md:29-35`, `docs/integrations/lichess.md:55-64`.
- **PWA/offline tem teste real de producao**, nao so expectativa: `package.json:12`, `e2e/pwa-offline.spec.ts:3-6`.
- **Persistencia de log+plano em transacao** evita corrupcao de progresso: `src/infra/storage/appData.ts:77-85`, `src/app/useTrainingActions.ts:133-136`.
- **Tom de produto esta no alvo**: adulto, curto, em PT-BR, com "hipoteses" em vez de promessa de rating: `src/ui/Progress.tsx:55-56`, `src/domain/metrics/efficacyBaseline.ts:4-6`.

## 1. Metodo

Li ou amostrei: `AGENTS.md`, `PLANO.md`, `README.md`, `package.json`, `.github/workflows/ci.yml`, `vite.config.ts`, `vitest.config.ts`, `e2e/pwa-offline.spec.ts`, `src/domain/**`, `src/app/**`, `src/infra/**`, `src/ui/**`, `src/index.css`, `docs/architecture/**`, `docs/integrations/**`, `docs/privacy/privacy-and-data.md`, `docs/research/sources.md`, `memory/state.md` e `memory/progress.md`.

Rodei:

- `npm run lint`: passou.
- `rg -n "TODO|FIXME|any\b|ts-ignore|debugger|console\.log" src public`: achou `TODO` em comentario de `src/infra/chesscom/chesscomClient.ts:69-71` e `any` apenas como palavra em texto de teste.
- `npm test`: falhou na forma oficial, com 3 falhas/525 testes. Falhas em `src/domain/index.test.ts:4-5`, `src/app/trainingFlow.test.tsx:55-76` e `src/app/trainingFlow.test.tsx:395-419`.
- `npx vitest run --testTimeout=15000`: passou, 64 arquivos e 525 testes.
- `npm run build`: passou; build PWA gerou precache com 75 entradas e cerca de 1.73 MiB.
- `npm run smoke:pwa`: passou, 1 teste Playwright.
- `npm run coverage`: falhou; tambem falhou com `--testTimeout=15000`, com erro de arquivo temporario em `coverage/.tmp`.
- `npm audit --omit=dev` e `npm audit`: 0 vulnerabilidades.
- `npm ls --depth=0`: lista dependencias e aponta `@img/sharp-wasm32` e `tslib` como `extraneous`.
- Browser visual: Browser integrado nao anexou a tempo; fallback Playwright local abriu preview em desktop 1366x900 e mobile 390x844. Primeira tela, Hoje, Progresso e Config nao tiveram erros de console nem overflow horizontal. Artefatos: `output/playwright/codex-gpt5-audit-2026-06-16-*.png` e `output/playwright/codex-gpt5-audit-2026-06-16-flows.json`.

Fontes oficiais reconsultadas e registradas em `docs/research/sources.md`: Lichess API Tips, Lichess games export, Lichess OAuth PKCE, Lichess Study, Chess.com PubAPI/Published Data API e MDN PWA installability. Principais implicacoes: Lichess pede uma requisicao por vez e 1 minuto apos 429; export de jogos pode ser muito longo; Chess.com recomenda acesso serial, cache/ETag e user-agent identificavel; PWA instalavel precisa manifest, icones, `start_url`, `display` e HTTPS/localhost/loopback.

## 2. Correcao & Bugs - 7.0

**Bom:** nao encontrei um bug funcional deterministico no uso basico. Build e smoke offline passaram. Os testes que falharam no gate oficial passam isolados ou com timeout maior, sugerindo fragilidade de suite mais que regra quebrada.

**Fraco:** o comando oficial `npm test` falhou, e o CI usa exatamente esse comando: `package.json:10`, `.github/workflows/ci.yml:20-22`. O criterio de pronto exige gate verde: `PLANO.md:77-80`.

**Solucao:** configurar `testTimeout` em `vitest.config.ts:8-29` para 10-15s ou isolar os testes React lentos; depois investigar os avisos `Not implemented: navigation to another Document` ligados a navegacao/window em `src/app/trainingFlow.test.tsx:55-76`.

**Alternativa pesquisada:** manter timeout global baixo e marcar apenas testes de fluxo App com timeout local; e mais preciso, mas exige tocar varios testes.

**Pergunta:** para o dono, o gate aceitavel e "rapido sempre" ou "mais lento, mas menos falso-vermelho"?

## 3. Qualidade de codigo - 8.0

**Bom:** dominio tipado e separado de React; `SourceId`, `WeaknessTag`, `Signal`, `DailyPlan`, `TrainingLog` e OAuth scopes estao explicitos em `src/domain/types.ts:3-113`. `assertNever` e tipos discriminados reduzem estados impossiveis.

**Fraco:** ha cast de JSON externo sem parser em Chess.com: `src/infra/chesscom/chesscomClient.ts:111-112`. Em contraste, Lichess Puzzle Dashboard valida shape antes de retornar: `src/infra/lichess/puzzleDashboard.ts:116-175`.

**Solucao:** adicionar parsers leves para `ChesscomStatsResponse`, `ChesscomArchivesResponse` e monthly games, ou ao menos guardar erro contextual por endpoint.

**Alternativa pesquisada:** usar Zod/Valibot so na fronteira de rede. Custa dependencia e bundle, mas corta uma classe inteira de "API mudou e virou undefined silencioso".

**Pergunta:** vale adicionar uma dependencia de schema para bordas externas, ou manter parsers manuais pequenos?

## 4. Arquitetura - 8.0

**Bom:** a arquitetura atual esta clara: React/Vite/TS, PWA local-first, Dexie, APIs oficiais, sem backend agora: `docs/architecture/system.md:5-14`. `src/ui/App.tsx:11-14` faz code-split de Config/Progresso, mantendo Hoje no chunk principal.

**Fraco:** `docs/architecture/system.md:89-100` lista como pendente fila/cooldown central, smoke PWA e validacao de backup, mas o codigo ja implementa parte disso: `src/infra/http/providerQueue.ts:3-49`, `e2e/pwa-offline.spec.ts:3-6`, `src/infra/storage/backup.ts:125-228`.

**Solucao:** atualizar a secao de pendencias para separar "feito" de "ainda falta": `Retry-After`/progresso/cancelamento de import, coverage estavel, ledger de assets.

**Alternativa pesquisada:** manter pendencias historicas, mas mover para "resolvido em..." com data. Menos risco de apagar contexto.

**Pergunta:** docs de arquitetura devem ser estado vivo ou tambem conservar backlog historico?

## 5. Dominio / Logica central - 7.5

**Bom:** o gerador respeita tempo, pendencias, sinais recentes e trilha ativa: `src/domain/plan/generatePlan.ts:64-134`, `src/domain/plan/generatePlan.ts:248-279`. O selector de recursos usa estagio, banda, tempo, historico e replay: `src/domain/sources/resourceSelector.ts:73-95`, `src/domain/sources/resourceSelector.ts:136-184`.

**Fraco:** o metodo de mastery ainda e heuristico simples: 80/50% e volume minimo de 3 tentativas: `src/domain/method/mastery.ts:19-35`, `src/domain/method/mastery.ts:46-58`. E correto para pessoal/MVP, mas nao e calibracao psicometrica.

**Solucao:** manter heuristica, mas marcar explicitamente no codigo/UI que e regra operacional, nao medicao robusta. Para P5, trocar por modelo com incerteza por tema.

**Alternativa pesquisada:** Glicko/Bayesian Knowledge Tracing. Melhor para escala, exagero para a ferramenta pessoal neste momento.

**Pergunta:** o proximo marco quer melhorar eficacia real ou apenas estabilizar o uso diario do dono?

## 6. Dados & Estado - 8.0

**Bom:** Dexie tem versoes claras ate v11: `src/infra/storage/db.ts:117-197`. Escritas criticas usam `await` e transacoes: `src/infra/storage/appData.ts:77-85`, `src/infra/storage/appData.ts:313-357`, `src/infra/storage/appData.ts:400-472`.

**Fraco:** a documentacao de privacidade diz que o backup nao exporta links de Study: `docs/privacy/privacy-and-data.md:48-52`. O codigo exporta `lichessStudies`: `src/infra/storage/appData.ts:329-345`.

**Solucao:** decidir se Study link e dado duravel exportavel. Se sim, corrigir a doc; se nao, remover de `exportAllAsJson` e ajustar testes.

**Alternativa pesquisada:** exportar Study links com checkbox "incluir links Lichess", desligado por padrao. Mais UX, menos surpresa.

**Pergunta:** o link/id do Study do dia e parte do progresso pessoal ou deve ficar fora do backup por privacidade?

## 7. Testes & QA - 7.0

**Bom:** ha 64 arquivos de teste em `src`, 525 testes passando com timeout 15s, e e2e PWA real. A cobertura funcional toca dominio, storage, UI e fluxos App.

**Fraco:** `npm run coverage` falha e ainda nao ha threshold bloqueante: `vitest.config.ts:16-28`. O comando oficial `npm test` e CI podem falhar por timeout em maquinas mais lentas.

**Solucao:** estabilizar timeout/isolamento primeiro; depois adicionar threshold por camada, com alvo inicial modesto para dominio e storage. Nao bloquear UI inteira de cara.

**Alternativa pesquisada:** usar coverage so como relatorio manual. Menos atrito, mas perde o papel de gate.

**Pergunta:** cobertura deve virar gate agora ou so depois de matar os flakes?

## 8. Documentacao & Memoria - 7.0

**Bom:** o projeto tem `AGENTS.md`, ADRs, specs, plano, docs de integracao e fontes. Isso e raro e valioso. `PLANO.md:43-52` deixa fases e congelamentos claros.

**Fraco:** existem contradicoes: privacidade x backup de Studies, arquitetura com pendencias ja implementadas, e `docs/architecture/interfaces.md:7-18` ainda mostra tipos futuros com bandas antigas.

**Solucao:** fazer um "doc sweep" curto: privacidade, arquitetura/system, interfaces planejadas, memory/progress. Nao mexer no roadmap de fase.

**Alternativa pesquisada:** criar `docs/architecture/as-built.md` e deixar `interfaces.md` como futuro. Mais claro para agentes.

**Pergunta:** o dono prefere docs historicas separadas de docs "estado atual", ou uma pagina viva com notas datadas?

## 9. Processo & Tooling - 7.5

**Bom:** scripts principais estao simples: `package.json:6-13`. CI existe e roda lint/test/build: `.github/workflows/ci.yml:1-22`. `npm audit` retornou 0 vulnerabilidades.

**Fraco:** `npm ls --depth=0` apontou `@img/sharp-wasm32` e `tslib` extraneous; baixo risco, mas sinal de `node_modules`/lock com sobra local.

**Solucao:** validar em `npm ci` limpo; se extraneous sumir, ignorar. Se persistir, revisar `package-lock.json`.

**Alternativa pesquisada:** adicionar `npm ci && npm ls --depth=0` a um check local eventual, nao ao CI principal.

**Pergunta:** vale priorizar higiene de lock agora ou so antes de PR publico?

## 10. Visual & Design - 8.5

**Bom:** a identidade visual e consistente e memoravel. Tokens de cor, tipografia e fundo estao centralizados: `src/index.css:9-110`. A primeira tela em desktop/mobile ficou polida nos screenshots Playwright.

**Fraco:** em mobile, a combinacao de glass/transparencia, textura e texto longo pode reduzir conforto de leitura em blocos extensos, mesmo sem overflow. A tela Hoje tem conteudo didatico denso no primeiro bloco.

**Solucao:** manter a direcao visual, mas usar mais recolhimento progressivo para explicacoes longas ou aumentar opacidade em cards com texto corrido.

**Alternativa pesquisada:** tema "operacional" mais seco para uso diario. Ganha leitura, perde personalidade.

**Pergunta:** o app deve priorizar "gabinete premium" tambem no uso repetido, ou pode ficar mais denso depois do onboarding?

## 11. UX - 8.0

**Bom:** o funil rapido leva de boas-vindas a Hoje em poucos cliques. `src/ui/Onboarding.tsx:39-67` esconde abas ate terminar, reduzindo ruido inicial. A tela Hoje poe o proximo passo no topo: `src/ui/Today.tsx:272-294`.

**Fraco:** o fluxo de atualizacao de historico completo pode ser longo e nao vi cancelamento/progresso por mes. Chess.com full history e intencional, mas `src/infra/chesscom/chesscomClient.ts:47-63` pode demorar em contas grandes.

**Solucao:** mostrar progresso "mes X/Y", permitir cancelar import manual e persistir status parcial seguro.

**Alternativa pesquisada:** usar filtro de recencia opt-in (`filterRecentArchives`) para diagnostico rapido inicial e full import manual depois.

**Pergunta:** primeiro uso deve priorizar diagnostico completo ou primeiro valor em ate 30-60 segundos?

## 12. UI - 8.0

**Bom:** navegacao tem `aria-current`, botoes com icones, foco visual e alvos de toque. `src/ui/App.tsx:137-175`, `src/index.css:273-366`, `src/index.css:2359-2465`. Playwright confirmou sem overflow horizontal em Hoje/Progresso/Config desktop e mobile.

**Fraco:** Progresso vazio e Config estao bons, mas Hoje concentra muita informacao vertical no mobile. Nao e bug; e custo de densidade.

**Solucao:** testar uma variante com resumo compacto do bloco e detalhes em dobra dentro do card.

**Alternativa pesquisada:** manter como esta ate o dono usar por uma semana; UX real supera opiniao estetica aqui.

**Pergunta:** no celular, o dono prefere ver a explicacao completa antes do botao ou o botao primeiro com detalhes recolhidos?

## 13. Conteudo & Comunicacao - 8.5

**Bom:** microcopy e adulto, pratico e sem prometer rating. Exemplos: "Organiza o curso - nao e nota" em `src/ui/Config.tsx:176-180`, "Medem o metodo, nao voce" em `src/ui/Progress.tsx:225`.

**Fraco:** o comentario de `src/infra/chesscom/chesscomClient.ts:69-71` usa "TODO" em texto, o que polui varreduras futuras. Pequeno, mas bate contra a memoria que dizia varredura sem TODO.

**Solucao:** trocar "le TODO o historico" por "le todo o historico" ou "le o historico completo".

**Alternativa pesquisada:** excluir comentarios de varredura. Eu prefiro corrigir a palavra.

**Pergunta:** o tom Professor Lemos deve ficar mais seco no uso diario para reduzir leitura repetida?

## 14. Plataforma & Performance - 8.0

**Bom:** build passou e chunks estao razoaveis: `vite.config.ts:57-80` separa React, Dexie e icones. PWA manifest tem nome, idioma, display e icones: `vite.config.ts:21-50`. MDN confirma manifest, icones 192/512, start_url e display como requisitos importantes de instalabilidade.

**Fraco:** nao rodei Lighthouse. Tambem nao medi tempo de cold start em aparelho real ou 3G.

**Solucao:** adicionar um smoke de performance leve: tamanho de build, first contentful visual manual em mobile, e Lighthouse/PWA eventual.

**Alternativa pesquisada:** usar apenas build size como proxy. Barato, mas nao pega jank real.

**Pergunta:** alvo de performance e "abre bem no celular do dono" ou precisa criterio numerico?

## 15. Acessibilidade & Internacionalizacao - 7.5

**Bom:** `html lang="pt-BR"` existe: `index.html:2`; foco visual existe: `src/index.css:362-366`; movimento reduzido existe: `src/index.css:2007-2013`; UI usa labels, `aria-live`, `role=progressbar` e texto acessivel: `src/ui/Today.tsx:232-244`, `src/ui/Progress.tsx:103-118`.

**Fraco:** o beep do timer nao consulta preferencia de movimento/audio e toca via Web Audio quando o tempo acaba: `src/ui/Today.tsx:139-142`, `src/ui/Today.tsx:722-744`.

**Solucao:** adicionar preferencia "Som do timer" ou respeitar `matchMedia('(prefers-reduced-motion: reduce)')` tambem para audio, alem de manter aviso visual.

**Alternativa pesquisada:** usar vibracao/notification opt-in. Exige permissoes e aumenta escopo.

**Pergunta:** o dono quer som por padrao ou prefere timer silencioso com destaque visual?

## 16. Seguranca & Privacidade - 7.0

**Bom:** OAuth scopes estao allowlisted: `src/infra/lichess/oauth.ts:22-24`; PKCE gera `state` e `codeVerifier`: `src/infra/lichess/oauth.ts:30-43`; callback valida `state`: `src/app/oauthFlow.ts:64-72`. Backup nao exporta token OAuth: `src/infra/storage/appData.ts:313-357`.

**Fraco:** token Lichess fica em IndexedDB local em claro: `src/infra/storage/db.ts:41-43`, `src/infra/storage/appData.ts:188-207`. Para ferramenta pessoal isso e aceitavel; para P5 precisa CSP, threat model e talvez alternativa de token curto/sem persistencia.

**Solucao:** antes de P5, adicionar CSP no deploy, revisar XSS, documentar risco local, e oferecer "desconectar" claro. No pessoal, manter simples.

**Alternativa pesquisada:** backend com token HTTP-only. Melhor seguranca, mas viola fase atual/local-first e esta congelado.

**Pergunta:** OAuth deve continuar persistente no dispositivo ou expirar/requerer reconexao por seguranca?

## 17. Build, Release & Operacao - 7.0

**Bom:** CI existe e e simples. PWA smoke separado evita misturar Playwright com Vitest: `playwright.config.ts:3-23`. `npm run smoke:pwa` passou.

**Fraco:** se `npm test` falha localmente com timeout, CI tambem pode falhar. Nao ha rollback/telemetria porque nao ha backend, o que e aceitavel para pessoal, mas limita operacao publica.

**Solucao:** estabilizar `npm test` oficial antes de qualquer merge importante; adicionar `smoke:pwa` ao CI so quando runtime ficar aceitavel.

**Alternativa pesquisada:** manter smoke PWA manual por enquanto. Bom compromisso ate o gate unitario estabilizar.

**Pergunta:** o proximo fechamento deve exigir `smoke:pwa` em CI ou continuar manual?

## 18. Fair play, API e licencas - 8.0

**Bom:** docs proibem scraping, Board/Bot/Challenge API e ajuda em partida viva: `AGENTS.md:15-30`, `docs/integrations/lichess.md:55-64`. Codigo usa endpoints oficiais e parametros que evitam PGN completo no Lichess: `src/infra/lichess/games.ts:176-193`.

**Fraco:** Chess.com recomenda user-agent identificavel para apps; browser fetch nao permite setar `User-Agent`, e `src/infra/chesscom/chesscomClient.ts:96-101` envia apenas `Accept`. Para uso pessoal isso e baixo risco; para comunidade, pode ser problema operacional.

**Solucao:** documentar impossibilidade no client-only e, se P5 exigir escala, avaliar proxy aprovado pelo dono com rate limit e privacy review.

**Alternativa pesquisada:** continuar client-only e serial. Melhor para privacidade, pior para contato/controle de rate limit.

**Pergunta:** P5 deve manter Chess.com direto do browser ou so via proxy auditado?

## Top 5 riscos

| Risco | Severidade | Esforco | Mitigacao |
|---|---|---:|---|
| Gate oficial `npm test` vermelho/flaky | Alto | P | Ajustar timeout/isolar testes React e re-rodar CI. |
| Coverage quebrado e sem baseline confiavel | Medio | P/M | Corrigir coverage tmp/falhas, rodar com worker unico se necessario. |
| Doc de privacidade contradiz backup de `lichessStudies` | Alto | P | Decidir regra e alinhar doc/codigo/teste. |
| Full import de historico pode travar UX sem progresso/cancelamento | Medio | M | Progresso por mes, cancelamento e mensagens de duracao. |
| Token OAuth local em claro sem CSP documentada | Medio agora, Alto em P5 | M | CSP, threat model, docs e opcao de desconectar/nao persistir. |

## Top 10 quick wins

1. Definir `testTimeout: 15000` ou timeout local para fluxos App.
2. Corrigir comentario `le TODO o historico` para nao sujar varredura.
3. Atualizar `docs/privacy/privacy-and-data.md` sobre export de Study links.
4. Atualizar `docs/architecture/system.md:89-100` separando pendencias resolvidas.
5. Adicionar preferencia ou guard para beep do timer.
6. Re-rodar coverage com worker unico/timeout e registrar resultado.
7. Criar teste pequeno para `exportAllAsJson` confirmando se `lichessStudies` entra ou nao.
8. Adicionar nota de "import completo pode demorar" quando Chess.com/Lichess manual puxar tudo.
9. Limpar dependencias extraneous em ambiente limpo (`npm ci`).
10. Adicionar axe/Playwright a11y smoke simples para Hoje/Config.

## Divida tecnica priorizada

1. **Confiabilidade de gate:** `npm test` e coverage precisam ser previsiveis antes de qualquer nova fase.
2. **Contratos de API:** parsers/guards para Chess.com e respostas Lichess ainda castadas.
3. **Docs vivas:** privacidade/arquitetura/interfaces precisam refletir as-built.
4. **Operacao de import:** progresso/cancelamento/backoff mais visivel.
5. **Privacidade P5-ready:** CSP, token story, ledger de assets e disclaimers publicos.

## Roadmap sugerido ate o proximo marco

1. **Corte QA curto:** estabilizar `npm test`, coverage e CI. Sem UX nova.
2. **Corte doc/privacidade:** resolver Study links no backup, arquitetura pendente/resolvida, fontes 2026-06-16.
3. **Corte import resiliente:** progresso, cancelamento e mensagens para import completo.
4. **Corte a11y sonoro:** preferencia de som/timer, axe smoke, contraste dos cards longos.
5. **Corte P5-prep apenas documental:** ledger de assets e checklist de renomeacao/disclaimer, sem abrir P5.

## O que NAO fazer

- Nao adicionar backend/proxy agora so por causa de user-agent Chess.com; P4/P5 estao congeladas.
- Nao trocar Dexie/local-first por sync antes do dono descongelar P4.
- Nao adicionar engine, tabuleiro proprio ou qualquer ajuda durante partida viva.
- Nao transformar visual em landing page; o app ja acerta sendo ferramenta.
- Nao subir complexidade de mastery antes de corrigir gate e dados basicos.

## Perguntas abertas ao dono do produto

1. O link/id de Study deve entrar no backup ou ficar fora por privacidade?
2. O primeiro diagnostico deve priorizar historico completo ou resposta rapida?
3. O som do timer deve ser padrao, opt-in ou desligado quando houver preferencia de movimento reduzido?
4. Qual e o "pronto" do proximo marco: gate verde, uso diario sem friccao, ou nova capacidade?
5. Antes de P5, o app deve manter API Chess.com direto do browser ou aceitar proxy auditado?

## Apendice - achados com file:line

| ID | Tipo | Severidade | Confianca | Evidencia | O que quebra / risco | Fix sugerido |
|---|---|---|---|---|---|---|
| A1 | Fato | Alto | Alta | `package.json:10`, `.github/workflows/ci.yml:20-22`, `src/app/trainingFlow.test.tsx:55-76`, `src/domain/index.test.ts:4-5` | Gate oficial falhou localmente; CI usa o mesmo comando. | Configurar timeout/isolar testes e revalidar `npm test`. |
| A2 | Fato | Medio | Alta | `package.json:11`, `vitest.config.ts:16-28` | `npm run coverage` falha e nao entrega baseline. | Corrigir falhas/worker/tmp dir; depois adicionar threshold gradual. |
| A3 | Fato | Alto | Alta | `docs/privacy/privacy-and-data.md:48-52`, `src/infra/storage/appData.ts:329-345` | Usuario pode achar que Study links nao entram no backup, mas entram. | Decidir regra e alinhar doc/codigo/testes. |
| A4 | Fato | Medio | Alta | `src/infra/chesscom/chesscomClient.ts:111-112`, `src/infra/lichess/puzzleDashboard.ts:116-175` | Contratos externos tem validacao desigual. | Adicionar parser/guards para Chess.com. |
| A5 | Fato | Medio | Alta | `src/infra/chesscom/chesscomClient.ts:47-63`, fonte Lichess games export consultada | Import completo pode ser longo e sem progresso/cancelamento. | Progresso por arquivo/mes e cancelar import. |
| A6 | Fato | Baixo/Medio | Alta | `src/ui/Today.tsx:139-142`, `src/ui/Today.tsx:722-744`, `src/index.css:2007-2013` | CSS reduz movimento, mas audio do timer nao respeita preferencia. | Guard por preferencia de som/reduced-motion. |
| A7 | Fato | Medio | Media | `src/infra/storage/db.ts:41-43`, `src/infra/storage/appData.ts:188-207`, `index.html:3-10` | Token fica local em claro; nao vi CSP no HTML fonte. | Threat model, CSP no deploy, opcao de nao persistir. |
| A8 | Fato | Baixo/Medio | Alta | `docs/architecture/system.md:89-100`, `src/infra/http/providerQueue.ts:3-49`, `e2e/pwa-offline.spec.ts:3-6` | Docs indicam pendencias que ja foram parcialmente resolvidas. | Atualizar secao de pendencias. |
| A9 | Fato | Baixo | Alta | `package.json:24-40` sem axe, `src/index.css:362-366` | A11y depende de revisao manual; foco existe, mas sem smoke automatizado. | Adicionar axe/Playwright leve. |
| A10 | Fato | Baixo | Media | `npm ls --depth=0` | `@img/sharp-wasm32` e `tslib` extraneous no ambiente local. | Validar em `npm ci` limpo. |
| A11 | Fato | Baixo | Alta | tentativa Browser integrada nesta auditoria | Browser integrado nao anexou; Playwright local funcionou. | Nao e bug do app; manter Playwright como fallback. |
| A12 | Opiniao baseada em evidencia | Medio | Media | `src/ui/Today.tsx:272-294`, screenshots mobile | Card principal e longo no mobile; sem overflow, mas leitura pesa. | Testar detalhes recolhidos no card. |

## Checklist de metodo

- [x] Li modulos nucleo e amostra de cada camada.
- [x] Rodei lint/test/build e reportei falhas reais.
- [x] Rodei smoke PWA e browser desktop/mobile via Playwright.
- [x] Cada area tem nota, acerto, falta, solucao, alternativa e pergunta.
- [x] Achados factuais tem `file:line`, severidade e confianca.
- [x] Separei fato, opiniao e hipotese nos achados relevantes.
- [x] Tabela-resumo, nota global, roadmap e perguntas ao dono incluidos.
- [x] Salvo em `docs/review/analise_completa_codex-gpt-5_2026-06-16.md`.
