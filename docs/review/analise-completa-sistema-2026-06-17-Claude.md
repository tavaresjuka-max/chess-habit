# Analise Completa do Sistema — Claude

> Lente auxiliar consolidada por Codex a partir da execucao local e do subagente "Claude". Nao houve edicao de codigo de producao.

## 1. Resumo executivo

O sistema esta bem desenhado para a missao pessoal definida pelo dono: reduzir dispersao, transformar sinais de partidas em treino objetivo e manter o usuario em ritmo sem prometer rating. O ponto forte e a coerencia entre governanca, privacidade e produto. O ponto fraco e que algumas partes novas de P4/P5 ainda estao mais decididas no papel do que fechadas na experiencia publica.

**Nota geral: 7,3/10.**

Principais forcas:

- Produto adulto e pratico, com foco em constancia.
- Arquitetura de dominio limpa e testavel.
- Integracoes externas respeitam a regra de APIs oficiais.
- Postura de privacidade forte: sem tokens no backup e sem PGN completo persistido.
- PWA/offline ja possui smoke desktop/mobile.

Principais riscos:

- O metodo de revisao tem bug real de calendario em GMT-3.
- O card principal de treino carrega estado interno para o bloco seguinte.
- Coverage falha e a suite unitária mostrou sensibilidade a ordem/timing.
- Documentacao operacional ainda conflita sobre P4/P5 congeladas/descongeladas.
- Beta publico exige nome, disclaimers, AGPL visivel e contrato E2EE.

O que mais precisa melhorar antes de beta: transformar as decisoes de P5 em superficie publica real, estabilizar gates, e reduzir as races de estado assíncrono.

## 2. Metodologia

Arquivos lidos:

- `AGENTS.md`, `PLANO.md`, `README.md`, `package.json`.
- `memory/state.md`, `memory/decisions.md`, `memory/progress.md`.
- Specs vigentes de 2026-06-08 e 2026-06-10.
- `docs/review/roadmap-beta-2026-06-16.md`.
- `docs/architecture/system.md`, `docs/research/sources.md`.
- Arquivos centrais de `src/domain`, `src/app`, `src/infra`, `src/ui`, `e2e` e configs.

`memory/plano-nota-95-estado.md` nao existe.

Comandos executados na auditoria principal:

- `npm run lint`: passou.
- `npm test`: falhou primeiro, passou depois em full run com 607 testes.
- `npm run build`: passou.
- `npm run coverage`: falhou.
- `npm run smoke:pwa`: falhou por porta ocupada, passou depois com 26/26.

Fluxos manuais testados:

- Primeiro uso.
- Comeco rapido sem dados.
- Aprovacao de plano.
- Hoje.
- Abrir bloco no Lichess.
- Timer.
- Concluir bloco.
- Feedback.
- Progresso.

Viewports:

- Desktop `1280x800`.
- Mobile `390x844`.

Fontes oficiais:

- Lichess API Tips e OpenAPI.
- Chess.com PubAPI Help e Published Data API.
- MDN CSP e Service Worker.
- Cloudflare Workers/D1.
- Vercel project configuration.
- GNU AGPLv3.

Limitacoes:

- OAuth real nao foi testado.
- P4 sync nao existe para teste end-to-end.
- Acessibilidade foi avaliada por leitura e fluxo visual, nao por leitor de tela.

## 3. Notas por area

