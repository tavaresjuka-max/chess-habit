# SPEC — Scheduler híbrido bloco→intercalado de temas

**Data:** 2026-06-22 · **Status:** rascunho (aguarda aprovação para implementar)
**Origem:** pergunta do dono ("é certo o mesmo tema a semana toda?") + council DIVERGIR
(DeepSeek V4 Pro + GLM 5.2, convergência forte). Decisão de produto validada.

---

## 1. Problema

O plano diário é **blocado puro**: um único tema (ex.: `blunder-rate`) ocupa
aquecimento, tema e revisão; só a transferência toca um tema secundário. O mesmo
tema persiste ~18-30h (semanas), avançando estágios `explain → guided → retrieval
→ transfer` por feedback, e só troca quando o sinal de fraqueza muda ou chega em
`transfer`.

**Defeito (council unânime):**
1. **Bloca tempo demais** → *massed practice* → **ilusão de domínio** (acerto sobe
   porque o contexto entrega o tema) + habituação/queda dopaminérgica no TDAH.
2. **Zero intercalação** após a aquisição → não treina **discriminação** (saber
   qual padrão aplicar sem rótulo), que é a habilidade da partida real.
3. **"Transferência" mal definida** → hoje é transferência *com rótulo* (dentro do
   bloco), não detecção *sem rótulo*.

**O que NÃO mudar (refutação do council):** não generalizar interleaving cru —
ele vale para *discriminar categorias já aprendidas*, não para *aquisição inicial*
de novato TDAH (carga cognitiva / reversão de expertise / working memory). **Massa
ganha na aquisição; intercalação ganha na retenção/transferência.** Logo: bloco na
aquisição, intercalação só depois do esquema formado.

---

## 2. Decisões fechadas (design)

### D1 — Gate de intercalação por ESTÁGIO (reusa a máquina existente)
- **Aquisição** = `themeStage ∈ {explain, guided}` → **bloco puro** (sem pool).
- **Pós-aquisição** = `themeStage ∈ {retrieval, transfer}` → **intercalação ligada**.
- Reusa `THEME_STAGE_ORDER` (generatePlan.ts:445), `advanceThemeStage` (452-462),
  `getThemeResourceStage` (464-486) e `profile.themeStages[tag]` (persistência PED-3).
- Sem teto de horas arbitrário: o avanço de estágio (dirigido por feedback) é o gate.

### D2 — Mapeamento por bloco (quando estágio ∈ {retrieval, transfer})
| Bloco (sufixo do id) | Aquisição (explain/guided) | Pós-aquisição (retrieval/transfer) |
|---|---|---|
| `-aquecimento` | tema âncora (inalterado) | **tema âncora** (inalterado — scaffold TDAH) |
| `-tema` | tema âncora, estágio atual | tema âncora, estágio atual (inalterado) |
| `-revisao` | tema âncora | **1 tema do POOL** (recuperação espaçada) |
| `-transferencia` | (não aparece até retrieval) | **detecção SEM rótulo**: âncora + pool misturados |
| `-final` | final por banda (inalterado) | inalterado |

Resultado em nível de sessão ≈ **70% âncora / 30% pool** (não-aleatório).

### D3 — Pool de rotação
- Composição: temas **graduados** (ver D4). Derivar de `profile.themeStages` onde
  `stage === 'transfer'` + flag de graduação, ou novo campo `profile.graduatedThemes`.
- Seleção: **determinística e espaçada** — *least-recently-reviewed first*.
- Teto **≤ 2 temas distintos de pool por sessão** (protege working memory TDAH).

### D4 — Critério de graduação do tema âncora
- Gradua quando `stage === 'transfer'` **E** acurácia ≥ limiar da banda (reusar o
  limiar já calibrado, ~0.55-0.6 iniciante) sobre **≥ 30 puzzles** (alinha com o
  gate de diploma 80%/30).
- Ao graduar: sai de primário → entra no pool → `selectPrimaryWeakness` escolhe o
  próximo tema.
- **Teto rígido anti-trava:** se um tema for primário por **> 12 sessões** sem
  graduar, força rotação (e marca para reduzir dificuldade). Evita o lock de semanas.

### D5 — GUARDA DO SINAL DIAGNÓSTICO (crítica — achado GLM)
Hoje `buildPuzzleThemeStats(nextTrainingLogs)` (useTrainingActions.ts:178) agrega
**todos** os logs e alimenta o fallback de `selectPrimaryWeakness` (generatePlan.ts:
631-650). Sem guarda, puzzles de pool no `-revisao`/`-transferencia` fariam um tema
antigo re-disparar como primário → **ping-pong**.
- **Regra:** a agregação que alimenta `selectPrimaryWeakness` conta **somente**
  blocos de coleta — `-tema` e `-aquecimento` — e sinais de partida. **Exclui**
  resultados de pool em `-revisao`/`-transferencia`.
