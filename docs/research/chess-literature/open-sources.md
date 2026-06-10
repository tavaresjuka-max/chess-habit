# Fontes Abertas Para A Biblioteca De Xadrez

Pesquisa inicial executada em 2026-06-09.

## Tier A - Download Permitido Com Alta Confianca

- Project Gutenberg: catalogo de ebooks em dominio publico nos EUA. Acesso automatizado deve usar
  catalogo/harvest/mirror e respeitar politicas de robot.
- Internet Archive, colecao `gutenberg`: espelho de obras Project Gutenberg.
- Internet Archive, obras antigas: baixar somente quando metadados indicarem ano antigo e dominio
  publico/licenca aberta.
- OpenAlex: indice academico para artigos e teses open access com PDF publico e licenca/fonte.
- DOAJ/Crossref/Unpaywall via OpenAlex: discovery de artigos OA sobre pedagogia, cognicao e treino.

## Tier B - Candidatos Que Exigem Revisao

- Internet Archive fora de Gutenberg com upload moderno.
- Repositorios institucionais sem licenca explicita.
- Teses open access sem licenca clara.
- ERIC, OATD, DART-Europe, Shodhganga e repositores DSpace/EPrints: bons para descoberta, mas a
  licenca de cada PDF precisa ser lida.

## Tier C - Somente Lista De Compra

- New In Chess / Quality Chess / Popular Chess.
- Chessable, Forward Chess, ChessBase, Thinkers Publishing, Russell Enterprises, Gambit, Mongoose,
  Everyman/Popular e Silman-James Press.
- Google Books/Amazon previews.

## Consultas Iniciais

OpenAlex:

- `chess education`
- `teaching chess`
- `chess training`
- `chess pedagogy`
- `school chess`
- `chess curriculum`
- `chess cognition`
- `chess expertise`
- `chess problem solving`
- `xadrez educacao`
- `ajedrez educacion`
- `echecs pedagogie`
- `schach unterricht`

Internet Archive:

- `title:chess AND mediatype:texts AND licenseurl:http*publicdomain*`
- `subject:chess AND mediatype:texts AND licenseurl:http*publicdomain*`
- `collection:gutenberg AND (title:chess OR subject:chess) AND mediatype:texts`

## Fontes Verificadas

- Internet Archive Advanced Search: endpoint JSON usado para estimar volume e buscar metadados.
- Internet Archive Metadata API: fonte usada para lista de arquivos por item antes do download.
- Internet Archive automated access docs: base para usar User-Agent descritivo e delays.
- Project Gutenberg robot/permissions pages: base para nao raspar paginas humanas e respeitar marca,
  jurisdicao e dominio publico.
- Gutendex: API JSON para descoberta de metadados Gutenberg.
- OpenAlex `/works`: usado para localizar PDFs open access com `open_access.is_oa:true` e `has_pdf_url`.
