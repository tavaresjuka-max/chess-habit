# ADR-002: Modelo Gratuito E Proprietario

## Status

Aceito (2026-06-06). Parcialmente supersedido em 2026-06-30 quanto a abertura do codigo: o modelo vigente e gratuito, proprietario/codigo fechado.

## Contexto

O usuario definiu que o app sera 100% gratuito, com opcao de doacao e possivel reconhecimento moral de apoiador. A decisao inicial previa AGPL/open-source; depois o dono decidiu manter o codigo fechado.

## Decisao

App gratuito, proprietario/codigo fechado, sem anuncios, sem paywall, sem venda de dados e sem beneficios funcionais pagos. Doacao, se existir, e externa e opcional. A licenca vigente e proprietaria (`LICENSE`); `package.json` permanece `UNLICENSED`.

## Consequencias

O produto continua alinhado ao acesso gratuito e a cultura de baixo atrito do Lichess, mas sem obrigacao de publicar codigo-fonte. A arquitetura deve controlar custos desde o inicio. Qualquer integracao de pagamento real fica fora do MVP.
