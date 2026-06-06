# Plano Mestre: Rotina (ferramenta pessoal Lichess-first)

> REVISADO em 2026-06-06: o dono escolheu a moldura **pessoal primeiro, comunidade depois**.
> Substitui o plano anterior orientado a "validacao de mercado antes de codar" (aquele frame fica
> reservado para a Fase P5/comunidade). Spec de execucao vigente:
> `docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md`.

## Moldura

Ferramenta pessoal do dono para estudar xadrez no Lichess. O dono e a validacao; nao ha Fase 0 de
mercado (entrevistas/landing) antes de codar. Versao-comunidade so na Fase P5, se a pessoal for boa.
OAuth pessoal foi autorizado pelo dono, mas entra apenas como opt-in e com escopo minimo para Studies.

## Objetivo

PWA local-first que entende as fraquezas do dono a partir do historico real do Lichess, gera um plano
adaptado ao tempo disponivel (5/15/30/60 min), abre a tarefa certa no Lichess, registra progresso,
pede feedback curto e adapta as proximas licoes. Foco pessoal: faixa 0-1200.

## Nao Escopo (ferramenta pessoal)

- Sem tabuleiro proprio, sem jogo no app, sem ajuda durante partida ao vivo.
- Sem OAuth obrigatorio em P0-P2. P2 pode preparar leitura opt-in de atividade de puzzles
  (`puzzle:read`) para reconciliar resultado de treino; OAuth PKCE opt-in para Studies entra na P3
  com `study:read`/`study:write`.
- Sem engine, sem OCR.
- Sem ChessKing como fonte; sem copiar codigo/assets do app pago (clean-room).
- Sem backend ate a fase de sync (P4).

## Stack

React + Vite + TypeScript + PWA + IndexedDB (Dexie). Cloudflare D1 + Worker so na fase de sync (P4).

## Roadmap (fases de codigo)

| Fase | Entrega |
|---|---|
| **P0** | Scaffold limpo + dominio tipado (Signal/Weakness/Plan) + gerador sensivel a tempo (plano fixo) |
| **P1** | Chess.com como fonte primaria de diagnostico (stats + partidas recentes, parse transiente) + detector + plano adaptado, com destinos Lichess |
| **P2** | Loop de valor (timer/log de treino, feedback, regen, tema semanal, auto-ajuste de band) + Lichess como fonte secundaria de diagnostico |
| **P3** | OAuth PKCE opt-in + gerador de Study Lichess privado/unlisted ("Seu treino de hoje") |
| **P4** | Sync PC<->celular opt-in (merge por registro, D1) + "outro estudo" texto livre local |
| **P5** | Versao-comunidade: renomear, disclaimers, i18n, polish e revisao publica — so se a pessoal for boa |

## Curriculo pessoal (0-1200)

- 0-800: regras, checar ameacas, mate em 1, pecas penduradas, capturas seguras.
- 800-1200: taticas curtas, mate em 2, finais basicos, revisao de erros, partidas rapid lentas.

## Correcoes herdadas da auditoria (aceitas)

Clean-room; ChessKing fora do dominio; tipos estritos (sem `unknown`); sync por registro e adiado;
slugs Lichess por allowlist oficial/manual; erro/offline especificados; linguagem de hipotese
(sem promessa de rating); OAuth pessoal opt-in permitido somente para Studies, sem escopos de jogo.

## Criterio De Pronto Por Fase

`npm run lint && npm run test && npm run build` verdes + DoD da fase no spec vigente (secao 18).

## Modelo

Gratuito e open-source (AGPL-3.0 planejada). Sem anuncio, sem paywall, sem venda de dados. Doacao por
link externo so na versao-comunidade.

## Aviso De Afiliacao

App nao oficial e independente. Renomeacao publica obrigatoria e disclaimer de nao-afiliacao entram
na Fase P5 (por causa da feature oficial `lichess.org/tutor`).
