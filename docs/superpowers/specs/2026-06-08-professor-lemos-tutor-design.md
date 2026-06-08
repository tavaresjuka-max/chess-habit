# Spec De Design: Professor Lemos — Tutor Completo (envelope de sessão + diagnóstico travado por evidência)

- Data: 2026-06-08
- Autoria do planejamento: Claude (claude-opus-4-8)
- Executor: Codex (implementa a partir deste spec e do plano de implementação derivado)
- Base de código: app atual em `lichess-tutor` (React + Vite + TS, local-first)
- Status: aguardando revisão do dono antes de gerar o plano de implementação

> Este documento é uma **ordem de execução**. O executor implementa exatamente o que está escrito,
> sem inferir escopo novo. Toda ambiguidade encontrada deve PARAR a tarefa e ser perguntada, não
> adivinhada.

---

## 1. Objetivo

Fechar o ciclo pedagógico do app: transformar o planejador adaptativo atual em um **tutor que
conversa**. O Professor Lemos passa a falar com o aluno antes e depois do treino, reconhecer
constância de forma sóbria, chamar de volta após ausência e — quando, e somente quando, houver
sinal claro — nomear a causa provável do erro e propor o procedimento de correção.

O alicerce já existe e deve ser reaproveitado, não reinventado:

- `PlanBlock.reason` e `PlanBlock.coachNote` (`src/domain/types.ts`) já carregam o "porquê" e a voz
  por bloco; `src/domain/plan/generatePlan.ts:101,150` já preenche o motivo com a evidência real da
  fraqueza.
- A voz do tutor tem catálogo (`src/domain/coach/coachCatalog.ts`) e persona especificada com tom,
  exemplos e *banlist* (`docs/pedagogy/professor-lemos.md`).
- Decisão de governança vigente: "microcopy no protótipo, persona completa no MVP privado"
  (`docs/review/relatorio-claude-diretor-geral-consolidado-2026-06-06.md:63`). Este spec executa
  essa transição para persona completa, dentro do escopo pessoal.

## 2. Não-objetivos (cortar sem dó)

- **Não** rodar engine (Stockfish/WASM) nem prometer rating.
- **Não** guardar PGN completo. O diagnóstico usa apenas sinais agregados já disponíveis e atividade
  de puzzle.
- **Não** fazer diagnóstico lance a lance ("você não viu o segundo alvo neste lance"). Isso exige
  PGN/engine e é não-objetivo explícito do projeto.
- **Não** comentar durante partida ao vivo (regra de fair play do `professor-lemos.md:58`).
- **Não** celebrar nem usar motivacional vazio. Reconhecimento é sóbrio e factual (banlist do
  `professor-lemos.md:45`).
- **Não** mexer nas fases congeladas P4 (sync) e P5 (comunidade). O escopo `puzzle:read` do OAuth já
  está previsto nos tipos (`LichessOAuthScope`) e não é parte das fases congeladas.

## 3. Guardrails obrigatórios

