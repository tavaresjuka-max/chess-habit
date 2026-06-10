# Prompt Gemini - Plano Pedagogico/UX do Metodo Lichess

Voce e o Gemini atuando como consultor pedagogico e de experiencia do projeto `lichess-tutor`.

## Missao

Planeje como transformar a sintese da ultima leva de analises em um metodo vivo de estudo pessoal no
Lichess. O objetivo e desenhar uma rotina aplicavel, adulta, em PT-BR, com voz de Professor Lemos,
sem infantilizar e sem depender de conteudo copiado.

Nao implemente codigo. Entregue um plano comparavel com as respostas de DeepSeek e Codex.

Salve sua resposta em:

`plano-implementacao-metodo-lichess-GEMINI.md`

## Contexto obrigatorio

Projeto: `lichess-tutor`, PWA local-first em React + Vite + TypeScript + Dexie.

Moldura vigente:

- Ferramenta pessoal primeiro; comunidade/publico so na P5 congelada.
- P0, P1, P2 e P3 ja foram concluidas.
- P4 sync e P5 comunidade estao congeladas.
- O dono quer usar o Lichess como chao de treino, nao como tema decorativo.
- O app orienta, seleciona, registra e adapta; o treino acontece no Lichess.

Leia antes de planejar:

- `AGENTS.md`
- `PLANO.md`
- `docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md`
- `docs/pedagogy/metodo-professor-lemos.md`
- `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md`
- `docs/pedagogy/plano-pedagogico-acervo-baixado-2026-06-09.md`
- `relatorio-codex-lacunas-pesquisa-recursos.md`
- `analise-pdfs-baixados-onda3-DIRETOR.md`
- `analise-pdfs-baixados-onda3-DEEPSEEK.md`
- `analise-pdfs-baixados-onda3-GEMINI.md`
- `analise-pdfs-baixados-onda3-CODEX.md`

## Regras inquebraveis

- Nao usar scraping.
- Usar somente Lichess oficial/documentado quando houver integracao.
- Uma requisicao por vez; HTTP 429 exige pausa minima de 1 minuto.
- Nao criar tabuleiro proprio.
- Nao ajudar partida ao vivo nem sugerir lances.
- Nao usar Board API, Bot API, Challenge API, escopos de jogo, engine, mensagens ou `puzzle:write`.
- OAuth so opt-in: `puzzle:read` e `study:write`.
- Nao persistir token, PGN completo, PII ou conteudo sensivel.
- Para app/produto publico, clean-room total: nada de texto, diagrama, FEN, PGN, comentario,
  variacao ou exercicio copiado de livro protegido.
- Para estudo pessoal privado do dono, os PDFs sensiveis podem orientar o desenho dos estudos
  privados no Lichess, mas nao podem virar conteudo publico nem material versionado.

## Fatos oficiais Lichess ja verificados

Use estes fatos como base e confira a documentacao oficial se precisar de detalhe:

- API docs: `https://lichess.org/api`
- API Tips: `https://lichess.org/page/api-tips`
- OpenAPI spec: `https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml`
- Criar Study: `POST /api/study`, escopo `study:write`, visibilidade `private`/`unlisted`, limite de
  ate 30 studies novos por dia.
- Importar PGN no Study: `POST /api/study/{studyId}/import-pgn`, escopo `study:write`; cria capitulos;
  um Study tem limite de 64 capitulos.
- Puzzle activity/dashboard/replay usam `puzzle:read`.
- Puzzle themes e Practice/Learn podem ser usados como destinos de treino; nao copiar conteudo deles
  para dentro do app.
- A colecao de puzzles do Lichess e public domain, mas o app atual deve preferir abrir destinos
  Lichess em vez de virar tabuleiro proprio.

## Trilhas aprovadas pelo diretor

Planeje estas 5 trilhas como estudos privados e como logica de rotina:

1. `Tratamento de Pendencias`
2. `Calculo Ponte 800-1200`
3. `Defesa Ativa`
4. `Abertura Como Plano`
5. `Diplomas de Progresso`

## Enfase Gemini

Sua resposta deve privilegiar:

- arquitetura pedagogica;
- desenho dos estudos privados no Lichess;
- experiencia do aluno na tela Hoje;
- voz do Professor Lemos;
- como reduzir carga cognitiva;
- como transformar erro real em treino;
- como evitar ilusao de competencia;
- como fazer diplomas virarem sinal de progresso, nao medalha vazia.

## Formato obrigatorio da resposta

Use exatamente estas secoes:

1. `Veredito executivo`
2. `Principio pedagogico central`
3. `Mapa Lichess do metodo`
   - Studies
   - Puzzle Themes
   - Puzzle Dashboard/Activity/Replay
   - Practice/Learn/Analysis
4. `Desenho das 5 trilhas`
   - promessa da trilha
   - capitulos
   - ritual de sessao
   - pergunta-guia do Professor Lemos
   - destino Lichess
   - criterio de conclusao
   - risco pedagogico
5. `UX da rotina`
   - primeira visita do dia
   - card de proposta
   - blocos 5/15/30/60 min
   - abrir Lichess
   - voltar e registrar feedback
   - revisao das pendencias
6. `Microcopy original`
   - exemplos curtos em PT-BR para cada trilha
   - sem copiar frase de livros
7. `Diplomas de Progresso`
   - Peao
   - Torre
   - Rei
   - criterio de avanco e revisao
8. `Regras de adaptacao`
   - >=80
   - 50-79
   - <50
   - facil/bom/dificil
   - novo vs revisao
9. `Privacidade e clean-room`
10. `Testes pedagogicos e sinais de qualidade`
11. `Fases de implementacao`
12. `Notas comparativas`
    - nota 0-10 para impacto
    - nota 0-10 para esforco
    - nota 0-10 para risco
    - nota 0-10 para prioridade
13. `Perguntas abertas`
14. `Recomendacao final`

Se uma ideia depender de P4/P5, marque como congelada. Se uma ideia exigir copiar conteudo protegido,
substitua por uma versao autoral ou por um destino Lichess.
