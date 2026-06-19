Agora tenho domínio completo do código. Segue a revisão.

---

# Revisão do Council — Fase 6 + Fase 5b

## 1. Resumo

O plano propõe: (Fase 6) destravar `computeMastery` (hoje código morto em `generatePlan`) e promover `profile.band` ao passar diplomas — atacando o bug estrutural de banda estática desde o placement; (Fase 5b) adicionar cooldown de tema, dedup de replay e fallback de transferência sem fraqueza secundária.

**Avaliação geral:** Fase 6 é necessária e bem dimensionada. Fase 5b tem um item de alto valor (dedup de replay), um de valor médio (fallback de transferência) e um de valor duvidoso para beta pessoal (cooldown). Há 3 lacunas HIGH que precisam de definição antes de codar.

---

## 2. Pontos Fortes

- **Coragem de ativar código morto.** `computeMastery` existe, tem testes, é usado em `useTrainingActions` para pendências, mas está completamente ausente de `generatePlan`. Ativá-lo fecha um gap de design.
- **Promoção sóbe, não desce.** Evitar yo-yo de banda é a decisão certa para um tutor pessoal. Rebaixamento automático sem intervenção humana quebraria confiança.
- **Gate de TDD + coverage 5×.** Manter os thresholds existentes (78 lines / 85 funcs / 72 branches) como piso é disciplina correta para uma mudança no núcleo.
- **Reuso de estética.** "Você avançou de fase" sobre o pergaminho existente é sóbrio e evita criar nova superfície de UI.

---

## 3. Riscos e Lacunas

### HIGH

**H1 — Mecanismo de promoção de banda não especificado.** `generatePlan` é função pura: recebe `LearnerProfile` (imutável), devolve `DailyPlan`. O plano diz "promover `profile.band`" mas não diz **onde** isso acontece. Opções:

- Dentro de `generatePlan`: exigiria que a função retornasse `{ plan, newBand? }` ou mutasse o perfil — quebra o contrato atual de query.
- Na camada de app (React/state): `generatePlan` roda, depois o app verifica `isDiplomaPassed` e atualiza `profile.band`. É o caminho mais limpo, mas o plano não o declara.
- No persistence layer: ao salvar feedback que completa a última seção do diploma, o reducer de perfil já promoveria. Requer que o reducer tenha acesso a `DIPLOMAS` + `isDiplomaPassed`.

**Decisão pendente: sem definição, o implementador vai escolher um caminho arbitrário.**

**H2 — Descasamento de faixas não tem solução única.** O plano pergunta "Peão → 400-800 ou 800-1000?" mas a pergunta é mais funda. As bandas dos diplomas (`0-600`, `600-1000`, `1000-1200`) não alinham com as 7 bandas do learner (`0-400`, `400-800`, `800-1000`, ...). Um aluno na banda `400-800` está parcialmente dentro de Peão (0-600) e parcialmente fora. Se ele passar Peão estando em `400-800`, pular para `800-1000` é um salto de 1 banda; se ele estiver em `0-400`, pular para `800-1000` é um salto de 2 bandas — perdendo todos os recursos da faixa `400-800`. O mapa ingênuo "diploma X → banda Y" ignora que o aluno pode estar em bandas diferentes quando passa o mesmo diploma.

Agravante: `resourceSelector.fitsBand()` filtra recursos pela banda do perfil (linha 242 de `resourceSelector.ts`). Se o aluno é promovido cedo demais, **todos os recursos filtrados mudam de uma vez** — a dificuldade sobe em todas as frentes simultaneamente (tema, aquecimento, final, revisão).

**H3 — `computeMastery` nos blocos normais está indefinido.** Hoje `masteryTarget` só existe em `createPendingPlanBlock` (linha 230: `masteryTarget: 'review'`). Blocos normais (`createPlanBlock`) **não têm o campo** (fica `undefined`). O plano diz "substituir o `masteryTarget='review'` hardcoded por `computeMastery(...)` para o tema do dia". Mas:

- Se for só nos blocos de pendência, o impacto é mínimo (já existe `masteryTargetFromCompletedLog` em `useTrainingActions` que faz isso fora do `generatePlan`).
- Se for nos blocos normais também, o que `masteryTarget` significa ali? O `resourceStage` já controla a progressão `explain → guided → retrieval → transfer` via `getThemeResourceStage`. O `masteryTarget` seria uma segunda dimensão de controle — como interage com o `resourceStage`? O plano menciona "advance libera retrieval/transfer" mas `resourceStage` já faz isso. Precisam ser orquestrados, ou vai haver dois sistemas competindo pela mesma decisão.

