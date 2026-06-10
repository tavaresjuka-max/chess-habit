# Pesquisa de Recursos — Lacunas do Método Professor Lemos (Relatório Gemini)

## Contexto

Estou desenvolvendo um tutor pessoal de xadrez open-source chamado lichess-tutor, com método pedagógico próprio consolidado a partir da análise de 200+ livros de xadrez. O método cobre a escada 0→1200 (esboço até 2200) usando prática deliberada, recuperação ativa e repetição espaçada, com destinos de treino no Lichess. Professor Lemos é o nome do personagem pedagógico do app — tom adulto, direto, PT-BR.

## Fontes Já Integradas — NÃO Pesquisar

As fontes abaixo já estão absorvidas no método. Não inclua no relatório:

> Seirawan, Polgar, Hertan (CCT/Forcing Chess Moves), Neiman (Tactics Antenna), Heisman (LPDO/Guide to Improvement), Capablanca, Keres, Chernev, Silman (Reassess/Endgame Course), de la Villa (100 Endgames), Euwe & Hooper, Kotov (Think Like GM), Aagaard, Watson, Vukovic (Art of Attack), Chandler (Beat Your Dad), Nunn, Marin, Fischer, Woodpecker Method (Smith/Tikkanen), Yusupov Fundamentals series, Steps Method (Brunia/van Wijgerden), Lazzarotto (Manual de Aberturas PT-BR), Rafael Leitão (Xadrez Total), DAMP (Duarte & Lapertosa PT-BR), Murray (Movimento Forçado), Nimzowitsch (My System), Lasker, Tarrasch, Stean (Simple Chess), Flores Rios/Shankland, Rowson, Weeramantry.

## Lacunas a Cobrir

| código | descrição | impacto | o que precisamos |
|--------|-----------|---------|-----------------|
| `calculo-ponte-800-1200` | Cálculo tático estruturado para 800-1200: posições reais de meio-jogo, sequências forçadas em 2-5 lances, abaixo do nível Dvoretsky/Aagaard | ALTO | Livro, curso ou método que ensine a calcular linhas curtas em posições de jogo real (não só temas isolados rotulados) |
| `defesa-profilaxia-1000-1400` | Defesa ativa e profilaxia prática: identificar e neutralizar ameaças antes que o ataque comece | ALTO | Manual ou curso prático de defesa — não teoria abstrata de GM |
| `threshold-dominio` | Critério de masterização: quantos % de acertos em puzzles significa "aprendido"? Como esse limiar varia por dificuldade? | ALTO | Pesquisa empírica (psicologia cognitiva, educação, ciência do esporte) aplicada a habilidades perceptuais |
| `proporcao-revisao-vs-novo` | Quanto tempo dedicar a conteúdo novo vs revisão por nível de habilidade | ALTO | Dados empíricos ou consenso de especialistas em aprendizado motor/perceptual |
| `intervalos-repeticao-espacada` | Protocolo concreto de spaced repetition para xadrez ou habilidades visuais/perceptuais análogas | ALTO | Papers ou implementações com intervalos recomendados (tipo 1-3-7-14-30 dias) |
| `interleaving-sessao` | Quantos temas por sessão, com que frequência alternar temas (interleaving vs blocos) | MÉDIO | Pesquisa ou metodologia de professor experiente com foco em habilidade perceptual |
| `abertura-minima-timing` | Quando introduzir a 1ª abertura por nome: evidência de que nunca antes de 1200 ou que 1 linha por princípio aos 1000 é seguro | MÉDIO | Evidência pedagógica ou consenso entre métodos reconhecidos |
| `calculo-sistematico-1200plus` | Método sistemático de cálculo acima de 1200 complementar ao banco de exercícios do Movimento Forçado | MÉDIO | Abordagem estruturada de cálculo que um intermediário possa aplicar sozinho |

## Sua Missão

Para cada lacuna acima, faça uma **busca profunda** — livros, cursos online, artigos acadêmicos, vídeo-séries, ferramentas. Para cada recurso encontrado, informe:

```
### [Título] — [Autor]
- Formato: livro / PDF / epub / curso online / artigo acadêmico / vídeo série / ferramenta open source
- Licença / Preço: gratuito (domínio público / CC / open access) | R$XX / USD XX / EUR XX
- Onde encontrar: URL direta ou plataforma exata (Chessable, Amazon.com.br, JSTOR, arXiv, YouTube etc.)
- Lacuna(s): código(s) da lacuna coberta
- Nota: A / B / C / D
- Justificativa: 1-2 frases
```

**Critério de nota:**
- **A** = cobre a lacuna de forma direta, profundidade adequada ao nível 800-1400
- **B** = cobre parcialmente ou exige adaptação leve
- **C** = tangencial, útil como referência secundária
- **D** = fraco, fora do nível-alvo ou duplica algo já mapeado

## Instruções Específicas para Gemini

1. **Priorize PT-BR** sempre que existir fonte de qualidade equivalente. Busque em: editoras brasileiras (Ciência Moderna, Ediouro, Nova Fronteira, Casa dos Livros), Amazon.com.br, Estante Virtual, livrarias universitárias FIDE Brasil.

2. **Para lacunas cognitivas/acadêmicas** (`threshold-dominio`, `proporcao-revisao-vs-novo`, `intervalos-repeticao-espacada`, `interleaving-sessao`): pesquise no Google Scholar, arXiv e ResearchGate. Palavras-chave úteis: *deliberate practice chess skill acquisition*, *spaced repetition perceptual skill*, *interleaved practice vs blocked practice*, *mastery threshold chess tactics*, *expertise chess calculation training*. Evidência de domínios análogos (música, radiologia, esporte) é válida se transferível.

3. **Para cursos online**: cubra Chessable (especialmente cursos com spaced repetition nativo — MoveTrainer), lichess.org/learn e estudos curados, Chess24 Master Classes, ICC Learning Center, YouTube (canais como John Bartholomew/Hanging Pawns/Daniel Naroditsky com playlists estruturadas).

4. **Para `defesa-profilaxia`**: além de livros, busque series de vídeo específicas (ex: "How to Defend in Chess" séries no YouTube), artigos de ChessBase sobre técnica defensiva, cursos Chessable de defesa.

5. **Para `calculo-ponte-800-1200`**: foco em livros com exercícios progressivos de cálculo em posições de jogo real, não composições. Candidatos a investigar: Weteschnik "Understanding Chess Tactics", Volokitin/Grabinsky "Perfect Your Chess", Soltis "How to Choose a Chess Move", Tal / Lechtynsky "Attack with Mikhail Tal", Buckley "Chess Tactics for Intermediate Players".

6. **Organize o relatório por lacuna**, com uma seção para cada. Dentro de cada seção, ordene por nota (A primeiro). No final, inclua uma seção **"Descobertas Inesperadas"** para recursos de alto valor que não se encaixam nas lacunas listadas mas são relevantes ao método 0-1400.

## Formato do Relatório

Nomeie: **"Relatório Gemini — Recursos para Lacunas do Método Professor Lemos (2026-06-09)"**

Estrutura esperada:
1. Resumo executivo (máx 5 linhas): quantos recursos por nota, quais lacunas têm cobertura A disponível
2. Seção por lacuna (8 seções)
3. Descobertas Inesperadas
4. Tabela-resumo final: todos os recursos, lacuna, nota, grátis/pago

Seja exaustivo. Prefira errar pelo excesso de recursos B/C do que omitir um A. Se um recurso gratuito é download direto, inclua a URL completa. Se é pago, inclua o preço e o link de compra mais acessível.
