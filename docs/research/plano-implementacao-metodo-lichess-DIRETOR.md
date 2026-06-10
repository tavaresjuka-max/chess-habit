# Relatorio Diretor - Plano Ideal de Implementacao do Metodo Lichess

Data de referencia: 2026-06-10

Relatorios comparados:

- `docs/research/plano-implementacao-metodo-lichess-DEEPSEEK.md`
- `docs/research/plano-implementacao-metodo-lichess-GEMINI.md`
- `docs/research/plano-implementacao-metodo-lichess-CODEX.md`

Fontes oficiais rechecadas nesta consolidacao:

- Lichess API Tips
- Lichess Study API
- Lichess Study PGN import API
- Lichess Puzzle Activity API
- Lichess Puzzle Dashboard API
- Lichess Puzzle Replay API

## 1. Veredito diretor

Chegamos a consenso suficiente. Nao precisa de mais uma rodada com outras IAs antes de implementar.

A proxima etapa nao e mais "pensar o metodo"; e codar o primeiro corte com gates fortes. Depois do
primeiro corte implementado, vale fazer uma rodada de revisao, mas como **code review/bug hunt**,
nao como nova rodada de planejamento estrategico.

Resposta ideal:

1. Tratar as 5 trilhas como uma camada de metodo sobre o loop atual.
2. Comecar por `Tratamento de Pendencias` e `Calculo Ponte 800-1200`.
3. Usar Lichess como destino e telemetria, sem criar tabuleiro proprio.
4. Melhorar o Study do dia antes de criar studies permanentes por trilha.
5. Fazer diplomas como checkpoint/soft gate, nao bloqueio duro.
6. Manter clean-room: o repo guarda abstracoes, slugs, URLs, status e telemetria; nao guarda texto,
   FEN, PGN, comentario, variante ou exercicio de livro protegido.

## 2. Notas das tres analises

| IA | nota | melhor contribuicao | principal problema | decisao diretora |
|---|---:|---|---|---|
| DeepSeek | 8.1/10 | Melhor visao de arquitetura de drills, time budget, pendencias e commits atomicos. | Overengineering: quer muitos `WeaknessTag`, `Stage`, `TrainingBlock`, `trainingCatalog` em Dexie e studies por trilha cedo demais. | Aproveitar drills, metricas e ordem atomica; rejeitar troca grande da espinha atual. |
| Gemini | 8.4/10 | Melhor pedagogia: active recall, metacognicao, perguntas-guia, microcopy e ritual de sessao. | Alguns pontos violam ou tensionam o produto: app "avisar" lance de abertura, bloqueio duro de diplomas, rotas Lichess incertas e `gamebook` cedo demais. | Aproveitar UX, microcopy e rituais; transformar bloqueios em soft gates e tirar qualquer ajuda tipo tabuleiro/engine. |
| Codex | 8.8/10 | Melhor aderencia ao repo atual: `MethodTrack`, `PendingTrainingItem`, `DiplomaAttempt`, Dexie v4 e Study do dia melhorado. | Conservador: precisa absorver mais microcopy, ritual pedagogico e ordem de sessao do Gemini/DeepSeek. | Usar como espinha tecnica do plano final. |

Nota da resposta ideal consolidada: **9.2/10**.

## 3. Onde houve consenso real

As tres respostas concordam nos pontos que importam:

- O app deve continuar sendo orquestrador, nao tabuleiro.
- `Tratamento de Pendencias` e o maior ganho imediato.
- `Calculo Ponte` precisa existir para sair do "primeiro lance que vi".
- `Defesa Ativa` fecha lacuna real entre 1000-1400, mas entra depois da seguranca minima.
- `Abertura Como Plano` deve ser principio antes de nome/repertorio.
- `Diplomas` devem medir progresso sem rating.
- Lichess deve ser usado por deep link, Puzzle Activity/Dashboard/Replay e Study privado.
- Thresholds 80/50 sao bons o bastante para iniciar:
  - >=80: avanca;
  - 50-79: revisa;
  - <50: volta para guided/explain.

## 4. Precisa de mais uma rodada com outras IAs?

Nao agora.

Motivos:

1. A divergencia nao e falta de informacao; e escolha de escopo.
2. DeepSeek, Gemini e Codex ja cobriram os tres eixos necessarios: tecnico, pedagogico e repo-real.
3. As perguntas abertas restantes sao de produto/execucao, nao de pesquisa:
   - automatico ou manual?
   - soft gate ou hard gate?
   - Study diario ou studies permanentes?
   - quantos campos persistir?
