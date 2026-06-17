# Analise Completa do Sistema — Gemini

> Lente auxiliar consolidada por Codex a partir da execucao local e do subagente "Gemini". Enfase: UX, testes, mobile e coerencia da experiencia.

## 1. Resumo executivo

O `lichess-tutor` ja parece um app de estudo real, nao uma landing page nem um prototipo vazio. O primeiro uso funciona, a tela Hoje da uma acao clara, a linguagem e adulta e o produto tem uma vantagem forte: tira o usuario da paralisia e manda treinar em recursos oficiais.

**Nota geral: 7,5/10.**

Principais forcas:

- UX principal direta: "proximo passo" no topo.
- Mobile testado com boa legibilidade e sem overflow visivel.
- Smoke PWA cobre desktop/mobile e passou apos resolver conflito de porta.
- Microcopy do Professor Lemos e pratica, sem infantilizar.
- O app ja e util mesmo sem P4 sync.

Principais riscos:

- Bug visual/funcional no feedback do bloco seguinte.
- Estados de progresso podem confundir depois de treino com 0 minuto.
- Coverage vermelho e teste flakey reduzem confianca de mudancas.
- Configuracoes/OAuth ainda mostram detalhes tecnicos demais para beta publico.
- Acessibilidade precisa de gate real.

O que mais precisa melhorar antes de beta: confianca da experiencia. O usuario precisa acreditar que o app registra exatamente o que ele fez, que datas fazem sentido e que seus dados nao vao sumir.

## 2. Metodologia

Arquivos lidos:

- Contexto obrigatorio: `AGENTS.md`, memorias, specs, roadmap e `package.json`.
- UI: `App.tsx`, `Welcome.tsx`, `Onboarding.tsx`, `Today.tsx`, `PlanBlockCard.tsx`, `TutorCard.tsx`, `PendingReviewCard.tsx`, `Progress.tsx`, `Config.tsx`, `index.css`.
- Testes app/E2E: `src/app/*.test.tsx`, `e2e/*.spec.ts`, `playwright.config.ts`.
- Infra relevante: OAuth, storage, backup, provider queue.

Comandos:

- `npm run lint`: passou.
- `npm test`: flakey na primeira execucao, verde na segunda.
- `npm run build`: passou.
- `npm run coverage`: falhou.
- `npm run smoke:pwa`: passou 26/26 apos limpar porta ocupada.
- `node tmp/audits/Codex/manual-ui-audit.mjs`: passou.

Fluxos manuais testados:

- Onboarding sem conta.
- Comeco rapido.
- Plano inicial.
- Hoje em desktop e mobile.
- Timer de treino.
- Feedback.
- Progresso.

Viewports:

- `1280x800`.
- `390x844`.

Fontes oficiais pesquisadas:

- Lichess API e API Tips.
- Chess.com Published Data API/PubAPI Help.
- MDN Service Worker/PWA e CSP.
- Vercel headers/config.
- GNU AGPLv3.
- Cloudflare Workers/D1 para P4.

Limitacoes:

- Nao houve teste com usuario real.
- Nao rodei leitor de tela.
- OAuth real nao foi concluido com conta externa.

## 3. Notas por area

| Area | Nota | Motivo |
|---|---:|---|
| Produto | 8,4 | Valor real ja no primeiro uso; beta precisa promessa publica mais clara. |
| UX | 7,7 | Fluxo central bom; bug de feedback e estados de progresso quebram polimento. |
| Diagnostico | 7,5 | Entradas de conta e fallback sem dados sao bons; explicabilidade pode melhorar. |
| Plano de treino | 7,7 | Acionavel e curto; precisa impedir registro enganoso. |
| Metodo 5 trilhas | 7,9 | Aparece no produto sem virar aula teorica; bug de revisao pesa. |
| Arquitetura | 7,9 | Boa para UX iterativa; estado assíncrono merece guards. |
| Codigo TypeScript | 8,0 | Estrito e claro. |
| Testes | 6,8 | Bastante cobertura funcional; coverage vermelho e flake incomodam. |
| Privacidade | 8,3 | UI comunica local-first; export/import ainda precisa defesa. |
| Seguranca | 7,3 | Bom baseline; falta UX segura para OAuth/backup. |
| PWA/offline | 7,7 | Smoke passou; conflito de porta e screenshot side effects sao workflow. |
| Integracoes externas | 7,6 | Oficiais e bem contidas. |
| Performance | 7,5 | Fluxo manual rapido; historicos grandes podem pesar. |
| Acessibilidade | 6,8 | Sem bloqueio visual, mas sem auditoria com axe/teclado. |
| Mobile | 8,0 | Melhor area de UX nesta rodada. |
| Documentacao | 7,0 | Muita informacao, algumas instrucoes antigas. |
| Prontidao beta publico | 5,9 | UX boa para beta fechado, nao para publico. |

## 4. Bugs encontrados

### Bugs confirmados

### BUG-1 — Feedback aparece no bloco errado

