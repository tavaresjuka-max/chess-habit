# Analise Completa do Sistema — Codex

> Auditoria executada em 2026-06-17 no workspace local. Nao houve correcao em codigo de producao.
> Scripts e evidencias exploratorias desta lente: `tmp/audits/Codex/`.

## 1. Resumo executivo

O `lichess-tutor` esta saudavel como ferramenta pessoal local-first: arquitetura em camadas, dominio testavel, UI coerente, PWA funcional, privacidade bem tratada e produto com proposta clara. Ele ja ajuda o usuario a responder "o que treino hoje?" sem criar tabuleiro proprio, sem scraping e sem ajuda durante partida ao vivo.

**Nota geral: 7,4/10.**

Principais forcas:

- Direcao de produto forte: diagnostico real, plano curto, constancia e destino externo no Lichess.
- Separacao boa entre `domain`, `app`, `infra` e `ui`.
- Gates principais recuperados: `lint`, `test`, `build` e `smoke:pwa` ficaram verdes ao fim da rodada.
- Privacidade consistente: token OAuth fora do backup, PGN transiente, sem escopos proibidos encontrados.
- Mobile e desktop funcionam bem no fluxo manual de primeiro uso.

Principais riscos:

- `npm run coverage` esta vermelho e alguns testes unitarios mostraram flakiness antes de passar.
- Bug confirmado de calendario em `pendingItems.ts` em GMT-3.
- Bug confirmado de estado no `PlanBlockCard`: o proximo bloco herda o modo de feedback.
- P4/P5 estao descongelados, mas identidade publica, disclaimers, AGPL visivel e sync E2EE ainda nao estao prontos.
- Concorrencia de sync/clear e hardening de backup/import ainda pedem testes.

Antes de beta publico, o mais importante e estabilizar QA, corrigir datas e estado do card, centralizar `APP_NAME`, expor licenca/disclaimer na UI publica, e escrever o contrato de sync E2EE sem ambiguidade.

## 2. Metodologia

Arquivos lidos:

- `AGENTS.md`
- `PLANO.md`
- `package.json`
- `memory/state.md`
- `memory/decisions.md`
- `memory/progress.md`
- `docs/superpowers/specs/2026-06-08-professor-lemos-tutor-design.md`
- `docs/superpowers/specs/2026-06-10-metodo-5-trilhas-design.md`
- `docs/review/roadmap-beta-2026-06-16.md`
- `docs/research/sources.md`
- `docs/architecture/system.md`
- Estrutura principal de `src/`, `e2e/`, configs Vite/Vitest/Playwright/Vercel e testes.

Observacao: `memory/plano-nota-95-estado.md` e citado em `AGENTS.md`, mas nao existe neste checkout.

Comandos executados:

- `npm run lint`: passou.
- `npm test`: primeira execucao falhou em 4 testes; os arquivos falhos passaram isolados; a segunda execucao completa passou com 72 arquivos e 607 testes.
- `npm run build`: passou (`tsc -b && vite build`).
- `npm run coverage`: falhou; tambem falhou com `--testTimeout=30000`.
- `npm run smoke:pwa`: falhou inicialmente por porta `127.0.0.1:4188` ocupada por Vite preview antigo; apos encerrar o processo orfao, passou com 26/26 testes.
- Script manual `node tmp/audits/Codex/manual-ui-audit.mjs`: passou em desktop e mobile, gerando screenshots exploratorias.

Fluxos manuais testados:

- Primeiro uso.
- Usuario sem dados.
- Comecar rapido.
- Aprovar plano.
- Tela Hoje.
- Abrir bloco no Lichess.
- Timer.
- Concluir bloco.
- Feedback "Bom".
- Navegar para Progresso.
- Mobile e desktop.

Navegadores/viewports usados:

- Chromium via Playwright.
- Desktop `1280x800`.
- Mobile `390x844` / Pixel 7 aproximado.

Fontes oficiais pesquisadas:

