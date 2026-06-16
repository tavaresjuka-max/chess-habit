# Prompt Para Claude — Analise Dos Achados Codex E Plano Nota 9,5

Voce e Claude, atuando como diretor de produto-arquitetura do projeto `lichess-tutor`.

## Contexto Obrigatorio

Leia antes de decidir:

1. `AGENTS.md`
2. `PLANO.md`
3. `memory/state.md`
4. `memory/decisions.md`
5. `docs/review/relatorio-codex-auditoria-geral-2026-06-13.md`
6. `docs/review/relatorio-codex-achados-para-claude-2026-06-13.md`
7. `docs/review/relatorio-codex-plano-nota-95-para-claude-2026-06-13.md`
8. `docs/architecture/system.md`
9. `docs/superpowers/specs/2026-06-10-badges-spec-draft.md`

## Regras Que Nao Podem Ser Violadas

- O projeto continua sendo ferramenta pessoal primeiro; comunidade depois.
- P4/P5 continuam congeladas: nao autorizar sync, Worker, D1, backend, proxy, conta propria,
  comunidade ou renomeacao publica sem nova decisao explicita do dono.
- Nao criar tabuleiro proprio.
- Nao usar engine para avaliar treino do aluno.
- Nao sugerir lances nem ajudar durante partida viva.
- Nao usar scraping.
- Usar somente APIs oficiais/documentadas.
- Lichess: respeitar uma requisicao por vez e pausa minima de 1 minuto apos HTTP 429.
- Chess.com: PubAPI read-only, acesso serial, sem login e sem persistir PGN completo.
- OAuth Lichess somente opt-in com `puzzle:read` e `study:write`.
- Badges v1 estao aprovados, mas continuam limitados a esforco/habito, sem rating, sem streak punitivo.

## Tarefa

Analise os achados e propostas do Codex e produza uma arbitragem executiva para o dono.

Sua resposta deve conter:

1. **Veredito geral:** o plano Codex leva o app a 9,5? O que esta certo e o que esta exagerado?
2. **Tabela de decisoes:** para cada proposta N95-1 a N95-8, marcar `aprovar agora`, `adiar`,
   `reformular` ou `recusar`, com justificativa curta.
3. **Ordem final recomendada:** lista de cortes em ordem de execucao, com dependencias.
4. **Ordens para Codex:** tarefas pequenas, verificaveis, atomicas, com arquivos provaveis e DoD.
5. **Riscos que continuam:** especialmente privacidade, PWA/offline, perda de dados, API/rate limit,
   licenca de assets e complexidade de estado.
6. **Perguntas ao dono:** apenas se alguma decisao realmente depender dele.

## Criterio De Qualidade Da Sua Analise

- Seja duro com escopo: nao transformar "nota 9,5" em festival de features.
- Preserve a ferramenta pessoal e o uso real do dono.
- Diferencie bloqueador, melhoria importante e polish.
- Diga explicitamente o que nao deve ser feito agora.
- Se discordar do Codex, explique o motivo e proponha alternativa.
- Feche com uma ordem clara de proximo passo para execucao.

## Resultado Esperado

Um relatorio em `docs/review/relatorio-claude-arbitragem-nota-95-2026-06-13.md` que possa virar handoff
direto para Codex implementar o primeiro corte aprovado.
