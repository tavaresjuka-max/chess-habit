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

### Parte 1 — Contestação verificada
1. **Verifique cada afirmação factual do relatório contra o código e os docs reais.**
   Em particular: os achados A-1..A-6 (staleness) — alguns já foram corrigidos em
   2026-06-10; confirme se as correções aplicadas são suficientes ou se ficou resto.
2. Para cada achado (A, C, R, G): CONCORDO / DISCORDO / INCOMPLETO + evidência do repo.
3. **R-1 (perda de dados em IndexedDB)**: avalie tecnicamente as 3 mitigações propostas
   (`navigator.storage.persist()`, export automático, backup via Lichess Study). Custo real
   de cada uma em horas, riscos, e se há opção melhor que o Claude não viu.
4. **Rode o gate** (`npm run lint && npm run test && npm run build`) e reporte o resultado
   real — não confie no que o relatório afirma.
5. O que o relatório NÃO viu: dívida técnica real no código (state.ts, acoplamentos, testes
   frágeis, esquema Dexie v4, cobertura), riscos de API, qualquer coisa verificável.

### Parte 2 — Veredito de exequibilidade dos cortes
Para cada corte da seção 8 do relatório (0 a 7), estime:
- Tamanho (S/M/L/XL) em commits atômicos com gate verde.
- Arquivos/módulos que seriam tocados.
- Riscos técnicos e dependências entre cortes.
- Se a ordem proposta é tecnicamente sensata; proponha reordenação se necessário.
Declare também qual corte você recusaria executar hoje por ambiguidade de spec (regra do
projeto: diante de ambiguidade, Codex PARA e pergunta, nunca adivinha) e QUAIS perguntas
precisariam de resposta antes.

## Restrições invioláveis

- Sem scraping; só APIs oficiais Lichess/Chess.com. Sem tabuleiro próprio. Sem engine.
- Sem ajuda em partida ao vivo. Sem PGN completo persistido. Clean-room (nada de ChessKing).
- OAuth opt-in mínimo (`puzzle:read`, `study:write`); sem escopos de jogo.
- Grátis, open-source, sem prometer rating. P4/P5 congeladas.
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
