# Relatorio: Auditoria UX/UI e Pesquisa de Bibliotecas — Claude

- **IA revisora**: Claude (deepseek-v4-pro, opencode)
- **Data**: 2026-06-07
- **App**: `lichess-tutor` (ferramenta pessoal Lichess-first, clean-room)
- **Gate verificado**: `npm run lint` (verde), `npm run test` (22 arquivos, 107 testes, verde), `npm run build` (nao rodado; mudanca e so documentacao)
- **Dev server**: `localhost:5173` funcionando com Vite 8 + React 19.2.7

---

## 1. Resumo executivo

- **A UI atual esta promissora e funcional, mas incompleta em polish visual e cobertura de estados.**
- O fluxo principal `Config -> Hoje -> abrir Lichess -> feedback` esta implementado e testado (107 testes passam).
- CSS proprio, sem dependencia externa de componentes, com 419 linhas bem organizadas — manutenivel para uma pessoa.
- O app nao tem estados de "primeiro uso sem perfil", "sem dados de diagnostico", "offline real" ou "erro de API" visiveis alem do basico.
- Mobile responde bem ao breakpoint `max-width: 560px`, mas a densidade de botoes por bloco (ate 9 botoes/links por card) esta alta para toque.
- Nao ha iconografia; o app usa texto puro, o que e valido como minimalismo mas perde escaneabilidade.
- OAuth Lichess funciona como opt-in; token local e tratado com cuidado. Confirmacao destrutiva (`window.confirm`) existe para "Apagar tudo" mas nao para "Remover conexao" ou "Pular".
- O timer com beep via Web Audio API e uma solucao engenhosa e leve (sem dependencia).
- A hierarquia visual da tela Hoje e funcional mas plana — secoes se acumulam verticalmente (diagnostico, fraquezas, roadmap, sessoes, blocos) sem diferenciacao visual forte.

---

## 2. Mapa do funcionamento atual

### Telas e fluxos reais

| Tela | O que faz | Arquivo principal |
|---|---|---|
| **Shell/loading** | Mostra "Carregando seus dados locais." enquanto IndexedDB e OAuth callback resolvem | `src/ui/App.tsx:9-18` |
| **Config** | Formulario com username Lichess, username Chess.com, faixa (0-800/800-1200), tempo padrao (5/15/30/60), botoes de backup/apagar/OAuth/sinais manuais | `src/ui/Config.tsx` |
| **Hoje** | Plano do dia em sessoes, cada sessao com blocos; cada bloco mostra titulo, meta, razao, tarefa, coach note, stop rule, timer, botoes de acao | `src/ui/Today.tsx` |

### Fluxo real vs `product-flows.md`

| Fluxo documentado | Implementado? | Observacao |
|---|---|---|
| Primeiro uso: ver aviso de app nao oficial | **Nao** | Nao ha disclaimer visivel em lugar nenhum do codigo |
| Primeiro uso: entrar com Lichess username | Sim | Config abre automaticamente (`profile === undefined` -> `activeView='config'`) |
| Opcional: informar username Chess.com | Sim | Campo na Config |
| Receber plano inicial | Sim | `generatePlan()` roda ao salvar perfil |
| Abrir primeira tarefa no Lichess | Sim | Link `Abrir no Lichess` com `target="_blank"` |
| Tela Hoje: tarefa principal, tempo, motivo, abrir, concluir, pular, anotacao | Sim, exceto "anotacao curta" | Nao ha campo de nota livre por bloco |
| Progresso: dias treinados, tarefas, temas fracos, revisoes, evolucao, ultimas mensagens | **Nao** | Nao existe tela Progresso. So ha uma secao "Proximos passos" (roadmap) na Hoje |
| Retorno apos ausencia: sem bronca, reduzir carga | **Nao** | Nao ha logica de deteccao de ausencia |
| Mobile: botoes grandes, texto curto, links claros, sem cards demais | Parcial | Botoes tem `min-height: 40px` (bom), mas cada bloco tem ate 9 acoes visiveis |

### Divergencias com `product-flows.md`

1. **Sem disclaimer de app nao oficial** — exigido pelo spec para o primeiro uso e obrigatorio na versao-comunidade.
2. **Sem tela Progresso** — `product-flows.md` descreve uma tela dedicada; o app so tem Hoje e Config.
3. **Sem "anotacao curta"** por bloco — `product-flows.md` pede mas nao existe campo.
4. **Sem logica de retorno apos ausencia** — o spec de produto descreve mas nao ha codigo.

---

## 3. Auditoria UX/UI

### 3.1 Clareza do fluxo

