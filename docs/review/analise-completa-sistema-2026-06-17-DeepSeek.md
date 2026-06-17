# Analise Completa do Sistema — DeepSeek

> Lente auxiliar consolidada por Codex a partir da execucao local e do subagente "DeepSeek". Enfase: seguranca, privacidade, integracoes, concorrencia e riscos de P4/P5.

## 1. Resumo executivo

O `lichess-tutor` nao apresenta violacao evidente das regras inquebraveis: nao ha scraping, nao ha tabuleiro proprio, nao ha escopos de jogo, nao ha PGN bruto persistido evidente e tokens OAuth ficam fora do backup. O desenho local-first e sensato. Os riscos principais estao em bordas: concorrencia, import grande, storage local corrompido, rate limit e promessa futura de E2EE.

**Nota geral: 7,2/10.**

Principais forcas:

- Escopos OAuth limitados a `puzzle:read` e `study:write`.
- Headers de seguranca presentes em `vercel.json`.
- CSP restringe `connect-src` a self, Lichess e Chess.com.
- Backup exclui tokens e caches sensiveis.
- Chess.com e Lichess sao acessados via APIs oficiais.

Principais riscos:

- Race multi-fonte pode gerar diagnostico/plano inconsistente.
- `clearAllData` sem cancelamento pode violar expectativa de apagar tudo.
- `Retry-After` nao e respeitado.
- Import de backup le arquivo inteiro.
- E2EE P4 ainda precisa especificacao criptografica real.

Antes de beta publico, o sistema precisa de hardening defensivo, nao de features novas.

## 2. Metodologia

Arquivos lidos:

- `AGENTS.md`, memorias, roadmap P4/P5, `package.json`.
- `src/infra/lichess/oauth.ts`, `games.ts`, `study.ts`, `puzzleActivity.ts`, `puzzleDashboard.ts`.
- `src/infra/chesscom/chesscomClient.ts`, `extractSignals.ts`.
- `src/infra/http/providerQueue.ts`.
- `src/infra/storage/appData.ts`, `backup.ts`, `db.ts`, `autoBackup.ts`.
- `src/app/oauthFlow.ts`, `useDiagnosisActions.ts`, `useBackupActions.ts`.
- `vercel.json`, `vite.config.ts`, `README.md`, `LICENSE`.

Comandos executados:

- `npm run lint`: passou.
- `npm test`: falhou inicialmente, passou depois.
- `npm run build`: passou.
- `npm run coverage`: falhou.
- `npm run smoke:pwa`: passou apos liberar porta 4188.
- Buscas `rg` para escopos proibidos, PGN, tokens, logs e nomes publicos.

Fluxos manuais:

- Primeiro uso.
- Treino no Lichess.
- Feedback.
- Progresso.
- Mobile/desktop.

Viewports:

- Desktop `1280x800`.
- Mobile `390x844`.

Fontes oficiais:

- Lichess OpenAPI e API Tips.
- Chess.com PubAPI Help/Published Data API.
- MDN CSP e Service Worker.
- Cloudflare Workers/D1.
- Vercel config.
- GNU AGPLv3.

Limitacoes:

- Nao houve pentest, fuzzing profundo nem OAuth real.
- P4 sync nao esta implementado para teste.

## 3. Notas por area

| Area | Nota | Motivo |
|---|---:|---|
| Produto | 7,9 | Bom produto, mas P5 cria superficie legal/privacidade nova. |
| UX | 7,1 | Boa no fluxo feliz; bordas de erro ainda fracas. |
| Diagnostico | 7,0 | Modelo bom, mas concorrencia entre fontes e ponto critico. |
| Plano de treino | 7,3 | Sem live help; bug de feedback afeta integridade. |
| Metodo 5 trilhas | 7,4 | Bom, mas data local quebra revisao. |
| Arquitetura | 7,7 | Boa separacao; falta coordenador transacional para actions. |
| Codigo TypeScript | 7,9 | Tipado e legivel. |
| Testes | 6,5 | Muitos testes; coverage vermelho. |
| Privacidade | 8,6 | Melhor area: token/PGN/PII bem tratados. |
| Seguranca | 7,6 | Bons headers/PKCE; hardening pendente. |
| PWA/offline | 7,3 | Funciona; storage eviction e backup precisam copy/guardas. |
| Integracoes externas | 7,4 | Oficiais; rate limit pode melhorar. |
| Performance | 7,0 | Historico completo Lichess via `text()` pode pesar. |
| Acessibilidade | 6,8 | Nao auditada formalmente. |
| Mobile | 7,4 | Fluxo central ok; import grande pode pesar mais no mobile. |
| Documentacao | 7,2 | Boa, mas conflitos atuais. |
| Prontidao beta publico | 5,6 | Hardening e P5 ainda insuficientes. |