### MEDIUM

**M1 — Oscilação de `computeMastery` com poucos puzzles.** `computeMastery` usa `accuracyPercent >= 80` para `advance` e `>= 50` para `review`. Com `minVolumeReached` = 3 tentativas, 3 puzzles definem o destino. Se o aluno faz 3 puzzles de garfo e acerta 2 (66%), fica em `review`. Se amanhã fizer 3 e acertar 3 (100%), salta para `advance`. Um dia ruim (1/3 = 33%) derruba para `regress`. A janela de `recentFeedbacks.slice(-2)` mitiga parcialmente (um `hard` bloqueia `advance`), mas não impede oscilação entre `review` ↔ `regress` em dias alternados.

**M2 — Ordem de implementação: 5b antes de 6 gera retrabalho.** Ambos tocam `generatePlan`. A Fase 6 mexe em 1 ponto (adicionar chamada de `computeMastery` + verificação de diploma→banda). A Fase 5b adiciona 3 sistemas novos (cooldown de tema, dedup de replay, fallback de transferência) que precisam de estado entre sessões. Implementar 5b primeiro significa escrever lógica de cooldown que depois precisa coexistir com `computeMastery`. O inverso (6 primeiro) é mais seguro: `computeMastery` ativado é uma dimensão a menos de surpresa quando o cooldown entrar.

**M3 — Conflito mastery × cooldown sem regra de precedência.** Se `computeMastery` diz `advance` para o tema X, mas o cooldown bloqueia X porque foi usado ontem, quem ganha? Se cooldown ganha, o sistema suprime um tema que o aluno está dominando — contraproducente. Se mastery ganha, o cooldown só serve para temas em `review`, que é a maioria dos casos. A resposta impacta o design: se mastery sempre vence, o cooldown pode ser implementado como filtro pós-mastery (só aplica quando mastery ≠ advance).

**M4 — Estado de cooldown entre sessões não tem persistência definida.** O cooldown proposto ("não repetir tema em dias consecutivos") exige memória do tema de ontem. Hoje `generatePlan` recebe `previousPlan?: DailyPlan`, que cobre o plano anterior. Mas "dias consecutivos" ≠ "sessões consecutivas" — se o aluno fizer 2 sessões no mesmo dia, o cooldown deveria contar o tema da última sessão do dia anterior, não da sessão imediatamente anterior. Quem persiste essa informação? O `previousPlan` só tem o último plano, não um histórico de temas por dia.

### LOW

**L1 — Sem diploma após Rei (banda 1200-1600).** Após passar o Diploma do Rei, o aluno é promovido a `1200-1600` e... nunca mais sobe. As bandas `1600-2000` e `2000-2200` nunca são alcançáveis. Para um beta pessoal, é aceitável (levaria meses/anos). Mas o design fecha uma porta sem declarar.

**L2 — Recurso de menor acerto para transferência pode ser frágil.** O fallback proposto ("bloco de transferência vira replay do recurso de menor acerto") depende de `recentThemeStats` ter dados de acurácia por recurso. Hoje `PuzzleThemeStat` tem `attempts` e `losses` por tema, não por recurso individual. Implementar isso exigiria ou estender o schema de `themeStats` ou criar um novo mecanismo de rastreamento — esforço desproporcional ao benefício.

**L3 — `hard` + `computeMastery='advance'` pode surpreender.** O plano menciona que se `computeMastery='advance'`, o tema sai do lock mesmo com feedback `hard`. Mas `computeMastery` já bloqueia `advance` se `recentFeedbacks.slice(-2).includes('hard')` (linha 20 de `mastery.ts`). Então um `hard` no bloco atual impede `advance` — não há contradição. O que acontece é: o aluno clicou `hard`, `computeMastery` retorna `review` ou `regress`, o tema **não** sai do lock. O plano parece assumir o oposto.

---

## 4. Sugestões Concretas

### Para H1 (mecanismo de promoção)

Definir como **promoção pós-`generatePlan` na camada de app**:

```
1. generatePlan() roda normalmente
2. App verifica: isDiplomaPassed(attempts, diplomaForBand(profile.band))
3. Se true e profile.band < targetBand: atualiza profile.band = targetBand
4. A banda nova só afeta o PRÓXIMO plano (não o atual)
```

