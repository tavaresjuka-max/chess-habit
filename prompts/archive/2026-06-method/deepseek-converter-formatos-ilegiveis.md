# DeepSeek - Converter Livros Em Formato Nao Legivel Para Texto Absorvivel

Voce e o **DeepSeek** atuando como engenheiro de dados do projeto `lichess-tutor`. Data de referencia:
2026-06-09.

Parte do acervo de xadrez do dono esta em formato que as analises anteriores **nao conseguiram ler**:
e-books Kindle (`.azw`, `.azw3`, `.epub`) e PDFs escaneados / com OCR ruim. Sua tarefa e **converter
esses arquivos para texto legivel** (`.txt`/`.md`) para que possam ser absorvidos pedagogicamente nas
proximas analises — sem copiar conteudo para o produto.

> Pre-requisito: voce precisa de acesso a shell para rodar/instalar ferramentas de conversao. Se o seu
> ambiente nao permite executar comandos no disco, **pare e avise** — este trabalho nao se resolve por
> raciocinio, so por conversao real de arquivo. (Neste caso, o mesmo prompt pode ser executado pelo
> Codex.)

## Onde Estao Os Arquivos

Pasta-alvo principal (onde estao os formatos nao-PDF):

```
C:\Users\tavar\OneDrive\Documentos\CLAUDE CODE\APRENDER XADREZ\lichess-tutor\LIVROS XADREZ PARA CONSULTA\ONDA 2 LIVROS\
```

Tambem ha PDFs escaneados/ilegiveis na onda 1 (raiz de `LIVROS XADREZ PARA CONSULTA\`) e na onda 2.

Grave a saida em uma pasta nova, **fora do controle de versao**:

```
LIVROS XADREZ PARA CONSULTA\_convertidos\
```

E adicione `LIVROS XADREZ PARA CONSULTA/_convertidos/` ao `.gitignore` se ainda nao estiver coberto.

## Escopo: O Que Converter

1. **E-books Kindle e EPUB** (`.azw`, `.azw3`, `.epub`) — ~68 arquivos na onda 2, a maioria PT-BR
   (ex: DAMP, colecoes "Escola Sovietica/Alema/Francesa de Xadrez", "Como montar uma programacao de
   treinamento de xadrez"). Estes sao a prioridade — hoje sao ilegiveis.
2. **PDFs escaneados ou com OCR fraco** — os relatorios anteriores marcaram ~41 PDFs com texto pouco
   extraivel e 5 com erro de leitura (entre eles: `Chess_and_Children`, `How_Not_to_Play_Chess`,
   `Aperfeicoamento_no_Xadrez`, `Chess Tactics For Advanced Players`, `en passant Historias de Xadrez`).
   Estes precisam de OCR.

Nao reconverta PDFs que ja tem texto extraivel — so os ilegiveis.

## Procedimento

### Passo 0 - Inventario
Enumere os arquivos por formato e gere uma lista de trabalho. Para PDFs, detecte quais sao "ilegiveis"
testando extracao de texto (ex: `pdftotext`/`pypdf`/`pdfplumber`): se as primeiras paginas retornam
quase nenhum caractere, marque como `precisa_ocr`.

### Passo 1 - Garantir Ferramentas
Verifique e, se possivel, instale:

- **Calibre** (`ebook-convert`) — melhor opcao para `.azw/.azw3/.epub`. Conversao:
  `ebook-convert "entrada.azw3" "saida.txt"` (ou `.md`/`.epub` intermediario).
- Alternativas se nao houver Calibre: biblioteca Python `mobi` (descompacta `.azw3`/KF8), `KindleUnpack`,
  ou `pandoc` para `.epub` (`pandoc entrada.epub -t plain -o saida.txt`).
- **OCR de PDF**: `ocrmypdf` + `tesseract-ocr` com os pacotes de idioma **portugues (`por`)** e
  **ingles (`eng`)**. Ex: `ocrmypdf -l por+eng --force-ocr entrada.pdf saida_ocr.pdf` e depois extrair
  texto do PDF resultante.

Se faltar ferramenta e nao puder instalar, registre no manifesto como `bloqueado_falta_ferramenta` e
siga para o proximo arquivo. Nao invente texto.

### Passo 2 - Converter
Para cada arquivo:

- Kindle/EPUB -> gerar `saida.txt` (texto limpo) e, quando ajudar, `saida.md`.
- PDF escaneado -> rodar OCR `por+eng` e extrair `saida.txt`.
- Nome de saida = nome do livro sanitizado (sem acentos problematicos, sem `(z-lib.org)`), com sufixo do
  formato de origem. Ex: `DAMP__Duarte-Lapertosa__from-azw3.txt`.

### Passo 3 - Verificar A Conversao (Obrigatorio)
Conversao so conta se o texto e realmente utilizavel. Para cada saida, verifique:

- numero de caracteres extraidos e plausivel para um livro (ex: > 20.000 chars; senao, suspeito);
- amostra legivel: as primeiras ~500 palavras formam frases reais no idioma esperado, nao lixo;
- idioma detectado (pt/en) coincide com o esperado.

Classifique cada item: `ok`, `parcial` (texto sai mas com ruido/OCR imperfeito), `falhou`.

### Passo 4 - Manifesto
Gere `LIVROS XADREZ PARA CONSULTA\_convertidos\_manifesto-conversao.md` (e/ou `.jsonl`) com colunas:

`arquivo_origem`, `formato_origem`, `idioma`, `metodo_conversao`, `arquivo_saida`, `chars_extraidos`,
`status` (ok | parcial | falhou | bloqueado_falta_ferramenta), `qualidade` (alta | media | baixa),
`observacao`.

Inclua um resumo no topo: total por formato, quantos `ok/parcial/falhou`, e a lista dos que precisam de
tratamento manual.

## Regras

- **Clean-room**: o texto convertido serve **apenas para analise pedagogica**. Nao copie esse texto para
  o codigo, para o produto, nem reproduza trechos longos em relatorios. So metadados e sintese, como nas
  analises anteriores.
- **Nao commitar** os arquivos convertidos nem os originais no repositorio. Garanta o `.gitignore`.
- Origem dos arquivos: alguns vieram de bibliotecas-sombra (ex: nomes com `z-lib.org`). Trate o conteudo
  como **influencia pedagogica de uso pessoal**, nunca como fonte a reproduzir no app.
- Se um arquivo for ficcao, historia geral ou KDP generico (ja triados como descartaveis nas analises),
  **nao gaste OCR/conversao** com ele — marque `pulado_baixo_valor` e siga. Priorize os PT-BR uteis e os
  tecnicos relevantes.
- Nao alucine resultado: se a conversao falhar, diga que falhou.

## Formato Da Resposta

Comece com `# Conversao de Formatos Ilegiveis - DEEPSEEK`. Em portugues, direto. Entregue:

1. inventario (quantos arquivos por formato, quantos precisam de conversao/OCR);
2. ferramentas encontradas/instaladas (ou bloqueio);
3. tabela-resumo do resultado da conversao;
4. caminho do manifesto e da pasta `_convertidos`;
5. lista priorizada do que ficou pronto para a proxima analise pedagogica (com enfase nos PT-BR e nos
   tecnicos) e do que precisa de tratamento manual;
6. proximos passos: rodar a analise pedagogica (estilo onda 2) sobre os arquivos agora legiveis.
