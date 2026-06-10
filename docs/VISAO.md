# Visão do Produto — Professor Lemos / lichess-tutor

Data: 2026-06-10. Fonte: declaração direta do dono (mensagem de 08:50).
Este documento registra a visão de longo prazo. Ele NÃO substitui `AGENTS.md` (regras),
`PLANO.md` (fases) nem as decisões em `memory/decisions.md`. Itens daqui só viram escopo
ativo por decisão explícita do dono registrada em `memory/decisions.md`.

## Declaração do dono (2026-06-10, estruturada)

1. **Curso completo do 0 ao topo.** O dono escreveu "0 ao 3000"; o teto honesto está em
   debate (ver `docs/review/relatorio-claude-analise-geral-2026-06-10.md`, achado C-1).
2. **Avaliação de entrada (placement).** Onde a pessoa entra no curso, baseada em
   questionário + histórico Lichess e Chess.com.
3. **Pesquisa pedagógica contínua.** Continuar baixando livros/teses legais e integrando
   deltas ao método, buscando a melhor lógica de ensino de xadrez possível.
4. **Plataforma simples e colaborativa.** Futuramente disponível para a comunidade;
   open-source aceitando melhorias de outros desenvolvedores (processo a definir).
5. **UX parecida com Lichess e Chess.com.** Familiar para quem já joga online.
6. **Grátis com opção de doação.** (Já é regra inquebrável em `AGENTS.md`.)
7. **Sistema de recompensa incentivador por ESFORÇO, não por rating.** Metas de horas de
   estudo, não de rating. Badges e medalhas de conquista ("você treinou 30h esse mês",
   "você fez 1000 puzzles esse mês"), quebradas em metas semanais e mensais a partir de
   uma meta escondida de longo prazo (horas acumuladas + partidas com bom plano de estudo).
8. **Eficácia real.** O app precisa melhorar o jogador de maneira geral, não só ocupar tempo.
9. **Treinador dos sonhos.** Analisa o resultado de cada sessão, dá relatório, explica o que
   será feito na sessão seguinte. Existe um plano-base, mas ele reavalia cada sessão e
   adapta a próxima quando necessário.
10. **Liberdade + crédito automático.** O aluno pode abrir o Lichess por conta própria
    (ex.: jogar puzzles de garfo no tempo livre) e um botão no app importa o que foi feito
    nas últimas horas/dias e credita no plano de estudo.
11. **Análise ampla de progresso.** Visão clara do que o aluno sabe, como está melhorando,
    onde ainda tem dificuldade e como vai melhorar isso.
12. **Testar bastante** e analisar como virar open-source com contribuições externas.

## O que a visão NÃO muda

- Regras inquebráveis de `AGENTS.md` continuam valendo: clean-room, sem scraping, APIs
  oficiais, sem tabuleiro próprio, sem ajuda em partida ao vivo, sem engine, privacidade
  local-first, sem PGN persistido, grátis e open-source.
- "Metas de horas, não de rating" CONFIRMA a política existente de não prometer rating.
- P4 (sync) e P5 (comunidade) continuam congeladas até decisão explícita do dono; a visão
  sinaliza a direção, não descongela fases.

## Tensões conhecidas (a resolver na rodada de debate de 2026-06-10)

- Teto "3000" vs honestidade epistêmica do projeto (achado C-1 do relatório).
- "30 mil horas" vs literatura (~10-25 mil horas até nível de mestre, com variância enorme).
- Badges/medalhas vs anti-pattern documentado "gamificação vazia" (reconciliável: recompensa
  por esforço/hábito com significado pedagógico, nunca por rating).
- Plataforma colaborativa vs P5 congelada (sequenciamento, não contradição).
