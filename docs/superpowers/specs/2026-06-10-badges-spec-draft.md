# Spec — Badges de Esforço e Hábito

- Data: 2026-06-10
- Status: **aprovada pelo dono em 2026-06-13**. A v1 aprovada mantém os 5 badges
  abaixo, todos únicos, sem ranking, sem streak punitivo e com métrica de qualidade
  acoplada. Este documento consolida os insumos da rodada de arbitragem (10
  perguntas do Codex, desenhos do Gemini, métricas de qualidade do DeepSeek) e
  passa a ser contrato executável do Corte 7.

## Princípios travados (decisões do dono, não negociáveis)

1. Badge premia **esforço e hábito**, nunca rating.
2. Nunca gera ansiedade ou tristeza: **sem streak punitivo**, sem badge "perdido",
   sem contagem regressiva, sem comparação com outros.
3. Todo badge tem **métrica de qualidade** acoplada (refinamento DeepSeek):
   volume sozinho não conta ("1000 puzzles chutados" não é conquista).
4. Tom Professor Lemos: sóbrio, factual, sem emoji, sem "parabéns!!!".

## Badges aprovados (v1 — 5 badges)

| Badge | Gatilho (dados reais) | Métrica de qualidade acoplada |
|---|---|---|
| **Retorno de Ouro** | Voltar a treinar após 7+ dias fora (`returnedAfterGap` + gap >= 7) e concluir a sessão do dia | Sessão de retorno concluída (não só aberta) |
| **Primeira Hora** | 60 min acumulados de treino real (`elapsedSeconds`) | Pelo menos 3 dias distintos (não 1 maratona) |
| **Tratador de Pendências** | 10 pendências fechadas (`status: done` após 4 revisões espaçadas) | Última revisão com feedback `good` ou `easy` |
| **Semana Inteira** | Treinar em 5 dias da mesma semana (qualquer duração) | Cada dia com >= 1 bloco concluído |
| **Calibrado** | Completar a avaliação de entrada + calibração com puzzles | Confiança média ou alta no placement |

## Regras de exibição

- Badges aparecem só na tela Progresso, em seção própria, depois de conquistados.
- Badge não conquistado **não aparece** como "bloqueado/cinza" (evita sensação de dívida).
- Conquista gera uma linha sóbria no relatório do dia ("Você fechou 10 pendências
  com revisão espaçada. Isso tem nome: constância.") — sem modal, sem confete.

## Decisões de aprovação

1. Os 5 badges acima bastam para a v1.
2. Badges são conquistas únicas na v1; não se repetem semanalmente/mensalmente.
3. Badges entram no export/backup por tabela própria Dexie.
4. Celebração visual fica contida: linha sóbria no relatório e exibição na tela Progresso; sem modal, som ou confete.
5. Os nomes públicos em PT-BR ficam aprovados para a ferramenta pessoal.

## Não-objetivos

- Sem badge por rating, acerto percentual ou posição em ranking.
- Sem notificações push, sem som, sem animação.
- Sem badges sociais/compartilháveis antes da P5.
