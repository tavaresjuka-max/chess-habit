# Sintese Para Metodo Proprio — Frente 5

**Data:** 2026-06-09
**Proposito:** Traduzir a pesquisa das 4 frentes em principios aplicaveis ao `lichess-tutor`, sem copiar conteudo proprietario.
**Status:** documento vivo — revalidar a cada iteracao do metodo.

---

## 1. Principios Pedagogicos Fundamentais

Cada principio abaixo e sustentado por evidencia das Frentes 1-4. A coluna "fonte" indica o tipo de suporte.

| # | Principio | Fonte | Tipo |
|---|-----------|-------|------|
| P1 | **Deliberate practice sobre jogo livre.** Estudo serio e focado e o maior preditor de melhora enxadristica (explica ~34% da variancia). O tutor deve maximizar exercicios estruturados com feedback imediato, nao apenas sugerir "jogar mais". | Charness 2005, Campitelli & Gobet 2011, Howard 2012 | **Evidencia forte** |
| P2 | **Heuristicas explicitas de pensamento.** Ensinar COMO pensar e mais importante que ensinar O QUE pensar. Checklist de lances candidatos, verificacao de capturas/cheques/ameacas, avaliacao de trocas. So xadrez com heuristica produz transferencia. | Trinchero & Sala 2016 | **Evidencia forte** |
| P3 | **Tatica primeiro, abertura depois.** Para <1200 ELO, partidas sao decididas por erros taticos, nao por teoria de abertura. Construir vocabulario tactico (garfo, cravada, espeto, descoberto) e prioridade #1. Aberturas entram como principios (centro, desenvolvimento, roque), nao como variantes. | Gobet & Jansen 2006, Steps Method, Soviet School, Capablanca | **Consenso entre metodos** |
| P4 | **Spaced repetition para padroes taticos.** Revisitar padroes em intervalos crescentes (1 dia, 3 dias, 1 semana, 1 mes). Evidencia forte na psicologia cognitiva geral; aplicacao ao xadrez e por extrapolacao razoavel. | Cepeda et al., Ebbinghaus; Gobet & Jansen 2006 | **Extrapolacao de evidencia forte** |
| P5 | **Interleaving de temas.** Misturar tipos de problemas (tatica + final + abertura) em vez de blocos homogeneos. Melhora retencao de longo prazo e discriminacao entre padroes. | Rohrer, Bjork (psicologia geral) | **Extrapolacao de evidencia forte** |
| P6 | **Feedback imediato e especifico com explicacao causal.** Nao basta dizer "certo" ou "errado". Explicar POR QUE, mostrar a continuacao, conectar com o padrao. Erro vira explicacao causal. | Principio pedagogico geral; consistente com deliberate practice | **Consenso pedagogico** |
| P7 | **Finais cedo, com profundidade progressiva.** Mates elementares (rei+dama, rei+torre) no Bloco 1. Finais de peoes e torre nos Blocos 5+. Finais ensinam coordenacao de pecas, calculo e valor do rei ativo. | Capablanca, Soviet School, Steps Method, Silman | **Consenso entre metodos** |
| P8 | **Progressao granular com scaffolding.** Diagnosticar nivel atual, propor desafios ligeiramente acima (zona de desenvolvimento proximal), reduzir ajuda gradualmente (fading). Sessoes curtas (15-30 min) e frequentes > maratonas esporadicas. | Gobet & Jansen 2006, Vygotsky (pedagogia geral), Rosholm 2017 (25-30h limiar) | **Consenso** |
| P9 | **Autoanalise guiada de partidas proprias.** Apos cada partida, o tutor guia o usuario a identificar 1-3 momentos criticos. Classificar erros por tipo. Extrair 1 licao por partida. Sem engine primeiro, depois com engine. | Consistente com deliberate practice e metacognicao; Gobet & Jansen 2006 | **Evidencia moderada** |
| P10 | **Nao prometer o que nao pode entregar.** Nao alegar aumento de QI, melhora escolar ou "cerebro turbinado". O valor do tutor esta em ensinar xadrez bem. Placebo inicial gera engajamento; qualidade pedagogica gera retencao. | Sala & Gobet 2017, Jerrim 2016, Blanch 2022 | **Evidencia forte (para nao alegar)** |

---

## 2. Anti-Padroes (O Que NAO Fazer)

