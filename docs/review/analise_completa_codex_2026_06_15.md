# Analise Completa - lichess-tutor (Codex, 2026-06-15)

## 0. Sumario executivo

**Nota global sugerida: 8,0 / 10.**

O app esta em bom estado para uma ferramenta pessoal local-first: os gates passam, o dominio tem boa cobertura de teste, as integracoes obedecem o desenho de APIs oficiais, o visual esta acima da media para um PWA pequeno e a privacidade essencial foi tratada com seriedade. O principal trabalho para "terminar o relatorio" e transformar a auditoria em cortes pequenos: corrigir a semantica de recencia dos sinais Chess.com, endurecer importacao/abertura de URLs persistidas, adicionar smoke PWA/offline, alinhar docs que ficaram obsoletas e preparar o minimo de operacao antes de qualquer P5.

**Estado dos gates nesta auditoria:**

- `npm run lint`: passou.
- `npm run test`: passou, 59 arquivos e 409 testes.
- `npm run build`: passou, com service worker gerado pelo `vite-plugin-pwa`.
- `npm audit --audit-level=moderate`: 0 vulnerabilidades.
- `npm audit --omit=dev --audit-level=moderate`: 0 vulnerabilidades.
- Browser desktop/mobile: sem erro de console, sem overflow horizontal nos fluxos verificados.

**Acertos reais que nao devem ser mexidos sem motivo:**

- A moldura pessoal-first esta consistente com README, PLANO, arquitetura e AGENTS.
- O dominio e majoritariamente puro e testavel, com decisao de treino no Lichess e sem tabuleiro proprio.
- O app ja usa fila serial/cooldown central por provedor em `src/infra/http/providerQueue.ts`.
- O backup exclui token OAuth e cache Chess.com por design, enquanto preserva dados duraveis de usuario.
- A UI atual e adulta, focada em treino, responsiva e sem cara de landing page.

**Riscos que ainda justificam cortes antes de chamar de "95% fechado":**

- Sinais historicos do Chess.com sao carimbados com `observedAt` do sync, entao o filtro de recencia pode tratar partidas antigas como diagnostico recente.
- A validacao de backup ainda e rasa para objetos internos e URLs que depois podem ser abertas.
- PWA/offline existe como configuracao, mas falta smoke de producao com service worker e estado offline visivel.
- `vercel.json` so define `X-Robots-Tag`; faltam headers defensivos basicos para qualquer deploy publico.
- Documentacao de arquitetura/privacidade/PLANO esta parcialmente atrasada em relacao ao codigo atual.

## 1. Metodo

### Escopo lido

- Contrato de agentes: `AGENTS.md`.
- Produto e fase: `README.md`, `PLANO.md`, `docs/architecture/system.md`.
- Privacidade e dados: `docs/privacy/privacy-and-data.md`.
- Dominio e app: `src/domain/**`, `src/app/**`, `src/infra/**`, `src/ui/**`.
- Testes e configuracao: `package.json`, `vite.config.ts`, `vercel.json`, testes Vitest e screenshots Playwright.
- Relatorios anteriores em `docs/review/**`, usados como contexto, nao como ordem.

### Skills e criterios aplicados

- `code-review-excellence`: postura de review com achados por risco e evidencia.
- `bug-hunt-gate`: procura de bugs, lacunas e inconsistencias antes de nova fase.
- `security-best-practices`: XSS, storage, OAuth, URLs, headers e supply chain.
- `playwright`: verificacao real de desktop/mobile.

### Fontes oficiais rechecadas

Foi registrada nova rechecagem em `docs/research/sources.md:763-783`.

- Lichess API Tips: uso de endpoints oficiais, uma requisicao por vez e espera minima apos HTTP 429.
- Chess.com PubAPI: API publica read-only, cache, `ETag`/`Last-Modified`, acesso serial para evitar rate limit.
- MDN StorageManager.persist e web.dev Persistent storage: persistencia deve ser pedida no momento certo, preferencialmente apos acao de valor do usuario.
- MDN CSP e Vercel `vercel.json`: headers podem e devem ser definidos no deploy quando houver superficie publica.

