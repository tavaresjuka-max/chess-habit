# Pesquisa de Recursos — Lacunas do Método Professor Lemos (Relatório Codex)

## Contexto

Projeto lichess-tutor: tutor pessoal de xadrez open-source. Método pedagógico consolidado a partir de 200+ livros. Preciso cobrir lacunas com novos recursos. O Gemini busca fontes amplas e PT-BR; o DeepSeek verifica downloads e preços. **Seu papel, Codex, é o terceiro vértice: open source, dados, evidência técnica e triangulação.**

## Fontes Já Integradas — NÃO Pesquisar

> Seirawan, Polgar, Hertan, Neiman, Heisman, Capablanca, Keres, Chernev, Silman, de la Villa, Euwe/Hooper, Kotov, Aagaard, Watson, Vukovic, Chandler, Nunn, Marin, Fischer, Woodpecker Method, Yusupov Fundamentals, Steps Method, Lazzarotto (PT-BR), Leitão (PT-BR), DAMP/Duarte&Lapertosa (PT-BR), Murray/Movimento Forçado (PT-BR), Nimzowitsch, Lasker, Tarrasch, Stean, Flores Rios/Shankland, Rowson, Weeramantry.

## Lacunas a Cobrir

| código | descrição | impacto |
|--------|-----------|---------|
| `calculo-ponte-800-1200` | Cálculo de linhas forçadas 2-5 lances em posições reais, nível 800-1200 | ALTO |
| `defesa-profilaxia-1000-1400` | Defesa ativa e profilaxia prática, 1000-1400 | ALTO |
| `threshold-dominio` | Critério empírico de masterização em puzzles: % de acerto = aprendido? | ALTO |
| `proporcao-revisao-vs-novo` | Proporção revisão vs conteúdo novo calibrada por nível | ALTO |
| `intervalos-repeticao-espacada` | Protocolo de spaced repetition para xadrez/habilidade perceptual | ALTO |
| `interleaving-sessao` | Pesquisa sobre interleaving vs blocked practice em habilidades complexas | MÉDIO |
| `abertura-minima-timing` | Evidência sobre quando introduzir 1ª abertura por nome | MÉDIO |
| `calculo-sistematico-1200plus` | Método sistemático de cálculo para intermediário acima de 1200 | MÉDIO |

## Sua Missão — Mandato Codex

Você tem três tarefas distintas:

### Tarefa 1: Recursos Open Source e Dados Abertos

Busque fontes que Gemini e DeepSeek provavelmente não cobrem — dados abertos, ferramentas, repos:

**Datasets e bancos de posições:**
- Lichess open database (lichess.org/database) — PGN de partidas e puzzles com temas etiquetados. Quantos puzzles por tema relevante (fork, pin, deflection, mateIn2) existem? O dataset é usável para treino progressivo?
- Lichess Puzzle Database CSV — verifique se tem campo de dificuldade rating e theme para selecionar puzzles por faixa 800-1200
- SCID (Shane's Chess Information Database) — repositório aberto de partidas com filtros de erro/tática
- ChessDB (chessdb.cn) — base de posições com análise, gratuita
- Lichess Studies sobre defesa/profilaxia de autores confiáveis — busque estudos curados sobre profilaxia, defesa posicional, contra-ataques

**Ferramentas open source de cálculo:**
- Puzzle generators no GitHub (busca: "chess puzzle generator", "chess tactics generator", "chess position training")
- Repos de treino com spaced repetition integrado (busca: "chess spaced repetition", "chess anki deck")
- Decks Anki de xadrez com puzzles temáticos (ankiweb.net e GitHub)
- Exercism chess track ou similar (se existir)

**Cursos gratuitos e estruturados:**
- lichess.org/learn — quais lições cobrem cálculo ou defesa acima do básico?
- lichess.org/study (estudos comunitários curados) — busque estudos de cálculo progressivo e defesa prática
- ChessKid.com (gratuito) — tem material de cálculo estruturado para nível 800-1200?
- Chess Tempo (chesstempo.com) — tem modo de treino de cálculo progressivo além de puzzles isolados?

### Tarefa 2: Evidência Acadêmica para Lacunas Cognitivas

Para `threshold-dominio`, `proporcao-revisao-vs-novo`, `intervalos-repeticao-espacada` e `interleaving-sessao`, faça busca técnica em:

- arXiv (cs.AI, cs.HC, stat.ML): *chess skill learning*, *deliberate practice computational*
- PubMed / Google Scholar: *spaced repetition motor skill*, *interleaved practice chess*, *mastery threshold perceptual learning*
- Papers citados no próprio Woodpecker Method e Steps Method (se disponíveis)
- Cepeda et al. 2006 e 2008 (spacing effect) — estão disponíveis em open access?
- Roediger & Karpicke 2006 (testing effect) — open access?
- Simon & Chase 1973 — open access?
- Bilalić, McLeod & Gobet (chess pattern papers) — disponibilidade?
- van de Pol, van Lankveld, et al. (chess training research Netherlands) — qualquer paper recente
- Busque teses de doutorado sobre chess skill acquisition (ProQuest, DART-Europe, repositórios universitários)

Para cada paper encontrado, informe: título, autores, ano, DOI ou URL, se é open access ou paywall, e qual lacuna responde.

### Tarefa 3: Triangulação

Após fazer as buscas acima, produza uma **análise de gaps entre os três relatórios** (você está escrevendo o terceiro). Indique:

1. **Lacunas com cobertura A disponível**: onde você encontrou recursos que Gemini e DeepSeek provavelmente cobriram — confirme ou corrija
2. **Lacunas sem cobertura A conhecida**: onde nenhum recurso de qualidade parece existir — seja honesto
3. **Recursos exclusivos deste relatório** (open source, datasets, papers técnicos) que não estariam no Gemini ou DeepSeek
4. **Recomendação de síntese**: se tivesse que escolher 1 recurso A por lacuna para baixar/comprar amanhã, qual seria? (liste brevemente com justificativa de 1 linha)

## Formato por Recurso

```
### [Título / Nome do Repo / Nome do Dataset] — [Autor / Maintainer]
- Tipo: livro / paper acadêmico / dataset / ferramenta / deck anki / repositório GitHub / estudo Lichess
- Acesso: GRATUITO [URL] | PAGO [preço + link] | OPEN ACCESS [DOI ou URL]
- Lacuna(s): [código(s)]
- Nota: A / B / C / D
- Justificativa: 1-2 frases
```

## Critério de Nota
- **A** = responde a lacuna diretamente, evidência ou conteúdo de alta qualidade, verificado
- **B** = cobre parcialmente, útil com adaptação
- **C** = referência secundária, evidência indireta
- **D** = fora do escopo, duplica existente, ou evidência fraca

## Formato do Relatório

Nomeie: **"Relatório Codex — Open Source, Dados e Evidência Técnica para Lacunas do Método Professor Lemos (2026-06-09)"**

Estrutura:
1. **Resumo executivo**: principais achados em ≤8 linhas
2. **Seção 1 — Recursos Open Source e Datasets** (Tarefa 1)
3. **Seção 2 — Evidência Acadêmica** (Tarefa 2), organizada por lacuna
4. **Seção 3 — Triangulação e Recomendações** (Tarefa 3)
5. **Tabela final**: todos recursos, tipo, lacuna, nota, URL/preço

Seja técnico e preciso. Se não encontrar fonte A para uma lacuna, diga claramente — isso é informação útil. Não invente recursos.
