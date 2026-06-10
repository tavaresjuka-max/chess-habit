# Plano de Implementacao do Metodo Lichess — DEEPSEEK

Data: 2026-06-10. Consultor: DeepSeek (tecnico-pragmatico).

Projeto: `lichess-tutor`, PWA local-first, React + Vite + TypeScript + Dexie.
Fases P0-P3 concluidas, P4/P5 congeladas. Foco: transformar material analisado em rotina real de estudos no Lichess.

---

## 1. Veredito Executivo

**Estado atual do projeto:** O app ja orquestra o loop Signal → Weakness → Plan → treino no Lichess → feedback. Tem pontos fortes: detector de fraquezas testado, gerador de plano sensivel a tempo, OAuth opt-in, timer/log, feedback easy/good/hard, mapa de destinos Lichess com allowlist.

**O que falta:** O metodo pedagogico subiu de complexidade com a Onda 3 — defesa, calculo em camadas, abertura com timing, pendencias, diplomas. O app atual nao "sabe" sobre esses conceitos. O plano gerado ainda e muito linear (tema → puzzle → feedback) e nao tem variedade de formatos de treino.

**Veredito:** A implementacao das 5 trilhas do diretor cabe no escopo das fases ja concluidas (P0-P3). Nao exige nova fase, backend, sync, nem OAuth adicional. E uma expansao de dominio puro + curadoria de destinos Lichess que ja existem.

**Risco principal:** Tentar implementar tudo de uma vez. O plano abaixo propoe 7 commits atomicos, cada um entregando valor pessoal real.

**Notas:**
- Impacto: **9/10** — transforma um orquestrador linear em um tutor adaptativo com 5 modalidades de treino
- Esforco: **7/10** — maioria e dominio puro + tipos; 2-3 dias de trabalho focado
- Risco: **3/10** — nao mexe em infra (fetch/oauth/storage); so expande o que ja existe
- Prioridade: **9/10** — fecha lacunas pedagogicas identificadas em 3 rodadas de analise

---

## 2. Mapa Lichess do Metodo

### Studies (escopo `study:write`, OAuth opt-in)

O dono pode criar Studies privados no Lichess a partir dos blocos de treino. Cada trilha vira um Study com capitulos. O app gera o PGN minimo em memoria (transiente) e chama a API.

| trilha | Study Lichess | endpoints |
|--------|---------------|-----------|
| Tratamento de Pendencias | `Pendencias — {data}` | `POST /api/study` (criar), `POST /api/study/{id}/import-pgn` (capitulos) |
| Calculo Ponte 800-1200 | `Calculo Ponte` | idem |
| Defesa Ativa | `Defesa Ativa` | idem |
| Abertura Como Plano | `Abertura Como Plano` | idem |
| Diplomas de Progresso | `Diplomas — {nivel}` | idem |

Limites: 30 novos studies/dia, 64 capitulos/study, serial (1 req por vez), 429 → esperar >=60s.

### Puzzle Themes (sem OAuth, deep-link)

| trilha | temas Lichess | URL base |
|--------|---------------|----------|
| Pendencias | `hangingPiece`, `fork`, `pin`, `skewer`, `discoveredAttack` | `/training/{theme}` |
| Calculo Ponte | `short`, `mateIn2`, `forcings`, `quietMove` | `/training/{theme}` |
| Defesa Ativa | `defensiveMove`, `deflection` | `/training/{theme}` |
| Abertura Como Plano | `opening` | `/training/opening` |

### Puzzle Dashboard/Activity/Replay (escopo `puzzle:read`, OAuth opt-in)

- `GET /api/puzzle/activity` — reconcilia puzzles resolvidos com blocos `done`
- `GET /api/puzzle/dashboard/{days}` — metricas de progresso por tema
- `GET /api/puzzle/replay/{days}/{theme}` — replay de puzzles falhados (pendencias)

### Practice / Learn / Analysis (sem OAuth, deep-link)

| destino | URL | uso |
|---------|-----|-----|
| Practice: Checkmates | `/practice/checkmates` | mates basicos |
| Practice: Pawn Endgames | `/practice/pawn-endgames` | finais de peao |
| Practice: Rook Endgames | `/practice/rook-endgames` | finais de torre |
| Practice: Fundamental Tactics | `/practice/tactics` | taticas basicas |
| Learn: Piece moves | `/learn` | fundamentos |
| Analysis (sem engine) | `/{gameId}` | revisao de partida terminada |
| Puzzle Streak | `/streak` | transferencia, resistencia |
| Training (coordenadas) | `/training/coordinate` | visualizacao |

