# Proposta de Revisão de Textos — lichess-tutor

**Objetivo:** deixar a copy mais enxuta sem perder qualidade nem mudar a voz.
**Escopo:** 452 strings em 29 arquivos (UI + coach + currículo + erros).
**Council:** GLM 5.2 (lente concisão frase-a-frase) + passada sistêmica do maestro
(lente redundância/arquitetura — DeepSeek V4 Pro foi **bloqueado pelo harness**
ao enviar a copy em massa; lente coberta inline).
**Status:** proposta — **nada aplicado ainda**. Aguarda aprovação.

---

## 1. Regras de corte (princípios, valem para vários textos)

1. **2ª pessoa de enchimento** — o imperativo já carrega o sujeito.
   `Você pode aprovar… dizendo se quer` → `Aprove… ou peça`; `você vai ver` → corta.
2. **Meta-justificação do bloco** — `Isso importa porque…`, `Esse bloco treina…`
   são cortáveis; o aprendiz já está no bloco.
3. **`ainda` em estado vazio** — no máximo um por frase (o imperativo já sugere
   continuidade). `Sem X ainda. Conclua Y…` → `Sem X. Conclua Y…`.
4. **Artigo solto antes de label** — `O diagnóstico atualiza…` → `Diagnóstico atualiza…`.
5. **Adjetivo de previsão redundante** — `sessões previstas` quando o rótulo já é
   "Meta"/"plano".
6. **Sujeito redundante após rótulo** — `Carga: o feedback pede…` → `Carga: …`.

> **Voz preservada:** nada de hype/bajulação; tom sóbro "causa, não culpa" intacto.
> A lista de termos proibidos (`gênio`, `talento`, `parabéns`, `missão épica`…)
> continua respeitada — nenhum corte introduz entusiasmo.

---

## 2. Cortes propostos — por lote (atômico por arquivo)

### Lote 1 — `src/domain/coach/coachCatalog.ts` (maior densidade)
| linha | depois |
|------|--------|
| 10 | "Hoje é repetição deliberada de um padrão. Procure a ideia antes do lance: alvo, defensor e consequência material. Pare quando a regra de parada bater, mesmo embalado." |
| 12 | "Revise procurando causa, não culpa. Escolha uma posição recente e pergunte qual informação você ignorou. Uma resposta honesta vale mais que muitos lances no automático." |
| 14 | "Agora leve o padrão para uma posição menos limpa. Antes de mover, diga em voz baixa o que mudou em relação aos puzzles. Aqui você reconhece o tema fora da vitrine." |
| 16 | "Feche com calma e precisão. Final bom nasce de rei ativo, peões contados e plano simples. Se a linha ficar nebulosa, volte um lance e reduza a uma pergunta concreta." |
| 24 | "Garfo é uma peça sua atacando dois alvos ao mesmo tempo. Hoje: garfos com cavalo, bispo, peão e dama. O rival salva um alvo, mas o outro pode cair. No começo você vê o desenho; com treino, prepara o garfo alguns lances antes." |

> Ajuste do maestro vs. GLM: na 14 mantive `Aqui você reconhece o tema` (GLM tinha
> "O tema aparece", que perde o enquadramento de treino).

### Lote 2 — `src/domain/coach/sessionMilestones.ts`
| linha | depois |
|------|--------|
| 330 | "Sem sessões concluídas. Conclua blocos para ativar este painel." |
| 336 | "${formatHours(input.completedHours)} em ${formatSessionCount(input.completedSessions)} concluída${…}." (corta "Você já registrou") |
| 341 | "Feedback recente mais fácil/bom que difícil; libera repetição ou transferência no próximo ajuste." |
| 373 | "Sem resultados reconciliados. Confira no Lichess para medir o acerto." |
| 382 | "Hábito: sem sessões concluídas." |
| 383 | "Habilidade: falta treino reconciliado ou feedback para medir melhora real." |
| 405 | "Carga: repetir com variação ou transferir para tarefa menos guiada." |
| 407 | "Carga: explicação curta antes de aumentar dificuldade." |
| 437 | "${currentMilestone.label} concluído. O próximo ciclo usa as mesmas métricas, sem promessa de rating." |
| 440 | "Próximo checkpoint: ${currentMilestone.label}. Faltam cerca de ${formatHours(remainingHours)} para revisar." |
| 356/358/360 | (sistêmico) cortar o prefixo `Comparando as sessões,` das linhas 2ª e 3ª quando aparecem juntas no painel. |

### Lote 3 — `src/domain/coach/learningPlanProposal.ts`
| linha | depois |
|------|--------|
| 65 | "Não é promessa de rating. É uma janela de treino para medir se os sinais melhoraram e se o plano precisa mudar." |
| 67 | "O que acha? Aprove o plano ou peça revisão: mais exercícios, mais partidas, partidas de um tempo específico ou sessões mais longas." |
| 79 | "Confiança: inicial. Faltam sinais reais; o foco vem da faixa atual e será recalibrado com treino." |
| 85 | "Confiança: forte para rotina. Há sinais consistentes para priorizar este tema, sem diagnóstico definitivo." |
| 88 **e** 90 | "Confiança: média. Hipótese prática; confirmamos pelo resultado dos próximos treinos." (**88 e 90 são idênticas hoje** — aplicar nas duas) |