O fluxo `Config -> Hoje -> abrir Lichess -> timer/log -> feedback` e claro e linear. O estado `profile === undefined` redireciona automaticamente para Config (`src/app/state.ts:144`), o que e correto para primeiro uso. A navegacao por dois botoes (Hoje/Config) e minima e funcional.

**Problema**: o usuario pode ficar preso na Config sem entender que precisa salvar. A mensagem "Salve sua configuracao para gerar o plano local" so aparece na tela Hoje quando nao ha plano (`src/ui/Today.tsx:98`), mas o usuario esta na Config e nao a ve.

### 3.2 Hierarquia visual da tela Hoje

A tela Hoje (`src/ui/Today.tsx:106-246`) empilha verticalmente:

1. Cabecalho (data, sessoes, minutos, foco semanal) + seletor de tempo + botao "Fazer proxima sessao"
2. Faixa de diagnostico (4 botoes + mensagens + link Study)
3. Chips de fraquezas (ate 3, ordenados por score)
4. Roadmap (proximos passos)
5. Lista de sessoes com blocos

**A hierarquia e plana** — todas as secoes tem o mesmo peso visual. Nao ha diferenciacao clara entre "acao principal do dia" e "configuracao/secundario". A faixa de diagnostico com 4 botoes compete visualmente com o plano de treino.

### 3.3 Excesso de botoes

Cada `PlanBlockCard` (`src/ui/Today.tsx:277-385`) mostra ate **9 elementos acionaveis** quando pendente:

- "Abrir no Lichess" (link)
- "Concluir" (botao)
- "Foi facil" (botao)
- "Foi bom" (botao)
- "Foi dificil" (botao)
- "Pular" (botao)

E mais na faixa de diagnostico: "Atualizar Chess.com", "Atualizar Lichess", "Reconciliar puzzles", "Gerar Study" — 4 botoes secundarios.

**Total na tela Hoje**: ate ~13+ botoes/links visiveis simultaneamente. Para uma ferramenta pessoal de estudo diario, isso e excessivo. Os 4 botoes de diagnostico poderiam ser colapsados em um menu ou acao unica "Atualizar diagnostico".

### 3.4 Estados de carregamento, erro, offline, sucesso e vazio

| Estado | Cobertura | Evidencia |
|---|---|---|
| **Loading** | Sim | `App.tsx:9-18` — "Carregando seus dados locais." com `aria-live="polite"` |
| **Erro de carga** | Sim | `App.tsx:43-58` — mensagem + botao Recarregar com `role="alert"` |
| **Erro de API** | Parcial | `diagnosisState='error'` + `diagnosisMessage` mas sem retry automatico visivel |
| **Offline** | Nao | Nao ha deteccao de `navigator.onLine` nem mensagem offline |
| **Sucesso** | Parcial | `statusMessage` na Config apos salvar/exportar; sem toast/toast-like |
| **Vazio (sem diagnostico)** | Sim | `weaknesses.length > 0` condicional em `Today.tsx:204`; se zero, nao mostra chips |
| **Vazio (sem plano)** | Sim | `Today.tsx:94-101` — mensagem "Salve sua configuracao..." |
| **Treino ativo** | Sim | Timer visual + beep + estados `timer-running/timer-over/timer-done/timer-skipped` |
| **Bloco concluido** | Sim | Oculta botoes de acao, mostra so "Abrir de novo" (`Today.tsx:334`) |
| **OAuth conectado/desconectado** | Sim | `Config.tsx:191-207` — `formatLichessConnection()` mostra estado e escopos |

**Falta grave**: sem deteccao de offline. Se o usuario abrir o app sem conexao, o fetch do Lichess/Chess.com vai falhar silenciosamente ou mostrar erro generico, sem indicar que e um problema de rede.

### 3.5 Mobile

O breakpoint em `src/index.css:391-418` e unico (`max-width: 560px`) e cobre bem:
- `align-items: stretch` no shell
- `flex-direction: column` em headings e block headers
- `width: 100%` em botoes e campos
- Grid de 1 coluna na faixa de diagnostico

**Problemas**:
- Botoes nao tem `min-width: 44px` (guideline de toque WCAG) — o CSS define so `min-height: 40px`.
- A densidade de 6 botoes empilhados em cada bloco no mobile cria uma parede de botoes.
- O `select` nativo no mobile abre o picker do OS, o que e aceitavel mas pode ser melhorado com botoes segmentados.

### 3.6 Acessibilidade

