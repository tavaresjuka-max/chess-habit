# Relatorio Codex - Contestacao da Analise Geral (2026-06-10)

Autor: Codex. Escopo: contestar/verificar `docs/review/relatorio-claude-analise-geral-2026-06-10.md` contra o repositorio real e estimar a exequibilidade dos cortes propostos.

## 1. Veredito geral do relatorio do Claude

**Nota: 8.0/10.** O relatorio do Claude e majoritariamente correto no diagnostico de direcao: a visao 2026-06-10 exige mais curso, progresso, resiliencia de dados e governanca do que o app atual entrega. Ele tambem acerta R-1 como prioridade tecnica real, mas subestima a complexidade de "export automatico" e nao audita o schema Dexie com profundidade suficiente. Seu ponto mais fraco e tratar alguns gaps como quase inexistentes quando ja ha sementes relevantes no codigo, especialmente metas/sinais de progresso e fechamento de dia.

## 2. Resultado real do gate

Rodado em 2026-06-10 dentro do repositorio.

| Comando | Resultado real |
|---|---|
| `npm run lint` | OK. ESLint em `src/**/*.{ts,tsx}` sem erros. |
| `npm run test` | OK. Vitest: **41 arquivos**, **250 testes** passados, duracao 5.12s. |
| `npm run build` | OK. `tsc -b && vite build`; Vite transformou **1791 modulos**; PWA gerou **10 entradas** de precache, `dist/sw.js`, `dist/workbox-9c191d2f.js`, `dist/manifest.webmanifest`. Bundle principal: `478.67 kB` bruto / `144.39 kB` gzip; CSS `10.75 kB` bruto / `2.72 kB` gzip. |

O gate do Claude estava correto quanto aos numeros principais: o repo continua com 250 testes em 41 arquivos e build PWA verde (`docs/review/relatorio-claude-analise-geral-2026-06-10.md:8-9`).

## 3. Tabela achado-a-achado

