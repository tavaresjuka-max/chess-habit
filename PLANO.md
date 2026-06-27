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
> REVISADO em 2026-06-17: P4/P5 foram descongeladas pelo dono em 2026-06-16. Sync deve usar
> Cloudflare Workers + D1 com E2EE por passphrase, construido/testado localmente sem deploy.

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
- Sem deploy/provisionamento de backend pelo agente. P4 pode ser construida e testada localmente
  (Wrangler/Miniflare/D1), com tokens OAuth sempre locais e dados de sync cifrados ponta-a-ponta.

## Stack

React + Vite + TypeScript + PWA + IndexedDB (Dexie). P4 autorizada usa Cloudflare Workers + D1,
com desenvolvimento local e E2EE por passphrase antes de qualquer ligacao de nuvem pelo dono.

## Roadmap (fases de codigo)

| Fase | Entrega |
|---|---|
| **P0** | Concluida: scaffold limpo + dominio tipado (Signal/Weakness/Plan) + gerador sensivel a tempo |
| **P1** | Concluida: Chess.com diagnostico primario + detector + plano adaptado, com destinos Lichess |
| **P2** | Concluida: loop de valor, timer/log, feedback, roadmap, sessoes extras e Lichess secundario |
| **P3** | Concluida: OAuth PKCE opt-in + reconciliacao de puzzles + Study Lichess privado do dia |
| **P4** | **Descongelada em 2026-06-16:** sync local-only com Workers + D1, E2EE por passphrase, sem tokens no servidor |
| **P5** | **Descongelada em 2026-06-16:** `APP_NAME='Chess Habit'`, disclaimer, AGPL visivel, docs de privacidade |

## Curriculo pessoal (0-1200 hoje; spine ate 2200 no Corte 2)

- 0-800: regras, checar ameacas, mate em 1, pecas penduradas, capturas seguras.
- 800-1200: taticas curtas, mate em 2, finais basicos, revisao de erros, partidas rapid lentas.
- 1200-2200: spine de bandas entra no Corte 2 (sem conteudo denso); conteudo denso e o
  Corte 8, dependente de pesquisa dirigida e da trilha de validacao de eficacia.

## Correcoes herdadas da auditoria (aceitas)

Clean-room; ChessKing fora do dominio; tipos estritos (sem `unknown`); sync por registro e P4 local-only;
slugs Lichess por allowlist oficial/manual; erro/offline especificados; linguagem de hipotese
(sem promessa de rating); OAuth pessoal opt-in permitido somente para `puzzle:read`/`study:write`, sem escopos de jogo.

## Auditoria Codex 2026-06-13

Relatorio: `docs/review/relatorio-codex-auditoria-geral-2026-06-13.md`.

Resolvido nesta passada: spec de badges marcada como aprovada, arquitetura atual realinhada para PWA
local-first sem backend, e lint vermelho em `Fold` corrigido. Melhorias registradas como backlog, sem
implementar P4/P5: fila/cooldown central de API, smoke PWA de producao/offline, ADR curta sobre
`vite-plugin-pwa`, validacao mais profunda de backup importado, ledger de assets gerados e reducao
gradual de estado/componente grande.

## Criterio De Pronto Por Fase

`npm run lint && npm run test && npm run build` verdes + DoD da fase no spec vigente (secao 18).

## Modelo

Gratuito e open-source (AGPL-3.0 — LICENSE adicionada em 2026-06-10). Sem anuncio, sem paywall, sem venda de dados.
Doacao, se ativada na versao-comunidade, e apenas link externo sem vantagem funcional.

## Aviso De Afiliacao

App nao oficial e independente. A UI deve mostrar disclaimer de nao-afiliacao e AGPL; o nome publico
continua centralizado em `APP_NAME` ate o dono fornecer o nome final.
