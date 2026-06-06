# Integracao Lichess

## Uso Planejado

Lichess e a plataforma principal de treino. O tutor organiza o estudo e abre paginas do Lichess.

## Auth

- Usar OAuth Authorization Code Flow with PKCE.
- Cliente publico, sem client secret.
- Escopos minimos.
- Nao pedir senha.
- Nao usar Personal Access Token como fluxo de usuario final.

## Escopos

MVP deve evitar escopos de jogar, desafiar, bot, chat ou board.

Escopo possivel:

- `puzzle:read`, apenas se necessario para atividade/dashboard de puzzles.
- `study:write`, apenas para criar/importar o Study privado do dia.

## Endpoints Candidatos

- `GET /api/account`
- `GET /api/user/{username}`
- `GET /api/user/{username}/rating-history`
- `GET /api/user/{username}/perf/{perf}`
- `GET /api/games/user/{username}`
- `GET /api/puzzle/activity`
- `GET /api/puzzle/dashboard/{days}`
- `POST /api/study`
- `POST /api/study/{studyId}/import-pgn`

## Links De Treino

O MVP abre URLs do Lichess, por exemplo:

- `https://lichess.org/training`
- `https://lichess.org/training/themes`
- `https://lichess.org/practice`
- `https://lichess.org/learn`
- `https://lichess.org/analysis`
- `https://lichess.org/study`

## Rate Limit

Regra obrigatoria:

- Fazer uma requisicao por vez.
- Se receber HTTP 429, esperar pelo menos 1 minuto antes de tentar novamente.
- Reduzir frequencia apos limite.

## Proibido No MVP

- Board API.
- Bot API.
- Challenge API.
- Jogar lances pelo app.
- Ajudar durante partida ao vivo.
- Automatizar browser.
- Scraping.

## Dados

Preferir sinais derivados:

- faixa de rating;
- tendencias por ritmo;
- volume de partidas;
- atividade de puzzle;
- temas fracos;
- dias sem treino.

Evitar salvar bruto completo:

- PGNs completos;
- tokens em backup JSON, logs, bundle publico ou arquivos versionados;
- mensagens;
- dados que nao sejam necessarios ao plano.
