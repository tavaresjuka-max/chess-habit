# Plano Ideal de Implementação do Método Lichess — Análise Final

Data: 2026-06-10  
Árbitro: Claude (Sonnet 4.6)  
Base: CODEX, DEEPSEEK, GEMINI, DIRETOR

---

## Parte 1 — Análise dos Quatro Relatórios

### Tabela de Notas

| IA | Nota | Eixo forte | Eixo fraco |
|---|---:|---|---|
| CODEX | **8.8/10** | Aderência ao repo, tipos retrocompatíveis, testes explícitos | Conservador em pedagogia, sem microcopy, sem wireframe |
| DEEPSEEK | **8.1/10** | Arquitetura de drills, métricas por trilha, fórmula de reviewRatio, wireframe ASCII | Overengineering (TrainingBlock, WeaknessTags psicológicas, trainingCatalog em Dexie) |
| GEMINI | **8.4/10** | Melhor pedagogia, microcopy original PT-BR, ritual de sessão, riscos pedagógicos | Hard gate de diploma inadequado, "app avisa abertura" ≈ tabuleiro próprio, fases vagas |
| DIRETOR | **9.2/10** | Melhor arbitragem, tabela de decisões fechadas, "o que ficou fora e por quê" | Não autossuficiente (depende dos outros para detalhes técnicos), sem microcopy própria |

---

### CODEX — 8.8/10

**Pontos fortes:**

1. **Melhor leitura do repo.** Listou o que já existe (14 módulos, Dexie v3, tabelas, OAuth) e o que falta — sem fantasiar arquivos.
2. **Retrocompatibilidade real.** Adicionar `methodTrackId?`, `pendingItemId?`, `masteryTarget?` como campos opcionais em `PlanBlock` é a decisão certa: preserva planos antigos, evita migração destrutiva.
3. **Testes explícitos por camada.** Domínio, infra Lichess, storage e React — com asserções nomeadas, não genéricas.
4. **Decisão correta sobre Study do dia.** Melhorar `createDailyStudy` em vez de criar 5 studies permanentes desde o início.
5. **Identificou conflitos com contrato antigo** (chess.js, Vite 7→8, P4/P5 congeladas).

**Pontos fracos:**

1. **Sem microcopy original.** O plano lista placeholders de texto mas não escreve a voz do Professor Lemos. Isso deixa um buraco na implementação.
2. **Sem wireframe.** A seção de UX (seção 8) é descritiva mas não mostra layout — difícil para o executor visualizar.
3. **Perguntas abertas não fechadas.** As 5 perguntas da seção 13 deveriam ter sido respondidas dentro do próprio relatório (pendências automáticas vs manuais, por exemplo).
4. **Drill formats não modelados.** Não nomeou os formatos de drill pedagógico que o DEEPSEEK modelou bem (thinking-system, defense-checklist, etc.), o que pode fazer o conteúdo das trilhas ficar genérico.

---

### DEEPSEEK — 8.1/10

**Pontos fortes:**

1. **Melhor arquitetura de drill formats.** `DrillFormatId` com 19 formatos nomeados (thinking-system-soltis, defense-checklist-crouch, pendency-treatment etc.) é a melhor abstração pedagógica do lote.
2. **Fórmula explícita de reviewRatio.** `min(0.7, 0.4 + pendências * 0.05)` é acionável e testável — nenhum outro relatório chegou a esse nível de concretude.
3. **Wireframe ASCII.** A seção 6 mostra o layout da tela Hoje com trilha ativa, alerta de pendências e blocos — facilita a implementação de UI.
4. **Métricas por trilha.** `candidateCount`, `calculationDepth`, `threatDetectedRate` — indicadores concretos de progresso para cada trilha.
5. **Agenda 1/3/7/14 dias** explicitamente ligada ao modelo de espaçamento acadêmico.

**Pontos fracos:**

1. **Overengineering crítico: substituir `PlanBlock` por `TrainingBlock`.** Blast radius enorme — UI, logs, Study, storage e testes existentes todos quebram. O ganho não justifica o custo.
2. **WeaknessTags psicológicas desnecessárias.** `psychological-collapse`, `evaluation-error` são inferências fortes demais para um app de uso pessoal. O detector não tem como medir isso de forma confiável.
3. **`trainingCatalog` em Dexie para dados estáticos.** Constantes de código pertencem ao bundle, não ao banco. Dexie é para dados do usuário. Armazenar catálogo estático em IndexedDB cria complexidade de seed/migração sem benefício.
4. **Studies por trilha desde o início.** Cinco studies permanentes criados antes de validar o fluxo diário é risco de estudos vazios, órfãos e complexidade de retry — o DIRETOR decidiu corretamente adiar.
5. **Stage type com 16+ variantes.** Sem discriminação clara de quando cada Stage é usado, a union vira ruído sem função.