- Severidade: P1
- Status: confirmado
- Area afetada: UX, logs, confianca.
- Como reproduzir: completar o primeiro bloco e clicar "Bom".
- Resultado atual: o proximo bloco aparece com o grupo "Como foi o treino?".
- Resultado esperado: o proximo bloco aparece pronto para iniciar.
- Evidencia: screenshots manuais em desktop e mobile.
- Arquivos/linhas relevantes: `src/ui/PlanBlockCard.tsx:33`, `src/ui/PlanBlockCard.tsx:133`, `src/ui/Today.tsx:280`.
- Possivel causa: estado `isRating` preservado no componente hero.
- Proposta de solucao: `key={heroBlock.id}` e/ou reset por `useEffect`.
- Teste recomendado: Playwright no fluxo "Hoje iniciar bloco timer feedback".
- Risco de regressao: alto.

### BUG-2 — Revisao pendente usa calendario errado em GMT-3

- Severidade: P1
- Status: confirmado
- Area afetada: UX de constancia.
- Como reproduzir: criar pendencia entre 21h e 23h locais em `America/Sao_Paulo`.
- Resultado atual: pode agendar um dia a frente do esperado.
- Resultado esperado: amanha local.
- Evidencia: probe Node com `TZ=America/Sao_Paulo`.
- Arquivos/linhas relevantes: `src/domain/method/pendingItems.ts:8`, `src/domain/method/pendingItems.ts:18`, `src/domain/method/pendingItems.ts:124`.
- Possivel causa: data UTC + mutacao local.
- Proposta de solucao: data local de estudo como primitiva.
- Teste recomendado: fixture de timezone.
- Risco de regressao: medio.

### BUG-3 — Coverage vermelho deixa a qualidade ambigua

- Severidade: P1/P2
- Status: confirmado
- Area afetada: testes.
- Como reproduzir: `npm run coverage`.
- Resultado atual: falhas em testes de UI/estado.
- Resultado esperado: cobertura verde ou suite separada.
- Evidencia: coverage falhou mesmo com timeout maior.
- Arquivos/linhas relevantes: `src/app/preserveProgress.test.tsx`, `src/app/trainingFlow.test.tsx`, `src/app/oauthCallback.test.tsx`.
- Possivel causa: instrumentacao + timers + IndexedDB.
- Proposta de solucao: isolar teste DOM, fake timers e DB por arquivo.
- Teste recomendado: coverage em CI limpo.
- Risco de regressao: alto.

### BUG-4 — Smoke PWA depende de porta fixa livre

- Severidade: P3
- Status: confirmado.
- Area afetada: workflow de QA.
- Como reproduzir: deixar algo ouvindo em `127.0.0.1:4188` e rodar `npm run smoke:pwa`.
- Resultado atual: falha antes dos testes.
- Resultado esperado: porta parametrizavel ou preflight claro.
- Evidencia: primeira rodada falhou; apos encerrar Vite preview, 26/26 passou.
- Arquivos/linhas relevantes: `playwright.config.ts:18`, `playwright.config.ts:24`.
- Possivel causa: `reuseExistingServer: false` e porta fixa.
- Proposta de solucao: `PWA_SMOKE_PORT` ou script preflight.
- Teste recomendado: smoke com porta customizada.
- Risco de regressao: baixo.

### BUG-5 — Progresso apos bloco de 0 minuto pode parecer contraditorio

- Severidade: P3
- Status: suspeito/observado manualmente.
- Area afetada: UX, progresso.
- Como reproduzir: concluir primeiro bloco rapidamente e abrir Progresso.
- Resultado atual: Hoje mostra 1/2 blocos, Progresso pode dizer "Sem treinos ainda".
- Resultado esperado: mensagem que explique que houve bloco concluido sem tempo registrado, ou impedir 0 min.
- Evidencia: `tmp/audits/Codex/manual-mobile-progress.jpg`.
- Arquivos/linhas relevantes: `src/app/useTrainingActions.ts`, `src/domain/training/trainingSession.ts`, `src/ui/Progress.tsx`.
- Possivel causa: duracao arredondada para 0 ou criterio de sessao completa.
- Proposta de solucao: definir contrato de treino minimo ou "feito fora do app".
- Teste recomendado: concluir bloco sem timer e verificar Progresso.
- Risco de regressao: medio.

### Suspeitas

### BUG-6 — Mensagens tecnicas de OAuth podem afastar usuario comum

- Severidade: P3
- Status: suspeito de UX.
- Area afetada: onboarding/config.
- Como reproduzir: abrir Configuracoes e ler escopos.
- Resultado atual: termos como `puzzle:read` e `study:write` aparecem/precisam ser entendidos.
- Resultado esperado: transparencia em linguagem humana, com detalhes tecnicos em disclosure.
- Evidencia: leitura de UI/config.
- Arquivos/linhas relevantes: `src/ui/Config.tsx`, `src/infra/lichess/oauth.ts:23`.
- Possivel causa: prioridade em transparencia tecnica.
- Proposta de solucao: copy em duas camadas.
- Teste recomendado: teste de conteudo e review com usuario nao tecnico.
- Risco de regressao: baixo.

## 5. Inconsistencias e conflitos

