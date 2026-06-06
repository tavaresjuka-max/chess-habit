# Estado Atual

Data: 2026-06-06 (atualizado apos decisao do dono pela moldura pessoal-primeiro).

## Status

- Moldura: **pessoal primeiro, comunidade depois** (decidida pelo dono).
- Fase de codigo: **aberta pelo dono** para a ferramenta pessoal.
- App: P0-P3 concluidas. PWA local-first roda com dominio puro, diagnostico Chess.com/Lichess,
  plano adaptado por fraquezas, timer/log local de treino, feedback facil/bom/dificil, foco semanal,
  roadmap, sessoes extras, selecao de recursos por estagio, OAuth PKCE opt-in, reconciliacao de puzzles,
  Study Lichess privado do dia, Dexie, export/apagar e offline-shell.
- Backend/banco: congelado. P4/P5 nao devem ser implementadas ate nova decisao do dono.
- Spec de execucao vigente: `docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md`.

## Decisoes Vigentes

- Ferramenta pessoal Lichess-first, local-first, adaptativa, faixa 0-1200.
- Clean-room: app novo do zero; proibido herdar codigo/assets do app pago. ChessKing fora do dominio.
- OAuth foi permitido pelo dono e reconciliado em `AGENTS.md`, `PLANO.md`, ADR-006 e spec. OAuth nunca
  e obrigatorio; escopos permitidos na ferramenta pessoal: `puzzle:read` para reconciliar atividade de
  puzzles e `study:write` para criar/importar o Study do dia. Tokens ficam locais e fora do export.
- Sem engine na ferramenta pessoal.
- Adaptativo via dados publicos do Lichess + a analise que o Lichess ja fez (sem rodar engine).
- Multi-fonte chegou ate P3. Sync (P4) e comunidade/renomeacao/disclaimers publicos (P5) estao congelados.
- Renomeacao publica continua reservada para a versao-comunidade congelada; OAuth pessoal e opt-in e restrito a `puzzle:read`/`study:write`.
- Tipos estritos, sync por registro, slugs por allowlist oficial/manual, erro/offline especificados, linguagem de hipotese.

## Historico Da Auditoria (insumo, ja absorvido)

- `relatorio-codex-torre-aberta-lichess-tutor.md` e `relatorio-antigravity-torre-aberta-lichess-tutor.md`
  (auditoria estrategica inicial).
- `relatorio-claude-diretor-geral-consolidado-2026-06-06.md` (consolidacao no frame de mercado).
- Revisoes do spec unificado: `relatorio-codex-revisao-spec-unificado-2026-06-06.md`,
  `relatorio-claude-revisao-spec-unificado-2026-06-06.md`, `relatorio-antigravity-analise-design-unificado.md`.
  Correcoes tecnicas/legais aceitas; recomendacao de "validar mercado antes de codar" reservada para P5.

## Proxima Etapa

P0, P1, P2 e P3 foram fechadas em 2026-06-06. P4 e P5 estao congeladas por decisao do dono; a proxima
etapa valida e estabilizar/testar o app pessoal com uso real antes de qualquer sync, backend, texto livre
ou versao-comunidade.

Implementado ate P3:

- Chess.com PubAPI read-only como diagnostico primario (`stats`, `games/archives`, `games/{YYYY}/{MM}`),
  acesso serial, cache mensal de sinais derivados e parse PGN apenas transiente.
- Lichess como diagnostico secundario por export NDJSON de partidas analisadas, sem moves/PGN persistido.
- Timer/log local ao abrir treino no Lichess; concluir salva tempo real e feedback `easy`/`good`/`hard`.
- Reconciliacao de puzzles via OAuth opt-in `puzzle:read`, tanto manual quanto oportunista ao concluir.
- Study Lichess privado do dia via OAuth opt-in `study:write`; PGN gerado e importado transientemente,
  sem armazenar PGN completo.
- Roadmap local, foco semanal, recursos por estagio, sessoes extras no mesmo dia e abertura direta de
  aulas/Practice/puzzle themes especificos.

Dados do dono confirmados: Lichess `jukasparov`; Chess.com `jukatavares`; band **800-1200**
(tema fixo P0 = `fork`). P1: Chess.com como fonte primaria de diagnostico, **historico completo**
(serial + cache), parse transiente, so sinais derivados. O Signal `color` carrega `games` alem de
`lossRate`, porque a regra de desequilibrio por cor exige minimo de partidas. Onboarding P1 importa nivel/temas conhecidos
(inclusive observados no ChessKing) como Signals manuais genericos `source:'outro'` (ver spec 14.3,
ADR-005, ADR-008) — sem taxonomia ChessKing, prints so locais, sem OCR. Mapeamento de temas CONFIRMADO
pelo dono (forcas: mate em 1/capturas/tatica basica/finais basicos; fraquezas: fork/hanging-piece,
discovered, mate-in-2, endgame-pawn, calculo). short_name do PWA: "Rotina" (provisorio).
Handoff de execucao P0 para o Codex: `prompts/handoff-codex-P0.md`. Tarefa 1 (scaffold) estava feita
antes desta retomada; tarefas 2-9 executadas pelo Codex nesta sessao. Dev server local em
`http://127.0.0.1:5173/` foi deixado rodando para teste manual.