---

### GEMINI — 8.4/10

**Pontos fortes:**

1. **Melhor pedagogia.** Único relatório que articula claramente: active recall + metacognição + ilusão de competência como problemas centrais. Fundamentação em Gevorgyan 2024 e Zorić 2025.
2. **Microcopy original na voz do Professor Lemos.** Os 4 textos da seção 6 são os únicos textos finalizados prontos para produção no lote inteiro. Alta qualidade de voz.
3. **Ritual de sessão mais claro.** O fluxo mermaid (Visita → Proposta → Lichess → Volta → Feedback → Pendências → Fechamento) é a melhor descrição do loop de UX.
4. **Risco pedagógico por trilha.** Cada trilha tem um "risco pedagógico" nomeado — único no lote. Isso guia o design de guardrails sem precisar de engine.
5. **Tabela de diplomas mais clara** — visual, com critérios explícitos por faixa.

**Pontos fracos:**

1. **Hard gate de 3 dias no diploma é inadequado.** O dono é o próprio validador; bloquear por 3 dias cria atrito artificial em uso pessoal. O DIRETOR decidiu corretamente por soft gate.
2. **"App avisa se desenvolvimento foi violado" aproxima de tabuleiro próprio.** Esta feature foi corretamente vetada — o app não analisa lances em tempo real, só orquestra.
3. **Menos aderente ao repo.** Menciona `src/trainingBlocks.ts` (que não existe) e descreve `/training/replay` como deep link quando na realidade é endpoint de API `puzzle:read`, não URL pública.
4. **Fases de implementação vagas.** 4 fases sem arquivos nomeados, commits ou testes específicos — não dá para executar diretamente.
5. **Sem tipos TypeScript.** O relatório não escreve nenhum tipo concreto, deixando toda a modelagem para o executor adivinhar.

---

### DIRETOR — 9.2/10

**Pontos fortes:**

1. **Melhor arbitragem do lote.** Seção 2 (notas com justificativa), seção 5 (o melhor de cada IA), seção 6 (o que ficou fora e por quê) — nenhum outro relatório faz esse trabalho de síntese.
2. **Tabela de decisões fechadas (seção 10).** Oito perguntas abertas dos outros relatórios respondidas de forma definitiva — o executor não precisa adivinhar.
3. **9 commits bem granulados.** Mais granular que os 7 do CODEX, com separação clara entre domínio/persistência/UI/study.
4. **"O que ficou fora e por quê" (seção 6).** Cada decisão de exclusão tem contra-argumento explícito. Isso previne scope creep na implementação.
5. **Recomendação final com linguagem do usuário final.** *"Quando erro, o Professor Lemos guarda uma pendência e amanhã prioriza esse erro"* — é o melhor pitch do produto em uma frase.
6. **Riscos listados (seção 11).** Cinco riscos concretos com ação esperada.

**Pontos fracos:**

1. **Não é autossuficiente.** O relatório arbitra mas não especifica — precisa dos outros para os tipos TypeScript, testes, microcopy e wireframe. Se os outros relatórios desaparecerem, o DIRETOR perde metade do valor.
2. **Seção 7 menos detalhada que CODEX.** Os cortes 1-7 não listam arquivos específicos — só descreve o que cada corte entrega.
3. **Sem microcopy própria.** Delega o texto da voz do Professor Lemos para o Gemini mas não o transcreve, deixando o executor para buscar nos outros documentos.
4. **Sem testes listados.** A seção 9 de gates cita categorias mas não asserções nomeadas como o CODEX faz.

---

## Parte 2 — O Que Cada Relatório Contribui Para o Ideal

| fonte | contribuição aceita |
|---|---|
| CODEX | Espinha técnica: MethodTrackId, PendingTrainingItem, DiplomaAttempt, campos opcionais em PlanBlock, Dexie v4, Study do dia melhorado, testes por camada, leitura do repo existente |
| DEEPSEEK | DrillFormatId (versão simplificada, 7 formatos suficientes), fórmula de reviewRatio, wireframe ASCII da tela Hoje, métricas por trilha, agenda 1/3/7/14 |
| GEMINI | Princípio pedagógico central, microcopy original PT-BR (4 textos), ritual de sessão, risco pedagógico por trilha |
| DIRETOR | Tabela de decisões fechadas, lista do que ficou fora e por quê, 9 commits granulados, riscos explícitos |

