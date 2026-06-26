# DESENHO — item#3: bridge tático + coaching/curadoria banda alta (1200-2200)

> **STATUS: DESENHO sintetizado de council DIVERGIR (DeepSeek V4 Pro EXIT=0 + GLM 5.2 EXIT=0,
> mesmo prompt, sem papéis). GATED atrás de E1-E4 — NÃO implementar agora.** Refina as Decisões #2
> (coaching+curadoria) e #4 (bridge p/ puzzles rotuladas) de [[beta-plan-council-2026-06-25]].
> Captura o council pra quando item#3 entrar na fila. NENHUMA decisão NOVA do dono é exigida — o
> desenho fica dentro da filosofia orquestradora; é refinamento, não pivô.

## Convergência dos dois (independentes) — a arquitetura de entrega
1. **NÃO construir engine — consumir a avaliação que já existe.** Lichess/Chess.com já anotam os
   jogos do aluno (blunder/mistake/inaccuracy + centipawns). O orquestrador EXTRAI a FEN do erro
   já rotulado; **nunca** gradua lance próprio. (Coerente com o non-goal "não virar motor".)
2. **Revisão espaçada SEM engine = reexpor o ERRO do próprio aluno**, não "resolva puzzle novo".
   Dia 0: posição + lance dele + lance melhor + UMA regra; o aluno escreve por que errou. No SRS:
   esconde e testa recall da regra + do lance melhor, auto-corrigido contra a anotação salva
   (Leitner sobre explicação autoral). Intervalos 1/3/7/30d. Zero engine, zero posição gerada.
3. **Fraqueza → NÓ de habilidade, não tag crua** (~20-40 nós estáveis; cada nó agrega várias
   tags; peso = sobreposição de temas). Dilui ruído de rotulagem single-tag. **Casa com o lever
   `catalogSkillNodes` que já existe** (REUSO, decisão #4).
4. **Falha como ground truth, não rótulo** (achado mais afiado do GLM): confie em clusters de
   puzzles que o aluno **falhou JUNTAS** (co-ocorrência de falha, observável via `puzzle:read`),
   não em tags que co-ocorrem como rótulo. Sobrevive a rotulagem errada. A puzzle rotulada (tem
   gabarito, a plataforma gradua) é o **substituto do engine** que dá nota objetiva.
5. **Modo "NÃO SEI / sem caminho curado" de primeira classe**, com gates de suporte/saturação/
   densidade-de-blunder. Princípio convergente: *o pior produto recomenda com confiança o que não
   funciona*. O modo "não sei" tem de ser tão robusto quanto o modo "roteie para X".

## A divergência ELEVADA (GLM) — confound de medição no próprio item#3
**Viés de seleção no corpus de jogos reais.** Aluno fraco em X evita aberturas/cadências que
chegam em X → X quase não aparece nos jogos → o diagnóstico fica CONFIANTE onde é cego e **omite
justamente a fraqueza mais cara** (quem evita finais nunca os atinge pra treinar). É invisível
(sem erro, sem alerta) e bate no pilar central "jogos reais". **Estruturalmente análogo ao
confound de adoção endógena que pré-bloqueou a eficácia (E).** "Jogo real sozinho é estimador da
fraqueza que o aluno NÃO evita, não da fraqueza real."
→ **Implicação de desenho (maestro):** item#3 NÃO pode ser só mineração de erro em jogo real;
precisa de um **complemento de exposição forçada** (puzzles deliberadas em fases/motivos
sub-representados) + um detector de sub-representação (distribuição de fase/motivo do aluno vs
baseline esperado). Sonda de hipótese (quando item#3 entrar): medir, num dump de jogos, se fases
evitadas têm sub-representação mensurável vs esperado. Executor = GLM ou extração read-only Haiku
(NÃO Sonnet — padrão de execução do dono).

GLM #2 secundário: a arquitetura **não fecha o loop de outcome** (roteia mas não observa se
ajudou; Practice/CC são caixa-preta; rating de puzzle é escalar global, não por fraqueza). Sem
contrafactual, "coaching" vira playlist com cara de dado. → registrar sinal de outcome por nó
(acerto por tema ao longo do tempo) antes de chamar de coaching.

## O QUE QUEBRA — 4 casos + sinal mínimo de detecção (ambos convergiram)
| Caso | Quebra porque | Sinal mínimo → ação |
|------|---------------|---------------------|
| **Fraqueza que nenhuma tag captura** (posicional/estrutural: IQP, Carlsbad, bispo errado, profilaxia, "quando trocar") | pool é ~todo tático; não há tag | suporte de tags do nó < k → **NÃO sirva**; emita "sem caminho curado — estudo/fonte CC/treinador" |
| **2000+ já viu tudo** | pool satura no topo, temas repetem | rating de puzzle roteada >200 abaixo do aluno **ou** já-visto >X% **ou** acerto-por-tema ≈ acerto global → **pare de rotear**; pivote p/ revisão dos próprios erros |
| **Jogo sem erro nítido** (empate 60 lances, perda por tempo, centipawn loss baixo) | sem sinal p/ diagnosticar; fabricar lição ensina regra falsa | densidade de blunder (queda de eval > limiar) = 0 → **NÃO diagnostique**; sinalize "não-tático — possível estratégico/tempo/psicológico" |
| **Tag certa, correção errada** (erro foi cálculo/disciplina sob tempo, não padrão) | treinar o padrão não conserta o problema real | após 2-3 ciclos acerto-do-tema não sobe **E** blunder no tema persiste → mapeamento tag→correção errado; troque de intervenção |

## Para quando item#3 implementar (ordem sugerida, ainda GATED atrás de E)
1. Extrator de erro a partir da anotação de engine externa (FEN + eval-drop) — read-only.
2. Mapa fraqueza→nó sobre `catalogSkillNodes` + ground truth por co-ocorrência de falha.
3. Gates do modo "não sei" (suporte/saturação/blunder-density) ANTES de qualquer roteamento.
4. SRS de reexposição do próprio erro (Leitner sobre regra/anotação autoral).
5. Complemento de exposição forçada + detector de sub-representação (anti viés de seleção).
6. Sinal de outcome por nó (fecha o loop).

## NON-GOALS
NÃO construir engine de avaliação. NÃO gerar posições/puzzles próprias. NÃO rotear sem passar
pelos gates do modo "não sei". NÃO implementar nada disto antes de E1-E4 e do OK de sequência.
NÃO usar Sonnet como executor (padrão do dono: GLM implementa).