4. A regra do projeto e executar fases pequenas e verificaveis. Mais uma rodada agora tende a gerar
   mais sofisticacao, nao mais clareza.

Rodada recomendada depois:

- Depois do primeiro corte implementado, pedir uma rodada de **review/bug hunt** para DeepSeek,
  Gemini e Codex, olhando codigo, testes e UX real.

## 5. O melhor de cada analise

### DeepSeek entra no plano final com:

- A ideia de drills como molde pedagogico.
- O foco em `pendency-treatment`, `thinking-system`, `defense-checklist` e `diagnostic-profile`.
- A agenda 1/3/7/14 dias para pendencias.
- O time budget por sessao curta.
- A visao de commits atomicos e testaveis.
- A metrica de pendencias resolvidas.

### Gemini entra no plano final com:

- O principio pedagogico central: active recall + metacognicao.
- As perguntas-guia do Professor Lemos.
- A UX de visita do dia -> proposta -> abrir Lichess -> voltar -> feedback -> revisao.
- A microcopy original por trilha.
- A ideia de diplomas como momento emocional e pedagogico.
- O alerta contra ilusao de competencia.

### Codex entra no plano final com:

- A decisao de nao substituir a espinha atual.
- `MethodTrackId` como camada acima de `WeaknessTag`.
- `PendingTrainingItem` para fila local de pendencias.
- `DiplomaAttempt` para checkpoints.
- Campos opcionais em `PlanBlock`, preservando planos antigos.
- Dexie v4 para dados novos.
- Study do dia melhorado em vez de studies permanentes no primeiro corte.
- Testes por dominio, storage, React e infra Lichess.

## 6. O que ficou fora e por que

### 6.1 Nao criar cinco Studies permanentes agora

DeepSeek queria Studies por trilha desde o inicio. Gemini tambem flertou com Study customizado
forte. Isso fica para depois.

Contra-argumento:

- A API tem limite de 30 studies/dia e Study tem limite de 64 capitulos.
- O repo ja tem `createDailyStudy`.
- Criar Studies fixos cedo aumenta risco de studies vazios/orfaos e complexidade de retry.
- O melhor primeiro corte e melhorar o Study do dia com trilha/pergunta/criterio.

Decisao: **Study do dia melhorado agora; studies permanentes por trilha so depois de uso real.**

### 6.2 Nao trocar `PlanBlock` por `TrainingBlock`

DeepSeek propoe um modelo novo mais amplo. A ideia e boa no abstrato, mas agressiva demais para o
repo atual.

Contra-argumento:

- `PlanBlock` ja esta integrado em UI, logs, Study, storage e testes.
- Trocar a espinha amplia risco sem entregar mais valor imediato.
- Campos opcionais resolvem o problema com menor blast radius.

Decisao: **manter `PlanBlock` e adicionar campos opcionais `methodTrackId`, `methodStepId`,
`pendingItemId`, `masteryTarget`.**

### 6.3 Nao inflar `WeaknessTag` com diagnosticos psicologicos e microtaxonomias

DeepSeek sugeriu tags como `single-candidate`, `defense-passive-only`, `psychological-collapse`.

Contra-argumento:

- Muitas tags novas exigem detector, destinos, testes, copy e migracao.
- Alguns nomes sao inferencias psicologicas fortes demais.
- O app deve falar como hipotese curta, nao diagnostico fechado.

Decisao: **usar `MethodTrackId` para trilhas e adicionar no maximo `defensive-move` se o catalogo
precisar. Calculo fica como trilha, nao como fraqueza.**

### 6.4 Nao fazer diploma como bloqueio duro

Gemini propos bloquear evolucao por 3 dias se falhar no diploma.

Contra-argumento:

- O dono e a propria validacao e deve manter controle.
- Hard gate pode gerar atrito sem necessidade.
- O objetivo e estudo pessoal, nao sistema escolar.

Decisao: **diploma e soft gate: recomenda revisar, mostra lacunas, mas nao trava o dono.**

### 6.5 Nao fazer o app "avisar" erro de abertura durante treino

Gemini sugeriu que o app avise se desenvolvimento/rei seguro foi violado.

Contra-argumento:

- Isso se aproxima de tabuleiro proprio, engine ou ajuda de lance.
- O app nao deve sugerir lance, especialmente perto de jogo vivo.
- A revisao de abertura deve acontecer pos-partida e em checklist autoral.

Decisao: **Abertura Como Plano vira checklist pos-partida e bloco de estudo; nao vira avaliador de
lances em tempo real.**

### 6.6 Nao depender de `gamebook`/interactive lesson no primeiro corte