---

## Parte 3 — Plano Ideal Consolidado

### 1. Veredito Executivo

O app já orquestra Signal → Weakness → Plan → Lichess → Feedback. O que falta é uma **camada de método** sobre esse loop: o Professor Lemos precisa saber que *este* erro específico precisa voltar amanhã, que *este* aluno ainda joga o primeiro lance que pensa, e que *este* checkpoint precisa ser revisado antes de avançar.

Implementar em 9 commits atômicos. Não criar tabuleiro próprio. Não substituir `PlanBlock`. Não adicionar tags psicológicas. Não criar 5 studies permanentes antes de validar o fluxo diário. Diplomas são soft gate.

**Métricas do plano:**
- Impacto: 9.2/10
- Esforço: 6.5/10 (domínio puro + tipos + catálogo + UX mínima)
- Risco: 3.5/10 (expansão aditiva, retrocompatível)
- Prioridade: 9.5/10 (fecha lacunas identificadas em 3 rodadas de análise)

---

### 2. Princípio Pedagógico Central

*(fonte: GEMINI, refinado)*

- **Recuperação ativa** em vez de estudo passivo: puzzles interativos, não leitura de teoria.
- **Metacognição sobre erro**: o aprendizado se consolida quando o aluno analisa o que falhou, não quando assiste a solução. Correlação empírica Gevorgyan 2024 (r=0.29).
- **Carga cognitiva controlada**: uma fraqueza por ciclo. Sessões curtas com tempo cronometrado (modelo Leitão).
- **Ilusão de competência como inimigo**: progresso medido por acerto sem rótulo de tema, não por rating.

---

### 3. Mapa Lichess do Método

*(fonte: CODEX — mais preciso com o repo real)*

#### Endpoints existentes (sem mudança)

| endpoint | escopo | uso |
|---|---|---|
| `GET /api/games/user/{username}` | sem OAuth | sinais de abertura, cor, accuracy |
| `GET /api/puzzle/activity` | `puzzle:read` | reconciliar resultado do bloco por janela |
| `GET /api/puzzle/dashboard/{days}` | `puzzle:read` | detectar temas fracos/fortes |
| `GET /api/puzzle/replay/{days}/{theme}` | `puzzle:read` | transformar erro em revisão |
| `POST /api/study` | `study:write` | criar Study privado/unlisted |
| `POST /api/study/{id}/import-pgn` | `study:write` | importar capítulos autorais |

#### Não usar

- Board API, Bot API, Challenge API, engine, `puzzle:write`
- Scraping de HTML do Lichess
- Sugestão de lance em partida viva

#### Deep links por trilha

| trilha | destinos confirmados |
|---|---|
| Tratamento de Pendências | `/training/{theme}`, puzzle:read replay, analysis de partida terminada |
| Cálculo Ponte | `/training/fork`, `/training/discoveredAttack`, `/training/mateIn2`, `/training/deflection`, `/training/quietMove`, `/streak` |
| Defesa Ativa | `/training/defensiveMove`, `/training/hangingPiece`, `/training/trappedPiece`, `/training/quietMove` |
| Abertura Como Plano | recursos aprovados já no catálogo; `/analysis` só pós-partida |
| Diplomas | `/training/coordinate`, `/learn`, `/practice`, puzzle themes mistos |

---

### 4. Modelo de Domínio

*(espinha: CODEX; drill formats: DEEPSEEK simplificado)*

#### Tipos novos em `src/domain/method/types.ts`

