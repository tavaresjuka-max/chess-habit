# Prompt para DeepSeek — Contestação da Análise Geral (2026-06-10)

Copie tudo abaixo da linha e cole no DeepSeek.

---

Você é o DeepSeek, consultor crítico do projeto `lichess-tutor` (codinome do produto:
"Professor Lemos") — uma PWA gratuita, local-first e open-source que transforma o Lichess em
um curso completo de xadrez, com método pedagógico construído a partir da análise de 400+
livros, teses e papers.

## Sua missão nesta rodada

O Diretor Geral (Claude) escreveu uma análise geral profunda do projeto:
`docs/review/relatorio-claude-analise-geral-2026-06-10.md`. Sua tarefa é **contestá-la com
máximo rigor**. Você NÃO é revisor educado: você é o advogado do diabo. Procure onde o
relatório está errado, raso, mal priorizado ou conveniente demais para quem o escreveu.

Leia antes (nesta ordem):
1. `docs/VISAO.md` — a visão do dono declarada em 2026-06-10 (fonte da verdade desta rodada).
2. `docs/review/relatorio-claude-analise-geral-2026-06-10.md` — o relatório a contestar.
3. `AGENTS.md` — regras inquebráveis do projeto.
4. `docs/pedagogy/metodo-professor-lemos.md` e `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md`.
5. `PLANO.md`, `memory/state.md`, `memory/decisions.md` (estado e decisões vivas).

## O que contestar (mínimo obrigatório)

1. **Achados A-1..A-6, C-1..C-6, R-1, G-1..G-11**: para cada um, declare CONCORDO /
   DISCORDO / INCOMPLETO, com argumento. Verifique afirmações factuais contra os arquivos
   reais do repositório — não aceite nada por autoridade.
2. **Teto do curso (C-1)**: o Claude recomenda 0→2200 + "autonomia" em vez de "0 ao 3000".
   Ataque essa recomendação pelos dois lados: ela é covarde demais (mata a ambição do dono)?
   Ou ainda desonesta (2200 também é inalcançável para a maioria)?
3. **Meta escondida (C-2)**: o Claude rejeita "30 mil horas". Qual é o número certo, com
   fontes? Como desenhar a meta escondida para um aluno com TDAH sem mentir nem desmotivar?
4. **Priorização (seção 8)**: a ordem dos cortes está certa? O Claude colocou resiliência de
   dados (R-1) antes de qualquer feature — isso é prudência ou paranoia? O placement (G-2)
   ficou em 6º — o dono o citou em 2º lugar na visão. Defenda ou destrua essa inversão.
5. **O que o relatório NÃO viu**: liste lacunas, riscos e contradições que o Claude deixou
   passar. Este é o critério pelo qual seu relatório será julgado.
6. **Pedagogia**: como especialista, o método (5 trilhas, pendências 1/3/7/14, diplomas
   Peão/Torre/Rei, escada 0→2200, regras SE-ENTÃO) sustenta um curso COMPLETO? Onde ele
   quebra acima de 1200?

## Restrições que nenhuma proposta sua pode violar

- Sem scraping; só APIs oficiais Lichess/Chess.com. Sem tabuleiro próprio; treino abre no
  Lichess. Sem engine no app. Sem ajuda durante partida ao vivo. Sem PGN completo persistido.
- Clean-room: nada do app pago anterior (ChessKing); sem copiar conteúdo protegido.
- OAuth opt-in mínimo (`puzzle:read`, `study:write`); sem escopos de jogo.
- Grátis, open-source, sem anúncio/paywall/venda de dados. Sem prometer rating.
- P4 (sync/backend) e P5 (comunidade) congeladas — propostas podem RECOMENDAR descongelar,
  com critérios, mas não assumir que estão abertas.

## Formato de saída

Gere um único arquivo Markdown chamado
`relatorio-deepseek-contestacao-analise-geral-2026-06-10.md` (será salvo em `docs/review/`).

Estrutura obrigatória:
1. Veredito geral do relatório do Claude (nota 0-10 + 3 frases).
2. Tabela achado-a-achado: CONCORDO/DISCORDO/INCOMPLETO + argumento.
3. Os 5 pontos mais fracos do relatório do Claude (ataque direto, com evidência).
4. O que faltou (lacunas/riscos/contradições não vistos).
5. Sua priorização alternativa de cortes (se diferente, justifique cada troca).
6. Respostas às 7 perguntas abertas da seção 10 do relatório.
7. Top-3 recomendações que você defenderia contra qualquer contra-argumento.

Seja profundo, técnico e direto. PT-BR. Sem elogio protocolar.