| # | Anti-Padrao | Justificativa |
|---|-------------|---------------|
| A1 | Ensinar aberturas longas para iniciantes (<1000 ELO) | Partidas de iniciante sao decididas por erros taticos, nao por teoria (Gobet & Jansen 2006). Consenso entre todos os metodos. |
| A2 | Foco excessivo em estrategia antes de tactica solida | Reconhecimento de padroes taticos e o fundamento; sem ele, estrategia nao se sustenta (Steps Method, Seirawan). |
| A3 | Promessas de "melhorar inteligencia" ou "aumentar QI" | Sem evidencia robusta. Risco de desapontamento e abandono (Sala & Gobet 2017, Blanch 2022). |
| A4 | Gamificacao vazia (badges, pontos sem conteudo) | Placebo funciona no curto prazo, mas sem aprendizagem real, o aluno estagna (principio pedagogico basico). |
| A5 | Sessoes muito longas e espacadas | 15-30 min/dia > 3h/sabado. Spaced > massed (Ebbinghaus, Cepeda). |
| A6 | Correcao sem explicacao | Feedback deve incluir o "porque" (deliberate practice, pedagogia geral). |
| A7 | Avaliacao apenas por rating | Rating reflete resultado contra oponentes, nao dominio de habilidades especificas (Charness 2005). |
| A8 | Copiar exercicios/textos/estrutura de metodos pagos | Violacao de clean-room e direitos autorais. Extrair apenas principios abstratos. |

---

## 3. Progressao 0-1200 — Macrosequencia Limpa

Esta sequencia e uma **sintese original**, nao copiada de nenhum metodo. Inspira-se em padroes observados em todos os metodos mapeados, mas e uma estrutura abstrata sem exercicios, textos ou conteudo proprietario.

```
NIVEL 0-400 (Aprendiz): FUNDAMENTOS E SEGURANCA
├── Bloco 1: FUNDAMENTOS
│   ├── Tabuleiro, casas, coordenadas
│   ├── Movimento das 6 pecas e captura
│   ├── Valor relativo das pecas (1-3-3-5-9)
│   ├── Xeque e saidas (fugir, bloquear, capturar)
│   ├── Mate elementar: Rei+Dama, Rei+Torre
│   ├── Roque, en passant, promocao
│   └── Empates (afogamento, insuficiencia, repeticao, 50 lances)
│
├── Bloco 2: SEGURANCA
│   ├── Pecas penduradas (en prise)
│   ├── Proteger pecas atacadas
│   ├── Troca favoravel (ganhar material)
│   ├── Defesa contra ameacas de mate em 1
│   └── Principio: "Antes de jogar, verifica o que o adversario ameaca"

NIVEL 400-800 (Iniciante): TATICA E MATES
├── Bloco 3: TATICAS CURTAS
│   ├── Garfo (cavalo, peao, dama)
│   ├── Cravada (absoluta e relativa)
│   ├── Espeto (skewer)
│   ├── Ataque descoberto / cheque descoberto
│   ├── Duplo cheque
│   ├── Eliminacao do defensor
│   ├── Atracao / desvio
│   └── Raio-X, Zwischenzug, Sobrecarga
│
├── Bloco 4: MATES
│   ├── Padroes de mate em 1 (beijo da morte, corredor, fundo)
│   ├── Padroes de mate em 2
│   ├── Sacrificio de mate (Greco, Legal)
│   └── Defesa contra ameacas de mate

NIVEL 800-1200 (Intermediario baixo): FINAIS, ABERTURA, CALCULO
├── Bloco 5: FINAIS BASICOS
│   ├── Quadrado do peao
│   ├── Oposicao (rei vs rei+peao)
│   ├── Casas-chave (key squares)
│   ├── Peao passado (criacao e avanco)
│   ├── Finais de torre elementares (Lucena, Philidor — introducao)
│   └── Principio: "Em finais, ativar o rei"
│
├── Bloco 6: ABERTURA POR PRINCIPIOS
│   ├── Ocupar o centro (e4, d4, ou controle com pecas)
│   ├── Desenvolver pecas (cavalos antes de bispos)
│   ├── Roque cedo (proteger rei, conectar torres)
│   ├── Nao jogar a dama cedo demais
│   ├── 3 regras de ouro (centro, desenvolvimento, roque)
│   └── O que NAO fazer (Scholars Mate, capturar peao com dama)
│
├── Bloco 7: CALCULO
│   ├── Pensar antes de jogar ("qual o plano do adversario?")
│   ├── Analise em arvore simples (2-3 lances)
│   ├── Candidatos de lance (listar 2-3 opcoes, calcular cada)
│   ├── Verificar: "ha tatica para algum lado?"
│   └── Reconhecer quando trocar pecas
│
├── Bloco 8: REVISAO DE PARTIDAS
│   ├── Analisar as proprias partidas
│   ├── Identificar o lance perdedor
│   ├── Classificar erros por tipo
│   ├── Extrair 1 licao por partida
│   └── Ritmo: 1-3 partidas por sessao
│
└── Bloco 9: HABITO (transversal)
    ├── Puzzles diarios (10-15 min)
    ├── Partidas lentas (10+5 ou mais)
    ├── Estudar finais progressivamente
    ├── Variar: nao so puzzles ou so jogos
    ├── Lichess Practice como fonte gratuita
    ├── Manter caderno de erros
    └── Revisitar blocos anteriores periodicamente
```

