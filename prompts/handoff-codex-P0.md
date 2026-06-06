# Handoff De Execucao — Codex — Fase P0

> Cole este prompt no Codex (Executor). Ele implementa SOMENTE a Fase P0, tarefa a tarefa.

---

Voce e o Codex, Executor deste projeto. Implemente a **Fase P0** seguindo exatamente o plano e o spec.
Voce NAO redefine escopo. Diante de qualquer ambiguidade ou contrato divergente, PARE e pergunte.

## Leia e obedeca (nesta ordem de autoridade)

1. `AGENTS.md` — Regras Inquebraveis e governanca.
2. `docs/superpowers/plans/2026-06-06-plano-execucao-P0.md` — a lista de tarefas P0 (autoritativa).
3. `docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md` — spec, incluindo o
   **Adendo 22** (correcoes da rodada 2) que tem precedencia onde houver conflito.

## Escopo (SOMENTE P0)

Scaffold limpo + dominio puro tipado + gerador de plano fixo sensivel ao tempo + persistencia local
(Dexie) + UI minima (Hoje/Config) + PWA instalavel + export/apagar. **Sem rede, sem detector de
fraquezas, sem Chess.com/Lichess, sem sync.** Esses entram em P1+ (planos proprios, depois).

## Parametros confirmados pelo dono

- Banda inicial: **800-1200** -> tema fixo de P0 = **`fork`**.
- `lichessUsername` default editavel: **jukasparov** (apenas armazenado na config; P0 nao faz rede).
- PWA `short_name`: **"Rotina"** (provisorio).
- `SourceId` = `'lichess' | 'chesscom' | 'outro'` (ChessKing NUNCA).

## Regras de execucao (inquebraveis nesta fase)

- Implemente **uma tarefa por vez, na ordem** do plano (Tarefa 1 -> 9).
- **Commit atomico por tarefa**, com a mensagem sugerida no plano.
- Antes de fechar cada tarefa que toca codigo, rode o gate: `npm run lint && npm run test && npm run build`
  e cole o resultado. Nao feche tarefa com gate vermelho.
- **Clean-room (critico):** NUNCA abrir, ler ou copiar `chessking-tutor/src/*` ou `chessking-assets/*`.
  Nada de nomes de curso/secao/estrutura do ChessKing no codigo. Rode o checklist clean-room do plano
  ao fim de cada tarefa.
- **Dominio puro:** `src/domain/**` nao importa `infra`, rede ou React (configurar lint para impedir).
- TypeScript **estrito**. Sem `any`/`unknown` exportado.
- **Sem rede em P0** (nenhum `fetch`). Sem token, sem PII em log (nunca logar objeto de dominio completo).
- Nao adicionar dependencia nova fora das listadas no plano sem perguntar.
- Se algo no plano/spec estiver ambiguo ou divergir da doc oficial, **PARE e pergunte** — nao adivinhe.

## Ao terminar CADA tarefa, responda no formato (AGENTS.md)

- O que mudou.
- Arquivos criados/alterados.
- Verificacoes feitas (saida do gate).
- Riscos que continuam.
- Checklist clean-room: OK/NAO.

Depois aguarde confirmacao antes de seguir para a proxima tarefa (ou siga em sequencia se o dono
autorizar execucao continua). Ao fim da Tarefa 9, declare a Fase P0 concluida e atualize
`memory/progress.md` e `memory/state.md`.