| Criterio | Status | Evidencia |
|---|---|---|
| **Nomes acessiveis** | Bom | `aria-label` em nav (`App.tsx:22`) e links (`Today.tsx:317`) |
| **Contraste** | Aceitavel | Fundo `#f4f6f1`, texto `#111827`, botoes `#1f3f36` sobre `#fff` — razao > 7:1 |
| **Foco** | Parcial | `:focus-visible` nao e estilizado em lugar nenhum |
| **Teclado** | Parcial | Botoes e links sao focaveis naturalmente; select nativo funciona |
| **Semantica** | Boa | `<nav>`, `<main>`, `<section>`, `<article>`, `<h1>/<h2>` usados corretamente |
| **aria-live** | Parcial | `aria-live="polite"` no loading e na faixa de diagnostico; `role="alert"` no erro |
| **Reducao de movimento** | Nao | Nao ha `prefers-reduced-motion` no timer beep nem nas transicoes |

**Falta**: `focus-visible` sem estilo proprio — o navegador usa o outline default, que pode ser insuficiente ou inconsistente. Nao ha skip-link. O timer beep nao respeita `prefers-reduced-motion`.

### 3.7 Privacidade

| Criterio | Status |
|---|---|
| Token OAuth local apenas | Sim — `src/infra/storage/appData.ts`, nunca em logs/export |
| PGN nunca persistido | Sim — parse transiente confirmado no spec e nos testes |
| Confirmacao destrutiva | Parcial — `window.confirm` para "Apagar tudo" (`Config.tsx:72`); "Remover conexao" nao tem confirmacao |
| Export backup | Sim — `Config.tsx:53-64`, gera blob JSON com download |
| Dados sensiveis em mensagens | Nao — mensagens de erro sao formatadas por `errorMessages.ts` sem expor tokens |

---

## 4. Problemas prioritarios

| # | Severidade | Problema | Evidencia | Impacto | Correcao recomendada | Risco |
|---|---|---|---|---|---|---|
| 1 | Alta | Sem deteccao de offline | `navigator.onLine` nao usado em lugar nenhum | Usuario sem conexao ve erro generico, nao sabe que e rede | Adicionar `online/offline` event listeners + banner "Sem conexao" | Baixo |
| 2 | Media | Sem disclaimer de app nao oficial | Nao existe no codigo | Inconsistencia com spec; obrigatorio para P5 | Adicionar banner fixo ou texto no primeiro uso | Nenhum |
| 3 | Media | Excesso de botoes por bloco (ate 6) | `Today.tsx:310-381` | Poluicao visual, dificuldade mobile | Agrupar feedback (facil/bom/dificil) em segmented control; esconder Pular atras de confirmao | Baixo |
| 4 | Media | Feedback de sucesso efemero (sem toast) | `statusMessage` em `Config.tsx:186` | Usuario pode nao ver confirmacao de "Configuracao salva." | Usar elemento `aria-live` com auto-dismiss ou adotar Sonner | Baixo |
| 5 | Baixa | Confirmacao destrutiva ausente em "Remover conexao" | `Config.tsx:173-183` | Usuario pode desconectar OAuth sem querer | Adicionar `window.confirm` antes de `onDisconnectLichess` | Nenhum |
| 6 | Baixa | Sem foco visivel customizado | `index.css` — zero regras `:focus-visible` | Navegacao por teclado depende de outline default do browser | Adicionar `:focus-visible` com anel de 2px na cor primaria | Nenhum |
| 7 | Baixa | Botoes abaixo de 44x44px no mobile | `index.css:61` — `min-height: 40px` so | Toque pode ser impreciso em alguns dispositivos | Subir `min-height` para 44px em mobile | Nenhum |
| 8 | Baixa | Sem `prefers-reduced-motion` | Nao ha media query no CSS, nao ha checagem no timer beep | Usuarios com sensibilidade a movimento/audio podem ser afetados | Adicionar media query + suprimir beep quando preferir | Nenhum |

---

## 5. O que melhorar sem biblioteca nova

Mudancas CSS/HTML/React locais, sem dependencias novas:

1. **Disclaimer de app nao oficial**: Adicionar um `<p>` fixo no topo do shell (`App.tsx`) com texto "Ferramenta pessoal independente — nao afiliado ao Lichess.org". (~5 linhas)
2. **Banner offline**: Adicionar `useEffect` com `online`/`offline` events em `App.tsx`; mostrar banner amarelo "Sem conexao — dados locais apenas." quando `!navigator.onLine`. (~15 linhas)
3. **Toast-like status message**: Transformar o `<p className="status-message">` em um elemento com `aria-live="polite"` e auto-dismiss apos 4s usando `useEffect` + `setTimeout`. (~10 linhas)
4. **Reduzir botoes no bloco**: Agrupar "Foi facil" / "Foi bom" / "Foi dificil" em 3 `<button>` dentro de um `<fieldset>`/`<legend>` visual de "Feedback". Esconder "Pular" dentro de collapse ou `<details>`. (~20 linhas)
5. **`focus-visible` customizado**: Adicionar `outline: 2px solid #1f3f36; outline-offset: 2px` para `:focus-visible` em botoes, inputs, selects e links. (~8 linhas CSS)
6. **Aumentar touch target no mobile**: Subir `min-height: 44px` no breakpoint mobile para botoes. (~3 linhas CSS)
7. **`prefers-reduced-motion`**: Adicionar `@media (prefers-reduced-motion: reduce)` suprimindo o timer beep. (~5 linhas)
8. **Confirmacao em "Remover conexao"**: Adicionar `window.confirm` no handler de `onDisconnectLichess` (ou mover a chamada para dentro de `disconnectLichess` com confirmacao la). (~3 linhas)
9. **Mensagem "Salve sua configuracao" visivel na Config**: Quando `profile === undefined` e a view e Config, mostrar um `<p>` informativo no topo do form. (~5 linhas)
10. **Iconografia minima com texto**: Usar caracteres Unicode (nao emoji) como indicadores visuais — ex: `[>]` para abrir, `[✓]` para concluir. (~5 linhas em `Today.tsx`)

**Estimativa total**: ~75 linhas de codigo, sem dependencias novas, < 1 hora de trabalho.

---

## 6. Pesquisa de coisas prontas da comunidade

Pesquisa feita em 2026-06-07 contra documentacao oficial e GitHub/NPM.

### Matriz de candidatos

| Pacote | Uso no app | Licenca | Compatibilidade | Maturidade | Custo | Beneficio | Risco | Recomendacao |
|---|---|---|---|---|---|---|---|---|
| **Radix UI Primitives** | Dialog (confirmacoes), Tooltip, VisuallyHidden, Tabs (futuro) | MIT | React 19, Vite, TS estrito, tree-shakeable | Alta (30k+ estrelas, mantida pela WorkOS) | 0kB CSS, ~2-5kB JS por componente | Acessibilidade de dialog/tooltip pronta; sem lock-in visual | Nenhum | **Adotar agora** |
| **React Aria Components** | Alternativa ao Radix para dialog/select/tooltip com a11y superior | Apache 2.0 | React 19, Vite, TS estrito | Alta (Adobe, 13k+ estrelas) | Maior que Radix (mais abstracao), mas tree-shakeable | A11y de nivel enterprise, i18n, touch/mouse/teclado | Peso de API; curva de aprendizado maior que Radix | **Testar em spike** |
| **shadcn/ui** | Seletivo: copiar so Dialog, Button e Tooltip | MIT (codigo copiado) | Depende de Tailwind + CVA + clsx + tailwind-merge | Alta (116k+ estrelas) | Tailwind e mandatory; reescrever 419 linhas de CSS | Acabamento visual premium, comunidade gigante | Migracao de CSS forcada; Tailwind e lock-in de estilo | **Deixar para depois** |
| **Mantine** | Completo: substituiria todo o CSS e componentes | MIT | React 19, Vite, TS estrito, CSS modules nativo | Alta (30k+ estrelas, 5M+ downloads/mes) | Pesado (~60kB gzip so o core); provider global obrigatorio | 120+ componentes, 70+ hooks, notificacoes, modals, forms | Lock-in visual Mantine; bundle grande para PWA local-first | **Rejeitar** |
| **MUI** | Completo | MIT | React 19, Vite, TS | Alta (98k+ estrelas) | Muito pesado; Emotion CSS-in-JS mandatory | Ecossistema enorme, data grid, date pickers | Bundle enorme (~100kB+), CSS-in-JS runtime, identidade Material Design | **Rejeitar** |
| **Chakra UI** | Completo | MIT | React 19 (v3), Vite, TS | Alta (38k+ estrelas) | Moderado; Emotion/Zag.js | Componentes acessiveis, API simples | Bundle moderado, identidade visual Chakra, Emotion runtime | **Rejeitar** |
| **Sonner** | Toast para feedback de sucesso/erro | MIT | React 18/19, Vite, TS, zero CSS externo | Alta (12.5k+ estrelas, 532k+ dependentes) | Minimo (~3kB gzip) | Toast bonito, acessivel, promisificado, 1 import | Dependencia externa para algo que poderia ser CSS local | **Adotar agora** |
| **lucide-react** | Icones SVG inline para botoes e indicadores | ISC | React, Vite, TS, tree-shakeable por icone | Alta (18k+ estrelas) | ~1kB por icone importado | Icones consistentes, semanticos, acessiveis (`aria-label` incluso) | Dependencia externa; icones Unicode seriam zero-dependency | **Adotar agora** |
| **Recharts** | Graficos para futura tela Progresso | MIT | React, Vite, TS | Alta (24k+ estrelas) | Moderado (~50kB gzip); D3 e dependencia interna | Graficos declarativos, tema customizavel | Peso para PWA; so faz sentido com tela Progresso | **Deixar para depois** |
| **Open Props** | Design tokens CSS (spacing, radius, cores, shadows) | MIT | Framework-agnostic, zero JS | Media | Minimo (~20kB CSS nao comprimido, tree-shake com PostCSS) | Padroniza tokens sem lock-in; compativel com CSS atual | Sobrepoe algumas variaveis CSS existentes | **Testar em spike** |
| **@axe-core/playwright** | Testes de acessibilidade automatizados | MPL 2.0 | Playwright, Node | Alta (Deque Systems) | Configuracao de teste adicional | Detecta violacoes WCAG em screenshots/interacoes | So util com testes Playwright (nao configurados hoje) | **Deixar para depois** |
| **Testing Library user-event** | Ja esta em `devDependencies` como subdep. de `@testing-library/react` | MIT | Vitest, jsdom | Alta | Zero (ja incluso) | `userEvent` e superior a `fireEvent` para simular UX real | Nenhum | **Adotar em novos testes** |
| **Playwright visual** | Screenshots de regressao visual | Apache 2.0 | Playwright, Node | Alta (Microsoft) | Configuracao de projeto Playwright adicional | Garante que mudancas CSS nao quebram layout | Setup complexo; so vale com suite Playwright estabelecida | **Deixar para depois** |
| **Ariakit** | Alternativa ao Radix para dialog, menu, select, tooltip, tabs | MIT | React 19, Vite, TS | Alta (8k+ estrelas) | Similar ao Radix | Acessibilidade solida, API moderna, WAI-ARIA | Ecossistema menor que Radix; menos adopcao | **Deixar para depois** |
| **Headless UI** | Alternativa ao Radix (Tailwind team) | MIT | React 19, Vite, TS | Alta (27k+ estrelas) | Similar ao Radix | Integracao natural com Tailwind se adotar shadcn | Menor portfolio de componentes que Radix (so 10) | **Deixar para depois** |