```ts
export type MethodTrackId =
  | 'pending-review'
  | 'calculation-bridge'
  | 'active-defense'
  | 'opening-as-plan'
  | 'progress-diplomas';

export type MethodTrackStatus = 'active' | 'review' | 'paused' | 'completed';

export type MethodTrack = {
  id: MethodTrackId;
  title: string;
  priority: number;
  status: MethodTrackStatus;
  focusWeaknessTags: WeaknessTag[];
  startedAt: string;
  updatedAt: string;
};

export type PendingItemOrigin = 'puzzle' | 'game-review' | 'manual' | 'diploma';

export type PendingTrainingItem = {
  id: string;
  origin: PendingItemOrigin;
  title: string;
  weaknessTag: WeaknessTag;
  methodTrackId: MethodTrackId;
  lichessTheme?: string;
  lichessUrl?: string;
  sourceLogId?: string;
  prompt: string;          // pergunta-guia do Professor Lemos
  dueAt: string;
  attempts: number;
  lastFeedback?: PlanBlockFeedback;
  status: 'open' | 'done' | 'deferred';
  createdAt: string;
  updatedAt: string;
};

export type DiplomaId = 'peao' | 'torre' | 'rei';

export type DiplomaAttempt = {
  id: string;
  diplomaId: DiplomaId;
  sectionId: string;
  scorePercent: number;
  totalItems: number;
  passed: boolean;
  source: 'local' | 'lichess';
  createdAt: string;
  updatedAt: string;
};

// Formatos de drill (7 suficientes — simplificado de DEEPSEEK)
export type DrillFormatId =
  | 'pendency-treatment'        // re-resolver erros reais
  | 'thinking-system-soltis'    // 5-passos candidatos
  | 'defense-checklist-crouch'  // checklist defesa 4 perguntas
  | 'opening-principle-emms'    // princípios antes do nome
  | 'diagnostic-profile'        // perfil multi-tema (diploma)
  | 'lpdo-scan'                 // varredura anti-blunder (já existe)
  | 'damp-scan';                // detecção tática (já existe)
```

#### Extensão retrocompatível em `PlanBlock`

```ts
// Adicionar como campos opcionais em src/domain/types.ts
methodTrackId?: MethodTrackId;
methodStepId?: string;
pendingItemId?: string;
masteryTarget?: 'advance' | 'review' | 'regress';
drillFormatId?: DrillFormatId;
guidingQuestion?: string;   // pergunta-guia para o Study PGN
```

#### Novo WeaknessTag — somente se necessário

Adicionar apenas `'defensive-move'` se o catálogo precisar representar `/training/defensiveMove`. Não adicionar tags psicológicas (evaluation-error, psychological-collapse) — são inferências não mensuráveis.

---

### 5. As 5 Trilhas

*(estrutura: CODEX; pedagogia e microcopy: GEMINI; métricas: DEEPSEEK)*

#### Trilha 1 — Tratamento de Pendências

**Promessa**: Eliminar erros repetitivos através da revisão sistemática dos blunders reais.

**Microcopy do Professor Lemos:**
> *"Esqueça o rating por um momento. O seu maior adversário é o erro que você repete. Vamos olhar para aquelas posições que você pendurou ontem. Encontre o erro antes de tentar acertar o lance."*

**Pergunta-guia**: *"Qual sinal do tabuleiro você ignorou quando jogou o lance errado?"*

**Quando aparece:** pendência vencida no `dueAt` (1/3/7/14 dias), ou feedback `hard` acumulado, ou tema fraco no dashboard.

**Destino Lichess:** puzzle:read replay → `/training/{theme}` → analysis de partida terminada.

**Drill format:** `pendency-treatment`

**Risco pedagógico:** chutar lances apenas para "limpar a fila" sem refletir.

**Métricas locais:**
- `pendencyCount` por tipo
- `pendencyResolvedRate` (meta: 80% na 4ª revisão espaçada)
- `avgAttemptsToResolve`

**Critério de conclusão:** 5 posições anteriormente falhadas resolvidas com sucesso; erro classificado (blunder/cálculo/avaliação/tempo).

---

#### Trilha 2 — Cálculo Ponte 800-1200

**Promessa**: Parar de jogar o primeiro lance visto. Treinar 2-3 candidatos + melhor resposta adversária + comparação de posição final.

**Microcopy do Professor Lemos:**
> *"O tabuleiro não é uma corrida de velocidade. Antes de mover, escaneie os alvos: há peças soltas no ar? Existe algum alinhamento perigoso? Aplique o scan DAMP e depois calcule as respostas forçadas."*

**Pergunta-guia** (4 perguntas em ordem):
1. Qual é a ameaça dele?
2. Quais são meus 2 candidatos?
3. Qual é a melhor resposta dele?
4. A posição final ficou melhor, igual ou pior?

**Quando aparece:** fraqueza dominante em `fork`, `discoveredAttack`, `mateIn2`, `conversion`, ou pendências de cálculo.

**Destino Lichess:** `/training/fork`, `/training/discoveredAttack`, `/training/mateIn2`, `/training/deflection`, `/training/quietMove`, `/streak`.

**Drill format:** `thinking-system-soltis`

