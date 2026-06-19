# Cross-AI Review
_gerado por ai-council.sh em 2026-06-19 16:02_

## Revisor: openai/gpt-5.5-pro

_(sem resposta — modelo falhou ou sem credito)_

---

## Revisor: deepseek/deepseek-v4-pro

# Revisão Técnica Independente — Fase 6 + Fase 5b

## 1. Resumo

O plano propõe ativar dois sistemas que tocam o núcleo de `generatePlan`: progressão de banda via diploma (promoção única, sem rebaixamento) e `computeMastery` dinâmico (substituindo o `'review'` hardcoded), mais medidas anti-repetição (cooldown, dedup de replay, transferência sem fraqueza secundária). O diagnóstico do estado atual é sólido e identifica corretamente os pontos mortos e o descasamento de faixas. Porém, três questões centrais estão sem resposta — o mapa diploma→banda, a precedência entre mastery/cooldown/estágio e a ordem de implementação das fases — e codar sem decidí-las primeiro introduz risco de retrabalho significativo no coração do plano de treino.

## 2. Pontos Fortes

- **Diagnóstico preciso.** Identifica que `computeMastery` está morto (nunca chamado), que `masteryTarget` é hardcoded e que as bandas dos diplomas não casam com as 7 bandas do sistema. Isso evita ilusões sobre o estado real do código.
- **Gatilho conservador de promoção.** Subir banda só por diploma (e nunca por acurácia ou tempo) é uma decisão pedagógica defensável: evita yo-yo, evita frustração e mantém o controle no jogador (ele sabe que precisa "passar" algo concreto).
- **Sem rebaixamento automático de banda.** Consistente com o princípio "banda só sobe". Bom para moral do usuário. O rebaixamento fica delegado ao `computeMastery` dentro da banda — separação correta de responsabilidades.
- **Perguntas abertas explícitas.** O texto não finge que as lacunas não existem. Listar as 5 perguntas ao council é transparência útil antes de codar.
- **UI sóbria sem rating.** Alinhado com a regra do projeto ("banda é sequenciamento interno, nunca promessa de rating").

## 3. Riscos e Lacunas

### HIGH