## 2. Notas por area

| Area | Nota | Leitura curta |
| --- | ---: | --- |
| Correcao e bugs | 8,2 | Gates verdes; riscos concentrados em semantica de recencia, URLs persistidas e smoke PWA. |
| Qualidade de codigo | 7,4 | Boa separacao dominio/infra/UI, mas `useAppState` e CSS cresceram demais. |
| Arquitetura | 7,8 | Local-first e clean-room fortes; docs ainda dizem que alguns itens ja implementados estao pendentes. |
| Dominio e logica de negocio | 8,0 | Metodo das trilhas bem modelado; recencia Chess.com precisa ficar semanticamente correta. |
| Dados e estado | 8,1 | Dexie, backup e token fora do export estao bons; falta validacao profunda de import. |
| Testes e QA | 8,4 | 409 testes passando; falta E2E/smoke de producao offline e alguns testes adversariais de backup. |
| Documentacao e memoria | 7,1 | Rica, mas ja com conflitos pontuais sobre backup, fila/cooldown e PWA. |
| Processo e tooling | 7,0 | Scripts locais bons; ausencia de CI torna regressao mais manual. |
| Visual design | 8,6 | Interface premium, adulta, responsiva e focada em treino. |
| UX | 8,0 | Fluxo principal bom; estados vazios/offline e persistencia podem orientar melhor. |
| UI | 8,5 | Layout estavel em desktop/mobile; botoes e navegacao funcionam bem. |
| Conteudo e comunicacao | 8,4 | PT-BR pratico e sem infantilizacao; algumas mensagens dependem de semantica de dados mais precisa. |
| Plataforma e performance | 7,6 | Build limpo e PWA configurado; falta smoke offline real e politica de update. |
| Acessibilidade e i18n | 7,5 | Sem overflow/tiny targets na amostra; falta auditoria formal de teclado/aria/contraste. |
| Seguranca e privacidade | 7,8 | Boas escolhas de token/cache/PGN; headers, URL allowlist e import validation precisam fechar. |
| Build, release e operacao | 7,0 | Vite/Vitest ok; deploy e CI ainda minimos. |

## 3. Achados prioritarios

### A1 - Recencia do Chess.com pode virar falso "diagnostico recente"

**Severidade:** Media.  
**Confianca:** Alta.  
**Area:** Dominio, diagnostico, UX de feedback.

**Evidencia:**

- `src/infra/chesscom/chesscomClient.ts:45-63` define um unico `observedAt` no momento do sync e passa esse valor para todos os sinais extraidos dos arquivos mensais.
- `src/domain/weakness/detectWeaknesses.ts:34-50` filtra sinais por idade a partir de `signal.observedAt`.
- `src/app/state.ts:411`, `src/app/state.ts:490`, `src/app/state.ts:676` e `src/app/state.ts:707` chamam `filterFreshSignals(..., new Date().toISOString())`.
- Evidencias textuais usam linguagem de "partidas recentes" em `src/domain/weakness/detectWeaknesses.ts:118` e `src/domain/weakness/detectWeaknesses.ts:132`.
- A decisao do dono em AGENTS permite ler historico completo, mas isso nao obriga tratar partidas antigas como recentes.

**Risco real:** se o dono importar historico completo, fraquezas antigas podem permanecer com peso de sinal novo. O app continua util, mas a explicacao "recente" fica imprecisa e a prioridade do plano pode ser enviesada.

**Correcoes possiveis:**

- Adicionar `periodStart`/`periodEnd` ou `sampleDate` aos sinais agregados por mes.
- Manter `observedAt` como "quando o app observou", mas usar outro campo para decaimento do diagnostico.
- Separar "baseline historico" de "sinal recente"; o plano usa ambos, mas com pesos diferentes.

**Teste esperado:** importar dois meses, um antigo e um recente, e garantir que o antigo nao passa pelo filtro de recencia quando a politica diz 90 dias.

### A2 - Backup e URLs persistidas precisam de allowlist defensiva