| Area | Nota | Motivo |
|---|---:|---|
| Produto | 8,3 | Excelente moldura pessoal; precisa fechar o que e publico e o que continua privado. |
| UX | 7,4 | A tela Hoje e forte; bugs de estado e progresso reduzem confianca. |
| Diagnostico | 7,3 | Bom desenho de sinais; risco de concorrencia entre fontes. |
| Plano de treino | 7,5 | Bom envelope de sessao; conclusao/feedback ainda pode ser indevida. |
| Metodo 5 trilhas | 7,8 | Coerente com specs; bug de data e explicabilidade pendentes. |
| Arquitetura | 8,1 | Camadas boas; orquestracao async precisa ficar mais transacional. |
| Codigo TypeScript | 8,0 | Estrito e claro; alguns helpers/strings duplicados. |
| Testes | 6,6 | Ampla suite, mas flake e coverage vermelho pesam. |
| Privacidade | 8,4 | Sem violacao direta; backup/token/PGN bem pensados. |
| Seguranca | 7,4 | PKCE/CSP bons; OAuth storage corrompido e import grande pedem hardening. |
| PWA/offline | 7,5 | Smoke passou apos limpeza de porta; workflow pode melhorar. |
| Integracoes externas | 7,6 | Oficiais e conservadoras; `Retry-After` falta. |
| Performance | 7,2 | Adequada; import Lichess completo pode pesar. |
| Acessibilidade | 6,9 | Promissora, mas sem gate automatizado. |
| Mobile | 7,7 | Bom no fluxo testado. |
| Documentacao | 7,0 | Muito rica, mas conflituosa. |
| Prontidao beta publico | 5,7 | Ainda nao; falta estabilizacao e P5 legal/identidade. |

## 4. Bugs encontrados

### Bugs confirmados

### BUG-1 — Data de pendencia pode saltar um dia em GMT-3

- Severidade: P1
- Status: confirmado
- Area afetada: metodo 5 trilhas, revisao.
- Como reproduzir: `TZ=America/Sao_Paulo`, horario local entre 21h e 23h, chamar `getNextDueDate(0)`.
- Resultado atual: retorna data dois dias a frente do calendario local em alguns horarios.
- Resultado esperado: retornar amanha local.
- Evidencia: probe Node com ISO UTC mostrou `2026-06-17 22:30 BRT` indo para `2026-06-19`.
- Arquivos/linhas relevantes: `src/domain/method/pendingItems.ts:8`, `src/domain/method/pendingItems.ts:18`, `src/domain/method/pendingItems.ts:124`.
- Possivel causa: UTC/local misturados.
- Proposta de solucao: helper unico de data local ou padronizacao UTC documentada.
- Teste recomendado: regressao com `TZ=America/Sao_Paulo`.
- Risco de regressao: medio.

### BUG-2 — `PlanBlockCard` preserva feedback ao trocar `heroBlock`

- Severidade: P1
- Status: confirmado
- Area afetada: UX e logs de treino.
- Como reproduzir: completar bloco 1 com feedback e observar bloco 2 no hero.
- Resultado atual: bloco 2 ja mostra "Como foi o treino?".
- Resultado esperado: bloco 2 aparece em estado inicial.
- Evidencia: screenshots em `tmp/audits/Codex`.
- Arquivos/linhas relevantes: `src/ui/PlanBlockCard.tsx:33`, `src/ui/PlanBlockCard.tsx:133`, `src/ui/Today.tsx:280`.
- Possivel causa: falta de `key={heroBlock.id}` ou reset de state em `block.id`.
- Proposta de solucao: remount/reset do card no hero.
- Teste recomendado: E2E de completar primeiro bloco.
- Risco de regressao: alto.

### BUG-3 — Coverage nao fecha

- Severidade: P1 para beta.
- Status: confirmado.
- Area afetada: QA.
- Como reproduzir: `npm run coverage`.
- Resultado atual: falha em testes de app/UI.
- Resultado esperado: coverage verde ou segregado.
- Evidencia: falhou tambem com timeout maior.
- Arquivos/linhas relevantes: `src/app/preserveProgress.test.tsx`, `src/app/trainingFlow.test.tsx`, `src/app/oauthCallback.test.tsx`.
- Possivel causa: instrumentacao + jsdom/IndexedDB/timing.
- Proposta de solucao: isolar DB e reduzir dependencia de timing real.
- Teste recomendado: coverage repetido em ambiente limpo.
- Risco de regressao: alto.

### BUG-4 — Import de backup aceita arquivo inteiro antes de validar tamanho