1. **Mapa diploma→banda indefinido (pergunta #1).** O descasamento entre as faixas dos diplomas (`0-600`, `600-1000`, `1000-1200`) e as 7 bandas (`0-400`, `400-800`, `800-1000`, `1000-1200`, `1200-1600`, `1600-2000`, `2000-2200`) não é um detalhe — é uma decisão de design que afeta o pacing inteiro do treino. Se Peão→`400-800`, o jogador sobe 1 banda; se Peão→`800-1000`, sobe 2 de uma vez, saltando `400-800`. O plano não fornece critério de decisão. **Sem isso resolvido, a Fase 6 não pode começar.**

2. **Conflito mastery × cooldown × estágio sem regra de precedência (pergunta #4).** Três sistemas distintos podem dar ordens conflitantes sobre o mesmo tema no mesmo dia: `computeMastery` diz `advance`, cooldown bloqueia o tema, e o estágio (`explain/retrieval/transfer`) impõe restrições próprias. O plano pergunta "quem ganha?" mas não propõe resposta nem hierarquia. Sem uma regra de precedência explícita (ex.: segurança > mastery > cooldown), `generatePlan` produzirá comportamento não-determinístico entre execuções ou, pior, loop infinito se todas as opções forem bloqueadas.

3. **Ordem de fases não decidida (pergunta #3).** Ambas as fases tocam `generatePlan`. Se forem implementadas na ordem errada ou em paralelo sem coordenação, o merge será conflituoso e os testes de uma fase invalidarão os da outra. O plano delega a decisão ao council em vez de propor uma ordem com justificativa. Isso para a execução.

### MEDIUM

4. **Oscilação de `computeMastery` com poucos puzzles (pergunta #2).** Acurácia com N pequeno é estatisticamente ruidosa. Se um jogador faz 3 puzzles de um tema e erra 1, a acurácia cai de 100% para 67%, potencialmente disparando `regress` num dia e `advance` no seguinte. O plano reconhece o risco mas não propõe mecanismo de suavização (janela deslizante, média exponencial, threshold de volume mínimo antes de decidir). Sem isso, o plano diário será instável.

5. **`computeMastery` ativado sem validação prévia.** O código existe mas nunca foi exercitado em produção. Não se sabe se produz outputs razoáveis com dados reais, se o threshold de "volume mínimo" está calibrado, ou se o `último feedback` cobre os casos em que não há feedback nenhum (primeira sessão, tema novo). Ativar código morto diretamente no núcleo do plano sem uma fase de validação/backtesting é arriscado.

6. **Anti-repetição: esgotamento do pool de recursos.** O cooldown de tema + dedup de replay podem, combinados, esgotar as opções disponíveis se o jogador tem poucos temas ou poucos recursos por tema. O que acontece quando todos os temas estão em cooldown e todos os replays foram usados na sessão anterior? O plano não define fallback. Risco de plano vazio ou erro.

7. **Promoção sem rede de segurança.** Banda só sobe e nunca desce. Se um jogador for promovido prematuramente (ex.: passou o diploma com 75% raspando), enfrentará lições de banda superior sem base sólida e sem mecanismo de retorno. O "não rebaixamento" é uma decisão de produto válida, mas o plano deveria ao menos considerar um escape hatch manual (opção "voltar uma fase" escondida em settings) para evitar frustração sem quebrar a filosofia.

8. **Fase 5b e 6 não coordenam a fila de `generatePlan`.** Ambas inserem lógica nova no mesmo ponto (seleção de tema, seleção de recurso, alvo de estágio). Se `computeMastery` decide `advance` para o tema X, mas o anti-repetição bloqueia X porque foi usado ontem, e o fallback de transferência sem fraqueza secundária tenta o tema Y que também está em cooldown — a interação é combinatorial e não foi mapeada.

### LOW

9. **Estética de pergaminho reutilizada (UI).** Mencionada como "reusa a estética de diploma/pergaminho (Frente A)". É uma nota de rodapé, mas sugere escopo de UI que pode ser adiado — um toast simples já resolve "você avançou de fase" para o beta.

10. **Transferência sem fraqueza secundária: fallback dúbio.** Quando só há 1 fraqueza, o bloco de transferência usa "replay do recurso de menor acerto". Mas se o menor acerto for 90% (todas as acurácias altas), o replay é desnecessário — o jogador já domina. Um threshold mínimo de erro (ex.: acurácia < 70%) evitaria isso.

11. **Testes mencionados sem cenários concretos.** "TDD primeiro; coverage 5× verde" é genérico. O plano não lista os cenários de borda que os testes devem cobrir (conflito de precedência, pool vazio, oscilação, primeira sessão sem dados). Sem isso, o TDD cobrirá o caminho feliz e deixará os casos de borda descobertos.

## 4. Sugestões Concretas de Melhoria

### Imediatas (antes de codar qualquer fase)

1. **Decidir e documentar o mapa diploma→banda com justificativa pedagógica.** Proposta: Peão→`400-800`, Torre→`1000-1200`, Rei→`1200-1600`. Isso avança 1-2 bandas por diploma, respeitando o pacing. Documentar a decisão no spec. Não começar a Fase 6 sem isso.

2. **Definir hierarquia de precedência para conflitos em `generatePlan`.** Proposta:
   ```
   1. Segurança (nunca sugerir tema sem recurso disponível) — vence tudo
   2. Cooldown (evitar repetição, exceto se erro de peça recente) — bloqueia seleção
   3. computeMastery (advance/review/regress) — define estágio DENTRO do tema escolhido
   4. Dedup de replay — desempate entre recursos equivalentes
   ```
   Com fallback explícito: se todas as opções estão bloqueadas, relaxar cooldown do tema com maior intervalo desde a última aparição.

3. **Decidir ordem das fases: 6 primeiro, 5b depois.**
   Justificativa: a Fase 6 ativa `computeMastery` no núcleo e muda o `profile.band` (estado persistente). A Fase 5b adiciona restrições de seleção (cooldown, dedup). Fazer 6 primeiro estabelece a base; 5b refina a seleção sobre essa base. A ordem inversa criaria dependência reversa (5b implementaria lógica que 6 depois reestruturaria). Além disso, `computeMastery` é pré-requisito para o cooldown inteligente (se mastery diz `advance`, o cooldown pode ser relaxado).

### Durante a implementação

4. **Adicionar suavização ao `computeMastery` antes de ativá-lo.** Média móvel das últimas N sessões (ex.: N=3) para `advance` e `regress`, com threshold de volume mínimo (ex.: >= 5 puzzles no tema). Se volume insuficiente, manter `review`. Se não há dados (primeira sessão), default `review`.

5. **Validar `computeMastery` com dados reais antes de integrar.** Escrever um script de backtest que roda `computeMastery` sobre o histórico de `themeStats` de um perfil existente e inspecionar os outputs. Só integrar em `generatePlan` depois de confirmar que não há oscilação espúria.

6. **Adicionar fallback explícito para pool vazio no anti-repetição.** Se todos os temas estão em cooldown e todos os replays são duplicados: escolher o tema com cooldown mais antigo (menor penalidade) e o replay com menor acurácia (maior necessidade). Garantir que `generatePlan` nunca retorna plano vazio.

7. **Listar cenários de borda para TDD antes de codar.** Mínimo:
   - Jogador sem puzzles em nenhum tema (`computeMastery` sem dados)
   - Todos os temas em cooldown
   - Todos os replays duplicados
   - Diploma passado mas banda já é a máxima (Rei→fim da progressão)
   - Jogador pula diploma (ex.: acurácia alta em temas de banda superior sem ter passado o diploma)
   - Promoção de banda + cooldown no mesmo dia (a nova banda tem recursos diferentes — o cooldown deve resetar?)

### Pós-implementação

8. **Considerar escape hatch manual para downgrade de banda.** Uma opção escondida em Settings ("Reiniciar fase atual" ou "Voltar uma fase") que faz downgrade de 1 banda, resetando o diploma correspondente. Isso resolve a frustração de promoção prematura sem violar o princípio de "não rebaixamento automático".

9. **Threshold de acurácia para replay no fallback de transferência.** Só usar "recurso de menor acerto" se a acurácia for < 70%. Acima disso, pular o bloco de transferência (considerar domínio suficiente).

## 5. Risco Geral: **HIGH**

**Justificativa:** O plano identifica corretamente os componentes e as lacunas, mas empurra para o council 3 decisões bloqueantes (mapa de bandas, precedência de conflitos, ordem de fases) que são interdependentes e afetam o núcleo de `generatePlan`. Sem essas decisões tomadas e documentadas, qualquer implementação será frágil e sujeita a retrabalho. O risco não está na complexidade intrínseca dos sistemas (cada um é razoável isoladamente), mas na **combinação de 3 sistemas novos ativados simultaneamente sobre o mesmo ponto do código sem um modelo de arbitragem definido**. Some-se a isso `computeMastery` nunca exercitado em produção e a ausência de cenários de borda mapeados para TDD, e o resultado provável é um `generatePlan` que funciona no caminho feliz mas produz comportamento errático nas bordas — exatamente o pior tipo de regressão para um sistema de treino (o usuário não vê o bug, só sente que o plano "não faz sentido").

**Recomendação:** Não codar até que as perguntas #1, #3 e #4 tenham resposta documentada e aprovada pelo dono. Depois, implementar na ordem: validação de `computeMastery` → Fase 6 → Fase 5b, com TDD cobrindo os cenários de borda listados acima.

---