---

## 3. Modelo de Dominio Proposto

### Tipos novos

```ts
// === Novos WeaknessTag (expandem os existentes) ===
export type WeaknessTag =
  | /* existentes */
  | 'hanging-piece' | 'fork' | 'pin' | 'skewer' | 'discovered'
  | 'mate-in-1' | 'mate-in-2' | 'back-rank'
  | 'opening-principles' | 'time-trouble' | 'endgame-pawn' | 'endgame-rook'
  | 'conversion' | 'blunder-rate'
  | /* NOVOS — Onda 3 */
  | 'single-candidate'          // joga o 1o lance que pensa (Soltis)
  | 'no-threat-check'           // nao verifica ameaca do oponente (Crouch)
  | 'defense-passive-only'      // defende sem contra-jogo (Marin)
  | 'zwischenzug-blind'         // nao ve lance intermediario (Beim)
  | 'calculation-stop-early'    // para de calcular antes da posicao terminal (Beim)
  | 'opening-name-before-principle' // quer nome de abertura sem entender principio (Emms)
  | 'evaluation-error'          // avalia mal a posicao resultante (Crouch)
  | 'psychological-collapse'    // erro por pressao/tempo (Crouch)

// === Novos ExerciseMode (mantendo os 5 existentes) ===
export type ExerciseMode =
  | 'explain' | 'guided' | 'retrieval' | 'review' | 'transfer'
  // sem adicionar modos novos — os formatos especiais vivem como drillFormat

// === NOVO: DrillFormat — molde de treino (abstracao dos livros) ===
export type DrillFormatId =
  | 'lpdo-scan'                    // ja existe como Varredura Anti-Blunder
  | 'detect-before-calculate'      // ja existe
  | 'damp-scan'                    // ja existe
  | 'cct-algorithm'                // ja existe
  | 'worked-example-before-problem' // ja existe
  | 'labeled-then-mixed'           // ja existe
  | 'socratic-dialogue'            // ja existe
  | 'imbalance-audit'              // ja existe
  | 'question-game'                // ja existe (Partida-Pergunta-Resposta)
  | 'named-error-with-fix'         // ja existe
  | 'micro-session-repeated'       // ja existe
  | 'invisible-endgames'           // ja existe
  | // NOVOS — Onda 3
  | 'thinking-system-soltis'       // 5-passos para posicao quieta
  | 'defense-checklist-crouch'     // checklist de defesa em 4 perguntas
  | 'calculation-tree-beim'        // arvore de calculo com posicao terminal
  | 'opening-principle-emms'       // principios antes do nome
  | 'diagnostic-profile-khmelnitsky' // perfil multi-tema
  | 'defeat-taxonomy-crouch'       // classificar tipo de derrota
  | 'pendency-treatment'           // re-resolver erros reais

// === NOVO: Technique — como o bloco sera executado no Lichess ===
export type LichessTechnique =
  | { kind: 'puzzle-theme'; theme: string }           // /training/{theme}
  | { kind: 'puzzle-streak' }                          // /streak
  | { kind: 'practice'; chapter: string }              // /practice/{chapter}
  | { kind: 'analysis'; gameId?: string }              // /{gameId}
  | { kind: 'study'; studyId?: string; chapter?: number } // /study/{id}
  | { kind: 'coordinate-trainer' }                     // /training/coordinate
  | { kind: 'learn'; section?: string }                // /learn
  | { kind: 'video'; videoId: string }                 // video Lichess

// === NOVO: TrainingBlock ampliado ===
export type TrainingBlock = {
  id: string                    // ex: "1000-1200-defesa-01"
  band: LearnerBand
  stage: Stage                  // NOVO: inclui 'defense', 'prophylaxis'
  signal: string                // sinal que dispara este bloco
  weakness: WeaknessTag
  learningGoal: string
  exerciseMode: ExerciseMode
  drillFormat: DrillFormatId    // NOVO: qual molde de treino
  technique: LichessTechnique   // NOVO: como executar no Lichess
  estimatedMinutes: number
  sourceInfluence: string       // livro/tradicao (abstrato, sem copia)
  microcopy: string             // voz Professor Lemos PT-BR
  avoid: string                 // armadilha do bloco
  stopRule: string              // criterio de parada
  masteryThreshold: number      // 0..1, default 0.80
  feedback?: 'easy' | 'good' | 'hard'
}

export type Stage =
  | 'fundamento' | 'seguranca' | 'mate' | 'final'
  | 'tatica' | 'abertura-principio' | 'plano' | 'transferencia'
  | 'estrutura' | 'profilaxia' | 'finais-tecnicos'
  | 'calculo-profundo' | 'defesa' | 'conversao'
  | // NOVOS — Onda 3
  | 'defesa-ativa' | 'calculo-ponte' | 'pendencias' | 'diploma'

export type LearnerBand =
  | '0-600' | '600-1000' | '1000-1200' | '1200-1400'
  | '1400-1800' | '1800-2200' | '2200+'
```