### Notas de licenca e compatibilidade

- **Radix UI**: MIT, sem restricoes. Pacotes individuais (`@radix-ui/react-dialog`, etc.) ou `radix-ui` unificado. Tree-shakeable. React 19 compativel (peer `react@^16.8 || ^17.0 || ^18.0 || ^19.0`). Nao injeta CSS.
- **Sonner**: MIT, `peerDependencies` declara `react@^18.0.0 || ^19.0.0`. Pacote minimo. CSS importavel (`import 'sonner/dist/index.css'`).
- **lucide-react**: ISC (permissiva). Tree-shakeable por icone. Props: `size`, `color`, `strokeWidth`, `aria-label`. Zero CSS.

---

## 7. Debate

### Tese 1: CSS proprio + primitives pontuais (Radix/React Aria)

**Minimalista defende**: Manter o CSS atual (419 linhas, bem organizado) e so adicionar Radix para Dialog (confirmacao destrutiva acessivel) e Tooltip (explicacoes em hover). Nao trocar o sistema de design. Zero lock-in visual. Menos dependencias = menos breaking changes. O app e pessoal — nao precisa de 120 componentes Mantine.

**Acelerador ataca**: O CSS atual resolve o basico mas cada melhoria (focus-visible, reduced-motion, toast, segmented control) e trabalho artesanal. Radix + Sonner + lucide-react dao isso pronto com a11y testada. O "custo de fazer na mao" e subestimado.

**Guardiao do projeto**: Radix, Sonner e lucide-react sao MIT/ISC, leves, nao injetam estilo proprio, nao violam clean-room. Podem entrar sem risco. React Aria e mais pesado e Apache 2.0 (compativel mas complexo). Mantine e flagrantemente pesado para local-first PWA e cria lock-in visual.

**Voto**: **Adotar CSS proprio + Radix/Sonner/lucide-react pontuais.** Triangulo de forca: CSS local mantido, a11y delegada ao Radix, polish delegado ao Sonner/lucide.

---

### Tese 2: shadcn/ui seletivo

**Acelerador defende**: Copiar so o Dialog e Button do shadcn/ui da acesso a componentes lindos, acessiveis, com codigo aberto que o dono pode modificar. Comunidade gigante. Blocos prontos (dashboard, settings) acelerariam uma tela Progresso futura. O codigo e seu — nao e dependencia de pacote.

