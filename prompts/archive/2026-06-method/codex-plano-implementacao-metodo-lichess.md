# Prompt Codex - Plano Implementavel do Metodo Lichess

Voce e o Codex atuando como engenheiro executor do projeto `lichess-tutor`.

## Missao

Planeje como implementar, no repo atual, a transformacao da sintese pedagogica em metodo aplicado com
base no Lichess. Nao implemente codigo nesta resposta. O produto da tarefa e um plano tecnico
executavel, com arquivos provaveis, testes, riscos e commits atomicos.

Salve sua resposta em:

`plano-implementacao-metodo-lichess-CODEX.md`

## Contexto obrigatorio

Projeto: `lichess-tutor`, PWA local-first em React + Vite + TypeScript + Dexie.

Moldura vigente:

- Ferramenta pessoal primeiro; comunidade/publico so na P5 congelada.
- P0, P1, P2 e P3 ja foram concluidas.
- P4 sync e P5 comunidade estao congeladas.
- O app ja tem loop Hoje, plano diario, Lichess OAuth opt-in, puzzle activity/dashboard/replay e Study
  privado do dia.
- O novo trabalho deve integrar a ultima sintese sem quebrar o loop existente.

Leia antes de planejar:

- `AGENTS.md`
- `PLANO.md`
- `docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md`
- `docs/pedagogy/metodo-professor-lemos.md`
- `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md`
- `relatorio-codex-lacunas-pesquisa-recursos.md`
- `analise-pdfs-baixados-onda3-DIRETOR.md`
- `analise-pdfs-baixados-onda3-DEEPSEEK.md`
- `analise-pdfs-baixados-onda3-GEMINI.md`
- `analise-pdfs-baixados-onda3-CODEX.md`

Inspecione tambem o codigo atual, especialmente:

- `src/domain/types.ts`
- `src/domain/plan/generatePlan.ts`
- `src/domain/plan/timeBudget.ts`
- `src/domain/coach/learningPlanProposal.ts`
- `src/domain/coach/sessionMilestones.ts`
- `src/domain/sources/destinations.ts`
- `src/domain/sources/resourceCatalog.ts`
- `src/domain/sources/resourceSelector.ts`
- `src/infra/lichess/study.ts`
- `src/infra/lichess/puzzleActivity.ts`
- `src/infra/lichess/puzzleDashboard.ts`
- `src/infra/storage/appData.ts`
- `src/infra/storage/db.ts`
- `src/ui/Today.tsx`
- `src/ui/LearningPlanProposalCard.tsx`
- `src/ui/SessionMilestonesCard.tsx`
- testes correspondentes.

## Regras inquebraveis

- Nao usar scraping.
- Usar somente Lichess oficial/documentado quando houver integracao.
- Uma requisicao por vez; HTTP 429 exige pausa minima de 1 minuto.
- Nao criar tabuleiro proprio.
- Nao ajudar partida ao vivo nem sugerir lances.
- Nao usar Board API, Bot API, Challenge API, escopos de jogo, engine, mensagens ou `puzzle:write`.
- OAuth so opt-in: `puzzle:read` e `study:write`.
- Nao persistir token, PGN completo, PII ou conteudo sensivel.
- Chess.com continua read-only e transiente para PGN.
- Para app/produto open-source, clean-room total: nada de texto, diagrama, FEN, PGN, comentario,
  variacao ou exercicio copiado de livro protegido.
- Para estudo pessoal privado do dono, os PDFs sensiveis podem orientar a curadoria, mas o repo deve
  armazenar apenas abstracoes autorais, slugs Lichess, status, telemetria e texto proprio.

## Fatos oficiais Lichess ja verificados

Use estes fatos como base e confira a documentacao oficial se precisar de detalhe:

- API docs: `https://lichess.org/api`
- API Tips: `https://lichess.org/page/api-tips`
- OpenAPI spec: `https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml`
- Criar Study: `POST /api/study`, escopo `study:write`, visibilidade `private`/`unlisted`, limite de
  ate 30 studies novos por dia.
- Importar PGN no Study: `POST /api/study/{studyId}/import-pgn`, escopo `study:write`; cria capitulos;
  um Study tem limite de 64 capitulos.
- Puzzle activity: `GET /api/puzzle/activity`, escopo `puzzle:read`, NDJSON.
- Puzzle dashboard: `GET /api/puzzle/dashboard/{days}`, escopo `puzzle:read`.
- Puzzle replay: `GET /api/puzzle/replay/{days}/{theme}`, escopo `puzzle:read`.
- A colecao de puzzles do Lichess e public domain, mas o app atual deve preferir deep links Lichess
  e telemetria, nao tabuleiro proprio.

## Trilhas aprovadas pelo diretor

Planeje a implementacao destas 5 trilhas:

1. `Tratamento de Pendencias`
2. `Calculo Ponte 800-1200`
3. `Defesa Ativa`
4. `Abertura Como Plano`
5. `Diplomas de Progresso`

## Enfase Codex

Sua resposta deve privilegiar:

- implementabilidade no codigo atual;
- menor mudanca segura;
- dominio puro testavel;
- tipos TypeScript estritos;
- migracao Dexie sem perda de dados;
- UX suficiente, sem refatoracao estetica ampla;
- testes antes/depois;
- plano de commits atomicos.

## Formato obrigatorio da resposta

Use exatamente estas secoes:

1. `Veredito executivo`
2. `Leitura do estado atual do repo`
   - o que ja existe
   - o que falta
   - conflitos com o plano atual, se houver
3. `Mapa Lichess do metodo`
   - endpoints existentes
   - endpoints novos, se realmente necessarios
   - destinos por URL
   - limites oficiais
4. `Modelo de dominio proposto`
   - tipos novos
   - extensoes de `WeaknessTag` ou alternativas
   - estruturas para trilhas/pendencias/diplomas
   - persistencia Dexie
5. `Plano das 5 trilhas`
   - como cada trilha entra no dominio
   - como cada trilha aparece na tela Hoje
   - como cada trilha gera destino Lichess
   - como cada trilha gera telemetria
6. `Mudancas no gerador de plano`
   - regras SE/ENTAO
   - tempo 5/15/30/60
   - progresso por feedback e puzzle stats
   - tratamento de pendencias
7. `Study builder`
   - se deve reaproveitar `createDailyStudy`
   - se precisa de studies por trilha ou study do dia melhorado
   - limites: 30 studies/dia, 64 capitulos/study
   - formato de PGN autoral seguro
8. `UX proposta`
9. `Privacidade e clean-room`
10. `Testes obrigatorios`
    - dominio
    - infra Lichess
    - storage
    - React
    - regressao
11. `Fases e commits atomicos`
12. `Notas comparativas`
    - nota 0-10 para impacto
    - nota 0-10 para esforco
    - nota 0-10 para risco
    - nota 0-10 para prioridade
13. `Perguntas abertas`
14. `Recomendacao final`

Se uma ideia depender de P4/P5, marque como congelada. Se uma integracao nao estiver confirmada na
documentacao oficial do Lichess, trate como pendencia antes de codar.