- UX promete "proximo passo", mas bug mostra feedback antes da acao.
- P4/P5 estao autorizadas, mas algumas docs ainda dizem congeladas.
- Nome publico ainda mistura `Rotina`, `Rotina de Treino Lichess`, `Lichess Tutor` e `lichess-tutor`.
- PWA smoke e bom, mas workflow deixa alteracoes de screenshots/porta ocupada como ruido de auditoria.
- README tem disclaimer/AGPL; app publico ainda precisa trazer isso para a experiencia.

## 6. Simplificacoes possiveis

| O que simplificar | Por que esta complexo | Ganho esperado | Risco | Ordem |
|---|---|---|---|---|
| Estado do card por bloco | Estado local atravessa entidade | Menos bug de UX | Baixo | 1 |
| Texto de OAuth | Tecnico demais | Confiança sem assustar | Baixo | 2 |
| Progress semantics | Bloco, sessao e minuto competem | Progresso mais claro | Medio | 3 |
| Smoke output | Porta e screenshots sujam auditoria | QA mais previsivel | Baixo | 4 |
| Nomes publicos | Variantes demais | Menos confusao | Baixo | 5 |

## 7. Melhorias propostas

Melhorias urgentes:

- Corrigir feedback herdado.
- Corrigir calendario de pendencias.
- Fazer coverage passar.
- Ajustar texto/estado de progresso para 0 minuto.

Melhorias antes do beta:

- Acessibilidade com axe e teclado.
- Microcopy de OAuth em linguagem humana.
- Disclaimer e AGPL visiveis.
- Estados de erro de rede por fonte.
- Testes mobile de import/backup/offline.

Melhorias pos-beta:

- Revisao semanal com resumo simples.
- Preferencias de duracao.
- Indicador de confianca do diagnostico por fonte.

Melhorias opcionais:

- Botao "registrei fora do app".
- Export visual de progresso semanal.

## 8. Seguranca e privacidade

Do ponto de vista da UX, a seguranca esta razoavelmente bem comunicada: local-first, backup manual, OAuth opt-in. Tecnicamente, nao encontrei violacao das regras inquebraveis.

O cuidado principal e nao transformar transparencia tecnica em confusao. O usuario precisa saber: o app nao ve partidas ao vivo, nao sugere lance, nao guarda PGN completo e nao envia token para servidor. Para P5, isso deve aparecer em texto publico curto.

## 9. UX real: dores e vantagens

O app ajuda a criar constancia: sim, principalmente por reduzir escolha.

O diagnostico e compreensivel: parcialmente; precisa dizer "por que pensei isso" de forma curta.

O plano e acionavel: sim, a melhor parte do app.

O usuario sabe o que fazer agora: sim na tela Hoje; menos em Config/OAuth.

Friccao desnecessaria: termos tecnicos, bug de feedback, progresso 0 min.

Linguagem adulta: sim.

Util mesmo incompleto: sim para o dono e beta fechado.

O que faria abandonar:

- Registro errado.
- Perda de dados.
- Importacao lenta sem feedback.
- Confusao entre Chess.com diagnostico e Lichess treino.

## 10. Perguntas, duvidas e respostas

### Perguntas ao dono

1. O app deve permitir concluir sem abrir o destino?
2. O beta precisa parecer simples para nao tecnico ou pode assumir usuario de xadrez mais tecnico?
3. O nome publico deve evitar totalmente "Lichess"?
4. Qual nivel de acessibilidade e obrigatorio antes do beta?

### Duvidas tecnicas

1. Progresso deve contar bloco concluido com 0 minuto?
2. O feedback deve sempre vir apos timer iniciado?
3. O app deve pedir `study:write` so quando criar Study?

### Respostas inferidas

- Feedback deve pertencer ao bloco, nao ao card. Confianca: alta.
- Bloco de 0 minuto deve ser excecao explicita, nao caminho comum. Confianca: media.
- Mobile esta suficientemente bom para beta fechado apos corrigir bug do card. Confianca: media.

## 11. Plano de acao recomendado

| Acao | Prioridade | Esforco | Impacto | Dependencias | Criterio de pronto |
|---|---|---:|---|---|---|
| Remount/reset do card hero | P1 | P | Alto | Nenhuma | Bloco 2 sem feedback |
| Corrigir data local | P1 | P | Alto | Helper data | Teste TZ |
| Decidir treino 0 min | P2 | P/M | Medio | Produto | Progresso coerente |
| Coverage verde | P1 | M | Alto | Test setup | Comando passa |
| A11y/keyboard | P2 | M | Medio | Playwright/axe | Sem violacoes criticas |
| UX OAuth | P2 | P | Medio | Copy | Usuario entende escopos |
| P5 UI legal | P2 | P | Alto | Nome/copy | Disclaimer/fonte visiveis |

## 12. Veredito final

O sistema e bom e ja da vontade de usar. Ainda nao esta pronto para beta publico porque confiança de UX e confiança de QA precisam subir.

O proximo corte mais inteligente e uma passada de polimento funcional: corrigir feedback herdado, data local, progresso 0 min, coverage e mensagens de OAuth/backup. A primeira decisao do dono: beta publico sera simples/local-first ou vai esperar a promessa multi-dispositivo?