## 4. Bugs encontrados

### Bugs confirmados

### BUG-1 — Calendario de pendencias mistura UTC e horario local

- Severidade: P1
- Status: confirmado
- Area afetada: revisao, metodo.
- Como reproduzir: `TZ=America/Sao_Paulo` a noite.
- Resultado atual: datas podem saltar para dois dias a frente.
- Resultado esperado: calendario local previsivel.
- Evidencia: probe Node.
- Arquivos/linhas relevantes: `src/domain/method/pendingItems.ts:8`, `src/domain/method/pendingItems.ts:18`, `src/domain/method/pendingItems.ts:124`.
- Possivel causa: `toISOString` + `setDate`.
- Proposta de solucao: date helper local injetavel.
- Teste recomendado: TZ regression.
- Risco de regressao: medio.

### BUG-2 — Estado de feedback atravessa blocos

- Severidade: P1
- Status: confirmado
- Area afetada: integridade de treino.
- Como reproduzir: concluir bloco 1 com feedback.
- Resultado atual: bloco 2 aparece pedindo feedback.
- Resultado esperado: bloco 2 inicia limpo.
- Evidencia: screenshots manuais.
- Arquivos/linhas relevantes: `src/ui/PlanBlockCard.tsx:33`, `src/ui/Today.tsx:280`.
- Possivel causa: componente reutilizado sem key/reset.
- Proposta de solucao: key/reset por `block.id`.
- Teste recomendado: E2E.
- Risco de regressao: alto.

### BUG-3 — `providerQueue` nao respeita `Retry-After`

- Severidade: P2
- Status: confirmado por codigo e docs.
- Area afetada: rate limit.
- Como reproduzir: mock 429 com `Retry-After: 180`.
- Resultado atual: cooldown fixo de 60s.
- Resultado esperado: respeitar header quando maior.
- Evidencia: `src/infra/http/providerQueue.ts:8`, `src/infra/http/providerQueue.ts:30`.
- Arquivos/linhas relevantes: `src/infra/http/providerQueue.ts:30`.
- Possivel causa: implementacao do minimo Lichess.
- Proposta de solucao: parse header, max com minimo, jitter/backoff.
- Teste recomendado: 429 com segundos e data.
- Risco de regressao: baixo.

### BUG-4 — Backup import pode travar aba com arquivo grande

- Severidade: P2
- Status: confirmado por codigo.
- Area afetada: backup/import.
- Como reproduzir: selecionar arquivo muito grande.
- Resultado atual: `File.text()` carrega tudo antes da validacao.
- Resultado esperado: limite antes de ler.
- Evidencia: `src/ui/Config.tsx:111`.
- Arquivos/linhas relevantes: `src/ui/Config.tsx:111`, `src/infra/storage/backup.ts:240`.
- Possivel causa: sem threat model publico ainda.
- Proposta de solucao: max bytes e streaming/early reject se necessario.
- Teste recomendado: arquivo grande.
- Risco de regressao: baixo.

### BUG-5 — OAuth pending corrompido nao e tratado

- Severidade: P3
- Status: confirmado por codigo.
- Area afetada: auth recoverability.
- Como reproduzir: storage invalido no callback.
- Resultado atual: `JSON.parse` sem catch.
- Resultado esperado: limpar storage e retornar erro recuperavel.
- Evidencia: `src/app/oauthFlow.ts:117`.
- Arquivos/linhas relevantes: `src/app/oauthFlow.ts:110-118`.
- Possivel causa: caso raro nao coberto.
- Proposta de solucao: `try/catch`.
- Teste recomendado: storage invalido.
- Risco de regressao: baixo.