**Severidade:** Media.  
**Confianca:** Alta.  
**Area:** Seguranca, privacidade, dados.

**Evidencia:**

- `src/infra/storage/backup.ts:119-183` valida presenca de alguns campos, mas nao o shape profundo dos objetos.
- `src/infra/storage/backup.ts:203-211` aceita `lichessStudies` validando `id` e `studyId`, sem validar URL/origem.
- `src/infra/storage/appData.ts:444-445` restaura `lichessStudies` diretamente apos parse valido.
- `src/app/state.ts:877`, `src/app/state.ts:918` e `src/app/state.ts:967` abrem URLs vindas de registros salvos.
- `src/app/externalOpen.ts:1-14` abre qualquer string recebida com `window.open`.
- `src/ui/PlanBlockCard.tsx:116-122` e `src/ui/PlanBlockCard.tsx:177-182` renderizam `href={block.destination.url}` quando o plano tem destino.

**Risco real:** o app nao tem sinks HTML perigosos conhecidos, entao nao parece XSS classico. O risco e importacao/restauracao de backup malicioso ou corrompido levando a abertura de URL externa inesperada, alem de dados invalidos chegando ao estado.

**Correcoes possiveis:**

- Criar um utilitario central `isAllowedLichessUrl`/`normalizeLichessUrl`.
- Rejeitar `javascript:`, `data:`, hosts nao Lichess e caminhos fora da allowlist esperada.
- Validar `pendingItems[].lichessUrl`, `lichessStudies[].url` e `plans[].blocks[].destination.url` na importacao.
- No render, so exibir link externo quando a URL passar pela allowlist.

**Teste esperado:** backup com `lichessStudies.url = "javascript:alert(1)"` e `pendingItems.lichessUrl` fora de `https://lichess.org/...` deve ser rejeitado ou sanitizado.

### A3 - PWA/offline ainda nao esta fechado como comportamento de produto

**Severidade:** Media.  
**Confianca:** Alta.  
**Area:** Plataforma, QA, UX.

**Evidencia:**

- `vite.config.ts` configura PWA e o build gera service worker.
- `src/app/pwaConfig.test.ts:5-18` trava a configuracao em teste unitario, mas o proprio comentario aponta smoke de browser como complemento.
- `docs/architecture/system.md:94-95` ainda lista smoke PWA de producao/offline como pendente.
- Busca por `navigator.onLine`, `online` e `offline` nao encontrou detector runtime no app; `src/ui/App.tsx` tem erro global, mas nao banner offline dedicado.

**Risco real:** o usuario pode acreditar que "offline" cobre importacoes Chess.com/Lichess, abertura de treino e reconciliacao de puzzles. Hoje a promessa mais segura e "app-shell/offline local", nao "integracoes offline".

**Correcoes possiveis:**

- Criar smoke script: `npm run build`, `npm run preview`, abrir, aguardar service worker, recarregar offline e verificar shell.
- Adicionar banner discreto quando offline: plano/local continuam, sync/treino externo dependem de rede.
- Documentar exatamente o contrato: shell offline, dados locais offline, integracoes externas online.

**Teste esperado:** Playwright em build de producao consegue recarregar offline a tela principal ja visitada e mostra estado de rede coerente.

### A4 - Headers de seguranca de deploy ainda sao minimos

**Severidade:** Baixa/Media agora; Media em P5.  
**Confianca:** Alta.  
**Area:** Seguranca, release.

**Evidencia:**

- `vercel.json:3-12` define apenas `X-Robots-Tag`.
- Rechecagem em `docs/research/sources.md:779-783` confirma CSP como defesa via header e que `vercel.json` suporta `headers`.
- A busca por sinks perigosos (`dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write`) nao encontrou uso no app, o que reduz a urgencia.

**Risco real:** em ferramenta pessoal local o risco e limitado. Em qualquer deploy publico, headers basicos sao uma protecao barata contra classes comuns de abuso e regressao.

**Correcoes possiveis:**