**Risco pedagógico:** calcular linhas longas desnecessárias; ignorar segurança material básica.

**Métricas locais:**
- `candidateCount` médio por posição (meta: ≥2)
- Acerto em puzzles `short` (meta: ≥80%) vs `long` (meta: ≥70%)

**Critério de conclusão:** ≥80% em bateria de 10 puzzles mistos de cálculo.

---

#### Trilha 3 — Defesa Ativa

**Promessa**: Aprender a perguntar "o que ele ameaça?" e defender criando recurso, não apenas resistindo.

**Microcopy do Professor Lemos:**
> *"Estar pior faz parte do jogo. O que define o bom enxadrista é a resiliência na desvantagem. Não entregue a partida e não jogue lances passivos. Qual é a ameaça real do seu oponente e como podemos incomodá-lo?"*

**Pergunta-guia** (checklist em 5 perguntas):
1. Estou em perigo?
2. Qual é a ameaça concreta?
3. Posso neutralizar?
4. Posso trocar para aliviar?
5. Posso criar contra-jogo?

**Quando aparece:** `blunder-rate` alto, perdas em `defensiveMove`/`hangingPiece`, ou pendência manual de perigo não visto.

**Destino Lichess:** `/training/defensiveMove`, `/training/hangingPiece`, `/training/trappedPiece`, `/training/quietMove`. Slugs adicionados somente via allowlist manual com testes de URL.

**Drill format:** `defense-checklist-crouch`

**Risco pedagógico:** saturação psicológica — o jogador desanimar e abandonar por achar que está perdido.

**Métricas locais:**
- `threatDetectedRate` (meta: ≥65%)
- `defensiveCollapseCount` nas últimas 10 partidas analisadas

**Critério de conclusão:** 4 exercícios de defesa sem selecionar lances puramente passivos.

---

#### Trilha 4 — Abertura Como Plano

**Promessa**: Sobreviver à abertura jogando por conceitos, sem decorar linhas extensas.

**Microcopy do Professor Lemos:**
> *"Não decore linhas. Entenda por que você move cada peça. Seu objetivo é controlar o centro, rocar o rei e colocar as peças menores para trabalhar de forma coordenada. O plano do meio-jogo nasce dessa harmonia."*

**Pergunta-guia**: *"Essa jogada ajuda a desenvolver suas peças e proteger seu rei, ou é apenas um lance de peão sem motivo?"*

**Quando aparece:** depois de segurança/tática mínima, ou quando sinais de abertura aparecerem com confiança média. Nome de abertura só depois de 5 partidas com princípios sólidos.

**Não fazer:** o app não avisa violações de abertura em tempo real, não sugere lances, não vira tabuleiro próprio. Análise só pós-partida.

**Destino Lichess:** recursos aprovados no catálogo; `/analysis` apenas pós-partida.

**Drill format:** `opening-principle-emms`

**Risco pedagógico:** cair na tentação de decorar sequências mecânicas de 15 lances.

**Critério de conclusão:** 5 partidas consecutivas com ≥80% dos lances respeitando os 3 princípios (centro/desenvolvimento/rei seguro).

---

#### Trilha 5 — Diplomas de Progresso

**Promessa**: Validar a transição de bandas curriculares sem depender de rating.

**Microcopy do Professor Lemos:**
> *"Chegou a hora do teste de Diploma. Sem pressa e sem chutar. Você confia nas suas decisões?"*

**Modelo (soft gate — não bloqueia o dono, mas recomenda revisão):**

| Diploma | Faixa | Avalia | Critério |
|---|---|---|---|
| Peão | 0-600 | Regras, coordenadas, valor das peças, mates básicos | ≥90% |
| Torre | 600-1000 | Segurança material, tática básica rotulada, tema misto | ≥80% |
| Rei | 1000-1200 | Cálculo curto, abertura por princípios, final básico, revisão de partida | ≥70-80% por seção |

**Regra de revisão (soft gate):** falhou → gerar plano de revisão focado nas seções abaixo do threshold. Mostrar "recomendamos revisar antes de avançar" mas não bloquear. O dono é adulto.

**UX:** integrar ao `SessionMilestonesCard`; mostrar "avançar", "revisar" ou "voltar para guiado".

**Risco pedagógico:** ansiedade no teste ou uso de engine externa.

---

### 6. Regras do Gerador de Plano

*(fonte: CODEX + fórmula reviewRatio do DEEPSEEK)*