**Minimalista ataca**: shadcn/ui obriga Tailwind. Tailwind e uma reescrita completa do CSS (419 linhas viram classes utilitarias). CVA, clsx, tailwind-merge, tw-animate-css sao dependencias adicionais. O app atual e 100% CSS proprio; migrar para Tailwind e uma decisao arquitetural, nao estetica.

**Guardiao do projeto**: Tailwind e valido tecnicamente mas forca um ecossistema de build (PostCSS/Tailwind plugin) e muda radicalmente como o CSS e escrito. Nao ha justificativa para esse custo numa ferramenta pessoal com 419 linhas de CSS funcional.

**Voto**: **Rejeitar shadcn/ui agora.** Se no futuro o app crescer e o CSS proprio virar divida tecnica (1000+ linhas), reavalie. Hoje, 419 linhas e vantagem, nao problema.

---

### Tese 3: Mantine completo

**Acelerador defende**: 120 componentes, 70 hooks, notificacoes, modals, forms, dark mode, combobox — tudo pronto, acessivel, testado. O dono ganharia semanas de desenvolvimento. Customizavel via CSS modules. 30k estrelas, mantido ativamente.

**Minimalista ataca**: Mantine core e ~60kB gzip. Para um PWA local-first, isso e pesado. Provider global obrigatorio (`MantineProvider`). Identidade visual Mantine (mesmo customizada) e reconhecivel. Migrar de 419 linhas CSS proprio para CSS modules Mantine e jogar fora trabalho funcional.

**Guardiao do projeto**: Mantine e excelente, mas para outro tipo de app. Uma ferramenta pessoal local-first com 2 telas nao justifica 60kB de componentes que nunca serao usados. Alem disso, o lock-in visual e real — se o Mantine mudar de rumo, migrar de volta custa caro.

**Voto**: **Rejeitar Mantine.** Otima biblioteca, app errado.

---

### Tese 4: Sem nova biblioteca de UI

**Minimalista defende**: Melhorar o CSS atual, adicionar HTML semantico onde falta, usar `aria-live` e `role="alert"` corretamente. O app ja e 100% funcional. Nao precisa de Radix, Sonner nem lucide-react. Cada dependencia nova e um vetor de breaking change e vulnerabilidade.

**Acelerador ataca**: Dialog acessivel e dificil de fazer certo (foco, escape, backdrop, scroll lock, portal). Tooltip idem. Toast acessivel idem. Fazer isso do zero e arriscar bugs de a11y que bibliotecas da comunidade ja resolveram com anos de testes.

**Guardiao do projeto**: As 3 dependencias propostas (Radix, Sonner, lucide-react) sao leves, MIT/ISC, mantidas, e resolvem problemas dificeis. O custo de NAO usa-las e maior: bugs de a11y que so aparecem com screen readers, foco perdido em dialogs, toast nao anunciado.

**Voto**: **Adotar minimamente (Radix + Sonner + lucide-react).** Nao e "biblioteca de UI" — sao utilitarios pontuais para problemas especificos que sao dificeis de fazer certo.

---

### Tese 5: Biblioteca de dashboard/graficos agora vs depois

**Acelerador**: Adotar Recharts agora para construir a tela Progresso com graficos de evolucao.

**Minimalista**: A tela Progresso nao existe. Nao ha dados historicos ainda. Recharts e 50kB que ficariam sem uso. Adiar ate que a tela Progresso seja projetada.

**Guardiao do projeto**: A tela Progresso esta descrita em `product-flows.md` mas nao implementada. Nao ha decisao de design para ela. Adicionar Recharts agora e pre-otimizacao.

**Voto**: **Deixar para depois.** Projetar a tela Progresso primeiro, depois escolher a biblioteca de visualizacao.

---

### Sintese do debate

| Tese | Consenso | Divergencia |
|---|---|---|
| CSS proprio + primitives | **Consenso: adotar** | React Aria vs Radix? Radix venceu por simplicidade |
| shadcn/ui | **Consenso: rejeitar agora** | Se o CSS proprio crescer muito, reabre o debate |
| Mantine | **Consenso: rejeitar** | Nenhuma |
| Sem biblioteca nova | **Consenso: rejeitar** | As 3 escolhidas sao consideradas "utilitarios", nao "biblioteca de UI" |
| Graficos agora | **Consenso: adiar** | Nenhuma |

---

## 8. Plano recomendado

### Trilha conservadora (recomendada)

**Passo 1 — CSS e HTML sem dependencias (1-2h)**:
- Adicionar disclaimer, banner offline, focus-visible, reduced-motion, min-height 44px mobile.
- Confirmacao em "Remover conexao".
- Agrupar botoes de feedback em layout menos denso.
- Toast-like status message com auto-dismiss.