- Adicionar `Content-Security-Policy` compativel com Vite/React atual.
- Adicionar `X-Content-Type-Options: nosniff`.
- Adicionar `Referrer-Policy`.
- Adicionar `Permissions-Policy`.
- Adicionar `frame-ancestors 'none'` via CSP, ou `X-Frame-Options: DENY` se fizer sentido para o alvo.

**Teste esperado:** build/preview e checagem de headers no ambiente de deploy ou preview.

### A5 - Persistencia de storage e solicitada cedo demais

**Severidade:** Baixa/Media.  
**Confianca:** Alta.  
**Area:** PWA, UX, privacidade.

**Evidencia:**

- `src/app/state.ts:233-236` chama `requestPersistentStorage()` durante o bootstrap.
- `src/infra/storage/persistence.ts:19-35` chama `storage.persisted()` e depois `storage.persist()` se ainda nao estiver persistido.
- `docs/research/sources.md:774-777` registra a orientacao de pedir persistencia no momento em que o usuario salva dado critico, nao no carregamento inicial.

**Risco real:** navegadores podem negar silenciosamente, ou a permissao pode parecer deslocada. A funcionalidade continua funcionando, mas a UX e a taxa de aceite podem ser piores.

**Correcoes possiveis:**

- No bootstrap, apenas ler `navigator.storage.persisted()`.
- Pedir `persist()` apos primeira sessao, primeiro backup ou botao "proteger meus dados locais".
- Guardar status honesto na UI de Config.

**Teste esperado:** bootstrap nao chama `persist()`; acao explicita chama e atualiza status.

### A6 - Documentacao esta rica, mas com conflitos pontuais

**Severidade:** Baixa.  
**Confianca:** Alta.  
**Area:** Documentacao, processo.

**Evidencia:**

- `docs/architecture/system.md:91-95` ainda fala em criar fila/cooldown central e smoke PWA como pendencias.
- `src/infra/http/providerQueue.ts:3-49` ja implementa fila serial, cooldown 429 e timeout.
- Clientes usam a fila: `src/infra/chesscom/chesscomClient.ts:2`, `src/infra/lichess/games.ts:2`, `src/infra/lichess/puzzleActivity.ts:2`, `src/infra/lichess/puzzleDashboard.ts:2`, `src/infra/lichess/study.ts:3`.
- `docs/privacy/privacy-and-data.md:23` lista link/id do Study como dado salvo, mas `docs/privacy/privacy-and-data.md:50` diz que backup nao exporta links de Study.
- `src/infra/storage/appData.test.ts:441-459` afirma explicitamente que links de Study entram no backup como dado duravel do usuario.
- `PLANO.md:71-74` mistura itens resolvidos com backlog ainda real.

**Risco real:** agentes futuros podem refazer tarefa ja concluida, contestar decisao correta de backup ou planejar com base em estado antigo.

**Correcoes possiveis:**

- Atualizar `docs/architecture/system.md`: fila/cooldown concluida; smoke PWA segue pendente.
- Atualizar `docs/privacy/privacy-and-data.md`: token/cache fora; links de Study entram por serem dado duravel.
- Atualizar `PLANO.md`: separar resolvido, pendente tecnico e pendente P5.

**Teste esperado:** nenhum; revisao documental com `rg` para termos conflitantes.

### A7 - Estado central e CSS estao virando gargalo de manutencao

**Severidade:** Baixa/Media.  
**Confianca:** Alta.  
**Area:** Qualidade de codigo, evolucao.

**Evidencia:**

- `src/app/state.ts:199` inicia `useAppState`, que concentra bootstrap, sync, OAuth, plano, sessoes, studies, backup, pendencias e UI messages.
- `src/app/state.ts:1215-1284` retorna uma API extensa para a UI.
- Maiores arquivos por linhas: `src/app/state.ts`, `src/index.css`, `src/domain/sources/resourceCatalog.ts`, `src/ui/Today.tsx`, `src/domain/plan/generatePlan.ts`.

**Risco real:** qualquer corte futuro mexendo em sync, study, backup ou treino tende a tocar o mesmo arquivo, aumentando regressao e conflito entre agentes.

**Correcoes possiveis:**