- Lichess API Tips: uma requisicao por vez e espera minima de 1 minuto apos HTTP 429.
- Lichess API specification: OAuth PKCE, tokens, escopos permitidos/proibidos.
- Chess.com PubAPI Help e Published Data API: API publica read-only, arquivos mensais, PGN na resposta.
- MDN CSP e Service Worker API: hardening e PWA/offline.
- Cloudflare Workers/D1: dev local com Wrangler/Miniflare e D1 local.
- Vercel project configuration: headers em `vercel.json`.
- GNU AGPLv3: obrigacao de disponibilizar codigo-fonte correspondente a usuarios via rede.

Limites da analise:

- OAuth real com conta Lichess nao foi executado.
- Sync Cloudflare P4 nao existe localmente para teste completo.
- Nao fiz pentest nem auditoria formal de acessibilidade com leitor de tela.
- O Browser plugin nao anexou ao webview; usei Playwright como fallback.

## 3. Notas por area

| Area | Nota | Motivo |
|---|---:|---|
| Produto | 8,2 | Proposta clara e util para estudo real; beta publico ainda depende de identidade e escopo P4/P5. |
| UX | 7,5 | Fluxo Hoje e onboarding funcionam; bug do feedback herdado e progresso apos 0 min quebram confianca. |
| Diagnostico | 7,4 | Integracoes oficiais e bom modelo de sinais; risco de race entre fontes ainda nao coberto por teste. |
| Plano de treino | 7,6 | Acionavel, curto e sem tabuleiro proprio; precisa impedir conclusao/feedback indevido. |
| Metodo 5 trilhas | 7,7 | Bem especificado e implementado; revisoes sofrem com bug de calendario. |
| Arquitetura | 8,0 | Camadas boas; `state`/acoes assicronas ainda pedem guardas de concorrencia. |
| Codigo TypeScript | 8,1 | Build estrito passa; alguns helpers duplicados e estado local fragil. |
| Testes | 6,7 | Suite grande e smoke forte, mas flakiness e coverage vermelho reduzem confianca. |
| Privacidade | 8,5 | Sem violacao confirmada; tokens fora do backup e PGN transiente. |
| Seguranca | 7,5 | PKCE, CSP e headers bons; import/OAuth local corrompido e sourcemaps pedem decisao. |
| PWA/offline | 7,6 | Smoke passou 26/26 apos limpar porta; workflow da porta fixa e screenshots ainda incomodam. |
| Integracoes externas | 7,6 | Aderentes as docs oficiais; `Retry-After` e cross-tab rate limit podem melhorar. |
| Performance | 7,4 | App leve; Lichess historico completo em `response.text()` pode pesar em contas grandes. |
| Acessibilidade | 7,0 | Sem problemas visuais obvios no fluxo manual; falta axe/teclado/leitor de tela sistematico. |
| Mobile | 7,8 | Bom no fluxo testado; sem overflow visivel. |
| Documentacao | 7,1 | Rica, mas com conflitos P4/P5 e memoria ausente. |
| Prontidao beta publico | 5,8 | Ainda bloqueado por bugs, QA, P5 legal/nome e sync/backups. |

## 4. Bugs encontrados

### Bugs confirmados

### BUG-1 — Revisoes pendentes podem pular um dia em GMT-3

- Severidade: P1
- Status: confirmado
- Area afetada: Metodo 5 trilhas, revisao espacada, constancia.
- Como reproduzir: em `TZ=America/Sao_Paulo`, simular `addDays(new Date().toISOString(), 1)` entre 21h e 23h59 locais.
- Resultado atual: o app usa data UTC de "amanha" e depois aplica `setDate` local, retornando dia posterior; exemplo: `2026-06-18T01:30:00.000Z` ainda e 2026-06-17 22:30 BRT, mas `+1` retorna `2026-06-19`.
- Resultado esperado: "amanha" deve ser 2026-06-18 no calendario local do usuario, ou o dominio precisa declarar UTC de ponta a ponta.
- Evidencia: reproduzido via Node com `TZ=America/Sao_Paulo`.
- Arquivos/linhas relevantes: `src/domain/method/pendingItems.ts:8`, `src/domain/method/pendingItems.ts:18`, `src/domain/method/pendingItems.ts:124`.
- Possivel causa: mistura de `new Date().toISOString()` UTC, `getDate/setDate` local e retorno `toISOString()`.
- Proposta de solucao: criar helper unico de `YYYY-MM-DD` local injetavel, ou padronizar UTC explicitamente com testes.
- Teste recomendado: teste em `America/Sao_Paulo` para 21h, 22h e 23h locais.
- Risco de regressao: medio; mexe em agenda de revisoes e streaks.