A API permite importar PGN com modos como `practice`, `conceal`, `gamebook`, mas isso nao garante
que nosso PGN autoral vire uma licao interativa rica sem trabalho adicional.

Contra-argumento:

- O modo normal do Study ja e suficiente para o primeiro valor.
- `gamebook` exige validacao visual e mobile.
- Falha no import de PGN gamebook pode atrapalhar um fluxo que hoje ja funciona.

Decisao: **modo normal primeiro; `gamebook`/`conceal` fica para experimento posterior.**

### 6.7 Nao baixar/processar Lichess Puzzle Database agora

O dataset e limpo e forte, mas nao e necessario para o primeiro corte.

Contra-argumento:

- O app ja abre Lichess e usa telemetria oficial.
- Dataset local adiciona tamanho, pipeline, filtros e manutencao.
- O risco de virar tabuleiro proprio aumenta.

Decisao: **usar Puzzle Activity/Dashboard/Replay + deep links agora; Puzzle DB local fica opcional
futuro.**

## 7. Plano final do que deve ser implementado

### Corte 1 - Camada de metodo local

Criar:

- `src/domain/method/methodTracks.ts`
- `src/domain/method/mastery.ts`
- `src/domain/method/pendingItems.ts`
- `src/domain/method/diplomas.ts`
- `src/domain/method/selectMethodTrack.ts`

Tipos:

- `MethodTrackId`
- `MethodTrack`
- `PendingTrainingItem`
- `DiplomaId`
- `DiplomaAttempt`

Extensao retrocompativel em `PlanBlock`:

- `methodTrackId?: MethodTrackId`
- `methodStepId?: string`
- `pendingItemId?: string`
- `masteryTarget?: 'advance' | 'review' | 'regress'`

Nao adicionar muitos `WeaknessTag`. No primeiro corte, adicionar so `defensive-move` se necessario.

### Corte 2 - Pendencias

Regra:

- feedback `hard` cria sugestao de pendencia;
- perdas em puzzle reconciliado criam pendencia agregada por tema;
- dashboard/replay reforca pendencias por tema;
- pendencia tem `dueAt` em 1/3/7/14 dias;
- pendencia resolvida nao volta como vencida.

Persistencia:

- Dexie v4 com `pendingItems`.

UX:

- card "Pendencia de hoje";
- botao discreto "Guardar como pendencia" apos feedback dificil;
- opcao de concluir/deferir pendencia.

### Corte 3 - Calculo Ponte

Regra:

- `calculation-bridge` aparece quando foco for `fork`, `discovered`, `mate-in-2`, `conversion` ou
  pendencias de calculo.

Pergunta-guia:

1. Qual e a ameaca dele?
2. Quais sao meus 2 candidatos?
3. Qual e a melhor resposta dele?
4. A posicao final ficou melhor, igual ou pior?

Destinos:

- `/training/fork`
- `/training/discoveredAttack`
- `/training/mateIn2`
- `/training/deflection`
- `/training/quietMove`
- Puzzle Streak se ja existir no catalogo como recurso aprovado.

### Corte 4 - Defesa Ativa

Regra:

- `active-defense` aparece quando houver `blunder-rate`, `hanging-piece`, perdas em `defensiveMove`
  ou pendencia manual de perigo nao visto.

Pergunta-guia:

1. Estou em perigo?
2. Qual e a ameaca concreta?
3. Posso neutralizar?
4. Posso trocar para aliviar?
5. Posso criar contra-jogo?

Destinos:

- `/training/defensiveMove`
- `/training/hangingPiece`
- `/training/trappedPiece`
- `/training/quietMove`

Adicionar slugs apenas via allowlist manual e testes de formato.

### Corte 5 - Abertura Como Plano

Regra:

- entra depois de seguranca/tatica minima ou quando sinais de abertura forem fortes;
- nao vira repertorio longo;
- nome da abertura so depois de revisar principios.

Checklist:

- centro;
- desenvolvimento;
- rei seguro;
- plano que nasce da estrutura.

Destino:

- recursos de abertura ja aprovados no catalogo;
- Analysis/Explorer so pos-partida, nunca partida viva.

### Corte 6 - Diplomas

Modelo:

- `peao`: >=90%;
- `torre`: >=80%;
- `rei`: >=70-80 por secao.

Regra:

- soft gate, nao bloqueio duro;
- falhou: gerar plano de revisao;
- passou: permitir avancar, mas sem promessa de rating.

UX:

- integrar ao `SessionMilestonesCard`;
- mostrar "avancar", "revisar" ou "voltar para guiado".