### Campos novos no DailyPlan

```ts
export type DailyPlan = {
  date: string
  sessionMinutes: number
  blocks: TrainingBlock[]         // era PlanBlock
  generatedFromWeaknessesAt: string
  // NOVOS:
  trilhaAtiva?: TrilhaId          // qual trilha esta ativa esta semana
  pendenciasCount?: number        // quantos erros pendentes
  diplomaProgress?: DiplomaProgress
  reviewRatio: number             // 0..1, proporcao de revisao no plano
}

export type TrilhaId =
  | 'tratamento-pendencias'
  | 'calculo-ponte-800-1200'
  | 'defesa-ativa'
  | 'abertura-como-plano'
  | 'diplomas-progresso'

export type DiplomaProgress = {
  diploma: 'peao' | 'torre' | 'rei'
  sections: { name: string; score: number; threshold: number; passed: boolean }[]
  overallPassed: boolean
}
```

### O que fica FORA do banco

- PGN completo de partidas (regra inquebravel)
- Texto, diagramas ou exercicios de livros protegidos
- Token OAuth em backup/export JSON
- Imagens/screenshots (ja fora)
- Estados de estudo Lichess (o Study vive la, nao no app)

### Migracoes Dexie

Versao nova do schema. Adicionar stores (se ja nao existirem):

```ts
// stores existentes: profile, plans, logs, signals, weaknesses
// NOVA store: trainingCatalog — blocos e drills estaticos
db.version(N).stores({
  trainingCatalog: 'id, band, stage, weakness, drillFormat',
});
```

A store `trainingCatalog` e populada na inicializacao a partir de constantes (os blocos definidos no codigo). Nao precisa de migracao de dados — e append-only de constantes.

---

## 4. Plano das 5 Trilhas

### Trilha 1: Tratamento de Pendencias

**Objetivo:** Re-resolver erros reais do dono (puzzles falhados, lances de partidas perdidas) ate que o padrao de erro desapareca.

**Fonte pedagogica abstrata:** Gevorgyan (2024) — reflexao sobre exercicios nao resolvidos e o maior vetor de progresso. Christofoletti (2007) — "Tratamento de Pendencias" como prioridade do nivel intermediario. Crouch (Why We Lose) — taxonomia de derrotas.

**Capitulos/etapas:**
1. Coleta de pendencias: puzzles com feedback `hard` nos ultimos 7 dias + erros de partidas analisadas
2. Classificacao do erro: blunder (1 lance), calculo (2-4 lances), avaliacao, tempo, psicologico
3. Re-treino: re-resolver cada pendencia em 1, 3, 7, 14 dias
4. Revisao mista: todos os temas pendentes misturados, sem rotulo

**Destino Lichess:**
- Puzzle Replay (`/api/puzzle/replay/{days}/{theme}` com OAuth) — ou
- Puzzle Themes com temas especificos dos erros (`/training/{theme}`)
- Lichess Analysis de partidas proprias (sem engine) para erros de partida
- Studies privados com as posicoes problematicas (PGN transiente)

**Entrada de dados:** Signals `judgment` + `manual` + feedback `hard` acumulado + Puzzle Activity (OAuth).

**Saida esperada:** 80% de acerto na 4a revisao espacada de cada pendencia. Erro classificado por tipo.

**Telemetria local minima:**
- `pendencyCount` por tipo de erro
- `pendencyResolvedCount` (>=80% em revisao espacada)
- `avgAttemptsToResolve` (quantas sessoes ate dominar)

---

### Trilha 2: Calculo Ponte 800-1200

**Objetivo:** Parar de jogar o primeiro lance visto. Treinar: listar 2-3 candidatos, prever a melhor resposta do oponente, comparar posicoes finais, decidir.