### Mapeamento para recursos Lichess gratuitos

| Bloco | Recurso Lichess gratuito | URL |
|-------|--------------------------|-----|
| Fundamentos | Lichess Learn | https://lichess.org/learn |
| Seguranca | Lichess Practice: Checkmates | https://lichess.org/practice |
| Taticas Curtas | Lichess Practice: Fundamental Tactics | https://lichess.org/practice |
| Taticas Curtas | Lichess Puzzles por tema | https://lichess.org/training/themes |
| Mates | Lichess Practice: Checkmates | https://lichess.org/practice |
| Mates | Lichess Puzzles: mateIn1, mateIn2 | https://lichess.org/training/mateIn1 |
| Finais Basicos | Lichess Practice: Pawn Endgames | https://lichess.org/practice |
| Finais Basicos | Lichess Practice: Rook Endgames | https://lichess.org/practice |
| Abertura | Videos: Opening Principles | https://lichess.org/video/gpsZAim-mYc |
| Calculo | Lichess Practice: Advanced Tactics | https://lichess.org/practice |
| Revisao | Lichess Analysis (Stockfish) | https://lichess.org/analysis |
| Habito | Lichess Puzzles diarios | https://lichess.org/training |
| Habito | Lichess Puzzle Streak | https://lichess.org/streak |
| Habito | Lichess Puzzle Storm | https://lichess.org/storm |

---

## 4. Templates De Sessao

### Sessao de 5 minutos (manutencao / aquecimento)
```
- 5 min: Puzzles (1 tema, ex: garfo) — Lichess /training/fork
- Foco: velocidade de reconhecimento, nao profundidade
```

### Sessao de 15 minutos (padrao diario)
```
- 5 min: Puzzles do tema em foco (ex: cravada)
- 5 min: Practice guiada (Lichess Practice: Fundamental Tactics)
- 5 min: Revisao de 1 erro da sessao anterior (spaced repetition)
```

### Sessao de 30 minutos (estudo focado)
```
- 10 min: Explicacao do conceito (video + texto curto) — "explain"
- 10 min: Pratica guiada (Lichess Practice) — "guided practice"
- 5 min:  Recuperacao ativa — puzzles do tema — "retrieval"
- 5 min:  Revisao de tema anterior (interleaving) — "review"
```

### Sessao de 60 minutos (imersao)
```
- 10 min: Explicacao + demonstracao (video/study) — "explain"
- 15 min: Pratica guiada (Lichess Practice + puzzles tematicos) — "guided"
- 10 min: Recuperacao ativa (puzzles variados, sem dica de tema) — "retrieval"
- 10 min: Revisao de 2-3 temas anteriores (spaced + interleaving) — "review"
- 10 min: Analise de 1 partida propria (sem engine, depois com engine) — "transfer"
- 5 min:  Registro: 1 licao aprendida, 1 padrao errado, proximo foco — "reflect"
```

### Fases de cada sessao (Inspirado no ciclo pedagogico)

| Fase | Nome | O que faz | Tempo tipico |
|------|------|-----------|--------------|
| 1 | **Explain** | Explicacao do conceito (video, texto, diagrama). Carga cognitiva baixa. | 20% |
| 2 | **Guided** | Pratica com ajuda (Practice, puzzles com tema indicado, dicas). Scaffolding. | 30% |
| 3 | **Retrieval** | Recuperacao ativa (puzzles sem dica de tema, exercicios). Esforco cognitivo alto. | 25% |
| 4 | **Review** | Revisao espacada de temas anteriores (interleaving). Consolidacao. | 15% |
| 5 | **Transfer** | Aplicacao em contexto real (analise de partida propria, fim de jogo). | 10% |

