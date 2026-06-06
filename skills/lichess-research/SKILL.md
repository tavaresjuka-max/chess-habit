---
name: lichess-tutor-lichess-research
description: Use quando uma tarefa tocar API Lichess, OAuth, rate limit, puzzles, jogos, estudos ou fair play.
---

# Lichess Research

## Workflow

1. Consultar documentacao oficial atual do Lichess.
2. Verificar se o endpoint exige token ou escopo.
3. Verificar risco de fair play.
4. Verificar rate limit e serializacao de requisicoes.
5. Registrar fonte em `docs/research/sources.md`.

## Regras

- Sem scraping.
- Sem Board API no MVP.
- Sem Bot API no MVP.
- Sem ajuda durante partida ao vivo.
- Em 429, esperar no minimo 1 minuto.