- Extrair hooks pequenos: `useLichessOAuth`, `useBackupActions`, `useTrainingSessionActions`, `useExternalSync`.
- Manter `useAppState` como composicao, nao como dono de todos os fluxos.
- Dividir CSS por superficies ou camadas se o projeto continuar crescendo.

**Teste esperado:** refactor sem alteracao comportamental, com suites atuais verdes.

### A8 - Progresso vazio e offline deixam o usuario sem proximo passo claro

**Severidade:** Baixa.  
**Confianca:** Media/Alta.  
**Area:** UX.

**Evidencia:**

- `src/ui/Progress.tsx:91` mostra "Sem treinos ainda. A primeira sessao ativa este painel.", mas nao oferece acao direta.
- As screenshots Playwright em desktop/mobile mostraram layout limpo, sem overflow, mas o estado vazio de Progresso fica passivo.
- Nao ha banner offline dedicado, como observado no achado A3.

**Risco real:** baixo para dono experiente, mas estados vazios sao momentos em que o app pode dizer "vai para Hoje e comece o bloco atual" sem infantilizar.

**Correcoes possiveis:**

- Adicionar CTA simples no estado vazio: ir para Hoje.
- Em offline, informar que dados locais continuam e sync/treino externo precisam de rede.

**Teste esperado:** render do estado vazio com botao/link e navegacao para `today`.

## 4. Correcao e bugs

### O que esta bom

- Gates locais passam.
- O app nao cria tabuleiro proprio e abre treino no Lichess.
- Fluxos de OAuth usam PKCE e escopos permitidos por design.
- Fila de API serial por provedor existe e tem testes.
- PGN do Chess.com e processado como entrada transiente para sinais; testes verificam que PGN/movimentos nao ficam no cache de sinais.
- Backup tem formato versionado, checksum e roundtrip testado.

### Onde ainda pode quebrar

- Diagnostico de recencia pode ficar conceitualmente errado depois de importacao historica completa do Chess.com.
- Importacao de backup valida pouco alem de presenca de campos.
- O contrato offline ainda nao foi provado em ambiente de producao.
- Sem CI, o gate depende de disciplina local do agente.

### Prioridade de correcao

1. Corrigir recencia Chess.com.
2. Endurecer backup/URLs.
3. Adicionar smoke PWA offline.
4. Adicionar CI minimo.

## 5. Qualidade de codigo

### Pontos fortes

- Separacao boa entre `src/domain`, `src/infra`, `src/app` e `src/ui`.
- Dominio tem funcoes puras e testes expressivos.
- Integracoes ficam em infra, nao espalhadas pela UI.
- Lazy loading de `Config` e `Progress` reduz carga inicial da interface principal.

### Pontos fracos

- `useAppState` virou o centro gravitacional do app.
- `src/index.css` e grande para manutencao fina.
- O catalogo de recursos esta necessariamente grande, mas precisa continuar com regras/validadores proximos para evitar drift.

### Melhor proximo passo

Nao recomendo refactor amplo agora. Primeiro feche os riscos A1-A6. Depois extraia `useAppState` por fatias de fluxo, uma por PR/corte, sempre com testes verdes.

## 6. Arquitetura

### Leitura

A arquitetura local-first esta correta para a fase pessoal. Ela evita backend, evita PII desnecessaria, usa APIs oficiais e mantem P4/P5 congeladas. A decisao de "treino abre no Lichess" reduz risco legal, tecnico e de dependencia de regras de xadrez.

### Lacunas

- Docs de arquitetura precisam refletir que `providerQueue` ja foi implementado.
- PWA ainda precisa de contrato testado de offline.
- Backups precisam de validacao profunda antes de uma versao publica.

### Alternativa rejeitada

Nao vale introduzir backend, Worker/D1 ou sincronizacao multi-dispositivo agora. Isso pertence a P4/P5 e aumentaria a superficie de privacidade antes da ferramenta pessoal estar fechada.

## 7. Dominio e logica de negocio

### Pontos fortes