#### Seleção de trilha (deterministico)

```
SE há pendência aberta vencida        → trilha = pending-review
SENÃO SE dashboard tem tema de defesa fraco → trilha = active-defense
SENÃO SE fraqueza dominante em fork/discovered/mate-in-2 → trilha = calculation-bridge
SENÃO SE opening-principles com sinal médio → trilha = opening-as-plan
SENÃO SE checkpoint de horas/sessões atingido → trilha = progress-diplomas
SENÃO manter trilha da fraqueza primária atual
```

#### Fórmula de reviewRatio (DEEPSEEK)

```
SE pendências abertas > 0:
  reviewRatio = min(0.70, 0.40 + pendências * 0.05)
SENÃO SE novo bloco esta semana:
  reviewRatio = 0.30  // baseline
SENÃO:
  reviewRatio = 0.20  // manutenção
```

#### Thresholds de mastery

| contexto | threshold | ação se abaixo |
|---|---|---|
| Tema rotulado (explain/guided) | ≥80% | avançar para retrieval |
| Tema misto (retrieval) | ≥70% | manter com variação |
| Revisão espaçada (4ª sessão) | ≥90% | considerar dominado |
| Diploma | ≥80% Torre/Rei, ≥90% Peão | gerar plano de revisão |
| Qualquer | <50% | regredir modo (retrieval→guided→explain) |

#### Time budget com trilha ativa

| tempo | estrutura |
|---|---|
| 5 min | 1 bloco — preferir pendência vencida |
| 15 min | 5 min pendência/aquecimento + 10 min tema da trilha |
| 30 min | 5 aquecimento + 15 trilha ativa + 10 transferência/revisão |
| 60 min | 10 aquecimento + 20 trilha ativa + 15 pendências/replay + 10 final/abertura + 5 registro |

---

### 7. Ritual de Sessão UX

*(fonte: GEMINI)*

```
[Primeira Visita do Dia]
      ↓
[Card de Proposta do Professor Lemos]
  — trilha ativa, estimativa de tempo, progresso até checkpoint
      ↓ aprovar
[Escolha de Tempo: 5 / 15 / 30 / 60 min]
      ↓
[Blocos de Treino em ordem didática]
  — se há pendência vencida, aparece ANTES do tema novo
      ↓ bloco por bloco
[Abrir Lichess → foco no treino]
      ↓ voltar ao app
[Registrar Feedback: Fácil / Bom / Difícil]
  — se Difícil: "Guardar como pendência?" (sugestão, não obrigatório)
      ↓
[Reconciliar puzzles via puzzle:read se OAuth ativo]
      ↓
[Fechamento do Dia — milestones acumuladas]
```

#### Wireframe da tela Hoje (adaptado de DEEPSEEK)

```
┌──────────────────────────────────────┐
│  Hoje — Ter, 10 Jun                  │
│  Trilha: Cálculo Ponte 800-1200      │  ← trilha ativa visível
│                                      │
│  ┌─ Pendências (3) ─────────────┐   │  ← alerta quando pendências > 0
│  │ ↻ 2 garfos, 1 descoberto     │   │
│  │ [Resolver pendências]         │   │
│  └───────────────────────────────┘   │
│                                      │
│  Plano (30 min)                      │
│  ┌──────────────────────────────────┐│
│  │ 1. Aquecimento (5 min)           ││
│  │    LPDO scan · hangingPiece      ││
│  │    [Abrir Lichess]               ││
│  ├──────────────────────────────────┤│
│  │ 2. Cálculo Ponte (15 min)        ││  ← drill format visível
│  │    Thinking System Soltis        ││
│  │    "Liste 2 candidatos..."       ││
│  │    [Abrir Lichess]               ││
│  ├──────────────────────────────────┤│
│  │ 3. Transferência (10 min)        ││
│  │    Puzzle Streak                 ││
│  │    [Abrir Lichess]               ││
│  └──────────────────────────────────┘│
│  [Aprovar plano] [Mudar tempo]       │
└──────────────────────────────────────┘
```

---

### 8. Persistência Dexie v4

*(fonte: CODEX)*

```ts
this.version(4).stores({
  methodTracks:    'id, status, updatedAt',
  pendingItems:    'id, status, dueAt, methodTrackId, weaknessTag, updatedAt',
  diplomaAttempts: 'id, diplomaId, sectionId, createdAt, updatedAt',
});
```

