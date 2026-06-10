# Prompt para Gemini — Contestação da Análise Geral (2026-06-10)

Copie tudo abaixo da linha e cole no Gemini.

---

Você é o Gemini, consultor crítico do projeto `lichess-tutor` (produto: "Professor Lemos") —
PWA gratuita, local-first e open-source que transforma o Lichess em um curso completo de
xadrez para um aluno com TDAH, com método construído a partir de 400+ livros/teses/papers.

## Contexto da rodada

O dono declarou em 2026-06-10 uma visão ampliada (`docs/VISAO.md`): curso completo 0→topo,
placement por questionário+histórico, recompensas por esforço (nunca rating), relatório por
sessão, importação de atividade livre, painel amplo de progresso, futura plataforma
colaborativa. O Diretor Geral (Claude) analisou o projeto inteiro contra essa visão em
`docs/review/relatorio-claude-analise-geral-2026-06-10.md`. Sua tarefa: **contestar esse
relatório com rigor máximo**. Procure erro factual, análise rasa, prioridade errada e ponto
cego. Você será julgado pelo que encontrar que o Claude não encontrou.

## Mecanismo de autocorreção (obrigatório)

Em rodadas anteriores você cometeu erros corrigidos depois por leitura direta de fontes
(ex.: interpretou DAMP como "ritual de segurança"; a fonte real define Defesa, Alinhamento,
Mobilidade, Promoção como detecção tática). Portanto: **toda afirmação factual sua deve citar
o arquivo e trecho do repositório que a sustenta**. Se não puder verificar, escreva
"NÃO VERIFICADO" explicitamente. Afirmações sem fonte serão descartadas na arbitragem.

Leia antes (nesta ordem):
1. `docs/VISAO.md`
2. `docs/review/relatorio-claude-analise-geral-2026-06-10.md`
3. `AGENTS.md` (regras inquebráveis)
4. `docs/pedagogy/metodo-professor-lemos.md` e `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md`
5. `PLANO.md`, `memory/state.md`, `memory/decisions.md`

## Decisões já fechadas pelo dono — não reabrir nesta rodada

Estas questões foram resolvidas em 2026-06-10 e estão em `memory/decisions.md`.
Você pode questionar COMO implementar, mas não SE implementar.

| # | Questão | Decisão do dono |
|---|---------|-----------------|
| C-1 | Teto do curso | **0→2200, faixa 2200+ = autonomia.** |
| C-2 | Meta escondida / horas | **Marcos elásticos da literatura** (100h / 500h / 1.000h+) com metas semanais/mensais. Não usar "30 mil horas". Base: Charness et al. (2005), Campitelli & Gobet (2011). |
| C-3 | Gamificação | **Aprovada** — mas APENAS incentivo positivo (esforço/hábito). Proibido gerar ansiedade ou tristeza. Spec detalhada antes de implementar. |
| R-1 | Sync multi-dispositivo | **Mitigações locais primeiro** (storage.persist + export automático). P4 permanece congelada mas com intenção declarada de descongelar. |

## O que contestar (mínimo obrigatório)

1. Achados A-2..A-6, C-4..C-6, G-1..G-11: CONCORDO / DISCORDO / INCOMPLETO, com argumento
   e fonte. (C-1, C-2, C-3 e R-1 estão fechados — veja acima. Afirmações sem fonte do
   repositório serão descartadas na arbitragem — lembrete do erro DAMP anterior.)
2. **UX/produto + gamificação (sua especialidade)**: A decisão C-3 aprovou badges por
   esforço. Proponha o desenho concreto: quais conquistas, como exibir sem criar ansiedade,
   como integrar ao ciclo TDAH do app. Cite evidência sobre gamificação saudável em contexto
   educacional para TDAH. Como "UX parecida com Lichess/Chess.com" se traduz em padrões de
   navegação concretos sem copiar assets?
3. **Painel de Progresso (G-5)**: proponha o "mapa de habilidades" usando apenas dados que
   o app já persiste (sinais, feedback, puzzles reconciliados, pendências, diplomas, horas).
4. **Placement (G-2)**: desenhe o fluxo completo de avaliação de entrada sem tabuleiro
   próprio e sem novos escopos OAuth. Como calibrar a banda inicial a partir de questionário +
   histórico Chess.com/Lichess?
5. **P4 — arquitetura para sync aditivo**: dado que P4 é intenção declarada, que decisões
   de arquitetura tomar agora para que a migração para sync seja cirúrgica (não reescrever)?
   O Dexie v4 atual suporta isso bem? Quais campos do schema fariam sentido como chave de
   merge por registro?
6. **O que o relatório NÃO viu**: lacunas, riscos, contradições.
7. Responda às 7 perguntas abertas da seção 10 do relatório (ajustadas pelas decisões acima).

## Restrições invioláveis (qualquer proposta que as viole será rejeitada)

- Sem scraping; só APIs oficiais. Sem tabuleiro próprio; treino abre no Lichess. Sem engine.
- Sem ajuda em partida ao vivo. Sem PGN completo persistido; só sinais derivados.
- Clean-room: nada do app pago anterior; sem copiar conteúdo protegido.
- OAuth opt-in mínimo (`puzzle:read`, `study:write`); sem escopos de jogo.
- Grátis, open-source, sem anúncio/paywall/venda de dados. PROIBIDO prometer rating.
- P4 congelada agora mas com intenção de descongelar — propostas de COMO e QUANDO bem-vindas.
- P5 (comunidade) congelada sem data. Tom do Professor Lemos: adulto, prático, PT-BR, sem
  infantilizar, sem motivacional vazio.

## Formato de saída

Gere um único arquivo Markdown chamado
`relatorio-gemini-contestacao-analise-geral-2026-06-10.md` (será salvo em `docs/review/`).

Estrutura obrigatória:
1. Veredito geral do relatório do Claude (nota 0-10 + 3 frases).
2. Tabela achado-a-achado: CONCORDO/DISCORDO/INCOMPLETO + argumento + fonte.
3. Os 5 pontos mais fracos do relatório do Claude.
4. Aprofundamento UX/recompensas/progresso/placement (itens 2-4 acima).
5. O que faltou no relatório.
6. Sua priorização alternativa de cortes (se diferente, justifique).
7. Respostas às 7 perguntas abertas.
8. Top-3 recomendações inegociáveis suas.

Profundo, técnico, direto, PT-BR. Sem elogio protocolar.