**Passo 2 — Radix UI Dialog + Sonner (1-2h)**:
- `npm install sonner @radix-ui/react-dialog`
- Substituir `window.confirm` pelo `<Dialog.Root>` do Radix com botoes "Confirmar"/"Cancelar".
- Substituir `statusMessage` por `toast()` do Sonner com `<Toaster />`.
- Manter o CSS proprio; Radix e Sonner so entram como utilitarios.

**Passo 3 — lucide-react (30min)**:
- `npm install lucide-react`
- Substituir indicadores Unicode/texto por icones (`Play`, `Check`, `SkipForward`, `RefreshCw`, `AlertTriangle`, `Wifi`).

**Arquivos provaveis**: `src/ui/App.tsx`, `src/ui/Today.tsx`, `src/ui/Config.tsx`, `src/index.css`, `package.json`.

**Verificacoes**: `npm run lint && npm run test && npm run build` verdes.

**Criterio de abandono**: Se Radix ou Sonner causarem breaking com React 19.2.x, voltar para implementacao local.

---

### Trilha acelerada (nao recomendada para ferramenta pessoal)

- Adotar Tailwind + shadcn/ui Dialog, Button, Tooltip.
- Reescrever 419 linhas de CSS como classes Tailwind.
- **Criterio de abandono**: Se a migracao de CSS levar mais de 4h sem valor proporcional, abortar.

---

### Trilha experimental (curiosidade, nao producao)

- Spike com Open Props como camada de tokens CSS. Se funcionar sem conflitos, adotar como base de variaveis.
- Spike com React Aria para comparar a11y com Radix.
- **Criterio de abandono**: Se qualquer spike levar >2h, abortar e voltar para trilha conservadora.

---

## 9. Backlog pronto para Codex

Cada item e atomico, verificavel e nao viola regras inquebraveis.

### Item 1: Banner offline
- **Objetivo**: Detectar `navigator.onLine` e mostrar banner quando offline.
- **Arquivos provaveis**: `src/ui/App.tsx`, `src/index.css`.
- **Criterio de aceite**: Ao desconectar rede, banner amarelo aparece "Sem conexao — usando dados locais." Ao reconectar, desaparece.
- **Verificacao**: `npm run test`, teste manual com DevTools Network > Offline.

### Item 2: Focus-visible e reduced-motion
- **Objetivo**: Adicionar estilos de foco visivel e respeitar `prefers-reduced-motion`.
- **Arquivos provaveis**: `src/index.css`.
- **Criterio de aceite**: `:focus-visible` mostra anel verde-escuro em todos elementos interativos. Timer beep nao toca se `prefers-reduced-motion: reduce`.
- **Verificacao**: `npm run lint && npm run test`, teste manual com teclado e emulacao de `prefers-reduced-motion`.

### Item 3: Confirmacao destrutiva em Remover conexao
- **Objetivo**: Mostrar dialogo de confirmacao antes de desconectar OAuth.
- **Arquivos provaveis**: `src/ui/Config.tsx` ou `src/app/state.ts`.
- **Criterio de aceite**: Clicar "Remover conexao" mostra confirmacao; so desconecta se confirmado.
- **Verificacao**: Teste manual no browser; `npm run test`.

### Item 4: Radix Dialog para confirmacoes destrutivas
- **Objetivo**: Substituir `window.confirm` por Dialog acessivel do Radix.
- **Arquivos provaveis**: `src/ui/Config.tsx` (Apagar tudo, Remover conexao), `src/ui/ConfirmDialog.tsx` (novo), `package.json`.
- **Criterio de aceite**: Dialog abre com foco no primeiro botao, fecha com Escape, backdrop bloqueia interacao, foco retorna ao botao origem.
- **Verificacao**: `npm run lint && npm run test && npm run build` verdes. Teste manual: teclado (Tab/Enter/Escape), screen reader (NVDA ou narrator).

### Item 5: Sonner para feedback de sucesso/erro
- **Objetivo**: Substituir `<p className="status-message">` por `toast()` do Sonner.
- **Arquivos provaveis**: `src/ui/App.tsx` (adicionar `<Toaster />`), `src/ui/Config.tsx`, `src/ui/Today.tsx`, `package.json`.
- **Criterio de aceite**: Toast aparece no canto inferior direito, anunciado por `aria-live`, desaparece apos 4s. Stack de multiplos toasts.
- **Verificacao**: `npm run lint && npm run test && npm run build` verdes.