### Lote 4 — `src/domain/coach/sessionReport.ts` + `dayCompletionSummary.ts`
| linha | depois |
|------|--------|
| report 94 | "\"${block.title}\" foi difícil: voltamos um passo, com explicação antes do treino." |
| report 132 | "${String(daysSinceLastSession)} dias fora — normal, a vida acontece. Preparei uma sessão mais curta para recomeçar leve; quando quiser, aumente o tempo." |
| day 127 | "Puzzles sem placar. Confira no Lichess para calibrar o plano." |
| day 140 | "Na próxima sessão: ${nextItem.title} (${String(nextItem.minutes)} min) em ${nextItem.destinationLabel}." |
| day 52-56 | "Plano encerrado com … e ${formatElapsedMinutes(elapsedSeconds)} de treino." **[RISCO — testar flexão]** |

### Lote 5 — `src/domain/curriculum/curriculum.ts` + `diagnosis.ts`
| linha | depois |
|------|--------|
| curr 185 | "Os mesmos temas voltam em posições mais difíceis: cálculo longo, conversão refinada, repertório de abertura e finais avançados. Detalhes por semana chegam ao se aproximar." |
| diag 42 | "Espetos têm sido difíceis de ver a tempo." |
| diag 46 | "Descobertas têm surpreendido." |

### Lote 6 — UI (.tsx) estados vazios e labels
| arquivo:linha | depois |
|------|--------|
| Today.tsx:184 | "Sem plano para hoje. Posso montar um agora com base no seu perfil." |
| Config.tsx:179 | "Só dados públicos, sem login. Diagnóstico atualiza na tela Hoje." |
| Onboarding.tsx:162 | "Informe onde você joga para eu buscar suas partidas. Não joga online? Deixe em branco e continue — eu faço algumas perguntas para calibrar." |
| Progress.tsx:100 | "Sem treinos. A primeira sessão ativa este painel." |
| Progress.tsx:131 | "Sem placar por tema. Conclua blocos de puzzle e use \"Conferir puzzles\"." |
| PendingReviewCard.tsx:34 | "Nenhuma revisão vence hoje. Pendências em ordem." |
| SessionMilestonesCard.tsx:131 | (corta "previstas" — o rótulo "Meta"/sessões já diz) |

---

## 3. RISCOS — não cortar (ou cortar só com teste)

- **Welcome.tsx:28** (apresentação do Professor Tavarez) — define a voz; encurtar
  achata o ritmo. **Manter intacto.**
- **PlanBlockCard.tsx:119 "Boa!"** — celebração mínima; nada a cortar.
- **diagnosis.ts (cláusulas "Antes de mover/calcular…")** — a 2ª cláusula é o
  remédio pedagógico; cortar deixa só o problema. **Manter as duas cláusulas.**
- **dayCompletionSummary.ts:52-56** — concatena `feito/feitos` + `${skippedPart}` +
  plural; qualquer corte exige rodar os testes desse módulo.
- **"sem promessa de rating"** — ressalva ética; aparece em learningPlanProposal:65
  **e** sessionMilestones:437. Manter pelo menos uma íntegra.

---

## 4. Fora de escopo (decisão do maestro)

- **Listas de rótulos de tema duplicadas** em `weaknessTitles.ts`,
  `formatWeakness.ts`, `diagnosis.ts:164-183`, `curriculum.ts`, `diplomas.ts`.
  Parece redundância, **mas é intencional**: variantes longa (`princípios de
  abertura`, `gestão de tempo`) vs. compacta (`abertura`, `tempo`) para contextos
  de UI diferentes. **Não unificar nesta passada** (seria refactor de código, não
  enxugamento de copy, e tem risco de regressão de label).

---

## 5. Execução proposta (após aprovação)

- **Dono único:** subagente Haiku 4.5 (substituição mecânica de string), 1 lote =
  1 arquivo = 1 commit atômico. Maestro revisa só os itens [RISCO].
- **Gate por lote:** `npm run lint && npm run test && npm run build` depois de cada
  arquivo; flake → rerun automático. Sem deploy nesta fase.
- **Ordem:** Lotes 1→6 (coach/ primeiro, maior retorno).
- **Aceite binário:** todos os gates verdes + textos [RISCO] inalterados ou com
  teste passando.

---

## 6. Decisão pedida ao Juka

1. Aprovar **todos os 6 lotes** como acima, ou
2. Aprovar um **subconjunto** (ex.: só coach/ — Lotes 1-4), ou
3. Ajustar alguma reescrita específica antes de aplicar.

Confirme e eu executo a fase inteira (Haiku aplica + gates), entregando um único
diff/relatório ao final — sem pausas no meio.