**Fonte pedagogica abstrata:** Soltis (How to Choose a Chess Move) — thinking system de 5 passos. Beim (How to Calculate Chess Tactics) — posicao terminal, arvore podada, zwischenzug. Livshitz (Test Your Chess IQ) — exercicios progressivos.

**Capitulos/etapas:**
1. Candidatos simples: 2 candidatos, 1 resposta adversaria (Soltis)
2. CCT curto: Cheques, Capturas, Ameacas como geradores de candidatos (Hertan/Beim)
3. Posicao terminal: saber quando parar de calcular (Beim)
4. Zwischenzug: o lance intermediario que inverte o calculo (Beim/Soltis)
5. Arvore podada: 2-3 ramos, podar os que perdem material obvio (Beim)
6. Teste misto: 10 posicoes sem tema revelado (Khmelnitsky/Livshitz)

**Destino Lichess:**
- Puzzles: `short`, `mateIn2`, `quietMove`, `intermezzo`, `deflection`
- Puzzle Streak (resistencia de calculo)
- Studies privados com o roteiro de 5 passos
- Lichess Analysis de partidas proprias (aplicar thinking system sem engine)

**Entrada de dados:** Weakness `single-candidate` (detectado por alta taxa de erro em puzzles `long` vs `short` e feedback `hard` em puzzles de calculo). Manual: "jogo o primeiro lance que penso."

**Saida esperada:** >=70% em puzzles `long` (3+ lances). >=80% em puzzles `short` (2 lances). Checklist de 5 passos aplicado em >=60% das posicoes de treino.

**Telemetria local minima:**
- `candidateCount` medio por posicao (meta: >=2)
- `calculationDepth` medio (meta: >=3 lances em posicoes forcadas)
- `zwischenzugDetected` taxa de deteccao

---

### Trilha 3: Defesa Ativa

**Objetivo:** Aprender a perguntar "o que ele ameaca?" e defender criando recurso, nao apenas resistindo passivamente.

**Fonte pedagogica abstrata:** Crouch (How to Defend in Chess) — checklist de defesa, deteccao de perigo. Marin (Secrets of Chess Defence) — defesa ativa, profilaxia, trocas defensivas. DAMP "D" — peca solta como sinal de perigo.

**Capitulos/etapas:**
1. Detectar perigo: rei exposto, peca atacada, casa fraca (Crouch)
2. Defender sem passividade: bloquear, defender, trocar, fugir (Crouch)
3. Defesa ativa: defender criando ameaca (Marin)
4. Contra-jogo: "posso contra-atacar em vez de so defender?" (Marin)
5. Profilaxia simples: impedir o plano dele antes que vire ataque (Marin/Nimzowitsch)
6. Defesa nas minhas partidas: analisar partidas proprias onde perdeu (Crouch + Lichess)

**Destino Lichess:**
- Puzzles: `defensiveMove`, `deflection`, `hangingPiece`
- Lichess Analysis de partidas proprias (identificar momentos defensivos)
- Studies privados com checklist de defesa
- Practice: Fundamental Tactics (para defesa tatita)

**Entrada de dados:** Weakness `defense-passive-only` (alta taxa de derrota em posicoes de desvantagem material). Weakness `no-threat-check` (blunders apos ignorar ameaca). Manual.

**Saida esperada:** Detecta perigo em >=65% das posicoes. Escolhe o plano defensivo correto em >=60%. 5 partidas sem colapso defensivo (perder peca por nao ver ameaca).

**Telemetria local minima:**
- `threatDetectedRate` em posicoes de treino
- `defensePlanAccuracy` (escolheu neutralizar vs contra-atacar corretamente)
- `defensiveCollapseCount` em partidas analisadas

---

### Trilha 4: Abertura Como Plano

**Objetivo:** Ensinar a abertura como uma intencao estrategica, nao como decoreba de variantes. O nome so entra depois que o principio foi internalizado.

**Fonte pedagogica abstrata:** Emms (Discovering Chess Openings) — principios antes de nomes, timing natural. Eade (Aberturas Para Leigos) — desmistificar. Seirawan (Xadrez Vitorioso) — centro/desenvolvimento/rei.