### BUG-2 — Proximo bloco herda o modo "Como foi o treino?"

- Severidade: P1
- Status: confirmado
- Area afetada: UX, integridade de logs, plano de treino.
- Como reproduzir: primeiro uso -> comecar rapido -> aprovar plano -> Hoje -> abrir/concluir primeiro bloco -> clicar "Bom".
- Resultado atual: o proximo bloco aparece no hero ja em modo de feedback, antes de ser treinado.
- Resultado esperado: o proximo bloco deve abrir em estado normal, com "Abrir no Lichess"/"Concluir".
- Evidencia: screenshots `tmp/audits/Codex/manual-mobile-feedback.jpg` e `manual-desktop-feedback.jpg`.
- Arquivos/linhas relevantes: `src/ui/PlanBlockCard.tsx:33`, `src/ui/PlanBlockCard.tsx:133`, `src/ui/Today.tsx:280`; a lista secundaria usa `key={block.id}` em `Today.tsx:404`, mas o hero nao usa key.
- Possivel causa: `isRating` e estado local preservados quando `heroBlock` muda.
- Proposta de solucao: adicionar `key={heroBlock.id}` no card hero e/ou resetar `isRating`, `isSavingPending` e `openWarning` em `useEffect` por `block.id`.
- Teste recomendado: E2E/RTL concluindo bloco 1 e garantindo que bloco 2 nao exibe feedback.
- Risco de regressao: alto; fluxo central.

### BUG-3 — `npm run coverage` esta vermelho

- Severidade: P1 para CI/beta, P2 para ferramenta pessoal.
- Status: confirmado
- Area afetada: QA, cobertura, confianca de release.
- Como reproduzir: rodar `npm run coverage`; repetir com `npm run coverage -- --testTimeout=30000`.
- Resultado atual: falhas em testes de UI/OAuth/treino sob instrumentacao; cobertura final nao e produzida.
- Resultado esperado: coverage deve passar ou ser separado dos testes E2E/DOM instaveis.
- Evidencia: falhas em `preserveProgress`, `trainingFlow` e `oauthCallback` sob coverage.
- Arquivos/linhas relevantes: `vitest.config.ts`, `src/app/preserveProgress.test.tsx`, `src/app/trainingFlow.test.tsx`, `src/app/oauthCallback.test.tsx`.
- Possivel causa: instrumentacao + jsdom + IndexedDB fake/timing aumentam timeouts.
- Proposta de solucao: isolar DB por teste, rever timeouts, separar coverage de UI pesada ou estabilizar mocks.
- Teste recomendado: `npm run coverage` em ambiente limpo, 3 vezes.
- Risco de regressao: alto para governanca de release.

### BUG-4 — Suite unitária mostrou flakiness antes de passar

- Severidade: P2
- Status: confirmado
- Area afetada: testes, confianca de CI.
- Como reproduzir: primeira execucao de `npm test` falhou em `preserveProgress` e `trainingFlow`; arquivos isolados passaram; segunda execucao completa passou.
- Resultado atual: o estado final e verde, mas a repetibilidade nao esta garantida.
- Resultado esperado: a mesma suite deve passar de primeira em ambiente limpo.
- Evidencia: 607 testes passaram na segunda execucao; falha inicial foi reproduzida apenas como flake.
- Arquivos/linhas relevantes: `src/app/preserveProgress.test.tsx`, `src/app/trainingFlow.test.tsx`, `src/infra/storage/db.ts:15`.
- Possivel causa: IndexedDB fake compartilhado, fetch stubs globais ou timing de UI.
- Proposta de solucao: nomes de DB por arquivo/teste e teardown mais agressivo.
- Teste recomendado: rodar `npm test` 5 vezes em loop no CI local.
- Risco de regressao: medio/alto.