| Achado | Veredito Codex | Evidencia |
|---|---|---|
| A-1 README stale | **CONCORDO, corrigido.** A correcao e suficiente. O README agora diz que a ferramenta pessoal esta funcional, P0-P3 concluidas e Metodo Professor Lemos implementado. | `README.md:3-21`; `memory/decisions.md:411-413`. |
| A-2 `memory/state.md` stale | **CONCORDO, corrigido.** A memoria agora registra metodo concluido, visao registrada e rodada de debate aberta. | `memory/state.md:3`; `memory/state.md:83-92`. |
| A-3 spec vigente obsoleto | **CONCORDO.** `AGENTS.md` e `PLANO.md` ainda apontam para o spec de 2026-06-06, enquanto o estado real inclui specs/planos posteriores e implementacao do metodo em 9 commits. O ponto precisa ser resolvido por promocao de um spec vigente pos-metodo, nao por apagar historico. | `AGENTS.md:17`; `PLANO.md:5-6`; `memory/state.md:83-87`; `docs/research/plano-implementacao-metodo-lichess-DIRETOR.md:143`; `docs/research/plano-implementacao-metodo-lichess-DIRETOR.md:216-220`. |
| A-4 ADR-006 nome do arquivo vs conteudo | **CONCORDO.** O conteudo ja diz "Com OAuth Opt-in", mas o caminho ainda e `ADR-006-adaptativo-sem-oauth-sem-engine.md`. | `docs/adr/ADR-006-adaptativo-sem-oauth-sem-engine.md:1`; `docs/adr/ADR-006-adaptativo-sem-oauth-sem-engine.md:20-27`. |
| A-5 numeracao Onda 2 | **CONCORDO, corrigido.** A secao esta numerada 1-6; nao encontrei resto da duplicacao ali. | `memory/decisions.md:191-200`; `memory/decisions.md:411-413`. |
| A-6 LICENSE ausente | **CONCORDO.** O repo declara AGPL-3.0 planejada, mas `Get-ChildItem -Name LICENSE*` nao retornou arquivo. Isso bloqueia colaboracao publica limpa. | `README.md:6`; `PLANO.md:63-64`; checagem local `LICENSE*` sem saida. |
| C-4 plataforma colaborativa vs P4/P5 congeladas | **CONCORDO.** Nao e contradicao de produto, e sequenciamento. Mas a governanca formal ainda diz P0->P5 sem representar o trabalho pos-P3 ja feito. | `docs/VISAO.md:41-42`; `AGENTS.md:63`; `memory/state.md:96-98`; `memory/decisions.md:127-135`. |
| C-5 tom adulto vs iniciante | **CONCORDO.** A tensao e leve e resolvivel: simples nao e infantil. O repo tem as duas orientacoes. | `AGENTS.md:52-53`; `memory/decisions.md:277`; `docs/pedagogy/metodo-professor-lemos.md:38`; `src/domain/coach/sessionMessage.ts:12`. |
| C-6 bandas de rating vs metas sem rating | **CONCORDO, com C-1 ja fechado.** Bandas sao boas para ordenar conteudo; metas do aluno devem ser horas/esforco/sinais. O metodo consolidado ja rejeita rating como porta de avanco. | `docs/VISAO.md:20-23`; `docs/VISAO.md:46-54`; `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md:22-31`; `memory/decisions.md:385-395`. |
| G-1 curso completo 0->teto | **CONCORDO.** A documentacao tem escada ate 2200+, mas o codigo so aceita `LearnerBand = '0-800' | '800-1200'` e o catalogo usa essas duas bandas. | `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md:54-66`; `src/domain/types.ts:59`; `src/domain/sources/resourceCatalog.ts:97-99`; `src/domain/sources/catalogSkills.ts:16`. |
| G-2 placement | **CONCORDO.** Existe configuracao manual de faixa e importacao de sinais, mas nao questionario estruturado nem algoritmo de placement por banda/bloco. | `docs/VISAO.md:12-13`; `src/ui/Config.tsx:119-129`; `src/app/state.ts:338-356`; `src/app/state.ts:389-414`. |
| G-3 importar atividade livre | **CONCORDO, parcialmente implementavel com base existente.** Reconciliacao de puzzles existe; importacao geral de atividade recente creditada contra plano/trilhas ainda nao. | `src/app/trainingLogFlow.ts:31-49`; `src/app/trainingLogFlow.ts:112-128`; `docs/VISAO.md:28-30`. |
| G-4 relatorio pos-sessao + proxima razao | **INCOMPLETO.** O Claude acerta que falta um relatorio de treinador robusto, mas subestima o que ja existe: fechamento do dia ja resume blocos, tempo, feedback, puzzles e proxima sessao. Falta explicar "porque Y" com causalidade de sinais. | `src/domain/coach/dayCompletionSummary.ts:26-45`; `src/domain/coach/dayCompletionSummary.ts:133-142`; `src/ui/Today.tsx:346-361`. |
| G-5 painel amplo de progresso | **CONCORDO, com nuance.** Falta tela dedicada; porem ja ha card de metas/sinais em Hoje. | `src/ui/App.tsx:25-45`; `src/app/state.ts:74`; `docs/pedagogy/metodo-professor-lemos.md:124-130`; `src/domain/coach/sessionMilestones.ts:47-99`. |
| G-6 recompensas por esforco | **CONCORDO.** Ha diplomas/metas, mas nao ha dominio `achievements`, badges por esforco nem spec de recompensa. A busca por arquivos `achiev|badge|reward|recompensa` so encontrou `memory/progress.md`; as ocorrencias de "badge" no CSS sao visuais de metodo, nao sistema de conquistas. | `docs/VISAO.md:20-23`; `memory/decisions.md:390-392`; `src/domain/method/diplomas.ts:32-116`; busca local `rg --files | rg "achiev|badge|reward|recompensa"` -> apenas `memory/progress.md`. |
| G-7 metas semanais/mensais | **CONCORDO.** O dominio atual calcula sessoes/horas totais e checkpoints 6/12/24/48h; nao agrega por semana/mes nem 100/500/1000h. | `src/domain/coach/sessionMilestones.ts:47-63`; `src/domain/coach/sessionMilestones.ts:130-142`; `docs/VISAO.md:47-49`. |
| G-8 pesquisa continua | **CONCORDO.** O processo existe de fato, mas e ad-hoc e registrado em memoria/docs, nao em workflow formal versionado. | `memory/state.md:205-237`; `docs/research/sources.md:704-718`; `prompts/README.md:18`. |
| G-9 UX parecida Lichess/Chess.com | **CONCORDO.** Houve polish, mas nao vi auditoria especifica contra essas referencias. | `memory/progress.md:79-83`; `docs/VISAO.md:18`; `docs/review/ux-ui-community-audit/relatorio-gemini-ux-ui-comunidade-2026-06-07.md:21-36`. |
| G-10 plataforma colaborativa open-source | **CONCORDO.** P5 congelada, LICENSE ausente, renomeacao publica pendente. | `PLANO.md:43-44`; `README.md:32-34`; `README.md:46-48`; `PLANO.md:63-69`. |
| G-11 sync multi-dispositivo | **CONCORDO.** P4 esta congelada e o risco de dados locais e real. A arquitetura futura existe em docs, mas nao no runtime. | `memory/decisions.md:393-395`; `docs/architecture/sync.md:9-16`; `src/infra/storage/db.ts:46-87`; `src/infra/storage/appData.ts:188-201`. |

