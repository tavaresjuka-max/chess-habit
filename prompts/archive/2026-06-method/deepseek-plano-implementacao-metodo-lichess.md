# Prompt DeepSeek - Plano de Implementacao do Metodo Lichess

Voce e o DeepSeek atuando como consultor tecnico-pragmatico do projeto `lichess-tutor`.

## Missao

Planeje como transformar a sintese pedagogica da ultima leva de analises em um metodo aplicavel no
app pessoal do dono, usando o Lichess como base de execucao. Nao implemente codigo. Entregue um plano
de implementacao comparavel com as respostas de Gemini e Codex.

Salve sua resposta em:

`plano-implementacao-metodo-lichess-DEEPSEEK.md`

## Contexto obrigatorio

Projeto: `lichess-tutor`, PWA local-first em React + Vite + TypeScript + Dexie.

Moldura vigente:

- Ferramenta pessoal primeiro; comunidade/publico so na P5 congelada.
- P0, P1, P2 e P3 ja foram concluidas.
- P4 sync e P5 comunidade estao congeladas.
- O dono quer transformar o material analisado em rotina real de estudos no Lichess.
- O app nao deve virar tabuleiro proprio; o treino abre no Lichess.

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

## Regras inquebraveis

- Nao usar scraping do Lichess, Chess.com ou qualquer site.
- Usar somente APIs oficiais/documentadas quando houver integracao.
- Respeitar Lichess: uma requisicao por vez; se vier HTTP 429, esperar pelo menos 1 minuto.
- Nao criar tabuleiro proprio no app.
- Nao sugerir lances durante partida ao vivo.
- Nao usar Board API, Bot API, Challenge API, escopos de jogo, engine, mensagens ou `puzzle:write`.
- OAuth so opt-in e com escopos minimos: `puzzle:read` e `study:write`.
- Tokens ficam apenas locais, nunca em logs, bundle publico ou arquivos versionados.
- Nao persistir PGN completo por padrao.
- Chess.com, quando usado, e apenas diagnostico read-only; PGN transiente; guardar so sinais derivados.
- Para app/produto open-source, manter clean-room: nao copiar texto, diagrama, FEN, PGN, comentario,
  variacao ou exercicio de livros protegidos.
- Para estudo pessoal privado do dono, os PDFs sensiveis podem orientar o conteudo dos estudos
  privados, mas nao devem virar produto publico nem banco de conteudo versionado.

## Fatos oficiais Lichess ja verificados

Use estes fatos como base e confira a documentacao oficial se precisar de detalhe:

- API docs: `https://lichess.org/api`
- API Tips: `https://lichess.org/page/api-tips`
- OpenAPI spec: `https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml`
- Criar Study: `POST /api/study`, escopo `study:write`, visibilidade `private`/`unlisted`, limite de
  ate 30 studies novos por dia.
- Importar PGN no Study: `POST /api/study/{studyId}/import-pgn`, escopo `study:write`; cria capitulos
  no Study; um Study tem limite de 64 capitulos.
- Puzzle activity: `GET /api/puzzle/activity`, escopo `puzzle:read`, NDJSON, pode ser longo.
- Puzzle dashboard: `GET /api/puzzle/dashboard/{days}`, escopo `puzzle:read`.
- Puzzle replay: `GET /api/puzzle/replay/{days}/{theme}`, escopo `puzzle:read`.
- A colecao de puzzles do Lichess e public domain e pode ser baixada em
  `https://database.lichess.org/#puzzles`.

## Trilhas aprovadas pelo diretor

Planeje a implementacao destas 5 trilhas:

1. `Tratamento de Pendencias`
2. `Calculo Ponte 800-1200`
3. `Defesa Ativa`
4. `Abertura Como Plano`
5. `Diplomas de Progresso`

## Enfase DeepSeek

Sua resposta deve privilegiar:

- ordem de implementacao realista;
- arquitetura de dados;
- contratos de API;
- limites de risco;
- tradeoffs entre fluxo manual agora e automacao depois;
- fatias atomicas que possam virar commits pequenos;
- o menor conjunto de codigo que entrega valor pessoal real.

## Formato obrigatorio da resposta

Use exatamente estas secoes:

1. `Veredito executivo`
2. `Mapa Lichess do metodo`
   - Studies
   - Puzzle Themes
   - Puzzle Dashboard/Activity/Replay
   - Practice/Learn/Analysis
   - URLs e endpoints oficiais
3. `Modelo de dominio proposto`
   - tipos novos
   - campos novos
   - migracoes Dexie
   - o que fica fora do banco
4. `Plano das 5 trilhas`
   - objetivo
   - capitulos/etapas
   - fonte pedagogica abstrata
   - destino Lichess
   - entrada de dados
   - saida esperada
   - telemetria local minima
5. `Mudancas no gerador de plano`
   - regras SE/ENTAO
   - prioridades por tempo: 5/15/30/60 min
   - revisao vs novo
   - dominio: >=80, 50-79, <50
6. `Fluxo de UX`
   - Hoje
   - aprovar plano
   - abrir Lichess
   - registrar feedback
   - reconciliar puzzle/study quando houver OAuth
7. `Privacidade e clean-room`
8. `Testes e gates`
9. `Fases e commits atomicos`
10. `Notas comparativas`
    - nota 0-10 para impacto
    - nota 0-10 para esforco
    - nota 0-10 para risco
    - nota 0-10 para prioridade
11. `Perguntas abertas`
12. `Recomendacao final`

Se uma ideia depender de P4/P5, marque como congelada. Se depender de endpoint nao confirmado, marque
como pendencia de pesquisa oficial.
