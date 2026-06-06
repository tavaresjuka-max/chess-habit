# Contrato: Lichess

## Objetivo

Autenticar usuario, ler sinais de progresso e abrir tarefas no Lichess.

## Entrada

- Usuario autoriza via OAuth PKCE.
- Username Lichess confirmado.

## Saida

- Sinais derivados para plano de treino.
- URLs de treino.
- Estado de conexao.

## Proibido

- Pedir senha.
- Jogar lance.
- Criar desafio.
- Usar bot.
- Ajudar partida ao vivo.
- Fazer scraping.

## Rate Limit

Uma requisicao por vez. Apos 429, esperar no minimo 1 minuto.