Funções novas em `src/infra/storage/appData.ts`:
- `loadMethodTracks`, `saveMethodTracks`
- `loadOpenPendingItems`, `savePendingItem`, `replacePendingItems`
- `loadDiplomaAttempts`, `saveDiplomaAttempt`

`clearAll` e `exportAllAsJson` atualizados. Export continua excluindo OAuth tokens.

---

### 9. Study do Dia Melhorado

*(fonte: CODEX)*

Reaproveitar `createDailyStudy`. Melhorar `buildBlockPgn` para incluir apenas conteúdo autoral:

```txt
{ Trilha: Cálculo Ponte 800-1200 }
{ Pergunta: quais são meus 2 candidatos e qual a melhor resposta dele? }
{ Tarefa: resolver 8 puzzles de garfo no Lichess }
{ Stop Rule: parar após 8 tentativas ou 15 min }
{ Critério: ≥80% de acerto para marcar concluído }
{ Destino: https://lichess.org/training/fork }
```

**Não incluir:** texto de livro, FEN/PGN protegido, variantes copiadas, conteúdo de PDF sensível.

Modo: normal primeiro. `gamebook`/`conceal` só depois de validação visual mobile separada.

Limite: máximo de blocos do plano por capítulo (normalmente 1-4). Falha com mensagem clara se tentar passar de 64 capítulos.

Studies permanentes por trilha: **adiar até 2 semanas de uso real com o flow diário validado.**

---

### 10. Privacidade e Clean-Room

- Repo armazena: abstrações autorais, slugs Lichess, URLs, status, feedback, telemetria.
- **Não armazenar:** texto, diagramas, FEN, PGN, comentários ou variantes de livros protegidos.
- Tokens OAuth: tabela local `lichessOAuthTokens`, fora do `exportAllAsJson`.
- Chess.com: read-only, PGN transiente, persistir só sinais derivados.
- Partida viva: nunca como destino de análise.
- `analysis` só para partida terminada e sem sugestão de lance no app.

---

### 11. Testes Obrigatórios

*(fonte: CODEX — lista mais completa)*

**Domínio**
- `methodTracks.test.ts` — catálogo com 5 trilhas exatas; tags permitidas; nenhum texto sensível
- `mastery.test.ts` — ≥80 avança; 50-79 revisa; <50 regride; `hard` impede avanço
- `pendingItems.test.ts` — feedback `hard` cria pendência; puzzle losses agregam por tema; pendência concluída não volta como vencida
- `generatePlan.test.ts` (expandido) — pendência vencida tem prioridade; cálculo ponte usa tema tático correto; defesa ativa não aparece antes de segurança mínima; abertura respeita timing; reviewRatio aumenta com pendências

**Infra Lichess**
- `study.test.ts` — PGN inclui trilha/pergunta/critério; comentários sanitizados; limite de 64 capítulos; 429 → `LichessRateLimitError`
- `destinations.test.ts` — todas as URLs de trilhas têm formato válido (sem fetch)

**Storage**
- `appData.test.ts` — Dexie v4 cria novas tabelas; export inclui método/pendências/diplomas; export exclui token; clear apaga novas tabelas

**React**
- `LearningPlanProposalCard.test.tsx` — mostra trilha ativa
- `SessionMilestonesCard.test.tsx` — mostra diploma/checkpoint sem prometer rating
- `trainingFlow.test.tsx` — feedback hard oferece pendência; abrir Lichess salva log antes; Study continua manual

**Gate de regressão:**
```bash
npm run lint && npm run test && npm run build
```
Verificar desktop/mobile no browser se houver mudança visual na tela Hoje.

---

### 12. Commits Atômicos

*(9 commits — DIRETOR; arquivos específicos — CODEX)*

