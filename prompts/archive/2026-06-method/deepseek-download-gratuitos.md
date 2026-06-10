# Download de Recursos Gratuitos de Xadrez — Execução DeepSeek

## Contexto

Projeto lichess-tutor: tutor pessoal de xadrez. Temos uma lista de recursos gratuitos confirmados (domínio público, CC, open access, MIT/GPL) mapeados por pesquisa de três IAs. Sua tarefa é baixar tudo para o disco local, organizar em pastas e gerar um manifesto de resultado.

## Pasta Raiz

```
output/free-resources/
├── books/           # PDFs de livros (Archive.org, Gutenberg)
├── papers/          # Papers acadêmicos (CC BY, open access)
├── lichess-studies/ # PGN de estudos Lichess (via API)
├── github-repos/    # Repositórios clonados
└── MANIFEST.md      # Log final de sucesso/falha
```

**Adicionar ao `.gitignore` caso ainda não exista:**
```
output/free-resources/
```

---

## Instruções Gerais

1. **Nunca parar por falha individual.** Se um item falhar (404, timeout, bloqueio), registrar em `MANIFEST.md` como `FALHOU` e continuar.
2. **Verificar tamanho mínimo:** após baixar, confirmar que o arquivo tem mais de 5KB. Arquivos menores são provavelmente páginas de erro — marcar como `FALHOU` e deletar.
3. **Não baixar recursos da lista `needs_license_review`** (Bobby Fischer Teaches Chess, Silman's Complete Endgame Course, Negi — esses podem ser uploads não autorizados).
4. **Rate limiting Lichess:** aguardar 1 segundo entre chamadas à API do Lichess.
5. **GitHub repos:** clonar com `--depth 1` para economizar espaço.
6. **Nomenclatura de arquivos:** usar kebab-case sem acentos, sem espaços.

---

## Categoria 1 — Livros PDF (Archive.org — Domínio Público / CC Confirmado)

Baixar com `curl -L -o {nome-arquivo}.pdf {URL}` na pasta `output/free-resources/books/`.

Para itens do Archive.org sem link PDF direto, usar o padrão:
`https://archive.org/download/{identifier}/{identifier}.pdf`
Se falhar, tentar: `https://archive.org/download/{identifier}/{identifier}_text.pdf`

| arquivo de destino | URL |
|--------------------|-----|
| `lasker-manual-of-chess-1925.pdf` | https://archive.org/download/lasker-s-manual-of-chess/lasker-s-manual-of-chess.pdf |
| `nimzowitsch-my-system-1925.pdf` | https://archive.org/download/nimzowitsch-my-system/nimzowitsch-my-system.pdf |
| `murray-history-of-chess-1913.pdf` | https://archive.org/download/AHistoryOfChess/AHistoryOfChess.pdf |
| `chess-strategy-bridport-1865.pdf` | https://archive.org/download/2007ChessStrategy/2007ChessStrategy.pdf |
| `700-chess-problems-baird-1902.pdf` | https://archive.org/download/2006700ChessProblems/2006700ChessProblems.pdf |
| `bojkov-georgiev-course-chess-tactics-2019.pdf` | https://archive.org/download/acourseinchesstactics/acourseinchesstactics.pdf |
| `chess-training-bibliography-2019.pdf` | https://archive.org/download/chesstrainingbibliography_201912/chesstrainingbibliography_201912.pdf |
| `ajedrez-sena-colombia-1990.pdf` | https://archive.org/download/1990Ajedrez/1990Ajedrez.pdf |
| `staunton-chess-players-handbook-1864.pdf` | https://archive.org/download/bub_gb_fd8CAAAAYAAJ/bub_gb_fd8CAAAAYAAJ.pdf |
| `morphy-games-1860.pdf` | https://archive.org/download/bub_gb_yCUCAAAAYAAJ/bub_gb_yCUCAAAAYAAJ.pdf |
| `chess-problems-made-easy-taverner-1924.pdf` | https://archive.org/download/TavernerChessProblemsMadeEasy/TavernerChessProblemsMadeEasy.pdf |
| `bohemian-garnets-havel-1923.pdf` | https://archive.org/download/GeorgeHumeBohemianGarnets/GeorgeHumeBohemianGarnets.pdf |
| `philidor-analyse-jeu-echecs-1803.pdf` | https://archive.org/download/bub_gb_cikCAAAAYAAJ/bub_gb_cikCAAAAYAAJ.pdf |
| `chess-studies-kling-horwitz-1851.pdf` | https://archive.org/download/bub_gb_5ZACAAAAQAAJ/bub_gb_5ZACAAAAQAAJ.pdf |
| `greco-games-1900.pdf` | https://archive.org/download/TheGamesOfGreco/TheGamesOfGreco.pdf |
| `sfetcu-game-of-chess.epub` | https://archive.org/download/the-game-of-chess-nicolae-sfetcu-ccns/the-game-of-chess-nicolae-sfetcu-ccns.epub |
| `ajedrez-ensenanza-primaria-2013.pdf` | https://archive.org/download/2013AjedrezParaLaEnseanzaPrimaria/2013AjedrezParaLaEnseanzaPrimaria.pdf |
| `gran-ajedrez-pequenos-2012.pdf` | https://archive.org/download/ElGranAjedrezParaPequeosAjedrecistas/ElGranAjedrezParaPequeosAjedrecistas.pdf |
| `boden-popular-introduction-chess-1851.pdf` | https://archive.org/download/bub_gb_mzkCAAAAQAAJ/bub_gb_mzkCAAAAQAAJ.pdf |
| `121-chess-problems-abbott-1887.pdf` | https://archive.org/download/2005121ChessProblems/2005121ChessProblems.pdf |
| `chess-encyclopedia-wall-1999.pdf` | https://archive.org/download/chessencyclopediabywallbill/chessencyclopediabywallbill.pdf |
| `discovering-chess-bott-morrison-1975.pdf` | https://archive.org/download/bottmorrisondiscoveringchess/bottmorrisondiscoveringchess.pdf |
| `chess-tournament-london-1851-staunton.pdf` | https://archive.org/download/bub_gb__SUCAAAAYAAJ/bub_gb__SUCAAAAYAAJ.pdf |
| `franklin-morals-of-chess-walker-1841.pdf` | https://archive.org/download/bub_gb_cCYCAAAAYAAJ/bub_gb_cCYCAAAAYAAJ.pdf |
| `lange-chess-strategy-russian-1924.pdf` | https://archive.org/download/20200309_20200309_0752/20200309_20200309_0752.pdf |

---

## Categoria 2 — Livros PDF (Project Gutenberg — Domínio Público)

Pasta: `output/free-resources/books/`

Usar URL do formato: `https://www.gutenberg.org/ebooks/{ID}` e baixar a versão PDF ou EPUB.
URL direta de download: `https://www.gutenberg.org/files/{ID}/{ID}-pdf.pdf` (tentar; se falhar, usar a página HTML do ebook para achar o link de download).

| arquivo de destino | Gutenberg ID | URL de download a tentar |
|--------------------|-------------|--------------------------|
| `capablanca-chess-fundamentals-1921.pdf` | 4902 | https://www.gutenberg.org/ebooks/4902.html.images → baixar como PDF ou EPUB |
| `edward-lasker-chess-strategy.pdf` | 5614 | https://www.gutenberg.org/ebooks/5614.html.images |
| `checkmates-three-pieces.pdf` | 71320 | https://www.gutenberg.org/ebooks/71320.html.images |

> **Instrução alternativa Gutenberg:** se o PDF não estiver disponível, baixar o EPUB (formato `.epub`) como alternativa. Se nem PDF nem EPUB, baixar o HTML completo e salvar como `.html`.

---

## Categoria 3 — Papers Acadêmicos (CC BY / Open Access confirmado)

Pasta: `output/free-resources/papers/`

| arquivo de destino | URL direta |
|--------------------|------------|
| `cepeda-2006-spacing-effects-distributed-practice.pdf` | http://www.yorku.ca/ncepeda/publications/CepedaPashlerVulWixtedRohrer2008.pdf |
| `sala-gobet-2017-chess-math-active-control.pdf` | https://link.springer.com/content/pdf/10.3758/s13420-017-0280-3.pdf |
| `sala-foley-gobet-2017-chess-teaching-challenges.pdf` | https://www.frontiersin.org/articles/10.3389/fpsyg.2017.00238/pdf |
| `rosholm-2017-chess-math-denmark-plosone.pdf` | https://journals.plos.org/plosone/article/file?id=10.1371/journal.pone.0177257&type=printable |
| `trinchero-sala-2016-chess-heuristics-transfer.pdf` | https://www.ejmste.com/download/chess-training-and-mathematical-problem-solving-the-role-of-teaching-heuristics-in-transfer-of-4771.pdf |
| `bart-2014-chess-scholastic-achievement-review.pdf` | https://www.frontiersin.org/articles/10.3389/fpsyg.2014.00762/pdf |
| `sala-2015-chess-math-problem-solving-sageopen.pdf` | https://journals.sagepub.com/doi/pdf/10.1177/2158244015596050 |
| `rohrer-2012-interleaving-helps-distinguish.pdf` | https://files.eric.ed.gov/fulltext/EJ983511.pdf |
| `kornell-bjork-2008-interleaving-induction.pdf` | https://www.researchgate.net/publication/23282278 → baixar PDF |
| `gobet-simon-1996-templates-chess-memory.pdf` | http://www.brunel.ac.uk/~hsstffg/papers/Gobet-Simon%201996%20Templates%20in%20Chess%20Memory.pdf |
| `sala-gobet-2019-near-far-transfer-meta.pdf` | https://www.collabra.org/articles/203/galley/1699/download/ |
| `charness-2005-deliberate-practice-chess.pdf` | https://www.researchgate.net/publication/7492139 → baixar PDF |

> **Instrução para ResearchGate:** se a URL do ResearchGate não der o PDF diretamente, tentar `{URL}/download` ou buscar o DOI no Semantic Scholar (semanticscholar.org) que frequentemente tem PDF direto.

---

## Categoria 4 — Estudos Lichess (PGN via API)

Pasta: `output/free-resources/lichess-studies/`

Endpoint: `https://lichess.org/api/study/{ID}.pgn`
Aguardar **1 segundo** entre cada chamada.

| arquivo de destino | ID do estudo | Descrição |
|--------------------|-------------|-----------|
| `jomega-beginner-simple-tactics-1.pgn` | s3iOCawc | Beginner: Simple Tactics I |
| `jomega-beginner-simple-tactics-2.pgn` | 6JAUFQ5p | Beginner: Simple Tactics II |
| `jomega-beginner-tactics.pgn` | Iof6LzcT | Beginner: Tactics |
| `hgambit-tactics-road-to-trickster.pgn` | Zd7sZKEK | Tactics: Road to trickster |
| `litlife-tactics-for-beginners.pgn` | c1QH9FBL | TACTICS FOR BEGINNERS |
| `pc2limliyuan-7-tactical-patterns.pgn` | yVuoQstt | 7 Tactical Patterns |
| `njswift-calculation-forcing-moves.pgn` | 3EUMrN8q | Calculation: Stock Forcing Moves |
| `njswift-calculation-mating-attacks.pgn` | QBD3NlHM | Calculation: Stock Mating Attacks |
| `cj58-progressive-puzzles.pgn` | WiuSw3ga | Progressive Puzzles |
| `noseknowsall-beginner-endgames.pgn` | wukLYIXj | Beginner Endgames You Must Know |
| `noseknowsall-intermediate-endgames.pgn` | UsqmCsgC | Intermediate Endgames You Must Know |
| `noseknowsall-rook-endgames.pgn` | bnboDhFM | Rook Endgames You Must Know |
| `noseknowsall-knights-dominate.pgn` | kI8ikTU4 | Knights: How to Dominate |
| `noseknowsall-bishops.pgn` | kNn68T8l | Bishops: Slice Through Opposition |
| `noseknowsall-rooks-infiltrate.pgn` | U7tTRtdj | Rooks: Infiltrate for Activity |
| `noseknowsall-light-dark-squares.pgn` | T3ixjwmg | Light and Dark Squares |
| `noseknowsall-talk-to-pieces-1.pgn` | kjBSgqoA | Talk to Your Pieces! Plans I |
| `noseknowsall-pawns-developing-plans-2.pgn` | dYFcDtRq | Pawns Aren't People! Plans II |
| `noseknowsall-art-trading-pieces.pgn` | Uv0fEBhQ | The Art of Trading Pieces |
| `jomega-soltis-pawn-structures.pgn` | B5upGe9A | Intermediate: Soltis Pawn Structures |
| `jomega-beginner-opening-1.pgn` | Fya8BLe7 | Beginner: Opening I |
| `leninperez-london-system-beginners.pgn` | p1pdMu9b | The London System For Beginners |
| `leninperez-italian-opening.pgn` | teIkpgZj | The Italian Opening (For Beginners) |
| `az-heerenven-prophylaxis-defense.pgn` | gd72h0Yp | GM Prep: Attack, Defense and Prophylaxis |
| `njswift-tactics-intermediate.pgn` | BuuWgqfi | Tactics! Intermediate |
| `leninperez-four-knights.pgn` | JRFGuWZi | Four Knights Game |

---

## Categoria 5 — Repositórios GitHub (git clone --depth 1)

Pasta raiz: `output/free-resources/github-repos/`

Clonar cada um com:
```bash
git clone --depth 1 {URL} output/free-resources/github-repos/{nome-pasta}
```

| nome-pasta | URL do repositório | Descrição |
|-----------|-------------------|-----------|
| `personal-puzzles` | https://github.com/guidogoessling/personal-puzzles | 50k puzzles offline PGN |
| `chess-tactics-pgn` | https://github.com/xinyangz/chess-tactics-pgn | Táticas em PGN por tema |
| `lichess-puzzle-mixer` | https://github.com/DSerejo/lichess-puzzle-mixer | Misturador de puzzles Lichess |
| `chess-blunder-trainer` | https://github.com/MrLokans/chess-blunder-trainer | Treino a partir de blunders |
| `harland-chess-trainer` | https://github.com/Isaachpeterson/harland-chess-trainer | SR com erros do próprio Lichess |
| `chessrepeat` | https://github.com/jacokyle/chessrepeat | Spaced repetition para aberturas |
| `chess-self-coach` | https://github.com/Bobain/chess-self-coach | Auto-coach de xadrez |
| `listudy` | https://github.com/listudy/listudy | PWA open source de SR para xadrez |
| `openingtree` | https://github.com/openingtree/openingtree | Árvore de aberturas das suas partidas |
| `grandmaster-codex` | https://github.com/kitfoxs/grandmaster-codex | Codex do GM (web app 0-2000) |

> **Nota sobre `personal-puzzles`:** este repositório pode ser grande (50k puzzles). Se exceder 500MB, clonar somente com `--depth 1` e verificar tamanho antes de confirmar.

---

## Manifesto de Resultado

Ao finalizar, criar `output/free-resources/MANIFEST.md` com a seguinte estrutura:

```markdown
# Manifesto de Downloads — lichess-tutor free resources
Data: {data}

## Resumo
- Total tentado: {N}
- Sucesso: {N}
- Falhou: {N}

## Books — Sucesso
| arquivo | tamanho | fonte |
|---------|---------|-------|
...

## Books — Falhou
| arquivo | URL | erro |
|---------|-----|------|
...

## Papers — Sucesso
...

## Papers — Falhou
...

## Lichess Studies — Sucesso
...

## Lichess Studies — Falhou
...

## GitHub Repos — Clonados
| repo | commits | tamanho |
|------|---------|---------|
...

## GitHub Repos — Falhou
...
```

---

## Itens a NÃO Baixar (licença incerta)

Estes aparecem no Archive.org com licença suspeita — **não baixar**:
- Bobby Fischer Teaches Chess (upload provavelmente não autorizado da Bantam Books 1966)
- Silman's Complete Endgame Course (obra de 2007, upload suspeito)
- 1.e4 vs The Sicilian Vol 2 (Quality Chess 2015, upload claramente não autorizado)
- Qualquer livro de editoras vivas (Quality Chess, Everyman, New In Chess, Gambit) encontrado no Archive.org com data recente

---

## Verificação Final

Após completar todos os downloads, listar:
1. Quantos arquivos baixados por categoria
2. Tamanho total em MB
3. Qualquer repositório GitHub com mais de 200MB (sinalizar para revisão)
4. Estudos Lichess que retornaram PGN vazio (estudos deletados pelo autor)
