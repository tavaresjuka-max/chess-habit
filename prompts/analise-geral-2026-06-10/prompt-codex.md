# Prompt para Codex — Contestação da Análise Geral + Veredito de Exequibilidade (2026-06-10)

Copie tudo abaixo da linha e cole no Codex (rodar dentro do repositório `lichess-tutor`).

---

Você é o Codex, executor e árbitro técnico do projeto `lichess-tutor`. Diferente dos
consultores (DeepSeek/Gemini), você TEM acesso ao repositório real: sua contestação deve ser
a mais verificada das três. Toda afirmação sua deve apontar arquivo (e linha quando couber).

## Contexto da rodada

O dono declarou em 2026-06-10 uma visão ampliada (`docs/VISAO.md`). O Diretor Geral (Claude)
analisou o projeto inteiro contra essa visão em
`docs/review/relatorio-claude-analise-geral-2026-06-10.md` e propôs 8 cortes priorizados.
Sua tarefa tem duas partes:

## Decisões já fechadas pelo dono — contexto para exequibilidade

Estas questões foram resolvidas em 2026-06-10 e estão em `memory/decisions.md`. Leve-as
em conta ao avaliar custo e arquitetura dos cortes.

| # | Decisão | Impacto técnico |
|---|---------|-----------------|
| C-1 | Curso até 2200 (não 3000) | `LearnerBand` e escada precisam cobrir até 2200; 2200+ = apenas orientação de autonomia |
| C-2 | Marcos elásticos de horas (100/500/1000h+) | `SessionMilestonesCard` e domínio de progresso precisam de agregação mensal/semanal |
| C-3 | Badges/conquistas por esforço (spec antes de implementar) | Novo domínio puro `achievements`; sem afetar rating |
| R-1 | storage.persist + export automático ANTES de qualquer feature nova | Alta prioridade; P4 (sync) vem depois mas é intenção declarada — schema Dexie deve pensar em merge-key por registro desde já |

### Parte 1 — Contestação verificada
1. **Verifique cada afirmação factual do relatório contra o código e os docs reais.**
   Os achados A-1 (README), A-2 (state.md) e A-5 (decisions.md) foram corrigidos em
   2026-06-10. Confirme se as correções são suficientes ou se ficou resto nos outros arquivos.
2. Para cada achado A-3..A-6, C-4..C-6, G-1..G-11: CONCORDO / DISCORDO / INCOMPLETO +
   evidência do repo (arquivo:linha). C-1, C-2, C-3 e R-1 estão fechados — avalie apenas
   o COMO implementar, não o SE.
3. **R-1 — avaliação técnica detalhada** (decisão: implementar storage.persist + export
   automático antes de features novas): estime custo, riscos e se há opção melhor que o
   Claude não viu. O schema Dexie v4 atual (`src/domain/method/types.ts`, tabelas Dexie)
   suporta merge-key por registro para futuro sync (P4)? O que mudaria?
4. **Rode o gate** (`npm run lint && npm run test && npm run build`) e reporte resultado
   real — não confie no que o relatório afirma.
5. O que o relatório NÃO viu: dívida técnica real (acoplamentos, testes frágeis, cobertura,
   esquema Dexie), riscos de API, qualquer coisa verificável.

### Parte 2 — Veredito de exequibilidade dos cortes (seção 8 do relatório)
Para cada corte (0 a 7), estime:
- Tamanho (S/M/L/XL) em commits atômicos com gate verde.
- Arquivos/módulos tocados.
- Riscos técnicos e dependências entre cortes.
- Se a ordem proposta é sensata; proponha reordenação se necessário.

Declare também qual corte você **recusaria** executar hoje por ambiguidade de spec (regra:
diante de ambiguidade, Codex PARA e pergunta) e quais perguntas precisariam de resposta.

Para o **Corte 5 (badges/recompensas)**: a decisão C-3 aprova o conceito mas requer spec
antes. Liste as perguntas bloqueantes que o spec precisaria responder para que você execute.

## Restrições invioláveis

- Sem scraping; só APIs oficiais Lichess/Chess.com. Sem tabuleiro próprio. Sem engine.
- Sem ajuda em partida ao vivo. Sem PGN completo persistido. Clean-room (nada de ChessKing).
- OAuth opt-in mínimo (`puzzle:read`, `study:write`); sem escopos de jogo.
- Grátis, open-source, sem prometer rating.
- P4 congelada agora mas intenção declarada de descongelar; schema deve ser preparado.
- P5 (comunidade) congelada sem data.
- TypeScript estrito; domínio puro sem rede/React; gate verde por tarefa.

## Formato de saída

Gere um único arquivo Markdown em
`docs/review/relatorio-codex-contestacao-analise-geral-2026-06-10.md`.

Estrutura obrigatória:
1. Veredito geral do relatório do Claude (nota 0-10 + 3 frases).
2. Resultado real do gate (lint/test/build) com números.
3. Tabela achado-a-achado: CONCORDO/DISCORDO/INCOMPLETO + evidência (arquivo:linha).
4. Os 5 pontos mais fracos do relatório (com prova).
5. Dívida técnica e riscos que o relatório não viu.
6. Parte 2 completa: tabela de exequibilidade por corte + reordenação + perguntas bloqueantes.
7. Respostas às 7 perguntas abertas da seção 10 do relatório (visão de executor).
8. Top-3 recomendações técnicas inegociáveis.

Não edite nenhum outro arquivo do repositório nesta tarefa. Profundo, verificado, PT-BR.