**Capitulos/etapas:**
1. Por que o centro? Disputa de espaco e atividade de pecas (Emms/Eade)
2. Desenvolvimento: cavalos antes de bispos, dama por ultimo (Emms/Seirawan)
3. Rei seguro: roque ate lance 10, nao mover peoes do roque (Eade/Capablanca)
4. Estrutura vira plano: peoes dizem onde jogar (Emms/Lazzarotto)
5. Primeira abertura por nome: so depois de 5 partidas com principios solidos (Emms)

**Destino Lichess:**
- Videos Lichess: Opening Principles, Italian Opening, London System
- Studies comunitarios (Italian Opening for Beginners, London System for Beginners)
- Partidas 10+5 (jogar aplicando principios, sem decorar)
- Lichess Analysis pos-partida (verificar principios)

**Entrada de dados:** Weakness `opening-name-before-principle` (quando o dono tenta nomear abertura sem entender). Manual: "quero aprender a [nome da abertura]". Sinal: baixa accuracy nos primeiros 10 lances.

**Saida esperada:** 5 partidas consecutivas com >=80% dos lances de abertura respeitando os 3 principios. Sabe explicar POR QUE cada lance da abertura nomeada.

**Telemetria local minima:**
- `openingPrincipleAdherence` (0..1, 10 primeiros lances)
- `openingNameIntroduced` (bool, se ja passou o threshold)
- `gamesBeforeOpeningName` (quantas partidas ate introduzir nome)

---

### Trilha 5: Diplomas de Progresso

**Objetivo:** Validar progresso sem rating. Checkpoints internos: "posso avancar ou preciso revisar?"

**Fonte pedagogica abstrata:** Tirado & Silva (Meu Primeiro Livro de Xadrez) — 3 Diplomas (Peao, Torre, Rei). Yusupov (Build Up Your Chess) — threshold 80/50. Khmelnitsky (Chess Exam) — diagnostico multi-tema.

**Capitulos/etapas:**

| diploma | faixa | avalia | criterio |
|---------|-------|--------|----------|
| Peao | 0-600 | regras, coordenadas, valor, mate basico, peca pendurada | >=90% |
| Torre | 600-1000 | seguranca, taticas basicas rotuladas, tema misto | >=80% |
| Rei | 1000-1200 | calculo curto, abertura por principios, final basico, revisao de partida | >=70-80% por secao |

**Destino Lichess:**
- Puzzle Themes (por tema, com contagem de acertos)
- Practice (checkmates, endgames, tactics)
- Puzzle Streak (avaliacao mista)
- Lichess Analysis de partida propria

**Entrada de dados:** Puzzle Activity (OAuth) + feedback local + sinais do detector.

**Saida esperada:** Diploma aprovado ou plano de revisao gerado para as secoes abaixo do threshold.

**Telemetria local minima:**
- `diplomaProgress` por secao
- `diplomaAttempts` (quantas vezes tentou cada diploma)
- `timeToDiploma` (dias desde o inicio da faixa)

---

## 5. Mudancas no Gerador de Plano

### Regras SE/ENTAO expandidas

```
-- NOVA: Trilha ativa (override semanal)
SE trilha_ativa_definida ENTAO priorizar_blocos_da_trilha()
SE trilha_ativa = 'tratamento-pendencias' ENTAO
  stage=pendencias
  SE pendencias > 0 ENTAO
    60% pendencias + 30% calculo revisao + 10% transferencia

-- NOVA: Defesa entra a partir de 1000
SE band >= '1000-1200' E seguranca >= 80% E tatica mista >= 60% ENTAO
  stage=defesa; modo=explain→guided

-- NOVA: Calculo ponte (thinking system)
SE band >= '1000-1200' E single-candidate score > 0.5 ENTAO
  stage=calculo-ponte; drillFormat=thinking-system-soltis

-- NOVA: Abertura com timing
SE band >= '1000-1200' E abertura_principios >= 80% (5 partidas) ENTAO
  stage=abertura-principio; modo=explain→transfer
  permitir nome de abertura

-- NOVA: Pendencias como fallback
SE nenhuma fraqueza forte E pendencias_abertas > 0 ENTAO
  stage=pendencias; drillFormat=pendency-treatment

-- NOVA: Diploma como checkpoint
SE todos_blocos_banda_concluidos ENTAO
  stage=diploma; drillFormat=diagnostic-profile-khmelnitsky

-- THRESHOLD (confirmado por Yusupov + Khmelnitsky + Mednis/Crouch)
SE acerto >= 80% ENTAO bloco_concluido(); avancar()
SE acerto 50-79% ENTAO revisar_em(1 dia); manter_modo()
SE acerto < 50% ENTAO regredir_modo(retrieval→guided→explain)
```

