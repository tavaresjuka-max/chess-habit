# Abordagem para revisão do council — Fase 6 (progressão de banda + computeMastery) e Fase 5b (anti-repetição)

Contexto: PWA de treino de xadrez (Professor Lemos), local-first. O dono aprovou implementar **progressão de banda completa agora** (era "fora de escopo"). Pediu conselho do council antes de codar, por ser a mudança mais arriscada (muda o núcleo do `generatePlan`). Critique: casos de borda, ordem de dependências, over-engineering, risco pedagógico, e se a abordagem atinge o objetivo. Marque cada achado HIGH/MEDIUM/LOW.

## Estado atual (verificado no código)

- `profile.band` é definido no placement e **nunca muda** depois. As 7 bandas (`bands.ts`): `0-400, 400-800, 800-1000, 1000-1200, 1200-1600, 1600-2000, 2000-2200`. Regra do projeto: banda é sequenciamento INTERNO, **nunca promessa de rating na UI**.
- `computeMastery` (`mastery.ts`) devolve `advance | review | regress` a partir de acurácia + último feedback + volume mínimo. **Está morto** (definido, nunca chamado em `generatePlan`). O `masteryTarget` do plano é `'review'` hardcoded.
- Diplomas (`diplomas.ts`): 3 diplomas com bandas próprias `Peão (0-600)`, `Torre (600-1000)`, `Rei (1000-1200)` e thresholds 90/80/75%. `isDiplomaPassed` confirma todas as seções. Hoje os diplomas aparecem na UI mas **não promovem** de banda.
- **Descasamento**: bandas dos diplomas (`0-600`, `600-1000`) ≠ as 7 bandas (`0-400`, `400-800`, `800-1000`). Mapear diploma→próxima banda exige cuidado.
- Seleção de recurso já filtra por banda (`resourceSelector`), então a banda controla a dificuldade real das lições.

## Abordagem proposta — Fase 6

1. **Promoção por diploma (gatilho conservador, sem yo-yo):** ao passar o diploma da fase atual (`isDiplomaPassed`), promover `profile.band` para a próxima banda da sequência das 7. Mapa explícito diploma→banda-alvo: Peão→`800-1000`(?), Torre→`1000-1200`, Rei→`1200-1600`. (Pergunta ao council: o alvo do Peão deve ser `400-800` ou `800-1000`? O descasamento de faixas precisa de uma decisão.)
2. **Ativar `computeMastery` no plano:** substituir o `masteryTarget='review'` hardcoded por `computeMastery(...)` para o tema do dia, derivado da acurácia recente (themeStats) + último feedback. Resultado guia o estágio/alvo: `advance` libera retrieval/transfer; `review` mantém; `regress` recua para explain. Isso também resolve o leftover da 8.2 ("difícil reavalia após N acertos"): `hard` recua para explain, mas se `computeMastery='advance'` o tema sai do lock.
3. **Sem rebaixamento automático de banda** (só mastery dentro da banda regula dificuldade). Banda só sobe, via diploma. Evita yo-yo e frustração.
4. **UI sóbria:** "Você avançou de fase" sem número de rating. Reusa a estética de diploma/pergaminho (Frente A).
5. **Gates:** TDD primeiro; `coverage` 5× verde; sem regressão dos thresholds.

## Abordagem proposta — Fase 5b (anti-repetição)

- **Transferência sem fraqueza secundária:** quando só há 1 fraqueza, o bloco de transferência vira **replay do recurso de menor acerto** (em vez de repetir o tema primário). Reusa o replay já existente.
- **Cooldown de tema:** não repetir o mesmo tema em dias consecutivos, **exceto** se houve erro de peça nesse tema nos últimos N jogos (mantém proteção sem suprimir fraqueza real).
- **Dedup de replay:** não escolher o mesmo replay em sessões consecutivas.

## Perguntas abertas ao council

1. Mapa diploma→banda com o descasamento de faixas: qual alvo para cada diploma?
2. `computeMastery` ativado no plano: risco de oscilação dia-a-dia (acurácia volátil com poucos puzzles)? Precisa de janela/suavização?
3. Ordem segura: 5b antes de 6, ou 6 primeiro (ambos tocam `generatePlan`)?
4. `computeMastery` + cooldown + estágio podem entrar em conflito (ex.: mastery diz advance mas cooldown bloqueia o tema)? Quem ganha?
5. Algo aqui é over-engineering para um beta pessoal?