| # | commit | entrega | arquivos-chave |
|---|---|---|---|
| 1 | `feat: add method track domain` | tipos, catálogo das 5 trilhas, mastery | `domain/method/types.ts`, `methodTracks.ts`, `mastery.ts`, testes |
| 2 | `feat: add pending training items` | criação por feedback/log/puzzle, agenda 1/3/7/14 | `domain/method/pendingItems.ts`, `selectMethodTrack.ts`, testes |
| 3 | `feat: persist method state locally` | Dexie v4, export/clear | `infra/storage/db.ts`, `appData.ts`, testes |
| 4 | `feat: select method track in daily plan` | `generatePlan` com `methodTrackId`, reviewRatio, prioridades | `domain/plan/generatePlan.ts`, `timeBudget.ts`, testes |
| 5 | `feat: expand lichess catalog for defense and calculation` | defensiveMove, trappedPiece, quietMove, deflection via allowlist | `domain/sources/resourceCatalog.ts`, `destinations.ts`, testes |
| 6 | `feat: show method track and pending review in today` | UI mínima tela Hoje, trilha visível, alerta de pendências | `ui/Today.tsx`, `LearningPlanProposalCard.tsx`, `SessionMilestonesCard.tsx`, testes |
| 7 | `feat: add diploma checkpoints` | DiplomaAttempt, soft gate, card checkpoint | `domain/method/diplomas.ts`, UI, testes |
| 8 | `feat: enrich daily study chapters` | PGN autoral com trilha/pergunta/critério, limite 64 capítulos | `infra/lichess/study.ts`, testes |
| 9 | `docs: record method implementation decision` | memória e fontes | `memory/state.md`, `memory/progress.md`, `docs/research/sources.md` |

---

### 13. Decisões Fechadas

*(fonte: DIRETOR, seção 10)*

| pergunta | decisão |
|---|---|
| Mais uma rodada de IA antes de codar? | Não. Consenso suficiente nos 4 relatórios. |
| Trilha ativa: manual ou automática? | Automática com base em sinais; override manual fica para depois. |
| Pendências: automáticas ou curadas? | Sugestão automática; usuário pode concluir/deferir. |
| Diplomas bloqueiam avanço? | Não. Soft gate. |
| Studies por trilha agora? | Não. Study do dia melhorado primeiro. |
| Adicionar muitos WeaknessTags novos? | Não. Usar `MethodTrackId`; adicionar só `defensive-move` se necessário. |
| Usar `gamebook` agora? | Não. Modo normal primeiro. |
| Usar Puzzle DB local agora? | Não. Deep links + Puzzle Activity/Dashboard/Replay. |
| Trocar `PlanBlock` por `TrainingBlock`? | Não. Campos opcionais retrocompatíveis. |
| `trainingCatalog` em Dexie? | Não. Dados estáticos ficam em constantes de código. |

---

### 14. Riscos e Mitigações

*(fonte: DIRETOR + adições do árbitro)*

1. **Slugs de destino inválidos.** `defensiveMove`, `quietMove`, `trappedPiece`, `deflection` devem estar na allowlist local e passar em teste de URL. Não fazer fetch de página para validar.
   - *Mitigação:* testar formato manualmente antes de adicionar ao catálogo.

2. **Pendências viram spam.** Se cada erro gerar um item, o aluno vê 50 pendências e desiste.
   - *Mitigação:* agregar por tema/log no primeiro corte; não criar pendência por puzzle individual.

3. **Diplomas viram burocracia.** Soft gate com muitas seções pode inibir progressão.
   - *Mitigação:* manter como checkpoint leve; no máximo 3 seções por diploma.

4. **Abertura vira repertório prematuro.** Se o gatilho de abertura disparar cedo, o aluno pode tentar nomear aberturas antes de dominar princípios.
   - *Mitigação:* exigir segurança/tática mínima antes de `opening-as-plan`; manter como checklist pós-partida.

5. **Study do dia fica verboso.** Comentários longos no PGN autoral poluem o Study.
   - *Mitigação:* máximo 3 linhas de comentário por capítulo; comentários curtos, autorais e sanitizados.

6. **Feedback `hard` automático gera pendência antes de o usuário confirmar.** O aluno pode querer fazer isso manualmente.
   - *Mitigação:* sugestão de pendência (botão discreto "Guardar como pendência"); não criar automaticamente sem confirmação no primeiro corte.

---

### 15. O Coração do Método

*(recomendação final — frase do DIRETOR)*

> *"Quando erro ou acho difícil, o Professor Lemos guarda uma pendência, agenda revisão e amanhã prioriza esse erro antes de me dar conteúdo novo."*

Começar por isso. Cálculo ponte, defesa ativa, abertura como plano e diplomas vêm depois. Se o fluxo de pendências funcionar bem por duas semanas de uso real, aí vale discutir studies permanentes por trilha e testes interativos mais sofisticados.

---

*Árbitro: Claude Sonnet 4.6, 2026-06-10. Base: 4 relatórios de implementação (~800 linhas cada). Fontes pedagógicas: abstrações de Gevorgyan 2024, Zorić 2025, Tirado & Silva 1999, Soltis, Beim, Crouch, Marin, Emms, Leitão — sem cópia de texto, diagrama ou exercício protegido.*