### Prioridades por tempo (mantendo a estrutura existente, enriquecida)

| tempo | estrutura | exemplo com trilha ativa |
|-------|-----------|--------------------------|
| 5 min | 1 micro-bloco | 8 puzzles de pendencias OU 5 posicoes de thinking system |
| 15 min | aquecimento(5) + tema(10) | LPDO scan(5) + 10 puzzles defesa checklist(10) |
| 30 min | aquecimento(5) + tema(15) + transferencia(10) | LPDO(5) + calculo ponte guiado(15) + puzzle streak(10) |
| 60 min | aquecimento(10) + tema(20) + transferencia(20) + final(10) | LPDO(10) + defesa ativa explain→guided(20) + analysis partida propria(20) + pawn endgame practice(10) |

### Revisao vs novo

Formula adaptativa (implementar no `generatePlan`):

```
SE pendencias_abertas > 0:
  reviewRatio = min(0.7, 0.4 + pendencias_abertas * 0.05)
  // maximo 70% revisao quando ha muitas pendencias
SENAO SE bloco_novo_esta_semana:
  reviewRatio = 0.3  // baseline
SENAO:
  reviewRatio = 0.2  // manutencao
```

No plano de 30 min com reviewRatio=0.4: 12 min revisao + 18 min novo/transferencia.

### Dominio: thresholds padronizados

| contexto | threshold | acao se abaixo |
|----------|-----------|----------------|
| Tema rotulado (explain/guided) | >=80% | avancar para retrieval |
| Tema misto (retrieval) | >=70% | manter retrieval com variacao |
| Revisao espacada (review, 4a sessao) | >=90% | considerar dominado |
| Diploma | >=80% (Torre/Rei) ou >=90% (Peao) | gerar plano de revisao |
| Qualquer contexto | <50% | regredir modo (retrieval→guided→explain) |

---

## 6. Fluxo de UX

### Tela Hoje (expansao)

```
┌──────────────────────────────────┐
│  Hoje — Ter, 10 Jun              │
│  Trilha: Calculo Ponte 800-1200  │  ← NOVO: trilha ativa visivel
│                                  │
│  ┌─ Pendencias (3) ──────────┐  │  ← NOVO: alerta de pendencias
│  │ ↻ 2 garfos, 1 descoberto  │  │
│  │ [Resolver pendencias]      │  │
│  └────────────────────────────┘  │
│                                  │
│  Plano (30 min)                  │
│  ┌─────────────────────────────┐ │
│  │ 1. Aquecimento (5 min)     │ │
│  │    LPDO scan — Puzzles     │ │
│  │    hangingPiece             │ │
│  │    [Abrir Lichess]          │ │
│  ├─────────────────────────────┤ │
│  │ 2. Calculo Ponte (15 min)  │ │  ← NOVO: drillFormat visivel
│  │    Thinking System Soltis   │ │
│  │    "Liste 2 candidatos..."  │ │
│  │    [Abrir Lichess]          │ │
│  ├─────────────────────────────┤ │
│  │ 3. Transferencia (10 min)  │ │
│  │    Puzzle Streak            │ │
│  │    [Abrir Lichess]          │ │
│  └─────────────────────────────┘ │
│                                  │
│  [Aprovar plano] [Mudar tempo]   │
└──────────────────────────────────┘
```

### Aprovar plano

O usuario pode:
- Aceitar o plano gerado (default)
- Mudar o tempo da sessao (5/15/30/60) — ja implementado
- Pular um bloco (marcar `skipped`)
- Reordenar blocos (drag? futuro)

### Abrir Lichess

Cada bloco tem um `technique` que gera o deep-link:
- Puzzle theme: `https://lichess.org/training/{theme}`
- Practice: `https://lichess.org/practice/{chapter}`
- Analysis: `https://lichess.org/{gameId}`
- Study: `https://lichess.org/study/{studyId}`
- Streak: `https://lichess.org/streak`

Abertura em nova aba (`window.open`). O app nao controla o Lichess — so orquestra.

### Registrar feedback

Ao voltar ao app (ou via timer interno):
- Marcar bloco como `done`
- Feedback: `easy` / `good` / `hard`
- Se `hard` → regredir modo para o proximo plano
- Se `good` → manter
- Se `easy` → avancar (retrieval/review/transfer)

### Reconciliar puzzle/study (OAuth)