### BUG-6 — `npm run coverage` falha

- Severidade: P1/P2
- Status: confirmado.
- Area afetada: CI/QA.
- Como reproduzir: rodar coverage.
- Resultado atual: falha sob instrumentacao.
- Resultado esperado: coverage verde.
- Evidencia: comando falhou.
- Arquivos/linhas relevantes: testes de app.
- Possivel causa: timing/IndexedDB/fetch mocks.
- Proposta de solucao: isolamento.
- Teste recomendado: repetir em CI.
- Risco de regressao: alto.

### Suspeitas

### BUG-7 — Race multi-fonte pode sobrescrever diagnostico

- Severidade: P1
- Status: suspeito forte.
- Area afetada: diagnostico.
- Como reproduzir: resolver Chess.com e Lichess em ordem invertida.
- Resultado atual: cada sync grava fraquezas/plano.
- Resultado esperado: merge unico.
- Evidencia: `src/app/useDiagnosisActions.ts:128-162`, `src/app/useDiagnosisActions.ts:295`.
- Arquivos/linhas relevantes: `src/app/useDiagnosisActions.ts:128`, `src/app/useDiagnosisActions.ts:161`.
- Possivel causa: secao critica sem lock.
- Proposta de solucao: mutex/singleflight.
- Teste recomendado: promises controladas.
- Risco de regressao: alto.

### BUG-8 — Clear/import nao invalida operacoes antigas

- Severidade: P2
- Status: suspeito.
- Area afetada: privacidade.
- Como reproduzir: limpar dados durante sync.
- Resultado atual: callback antigo pode gravar depois.
- Resultado esperado: wipe e absoluto para operacoes anteriores.
- Evidencia: `src/app/useBackupActions.ts:115`.
- Arquivos/linhas relevantes: `src/app/useBackupActions.ts:115`.
- Possivel causa: sem operation epoch.
- Proposta de solucao: epoch/abort.
- Teste recomendado: sync resolvendo apos clear.
- Risco de regressao: medio/alto.

### BUG-9 — Lichess historico completo em memoria

- Severidade: P3
- Status: suspeito de performance.
- Area afetada: mobile/performance.
- Como reproduzir: usuario Lichess com historico muito grande.
- Resultado atual: `await response.text()` antes de parsear NDJSON.
- Resultado esperado: streaming incremental se contas grandes virarem alvo.
- Evidencia: `src/infra/lichess/games.ts:101`.
- Arquivos/linhas relevantes: `src/infra/lichess/games.ts:101`.
- Possivel causa: simplicidade e app pessoal.
- Proposta de solucao: parser streaming ou limite opt-in.
- Teste recomendado: fixture NDJSON grande.
- Risco de regressao: medio.

## 5. Inconsistencias e conflitos

- P4 sync prometido como E2EE, mas implementacao/contrato ainda nao existe.
- Cloudflare D1 cifra em repouso/transporte, mas isso nao e E2EE de app.
- `study:write` e permitido, mas pode ser excessivo no login inicial para publico.
- `sourcemap: true` e aceitavel em open-source, mas e decisao operacional a explicitar.
- Docs antigas ainda congelam P4/P5.
- Nome publico nao centralizado.

## 6. Simplificacoes possiveis

| O que simplificar | Por que esta complexo | Ganho esperado | Risco | Ordem |
|---|---|---|---|---|
| Threat model P4 | Decisoes espalhadas | Sync sem falsa seguranca | Alto se mal feito | 1 |
| Rate limit helper | Cooldown fixo | Menos ban/rate issue | Baixo | 2 |
| Operation epoch | Actions async independentes | Privacidade/clear confiavel | Medio | 3 |
| Backup migrator | Versao e parse juntos | Evolucao segura | Medio | 4 |
| OAuth consent | Escopos juntos | Menos receio publico | Baixo | 5 |

## 7. Melhorias propostas

Melhorias urgentes:

- Corrigir data e card.
- Fazer coverage passar.
- Criar mutex de diagnostico.
- Criar epoch para clear/import.

Melhorias antes do beta:

- `Retry-After`.
- Limite de import.
- OAuth storage robusto.
- Decidir sourcemaps.
- Definir P4 E2EE por escrito.
- Separar `study:write` se o dono quiser consentimento minimo progressivo.

