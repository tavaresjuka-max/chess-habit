# Estado Atual

Data: 2026-06-06 (atualizado apos decisao do dono pela moldura pessoal-primeiro).

## Status

- Moldura: **pessoal primeiro, comunidade depois** (decidida pelo dono).
- Fase de codigo: **aberta pelo dono** para a ferramenta pessoal.
- App: P1 concluida. PWA local-first roda com dominio puro, plano adaptado por fraquezas, Dexie,
  export/apagar e offline-shell.
- Backend/banco: so na Fase P4 (sync).
- Spec de execucao vigente: `docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md`.

## Decisoes Vigentes

- Ferramenta pessoal Lichess-first, local-first, adaptativa, faixa 0-1200.
- Clean-room: app novo do zero; proibido herdar codigo/assets do app pago. ChessKing fora do dominio.
- OAuth foi permitido pelo dono e reconciliado em `AGENTS.md`, `PLANO.md`, ADR-006 e spec. P0-P2 seguem
  sem OAuth obrigatorio; P3 usa OAuth PKCE opt-in para Studies com `study:read`/`study:write`.
- Sem engine na ferramenta pessoal.
- Adaptativo via dados publicos do Lichess + a analise que o Lichess ja fez (sem rodar engine).
- Multi-fonte e sync sao faseados, nao cortados. P1 deve partir do plano vigente e revalidar contratos oficiais antes de coletores.
- Renomeacao publica continua reservada para a versao-comunidade; OAuth pessoal e opt-in e restrito a Studies.
- Tipos estritos, sync por registro, slugs por allowlist oficial/manual, erro/offline especificados, linguagem de hipotese.

## Historico Da Auditoria (insumo, ja absorvido)

- `relatorio-codex-torre-aberta-lichess-tutor.md` e `relatorio-antigravity-torre-aberta-lichess-tutor.md`
  (auditoria estrategica inicial).
- `relatorio-claude-diretor-geral-consolidado-2026-06-06.md` (consolidacao no frame de mercado).
- Revisoes do spec unificado: `relatorio-codex-revisao-spec-unificado-2026-06-06.md`,
  `relatorio-claude-revisao-spec-unificado-2026-06-06.md`, `relatorio-antigravity-analise-design-unificado.md`.
  Correcoes tecnicas/legais aceitas; recomendacao de "validar mercado antes de codar" reservada para P5.

## Proxima Etapa

P0 concluida pelo Codex em 2026-06-06. P1 concluida: coletor Chess.com usa PubAPI read-only (`stats`,
`games/archives`, `games/{YYYY}/{MM}`), acesso serial, cache mensal de **sinais derivados** e parse de
PGN apenas transiente. Proxima fase: P2, loop de valor (feedback, regen, tema semanal, Lichess
secundario).

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
