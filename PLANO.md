# Plano Mestre: Rotina (ferramenta pessoal Lichess-first)

> REVISADO em 2026-06-06: o dono escolheu a moldura **pessoal primeiro, comunidade depois**.
> Substitui o plano anterior orientado a "validacao de mercado antes de codar" (aquele frame fica
> reservado para a Fase P5/comunidade). Spec de execucao vigente:
> `docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md`.

## Moldura

Ferramenta pessoal do dono para estudar xadrez no Lichess. O dono e a validacao; nao ha Fase 0 de
mercado (entrevistas/landing) antes de codar. Versao-comunidade esta congelada na Fase P5 ate nova
decisao do dono. OAuth pessoal foi autorizado como opt-in com escopos minimos (`puzzle:read` e
`study:write`), sem escopos de jogo.

## Objetivo

PWA local-first que entende as fraquezas do dono a partir do historico real do Lichess, gera um plano
adaptado ao tempo disponivel (5/15/30/60 min), abre a tarefa certa no Lichess, registra progresso,
pede feedback curto e adapta as proximas licoes. Foco pessoal: faixa 0-1200.

## Nao Escopo (ferramenta pessoal)

- Sem tabuleiro proprio, sem jogo no app, sem ajuda durante partida ao vivo.
- Sem OAuth obrigatorio. P2/P3 usam OAuth PKCE apenas como opt-in: `puzzle:read` para reconciliar
  resultado de puzzles e `study:write` para criar/importar o Study do dia.
- Sem engine, sem OCR.
- Sem ChessKing como fonte; sem copiar codigo/assets do app pago (clean-room).
- Sem backend por enquanto. A fase de sync (P4) esta congelada.

## Stack

React + Vite + TypeScript + PWA + IndexedDB (Dexie). Cloudflare D1 + Worker ficam apenas como ideia
congelada para P4, se o dono descongelar sync depois.

## Roadmap (fases de codigo)

| Fase | Entrega |
|---|---|
| **P0** | Concluida: scaffold limpo + dominio tipado (Signal/Weakness/Plan) + gerador sensivel a tempo |
| **P1** | Concluida: Chess.com diagnostico primario + detector + plano adaptado, com destinos Lichess |
| **P2** | Concluida: loop de valor, timer/log, feedback, roadmap, sessoes extras e Lichess secundario |
| **P3** | Concluida: OAuth PKCE opt-in + reconciliacao de puzzles + Study Lichess privado do dia |
| **P4** | **Congelada por decisao do dono em 2026-06-06:** sync PC<->celular, D1 e "outro estudo" texto livre |
| **P5** | **Congelada por decisao do dono em 2026-06-06:** versao-comunidade, renomeacao, disclaimers e polish publico |

## Curriculo pessoal (0-1200)

- 0-800: regras, checar ameacas, mate em 1, pecas penduradas, capturas seguras.
- 800-1200: taticas curtas, mate em 2, finais basicos, revisao de erros, partidas rapid lentas.

## Correcoes herdadas da auditoria (aceitas)

Clean-room; ChessKing fora do dominio; tipos estritos (sem `unknown`); sync por registro e congelado;
slugs Lichess por allowlist oficial/manual; erro/offline especificados; linguagem de hipotese
(sem promessa de rating); OAuth pessoal opt-in permitido somente para `puzzle:read`/`study:write`, sem escopos de jogo.

## Criterio De Pronto Por Fase

`npm run lint && npm run test && npm run build` verdes + DoD da fase no spec vigente (secao 18).

## Modelo

Gratuito e open-source (AGPL-3.0 planejada). Sem anuncio, sem paywall, sem venda de dados. Doacao por
link externo so na versao-comunidade congelada.

## Aviso De Afiliacao

App nao oficial e independente. Renomeacao publica obrigatoria e disclaimer de nao-afiliacao entram
na Fase P5 quando ela for descongelada (por causa da feature oficial `lichess.org/tutor`).