Implementar `diplomaForBand(band)` como:

```ts
function diplomaForBand(band: LearnerBand): DiplomaId {
  if (band === '0-400' || band === '400-800') return 'peao';
  if (band === '800-1000') return 'torre';
  if (band === '1000-1200') return 'rei';
  // bandas 1200+ → sem diploma (L1)
  throw new Error(`No diploma for band ${band}`);
}
```

E `targetBandForDiploma(diploma)` para definir as transições (ver H2).

### Para H2 (mapa diploma→banda)

Recomendo **2 fases dentro de cada diploma** (usa 2 bandas do learner por diploma):

| Diploma | Bandas de trabalho | Banda alvo ao passar |
|---------|-------------------|----------------------|
| Peão    | 0-400, 400-800    | 800-1000             |
| Torre   | 800-1000           | 1000-1200            |
| Rei     | 1000-1200          | 1200-1600            |

Justificativa: Peão cobre material 0-600. O aluno pratica em 0-400 e 400-800 (os recursos de ambas as bandas estão dentro do escopo do diploma). Ao passar, ele já dominou material até ~800 — pular para 800-1000 é progressão natural, sem salto. Torre cobre 600-1000: o aluno pratica em 800-1000, passa, vai para 1000-1200. Alinhamento limpo.

Peão → 800-1000 (não 400-800) porque: o aluno já viu recursos de 400-800 durante a preparação do Peão (que cobre 0-600, e as seções puxam recursos de múltiplas bandas). Promover para 400-800 seria repetir material.

### Para H3 (computeMastery nos blocos normais)

**Fase 6 deve focar apenas nos blocos de pendência** (onde `masteryTarget` já existe), porque:

1. É o caminho de menor risco — mexe onde o campo já está definido.
2. Blocos normais já têm `resourceStage` governado por `getThemeResourceStage` (feedback `easy`/`good`/`hard` → `explain`/`guided`/`retrieval`/`transfer`). Adicionar `masteryTarget` como segunda dimensão exige definir semântica de composição (quem ganha se `resourceStage=transfer` mas `masteryTarget=regress`?).
3. A ativação nos blocos de pendência resolve o leftover 8.2 ("difícil reavalia após N acertos") que o plano menciona.

Se quiserem estender para blocos normais, façam em fase separada (6b) com spec de composição `resourceStage × masteryTarget`.

### Para M1 (oscilação)

Adicionar histerese simples: exigir 2 sessões consecutivas acima do threshold para `advance`, e 2 sessões consecutivas abaixo para `regress`. Alternativa mais leve: usar média móvel das últimas 3 sessões em vez da acurácia de 1 sessão. Isso já está parcialmente coberto pelo `recentFeedbacks` atual, mas o `accuracyPercent` do Lichess é cumulativo (total de acertos/total de tentativas no tema), não por sessão — então ele naturalmente suaviza conforme o volume cresce. **Para um beta pessoal, a oscilação é aceitável** — o aluno percebe como "o sistema está reagindo ao meu desempenho", o que é pedagogicamente melhor que uma banda estática.

### Para M3 (conflito mastery × cooldown)

Regra de precedência: **mastery vence**. Se `computeMastery` retorna `advance`, o cooldown não se aplica. Se retorna `review`, o cooldown bloqueia temas repetidos em dias consecutivos. Se retorna `regress`, o cooldown também não se aplica (o aluno precisa praticar o tema que está regredindo). Implementar como:

```ts
if (masteryResult === 'review' && cooldownActive(tema, ultimoDia)) {
  // pula para o próximo tema
}
```

### Para Fase 5b — escopo sugerido

**Manter:** dedup de replay (alto valor, implementação simples: comparar `destination.url` com sessão anterior).

**Cortar ou adiar:** cooldown de tema (baixo valor para beta com 1 sessão/dia; a penalidade de -900 já cobre 80% dos casos).

**Reavaliar:** fallback de transferência sem fraqueza secundária. A implementação atual já funciona com 1 fraqueza (o bloco de transferência usa a primária). O problema que o plano tenta resolver — "não repetir o tema primário" — é melhor atacado pelo dedup de replay do que por um fallback complexo que exige rastreamento de acurácia por recurso (ver L2).

---

## 5. Risco Geral: **MEDIUM**

