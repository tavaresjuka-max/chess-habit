# Fase 1 - Biblioteca De Literatura De Xadrez

Data de abertura: 2026-06-09.

## Objetivo

Montar uma biblioteca local de pesquisa sobre xadrez: livros, teses, artigos, metodos de aula,
pedagogia, treino, cognicao, curriculos, aberturas, finais, tatica, estrategia e historia. Esta fase
e somente pesquisa e aquisicao legal. A fase 2 fara catalogacao/fichamento; a fase 3 pesquisara a
implementacao de um metodo proprio.

Meta operacional do dono: chegar a pelo menos 1000 livros/teses baixados. A meta deve ser executada
em lotes responsaveis, porque cada fonte exige rate limit, checagem de licenca, espaco local e revisao
de falsos positivos.

## Regra Legal

Baixar somente quando houver base razoavel:

- dominio publico claro;
- Project Gutenberg ou espelho equivalente;
- licenca Creative Commons ou permissao aberta equivalente;
- artigo/tese open access com PDF publico e licenca/fonte identificavel.

Nao baixar:

- livro pago, curso pago, preview, amostra comercial ou arquivo suspeito;
- item de emprestimo digital, "borrow", login, assinatura, CDL ou acesso institucional;
- upload moderno marcado por usuario como "public domain" sem evidencia independente;
- PGN completo, banco proprietario de puzzles ou conteudo de apps pagos.

Regra conservadora para Internet Archive: download automatico apenas para colecao Gutenberg ou obra
antiga com sinal claro de dominio publico. Uploads modernos entram como `needs_license_review`.

## Estrutura

- Downloads locais: `output/chess-literature-library/files/` (ignorado pelo Git).
- Temporarios: `output/chess-literature-library/tmp/` (ignorado pelo Git).
- Manifestos: `docs/research/chess-literature/manifests/`.
- Lista de compra: `docs/research/chess-literature/paid-buylist.md`.

## Manifestos

Cada item baixado deve registrar:

- `source` e `sourceId`;
- titulo, autores, ano, idioma/tipo quando disponiveis;
- URL de origem e URL de download;
- licenca/direitos conhecidos;
- `localPath`, tamanho e SHA-256;
- status e razao da decisao.

## Proximo Lote

1. Expandir OpenAlex por consultas: `teaching chess`, `chess pedagogy`, `school chess`,
   `chess curriculum`, `chess cognition`, `xadrez educacao`, `ajedrez educacion`, `schach unterricht`.
2. Expandir Internet Archive apenas em `collection:gutenberg` e obras pre-1930 com metadados confiaveis.
3. Adicionar OATD/DART-Europe/ERIC como descoberta de teses, com download somente apos licenca por item.
4. Separar paid/free-to-read/open-licensed antes da fase 2.
