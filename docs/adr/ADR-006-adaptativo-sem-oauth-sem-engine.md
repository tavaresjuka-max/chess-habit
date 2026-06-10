# ADR-006: Adaptativo Com OAuth Opt-in Minimo, Sem Engine Nem Escopos De Jogo

## Status

Aceito (2026-06-06). Revisado em 2026-06-06 apos decisao do dono: "vamos usar oauth sim".

## Adendo (2026-06-10) — nome do arquivo vs conteudo

O nome do arquivo (`ADR-006-adaptativo-sem-oauth-sem-engine.md`) reflete a decisao ORIGINAL
(sem OAuth), anterior a revisao do mesmo dia que liberou OAuth opt-in minimo. Por convencao,
ADRs sao imutaveis: o arquivo NAO sera renomeado (decisao do dono em 2026-06-10, item A-4,
apos arbitragem — adendo em vez de renomeacao, conforme pratica apontada pelo DeepSeek).
O titulo interno acima e o conteudo da Decisao sao a fonte de verdade: OAuth PKCE opt-in com
escopos minimos (`study:write`, `puzzle:read`) e permitido; engine e escopos de jogo seguem
proibidos. Referencias futuras devem citar "ADR-006" pelo titulo interno, nao pelo nome do
arquivo.

## Contexto

O dono quer um plano adaptado as suas fraquezas reais. As opcoes de analise vao de sinais baratos
(metadados) ate rodar engine (Stockfish WASM). A decisao original adiava OAuth para a comunidade.
Depois da discussao sobre "Meus estudos" do Lichess, o dono decidiu usar OAuth na ferramenta pessoal.
O objetivo do OAuth nao e jogar, desafiar, automatizar partida ou sugerir lances: e criar/atualizar
Studies como artefato de treino pessoal e, quando necessario, ler atividade de puzzles para reconciliar
o resultado de blocos de treino ja iniciados pelo usuario.

## Decisao

- P1/P2 continuam podendo detectar fraquezas a partir de dados publicos e APIs read-only oficiais
  (Chess.com e Lichess), com parse transiente e so sinais derivados persistidos.
- OAuth PKCE fica permitido como **opt-in** em fase propria para gerar/atualizar Lichess Studies e
  reconciliar atividade de puzzles. Escopos permitidos no app pessoal atual: `study:write` para
  criar/importar Study e `puzzle:read` para ler `/api/puzzle/activity`. `study:read` so deve entrar
  se uma tarefa futura realmente exigir leitura de estudos privados e o dono descongelar esse escopo.
- Escopos proibidos continuam proibidos: `board:play`, `bot:play`, `challenge:*`, `msg:write`,
  `engine:*`, `puzzle:write` e qualquer escopo de jogo/automacao de partida.
- Tokens ficam somente locais, nunca em logs, bundle publico, arquivos versionados ou export padrao.
- **Sem rodar engine** no app.
- Parser tolerante a ausencia de analysis; fraqueza apresentada como **hipotese** ("sinal possivel"),
  nunca como diagnostico ou promessa de rating.
- Guardrails de rate limit mantidos: uma requisicao por vez; 429 -> espera >= 1 min; cache com TTL.

## Consequencias

- P0-P2 continuam leves e sem OAuth obrigatorio; P2 pode salvar timer/log local e reconciliar puzzles
  quando `puzzle:read` existir.
- P3 pode criar um estudo privado/unlisted "Seu treino de hoje", com fallback para deep-link de analise
  quando o usuario nao autorizar OAuth.
- A precisao depende das fontes publicas/revisadas disponiveis; Studies organizam treino, nao rodam
  analise nem oferecem ajuda durante partida viva.
