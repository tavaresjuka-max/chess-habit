# Relatório Codex — Open Source, Dados e Evidência Técnica para Lacunas do Método Professor Lemos (2026-06-09)

Data de execução: 2026-06-10

Escopo: terceiro vértice da pesquisa de lacunas, focado em recursos open source, datasets, ferramentas, APIs oficiais e evidência técnica/academica. Não substitui os relatórios Gemini (livros/cursos amplos e PT-BR) e DeepSeek (download, preço e compra); complementa-os.

Regra clean-room: nenhum conteúdo de puzzle, solução, comentário de partida ou trecho protegido foi copiado para o app. Recursos abaixo são insumos de curadoria, arquitetura pedagógica e critérios de seleção.

## Resumo executivo

1. O melhor recurso "A" encontrado é o **Lichess Puzzle Database**: 6,014,381 puzzles no CSV oficial, com `Rating`, `RatingDeviation`, `Popularity`, `NbPlays`, `Themes` e licença pública suficiente para uso limpo.
2. O Lichess já tem volume massivo nos temas críticos: fork 829,974; mateIn2 816,164; pin 382,824; deflection 272,542; defensiveMove 377,797; short 3,226,341; long 1,614,124.
3. Para `calculo-ponte-800-1200`, a melhor solução técnica é **filtrar Lichess puzzles por rating/tema/comprimento/popularidade**, não comprar mais um banco de exercícios.
4. Para `threshold-dominio`, não encontrei pesquisa A específica de xadrez dizendo "% de acerto = aprendido"; a resposta forte é usar Lichess telemetry + critérios provisórios inspirados em mastery learning e retrieval practice.
5. Para `intervalos-repeticao-espacada`, Cepeda et al. 2006/2008 e FSRS dão base técnica forte, mas não são específicos de xadrez.
6. Para `interleaving-sessao`, a evidência acadêmica é boa em matemática/categorias visuais, mas indireta para xadrez.
7. Para `defesa-profilaxia-1000-1400` e `abertura-minima-timing`, não há cobertura A aberta conhecida; há bons recursos B/C.
8. Recomendação central: integrar um **pipeline local de seleção de puzzles Lichess** antes de pagar por novos bancos; usar ChessTempo pago só se o dono quiser custom sets prontos fora do app.

## Seção 1 — Recursos Open Source e Datasets

### Lichess Puzzle Database — Lichess