Melhorias pos-beta:

- Streaming NDJSON.
- Rate limit cross-tab.
- Auditoria de dependencias e CSP mais estrita se necessario.

Melhorias opcionais:

- Indicador local de storage persistente.
- Pagina de privacidade curta dentro do app.

## 8. Seguranca e privacidade

Tokens:

- Armazenados localmente e excluidos do backup.
- Recomendacao: nunca sincronizar tokens em P4.

Logs:

- Nenhum log sensivel evidente em `src`.

PGNs:

- Chess.com PGN e transiente.
- Lichess export evita PGN/moves.
- Study PGN contem plano gerado, nao partida do usuario.

PII:

- Username publico e necessario, mas comunidade P5 nao deve adicionar perfil social por padrao.

OAuth:

- PKCE e state existem.
- `study:write` padrao e permitido, mas pode ser just-in-time.

Dados locais:

- Backup bom, mas import precisa tamanho/migracao.

Sync futuro E2EE:

- Precisa de passphrase/segredo local ou chave gerada no dispositivo.
- Derivar de login/username publico nao basta.
- Servidor nunca deve receber token OAuth, plaintext ou chave.

Riscos P5:

- Expor AGPL/disclaimer.
- Evitar promessas de rating.
- Manter doacao externa sem vantagem funcional.

Nao encontrei violacao direta das regras inquebraveis.

## 9. UX real: dores e vantagens

Seguranca tambem e UX. O usuario precisa entender que o app nao trapaceia, nao joga por ele, nao le dados privados e nao depende de servidor para manter rotina. Essa promessa esta quase la, mas beta publico exigira textos mais visiveis e bordas mais robustas.

Vantagens: local-first, plano claro, destino oficial.

Dores: erro de rede, perda de dados locais, import grande, permissao OAuth ampla, confusao com nome.

## 10. Perguntas, duvidas e respostas

### Perguntas ao dono

1. A chave E2EE vira de passphrase, segredo do aparelho ou outro mecanismo?
2. `study:write` deve ser separado de `puzzle:read`?
3. Sourcemaps publicos sao decisao consciente?
4. O que exatamente entra no sync P4?
5. Backup manual basta para beta inicial?

### Duvidas tecnicas

1. Como invalidar sync apos clear?
2. Como resolver conflitos e delecoes no D1?
3. O cache Chess.com mensal sincroniza ou fica local?
4. Qual limite maximo de backup importavel?

### Respostas inferidas

- Tokens nunca sincronizam. Confianca: alta.
- E2EE precisa segredo nao enviado ao servidor. Confianca: alta.
- `study:write` just-in-time melhora percepcao publica. Confianca: media.
- Sourcemaps sao aceitaveis se o projeto e AGPL, mas devem ser decisao explicita. Confianca: media.

## 11. Plano de acao recomendado

| Acao | Prioridade | Esforco | Impacto | Dependencias | Criterio de pronto |
|---|---|---:|---|---|---|
| Threat model E2EE | P1 beta | M/G | Alto | Decisao de chave | Documento aprovado |
| Mutex diagnostico | P1 | M | Alto | Testes | Race coberta |
| Epoch clear/import | P1/P2 | M | Alto | App actions | Clear absoluto |
| Retry-After | P2 | P | Medio | Header parser | Teste 429 |
| Backup size guard | P2 | P | Medio | UX copy | Arquivo grande rejeitado |
| OAuth storage catch | P3 | P | Baixo | Nenhuma | Teste storage invalido |
| Decidir sourcemaps | P3 | P | Medio | Operacao | Config documentada |

## 12. Veredito final

O sistema e seguro o bastante para continuar como ferramenta pessoal, mas nao esta pronto para beta publico. O bloqueio nao e um desastre; e uma lista objetiva de hardening.

O que impediria beta: sync E2EE sem threat model, bugs de data/card, coverage vermelho, race/clear sem teste, identidade publica incompleta. O proximo corte mais inteligente e M3/M4 de robustez. A primeira decisao do dono deve ser o modelo de chave E2EE ou, se sync nao bloquear beta, declarar beta local-first com backup manual.

