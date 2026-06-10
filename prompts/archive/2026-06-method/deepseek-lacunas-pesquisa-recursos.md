# Pesquisa de Recursos — Lacunas do Método Professor Lemos (Relatório DeepSeek)

## Contexto

Estou desenvolvendo um tutor pessoal de xadrez open-source chamado lichess-tutor. O método pedagógico cobre 0→1200 usando prática deliberada, recuperação ativa e repetição espaçada. Preciso cobrir lacunas específicas com novos recursos — livros, cursos, artigos, ferramentas — gratuitos ou pagos.

## Fontes Já Integradas — NÃO Pesquisar

> Seirawan, Polgar, Hertan (CCT), Neiman (Tactics Antenna), Heisman (LPDO), Capablanca, Keres, Chernev, Silman, de la Villa, Euwe/Hooper, Kotov, Aagaard, Watson, Vukovic, Chandler, Nunn, Marin, Fischer, Woodpecker Method, Yusupov Fundamentals, Steps Method, Lazzarotto (PT-BR), Rafael Leitão (PT-BR), DAMP/Duarte&Lapertosa (PT-BR), Murray/Movimento Forçado (PT-BR), Nimzowitsch, Lasker, Tarrasch, Stean, Flores Rios/Shankland, Rowson, Weeramantry.

## Lacunas a Cobrir

| código | descrição | impacto |
|--------|-----------|---------|
| `calculo-ponte-800-1200` | Método/material para treinar cálculo de linhas forçadas 2-5 lances em posições reais de jogo, nível 800-1200 | ALTO |
| `defesa-profilaxia-1000-1400` | Manual ou curso prático de defesa ativa e profilaxia para jogadores 1000-1400 | ALTO |
| `threshold-dominio` | Pesquisa empírica: quantos % de acertos = "aprendido"? Variação por dificuldade? | ALTO |
| `proporcao-revisao-vs-novo` | Dados sobre proporção revisão/conteúdo novo por nível de habilidade | ALTO |
| `intervalos-repeticao-espacada` | Protocolo concreto de spaced repetition para xadrez ou habilidades perceptuais | ALTO |
| `interleaving-sessao` | Pesquisa sobre quantos temas por sessão, interleaving vs blocos | MÉDIO |
| `abertura-minima-timing` | Quando e como introduzir 1ª abertura por nome: evidência pedagógica | MÉDIO |
| `calculo-sistematico-1200plus` | Método de cálculo sistemático para intermediário acima de 1200 | MÉDIO |

## Sua Missão — Mandato DeepSeek

Seu papel é **localizar e verificar fontes reais de download e compra**. Para cada recurso:

1. Confirme que existe (autor real, título real, não alucinação)
2. Forneça a URL mais direta de download gratuito OU de compra
3. Verifique se está disponível no Archive.org, Project Gutenberg, repositórios universitários abertos, sites oficiais de editoras com open access ou preview gratuito
4. Para livros pagos: informe o preço em USD, EUR e BRL (Amazon.com, Amazon.com.br, Chess Informant, New In Chess, Russell Enterprises, Quality Chess, Everyman Chess, Chessable)

Para cada recurso, forneça:

```
### [Título] — [Autor] ([Ano])
- Formato: livro físico / PDF / epub / curso / artigo / ferramenta
- Status de acesso:
  - GRATUITO: [URL direta de download]
  - PAGO: USD XX | EUR XX | BRL XX — [link de compra]
  - ACESSO PARCIAL: [preview/sample gratuito em URL]
- Verificado em: [fonte onde confirmou a existência e disponibilidade]
- Lacuna(s): [código(s)]
- Nota: A / B / C / D
- Justificativa: 1-2 frases
```

## Instruções Específicas para DeepSeek

### Prioridades de busca por lacuna:

**`calculo-ponte-800-1200`** — Foco em livros com exercícios progressivos de cálculo em posições de jogo real (não composições nem temas isolados). Candidatos a verificar:
- Weteschnik "Understanding Chess Tactics" (New In Chess)
- Buckley "Chess Tactics for Intermediate Players"
- Volokitin & Grabinsky "Perfect Your Chess"
- Soltis "How to Choose a Chess Move"
- Tal / Lechtynsky "Attack with Mikhail Tal"
- Bain "Chess Tactics for Students"
- Livshitz "Test Your Chess IQ" (série soviética)
- Alburt "Chess Training Pocket Book"
- Mengatov "The Complete Manual of Positional Chess" (vol intermediário)
- Qualquer livro russo/soviético traduzido com drill progressivo de cálculo curto