### BUG-5 — Import de backup le arquivo inteiro antes de validar tamanho

- Severidade: P2
- Status: confirmado por codigo.
- Area afetada: backup/import, seguranca local, UX.
- Como reproduzir: importar arquivo JSON muito grande.
- Resultado atual: `Config.tsx` usa `pendingRestoreFile.text()` antes de qualquer guarda de tamanho.
- Resultado esperado: rejeitar arquivos grandes antes de carregar/parsear.
- Evidencia: `src/ui/Config.tsx:111`; `src/infra/storage/backup.ts:240` faz `JSON.parse`.
- Arquivos/linhas relevantes: `src/ui/Config.tsx:111`, `src/infra/storage/backup.ts:240`, `src/infra/storage/backup.ts:259`.
- Possivel causa: fluxo de backup nasceu para ferramenta pessoal.
- Proposta de solucao: limite de bytes no `File`, mensagens claras e plano `migrateBackup`.
- Teste recomendado: arquivo enorme, backup v0/v2, payload corrompido.
- Risco de regressao: medio.

### BUG-6 — OAuth callback pode quebrar se `sessionStorage` estiver corrompido

- Severidade: P3
- Status: confirmado por leitura estatica.
- Area afetada: OAuth, boot, recuperacao de erro.
- Como reproduzir: gravar JSON invalido em `sessionStorage['lichess-tutor:oauth-pending']` e abrir callback com `code/state`.
- Resultado atual: `JSON.parse(raw)` em `readPendingOAuthRequest` esta fora de `try/catch`.
- Resultado esperado: limpar chave invalida e retornar cancelamento recuperavel.
- Evidencia: `src/app/oauthFlow.ts:110-118`.
- Arquivos/linhas relevantes: `src/app/oauthFlow.ts:117`.
- Possivel causa: foco no fluxo feliz e no erro OAuth, nao em storage local manualmente corrompido.
- Proposta de solucao: envolver parse em `try/catch`, remover chave invalida e limpar query.
- Teste recomendado: callback com storage invalido.
- Risco de regressao: baixo.

### BUG-7 — Identidade publica ainda nao esta centralizada em `APP_NAME`

- Severidade: P2 para P5/beta publico.
- Status: confirmado.
- Area afetada: produto, legal, release.
- Como reproduzir: buscar `APP_NAME`, `Lichess Tutor`, `Rotina de Treino Lichess` e `lichess-tutor`.
- Resultado atual: nao ha constante unica; nome aparece em `README`, `vite.config.ts`, backup format e textos.
- Resultado esperado: `APP_NAME='Rotina'` ou nome final por uma fonte unica; repo/pasta podem continuar internos.
- Evidencia: `vite.config.ts:28`, `README.md:1`, `src/infra/storage/backup.ts:1`, roadmap `docs/review/roadmap-beta-2026-06-16.md:168`.
- Arquivos/linhas relevantes: `vite.config.ts:28`, `README.md:1`, `src/ui/App.tsx:132`.
- Possivel causa: P5 acabou de ser descongelada.
- Proposta de solucao: `src/config/appIdentity.ts` e checagem de strings publicas no CI.
- Teste recomendado: grep/snapshot impedindo nome publico antigo em superfícies externas.
- Risco de regressao: baixo tecnico, alto reputacional.

### Suspeitas

### BUG-8 — Sync Chess.com/Lichess pode sobrescrever fraquezas com snapshot parcial