## 4. R-1: avaliacao tecnica detalhada

**Veredito:** R-1 deve entrar antes de feature nova, mas o corte proposto pelo Claude esta subespecificado. `navigator.storage.persist()` e necessario, nao suficiente; "export automatico" sem estrategia de restore, permissao de arquivo e fallback por browser vira uma falsa sensacao de seguranca.

Evidencia do repo:

- O app salva tudo em Dexie/IndexedDB local (`src/infra/storage/db.ts:46-87`).
- Ja existe export manual JSON, disparado por botao em Config (`src/ui/Config.tsx:54-64`; `src/ui/Config.tsx:188-195`).
- O export manual omite tokens por design, mas tambem omite `chesscomMonthSignals`, `lichessOAuthTokens` e `lichessStudies`; isso e correto para token, discutivel para links de Study se o objetivo for restauracao completa (`src/infra/storage/appData.ts:188-201`; `docs/privacy/privacy-and-data.md:50-52`).
- Nao existe `navigator.storage.persist()` nem `navigator.storage.persisted()` no codigo (`rg` local sem ocorrencia relevante).
- Nao encontrei fluxo de import/restore do backup; existe export, clear e manual signals, mas nao importacao de JSON (`src/ui/Config.tsx:188-203`; `src/app/state.ts:855-924`).

Fontes oficiais atuais consultadas:

