# ADR-006: Adaptativo Com OAuth Opt-in Para Study, Sem Engine Nem Escopos De Jogo

## Status

Aceito (2026-06-06). Revisado em 2026-06-06 apos decisao do dono: "vamos usar oauth sim".

## Contexto

O dono quer um plano adaptado as suas fraquezas reais. As opcoes de analise vao de sinais baratos
(metadados) ate rodar engine (Stockfish WASM). A decisao original adiava OAuth para a comunidade.
Depois da discussao sobre "Meus estudos" do Lichess, o dono decidiu usar OAuth na ferramenta pessoal.
O objetivo do OAuth nao e jogar, desafiar, automatizar partida ou sugerir lances: e criar/atualizar
Studies como artefato de treino pessoal.

## Decisao

- P1/P2 continuam podendo detectar fraquezas a partir de dados publicos e APIs read-only oficiais
  (Chess.com e Lichess), com parse transiente e so sinais derivados persistidos.
- OAuth PKCE fica permitido como **opt-in** em fase propria para gerar/atualizar Lichess Studies.
  Escopos permitidos: `study:read` e/ou `study:write`, conforme a necessidade minima.
- Escopos proibidos continuam proibidos: `board:play`, `bot:play`, `challenge:*`, `msg:write`,
  `engine:*` e qualquer escopo de jogo/automacao de partida.
- Tokens ficam somente locais, nunca em logs, bundle publico, arquivos versionados ou export padrao.
- **Sem rodar engine** no app.
- Parser tolerante a ausencia de analysis; fraqueza apresentada como **hipotese** ("sinal possivel"),
  nunca como diagnostico ou promessa de rating.
- Guardrails de rate limit mantidos: uma requisicao por vez; 429 -> espera >= 1 min; cache com TTL.

## Consequencias

- P0-P2 continuam leves e sem OAuth obrigatorio.
- P3 pode criar um estudo privado/unlisted "Seu treino de hoje", com fallback para deep-link de analise
  quando o usuario nao autorizar OAuth.
- A precisao depende das fontes publicas/revisadas disponiveis; Studies organizam treino, nao rodam
  analise nem oferecem ajuda durante partida viva.