- Severidade: P1/P2
- Status: suspeito com forte evidencia estatica.
- Area afetada: diagnostico e plano.
- Como reproduzir: controlar `runChesscomSync` e `runLichessSync` para resolverem em ordem invertida.
- Resultado atual: `runOnboardingImport` dispara jobs em paralelo; cada sync faz `replaceSignalsForSource`, `loadSignals`, `replaceWeaknesses`, `savePlan`.
- Resultado esperado: fetches podem ser paralelos, mas o merge/detect/save deve ser transacional ou serializado.
- Evidencia: `src/app/useDiagnosisActions.ts:128-162`, `src/app/useDiagnosisActions.ts:287-295`.
- Arquivos/linhas relevantes: `src/app/useDiagnosisActions.ts:128`, `src/app/useDiagnosisActions.ts:161`, `src/app/useDiagnosisActions.ts:295`.
- Possivel causa: paralelismo para UX sem lock na secao critica.
- Proposta de solucao: singleflight/mutex para recomputar fraquezas e plano, ou orquestrar todas as fontes e escrever uma vez.
- Teste recomendado: promises controladas e assercao de uniao de sinais/fraquezas.
- Risco de regressao: alto.

### BUG-9 — `clearAllData` pode competir com sync em voo

- Severidade: P2
- Status: suspeito.
- Area afetada: privacidade, apagar dados, confianca do usuario.
- Como reproduzir: iniciar sync lento, clicar apagar dados, deixar sync resolver depois.
- Resultado atual: nao ha epoch/cancel token evidente antes das escritas tardias.
- Resultado esperado: operacoes antigas nao repovoam banco apos wipe.
- Evidencia: `src/app/useBackupActions.ts:115`, `src/infra/storage/appData.ts:491`.
- Arquivos/linhas relevantes: `src/app/useBackupActions.ts:115`.
- Possivel causa: falta de abort/generation compartilhado.
- Proposta de solucao: `operationEpoch` incrementado em clear/import; todas as actions conferem antes de gravar.
- Teste recomendado: promise controlada resolvendo depois de `clearAllData`.
- Risco de regressao: medio/alto.

### BUG-10 — `providerQueue` ignora `Retry-After`

- Severidade: P3/P2.
- Status: suspeito/risco confirmado por codigo.
- Area afetada: integracoes externas, rate limit.
- Como reproduzir: resposta 429 com `Retry-After: 180`.
- Resultado atual: cooldown fixo de 60s.
- Resultado esperado: respeitar `Retry-After` quando maior que o minimo.
- Evidencia: `src/infra/http/providerQueue.ts:8`, `src/infra/http/providerQueue.ts:30`.
- Arquivos/linhas relevantes: `src/infra/http/providerQueue.ts:30`.
- Possivel causa: regra minima do Lichess foi implementada literalmente.
- Proposta de solucao: parsear segundos/data, aplicar max(minimo, retry-after), jitter e coordenacao cross-tab no futuro.
- Teste recomendado: fetch mock com 429 e header.
- Risco de regressao: baixo.

## 5. Inconsistencias e conflitos

- `AGENTS.md` e `docs/review/roadmap-beta-2026-06-16.md` dizem que P4/P5 estao descongeladas; `PLANO.md`, `docs/architecture/system.md` e trechos de `memory/progress.md` ainda falam em sync/backend/P5 congelados.
- `AGENTS.md` referencia `memory/plano-nota-95-estado.md`, mas o arquivo nao existe.
- Roadmap pede `APP_NAME` unico; codigo ainda usa strings publicas em varios pontos.
- README ja tem AGPL e disclaimer de nao-afiliação, mas a UI publica ainda nao deixa isso suficientemente visivel para P5.
- A promessa de constancia entra em conflito com a possibilidade de concluir/avaliar bloco sem treino real e com a tela Progresso dizendo "Sem treinos ainda" apos 1/2 bloco com 0 min.
- A cobertura e citada como gate fora do CI, mas hoje `npm run coverage` falha.

## 6. Simplificacoes possiveis

