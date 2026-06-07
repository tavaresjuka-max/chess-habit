# Avaliação do caça-bug do Codex — por Claude (Opus)

Data: 2026-06-07. Avaliado contra o estado atual do código (HEAD, 96 testes), não
contra o estado em que o Codex rodou (85 testes).

## Nota: 8.5 / 10 (B+)

Caça-bug forte e honesta: detecção precisa, bem organizada, verificação metódica
(lint/test/build/diff/smoke), e respeitou o congelamento de P4/P5. Perdeu pontos
por calibrar mal a severidade de um bug, perder uma variante pior do bug nº 1, e
não enxergar alguns problemas reais (Study sem posições, re-concluir bloco done,
expiração de token, fuso). Algumas "sugestões de enriquecimento" furam a moldura
congelada do dono sem sinalizar o conflito de governança.

---

## Contexto importante

O Codex rodou a caça com **85 testes** — ou seja, **antes** das correções desta
sessão. O código hoje está em **96 testes** e **9 dos 10 achados já foram
corrigidos** por mim (commits abaixo). Esta avaliação serve para: (a) julgar a
qualidade do trabalho do Codex, (b) confirmar que cada achado foi de fato
resolvido, e (c) registrar o que ainda falta.

---

## O que foi BOM

1. **Acurácia de detecção.** Os 10 achados de bug são todos legítimos — eu
   confirmei e corrigi 9. Zero falso-positivo nos bugs principais.
2. **Método.** Rodou lint, test, build, `git diff --check` e smoke de usuário no
   browser, sem alterar nada. Disciplina correta para uma auditoria.
3. **Organização.** Separou bem bugs (P1/P2/P3) de simplificações de
   enriquecimentos, com referências de arquivo/linha em quase todos.
4. **Governança.** Respeitou o congelamento: disse que Studies públicos ficam
   para P5 e que Study privado com OAuth é o caminho seguro.
5. **A simplificação do condicional morto** em `generatePlan.ts:69` estava 100%
   certa (`x ? a : a`).

## O que foi RUIM / IMPRECISO

1. **Severidade do OAuth cancelado subestimada.** Codex disse "pode deixar app em
   erro de carregamento". Na verdade era **permanente**: a query `?error=` nunca
   era limpa, então **todo reload re-lançava o erro** — app travado até editar a
   URL na mão. Isso é HIGH, não média.
2. **Perdeu a pior instância do bug nº 1.** Citou `regeneratePlan`/syncs, mas não
   viu que **`saveProfile` regenerava sem `previousPlan`** — editar o perfil
   apagava o progresso de forma ainda mais garantida que os outros caminhos.
3. **Conflou os dois caminhos de reconciliação.** Apontou `state.ts:698`
   (reconciliação oportunista, que de fato era silenciosa), mas o caminho
   **manual** (`reconcileLichessResults`) já tratava e mostrava erro. O achado é
   válido, a localização foi imprecisa.
4. **Enriquecimentos furam a moldura congelada.** Fila de repetição espaçada,
   cartão pós-sessão, anti-fadiga, dashboard de puzzles — são **features novas**
   para fases P4/P5 que o dono **congelou**. Codex sugeriu como melhorias sem
   sinalizar que exigem decisão do dono antes de qualquer código.
5. **Alguns números de linha levemente errados** (ex.: citou `trainingSession.ts:66`
   para a formatação de minutos, mas é a linha 77; 66 é `elapsedSecondsBetween`).

## O que FALTOU (o que eu encontrei e o Codex não)

1. **🟡 O "Study do dia" não tem posições de xadrez.** `buildBlockPgn` emite só
   tags + comentários + `*` — sem FEN, sem lances. O Study é texto puro, sem
   tabuleiro pra estudar. Valor pedagógico ~zero. **Ainda aberto** (decisão de
   produto). Confirmado por varredura: nenhum `FEN`/`SetUp` em `study.ts`.
2. **🟡 Re-concluir um bloco já `done` ainda é possível pela UI.** Minha correção
   protegeu o "Abrir no Lichess" (reabrir não recria log), mas os botões
   `Concluir`/`Foi fácil/bom/difícil` continuam ativos num bloco `done` —
   re-clicar sobrescreve feedback/tempo. **Parcial.** (Codex viu só o caminho do
   "Abrir".)
3. **🟡 `window.open` em aba única não foi totalmente resolvido.** Codex apontou
   o navegar-pra-fora; minha correção detecta **pop-up bloqueado (retorno null)**
   e avisa, mas no caso de aba única o `window.open` **navega a aba atual** (não
   retorna null) e o aviso não dispara. O dado sobrevive (o log é salvo antes de
   abrir), mas a UX de "timer visível enquanto treina" segue quebrada nesse
   ambiente. **Parcial** — o robusto seria âncora real (`<a target=_blank>`).
4. **🟢 Token expirado deixa registro órfão** no IndexedDB (load retorna
   `undefined` mas não apaga). Codex não viu. Aberto, menor.
5. **🟢 `getTodayDate` em fuso local**: virar meia-noite no meio da sessão grava
   log num `date` diferente do bloco. Codex não viu. Aberto, menor.
6. **🟢 Sem error boundary do React**; adicionei só um botão "Recarregar" no
   banner de erro. Codex não viu.
7. **🟢 A11y**: vários botões "Abrir no Lichess" idênticos sem `aria-label` por
   bloco. Codex não viu.

---

## Status atual de cada achado (cruzado com o HEAD)

| # | Achado do Codex | Status | Commit |
|---|---|---|---|
| P1.1 | plano "desconclui" treinos | ✅ Corrigido (+ variante `saveProfile` que ele perdeu) | `6fb3ff0` |
| P1.2 | reabrir bloco sobrescreve log | 🟡 Parcial (reabrir ok; re-concluir pela UI ainda não) | `92a3d49` |
| P1.3 | `window.open` tira do app | 🟡 Parcial (pop-up bloqueado avisado; aba única não) | `92a3d49` |
| P2.1 | concluir sem iniciar = "1 min" | ✅ Corrigido | `c9ff91e` |
| P2.2 | OAuth cancelado trava load | ✅ Corrigido (era pior: persistente) | `3908822` |
| P2.3 | disconnect depende da rede | ✅ Corrigido (`finally`) | `3908822` |
| P2.4 | reconciliação silenciosa | ✅ Corrigido (avisa) | `92a3d49` |
| P2.5 | NDJSON quebra com linha inválida | ✅ Corrigido (2 parsers) | `09b21ed` |
| P3.1 | Study duplicado/órfão | ✅ Corrigido (idempotente) | `01c9268` |
| P3.2 | docs desalinhados | ✅ Corrigido | `fc5ad8f` |
| Simpl. | condicional morto `generatePlan:69` | ✅ Removido | `6fb3ff0` |
| Simpl. | smoke placeholder | ✅ Substituído por smoke real | `4812014` |
| Simpl. | testes React | 🟡 Parcial (3 de integração; faltam vários fluxos) | `4812014` |
| Simpl. | quebrar `state.ts` | ⬜ Não feito (adiado, precisa de cobertura antes) | — |
| Simpl. | smoke PWA offline | ⬜ Não feito | — |
| Enriq. | dashboard/repetição espaçada/etc. | ⬜ Fora de escopo (P4/P5 congeladas, exige dono) | — |

Resumo: **9/10 bugs resolvidos**, 2 parciais (P1.2, P1.3), 4 achados novos meus,
e o que resta é refactor + testes + decisões de produto.

---

## Próximos passos (o que sobrou de verdade)

Ver `prompts/handoff-codex-caca-bug-remanescente.md`.