- **Trava de evidência (regra central):** o tutor só afirma causa de erro quando o sinal for claro.
  Sem sinal, ele faz uma pergunta, nunca um chute. Isso implementa `professor-lemos.md:24` ("mostra
  causa de erro quando houver sinal claro").
- **Determinismo:** `consistency`, `sessionMessage` e `diagnosis` são funções puras e testáveis
  (entrada → saída), sem rede e sem React dentro do domínio.
- **Regra de ouro de camadas:** Domínio não importa Infra nem UI. A camada de aplicação liga os dois.
- **Tom:** toda string visível segue o `professor-lemos.md` — PT-BR, frases curtas, sem emoji, sem
  bronca, sem vergonha, sem girias. Respeitar a banlist.
- **Sem scope creep:** implementar exatamente a etapa corrente. Não adiantar a etapa seguinte.

## 4. Arquitetura

Três módulos novos no domínio (puros), mais um componente de UI. A camada de aplicação monta o
contexto a partir do estado e chama o domínio.

```
UI (React)
  • TutorCard  (card dedicado do Lemos no "Hoje", dois estados: antes/depois do treino)
  |
Aplicação (hooks/estado)            monta contexto (perfil, plano, logs, foco) -> chama domínio
  |
Domínio (TS puro)
  • metrics/consistency.ts          TrainingLog[] -> Consistency
  • coach/sessionMessage.ts         SessionContext -> CoachMessage
  • coach/diagnosis.ts              Weakness[] + PuzzleThemeStats? -> Diagnosis
  • coach/coachCatalog.ts           (existente; reaproveitado pela voz)
  |
Infra (efeitos)                     puzzleActivity.ts (existente) alimenta PuzzleThemeStats na etapa 2
```

## 5. Modelo de dados (contratos)

Adicionar a `src/domain/types.ts`. Tipos só de leitura para o domínio; nada persistido além do que
já existe.

```ts
export type Consistency = {
  currentStreakDays: number;   // dias consecutivos com pelo menos um TrainingLog 'done'
  longestStreakDays: number;
  daysSinceLastSession: number; // 0 se treinou hoje
  returnedAfterGap: boolean;    // true quando treinou hoje após >= 2 dias parado
};

export type CoachMessagePhase = 'welcome' | 'close' | 'return';

export type CoachMessage = {
  phase: CoachMessagePhase;
  // Linhas curtas, na voz do Lemos. A UI renderiza em ordem. Nunca vazio.
  lines: string[];
};

export type DiagnosisBasis = 'aggregate' | 'puzzle-theme';

export type Diagnosis =
  // Há sinal claro: nomeia categoria/tema e o procedimento de correção.
  | { kind: 'cause'; weaknessTag: WeaknessTag; basis: DiagnosisBasis; message: string; procedure: string }
  // Sem sinal claro: o tutor pergunta, não afirma.
  | { kind: 'question'; message: string };

// Etapa 2: derivado de puzzle:read via puzzleActivity. Win/loss por tema tático.
export type PuzzleThemeStat = { theme: string; attempts: number; losses: number };
export type PuzzleThemeStats = { since: string; until: string; themes: PuzzleThemeStat[] };
```

`SessionContext` (entrada de `sessionMessage`) é montado pela aplicação a partir de tipos já
existentes — `LearnerProfile`, `DailyPlan`, `Weakness[]`, `WeeklyFocus`, `Consistency`, e o
`PlanBlockFeedback` do bloco recém-concluído.

## 6. Comportamento por módulo

### 6.1 `metrics/consistency.ts`
- `computeConsistency(logs: TrainingLog[], today: string): Consistency`.
- Conta dias com pelo menos um log `status: 'done'`. Streak quebra quando há um dia de calendário
  sem log `done` entre hoje e a última sessão.
- `daysSinceLastSession` em dias de calendário. `returnedAfterGap = daysSinceLastSession === 0 && gap anterior >= 2`.
- Bordas a cobrir em teste: nenhum log; só hoje; um dia de calendário sem `done` quebra a streak;
  virada de dia; dois logs `done` no mesmo dia contam como 1.

### 6.2 `coach/sessionMessage.ts`
- `buildSessionMessage(context: SessionContext): CoachMessage`.
- `welcome`: saudação + por que o foco de hoje (reusa `primaryWeakness.evidence`) + 1 linha de
  constância sóbria quando `currentStreakDays >= 2` (ex.: "3 dias seguidos. Isso já é rotina.").
- `return`: quando `returnedAfterGap`, abre com a linha de retorno sem cobrança
  (`professor-lemos.md:33`) em vez da saudação padrão.
- `close`: ramifica por `feedback` do bloco — `easy → avança`, `good → consolida com variação`,
  `hard → reduz carga e volta à explicação`. Quando houver `TrainingResult` de puzzle reconciliado,
  comenta acertos/erros reais (sem inventar números).
- Nunca celebra. Sem "parabéns", sem banlist.

### 6.3 `coach/diagnosis.ts`
- `diagnose(weaknesses: Weakness[], puzzleThemeStats?: PuzzleThemeStats): Diagnosis`.
- **Etapa 1 (aggregate):** emite `cause` apenas quando a fraqueza primária tem `confidence`
  `>= 'medium'` **e** `score >= 0.5` (coerente com `confidenceScore` em `detectWeaknesses.ts`, onde
  `medium = 0.6`). Mapeia tag → procedimento curto
  (ex.: `blunder-rate` → "antes do ataque, conte os defensores da peça"; `time-trouble` → "decida o
  plano antes de calcular variantes"; `opening-principles` → "desenvolva antes de atacar").
- **Etapa 2 (puzzle-theme):** se `puzzleThemeStats` existir e algum tema tiver volume e taxa de erro
  claros, emite `cause` com `basis: 'puzzle-theme'` nomeando o tema (ex.: "você erra mais em garfos
  do que em cravadas").
- **Sem sinal claro em nenhum dos dois → `question`** (ex.: "O que pesou mais hoje: tempo, cálculo
  ou peça solta?"). Esta é a trava de evidência.

## 7. UI — Card dedicado do tutor

- Novo componente `TutorCard` na tela "Hoje" (`src/ui/Today.tsx`), card próprio, separado dos blocos.
- **Antes do treino:** renderiza `welcome`/`return` + linha de constância.
- **Depois do treino:** renderiza `close` + `Diagnosis` (mensagem de causa+procedimento, ou a
  pergunta). Quando `Diagnosis.kind === 'question'`, oferecer registrar a resposta como sinal manual
  (`knownManualSignals`) — reaproveita o caminho já existente.
- Acessibilidade conforme padrão atual: foco visível, alvos de toque, sem depender de cor.
- Não adicionar densidade fora do card; o restante do layout single-column permanece.

## 8. Etapas de entrega

- **Etapa 1 — Envelope de sessão (dados atuais, zero mudança de governança):** `consistency` +
  `sessionMessage` + `diagnosis` por categoria + `TutorCard`. Usa `TrainingLog`/`TrainingResult`.
- **Etapa 2 — Diagnóstico por tema:** liga `puzzle:read` (OAuth já previsto), deriva
  `PuzzleThemeStats` de `puzzleActivity.ts`, e habilita o ramo `puzzle-theme` de `diagnosis`.

## 9. Testes

Cada função pura ganha teste entrada→saída no padrão de `src/domain/weakness/detectWeaknesses.test.ts`:
- `consistency`: bordas da seção 6.1.
- `sessionMessage`: cada ramo de feedback; retorno após ausência; com e sem `TrainingResult`;
  verificação de banlist (nenhuma string proibida).
- `diagnosis`: sinal claro agregado → `cause`; sem sinal → `question`; etapa 2 tema claro → `cause`.
- UI: o `TutorCard` mostra o estado certo antes/depois do treino.

## 10. Critério de pronto

`npm run lint && npm run test && npm run build` verdes. Toda string visível auditada contra a
banlist do `professor-lemos.md`. Etapa 1 e Etapa 2 entregues e testadas separadamente.