---

## 5. Sinais De Avaliacao (Sem Prometer Rating)

O tutor mede progresso por sinais concretos, nao por rating. Rating e consequencia, nao causa.

### Sinais de progresso (o que melhora)

| Sinal | Como medir | Bloco relacionado |
|-------|------------|-------------------|
| Taxa de acerto em puzzles do tema | % de acerto em puzzles de garfo, cravada, etc. (via Lichess puzzle activity) | 3, 4, 5 |
| Tempo medio de resolucao | Tempo ate acertar (mais rapido = reconhecimento automatico) | 3, 4 |
| Reducao de blunders por partida | Contagem de blunders (via Lichess analysis ou autoanalise) | 2, 3 |
| Tipos de erro que desaparecem | "Peca pendurada" deixa de aparecer depois do Bloco 2 | 2 |
| Capacidade de nomear o erro | "Perdi porque nao vi um garfo de cavalo" — metacognicao | 8 |
| Complexidade tatica que resolve | De mate em 1 para mate em 2 para combinacao de 3 lances | 3, 4, 7 |
| Avaliacao do usuario | Autoavaliacao qualitativa: "sinto que estou vendo mais taticas" | Transversal |

### Sinais de fraqueza (o que precisa de atencao)

| Sinal | Interpretacao | Acao recomendada |
|-------|---------------|------------------|
| Acerto <50% em puzzles de um tema | Tema nao foi internalizado | Voltar ao Explain+Guided desse tema |
| Muitos erros por peca pendurada | Seguranca fraca (Bloco 2) | Reforcar Bloco 2 |
| Perde partidas ganhas no final | Finais fracos (Bloco 5) | Reforcar Bloco 5 |
| Nao consegue nomear por que perdeu | Falta heuristica e meta-cognicao | Reforcar Blocos 7 e 8 |
| Acerto alto mas lento (>30s por puzzle) | Reconhecimento ainda nao e automatico | Mais volume de puzzles do tema (Bloco 9) |
| Abandono de sessoes / dias pulados | Problema de habito ou engajamento | Sessao mais curta, tema mais variado, gamificacao leve |

### Como medir sem API proprietaria

| Fonte | O que extrai | Como usar |
|-------|-------------|-----------|
| Lichess puzzle activity (`GET /api/puzzle/activity`) | Data, tema, win/loss | Agregar taxa de acerto por tema e por semana |
| Lichess puzzle dashboard (`GET /api/puzzle/dashboard/{days}`) | Desempenho por tema | Identificar temas fracos para revisao |
| Lichess puzzle replay (`GET /api/puzzle/replay/{days}/{theme}`) | Puzzles a revisitar | Spaced repetition via replay |
| Lichess games export (`GET /api/games/user/{username}`, moves=false) | Blunders, resultado, abertura, acuracia | Sinais de progresso sem PGN completo |
| Autoanalise guiada (local, sem API) | Classificacao de erros pelo usuario | Metacognicao e registro de padroes de falha |

---

## 6. Implementacao No App — Candidatos

Mapeamento dos principios para funcionalidades concretas do `lichess-tutor`.

| Principio | Funcionalidade no app | Status atual |
|-----------|----------------------|--------------|
| P1: Deliberate practice | Plano diario com puzzles tematicos, Practice, analise — nao "jogue mais" | Ja existe como gerador de plano |
| P2: Heuristicas explicitas | Microcopy do Professor Lemos explicando o "como pensar" em cada bloco | Microcopy existe; falta checklist de pensamento |
| P3: Tatica primeiro | Blocos 3-4 sao prioridade; abertura so no Bloco 6 | Ja segue a sequencia |
| P4: Spaced repetition | Sistema de revisao: puzzles de temas antigos reaparecem em intervalos | NAO implementado — candidato prioritario |
| P5: Interleaving | Sessoes misturam temas (ex: garfo + final de peao) em vez de bloco puro | Parcial — precisa de logica de mix |
| P6: Feedback causal | Apos erro, mostrar o "porque" e sugerir revisao do conceito | NAO implementado |
| P7: Finais cedo | Bloco 5 entra na progressao antes de abertura e calculo | Ja na sequencia |
| P8: Progressao granular | Sistema de desbloqueio por sinais de dominio, nao por tempo | NAO implementado — precisa de sinais |
| P9: Autoanalise guiada | Template de revisao de partida: "qual foi o lance perdedor? qual tema?" | NAO implementado |
| P10: Nao prometer rating | Comunidade de confianca (1-5 estrelas) em vez de "rating estimado" | Ja implementado |