- As cinco trilhas estao explicitas em `src/domain/methodTracks.ts`.
- Achievements evitam rating e punição, alinhado ao tom adulto e nao gamificado demais.
- O planner evita repeticao por recursos concluidos.
- Resource catalog marca qualidade, risco de direitos e escopos OAuth quando aplicavel.
- Session report e deterministic/no-LLM, bom para privacidade e explicabilidade.

### Principal fragilidade

A recencia precisa distinguir "quando sincronizei" de "quando a partida aconteceu". Historico completo e uma decisao correta para baseline pessoal; so nao deve contaminar a ideia de "ultimos 90 dias" ou "partidas recentes".

## 8. Dados, estado e privacidade

### Pontos fortes

- Dexie local-first sem backend.
- Token OAuth fica fora do backup.
- Cache Chess.com guarda sinais agregados, nao PGN completo.
- Backup inclui dados duraveis que o usuario cria, inclusive Study links e onboarding, conforme testes atuais.

### Lacunas

- Validacao de importacao deve evoluir de "campos existem" para "shape e valores sao seguros".
- Politica de persistencia deve ser acionada em momento de valor.
- Documentacao de privacidade precisa alinhar Study links no backup.

## 9. Testes e QA

### Cobertura boa

- 409 testes passando.
- Testes cobrem dominio, plano, storage, backup, OAuth, Lichess, Chess.com e fluxos de treino.
- Browser manual automatizado nesta auditoria nao encontrou erro de console nem overflow horizontal nos fluxos verificados.

### Gaps

- Falta smoke Playwright contra build de producao com service worker e offline.
- Falta teste adversarial para URLs maliciosas em backup.
- Falta teste que separe recencia de partida vs recencia de sync no Chess.com.
- Falta CI para rodar lint/test/build fora da maquina local.

## 10. Documentacao e memoria

### Boa base

O projeto tem memoria incomum para um app pequeno: AGENTS, PLANO, arquitetura, privacidade, specs e relatorios. Isso ajuda muito os agentes a nao romperem regras inquebraveis.

### Problema atual

O volume de docs criou drift: alguns arquivos descrevem pendencias ja resolvidas ou dizem algo diferente dos testes atuais.

### Correcoes documentais imediatas

- `docs/architecture/system.md`: marcar fila/cooldown como concluida; manter smoke PWA e backup validation como pendentes.
- `docs/privacy/privacy-and-data.md`: corrigir frase de backup para dizer que Study links entram; tokens e caches seguem fora.
- `PLANO.md`: separar claramente "resolvido nesta passada" de "ainda pendente".

## 11. Visual, UX e UI

### Evidencia Playwright

Foram gerados screenshots em:

- `output/playwright/analysis-complete-desktop-2026-06-15-hoje.png`
- `output/playwright/analysis-complete-desktop-2026-06-15-progresso.png`
- `output/playwright/analysis-complete-desktop-2026-06-15-config.png`
- `output/playwright/analysis-complete-mobile-2026-06-15-hoje.png`
- `output/playwright/analysis-complete-mobile-2026-06-15-progresso.png`
- `output/playwright/analysis-complete-mobile-2026-06-15-config.png`
- `output/playwright/analysis-complete-audit-2026-06-15.json`

### Resultado

- Desktop 1280 px: sem overflow horizontal nos fluxos verificados.
- Mobile 390 px: sem overflow horizontal nos fluxos verificados.
- Console: sem erros ou warnings na amostra.
- Alvos clicaveis pequenos: nao detectados pelo script na amostra.

### Avaliacao

A tela Hoje e o ponto forte: clara, pratica, visualmente boa e com hierarquia de treino. Config tambem esta clara. Progresso vazio e o ponto mais fraco por ser passivo demais.

## 12. Seguranca

### Bom