### Corte 7 - Study do dia melhorado

Reaproveitar `createDailyStudy`.

Melhorar `buildDailyPlanStudyPgn` para incluir:

- trilha;
- pergunta-guia;
- tarefa;
- stop rule;
- criterio de conclusao;
- destino Lichess.

Nao incluir:

- texto de livro;
- FEN/PGN protegido;
- comentarios copiados;
- variantes de livro;
- conteudo de PDF sensivel no repo.

Modo:

- normal primeiro;
- `gamebook`/`conceal` so depois de teste separado.

## 8. Ordem de commits recomendada

1. `feat: add method track domain`
   - tipos, catalogo das 5 trilhas, mastery e testes.

2. `feat: add pending training items`
   - criacao de pendencias por feedback/log/puzzle stats, agenda 1/3/7/14, testes.

3. `feat: persist method state locally`
   - Dexie v4, `pendingItems`, `diplomaAttempts`, export/clear, testes.

4. `feat: select method track in daily plan`
   - `selectMethodTrack`, `generatePlan` com `methodTrackId`, prioridades e testes.

5. `feat: expand lichess catalog for calculation and defense`
   - `defensiveMove`, `quietMove`, `trappedPiece`, `deflection`, allowlist e testes.

6. `feat: show method track and pending review in today`
   - UI minima na tela Hoje, sem redesign amplo.

7. `feat: add diploma checkpoints`
   - `DiplomaAttempt`, soft gate, card de checkpoint, testes.

8. `feat: enrich daily study chapters`
   - PGN autoral com trilha/pergunta/criterio, limite de 64 capitulos, testes.

9. `docs: record method implementation decision`
   - `memory/state.md`, `memory/progress.md`, fontes oficiais, gates.

## 9. Gates de qualidade

Antes de fechar cada corte relevante:

```bash
npm run lint
npm run test
npm run build
```

Testes obrigatorios:

- dominio puro: `methodTracks`, `mastery`, `pendingItems`, `diplomas`;
- plano: pendencia vencida ganha prioridade, calculo ponte usa tema correto, defesa ativa nao aparece
  cedo demais, abertura respeita timing;
- storage: Dexie v4, export sem token, clear apaga novas tabelas;
- Study: comentarios sanitizados, limite 64 capitulos, 429 preservado;
- React: trilha visivel, pendencia visivel, diploma soft gate;
- regressao: abrir Lichess continua salvando log antes.

Se houver mudanca visual na tela Hoje, verificar desktop e mobile no browser.

## 10. Decisoes fechadas

| pergunta | decisao |
|---|---|
| Mais uma rodada de IA antes de codar? | Nao. Consenso suficiente. |
| Trilha ativa manual ou automatica? | Automatica com base em sinais; override manual fica para depois. |
| Pendencias automaticas ou curadas? | Sugestao automatica; usuario pode concluir/deferir. |
| Diplomas bloqueiam avanco? | Nao. Soft gate. |
| Studies por trilha agora? | Nao. Study do dia melhorado primeiro. |
| Adicionar muitas tags novas? | Nao. Preferir `MethodTrackId`; adicionar so `defensive-move` se necessario. |
| Usar `gamebook` agora? | Nao. Modo normal primeiro. |
| Usar Puzzle DB local agora? | Nao. Deep links + Puzzle Activity/Dashboard/Replay. |

## 11. Riscos restantes

1. `defensiveMove`, `quietMove`, `trappedPiece` e `deflection` precisam estar na allowlist local e
   passar em teste de URL. Nao fazer fetch de pagina para validar.
2. Pendencias automaticas podem gerar ruido se cada erro virar item. Por isso, primeiro corte deve
   agregar por tema/log, nao por puzzle individual.
3. Diplomas podem virar burocracia. Manter como checkpoint leve.
4. Abertura pode virar repertorio cedo demais. Manter como principios e revisao pos-partida.
5. Study do dia pode ficar verboso. Usar comentarios curtos, autorais e sanitizados.

## 12. Recomendacao final

Implementar agora. A primeira entrega deve ser pequena, visivel e util:

> "Quando eu erro ou acho dificil, o Professor Lemos guarda uma pendencia, agenda revisao e amanha
> prioriza esse erro antes de me dar conteudo novo."

Isso e o coracao do metodo. Depois vem calculo ponte, defesa ativa, abertura como plano e diplomas.

Se a implementacao ficar boa por duas semanas de uso real, ai sim vale abrir a discussao de studies
permanentes por trilha e testes interativos mais sofisticados.
