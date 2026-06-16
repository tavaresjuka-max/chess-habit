# Handoff Codex — Corte A: Mobile/Acessibilidade

Data: 2026-06-14
Autorizacao: Claude (Diretor) via `docs/review/relatorio-claude-arbitragem-nota-95-2026-06-13.md`

## Contexto

Este e o primeiro corte do plano de maturidade do `lichess-tutor`. O app e uma PWA pessoal
local-first (React + Vite + TypeScript + Dexie) sem backend. P4/P5 continuam congeladas. O dono
usa o app diariamente no celular. A auditoria Codex de 2026-06-13 apontou que o mobile continua
denso; este corte resolve isso sem tocar logica de negocio, APIs ou dados.

## Gate De Entrada

Antes de comecar, verificar que o repositorio esta no estado esperado:

```
npm run lint   # deve ser verde
npm run test   # deve ser verde (>= 370 testes)
npm run build  # deve ser verde
```

Se qualquer gate falhar, parar e reportar antes de continuar.

## Objetivo Do Corte A

Reduzir fricao no uso diario do dono no celular (viewport 390px) sem redesenhar o produto,
sem mudar paleta de cores, sem alterar logica de negocio e sem criar novos componentes.

As tres areas de melhoria:
1. Densidade de conteudo em 390px nas telas Hoje, Progresso e Config.
2. Contraste WCAG AA nos dois temas (claro e escuro).
3. Acessibilidade de teclado nos controles criticos.

## Contrato Que Nao Pode Ser Violado

- Nao mudar paleta de cores, tokens de design ou identidade visual.
- Nao criar novos componentes de UI.
- Nao alterar logica de negocio, state.ts, infra ou dominio.
- Nao abrir P4/P5.
- Nao adicionar dependencias novas.
- Nao mudar fluxo de dados ou contratos de props entre componentes.

## Tarefa 1 — Baseline Visual (screenshots antes)

Gerar screenshots Playwright das tres telas no viewport 390px antes de qualquer mudanca.
Salvar em `output/playwright/corte-a-before-*.png`.

Telas a capturar:
- Hoje (tela inicial)
- Progresso (terceira aba)
- Config (quarta aba)

## Tarefa 2 — Mapa De Problemas

Inspecionar cada tela em 390px e listar:
- Elementos que estouram a largura ou ficam cortados.
- Textos menores que 14px no mobile.
- Botoes/alvos touch menores que 44px de altura ou largura.
- Informacoes criticas visíveis somente em hover (sem equivalente touch).
- Espacamento entre elementos interativos menor que 8px.

Nao corrigir ainda — apenas mapear e listar.

## Tarefa 3 — Contraste

Verificar nos dois temas (claro: `prefers-color-scheme: light`; escuro: `prefers-color-scheme: dark`):
- Texto sobre fundo: minimo 4,5:1 (AA normal).
- Texto grande (>= 18px ou >= 14px bold): minimo 3:1.
- Elementos de interface (bordas de input, icones de estado): minimo 3:1.

Focar nos tokens definidos em `src/index.css`. Se um token falha em contraste, ajustar o valor
do token — nao do componente. Documentar cada ajuste.

## Tarefa 4 — Alvos Touch E Espacamento

Para cada botao de acao critico abaixo, garantir altura e largura >= 44px:
- Botoes Facil / Bom / Dificil (feedback de bloco)
- Botao Concluir bloco
- Botao Atualizar (Chess.com / Lichess na tela Hoje)
- Botao Salvar (Config)
- Botao de expandir/colapsar cada Fold

Se um botao nao atingir 44px com o conteudo atual, aumentar padding — nunca esconder conteudo.

## Tarefa 5 — Acessibilidade De Teclado

Verificar nos componentes Fold e nos botoes de acao:
- Tab navega pelos controles na ordem esperada (topo para baixo, esquerda para direita).
- Enter/Space ativa o controle focado.
- Foco visivel nao desaparece ao colapsar um Fold (foco deve mover para o trigger).
- Controles desabilitados nao recebem foco (exceto quando necessario para comunicar estado).

Inspecionar `src/ui/Fold.tsx` e componentes de acao em `src/ui/` ou `src/components/`.

## Tarefa 6 — Densidade Mobile

Para cada tela, reduzir densidade onde o mapa (Tarefa 2) identificou problemas:
- Aumentar `gap` ou `padding` entre elementos empilhados em mobile se estiver abaixo de 8px.
- Reduzir texto de label secundario (subtitulos, hints) que compete com texto principal.
- Garantir que secoes Fold colapsadas mostrem titulo + indicador de estado em uma linha,
  sem truncamento de texto no titulo em 390px.
- Nao esconder conteudo critico — apenas reorganizar ou aumentar espacamento.

Usar media queries existentes ou tokens CSS em `src/index.css`. Nao criar novos breakpoints.

## Tarefa 7 — Screenshots Depois E Diff

Gerar screenshots Playwright das mesmas tres telas em 390px apos as mudancas.
Salvar em `output/playwright/corte-a-after-*.png`.

Verificar nos screenshots:
- Nenhum elemento ultrapassa 390px de largura.
- Titulos de Fold nao ficam truncados.
- Botoes de acao sao claramente clicaveis.
- Espacamento entre secoes e visivelmente mais respirado.

## Gate De Saida (DoD)

Todos os itens abaixo devem ser verdadeiros antes do commit:

- [ ] `npm run lint` verde
- [ ] `npm run test` verde (nenhum teste novo quebrado, contagem >= entrada)
- [ ] `npm run build` verde
- [ ] Screenshots before/after em `output/playwright/corte-a-*.png`
- [ ] Zero overflow horizontal em 390px (verificado por Playwright)
- [ ] Botoes criticos com alvos >= 44px (verificado por inspecao CSS)
- [ ] Contraste AA verificado nos dois temas
- [ ] Fold abre/fecha com Tab + Enter sem perder foco
- [ ] Nenhuma mudanca em arquivos de logica de negocio (state.ts, domain/, infra/)

## Commit

Um commit unico ao final:

```
feat: Corte A — mobile density, touch targets, a11y keyboard focus

- reduced padding/gap issues at 390px across Hoje, Progresso, Config
- touch targets >= 44px for critical action buttons
- WCAG AA contrast verified in light and dark themes
- Fold keyboard navigation: Tab/Enter, focus preserved on collapse
```

## Depois Do Corte A

Ao concluir, reportar:
1. Lista de ajustes aplicados (arquivo, linha, antes/depois).
2. Lista de problemas mapeados mas deixados para depois (com justificativa).
3. Screenshots before/after.
4. Resultado dos gates (lint/test/build).

O proximo corte apos aprovacao do dono sera o Corte B (backup shape guards).