- Sem `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `DOMParser`, `eval` ou `new Function` encontrados na busca.
- OAuth usa PKCE, state e escopos limitados.
- Tokens nao entram no backup.
- `target="_blank"` usa `rel="noopener noreferrer"` nos links verificados.
- `window.open` tenta zerar `opener`.

### A fechar

- Allowlist de URLs antes de abrir dados persistidos/importados.
- Headers de seguranca no deploy.
- Validacao profunda de backup.
- Politica clara de storage persistente.

## 13. Plataforma, performance e release

### Estado atual

Build Vite passou e gerou assets dentro do esperado. O PWA esta configurado e o service worker foi emitido. Nao houve warning de chunk grande no build observado.

### Gaps operacionais

- Nao existe `.github/workflows` no repo.
- `vercel.json` ainda e minimo.
- Falta teste de update/offline do service worker em preview de producao.

### Recomendacao

Adicionar um workflow simples com `npm ci`, `npm run lint`, `npm run test`, `npm run build`. Depois, adicionar smoke Playwright de PWA como job separado ou script local obrigatorio antes de P5.

## 14. Roadmap de fechamento

### Corte 1 - Fechar verdade dos dados e docs

1. Corrigir semantica de recencia Chess.com.
2. Atualizar docs de privacidade, arquitetura e PLANO.
3. Adicionar testes para recencia e documentar a regra.

### Corte 2 - Endurecer importacao e links externos

1. Criar allowlist central de URL Lichess.
2. Validar URLs em backup importado.
3. Aplicar allowlist antes de renderizar/abrir links persistidos.
4. Testar backup malicioso e URL externa inesperada.

### Corte 3 - PWA/offline real

1. Mover `persist()` para acao de valor.
2. Adicionar banner/estado offline.
3. Criar smoke Playwright de build+preview+offline.
4. Documentar contrato offline.

### Corte 4 - Release defensivo

1. Adicionar headers no `vercel.json`.
2. Adicionar CI.
3. Conferir `npm audit` em CI.

### Corte 5 - Manutencao sem pressa

1. Extrair hooks do `useAppState`.
2. Melhorar estado vazio de Progresso.
3. Separar CSS por superficie quando houver mudanca visual relacionada.

## 15. Quick wins

- Corrigir frase de `docs/privacy/privacy-and-data.md:50`.
- Marcar `providerQueue` como concluido em `docs/architecture/system.md`.
- Adicionar CTA "Ir para Hoje" em `src/ui/Progress.tsx:91`.
- Adicionar teste de backup com URL nao-Lichess.
- Adicionar `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy` no `vercel.json`.
- Criar `.github/workflows/ci.yml` com lint/test/build.
- Guardar no README o contrato: "offline para app e dados locais; rede necessaria para Lichess/Chess.com".

## 16. O que nao fazer agora

- Nao iniciar P4/P5, backend, D1, Worker ou sync multi-dispositivo.
- Nao criar tabuleiro proprio.
- Nao adicionar engine, sugestao de lance ou ajuda durante partida ao vivo.
- Nao fazer scraping.
- Nao copiar conteudo, taxonomia, texto ou asset de app pago anterior.
- Nao transformar a tela inicial em landing page.
- Nao adicionar analytics, paywall, anuncios ou telemetria.
- Nao refatorar `useAppState` em bloco unico sem necessidade de produto.

## 17. Perguntas abertas ao dono

1. Para diagnostico, "recente" deve significar data da partida, data do sync ou uma combinacao ponderada?
2. Links de Study devem ser tratados oficialmente como dado duravel do usuario no texto de privacidade? O codigo e os testes atuais dizem que sim.
3. A promessa offline desejada e apenas abrir app/dados locais, ou tambem permitir algum tipo de sessao local sem Lichess?
4. O deploy pessoal em Vercel ja deve receber headers de seguranca agora, ou isso fica como pre-P5 obrigatorio?
5. Voce quer CI ja no proximo corte, antes de qualquer feature nova?

## 18. Apice de prioridade

Se for para escolher apenas tres proximas tarefas:

1. Corrigir recencia Chess.com e linguagem de evidencia.
2. Endurecer backup/URLs persistidas.
3. Adicionar smoke PWA offline + atualizar docs conflitantes.

Essas tres aumentam a confiabilidade real do app sem abrir escopo novo e sem trair a regra "pessoal primeiro, comunidade depois".