- Severidade: P2
- Status: confirmado por codigo.
- Area afetada: dados locais.
- Como reproduzir: escolher arquivo gigante no import.
- Resultado atual: `File.text()` le tudo.
- Resultado esperado: rejeicao por tamanho antes de ler.
- Evidencia: `src/ui/Config.tsx:111`.
- Arquivos/linhas relevantes: `src/ui/Config.tsx:111`, `src/infra/storage/backup.ts:240`.
- Possivel causa: fluxo pessoal sem ameaca de payload grande.
- Proposta de solucao: limite de bytes e migrador.
- Teste recomendado: arquivo grande e versao futura.
- Risco de regressao: baixo/medio.

### BUG-5 — OAuth callback nao tolera storage local corrompido

- Severidade: P3
- Status: confirmado por codigo.
- Area afetada: OAuth.
- Como reproduzir: `sessionStorage` invalido em `lichess-tutor:oauth-pending`.
- Resultado atual: `JSON.parse` pode derrubar o fluxo.
- Resultado esperado: limpar estado e mostrar mensagem recuperavel.
- Evidencia: `src/app/oauthFlow.ts:117`.
- Arquivos/linhas relevantes: `src/app/oauthFlow.ts:110-118`.
- Possivel causa: parse fora de `try/catch`.
- Proposta de solucao: catch + removeItem + `cancelled`.
- Teste recomendado: callback com storage invalido.
- Risco de regressao: baixo.

### Suspeitas

### BUG-6 — Race de diagnostico entre Chess.com e Lichess

- Severidade: P1/P2
- Status: suspeito.
- Area afetada: diagnostico.
- Como reproduzir: duas fontes resolvendo em ordem invertida.
- Resultado atual: cada sync recalcula e grava fraquezas/plano global.
- Resultado esperado: merge atomico.
- Evidencia: `src/app/useDiagnosisActions.ts:128-162`, `src/app/useDiagnosisActions.ts:287-295`.
- Arquivos/linhas relevantes: `src/app/useDiagnosisActions.ts:128`, `src/app/useDiagnosisActions.ts:161`, `src/app/useDiagnosisActions.ts:295`.
- Possivel causa: paralelismo sem mutex.
- Proposta de solucao: singleflight para secao critica.
- Teste recomendado: promises controladas.
- Risco de regressao: alto.

### BUG-7 — Apagar dados durante sync pode repopular estado

- Severidade: P2
- Status: suspeito.
- Area afetada: privacidade.
- Como reproduzir: sync lento + apagar dados antes da resposta.
- Resultado atual: sem cancelamento/epoch evidente.
- Resultado esperado: callbacks antigos invalidados.
- Evidencia: `src/app/useBackupActions.ts:115`.
- Arquivos/linhas relevantes: `src/app/useBackupActions.ts:115`, `src/infra/storage/appData.ts:491`.
- Possivel causa: falta de token de geracao.
- Proposta de solucao: epoch global.
- Teste recomendado: sync com promise controlada.
- Risco de regressao: medio.

## 5. Inconsistencias e conflitos

- P4/P5 descongeladas em `AGENTS.md`; docs antigas ainda dizem congeladas.
- `APP_NAME` pedido no roadmap, mas nao implementado como constante unica.
- README tem AGPL/disclaimer; UI publica ainda nao evidencia ambos.
- `memory/plano-nota-95-estado.md` ausente.
- `npm run coverage` nao bate com expectativa de qualidade para beta.
- O app promete constancia, mas permite feedback em bloco ainda nao treinado pelo bug de estado.

## 6. Simplificacoes possiveis

| O que simplificar | Por que esta complexo | Ganho esperado | Risco | Ordem |
|---|---|---|---|---|
| Datas do metodo | Dois modelos mentais UTC/local | Menos erro de agenda | Medio | 1 |
| Identidade publica | Nome em UI, manifest, backup, docs | P5 mais seguro | Baixo | 2 |
| Diagnostico multi-fonte | Escrita global por fonte | Menos perda silenciosa | Medio | 3 |
| Feedback/card | Estado local sem reset por entidade | UX previsivel | Baixo | 4 |
| Docs vigentes | Historico demais no caminho critico | Menos ambiguidade | Baixo | 5 |