### Item 6: lucide-react para icones semanticos
- **Objetivo**: Adicionar icones `Play`, `Check`, `SkipForward`, `RefreshCw` nos botoes principais.
- **Arquivos provaveis**: `src/ui/Today.tsx` (PlanBlockCard), `src/ui/Config.tsx`, `package.json`.
- **Criterio de aceite**: Icones aparecem inline com texto, tamanho 18-20px, `aria-hidden="true"` + `aria-label` no botao.
- **Verificacao**: `npm run lint && npm run test && npm run build` verdes. Teste visual no browser.

### Item 7: Melhorar densidade de botoes no PlanBlockCard
- **Objetivo**: Agrupar botoes de feedback (facil/bom/dificil) visualmente. Mover "Pular" para posicao menos proeminente.
- **Arquivos provaveis**: `src/ui/Today.tsx` (PlanBlockCard), `src/index.css`.
- **Criterio de aceite**: No mobile, botoes de feedback aparecem em linha unica com estilo segmented; "Pular" fica separado. No desktop, mesma melhoria de agrupamento.
- **Verificacao**: `npm run test`; `npm run dev` e checagem visual em 390x844 e 1280x800.

### Item 8: Disclaimer de app nao oficial
- **Objetivo**: Mostrar texto "Ferramenta pessoal independente — nao afiliado ao Lichess.org" no shell.
- **Arquivos provaveis**: `src/ui/App.tsx`, `src/index.css`.
- **Criterio de aceite**: Texto visivel em todas as telas, nao intrusivo (tom cinza, fonte pequena, fixo no rodape do shell).
- **Verificacao**: Teste visual; `npm run test`.

### Item 9 (opcional): Open Props como tokens CSS
- **Objetivo**: Spike para testar se Open Props melhora a consistencia de tokens sem conflitos.
- **Arquivos provaveis**: `src/index.css`, `package.json`.
- **Criterio de aceite**: Se apos 2h os tokens padronizarem spacing/radius/shadows sem quebrar a UI atual, adotar; senao, descartar.
- **Verificacao**: `npm run build`; comparar visualmente antes/depois.

---

## 10. Fontes

- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction) — 2026-06-07: Confirmou primitives open-source MIT, acessiveis, unstyled, tree-shakeable, adocao incremental por componente.
- [shadcn/ui Introduction](https://ui.shadcn.com/docs) — 2026-06-07: Confirmou modelo de codigo aberto copiado, dependencia de Tailwind, CVA, clsx, tailwind-merge, tw-animate-css. Open Code, nao e biblioteca tradicional.
- [React Aria](https://react-aria.adobe.com/) — 2026-06-07: Confirmou componentes style-free com foco enterprise em a11y, touch/keyboard/screen reader, i18n, 13 calendarios e suporte a Tailwind.
- [Mantine](https://mantine.dev/) — 2026-06-07: Confirmou 120+ componentes, 70+ hooks, 30k estrelas, 5M+ downloads/mes, CSS modules nativo, PostCSS preset, v9.3.0 ativa, MCP server para AI agents.
- [Lucide React](https://lucide.dev/guide/react) — 2026-06-07: Confirmou icones SVG inline, tree-shakeable, TypeScript, licenca ISC, props `size`/`color`/`strokeWidth`/`aria-label`.
- [Sonner GitHub](https://github.com/emilkowalski/sonner) — 2026-06-07: Confirmou toast React MIT, 12.5k estrelas, 532k+ dependentes, React 18/19 peer, v2.0.7 ativa.
- [Open Props](https://open-props.style/) — 2026-06-07: Confirmou tokens CSS framework-agnostic, MIT, util para spacing/radius/shadows/cores.
- [Recharts GitHub](https://github.com/recharts/recharts) — 2026-06-07: Confirmou biblioteca React/D3 para graficos, MIT, 24k+ estrelas, componentes declarativos.
- [Playwright Accessibility](https://playwright.dev/docs/accessibility-testing) — 2026-06-07: Confirmou integracao com `@axe-core/playwright`, tags WCAG.
- [Testing Library user-event](https://testing-library.com/docs/user-event/intro/) — 2026-06-07: Confirmou simulacao realista de interacoes, superior a `fireEvent`.
- `AGENTS.md`, `PLANO.md`, `package.json`, `docs/ux/product-flows.md`, `docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md`, `src/ui/App.tsx`, `src/ui/Today.tsx`, `src/ui/Config.tsx`, `src/index.css`, `src/app/state.ts`, `src/app/externalOpen.ts`, `src/smoke.test.tsx`, `src/app/trainingFlow.test.tsx`, `src/app/preserveProgress.test.tsx` — 2026-06-07: Leitura completa do codigo fonte para auditoria.
- `npm run lint` e `npm run test` — 2026-06-07: 22 arquivos de teste, 107 testes passando, ESLint verde.