Quando OAuth ativo:
- `GET /api/puzzle/activity` → casar `startedAt`/`completedAt` com a janela do bloco
- Calcular taxa de acerto por tema
- Atualizar `masteryThreshold` do bloco
- Se Study foi criado, verificar se os capitulos foram acessados (best-effort)

---

## 7. Privacidade e Clean-Room

### O que o app PODE fazer (ja em conformidade)

- Gerar planos com base em sinais derivados (sem PGN completo)
- Criar Studies privados no Lichess via OAuth (PGN transiente em memoria)
- Abrir deep-links do Lichess (treino, practice, analysis)
- Registrar feedback, tempo treinado, puzzles reconciliados
- Exibir microcopy PT-BR original do Professor Lemos

### O que o app NAO PODE fazer

- Persistir PGN completo (regra inquebravel)
- Copiar texto, diagramas, exercicios ou variantes de livros protegidos
- Citar nomes de livros em_copyright na UI publica
- Usar `sourceInfluence` com nome de livro em_copyright na UI — usar tradicao generica ("Escola Sovietica de Calculo", "Metodo Everyman de Defesa")
- Incluir token OAuth em export/backup JSON

### Barreira clean-room para os novos blocos

| componente | fonte limpa? | acao |
|------------|-------------|------|
| `microcopy` dos blocos | Texto original PT-BR, voz Professor Lemos | OK |
| `drillFormat` (passo a passo) | Abstracao original dos livros | OK |
| Puzzles/posicoes | Lichess Puzzle DB (dominio publico) | OK |
| `sourceInfluence` na UI | Usar tradicao, nao titulo de livro em_copyright | OK |
| Studies privados | Criados pelo dono, conteudo dele | OK (pessoal) |
| `technique` (URLs Lichess) | Endpoints oficiais documentados | OK |

---

## 8. Testes e Gates

### Testes de dominio puro (Vitest, deterministas, fixtures)

1. **`trainingCatalog.test.ts`** — todos os blocos tem campos obrigatorios preenchidos, IDs unicos, `technique` valido
2. **`drillFormat.test.ts`** — cada `DrillFormatId` tem passo a passo definido, `band` e `stage` compativeis
3. **`generatePlan.test.ts` (expandido)** — novos cenarios:
   - Trilha ativa prioriza blocos da trilha
   - Pendencias > 0 aumenta `reviewRatio`
   - Threshold 80/50/abaixo dispara acoes corretas
   - Diploma gerado quando todos os blocos da banda concluidos
   - Defesa oferecida a partir de 1000-1200 com seguranca >=80%
4. **`diagnosis.test.ts` (expandido)** — novos WeaknessTags mapeados a partir de sinais
5. **`weakness.test.ts` (expandido)** — novos tags nao quebram detector existente

### Testes de contrato

6. **`destinations.test.ts`** — todas as URLs Lichess nos `technique` sao validas (formato, nao fetch)
7. **`technique.test.ts`** — cada `LichessTechnique` gera URL correta

### Gate

```
npm run lint && npm run test && npm run build
```

---

## 9. Fases e Commits Atomicos

Nao e uma nova fase. E expansao do que ja existe (P0-P3). 7 commits:

| # | commit | o que entrega | arquivos | teste |
|---|--------|---------------|----------|-------|
| 1 | `feat: expand domain types for Onda 3` | Novos `WeaknessTag`, `Stage`, `DrillFormatId`, `LichessTechnique`, `TrilhaId`, `DiplomaProgress` | `domain/types.ts` | types compilam |
| 2 | `feat: add training catalog with all blocks 0-1200` | Catalogo completo de blocos (existentes + 4 novos: defesa-01, defesa-02, calculo-02, abertura-02) | `domain/training/catalogBlocks.ts` (novo) | `trainingCatalog.test.ts` |
| 3 | `feat: add drill format definitions` | 12 formatos existentes + 6 novos (thinking-system, defense-checklist, calculation-tree, opening-principle, diagnostic-profile, defeat-taxonomy, pendency-treatment) | `domain/training/drillFormats.ts` (novo) | `drillFormat.test.ts` |
| 4 | `feat: implement pendency tracking` | Coleta, classificacao e re-agendamento de pendencias | `domain/training/pendencies.ts` (novo) | `pendencies.test.ts` |
| 5 | `feat: expand generatePlan with trilhas, reviewRatio, thresholds` | Novas regras SE-ENTAO no gerador de plano | `domain/plan/generatePlan.ts` | `generatePlan.test.ts` (expandido) |
| 6 | `feat: implement diploma checkpoints` | Logica de avaliacao de diploma (Peao, Torre, Rei) | `domain/training/diplomas.ts` (novo) | `diplomas.test.ts` |
| 7 | `feat: update UI Hoje for trilhas, pendencias, diplomas` | Expansao visual da tela Hoje | `ui/Hoje.tsx` (existente, editar) | smoke test |

