# Integracao Chess.com

## Papel

Chess.com entra apenas como importador publico simples para entender historico inicial do aluno. O app nao tera login Chess.com no MVP.

## Fonte

Usar Chess.com Published Data API, que e publica e read-only.

## Entradas

- Username informado manualmente pelo aluno.

## Endpoints Candidatos

- `GET /pub/player/{username}`
- `GET /pub/player/{username}/stats`
- `GET /pub/player/{username}/games/archives`
- Arquivos mensais de partidas, se necessario e com parcimonia.

## Regras

- Usar User-Agent identificavel quando a API recomendar.
- Evitar requisicoes paralelas.
- Guardar apenas sinais derivados por padrao.
- Nao pedir senha Chess.com.
- Nao prometer equivalencia exata entre ratings Chess.com e Lichess.

## Sinais Uteis

- Rating por ritmo.
- Volume recente.
- Frequencia de jogo.
- Resultado geral.
- Possivel nivel inicial.