- Tipo: dataset
- Acesso: GRATUITO [https://database.lichess.org/#puzzles](https://database.lichess.org/#puzzles)
- Lacuna(s): `calculo-ponte-800-1200`, `calculo-sistematico-1200plus`, `threshold-dominio`, `proporcao-revisao-vs-novo`, `intervalos-repeticao-espacada`
- Nota: A
- Justificativa: O CSV oficial tinha 6,014,381 puzzles em 2026-06-04, com campos `Rating`, `RatingDeviation`, `Popularity`, `NbPlays`, `Themes`, `GameUrl` e `OpeningTags`. É usável para treino progressivo: filtrar rating 800-1200, `RatingDeviation` baixo, `Popularity` positiva, temas-alvo e comprimentos `short/long`.
- Observação técnica: o dataset é excelente para **seleção**, mas o app não deve armazenar PGN inteiro nem virar tabuleiro próprio. O destino preferencial continua `https://lichess.org/training/{PuzzleId}` ou tema Lichess.

### Lichess Puzzle Themes — Lichess

- Tipo: dataset vivo / catálogo de temas
- Acesso: GRATUITO [https://lichess.org/training/themes](https://lichess.org/training/themes)
- Lacuna(s): `calculo-ponte-800-1200`, `defesa-profilaxia-1000-1400`, `calculo-sistematico-1200plus`
- Nota: A
- Justificativa: A página oficial fornece contagens vivas por tema e confirma abundância nos motivos prioritários.

Contagens relevantes observadas:

| tema Lichess | contagem | uso no método |
|---|---:|---|
| Fork | 829,974 | garfos e cálculo curto 800-1200 |
| Mate in 2 | 816,164 | linhas forçadas de 2 lances |
| Pin | 382,824 | DAMP/alinhamento |
| Deflection | 272,542 | remover/desviar defensor |
| Discovered attack | 326,687 | cálculo curto e visualização |
| Hanging piece | 250,674 | DAMP/defesa, LPDO |
| Defensive move | 377,797 | defesa prática, melhor B aberto |
| Quiet move | 258,870 | cálculo além de CCT bruto |
| Skewer | 141,588 | alinhamento |
| Trapped piece | 73,340 | mobilidade/DAMP |
| Short puzzle | 3,226,341 | dois movimentos para vencer |
| Long puzzle | 1,614,124 | três movimentos para vencer |
| Very long puzzle | 508,102 | quatro ou mais movimentos |

### Lichess/chess-puzzles — Hugging Face mirror

- Tipo: dataset / espelho técnico
- Acesso: GRATUITO [https://huggingface.co/datasets/Lichess/chess-puzzles](https://huggingface.co/datasets/Lichess/chess-puzzles)
- Lacuna(s): `calculo-ponte-800-1200`, `threshold-dominio`
- Nota: B
- Justificativa: Espelho conveniente para análise com `datasets`, com 5,939,980 linhas na versão de 2026-05-15. É útil para prototipagem e contagens, mas a fonte canônica continua `database.lichess.org`.

### Lichess API — Puzzles

- Tipo: API oficial
- Acesso: GRATUITO [https://lichess.org/api](https://lichess.org/api) / spec em [https://github.com/lichess-org/api](https://github.com/lichess-org/api)
- Lacuna(s): `threshold-dominio`, `proporcao-revisao-vs-novo`, `intervalos-repeticao-espacada`
- Nota: A
- Justificativa: A seção de Puzzles permite histórico/dashboard/replay via escopo `puzzle:read`, que o app já usa. É a base certa para medir domínio por sinais locais: taxa de acerto, tema, recência, repetição, dificuldade e queda de erro.

### Lichess Practice

- Tipo: curso interativo gratuito
- Acesso: GRATUITO [https://lichess.org/practice](https://lichess.org/practice)
- Lacuna(s): `calculo-ponte-800-1200`, `abertura-minima-timing`
- Nota: B
- Justificativa: Cobre checkmates, táticas fundamentais, táticas avançadas, finais de peões e finais de torres. É forte para `explain/guided`, mas não resolve sozinho cálculo progressivo nem defesa/profilaxia.

### Lichess Studies curados de defesa/cálculo

- Tipo: estudos comunitários
- Acesso: GRATUITO
- Lacuna(s): `defesa-profilaxia-1000-1400`, `calculo-sistematico-1200plus`
- Nota: B/C
- Justificativa: Existem estudos úteis como [Mastering Defense!](https://lichess.org/study/mISHv4ck), [Advanced: Calculation](https://lichess.org/study/ONYKV9a1), [CCC Calculation Training Ground](https://lichess.org/study/LdiC0tfG) e tópicos populares de estratégia. A qualidade é heterogênea; entram como reforço revisado, não como fonte canônica.

### ChessTempo Custom Sets / Spaced Repetition — ChessTempo

- Tipo: ferramenta / plataforma de treino
- Acesso: FREEMIUM; Gold oficial US$4/mês ou US$35/ano [https://chesstempo.com/memberships/](https://chesstempo.com/memberships/)
- Lacuna(s): `intervalos-repeticao-espacada`, `threshold-dominio`, `calculo-ponte-800-1200`, `calculo-sistematico-1200plus`
- Nota: A para uso externo; B para integração no app
- Justificativa: Tem custom sets por tema, rating, erros prévios e seleção por spaced repetition. É provavelmente a melhor ferramenta pronta fora do Lichess para treinar as lacunas com controle fino. Para o app open-source/local-first, não deve ser dependência central.

### SCID — Shane's Chess Information Database

- Tipo: ferramenta open source
- Acesso: GRATUITO / GPL [https://scid.sourceforge.net/](https://scid.sourceforge.net/)
- Lacuna(s): `calculo-sistematico-1200plus`, `abertura-minima-timing`
- Nota: C
- Justificativa: Excelente gerenciador de bases e estudos com milhões de partidas, mas não é um tutor nem resolve automaticamente lacunas de cálculo/defesa. Útil para curadoria offline avançada, pesado demais para a fase pessoal do app.

### ChessDB.cn Cloud Database API

- Tipo: banco de posições / API
- Acesso: GRATUITO [https://www.chessdb.cn/queryc_en/](https://www.chessdb.cn/queryc_en/) e docs [https://chessdb.cn/cloudbookc_api_en.html](https://chessdb.cn/cloudbookc_api_en.html)
- Lacuna(s): `calculo-sistematico-1200plus`, `defesa-profilaxia-1000-1400`
- Nota: C/D
- Justificativa: Tecnicamente forte para consulta de posições, mas baseado em análise/cloud e não em pedagogia. Para este projeto, traz risco de virar engine/consulta externa demais; não recomendo como recurso ativo.

### vitogit/lichess-tactics-generator

- Tipo: repositório GitHub / ferramenta
- Acesso: GRATUITO [https://github.com/vitogit/lichess-tactics-generator](https://github.com/vitogit/lichess-tactics-generator)
- Lacuna(s): `calculo-ponte-800-1200`, `threshold-dominio`
- Nota: B
- Justificativa: Gera táticas a partir de partidas analisadas no Lichess, usando sinais que o próprio Lichess já anexou. É próximo do fluxo desejado "meus erros viram treino", mas precisa auditoria técnica/legal antes de reaproveitar qualquer lógica.

### linrock/chess-puzzle-maker

- Tipo: repositório GitHub / gerador de puzzles
- Acesso: GRATUITO [https://github.com/linrock/chess-puzzle-maker](https://github.com/linrock/chess-puzzle-maker)
- Lacuna(s): `calculo-ponte-800-1200`
- Nota: C
- Justificativa: Cria puzzles de PGNs a partir de sequências claras de melhores lances. É útil como referência técnica, mas o app evita rodar engine e não precisa gerar banco próprio enquanto o Lichess já cobre o domínio.

### catchouli/better_tactics

- Tipo: repositório GitHub / treinador SRS
- Acesso: GRATUITO [https://github.com/catchouli/better_tactics](https://github.com/catchouli/better_tactics)
- Lacuna(s): `intervalos-repeticao-espacada`, `threshold-dominio`
- Nota: B
- Justificativa: Treinador de táticas com spaced repetition. Boa inspiração de UX/loop; qualidade, manutenção e dados precisam ser verificados antes de qualquer adoção.

### pwenker/chessli e chessli2

- Tipo: repositório GitHub / treinador open source
- Acesso: GRATUITO [https://github.com/pwenker/chessli](https://github.com/pwenker/chessli), [https://github.com/pwenker/chessli2](https://github.com/pwenker/chessli2)
- Lacuna(s): `intervalos-repeticao-espacada`, `abertura-minima-timing`
- Nota: B
- Justificativa: Ferramenta livre de flashcards/SRS para xadrez integrada ao Lichess. Mais relevante para abertura/repertório do que para cálculo tático.

### Listudy / Anki Chess

- Tipo: ferramenta livre / SRS
- Acesso: GRATUITO [https://listudy.org/en/blog/anki-chess](https://listudy.org/en/blog/anki-chess)
- Lacuna(s): `intervalos-repeticao-espacada`, `abertura-minima-timing`
- Nota: B
- Justificativa: Listudy argumenta que PGN + treino interativo é melhor que Anki cru para xadrez. Bom recurso externo; não substitui Lichess para execução principal.

### AnkiWeb chess puzzle decks

- Tipo: deck Anki
- Acesso: GRATUITO [Optimized Chess Puzzles](https://ankiweb.net/shared/info/894523279), [Chess Tactics - Lichess 19,667 Puzzles](https://ankiweb.net/shared/info/1621586600)
- Lacuna(s): `intervalos-repeticao-espacada`, `calculo-ponte-800-1200`
- Nota: C
- Justificativa: Úteis para experimento pessoal com SRS, mas decks prontos têm curadoria/atualização incerta e UX pior que Lichess/ChessTempo/Listudy para posições.

### ChessKid lessons/curriculum

- Tipo: curso / currículo
- Acesso: FREEMIUM; currículo escolar gratuito com restrições de redistribuição [https://www.chesskid.com/learn/articles/chesskidcoms-curriculum](https://www.chesskid.com/learn/articles/chesskidcoms-curriculum)
- Lacuna(s): `calculo-ponte-800-1200`, `abertura-minima-timing`
- Nota: C
- Justificativa: Estruturado e amigável, mas infantil e com restrições. Pode inspirar sequenciamento, não voz nem conteúdo do Professor Lemos.

### Exercism chess exercises

- Tipo: plataforma de programação
- Acesso: GRATUITO [https://exercism.org/](https://exercism.org/)
- Lacuna(s): nenhuma principal
- Nota: D
- Justificativa: Há exercícios de programação com tema xadrez, mas não há track de treino enxadrístico. Fora do escopo pedagógico.

## Seção 2 — Evidência Acadêmica

### `threshold-dominio`

#### A Practical Review of Mastery Learning — Winget & Persky (2022/2023)

- Tipo: paper acadêmico / revisão
- Acesso: OPEN ACCESS [https://pmc.ncbi.nlm.nih.gov/articles/PMC10159400/](https://pmc.ncbi.nlm.nih.gov/articles/PMC10159400/)
- DOI/URL: PMC10159400
- Lacuna(s): `threshold-dominio`
- Nota: B
- Justificativa: Revisa mastery learning e a ideia de critérios de competência antes de avançar. Não dá um número específico para puzzles de xadrez; sustenta usar thresholds explícitos + remediação.

#### How Much Mastery is Enough Mastery? — EDM 2025

- Tipo: paper / educational data mining
- Acesso: OPEN ACCESS [https://educationaldatamining.org/EDM2025/proceedings/2025.EDM.short-papers.4/index.html](https://educationaldatamining.org/EDM2025/proceedings/2025.EDM.short-papers.4/index.html)
- Lacuna(s): `threshold-dominio`
- Nota: C/B
- Justificativa: Sugere que thresholds altos como 0.95 continuam relevantes em plataformas adaptativas, mas o domínio estudado não é xadrez. Útil como alerta: 70-80% pode ser baixo para avanço automático.

#### Monitoring Accuracy and Self-Regulation When Learning to Play a Chess Endgame — de Bruin, Rikers & Schmidt (2005)

- Tipo: paper acadêmico
- Acesso: PAYWALL/metadata [https://doi.org/10.1002/acp.1109](https://doi.org/10.1002/acp.1109)
- Lacuna(s): `threshold-dominio`, `proporcao-revisao-vs-novo`
- Nota: B
- Justificativa: Específico de xadrez/endgame e auto-regulação. Apoia medir julgamento de aprendizagem e seleção de revisão, mas não fornece threshold simples de puzzle mastery.

#### Improving Metacomprehension Accuracy and Self-Regulation in Cognitive Skill Acquisition — de Bruin, Rikers & Schmidt (2007)

- Tipo: paper acadêmico
- Acesso: PAYWALL/metadata [https://doi.org/10.1080/09541440701326204](https://doi.org/10.1080/09541440701326204)
- Lacuna(s): `threshold-dominio`, `proporcao-revisao-vs-novo`
- Nota: B
- Justificativa: Também usa aprendizagem de endgame de xadrez; reforça que expertise afeta precisão de autoavaliação. Bom para o Professor Lemos pedir "facil/bom/dificil" sem confiar cegamente nisso.

Decisão Codex: não existe A direto para "% de puzzles = aprendido". Proposta técnica: começar com **>=80% em tema rotulado**, **>=70% em misto**, **>=85-90% em revisão espaçada de erros**, e calibrar por dados locais do dono.

### `proporcao-revisao-vs-novo`

#### Distributed Practice in Verbal Recall Tasks: A Review and Quantitative Synthesis — Cepeda, Pashler, Vul, Wixted & Rohrer (2006)

- Tipo: meta-análise
- Acesso: PubMed [https://pubmed.ncbi.nlm.nih.gov/16719566/](https://pubmed.ncbi.nlm.nih.gov/16719566/), PDF disponível em repositórios acadêmicos
- DOI: [10.1037/0033-2909.132.3.354](https://doi.org/10.1037/0033-2909.132.3.354)
- Lacuna(s): `proporcao-revisao-vs-novo`, `intervalos-repeticao-espacada`
- Nota: A para princípio geral; B para xadrez
- Justificativa: Evidência forte de spacing/distributed practice. Não dá proporção novo/revisão para xadrez, mas sustenta não deixar revisão virar opcional.

#### Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention — Roediger & Karpicke (2006)

- Tipo: paper acadêmico
- Acesso: PubMed [https://pubmed.ncbi.nlm.nih.gov/16507066/](https://pubmed.ncbi.nlm.nih.gov/16507066/), DOI [10.1111/j.1467-9280.2006.01693.x](https://doi.org/10.1111/j.1467-9280.2006.01693.x)
- Lacuna(s): `proporcao-revisao-vs-novo`, `intervalos-repeticao-espacada`
- Nota: B
- Justificativa: Sustenta retrieval practice e review ativa. Como é verbal/prosa, transfere por princípio, não por domínio.

#### Practice, Intelligence, and Enjoyment in Novice Chess Players — de Bruin, Kok, Leppink & Camp (2014)

- Tipo: paper acadêmico
- Acesso: metadata [https://research.ou.nl/en/publications/practice-intelligence-and-enjoyment-in-novice-chess-players-a-pro/](https://research.ou.nl/en/publications/practice-intelligence-and-enjoyment-in-novice-chess-players-a-pro/)
- DOI: [10.1016/j.intell.2013.07.004](https://doi.org/10.1016/j.intell.2013.07.004)
- Lacuna(s): `proporcao-revisao-vs-novo`
- Nota: B
- Justificativa: Específico de novatos em xadrez e prática, mas não prescreve uma proporção operacional revisão/novo.

Decisão Codex: adotar no app um ponto de partida **60-70% foco atual/novo guiado e 30-40% revisão ativa**, subindo revisão quando houver erro recorrente ou pausa longa. Isso deve ser hipótese instrumentada, não dogma.

### `intervalos-repeticao-espacada`

#### Spacing Effects in Learning: A Temporal Ridgeline of Optimal Retention — Cepeda, Vul, Rohrer, Wixted & Pashler (2008)

- Tipo: paper acadêmico
- Acesso: OPEN ACCESS [https://escholarship.org/uc/item/0kp5q19x](https://escholarship.org/uc/item/0kp5q19x)
- DOI: [10.1111/j.1467-9280.2008.02209.x](https://doi.org/10.1111/j.1467-9280.2008.02209.x)
- Lacuna(s): `intervalos-repeticao-espacada`, `proporcao-revisao-vs-novo`
- Nota: A para regra geral; B para xadrez
- Justificativa: Demonstra relação entre intervalo de estudo e intervalo de retenção. Serve para um calendário inicial: revisar erros em 1 dia, depois 3-7 dias, depois 14-30 dias, ajustando por desempenho.

#### FSRS — Open Spaced Repetition

- Tipo: algoritmo open source
- Acesso: GRATUITO [https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler](https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler)
- Lacuna(s): `intervalos-repeticao-espacada`, `threshold-dominio`
- Nota: B
- Justificativa: Implementação moderna, local e aberta para scheduling. Não é validado especificamente em puzzles de xadrez, mas é um candidato técnico melhor que inventar agenda fixa.

Decisão Codex: para P3 pessoal, não precisa implementar FSRS completo. Basta `erro hoje -> +1d -> +3d -> +7d -> +14d`, com reset se errar. FSRS fica como P4/P5 ou experimento local.

### `interleaving-sessao`

#### Interleaved Practice Improves Mathematics Learning — Rohrer, Dedrick & Stershic (2015)

- Tipo: paper acadêmico
- Acesso: DOI [10.1037/edu0000001](https://doi.org/10.1037/edu0000001), ERIC PDF [https://files.eric.ed.gov/fulltext/ED557355.pdf](https://files.eric.ed.gov/fulltext/ED557355.pdf)
- Lacuna(s): `interleaving-sessao`
- Nota: A para matemática; B para xadrez
- Justificativa: Evidência forte de que alternar tipos de problema melhora transferência em relação a blocos homogêneos. Para xadrez, recomenda "tema rotulado primeiro; misto/interleaved depois".

#### Spacing and Interleaving Effects Require Distinct Theoretical Bases — Chen et al. (2021)

- Tipo: paper/revisão teórica
- Acesso: PDF [https://discover.nl.edu/media/nledu/content-assets/documents/ctle/on-demand-learning-resources/Chen2021_Article_SpacingAndInterleavingEffectsR.pdf](https://discover.nl.edu/media/nledu/content-assets/documents/ctle/on-demand-learning-resources/Chen2021_Article_SpacingAndInterleavingEffectsR.pdf)
- Lacuna(s): `interleaving-sessao`, `intervalos-repeticao-espacada`
- Nota: B
- Justificativa: Separa mecanismo de spacing e interleaving. Ajuda o método a não confundir "revisar depois" com "misturar temas".

#### Interleaved Practice Enhances Memory and Problem-Solving Ability — PMC

- Tipo: paper acadêmico
- Acesso: OPEN ACCESS [https://pmc.ncbi.nlm.nih.gov/articles/PMC8589969/](https://pmc.ncbi.nlm.nih.gov/articles/PMC8589969/)
- Lacuna(s): `interleaving-sessao`
- Nota: B
- Justificativa: Reforça transferência por prática alternada, mas não é xadrez. Serve como evidência indireta.

Decisão Codex: no app, usar **blocked practice** no primeiro contato com um tema e **interleaving** quando o tema rotulado atinge domínio mínimo. Exemplo: 10 min garfo rotulado, depois 10 min misto com garfo/pin/discovered.

### `calculo-ponte-800-1200` e `calculo-sistematico-1200plus`

#### Perception in Chess / Skill in Chess — Chase & Simon (1973)

- Tipo: paper clássico
- Acesso: PDF Carnegie Mellon [Skill in Chess](https://iiif.library.cmu.edu/file/Simon_box00066_fld05052_bdl0001_doc0001/Simon_box00066_fld05052_bdl0001_doc0001.pdf), PDF [Perception in Chess](https://andymatuschak.org/prompts/Chase1973.pdf)
- Lacuna(s): `calculo-ponte-800-1200`, `calculo-sistematico-1200plus`
- Nota: B
- Justificativa: Fundamenta chunking/pattern recognition em xadrez; apoia treino de padrões e posições reais. Não ensina método operacional de cálculo.

#### Specialization Effect and Its Influence on Memory and Problem Solving in Expert Chess Players — Bilalić, McLeod & Gobet (2009)

- Tipo: paper acadêmico
- Acesso: DOI [10.1111/j.1551-6709.2009.01030.x](https://doi.org/10.1111/j.1551-6709.2009.01030.x), abstract [PhilPapers](https://philpapers.org/rec/BILSEA)
- Lacuna(s): `abertura-minima-timing`, `calculo-sistematico-1200plus`
- Nota: C/B
- Justificativa: Mostra que especialização em aberturas afeta memória e solução de problemas. Para o app, é argumento contra repertório estreito cedo: especializar demais pode enviesar o olhar.

#### The Role of Intuition and Deliberative Thinking in Experts' Superior Tactical Decision-Making — Moxley, Ericsson, Charness & Krampe (2012)

- Tipo: paper acadêmico
- Acesso: DOI [10.1016/j.cognition.2012.03.005](https://doi.org/10.1016/j.cognition.2012.03.005), metadata [PhilPapers](https://philpapers.org/rec/MOXTRO)
- Lacuna(s): `calculo-sistematico-1200plus`
- Nota: B
- Justificativa: Apoia alternância entre intuição treinada e verificação deliberada. Para 1200+, sustenta "candidate moves + resposta adversária" sem virar árvore Kotov pesada.

#### The Role of Deliberate Practice in Chess Expertise — Charness, Tuffiash, Krampe, Reingold & Vasyukova (2005)

- Tipo: paper acadêmico
- Acesso: DOI [10.1002/acp.1106](https://doi.org/10.1002/acp.1106), metadata [Semantic Scholar](https://www.semanticscholar.org/paper/The-role-of-deliberate-practice-in-chess-expertise-Charness-Tuffiash/d81f7d099bfb9852d53f30faeb31c7ebe442b540)
- Lacuna(s): `proporcao-revisao-vs-novo`, `calculo-sistematico-1200plus`
- Nota: B
- Justificativa: Evidência de prática deliberada em expertise de xadrez; não responde diretamente a agenda semanal, mas valida treino sério e feedback.

#### The Role of Domain-Specific Practice, Handedness, and Starting Age in Chess — Gobet & Campitelli (2007)

- Tipo: paper acadêmico
- Acesso: DOI [10.1037/0012-1649.43.1.159](https://doi.org/10.1037/0012-1649.43.1.159), PubMed [https://pubmed.ncbi.nlm.nih.gov/17201516/](https://pubmed.ncbi.nlm.nih.gov/17201516/)
- Lacuna(s): `proporcao-revisao-vs-novo`
- Nota: B/C
- Justificativa: Confirma importância de prática de domínio, mas não fornece parâmetros de sessão para 800-1200.

### `abertura-minima-timing`

Não encontrei paper A que diga "introduza a primeira abertura por nome exatamente em X nível". O melhor material técnico é indireto:

- Lichess Practice cobre princípios/fundamentos sem exigir repertório.
- ChessTempo/Chessdriller/Listudy resolvem memorização de linhas, mas são mais úteis depois que o repertório existe.
- Bilalić et al. 2009 alerta que especialização molda solução de problemas, então repertório estreito cedo pode ser uma faca de dois gumes.

Decisão Codex: para o Professor Lemos, manter regra conservadora: antes de estabilidade em segurança/tática curta, só princípios; depois, **uma abertura por nome como etiqueta de plano**, não árvore de variante.

## Seção 3 — Triangulação e Recomendações

### 1. Lacunas com cobertura A disponível

| lacuna | cobertura A | síntese |
|---|---|---|
| `calculo-ponte-800-1200` | Lichess Puzzle Database + Puzzle Themes | Há dados abertos suficientes para montar progressão própria filtrada por rating/tema/comprimento. |
| `calculo-sistematico-1200plus` | Lichess long/veryLong + ChessTempo custom sets | Há material de treino; método explicativo ainda vem dos livros já integrados. |
| `intervalos-repeticao-espacada` | Cepeda 2006/2008 + FSRS | Forte para memória/retrieval, indireto para xadrez. |
| `interleaving-sessao` | Rohrer et al. 2015 | Forte em domínios análogos; usar com cautela pós-tema-rotulado. |

### 2. Lacunas sem cobertura A conhecida

| lacuna | status honesto | melhor fallback |
|---|---|---|
| `defesa-profilaxia-1000-1400` | Sem recurso aberto A específico e pedagógico no nível. | Lichess `defensiveMove` + estudos curados + módulo próprio "ameaça dele -> defesa ativa". |
| `threshold-dominio` | Sem número validado para puzzles de xadrez. | Começar com thresholds provisórios e calibrar com dados locais. |
| `proporcao-revisao-vs-novo` | Sem proporção xadrez-específica por nível. | 30-40% revisão ativa como base, mais quando houver erro recorrente. |
| `abertura-minima-timing` | Sem evidência acadêmica direta. | Princípios antes; etiqueta de abertura só quando segurança/tática curta estiver estável. |

### 3. Recursos exclusivos deste relatório

| recurso | por que provavelmente não entrou no Gemini/DeepSeek |
|---|---|
| Contagens vivas por tema do Lichess | É dado operacional, não livro/curso. |
| Lichess CSV filtrável por `Rating`, `RatingDeviation`, `Popularity`, `NbPlays`, `Themes` | É engenharia de dataset. |
| Hugging Face `Lichess/chess-puzzles` | Facilita prototipagem técnica, não compra/download tradicional. |
| FSRS / Open Spaced Repetition | Algoritmo implementável localmente. |
| GitHub `lichess-tactics-generator`, `better_tactics`, `chessli`, `chess-puzzle-maker` | Ferramentas open source, qualidade desigual, úteis como referência. |
| EDM 2025 mastery threshold | Evidência recente de edtech, não xadrez. |

### 4. Recomendação de síntese: 1 recurso por lacuna

| lacuna | recurso recomendado | nota | justificativa curta |
|---|---|---|---|
| `calculo-ponte-800-1200` | Lichess Puzzle Database filtrado | A | Gratuito, público, real-game, tema/rating/comprimento filtráveis. |
| `defesa-profilaxia-1000-1400` | Lichess `defensiveMove` + estudo `Mastering Defense!` | B | Melhor aberto; falta método A próprio. |
| `threshold-dominio` | Lichess puzzle telemetry local | B/A interno | A resposta deve vir dos dados do dono, não de número universal. |
| `proporcao-revisao-vs-novo` | Cepeda 2006 + logs locais | B | Base forte de spacing; proporção exata precisa ser calibrada. |
| `intervalos-repeticao-espacada` | Cepeda 2008 + agenda 1/3/7/14/30 | A/B | Melhor base para intervalo inicial simples. |
| `interleaving-sessao` | Rohrer et al. 2015 | B | Usar interleaving depois de treino rotulado. |
| `abertura-minima-timing` | Lichess Practice + regra interna conservadora | C/B | Não há A; evitar repertório cedo. |
| `calculo-sistematico-1200plus` | ChessTempo custom sets ou Lichess long/veryLong | A/B | ChessTempo é melhor pronto; Lichess é melhor integrado e gratuito. |

## Tabela final

| recurso | tipo | lacuna(s) | nota | URL/preço |
|---|---|---|---|---|
| Lichess Puzzle Database | dataset | calculo, threshold, revisão | A | [database.lichess.org/#puzzles](https://database.lichess.org/#puzzles), gratuito |
| Lichess Puzzle Themes | catálogo | calculo, defesa | A | [lichess.org/training/themes](https://lichess.org/training/themes), gratuito |
| Lichess API Puzzles | API | threshold, revisão, SRS | A | [lichess.org/api](https://lichess.org/api), gratuito |
| Lichess/chess-puzzles HF | dataset mirror | calculo, threshold | B | [Hugging Face](https://huggingface.co/datasets/Lichess/chess-puzzles), gratuito |
| Lichess Practice | curso interativo | cálculo, abertura | B | [lichess.org/practice](https://lichess.org/practice), gratuito |
| Mastering Defense! | estudo Lichess | defesa | B | [lichess.org/study/mISHv4ck](https://lichess.org/study/mISHv4ck), gratuito |
| Advanced: Calculation | estudo Lichess | cálculo 1200+ | B/C | [lichess.org/study/ONYKV9a1](https://lichess.org/study/ONYKV9a1), gratuito |
| ChessTempo Custom Sets | ferramenta | SRS, threshold, calculo | A/B | [chesstempo.com/memberships](https://chesstempo.com/memberships/), Gold US$4/mês ou US$35/ano |
| SCID | ferramenta open source | cálculo, abertura | C | [scid.sourceforge.net](https://scid.sourceforge.net/), gratuito |
| ChessDB.cn API | API | cálculo/defesa | C/D | [chessdb.cn](https://www.chessdb.cn/queryc_en/), gratuito |
| lichess-tactics-generator | GitHub repo | cálculo, threshold | B | [github.com/vitogit/lichess-tactics-generator](https://github.com/vitogit/lichess-tactics-generator), gratuito |
| chess-puzzle-maker | GitHub repo | cálculo | C | [github.com/linrock/chess-puzzle-maker](https://github.com/linrock/chess-puzzle-maker), gratuito |
| better_tactics | GitHub repo | SRS/threshold | B | [github.com/catchouli/better_tactics](https://github.com/catchouli/better_tactics), gratuito |
| chessli/chessli2 | GitHub repo | SRS/abertura | B | [chessli](https://github.com/pwenker/chessli), [chessli2](https://github.com/pwenker/chessli2), gratuito |
| Listudy / Anki Chess | ferramenta | SRS/abertura | B | [listudy.org](https://listudy.org/en/blog/anki-chess), gratuito |
| AnkiWeb chess decks | deck | SRS/cálculo | C | [Optimized Chess Puzzles](https://ankiweb.net/shared/info/894523279), [Lichess 19,667](https://ankiweb.net/shared/info/1621586600), gratuito |
| ChessKid curriculum | curso | cálculo/abertura | C | [ChessKid curriculum](https://www.chesskid.com/learn/articles/chesskidcoms-curriculum), gratuito com restrição |
| Exercism chess exercises | programação | nenhum | D | [exercism.org](https://exercism.org/), gratuito |
| Cepeda et al. 2006 | paper | revisão/SRS | A/B | DOI [10.1037/0033-2909.132.3.354](https://doi.org/10.1037/0033-2909.132.3.354) |
| Cepeda et al. 2008 | paper | intervalos SRS | A/B | [eScholarship](https://escholarship.org/uc/item/0kp5q19x), DOI [10.1111/j.1467-9280.2008.02209.x](https://doi.org/10.1111/j.1467-9280.2008.02209.x) |
| Roediger & Karpicke 2006 | paper | retrieval/revisão | B | PubMed [16507066](https://pubmed.ncbi.nlm.nih.gov/16507066/) |
| Rohrer et al. 2015 | paper | interleaving | B | DOI [10.1037/edu0000001](https://doi.org/10.1037/edu0000001), ERIC PDF |
| Chen et al. 2021 | paper | spacing/interleaving | B | [PDF](https://discover.nl.edu/media/nledu/content-assets/documents/ctle/on-demand-learning-resources/Chen2021_Article_SpacingAndInterleavingEffectsR.pdf) |
| Mastery Learning review | paper | threshold | B | [PMC10159400](https://pmc.ncbi.nlm.nih.gov/articles/PMC10159400/) |
| EDM 2025 mastery threshold | paper | threshold | C/B | [EDM 2025](https://educationaldatamining.org/EDM2025/proceedings/2025.EDM.short-papers.4/index.html) |
| de Bruin et al. 2005 | paper | threshold/revisão | B | DOI [10.1002/acp.1109](https://doi.org/10.1002/acp.1109) |
| de Bruin et al. 2007 | paper | threshold/revisão | B | DOI [10.1080/09541440701326204](https://doi.org/10.1080/09541440701326204) |
| de Bruin et al. 2014 | paper | prática de novatos | B | DOI [10.1016/j.intell.2013.07.004](https://doi.org/10.1016/j.intell.2013.07.004) |
| Chase & Simon 1973 | paper clássico | cálculo/padrões | B | [Skill in Chess PDF](https://iiif.library.cmu.edu/file/Simon_box00066_fld05052_bdl0001_doc0001/Simon_box00066_fld05052_bdl0001_doc0001.pdf) |
| Bilalić et al. 2009 | paper | abertura/cálculo | C/B | DOI [10.1111/j.1551-6709.2009.01030.x](https://doi.org/10.1111/j.1551-6709.2009.01030.x) |
| Moxley et al. 2012 | paper | cálculo 1200+ | B | DOI [10.1016/j.cognition.2012.03.005](https://doi.org/10.1016/j.cognition.2012.03.005) |
| Charness et al. 2005 | paper | deliberate practice | B | DOI [10.1002/acp.1106](https://doi.org/10.1002/acp.1106) |
| Gobet & Campitelli 2007 | paper | domain practice | B/C | PubMed [17201516](https://pubmed.ncbi.nlm.nih.gov/17201516/) |

## Próxima integração recomendada

1. Adicionar ao método consolidado uma subseção "Pipeline Lichess Puzzle DB" com filtros sugeridos: `Rating 800-1200`, `RatingDeviation <= 90`, `Popularity >= 70`, temas por lacuna, e `short/long` para 2-3 lances.
2. Definir thresholds como hipóteses instrumentadas: tema rotulado >=80%, misto >=70%, revisão espaçada >=85-90%, sem usar rating como gate.
3. Criar regra de interleaving: bloquear no primeiro contato, misturar após domínio rotulado.
4. Manter defesa/profilaxia como módulo próprio do Professor Lemos, apoiado por Lichess `defensiveMove`, não como lacuna resolvida por fonte externa.
5. Não integrar ChessDB.cn nem geradores com engine na fase pessoal; servem como referência técnica, não dependência.
