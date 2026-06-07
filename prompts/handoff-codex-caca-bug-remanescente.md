# Handoff Codex — resolver o que sobrou da caça-bug

Contexto: 9 dos 10 bugs do seu relatório de caça já foram corrigidos (ver
`docs/review/relatorio-claude-avaliacao-caca-bug-codex-2026-06-07.md` e os commits
`6fb3ff0`, `c9ff91e`, `09b21ed`, `01c9268`, `3908822`, `92a3d49`, `4812014`,
`fc5ad8f`). **NÃO refaça nenhum desses.** Esta tarefa cobre só o que resta.

Regras (AGENTS.md): clean-room, tipos estritos (sem `any`/`unknown` solto), TDD
(teste vermelho antes do código), 1 commit atômico por item, e ao final
`npm run lint && npm run test && npm run build` verdes. Em dúvida de produto,
PARE e pergunte ao dono — não implemente feature congelada. Branch `master`.

## Prioridade 0 — fechar os parciais (bugs reais ainda abertos)

1. **Re-concluir bloco `done` pela UI (resto do P1.2).**
   - Hoje o guard só protege "Abrir no Lichess". Os botões
     `Concluir`/`Foi fácil`/`Foi bom`/`Foi difícil` continuam ativos num bloco
     `done` e re-clicar sobrescreve tempo/feedback.
   - Em `src/ui/Today.tsx`: quando `block.status === 'done'`, ocultar os botões de
     concluir/feedback e mostrar só "Abrir de novo". Opcional: permitir "Refazer"
     explícito que reabre como `pending` de forma intencional.
   - Teste React (jsdom, já há harness): completar um bloco → botões de concluir
     somem; só resta reabrir.

2. **Aba única / standalone perde o app (resto do P1.3).**
   - A detecção de pop-up nulo já existe, mas em aba única o `window.open` navega
     a aba atual. Tornar o "Abrir no Lichess" por bloco uma **âncora real**
     (`<a href={destino} target="_blank" rel="noopener noreferrer">`) que também
     dispara o início do log (timer) no mesmo clique — âncora de gesto do usuário
     não é bloqueada e, em aba única, abre corretamente fora sem matar o app.
   - Manter `window.open` + detecção de null só para os opens programáticos
     (Study), onde não há gesto direto.
   - Teste: clicar no link inicia o log `active` e o link aponta para o destino.

## Prioridade 1 — cobertura de teste que faltou

3. **Testes React/browser dos fluxos restantes** (jsdom, `@testing-library/react`
   já instalado). Cobrir, cada um com seu teste:
   - concluir sem iniciar → mostra "menos de 1 min" e log com 0s;
   - feedback `easy`/`good`/`hard` muda o estágio do recurso no próximo plano;
   - reabrir bloco `done` não recria log `active`;
   - diagnóstico Lichess com NDJSON contendo linha quebrada não derruba a sync
     (mockar `fetch`);
   - criar Study sem OAuth mostra mensagem para conectar.

4. **Smoke PWA repetível** (`src/` ou `test/`): registrar o service worker,
   simular offline, recarregar e garantir que a app shell aparece. Se o ambiente
   de teste não suportar SW de forma estável, documentar a limitação e cobrir o
   máximo possível (ex.: manifest/precache presentes no build).

## Prioridade 2 — refactor (só DEPOIS dos testes acima existirem)

5. **Quebrar `src/app/state.ts`** (~730 linhas) em hooks/módulos por domínio:
   auth Lichess, treino/logs, diagnóstico (Chess.com/Lichess), Study. Sem mudança
   de comportamento; manter a API pública de `useAppState`. Só inicie depois que
   os testes de integração da Prioridade 1 estiverem verdes (rede de segurança).

## Prioridade 3 — endurecimento opcional (menor)

6. `loadLichessOAuthToken`: apagar o registro quando expirado (hoje só retorna
   `undefined`).
7. `aria-label` por bloco nos botões "Abrir no Lichess" (a11y).
8. Nota/observação sobre `getTodayDate` em fuso local (virada de meia-noite).

## PRECISA DE DECISÃO DO DONO (não implementar sem aval)

- **Study sem posições de xadrez**: o PGN do "Study do dia" só tem comentários,
  sem FEN/lances — não há tabuleiro para estudar. Opções: (a) embutir um FEN/
  posição-alvo ou link de puzzle por bloco; (b) ajustar o texto para deixar claro
  que é um resumo, não um tabuleiro. Perguntar ao dono qual caminho.

## FORA DE ESCOPO (congelado — NÃO fazer)

Dashboard de puzzles (`/api/puzzle/dashboard`), fila de repetição espaçada,
cartão pós-sessão, anti-fadiga de recurso, checklist de abertura — são features
de P4/P5, **congeladas pelo dono**. Exigem decisão explícita do dono antes de
qualquer linha de código. Apenas registrar como backlog, não implementar.

## Verificação final
`npm run lint && npm run test && npm run build` verdes; resumo dos commits.
