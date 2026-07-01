# Chess Habit

Status: beta público funcional em produção Vercel, com P0-P5 essencial implementado.
P4 (sync) e P5 (versão-comunidade) foram descongeladas pelo dono em 2026-06-16. Nome público
definido: `APP_NAME = 'Chess Habit'` (decidido pelo dono em 2026-06-19, em `src/config/appIdentity.ts`).
Sync multi-dispositivo é opcional via Cloudflare Workers + D1; os dados de progresso ficam legíveis pelo operador, por decisão de produto, e tokens OAuth continuam só no aparelho.

Chess Habit é uma PWA gratuita e local-first que ajuda o aluno a treinar melhor
usando o Lichess. O app não substitui o Lichess nem cria outro tabuleiro:
ele diagnostica fraquezas a partir do histórico real (Chess.com/Lichess), monta o plano do dia,
abre o treino certo no Lichess, registra progresso e adapta as próximas sessões.

## O que já existe

- App React + Vite + TypeScript + PWA + Dexie (IndexedDB), domínio puro testado.
- Diagnóstico: Chess.com PubAPI (primário) + Lichess (secundário) + sinais manuais. Parse de
  PGN transiente; só sinais derivados são persistidos.
- Plano diário sensível ao tempo (5/15/30/60 min) com loop sinal → fraqueza → foco → recurso
  Lichess → treino → resultado → ajuste.
- OAuth PKCE opt-in mínimo: `puzzle:read` (reconciliar puzzles) e `study:write` (Study do dia).
- Método Professor Tavarez: 5 trilhas, pendências com repetição espaçada, diplomas (Peão/Torre/Rei),
  proposta de fase, metas acumuladas por horas/sessões.
- Sync opcional: Worker Cloudflare + D1 com login Lichess, merge por registros e política honesta de dados legíveis no servidor.
- Gate de qualidade: `npm run lint && npm run test && npm run build`.

## Posição do produto

- Grátis para todos; sem anúncios, paywall, venda de dados ou benefício funcional pago.
- Doação apenas por link externo na versão-comunidade, sem vantagem funcional para apoiador.
- Treino abre no Lichess; sem tabuleiro próprio, sem engine, sem ajuda em partida ao vivo.
- Privacidade local-first por padrão: sem PGN completo persistido, sem tokens em export/logs; sync é opt-in e legível no servidor.

## Aviso

App não oficial. Não é afiliado, endossado ou mantido pelo Lichess. O nome público é
`Chess Habit` (`APP_NAME` em `src/config/appIdentity.ts`).

## Leia primeiro

1. `docs/VISAO.md` — visão de longo prazo do dono (2026-06-10)
2. `AGENTS.md` — regras canônicas para agentes
3. `PLANO.md` — fases e escopo vigente
4. `docs/pedagogy/metodo-professor-tavarez.md` — método pedagógico canônico
5. `memory/state.md` e `memory/decisions.md` — estado e decisões vivas

## Separação do workspace

- `chessking-tutor` / `chessking-assets`: app pago anterior e seus materiais. **Nada** de lá
  entra aqui (clean-room).
- `lichess-tutor`: este projeto, gratuito e Lichess-first.

## Licença

Copyright © 2026 Juka Tavarez. Todos os direitos reservados.

Software proprietário e de código fechado. Nenhuma permissão de cópia, modificação,
redistribuição ou uso do código é concedida sem autorização prévia e por escrito do
titular. O acesso ao serviço hospedado não concede direito algum sobre o código-fonte.
Sem garantia; veja a [LICENSE](LICENSE) para os termos completos.