- A MDN registra que dados de origem sao **best-effort por padrao** e que o origin pode optar por storage persistente via `navigator.storage.persist()`; storage persistente so e removido por acao do usuario nas configuracoes do browser: [MDN Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
- A documentacao do Dexie sobre StorageManager recomenda nao pedir permissao cedo demais e lembra que Chrome/Firefox tratam `persist()` de modos diferentes: [Dexie StorageManager](https://dexie.org/docs/StorageManager).
- O Lichess confirma regra operacional viva: uma requisicao por vez; apos HTTP 429, esperar pelo menos 1 minuto: [Lichess API Tips](https://lichess.org/page/api-tips). O spec oficial lista puzzle activity/dashboard/replay como endpoints existentes: [lichess API spec](https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml).

**Custo estimado de R-1:** M, 4 a 6 commits atomicos com gate verde.

1. `feat(storage): request persistent storage with visible status`
   - Modulos: novo `src/infra/storage/persistence.ts`, `src/app/state.ts`, `src/ui/Config.tsx`, testes unitarios com mocks de `navigator.storage`.
   - Risco: compatibilidade; `persist()` pode retornar `false` sem prompt.

2. `feat(storage): track backup health`
   - Modulos: Dexie v5 ou tabela `backupMeta`; UI em Config/Hoje; testes.
   - Campos: `lastBackupAt`, `lastBackupRecordCount`, `lastBackupVersion`, talvez `lastRestoreTestAt`.

3. `feat(storage): backup export package v1`
   - Modulos: `appData.ts`, testes de privacidade.
   - Incluir `schemaVersion`, tabelas nao sensiveis, checksum simples, e manter token fora. Decidir se `lichessStudies` entra; token nunca entra.

4. `feat(storage): restore/import backup`
   - Sem import, backup e so tranquilizante. Deve validar schema, rejeitar token, preservar dados mais novos quando possivel.

5. `feat(storage): automatic backup opt-in`
   - Melhor opcao: "ativar backup automatico" com File System Access API quando suportada; fallback: lembrete e download gerado por gesto do usuario. Download silencioso periodico e fragil e pode ser bloqueado/irritante.

6. `test(storage): data safety regression suite`
   - Cobrir export sem token/PGN, restore idempotente e migracao.

**Opcao melhor que o Claude nao viu:** tratar R-1 como "Data Safety v1", nao como duas chamadas soltas. O minimo responsavel e: persistencia + backup versionado + restore testado + metadata para futuro sync. Usar Lichess Study como veiculo de backup nao parece boa primeira opcao: o ADR permite `study:write` para Studies de treino, nao para armazenar estado do app; restaurar depois provavelmente exigiria `study:read`, que o ADR explicitamente deixa para fase futura se houver justificativa (`docs/adr/ADR-006-adaptativo-sem-oauth-sem-engine.md:20-27`).

### Dexie v4 e merge-key para P4

**Resposta curta:** o schema v4 tem parte dos ingredientes, mas ainda nao esta pronto para sync robusto por registro.

O que ajuda:

- A maioria das tabelas tem chave primaria estavel: `profile.id`, `plans.date`, `logs.id`, `signals.id`, `weaknesses.id`, `methodTracks.id`, `pendingItems.id`, `diplomaAttempts.id` (`src/infra/storage/db.ts:62-83`).
- Varias entidades possuem `updatedAt`: perfil, logs, estudos, method tracks, pending items, diploma attempts (`src/domain/types.ts:72`; `src/domain/types.ts:107-108`; `src/domain/types.ts:124`; `src/domain/types.ts:148`; `src/domain/types.ts:232`; `src/domain/method/types.ts:19`; `src/domain/method/types.ts:38-39`; `src/domain/method/types.ts:52-53`).
- Ja existe merge local simples por id para logs (`src/app/trainingLogFlow.ts:131-143`).

O que falta para sync:

- `signals` nao tem `updatedAt` no tipo de dominio; o id e gerado por fonte/tipo/data/indice, e `replaceSignalsForSource` apaga todos os sinais da fonte antes de inserir os novos (`src/infra/storage/appData.ts:75-79`; `src/infra/storage/appData.ts:245-249`). Isso e ruim para merge multi-dispositivo.
- `weaknesses` usa `id = tag` e `replaceWeaknesses` limpa a tabela inteira (`src/infra/storage/appData.ts:99-103`; `src/infra/storage/appData.ts:261-265`). Para sync, melhor persistir snapshots diagnosticados com origem e data, ou tratar fraqueza derivada como cache reconstruivel.
- Nao ha `clientId`, `deviceId`, `deletedAt`, tombstones, `syncVersion` nem vetor de origem por registro. A arquitetura futura menciona `SyncEvent`, `clientId` e `seq`, mas isso ainda so existe em doc (`docs/architecture/sync.md:12-16`; `docs/architecture/sync.md:36-38`; `docs/architecture/interfaces.md:83-91`).
- `pendingItems` usa ids com `Date.now()` (`src/domain/method/pendingItems.ts:28`; `src/domain/method/pendingItems.ts:59`), aceitavel localmente, mas para sync e melhor padronizar UUID/ULID com `clientId`.

Mudanca recomendada antes da P4: Dexie v5 com `syncMeta` por registro ou envelope de dominio:

```ts
type SyncMeta = {
  clientId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  version: number;
};
```

Aplicar primeiro em `logs`, `pendingItems`, `diplomaAttempts`, `methodTracks`, `plans` e `profile`; tratar `weaknesses` e caches externos como derivaveis sempre que possivel.

## 5. Os 5 pontos mais fracos do relatorio

1. **A propria secao 10 ainda pergunta itens que o cabecalho ja fechou.** O relatorio marca C-1, C-2, C-3 e R-1 como fechados no update (`docs/review/relatorio-claude-analise-geral-2026-06-10.md:13-20`), mas ainda pergunta teto, meta e badges na secao 10 (`docs/review/relatorio-claude-analise-geral-2026-06-10.md:272-280`). A memoria tambem tem nota stale dizendo que C-1/C-2/C-3 seguem pendentes (`memory/decisions.md:417-419`), apesar da decisao fechada estar logo antes (`memory/decisions.md:383-395`).

2. **Subestima o que ja existe em progresso.** Ele esta certo que falta tela Progresso, mas o dominio ja calcula horas, sessoes, feedback, acerto de puzzle, tendencia e tema forte/fraco (`src/domain/coach/sessionMilestones.ts:47-99`; `src/domain/coach/sessionMilestones.ts:201-232`; `src/domain/coach/sessionMilestones.ts:398-430`). Isso reduz o tamanho inicial do Corte 4.

3. **R-1 e descrito como barato demais.** `navigator.storage.persist()` e uma mitigacao, mas nao resolve perda por acao do usuario, troca de maquina, perfil corrompido, falta de restore ou backup preso no mesmo origin. O repo so tem export manual (`src/ui/Config.tsx:54-64`) e nenhum import/restore.

4. **Nao avaliou o schema Dexie para sync.** A conclusao "sync por registro" aparece em decisoes e arquitetura, mas a implementacao ainda usa replaces destrutivos para sinais/fraquezas (`src/infra/storage/appData.ts:75-103`) e nao tem `clientId`/tombstone/event log no runtime (`docs/architecture/sync.md:36-38`; `src/infra/storage/db.ts:62-83`).

5. **Nao chamou atencao para um risco de API ja no codigo: Chess.com sem bound de recencia aparente.** `importChesscomSignals` percorre todos os `archives.archives` retornados (`src/infra/chesscom/chesscomClient.ts:46-63`), enquanto `AGENTS.md` exige acesso serial com bound de recencia (`AGENTS.md:39-41`). Cache ajuda, mas o primeiro import pode ser grande demais para a regra do projeto.

## 6. Divida tecnica e riscos que o relatorio nao viu

- **Bound de recencia Chess.com precisa ser enforceado em codigo.** Hoje a API e serial, mas itera todos os arquivos mensais retornados (`src/infra/chesscom/chesscomClient.ts:50-63`). Isso pode violar o contrato de recencia do projeto (`AGENTS.md:39-41`) e aumentar risco de 429.
- **Rate limiting externo nao e centralizado.** Lichess transforma 429 em erro com `retryAfterMs` (`src/infra/lichess/puzzleActivity.ts:23-30`), mas nao vi uma fila global que garanta "uma requisicao por vez" entre jogos, puzzle activity, dashboard, replay e study (`src/app/trainingLogFlow.ts:117-128`; `src/infra/lichess/study.ts:91-147`).
- **Backup sem restore e incompleto.** Export manual existe, mas sem import/restore e sem metadata de versao ele nao fecha R-1 (`src/ui/Config.tsx:54-64`; `src/infra/storage/appData.ts:188-201`).
- **`LearnerBand` esta duro em 2 bandas.** Expandir para 2200 vai tocar dominio, UI, catalogo, testes e talvez dados salvos (`src/domain/types.ts:59`; `src/ui/Config.tsx:119-129`; `src/domain/sources/resourceCatalog.ts:97-99`).
- **Docs futuras ainda carregam contratos antigos.** `docs/architecture/interfaces.md` ainda usa `value: unknown` em exemplo de `TrainingSignal`, contradizendo a decisao de tipos estritos aceita no projeto (`docs/architecture/interfaces.md:32-38`; `AGENTS.md:78-79`).
- **A restricao desta tarefa impediu atualizar `docs/research/sources.md`.** Como R-1 toca PWA/storage, eu consultei MDN/Dexie oficiais e citei neste relatorio; nao editei `sources.md` porque o prompt mandou editar apenas este arquivo.

## 7. Exequibilidade por corte

| Corte | Tamanho | Commits atomicos provaveis | Arquivos/modulos tocados | Riscos e dependencias |
|---|---:|---|---|---|
| 0 - Higiene e decisoes | S/M | 3-5 | `AGENTS.md`, `PLANO.md`, `memory/project.md`, `docs/superpowers/specs/*`, ADR-006, `LICENSE` | LICENSE exige confirmacao juridica final do dono/copyright holder. Promover spec do metodo deve preservar historico e nao reabrir P4/P5. |
| 1 - Resiliencia de dados (R-1) | M | 4-6 | `src/infra/storage/*`, `src/app/state.ts`, `src/ui/Config.tsx`, testes de storage/UI, talvez Dexie v5 | Deve incluir restore, nao so export. File System Access e limitado; fallback precisa ser honesto. Preparar sync meta sem abrir P4. |
| 2 - Relatorio pos-sessao + metas semanais/mensais | M | 3-5 | `src/domain/coach/dayCompletionSummary.ts`, `sessionMilestones.ts`, `Today.tsx`, novos testes | Depende pouco de API. Deve explicar "porque" sem fingir causalidade quando so ha feedback/tempo. |
| 3 - Importacao de atividade livre | M/L | 4-7 | `src/app/trainingLogFlow.ts`, `src/infra/lichess/*`, `src/infra/chesscom/*`, `src/domain/method/pendingItems.ts`, UI Hoje/Config | Precisa regra de recencia, credito contra plano, rate queue e privacidade. Risco de inflar importacao externa. |
| 4 - Painel Progresso | L | 5-8 | nova view `Progress`, `src/app/state.ts`, `sessionMilestones.ts`, dominio de habilidades/temas, CSS, testes React | Depende de uma taxonomia de habilidade mais estavel e da expansao de bandas se mirar 2200. |
| 5 - Recompensas por esforco | L | spec + 4-7 | novo `src/domain/achievements/*`, Dexie table, UI de badges, testes | **Recusaria executar hoje sem spec.** C-3 aprova direcao, nao regras. Risco TDAH/ruido e confusao com diplomas. |
| 6 - Placement | L/XL | 6-10 | onboarding/questionario, `LearnerBand`, diagnostico, `Config`, possivel nova view, testes | Precisa mapa de curso/bandas antes. Sem tabuleiro proprio: calibracao so por Lichess + autorrelato, entao a confianca deve ser comunicada. |
| 7 - Curriculo 1200-2200 denso | XL | 10+ | `src/domain/types.ts`, catalogo, recursos, metodo, docs pedagogicos, plano, UI | Depende de pesquisa/curadoria e risco legal maior. Deve ser separado em "spine de dominio 0-2200" e "conteudo denso". |

### Ordem proposta

Eu manteria **Corte 0 -> Corte 1** como prioridade. Depois eu faria uma fatia pequena do Corte 7 antes dos outros: **expandir o modelo de bandas/curso para 0-2200 sem ainda preencher todo o conteudo**. Isso evita construir Progresso, Placement e Badges em cima de `LearnerBand` 0-1200 que ja se sabe obsoleto (`src/domain/types.ts:59`; `docs/VISAO.md:46`).

Sequencia recomendada:

1. Corte 0: higiene canonica e LICENSE apos confirmacao.
2. Corte 1: Data Safety v1.
3. Corte 7a: spine de curso/bandas 0-2200, sem prometer rating.
4. Corte 2: relatorio pos-sessao + agregacoes semanais/mensais.
5. Corte 4: Progresso MVP.
6. Corte 3: importacao livre, com rate queue.
7. Corte 6: placement.
8. Corte 5: badges apenas apos spec.
9. Corte 7b: curriculo 1200-2200 denso em ondas.

### Corte recusado hoje

Eu recusaria executar **Corte 5 - Badges/recompensas** hoje. A decisao C-3 aprova o conceito, mas exige spec antes (`memory/decisions.md:390-392`), e o metodo consolidado ja marca gamificacao vazia como anti-pattern (`docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md:197`).

Perguntas bloqueantes para o spec de badges:

- Quais categorias existem: horas, sessoes, puzzles, pendencias, backup, constancia, revisao de erro?
- Quais thresholds iniciais e como eles escalam: 1h/6h/12h/24h, 100h/500h/1000h, semanal/mensal?
- Badges sao retroativos aos logs existentes?
- Badge aparece onde: Hoje, Progresso, Config, toast, ou area propria?
- O usuario pode ocultar/mutar recompensas?
- Ha alguma perda, streak quebrada ou badge que expira? Minha recomendacao: nao.
- Como separar badge de esforco de diploma de habilidade?
- Badge influencia plano? Minha recomendacao: nao, apenas celebra/organiza.
- Quais eventos sao sensiveis e entram no backup/export?
- Qual linguagem evita ansiedade, vergonha e promessa de rating?

## 8. Respostas as 7 perguntas abertas da secao 10

1. **Teto do curso:** 2200 + autonomia. Ja esta fechado em `docs/VISAO.md:46` e `memory/decisions.md:385-386`. Implementacao: expandir tipos e docs para bandas pedagogicas, mas comunicar como organizacao de conteudo, nao promessa de rating.

2. **Meta escondida:** marcos elasticos, nao numero absoluto. Ja esta fechado em `docs/VISAO.md:47-49`. Os checkpoints 6/12/24h continuam uteis como microciclo local; 100/500/1000h viram horizonte semanal/mensal.

3. **Ordem dos cortes 2-6:** eu moveria Data Safety primeiro, depois spine 0-2200, depois relatorio/metas, Progresso, importacao livre, Placement e por ultimo Badges. O motivo e dependencia de modelo: Progresso/Placement/Badges precisam saber o que e uma banda/trilha antes de virarem UI.

4. **R-1 basta por quanto tempo antes de P4:** para ferramenta pessoal em um unico dispositivo, persist + backup/restore testado pode bastar por semanas ou meses. P4 vira necessidade quando houver uso real em dois dispositivos, mais de 100h de historico, ou quando o dono estiver confiando no app como registro unico.

5. **Placement:** questionario + historico bastam para v1. Bateria de puzzles pode vir depois via Lichess externo e autorrelato/reconciliacao; sem tabuleiro proprio, nao da para fazer avaliacao controlada completa dentro do app. A UI deve mostrar confianca baixa/media/alta.

6. **Badges para TDAH:** precisa pesquisa curta antes. O desenho seguro e recompensa positiva por processo, sem perda, ranking, moeda, streak punitivo ou notificacao insistente. Badges devem reforcar identidade de treino, nao substituir aprendizagem.

7. **Algo factual errado no relatorio:** nao encontrei erro grosseiro no inventario principal. Encontrei incompletudes: R-1 barato demais, progresso existente subestimado, schema Dexie nao auditado, Chess.com sem bound de recencia no codigo e secao 10 perguntando decisoes que o proprio update ja fechou.

## 9. Top-3 recomendacoes tecnicas inegociaveis

1. **Data Safety antes de feature nova.** Implementar persistencia, backup versionado, restore e testes de privacidade antes de Progresso, Placement ou Badges.

2. **Expandir o modelo de curso antes das telas novas.** `LearnerBand` e catalogo ainda vivem em 0-1200; se o curso agora e 0-2200 + autonomia, a espinha de dominio precisa mudar primeiro.

3. **Centralizar chamadas externas e invariantes de privacidade.** Nenhuma importacao nova sem fila/rate policy, bound de recencia, fontes oficiais registradas, testes sem PGN/token e linguagem de hipotese.