### Nao implementar agora (fora de escopo)

- Gerador automatico de Studies (ja existe em P3, so usar)
- Auto-ajuste de `band` (congelado, ver spec secao 22.6)
- Sync P4 (congelado)
- UI de Progresso separada (desejavel, mas nao bloqueante)
- Integracao com FSRS ou algoritmo avancado de SRS (usar 1/3/7/14 por enquanto)

---

## 10. Notas Comparativas

| dimensao | nota | justificativa |
|----------|------|---------------|
| Impacto | **9/10** | Transforma o app de orquestrador linear para tutor com 5 modalidades. Fecha lacunas de meses. |
| Esforco | **7/10** | Dominio puro + tipos + catalogo. Nao mexe em infra, fetch, OAuth ou storage. 7 commits, ~2-3 dias. |
| Risco | **3/10** | Expansao aditiva. Nao quebra contrato existente. WeaknessTag e Stage sao unions — novos valores nao quebram switches existentes se tratados com default. |
| Prioridade | **9/10** | As lacunas existem ha 3 rodadas de analise. O material pedagogico ja foi lido e fichado. So falta codificar. |

---

## 11. Perguntas Abertas

1. **Trilha ativa: manual ou automatica?** O diretor propos 5 trilhas com ordem fixa. Isso deve ser selecao manual do dono na Config ou o app deve sugerir com base nas fraquezas? **Recomendacao DeepSeek:** sugestao automatica com override manual. O app propoe a trilha baseada no maior `Weakness.score`; o dono pode trocar na Config.

2. **Diplomas: bloqueiam avanco ou sao informativos?** Se o dono falhar no Diploma da Torre, o app DEVE travar o avanco para banda 1000-1200 ou so recomendar revisao? **Recomendacao:** trava suave — mostra "recomendamos revisar antes de avancar" mas nao bloqueia. O dono e adulto e decide.

3. **Pendencias: automaticas ou curadas?** O app coleta automaticamente (feedback `hard` + puzzles falhados) ou o dono adiciona manualmente? **Recomendacao:** automatico com revisao manual. O app sugere pendencias; o dono pode remover as que considera resolvidas.

4. **Microcopy PT-BR: quem escreve?** Os blocos novos precisam de `microcopy` (voz Professor Lemos). **Recomendacao:** DeepSeek propoe o texto base (ja feito nas fichas); o dono aprova ou ajusta. Codex implementa o aprovado.

5. **Quantos temas por sessao (interleaving)?** A lacuna `interleaving-sessao` ainda esta aberta. **Recomendacao:** maximo 2 temas por sessao para agora. Calibrar com uso real.

---

## 12. Recomendacao Final

**Implementar em 7 commits atomicos, na ordem listada na secao 9. Comecar pelo commit 1 (tipos) e avancar sequencialmente.**

Cada commit e independente, testavel e entrega valor:
- Commits 1-3: fundacao (dominio puro, sem UI)
- Commits 4-6: logica (pendencias, plano expandido, diplomas)
- Commit 7: UI (o que o dono ve)

**Nao esperar Gemini ou Codex para comecar.** Este plano e acionavel com o que ja existe. As 5 trilhas usam exclusivamente recursos Lichess que ja estao mapeados. O material pedagogico ja foi lido e abstraido. So falta codificar.

**Se o dono quiser aprovar antes:** mostrar este plano, validar as 5 trilhas, confirmar microcopy PT-BR. Depois, Codex implementa commit por commit.

---

*Plano gerado em 2026-06-10. Base: analises DeepSeek + Gemini + Codex da Onda 3, direcao do DIRETOR, spec vigente (2026-06-06), metodo consolidado (2026-06-09), relatorio de recursos Codex. Fontes limpas: Lichess API/Puzzle DB (dominio publico). Abstracoes pedagogicas originais derivadas de leitura de livros em_copyright para diagnostico pessoal — sem texto, diagramas ou exercicios copiados.*