A Fase 6 é de **risco BAIXO** se escopo for mantido restrito (só pendências + promoção por diploma). A Fase 5b completa é de **risco ALTO** (3 sistemas novos com estado entre sessões). O aggregate é MEDIUM porque a Fase 6 puxa para baixo e a 5b pode ser cortada.

O maior risco não é técnico — é de **escopo**: tentar ativar `computeMastery` em todos os blocos + cooldown + dedup + fallback de uma vez. Isso mexe em 4 dimensões do `generatePlan` simultaneamente, dificultando isolar regressões.

---

## 6. Respostas às 5 Perguntas Abertas

### 1. Mapa diploma→banda com o descasamento de faixas

Ver sugestão H2 acima. Recomendação final:

| Diploma | Trabalha nas bandas | Promove para |
|---------|---------------------|--------------|
| Peão    | 0-400, 400-800      | **800-1000**  |
| Torre   | 800-1000             | **1000-1200** |
| Rei     | 1000-1200            | **1200-1600** |

Peão → 800-1000 (não 400-800). O aluno que passa Peão já demonstrou domínio de material 0-600, que cobre parcialmente a banda 400-800. Promover para 400-800 seria redundante. Promover para 800-1000 é um degrau, não um salto.

### 2. Risco de oscilação de `computeMastery`

Existe, mas é **aceitável para beta**. O `accuracyPercent` do Lichess é cumulativo (total de acertos / total de tentativas no tema), não por sessão. Conforme o aluno acumula tentativas (10, 20, 50+), a acurácia converge e para de oscilar. O `recentFeedbacks.slice(-2).includes('hard')` já bloqueia `advance` quando o aluno acerta por sorte. Se quiserem blindar mais, sugiro threshold de `minVolumeReached` subir de 3 para 5 (linha 46 de `mastery.ts`), mas não é bloqueante.

### 3. Ordem segura: 5b antes de 6, ou 6 primeiro?

**Fase 6 primeiro.** Motivos:
- Ativa código morto (menos linhas novas, mais valor por linha).
- Não adiciona estado novo entre sessões (só lê `profile.band` existente).
- Prepara o terreno: com `computeMastery` vivo, o cooldown da Fase 5b já sabe quando NÃO deve bloquear (quando mastery=advance).
- Fase 6 implementada → Fase 5b pode ser cortada ou reduzida sem prejuízo. O inverso não é verdade.

### 4. Conflito `computeMastery` + cooldown + estágio

**Mastery vence.** Regra:

| masteryResult | Cooldown? | ResourceStage |
|---------------|-----------|---------------|
| `advance`     | ignorado  | sobe 1 nível  |
| `review`      | aplicado  | mantém        |
| `regress`     | ignorado  | recua         |

Quando mastery diz `advance`, o aluno está indo bem — bloquear com cooldown é contraproducente. Quando diz `regress`, o aluno precisa praticar — cooldown seria prejudicial. Cooldown só faz sentido em `review` (estabilidade), evitando tédio sem sacrificar necessidade pedagógica.

O resourceStage continua governado por `getThemeResourceStage` (feedback `easy`/`good`/`hard`), ortogonal ao `masteryTarget`. Não há conflito porque operam em dimensões diferentes: `masteryTarget` afeta espaçamento de pendências e elegibilidade de progressão; `resourceStage` afeta qual recurso é selecionado dentro do tema.

### 5. Algo é over-engineering para beta pessoal?

**Sim. O cooldown de tema é over-engineering.** Para um usuário único fazendo ~1 sessão/dia, a penalidade de -900 em `resourceSelector` (linha 124) já evita repetição na prática. O cooldown adiciona:
- Estado novo (tema do dia anterior) a ser persistido
- Complexidade de "dias consecutivos" vs "sessões consecutivas" (ver M4)
- Conflito com `computeMastery` que exige regra de precedência
- Testes para todos os casos de borda (virada de dia, múltiplas sessões/dia, etc.)

**Recomendação:** Cortar cooldown da Fase 5b. Manter dedup de replay (simples: compara `destination.url` com último replay). O fallback de transferência pode ser simplificado: em vez de "recurso de menor acerto", usar a fraqueza primária com stage reduzido (`guided` em vez de `transfer`). Isso resolve a monotonia sem precisar de dados de acurácia por recurso.

Com esse corte, a Fase 5b vira **uma tarefa de 2 alterações pontuais em `generatePlan`**, reduzindo o risco de MEDIUM para LOW e eliminando a pergunta 4 (conflito) por completo.