- Implementação: filtrar por tipo de bloco (sufixo do `blockId`) ao construir o
  `recentThemeStats` usado no plano, **ou** marcar o log com um campo de tipo
  (`TrainingLog.blockKind` / `diagnostic: boolean`).

### D6 — Métrica de discriminação (novo dado; UI fica fora de escopo)
- Rastrear separadamente a acurácia na detecção sem rótulo (`-transferencia` misto).
- É o KPI real de transferência. Persistir o dado agora; exibir no Progresso depois.

---

## 3. Non-goals

- Não alterar o conteúdo do currículo nem os temas em si (curriculum.ts).
- Não mexer na lógica de diploma nem no sync Lichess.
- Não construir UI nova nesta fase (só dados; Progresso vem depois).
- Não intercalar durante a aquisição (explain/guided) — proibido por D1.
- Não usar seleção aleatória de pool (D3 exige determinística/espaçada).

---

## 4. Critérios de aceite (binários, testáveis)

- **AC1** Com `themeStages[primary] ∈ {explain, guided}`: `-revisao` e
  `-transferencia` usam SÓ o tema primário (pool vazio no plano).
- **AC2** Com `themeStages[primary] ∈ {retrieval, transfer}` e pool não-vazio:
  `-revisao` usa um tema de pool ≠ primário; `-transferencia` mistura âncora+pool.
- **AC3** Seleção de pool é determinística (least-recently-reviewed), ≤ 2 temas
  não-âncora por sessão.
- **AC4 (ping-pong guard)** Erros de um tema de pool em `-revisao`/`-transferencia`
  **não** o tornam o primário do dia seguinte (D5).
- **AC5** Tema com `stage===transfer` + acurácia ≥ limiar sobre ≥ 30 puzzles
  gradua: sai de primário, entra no pool, próximo primário é escolhido.
- **AC6** Tema primário há > 12 sessões sem graduar força rotação.
- **AC7** `-aquecimento` permanece âncora em qualquer estágio.
- **Gates:** 748 testes atuais continuam verdes + novos testes de AC1-AC7; lint 0;
  build ok.

---

## 5. Parâmetros (constantes ajustáveis)

```
ACQUISITION_STAGES   = ['explain', 'guided']
INTERLEAVE_STAGES    = ['retrieval', 'transfer']
POOL_MAX_PER_SESSION = 2
GRADUATION_MIN_PUZZLES = 30
GRADUATION_ACCURACY  = <limiar da banda já existente>
PRIMARY_SESSION_CEILING = 12
```

---

## 6. Pontos de implementação (mapa do código)

- `src/domain/plan/generatePlan.ts` — construção dos blocos (`-tema`:152,
  `-transferencia`:334 usa `secondaryWeakness`), `selectPrimaryWeakness` (620-660),
  estágios (445-486). Onde D1/D2/D3/D4 entram.
- `src/app/useTrainingActions.ts:178` — `buildPuzzleThemeStats(nextTrainingLogs)`:
  onde D5 (guarda do sinal) é aplicada.
- `src/domain/coach/puzzleThemeStats.ts:90-115` — `puzzleThemeToWeaknessTag`
  (fonte única tema→fraqueza); D6 pode reusar.
- `src/domain/weakness/*` + `src/app/state.ts` — `profile.themeStages`,
  possível novo `graduatedThemes` / `blockKind`.
- Tabela de tipos: `TrainingLog` (types.ts:248-260) — possível campo de tipo de bloco.

---

## 7. Riscos e mitigação

- **Sobrecarga cognitiva / queda de desempenho de curto prazo** (dificuldade
  desejável vira indesejável no TDAH) → mitigado por D1 (intercalar só pós-esquema)
  + D3 (teto de 2, não-aleatório) + `-aquecimento` âncora (D2).
- **Ping-pong de tema** → D5.
- **Trava de semanas num tema** → D4 (teto de 12 sessões).
- **Complexidade de curadoria** → começar com pool derivado de `themeStages`
  (sem nova store), seleção espaçada simples.
- **Sinal diagnóstico poluído** → D5 (filtro por tipo de bloco) é pré-requisito;
  sem ele, NÃO ligar a intercalação.

---

## 8. Plano de execução sugerido (fase única)

1. D5 primeiro (guarda do sinal) — pré-requisito de segurança.
2. D1+D2 (gate por estágio + mapeamento de blocos).
3. D3+D4 (pool + graduação + teto).
4. D6 (dado de discriminação; sem UI).
5. Testes AC1-AC7 + gates. 1 dono na escrita (Sonnet/GLM guiado por este SPEC);
   maestro revisa risco (D5 e troca de tema). Sem deploy até gates verdes.
