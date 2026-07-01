# Visão do Produto — Professor Lemos / lichess-tutor

Data: 2026-06-10. Fonte: declaração direta do dono (mensagem de 08:50).
Este documento registra a visão de longo prazo. Ele NÃO substitui `AGENTS.md` (regras),
`PLANO.md` (fases) nem as decisões em `memory/decisions.md`. Itens daqui só viram escopo
ativo por decisão explícita do dono registrada em `memory/decisions.md`.

## Declaração do dono (2026-06-10, estruturada)

1. **Curso completo do 0 à autonomia.** O dono escreveu "0 ao 3000"; decidido em
   2026-06-10 (C-1 + refinamento da rodada 2): comunicação pública é **"0→autonomia"**;
   2200 é apenas referência INTERNA de sequenciamento do modelo de bandas, nunca promessa
   de rating na UI ou na comunicação do curso.
2. **Avaliação de entrada (placement).** Onde a pessoa entra no curso, baseada em
   questionário + histórico Lichess e Chess.com.
3. **Pesquisa pedagógica contínua.** Continuar baixando livros/teses legais e integrando
   deltas ao método, buscando a melhor lógica de ensino de xadrez possível.
4. **Plataforma simples e bem cuidada.** App proprietário, mantido pelo autor; melhorias
   vêm do próprio dono, não de contribuição externa de código.
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
12. **Testar bastante** com usuários reais e iterar o método.

## O que a visão NÃO muda

- Regras inquebráveis de `AGENTS.md` continuam valendo: clean-room, sem scraping, APIs
  oficiais, sem tabuleiro próprio, sem ajuda em partida ao vivo, sem engine, privacidade
  local-first, sem PGN persistido e grátis.
- "Metas de horas, não de rating" CONFIRMA a política existente de não prometer rating.
- P4 (sync) e P5 (comunidade) foram descongeladas por decisão explícita do dono em 2026-06-16; esta visão continua sendo direção de produto, não lista exaustiva de escopo ativo.

## Decisões tomadas em 2026-06-10 (após leitura do relatório de análise)

- **Teto do curso**: 0→2200 como referência interna, faixa 2200+ = autonomia. "3000" era
  número informal. Rodada 2 (2026-06-10): comunicação pública usa "0→autonomia"; o spine
  interno terá 7 bandas (0-400, 400-800, 800-1000, 1000-1200, 1200-1600, 1600-2000,
  2000-2200) — ver `memory/decisions.md`, "Decisoes da Rodada 2".
- **Meta escondida**: marcos elásticos (100h / 500h / 1.000h+) com metas semanais/mensais
  visíveis. Base na literatura do projeto (Charness 2005, Campitelli & Gobet 2011), não
  "30 mil horas".
- **Gamificação**: aprovada como incentivo positivo (esforço/hábito) — nunca gerando
  ansiedade ou tristeza. Sem streak punitivo. Spec detalhada antes de implementar.
- **Sync multi-dispositivo**: P4 foi descongelada e adotou modelo opt-in de conta normal: login Lichess, Cloudflare Workers + D1 e progresso legível no servidor para sincronizar aparelhos.

## Tensões ainda abertas (para rodada de debate)

- C-4: visão de plataforma comunitária vs beta ainda pessoal/anti-indexado (sequenciamento e divulgação pública).
- C-5: tom "adulto" vs microcopy "adequado a iniciante" — harmonizar como "simples ≠ infantil".
- C-6: bandas de rating para ORGANIZAR conteúdo vs metas do aluno (devem ser separadas na UI).
- G-1..G-11: gaps entre visão e estado atual — ver relatório de análise.
