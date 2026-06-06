# ADR-005: Clean-Room E ChessKing Fora Do Dominio

## Status

Aceito (2026-06-06). Reforca ADR-001. Responde aos P0 de IP levantados pelos tres relatorios de
revisao do spec unificado.

## Contexto

Um spec anterior propos "evoluir o app existente em `chessking-tutor`" e manter "ChessKing" como
fonte (`SourceId`) com nomes de curso/secao. Os relatorios Codex, Claude/DeepSeek e Antigravity
apontaram, corretamente, que isso reintroduz risco de contaminacao de propriedade intelectual de um
app pago de terceiros e fragiliza a licenca open-source planejada.

## Decisao

- Construir como **clean-room**: app novo do zero em `lichess-tutor`. **Proibido** copiar arquivos,
  pastas, dependencias ou assets de `chessking-tutor` ou `chessking-assets`.
- Permitido reimplementar do zero apenas **conceitos proprios** (estrutura de blocos diarios, time
  budget, cadeia Signal -> Weakness -> Plan). Nenhuma linha por copia.
- **ChessKing nunca e `SourceId` nem taxonomia dentro do app.** Estudo externo, se existir, e uma
  fonte generica `'outro'` com texto livre (sem cursos/secoes/estrutura de produto pago).

## Consequencias

- O app nasce limpo e publicavel sob AGPL-3.0 sem heranca proprietaria.
- `SourceId` = `'lichess' | 'chesscom' | 'outro'`.
- Qualquer registro de estudo externo e texto livre informado pelo usuario, nunca uma indexacao de
  produto pago.

## Esclarecimento (2026-06-06): import do nivel/temas do dono

O dono pode importar o que ja sabe do proprio nivel — inclusive o que um app externo (ChessKing)
"entendeu" dos prints. Isso e PERMITIDO desde que se importe apenas o **insumo universal**: nivel
aproximado + temas de xadrez (ex.: xeque descoberto, mate em 2, finais de peoes), que sao conceitos
publicos do xadrez, NAO propriedade do ChessKing. Vira `Signal { source:'outro', kind:'manual', tag }`.
Permanece PROIBIDO: copiar codigo/assets do `chessking-tutor`, ou espelhar a taxonomia de cursos/secoes
do ChessKing. Prints (imagens) so locais, sem OCR, com aviso de direitos. Ver spec secao 14.3.
