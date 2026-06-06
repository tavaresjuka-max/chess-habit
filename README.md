# Lichess Tutor

Status: planejamento e auditoria.

Lichess Tutor sera uma PWA gratuita e open-source para ajudar estudantes a treinarem melhor usando o Lichess. O app nao quer substituir o Lichess, nem criar outro tabuleiro de xadrez. Ele organiza rotina, interpreta historico publico/autorizado, sugere a aula do dia, acompanha progresso e abre o treino no Lichess.

Este projeto ainda nao contem app, backend, banco, `package.json`, `src` ou codigo executavel. Esta pasta existe para documentar a ideia antes de outras IAs e revisores avaliarem a arquitetura.

## Posicao Do Produto

- Gratis para todos.
- Open-source, com licenca planejada AGPL-3.0.
- Sem anuncios, paywall, venda de dados ou beneficio funcional pago.
- Doacao apenas por link externo; apoiador e reconhecimento moral.
- PWA para computador e mobile.
- Login planejado com Lichess OAuth PKCE.
- Sincronizacao planejada entre dispositivos.
- Treino no MVP abre paginas do Lichess.
- Chess.com entra somente como importador publico simples.

## Aviso

Lichess Tutor sera um app nao oficial. Nao e afiliado, endossado ou mantido pelo Lichess. O nome Lichess e usado apenas para indicar integracao e destino de treino.

## Leia Primeiro

1. `PLANO.md`
2. `AGENTS.md`
3. `memory/project.md`
4. `docs/review/ai-audit-pack.md`
5. `docs/research/sources.md`

## Separacao Do Workspace

- `chessking-tutor`: app antigo pago, baseado em Chess King e Chess.com.
- `chessking-assets`: APK e material extraido do app pago anterior.
- `lichess-tutor`: nova proposta aberta, gratuita e Lichess-first.

Nenhum material extraido, conteudo proprietario ou fluxo do app pago anterior deve entrar aqui.

