# Plano Mestre: Chess Habit (ferramenta pessoal Lichess-first)

> REVISADO em 2026-06-06: o dono escolheu a moldura **pessoal primeiro, comunidade depois**.
> Substitui o plano anterior orientado a "validacao de mercado antes de codar" (aquele frame fica
> reservado para a Fase P5/comunidade). Specs vigentes: tutor
> (`docs/superpowers/specs/2026-06-08-professor-lemos-tutor-design.md`) e metodo 5 trilhas
> (`docs/superpowers/specs/2026-06-10-metodo-5-trilhas-design.md`).
> Badges v1 de esforco/habito aprovados pelo dono em 2026-06-13:
> `docs/superpowers/specs/2026-06-10-badges-spec-draft.md`.
> REVISADO em 2026-06-10 (rodada 2): roadmap ativo passa a ser o plano de cortes 0-8 aprovado
> pelo dono em `docs/review/relatorio-claude-arbitragem-contestacoes-2026-06-10.md`.
> REVISADO em 2026-06-17: P4/P5 foram descongeladas pelo dono em 2026-06-16.
> REVISADO em 2026-06-30: sync usa Cloudflare Workers + D1 em modelo de conta normal,
> com dados de progresso legiveis no servidor (sem E2EE/passphrase) por decisao do dono.

## Moldura

Ferramenta pessoal do dono para estudar xadrez no Lichess. O dono e a validacao; nao ha Fase 0 de
mercado (entrevistas/landing) antes de codar. Versao-comunidade foi descongelada para preparo de beta,
mas segue subordinada as regras inquebraveis e ao nome publico final do dono. OAuth pessoal foi
autorizado como opt-in com escopos minimos (`puzzle:read` e
`study:write`), sem escopos de jogo.

## Objetivo

PWA local-first que entende as fraquezas do dono a partir do historico real do Lichess, gera um plano
adaptado ao tempo disponivel (5/15/30/60 min), abre a tarefa certa no Lichess, registra progresso,
pede feedback curto e adapta as proximas licoes. Horizonte do curso: **0→autonomia** (o aluno
estuda ate nao precisar mais do app). Referencia interna de sequenciamento: bandas ate 2200
(7 bandas: 0-400, 400-800, 800-1000, 1000-1200, 1200-1600, 1600-2000, 2000-2200 — Corte 2).
Foco pessoal atual: faixa 0-1200. Nenhuma promessa de rating na UI ou comunicacao.

## Nao Escopo (ferramenta pessoal)

- Sem tabuleiro proprio, sem jogo no app, sem ajuda durante partida ao vivo.
- Sem OAuth obrigatorio. P2/P3 usam OAuth PKCE apenas como opt-in: `puzzle:read` para reconciliar
  resultado de puzzles e `study:write` para criar/importar o Study do dia.
- Sem engine, sem OCR.
- Sem ChessKing como fonte; sem copiar codigo/assets do app pago (clean-room).
- Sync P4 e opt-in via Cloudflare Workers + D1. O servidor recebe progresso legivel para sincronizar aparelhos; tokens OAuth continuam locais e fora de logs/backups/bundle.

## Stack

React + Vite + TypeScript + PWA + IndexedDB (Dexie). P4 usa Cloudflare Workers + D1, login Lichess como identidade e sync opt-in com dados legiveis no servidor.

## Roadmap (fases de codigo)

| Fase | Entrega |
|---|---|
| **P0** | Concluida: scaffold limpo + dominio tipado (Signal/Weakness/Plan) + gerador sensivel a tempo |
| **P1** | Concluida: Chess.com diagnostico primario + detector + plano adaptado, com destinos Lichess |
| **P2** | Concluida: loop de valor, timer/log, feedback, roadmap, sessoes extras e Lichess secundario |
| **P3** | Concluida: OAuth PKCE opt-in + reconciliacao de puzzles + Study Lichess privado do dia |
| **P4** | **Implementada em beta:** sync opt-in com Workers + D1, login Lichess, dados legiveis no servidor, sem tokens no servidor |
| **P5** | **Implementada em beta:** `APP_NAME='Chess Habit'`, disclaimer, aviso de copyright proprietario, docs de privacidade |

## Curriculo pessoal (0-1200 hoje; spine ate 2200 no Corte 2)

- 0-800: regras, checar ameacas, mate em 1, pecas penduradas, capturas seguras.
- 800-1200: taticas curtas, mate em 2, finais basicos, revisao de erros, partidas rapid lentas.
- 1200-2200: spine de bandas entra no Corte 2 (sem conteudo denso); conteudo denso e o
  Corte 8, dependente de pesquisa dirigida e da trilha de validacao de eficacia.

## Correcoes herdadas da auditoria (aceitas)

Clean-room; ChessKing fora do dominio; tipos estritos; sync por registro opt-in em modelo conta-normal;
slugs Lichess por allowlist oficial/manual; erro/offline especificados; linguagem de hipotese
(sem promessa de rating); OAuth pessoal opt-in permitido somente para `puzzle:read`/`study:write`, sem escopos de jogo.

## Auditoria Codex 2026-06-13

Relatorio: `docs/review/relatorio-codex-auditoria-geral-2026-06-13.md`.

Resolvido naquela passada historica: spec de badges marcada como aprovada, arquitetura entao realinhada e lint vermelho em `Fold` corrigido. Estado vigente supersede esse paragrafo: P4/P5 beta estao ativos, com sync opt-in Worker/D1 conta-normal. Documentado em 2026-07-01: politica de retencao/compactacao (`docs/adr/ADR-010`), ADR do `vite-plugin-pwa` (`docs/adr/ADR-009`) e ledger de assets gerados (`docs/design/asset-ledger.md`). Reducao de componente grande FEITA 2026-07-01 (test-gated, 1372 testes verdes): 6 arquivos >500 linhas decompostos em modulos focados — Today.tsx 758->523 (helpers/subcomponentes + CalibrationInvite/TodayDayStatus), Config.tsx 588->284 (ConfigDataFold/ConfigPrivacyFold/configHelpers), PlanBlockCard.tsx 622->487, state.ts 546->450 (stateTypes.ts), useDiagnosisActions.ts 704->622 (diagnosisHelpers.ts). Backlog remanescente: dogfood dois-aparelhos (teste manual do dono).

## Criterio De Pronto Por Fase

`npm run lint && npm run test && npm run build` verdes + DoD da fase no spec vigente (secao 18).

## Modelo

Gratuito e proprietario/codigo fechado (LICENSE proprietaria vigente). Sem anuncio, sem paywall, sem venda de dados.
Doacao, se ativada na versao-comunidade, e apenas link externo sem vantagem funcional.

## Aviso De Afiliacao

App nao oficial e independente. A UI deve mostrar disclaimer de nao-afiliacao e aviso de copyright proprietario; o nome publico fica centralizado em `APP_NAME`.