### Prioridades de implementacao (ordem sugerida)

1. **Sistema de sinais de fraqueza/progresso** (P8) — essencial para adaptatividade
2. **Spaced repetition** (P4) — maior impacto na retencao, baseado em evidencia forte
3. **Interleaving** (P5) — melhora discriminacao entre padroes
4. **Feedback causal** (P6) — transforma erro em aprendizado
5. **Autoanalise guiada** (P9) — transfere para contexto real
6. **Checklist de pensamento** (P2) — heuristica explicita baseada em Trinchero & Sala

---

## 7. Riscos E Lacunas

### Riscos metodologicos

| Risco | Severidade | Mitigacao |
|-------|-----------|-----------|
| Spaced repetition em xadrez nao tem evidencia especifica — e extrapolacao | Media | Comunicar como "baseado em principios gerais de aprendizagem", nao como "comprovado em xadrez" |
| Interleaving pode confundir iniciantes se mal calibrado | Media | Introduzir gradualmente: comecar com blocos puros, adicionar interleaving quando taxa de acerto >70% |
| Sinais de Lichess (puzzle activity) sao limitados e dependem de OAuth | Media | Implementar fallback: sinais locais de autoanalise quando API indisponivel |
| O metodo e sintese original — nao foi testado empiricamente | Alta | Tratar como hipotese. Iterar com uso real. Nao alegar eficacia sem evidencia propria |
| Risco de overfitting ao dono (n=1) | Alta | Manter arquitetura parametrica — thresholds, pesos e sequencias configuraveis, nao hardcoded |

### Lacunas que precisam de revisao humana

| Lacuna | Acao necessaria |
|--------|----------------|
| Sequencia de dificuldade dentro de cada bloco | Definir threshold de "dominio" para avancar (ex: 80% acerto em 50 puzzles do tema?) |
| Balanceamento entre temas na mesma sessao | Qual proporcao de revisao vs conteudo novo? (literatura sugere ~30% revisao) |
| Microcopy do Professor Lemos por bloco | Revisar tom, precisao tecnica e adequacao ao nivel |
| Criterios de "fraqueza real" vs "variacao normal" | Separar sinal de ruido nos dados de puzzle activity |
| Templates de sessao para cada bloco | Criar explicacao + guided + retrieval + review especifico por topico |

---

## 8. Referencias Cruzadas

### Da pesquisa academica (Frente 2)
- `docs/research/academic_evidence.md` — 24 estudos com tabela de evidencia
- Principios P1-P10 ancorados em estudos especificos (ver tabela na secao 1)

### Do mapa de metodos (Frente 3)
- `docs/research/curriculum_map.md` — 17 metodos mapeados
- Sequencia de 9 blocos sintetizada a partir de padroes comuns
- Mapeamento Publico vs Proprietario para cada metodo

### Do acervo livre (Frente 1)
- `docs/research/open_download_candidates.md` — 85+ itens catalogados
- Livros em dominio publico utilizaveis como referencia (Capablanca, Lasker, Nimzowitsch, Philidor, Staunton)
- Artigos academicos open access para aprofundamento

### Da lista de compra (Frente 4)
- `docs/research/paid_buylist.md` — 60+ itens precificados
- Prioridades A para compra imediata: Steps Method (€99.95), Yusupov Fundamentals (€69.95), Woodpecker Method (€34.99), How to Study Chess (€24.95), Silman Endgame (€27.95)

---

## 9. Proximos Passos

1. **Prioridade maxima:** Implementar o sistema de sinais (secao 5) — e o que torna o tutor adaptativo
2. **Alta prioridade:** Spaced repetition e interleaving no gerador de plano
3. **Media prioridade:** Templates de sessao por bloco com explain/guided/retrieval/review/transfer
4. **Pesquisa adicional:** Buscar estudos especificos sobre spaced repetition em xadrez (ate agora nao encontrados)
5. **Compra:** Adquirir itens Prioridade A da lista de compra para aprofundar o metodo
6. **Validacao:** Testar a sequencia de 9 blocos com uso real (dono), registrar sinais de progresso

---

*Documento gerado em 2026-06-09 como parte da Frente 5 da pesquisa de literatura de xadrez. Todos os principios sao abstracao de conhecimento publico. Nenhum conteudo proprietario foi copiado.*
