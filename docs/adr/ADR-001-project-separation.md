# ADR-001: Separacao De Projetos

## Status

Aceito.

## Contexto

O workspace tinha um app anterior baseado em plataforma paga e Chess.com. O novo produto tem escopo diferente: gratuito, aberto e Lichess-first.

## Decisao

Manter projetos separados:

- `chessking-tutor` para o app antigo.
- `chessking-assets` para APK e material extraido.
- `lichess-tutor` para o novo planejamento.

## Consequencias

Evita confusao de marca, conteudo, dados e arquitetura. Tambem reduz risco de copiar material proprietario por acidente.