| O que simplificar | Por que esta complexo | Ganho esperado | Risco | Ordem |
|---|---|---|---|---|
| Helper unico de data de estudo | Ha UTC/local misturados | Menos bugs de revisao | Medio | 1 |
| `APP_NAME` central | Strings publicas espalhadas | P5 mais seguro | Baixo | 2 |
| Orquestrador unico de diagnostico | Cada fonte recalcula/escreve globalmente | Menos race | Medio | 3 |
| Epoch de operacoes async | Clear/import nao invalida callbacks antigos | Privacidade mais forte | Medio | 4 |
| Backup migration module | Validacao e versao estao acopladas | Evolucao de schema | Medio | 5 |
| Docs de estado atual | Historico compete com regra nova | Menos erro de agente | Baixo | 6 |

## 7. Melhorias propostas

Melhorias urgentes:

- Corrigir `pendingItems.ts` com teste GMT-3.
- Resetar estado do `PlanBlockCard` quando `block.id` muda.
- Estabilizar `npm test` e fazer `npm run coverage` passar.
- Criar teste de race no onboarding com Chess.com + Lichess.
- Criar teste de clear durante sync.

Melhorias antes do beta:

- Centralizar `APP_NAME`.
- Expor disclaimer de nao-afiliacao e link de codigo-fonte/AGPL na UI publica.
- Definir se `study:write` sera pedido no OAuth inicial ou just-in-time.
- Endurecer import de backup com limite de tamanho e migracao.
- Adicionar axe/teclado nos fluxos principais.
- Definir contrato P4 E2EE: derivacao de chave, recuperacao, merge, exclusoes de sync.

Melhorias pos-beta:

- Coordenar rate limit entre abas.
- Melhorar UX offline/rede por provedor.
- Criar painel local de integridade: ultimo backup, ultimo sync, storage persistente.
- Medir Lighthouse/performance em mobile real.

Melhorias opcionais:

- Modo "treino feito fora do app" com duracao manual.
- Export markdown resumido para estudo pessoal.
- Preferencia de duracao padrao por trilha.

## 8. Seguranca e privacidade

Tokens:

- `allowedLichessOAuthScopes` contem `puzzle:read` e `study:write`, ambos autorizados por `AGENTS.md`.
- Nao encontrei `board:play`, `bot:play`, `challenge:*`, `puzzle:write` nem escopos de jogo.
- Testes confirmam que token OAuth fica fora do backup.

Logs:

- Nao encontrei `console.log` em `src` que exponha tokens/PII.
- Recomendacao: grep de CI para `Authorization`, `accessToken`, `console.log`.

PGNs:

- Chess.com traz `pgn` na resposta, mas o codigo extrai tags/sinais e testes afirmam que PGN bruto e descartado.
- Lichess games usa `moves=false` e `pgnInJson=false`.
- Studies geram PGN de plano, nao PGN completo de partidas do usuario.

PII:

- Username publico e usado como dado operacional.
- Evitar avatar, nome real, localizacao e perfis sociais na P5.

OAuth:

- `state` e validado em `oauthFlow.ts`; falso positivo de CSRF nao deve ser reaberto.
- Risco menor: storage local corrompido pode quebrar callback.

Dados locais:

- Dexie/IndexedDB local-first esta alinhado ao projeto.
- Backup exclui tokens e caches sensiveis, mas precisa limite de tamanho/migracao.

Sync futuro E2EE:

- Cloudflare D1 nao substitui E2EE de aplicacao; plaintext deve ser cifrado no cliente antes de chegar ao Worker/D1.
- Chave nao pode ser derivada apenas de identidade publica Lichess.

Riscos comunidade/P5:

- Nome, disclaimers, AGPL e doacao externa precisam estar visiveis e sem ambiguidade.
- Nao encontrei violacao direta das regras inquebraveis nesta auditoria.

## 9. UX real: dores e vantagens

O app ajuda a criar constancia: sim. O maior acerto e a tela Hoje com proximo passo concreto, blocos pequenos e linguagem adulta.

O diagnostico e compreensivel: para usuario tecnico e para o dono, sim. Para publico beta, precisa explicar melhor origem dos sinais e confianca.