## 7. Melhorias propostas

Melhorias urgentes:

- Corrigir data local.
- Corrigir `PlanBlockCard`.
- Estabilizar coverage.
- Adicionar teste de concorrencia multi-fonte.

Melhorias antes do beta:

- `APP_NAME`, disclaimer, link AGPL/fonte.
- Hardening de backup/import.
- A11y com teclado e axe.
- Contrato E2EE P4.
- Decisao sobre `study:write` just-in-time.

Melhorias pos-beta:

- Melhor UX de erro de rede.
- Painel de integridade local.
- Melhor explicabilidade de diagnostico.

Melhorias opcionais:

- Duracao manual para treino feito fora do app.
- Export de resumo semanal.

## 8. Seguranca e privacidade

Nao encontrei violacao direta das regras inquebraveis.

Tokens ficam locais e fora do backup. Escopos proibidos nao foram encontrados. PGN completo nao aparece persistido; Chess.com e parseado de forma transiente e Lichess games pede `pgnInJson=false`.

O risco maior e futuro: sync E2EE precisa de segredo real do cliente. Criptografia em repouso do D1 nao torna o sistema E2EE. Para P5, tambem e preciso tornar AGPL/disclaimer visiveis na experiencia, nao apenas no README.

## 9. UX real: dores e vantagens

O app ajuda a criar constancia porque reduz decisao e coloca o proximo passo no topo. O diagnostico e bom, mas a confianca precisa ser mais explicita. O plano e acionavel e respeita a regra de treinar no Lichess.

O abandono viria de tres coisas: progresso que nao bate com a acao real, diagnostico que parece opaco, e medo de perder dados locais. O bug de feedback herdado e perigoso justamente porque mina o contrato mental "o app registra o que eu fiz".

## 10. Perguntas, duvidas e respostas

### Perguntas ao dono

1. Beta publico exige sync ou pode ser local-first?
2. Qual sera o nome publico final?
3. O usuario pode marcar treino feito fora do app?
4. `study:write` deve ser consentimento separado?
5. Qual promessa publica de dados/sync pode ser feita sem exagero?

### Duvidas tecnicas

1. Data local ou UTC?
2. Como abortar operacoes em voo?
3. Como migrar backup v1?
4. Como resolver conflito P4?

### Respostas inferidas

- Data local e a melhor resposta para estudo. Confianca: alta.
- Backup manual pode sustentar beta se o texto for honesto. Confianca: media.
- P4 deve excluir tokens e handles locais. Confianca: alta.
- `Rotina` e placeholder. Confianca: alta.

## 11. Plano de acao recomendado

| Acao | Prioridade | Esforco | Impacto | Dependencias | Criterio de pronto |
|---|---|---:|---|---|---|
| Corrigir calendario | P1 | P | Alto | Decisao local/UTC | Teste GMT-3 |
| Corrigir card hero | P1 | P | Alto | Nenhuma | E2E passa |
| Coverage verde | P1 | M | Alto | Test setup | `npm run coverage` |
| Mutex/merge de sync | P1 | M | Alto | Teste controlado | Uniao preservada |
| Epoch em clear/import | P2 | M | Alto | App actions | Sync antigo invalidado |
| Identidade P5 | P2 | P | Alto | Nome | `APP_NAME` unico |
| Legal/AGPL UI | P2 | P | Alto | Copy | Link e disclaimer visiveis |

## 12. Veredito final

O sistema esta saudavel para a ferramenta pessoal. Nao esta pronto para beta publico.

O que impediria beta hoje: data de revisao, bug do card, coverage vermelho, P5 incompleto e sync E2EE indefinido. O proximo corte inteligente e estabilizar o nucleo antes de adicionar mais superficie. A decisao primeira do dono e se o beta espera sync ou se assume publicamente um produto local-first com backup manual.