**`defesa-profilaxia-1000-1400`** — Escola soviética tem material forte aqui. Candidatos:
- Shereshevsky "Endgame Strategy" (capítulos de profilaxia)
- Crouch "How to Defend in Chess" (Everyman)
- McDonald "Practical Chess Defence"
- Mednis "Practical Endgame Tips" + artigos de técnica defensiva
- Geller qualquer livro de defesa
- Petronić "Chess Prodigy" ou equivalente
- Sakaev & Landa "The Complete Manual of Positional Chess — The Grandmaster's Approach" (defesa)
- Leko-style: qualquer GM conhecido por defesa com material publicado acessível
- Dvoretsky "Secrets of Chess Tactics" (capítulos de contra-jogo)

**`threshold-dominio` / `proporcao-revisao-vs-novo` / `intervalos-repeticao-espacada` / `interleaving-sessao`** — Pesquise em:
- PubMed: *spaced repetition perceptual skill learning*
- ResearchGate: *chess tactics training frequency*
- arXiv: *mastery learning threshold cognitive skill*
- Google Scholar: *deliberate practice chess ELO improvement*
- Cepeda et al. 2006 (Psychological Bulletin) — spaced repetition spacing effect
- Roediger & Karpicke 2006 (testing effect)
- Simon & Chase 1973 (chess chunking)
- De Groot 1965 (chess perception)
- Bilalić et al. (chess pattern recognition papers)
- Busca papers de ciência do esporte sobre blocked vs interleaved practice transferência

**`abertura-minima-timing`** — Busque opiniões fundamentadas de:
- Beim "How to Improve Your Chess: Opening Principles" (ou título similar)
- Emms "Discovering Chess Openings" (everyman)
- Colias & Lapshun "Chess Opening Essentials" (série)
- Qualquer meta-análise ou artigo sobre quando ensinar aberturas para iniciantes

**`calculo-sistematico-1200plus`** — Método de cálculo além de exercícios:
- Dvoretsky "School of Chess Excellence 2: Tactical Play" (primeira parte acessível)
- Khmelnitsky "Chess Exam" (série — método diagnóstico de cálculo)
- Beim "How to Calculate Chess Tactics"
- Soltis "The Inner Game of Chess" (análise de cálculo)
- Bangiev "Fields of Chess Thinking" (método geométrico — publicado?)

### Fontes de download gratuito a verificar sistematicamente:
- archive.org (busca por título + autor)
- Project Gutenberg (clássicos domínio público)
- Chessgames.com (partidas comentadas gratuitas)
- Chessnotes.blogspot.com (artigos)
- FIDE handbook online (gratuito)
- Lichess.org/study (estudos curados, gratuitos)
- GitHub (repos de puzzles PGN, datasets de xadrez)

### Para recursos pagos, verifique preços em:
- Amazon.com / Amazon.com.br
- newinchess.com
- qualitychess.co.uk
- everymanchess.com
- russellenterprises.us
- chessable.com (cursos)

## Critério de Nota
- **A** = cobre a lacuna diretamente, nível adequado (800-1400 ou pesquisa relevante), fonte verificada
- **B** = cobre parcialmente, exige adaptação, ou evidência indireta mas forte
- **C** = tangencial, referência secundária útil
- **D** = fora do nível-alvo, duplica algo existente, ou evidência fraca

## Formato do Relatório

Nomeie: **"Relatório DeepSeek — Recursos e Fontes de Download para Lacunas do Método Professor Lemos (2026-06-09)"**

Estrutura:
1. **Resumo executivo**: quantos recursos A/B/C encontrados, quantos gratuitos vs pagos, custo total estimado para comprar todos os pagos nota A
2. **Seção por lacuna** (8 seções), ordenado por nota dentro de cada seção
3. **Lista de compra consolidada**: só recursos nota A pagos, com preço final e link direto
4. **Lista de download gratuito**: só recursos nota A gratuitos, com URL direta

Objetivo: ao final, quero saber exatamente o que posso baixar hoje e o que preciso comprar, com preços reais.