O plano parece acionavel: sim. Ele manda o usuario ao Lichess e nao tenta ensinar no proprio app com tabuleiro.

O usuario sabe o que fazer agora: sim no fluxo feliz; estados de erro/rede ainda precisam mais clareza.

Friccao desnecessaria: termos tecnicos de OAuth, diferenca Chess.com/Lichess e progresso contraditorio apos 0 min.

O que faria o usuario abandonar:

- Plano registrar treino que ele nao fez.
- Diagnostico parecer arbitrario.
- Importacao falhar sem explicacao.
- Perda de dados por backup mal entendido.
- Confusao com nome/afiliação ao Lichess.

## 10. Perguntas, duvidas e respostas

### Perguntas ao dono

1. O beta publico sai local-first com backup manual ou P4 sync e bloqueador?
2. O nome publico final sera decidido agora ou `Rotina` continua como placeholder?
3. `study:write` deve ser pedido no login inicial ou somente quando criar Study?
4. Concluir bloco sem abrir destino deve ser permitido como "feito fora do app"?
5. P5 tera dados sociais/comunitarios ou apenas distribuicao publica do app?

### Duvidas tecnicas

1. Dia de estudo deve ser data local do usuario ou UTC?
2. Como o sync E2EE derivara/armazenara chaves?
3. Qual politica de migracao de backup v1?
4. Coverage sera gate obrigatorio antes de release?
5. Como reconciliar conflitos multi-dispositivo: `updatedAt`, tombstone, CRDT simples?

### Respostas inferidas

- Revisoes devem seguir calendario local. Confianca: alta.
- Beta publico pode sair sem sync se a promessa publica for honesta e backup estiver robusto. Confianca: media.
- Tokens e handles de backup automatico nao devem sincronizar. Confianca: alta.
- `Rotina` ainda e placeholder ate decisao do dono. Confianca: alta.
- Sync P4 deve usar segredo local/passphrase ou chave gerada no aparelho, nao identidade publica. Confianca: alta.

## 11. Plano de acao recomendado

| Acao | Prioridade | Esforco | Impacto | Dependencias | Criterio de pronto |
|---|---|---:|---|---|---|
| Corrigir datas de `pendingItems` | P1 | P | Alto | Decisao local vs UTC | Teste GMT-3 verde |
| Resetar estado do `PlanBlockCard` | P1 | P | Alto | Nenhuma | E2E do proximo bloco normal |
| Fazer `coverage` passar | P1 | M | Alto | Estabilizar testes DOM/DB | `npm run coverage` verde |
| Testar race Chess.com/Lichess | P1 | M | Alto | Promises controladas | Fraquezas unidas preservadas |
| Invalidar sync apos clear/import | P2 | M | Alto | Epoch/AbortController | Sync antigo nao repopula DB |
| Centralizar `APP_NAME` | P2 | P | Alto P5 | Nome final ou placeholder | Grep sem hardcode publico |
| Disclaimers + AGPL visiveis | P2 | P | Alto P5 | Copy aprovado | UI publica exibe nao-afiliação/fonte |
| Hardening backup/import | P2 | M | Alto | Limite e migracao | Testes de tamanho/versao |
| Especificar E2EE P4 | P1 beta | G | Alto | Decisao de chaves | Doc + testes cripto locais |
| A11y automatizado | P2 | M | Medio | Playwright/axe | Sem violacoes criticas |

## 12. Veredito final

O sistema esta saudavel para uso pessoal e ja tem bastante engenharia boa. Nao esta pronto para beta publico hoje.

O que impede beta: bug de data, bug de feedback herdado, `coverage` vermelho, risco de race/clear sem teste, identidade publica nao centralizada, UX legal/AGPL/disclaimer ainda incompleta e sync E2EE sem contrato final.

O proximo corte mais inteligente e estabilizacao: datas, card, QA, race/clear e identidade. A primeira decisao do dono deve ser se o beta publico exige P4 sync ou se pode abrir como local-first com backup manual robusto.

