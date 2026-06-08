# Relatorio Codex: UX/UI E Pesquisa Comunidade

Data: 2026-06-07
Autor: Codex
Projeto: `lichess-tutor`

## 1. Resumo executivo

- A UI atual e **promissora e funcional**, mas a tela `Hoje` esta mais organizada como painel de operacao do app do que como rotina diaria de treino.
- O primeiro uso em `Config` e limpo no desktop e usavel no mobile; no entanto, mistura configuracao essencial, backup, importacao manual, apagar tudo e OAuth na mesma hierarquia.
- A tela `Hoje` cumpre o loop tecnico `abrir Lichess -> timer/log -> feedback`, mas coloca roadmap e botoes de diagnostico antes da tarefa principal; no mobile, o primeiro botao `Abrir no Lichess` fica abaixo da primeira dobra.
- Em um plano de 15 min, a automacao mediu `1750px` de altura no desktop e `2592px` no mobile, sem overflow horizontal. E responsivo, mas longo demais para uma rotina simples.
- O fluxo diverge de `docs/ux/product-flows.md`: falta aviso claro de app nao oficial no primeiro uso, falta `pular com motivo`, falta anotacao curta e ainda nao existe uma tela real de `Progresso`.
- Acessibilidade de base esta boa porque usa HTML nativo, labels e links reais; os maiores riscos sao hierarquia, foco visual, repeticao de textos visiveis identicos e ausencia de dialog acessivel para acao destrutiva.
- Minha recomendacao principal: **nao migrar para uma UI library completa agora**. Primeiro reorganizar a experiencia com CSS/HTML local, tokens simples e uma camada pequena de componentes locais.
- Bibliotecas prontas que valem considerar em spike: `@radix-ui/react-alert-dialog` ou `@ariakit/react` para dialog destrutivo, `sonner` para feedback nao intrusivo, `lucide-react` apenas se houver botoes iconicos, e `@axe-core/playwright`/Playwright visual para teste.
- Rejeito, por ora, Mantine/MUI/Chakra como troca completa: resolvem polish, mas aumentam identidade de biblioteca, peso e superficie de migracao antes de arrumar o fluxo.
- `shadcn/ui` e interessante, mas so faz sentido se o projeto aceitar Tailwind e ownership de componentes copiados. Hoje seria uma migracao de estilo maior que o problema.

## 2. Mapa do funcionamento atual

### Contrato de produto

O produto e uma PWA local-first pessoal para estudar xadrez no Lichess. `PLANO.md` define o objetivo como: entender fraquezas, gerar plano adaptado por tempo, abrir tarefas no Lichess, registrar progresso e pedir feedback curto. `PLANO.md:15-19`

Guardrails relevantes:

- Sem tabuleiro proprio, sem jogo no app, sem ajuda durante partida ao vivo. `PLANO.md:21-23`
- OAuth e opt-in com escopos minimos `puzzle:read` e `study:write`. `AGENTS.md:34-38`
- P4 sync/backend e P5 comunidade estao congeladas. `PLANO.md:43-44`

### Fluxos previstos

`docs/ux/product-flows.md` pede:

- primeiro uso com aviso claro de app nao oficial, entrada Lichess, perguntas curtas, Chess.com opcional, plano inicial e primeira tarefa;
- tela Hoje com tarefa principal, tempo estimado, motivo, abrir Lichess, concluir, pular com motivo e anotacao curta;
- progresso como habito/habilidade, nao cassino;
- mobile com botoes grandes, texto curto, links externos claros e sem cards demais.

### UI real encontrada

`App.tsx` tem uma estrutura simples: `main.app-shell`, nav com botoes `Hoje` e `Config`, area de erro global e alternancia entre `Config` e `Today`. `src/ui/App.tsx:20-96`

`Config.tsx` contem:

- usernames Lichess/Chess.com pre-preenchidos quando nao ha perfil; `src/ui/Config.tsx:32-35`
- faixa atual e tempo padrao; `src/ui/Config.tsx:114-140`
- salvar, exportar backup, adicionar sinais manuais e apagar tudo; `src/ui/Config.tsx:143-153`
- caixa OAuth Lichess com conectar/remover; `src/ui/Config.tsx:157-184`
- confirm nativo para apagar dados. `src/ui/Config.tsx:71-79`

`Today.tsx` contem:

- cabecalho com data, quantidade de sessoes, tempo e foco semanal; `src/ui/Today.tsx:107-119`
- seletor de tempo e botao de proxima sessao; `src/ui/Today.tsx:121-147`
- faixa de diagnostico com quatro botoes: Chess.com, Lichess, reconciliar puzzles e gerar Study; `src/ui/Today.tsx:150-191`
- chips de fraqueza, se houver; `src/ui/Today.tsx:204-216`
- roadmap antes dos blocos do dia; `src/ui/Today.tsx:218-274`
- cards de bloco com motivo, tarefa, nota do tutor, regra de parada, timer, abrir Lichess, concluir, feedback e pular. `src/ui/Today.tsx:277-370`

### Evidencia por browser

Usei Playwright via runtime bundled do Codex contra `http://127.0.0.1:5173/`.

Artefatos:

- `output/playwright/ux-first-run-desktop.png`
- `output/playwright/ux-first-run-mobile.png`
- `output/playwright/ux-today-desktop.png`
- `output/playwright/ux-today-mobile.png`
- `output/playwright/ux-training-active-desktop.png`
- `output/playwright/ux-block-done-desktop.png`
- `output/playwright/ux-ui-audit-results.json`

Metricas observadas:

| Estado | Viewport | Altura do documento | Overflow horizontal | Observacao |
|---|---:|---:|---|---|
| Config desktop | 1280x800 | 800 | nao | Cabe inteiro; hierarquia limpa. |
| Hoje desktop | 1280x800 | 1750 | nao | Tarefa principal aparece so apos roadmap e integracoes. |
| Treino ativo desktop | 1280x800 | 1801 | nao | Timer visual aparece dentro do card correto. |
| Bloco feito desktop | 1280x800 | 1786 | nao | Acoes destrutivas somem no bloco concluido, bom. |
| Config mobile | 390x844 | 908 | nao | Cabe quase inteiro; botoes grandes. |
| Hoje mobile | 390x844 | 2592 | nao | Muito scroll para um plano de 15 min; primeira acao de treino abaixo da dobra. |

## 3. Auditoria UX/UI

### Clareza

O app comunica bem que existem duas areas: `Hoje` e `Config`. A base visual e sobria e adulta. O problema e que `Hoje` nao prioriza "o que faco agora". Antes do primeiro treino aparecem seletor de tempo, proxima sessao, quatro botoes de diagnostico e roadmap.

Isso cria uma inversao: a ferramenta que deveria reduzir decisao apresenta muitas decisoes operacionais no topo.

### Hierarquia

No desktop, o layout estreito de `560px` definido em `.panel` deixa a leitura confortavel, mas torna a tela Hoje comprida. `src/index.css:36-38`

No mobile, a regra que faz todos os botoes ocuparem 100% funciona para toque, mas amplifica a densidade de acoes: no plano de 15 min surgem 17 botoes e 2 links no documento. `src/index.css:408-413`

### Feedback

O timer e claro: apos abrir o Lichess, aparece "Treinando ha X min". `Today.tsx` tambem remove acoes do bloco feito e troca para `Abrir de novo`, que e uma boa decisao de seguranca. `src/ui/Today.tsx:292-323`

O feedback por bloco (`Foi facil`, `Foi bom`, `Foi dificil`) existe e funciona. O problema e visual: os tres feedbacks competem com `Concluir` e `Pular`, e o usuario pode nao saber se deve clicar em `Concluir` ou diretamente em uma avaliacao.

### Recuperacao de erro

Existe area global com `role="alert"` e botao `Recarregar` quando o load falha. `src/ui/App.tsx:43-57`

Na tela Hoje, mensagens de diagnostico e Lichess ficam dentro de `aria-live="polite"`. `src/ui/Today.tsx:150-201`

Ainda falta diferenciar melhor: erro de API, offline, OAuth ausente, sucesso de backup e estado neutro. Hoje esses estados tendem a virar textos soltos ou mensagens locais.

### Consistencia

Os componentes sao consistentes: botoes primarios verdes, secundarios brancos, perigo vermelho. O estilo e simples e coerente.

Dois pontos reduzem polish:

- microcopy sem acentos (`sessao`, `proxima`, `facil`, `dificil`) em um app PT-BR;
- `button:disabled { cursor: wait; }` faz qualquer botao desabilitado parecer carregando, inclusive `Remover conexao` quando nao ha token. `src/index.css:80-83`

### Mobile

Mobile nao quebra e nao tem overflow horizontal. Isso e bom.

Mas a tela Hoje viola a intencao "texto curto / sem cards demais": em 390x844, a tarefa principal com `Abrir no Lichess` so aparece depois de cabecalho, controles, quatro botoes de diagnostico e quatro cards de roadmap. A rotina diaria deveria colocar o bloco atual primeiro e mover roadmap/diagnostico para baixo ou para secoes recolhidas.

### Acessibilidade

Pontos positivos:

- inputs e selects estao dentro de `label`; `src/ui/Config.tsx:92-140`
- links externos sao links reais com `target="_blank"` e `rel`; `src/ui/Today.tsx:312-317`
- nomes acessiveis dos links incluem o titulo do bloco via `aria-label`; `src/ui/Today.tsx:317`
- estrutura usa `section`, `article`, `nav`, `h1`, `h2`.

Riscos:

- visualmente ha multiplos `Abrir no Lichess`, `Concluir`, `Foi bom`; o `aria-label` resolve para leitor de tela, mas nao para usuario visual;
- nao ha estilo `:focus-visible` dedicado;
- apagar tudo usa `window.confirm`, que e funcional, mas nao permite microcopy rica, detalhe de consequencia nem padrao visual do app;
- nav com dois botoes poderia ser `tabs`/segmented control com estado mais explicito, ou manter botoes mas com `aria-current`.

### Privacidade

A UI respeita a ideia de token local e backup, mas poderia explicar melhor o que o backup nao contem. A mensagem OAuth "Conectar habilita reconciliar puzzles e criar o Study do dia" e boa, mas deveria mostrar escopos autorizados antes de conectar, em linguagem curta.

## 4. Problemas prioritarios

| Severidade | Problema | Evidencia | Impacto | Correcao recomendada | Risco |
|---|---|---|---|---|---|
| P1 | Tarefa principal nao e o primeiro foco da tela Hoje | Roadmap e botoes de diagnostico aparecem antes dos blocos. `src/ui/Today.tsx:150-244`; mobile Hoje tem 2592px de altura | O usuario abre a rotina e precisa procurar o treino | Reordenar: bloco atual primeiro, depois proxima sessao/roadmap, diagnostico recolhido | Baixo, mudanca de composicao |
| P1 | Acoes de diagnostico competem com treino diario | Quatro botoes no topo: Chess.com, Lichess, puzzles, Study. `src/ui/Today.tsx:150-191` | Parece painel tecnico, nao rotina simples | Mover para secao `Diagnostico` recolhida ou para `Config`/painel secundario | Medio se testes esperam texto no topo |
| P1 | `Pular` nao pede motivo | `onSkipBlockTraining(block.id)` direto. `src/ui/Today.tsx:371-379` | Diverge do fluxo e perde sinal pedagogico | Abrir dialog/bottom sheet com 3 motivos curtos + opcional | Baixo/medio |
| P1 | Falta anotacao curta | Nao ha input/textarea em `PlanBlockCard` | O usuario nao registra causa do erro ou insight | Adicionar campo opcional compacto apos concluir/pular, persistido no log ou bloco | Medio, exige tipo/storage/teste |
| P2 | Feedback e conclusao competem | Cada bloco pendente tem `Concluir`, 3 feedbacks e `Pular`. `src/ui/Today.tsx:334-379` | Decisao extra no fim do treino | Trocar para fluxo: `Concluir` abre avaliacao facil/bom/dificil, ou mostrar feedback como segmented control menor | Medio |
| P2 | Tela Config mistura setup, backup, importacao, destruicao e OAuth | `Config.tsx:143-184` | Primeiro uso parece configuracao administrativa | Separar "Essencial", "Dados locais", "Lichess opcional" com hierarquia visual | Baixo |
| P2 | Botao desabilitado usa cursor de espera | `button:disabled { cursor: wait; }` em `src/index.css:80-83` | Sinaliza loading falso | Usar `cursor: not-allowed` por padrao e classe `.is-loading` para sync real | Baixo |
| P2 | Microcopy PT-BR sem acentos | Textos em UI: `Configuracao`, `sessao`, `proxima`, `facil` | Parece prototipo, nao app polido | Permitir acentos nos textos visiveis de UI | Baixo |
| P2 | Falta aviso/disclaimer no primeiro uso conforme fluxo | `Config` comeca direto no formulario | O usuario nao sabe limites: nao oficial, local-first, sem ajuda ao vivo | Inserir nota curta no topo ou rodape do primeiro uso | Baixo |
| P3 | Progresso ainda nao existe como tela propria | `docs/ux/product-flows.md:25-38`; app so tem roadmap | Menos senso de habito/habilidade | Criar resumo minimo depois de estabilizar Hoje, sem gamificacao | Medio |
| P3 | Falta teste automatizado de acessibilidade/visual | Testes React usam `fireEvent`; sem axe/visual baseline | Regressao visual/mobile pode passar | Adicionar Playwright/axe em smoke leve quando UI estabilizar | Medio |

## 5. O que melhorar sem biblioteca nova

1. Reordenar `Today`: bloco atual primeiro, roadmap depois, diagnostico em `<details>` ou secao recolhida.
2. Criar componentes locais pequenos: `SegmentedNav`, `ActionBar`, `StatusPill`, `InlineNotice`, `DangerZone`.
3. Reduzir botoes por bloco: primario `Abrir no Lichess`, secundario `Concluir treino`, link discreto `Pular`.
4. Transformar feedback em etapa pos-conclusao ou controle compacto.
5. Adicionar `:focus-visible` forte e consistente.
6. Corrigir `button:disabled` para nao parecer loading.
7. Melhorar copy visivel com acentos e titulos mais humanos: `Config` -> `Configuracao`, `Gerar Study` -> `Criar Study do dia`.
8. Explicar backup/OAuth com uma linha curta: "Backup nao inclui token Lichess".
9. Usar `details/summary` nativo para diagnostico antes de adotar accordion.
10. Aumentar `panel` para algo como `min(100%, 720px)` na tela Hoje, ou usar duas colunas leves apenas no desktop: treino atual + laterais secundarias.

## 6. Pesquisa de coisas prontas da comunidade

Consulta feita em 2026-06-07 via documentacao oficial, GitHub e `npm view`.

| Pacote | Uso no app | Licenca | Compatibilidade | Maturidade | Custo | Beneficio | Risco | Recomendacao |
|---|---|---|---|---|---|---|---|---|
| Radix UI Primitives | AlertDialog, Dialog, Tooltip, VisuallyHidden, talvez Tabs | MIT | `@radix-ui/react-dialog@1.1.16`, peers React 16-19 | Alta | Baixo por componente | Acessibilidade/focus trap sem estilizar app | Muitos pacotes pequenos; Select e pesado | Testar em spike |
| React Aria Components | Dialog/select/tabs/forms acessiveis | Apache-2.0 | `react-aria-components@1.18.0`, peer lista React ate 19 RC | Alta | Medio | Melhor cobertura touch/screen reader/i18n | API mais ampla e dependencias maiores | Deixar como alternativa |
| Ariakit | Dialog, Select, Tabs, Tooltip | MIT | `@ariakit/react@0.4.29`, peers React 17-19 | Boa | Baixo/medio | Headless completo e WAI-ARIA claro | Menos mainstream que Radix | Testar se Radix nao encaixar |
| Headless UI | Dialog, Disclosure, Menu, Tabs | MIT | `@headlessui/react@2.2.10`, peers React 18/19 | Alta | Medio | Simples, acessivel | Muito associado a Tailwind; cobertura menor | Deixar para depois |
| Base UI | Headless acessivel moderno | MIT | `@base-ui-components/react@1.0.0-rc.0`, peers React 17-19 | Emergente | Medio | Promissor, sem CSS | RC em 2026-06-07 | Rejeitar por ora |
| shadcn/ui | Componentes copiados: Button, AlertDialog, Tabs, Card, Sonner | MIT no projeto oficial; auditar cada registry | Vite suportado; exige Tailwind 4 e config | Alta | Alto para este repo | Acabamento rapido e ownership do codigo | Migracao Tailwind, registries, overwrite/config | Testar apenas em branch/spike |
| Mantine | Troca completa de UI, modals, notifications, forms | MIT | `@mantine/core@9.3.0`, peers React 19.2 | Alta | Alto | 120+ componentes, 70+ hooks, pronto | Identidade Mantine, provider, CSS global, reescrita | Deixar para app maior |
| MUI | Troca completa Material | MIT | `@mui/material@9.0.1`, peers React 17-19 + Emotion | Muito alta | Alto | Muito testado, completo | Visual Material forte, Emotion, peso | Rejeitar para ferramenta pessoal |
| Chakra UI | Troca completa ou componentes pontuais | MIT | `@chakra-ui/react@3.35.0`, React >=18 + Emotion | Alta | Alto | Acessivel e moderno | Provider/Emotion/Ark/Panda, identidade propria | Rejeitar por ora |
| Sonner | Toasts para salvar/importar/backup/API | MIT | `sonner@2.0.7`, peers React 18/19 | Alta | Baixo | Feedback bonito com pouco codigo | Toast pode esconder informacao importante | Adotar agora ou spike curto |
| lucide-react | Icones para acoes secundarias, nav, status | ISC | `lucide-react@1.17.0`, peers React 16-19 | Alta | Baixo | Tree-shakeable, consistente | Icones demais podem infantilizar ou poluir | Adotar seletivo |
| Recharts | Futuro progresso/habito | MIT | `recharts@3.8.1`, peers React 16-19 + `react-is` | Alta | Medio | Graficos declarativos | Chart antes de Progresso real vira enfeite | Deixar para depois |
| Tremor | Dashboards/graficos prontos | MIT provavel, confirmar por pacote | React + Tailwind | Boa | Alto se sem Tailwind | Blocos de dashboard rapidos | Puxa Tailwind e visual SaaS | Rejeitar agora |
| Open Props | Tokens CSS prontos | MIT | `open-props@1.7.23`, framework-agnostic | Boa | Baixo | Spacing/radius/shadow/colors sem trocar React | Importar tudo pode inflar CSS; token externo pode virar muleta | Testar tokens ou copiar valores manualmente |
| Pico CSS | Reset/estilo semantic HTML | MIT | `@picocss/pico@2.1.1`, sem JS | Boa | Medio | HTML semantico bonito rapido | Estiliza tags globalmente; conflito com CSS atual | Rejeitar para repo existente |
| Playwright visual | Screenshots desktop/mobile e fluxos | Apache-2.0 | Runtime bundled funcionou | Muito alta | Medio | Pega regressao visual real | Baselines exigem disciplina | Adotar em smoke futuro |
| @axe-core/playwright | Acessibilidade automatizada | MPL-2.0 | `@axe-core/playwright@4.11.3`, peer playwright-core | Alta | Baixo/medio | Pega contraste, labels, ARIA invalido | Nao substitui teste manual | Adotar em devDependency depois |
| Testing Library user-event | Testes React mais proximos do usuario | MIT | `@testing-library/user-event@14.6.1` | Alta | Baixo | Melhor que `fireEvent` para fluxo UX | Algumas interacoes ainda precisam fireEvent | Adotar agora |

## 7. Debate

### Tese 1: CSS proprio + primitives pontuais

Minimalista: Esta e a melhor rota. O app ja tem HTML nativo e CSS pequeno. Os problemas sao ordem, copy e densidade, nao falta de biblioteca.

Acelerador: Concordo se "primitives pontuais" for real. Dialog destrutivo, tooltip e talvez tabs nao deveriam ser reinventados.

Guardiao do projeto: Tambem concordo. Mantem clean-room, evita dependencia visual pesada e respeita PWA local-first.

Objecao forte: Se a UI crescer para Progresso, OAuth, diagnostico e logs, primitives soltas podem virar design system caseiro mal testado.

Voto Codex: **Aprovar como trilha principal.**

### Tese 2: shadcn/ui seletivo

Minimalista: Nao agora. Tailwind e `components.json` mexem na base do projeto para resolver problemas que sao de fluxo.

Acelerador: shadcn entregaria AlertDialog, Button, Tabs, Card, Sonner e Blocks com acabamento rapido. O modelo copy-paste combina com ownership.

Guardiao do projeto: Cuidado com registries. O prompt clean-room permite open-source, mas todo codigo copiado vira superficie de auditoria. Tailwind tambem altera conventions.

Objecao forte: O custo de migracao e maior que reorganizar `Today.tsx` e `index.css`.

Voto Codex: **Spike isolado somente se a rodada multi-IA convergir forte para Tailwind.**

### Tese 3: Mantine completo

Minimalista: Overkill. O app tem duas telas.

Acelerador: Mantine 9.3 esta muito alinhado a React 19.2, tem modals, notifications, forms e componentes responsivos. Seria o caminho mais rapido para polish consistente.

Guardiao do projeto: Troca completa aumenta dependencia visual e provider global. Pode ser aceitavel num produto maior, mas ainda estamos estabilizando rotina pessoal.

Objecao forte: Mantine resolve polimento, nao resolve a ordem errada da tela Hoje.

Voto Codex: **Deixar para depois.**

### Tese 4: Sem nova biblioteca de UI

Minimalista: Da para resolver 80% com reorganizacao, CSS tokens e `details`.

Acelerador: Sem `sonner`, `user-event` e alguma primitive de dialog, vamos gastar tempo reimplementando partes que a comunidade ja resolveu.

Guardiao do projeto: Sem biblioteca e seguro, mas dialog/focus trap e acessibilidade automatizada sao trabalhos especializados.

Objecao forte: `window.confirm` e ausencia de teste visual vao cobrar juros.

Voto Codex: **Quase, mas nao totalmente. CSS proprio + 2 ou 3 dependencias utilitarias e melhor.**

### Tese 5: Biblioteca de dashboard/graficos

Minimalista: Nao agora. Progresso ainda nao tem contrato de dados claro na UI.

Acelerador: Recharts ou Tremor acelerariam uma tela Progresso quando ela entrar.

Guardiao do projeto: Graficos podem virar cassino visual, contra o proprio fluxo de progresso como habito/habilidade.

Objecao forte: Um resumo textual de dias treinados, tarefas feitas e temas fracos pode servir melhor que grafico.

Voto Codex: **Deixar para depois; se precisar, preferir Recharts a Tremor.**

### Sintese do debate

Consenso: a primeira intervencao deve ser UX estrutural, nao troca de biblioteca.

Divergencia: usar ou nao uma primitive acessivel logo no primeiro ciclo. Meu voto e usar depois que o fluxo for redesenhado, porque agora o maior problema e informacional.

Recomendacao assinada: **Trilha conservadora com primitives pontuais em spike curto.**

## 8. Plano recomendado

### Trilha conservadora

Passos:

1. Reordenar `Today.tsx` para colocar o bloco atual antes do roadmap.
2. Mover diagnostico para secao recolhida.
3. Simplificar acoes por bloco.
4. Ajustar CSS: largura desktop, foco, disabled, spacing.
5. Melhorar microcopy PT-BR.

Arquivos provaveis:

- `src/ui/Today.tsx`
- `src/ui/Config.tsx`
- `src/index.css`
- `src/app/trainingFlow.test.tsx`
- `src/smoke.test.tsx`

Verificacoes:

- `npm run lint`
- `npm run test`
- `npm run build`
- Playwright screenshot desktop/mobile

Criterio de abandono:

- Se a reorganizacao local exigir criar dialog, popover, tabs ou select customizados complexos, parar e usar Radix/Ariakit.

### Trilha acelerada

Passos:

1. Adotar `sonner` para mensagens de sucesso/erro nao criticas.
2. Adotar `@radix-ui/react-alert-dialog` para `Apagar tudo` e `Pular com motivo`.
3. Adotar `lucide-react` em poucos pontos: refresh, external-link, trash, check.
4. Manter CSS proprio.

Arquivos provaveis:

- `package.json`
- `src/ui/App.tsx`
- `src/ui/Config.tsx`
- `src/ui/Today.tsx`
- `src/ui/*.tsx` componentes locais novos
- testes React

Verificacoes:

- `npm install`
- `npm run lint && npm run test && npm run build`
- teste manual de teclado no dialog

Criterio de abandono:

- Se o bundle ou a complexidade de providers crescer sem ganho claro de UX.

### Trilha experimental

Passos:

1. Criar branch/spike com shadcn + Tailwind.
2. Migrar apenas Button, AlertDialog, Tabs e Card.
3. Comparar screenshot antes/depois e tamanho do bundle.
4. Nao mesclar sem aprovacao explicita do dono.

Arquivos provaveis:

- `package.json`
- `vite.config.ts`
- `tsconfig*.json`
- `src/index.css`
- `src/components/ui/*`
- `src/ui/*`

Verificacoes:

- diff de package/config
- screenshots
- `npm run lint && npm run test && npm run build`

Criterio de abandono:

- Se Tailwind dominar a mudanca, se componentes copiados forem dificeis de auditar, ou se a UI ficar "SaaS template" em vez de ferramenta pessoal.

## 9. Backlog pronto para Codex

| Item | Objetivo | Arquivos provaveis | Criterio de aceite | Verificacao |
|---|---|---|---|---|
| UX-01 | Colocar bloco atual antes do roadmap | `Today.tsx`, `index.css`, testes | Em mobile, primeiro `Abrir no Lichess` aparece na primeira dobra ou muito perto dela | Playwright 390x844 + `npm test` |
| UX-02 | Recolher diagnostico | `Today.tsx`, `index.css` | Botoes Chess.com/Lichess/Puzzles/Study ficam em secao `Diagnostico` fechada por padrao ou abaixo do treino | Screenshot desktop/mobile |
| UX-03 | Simplificar acoes do bloco | `Today.tsx`, `trainingFlow.test.tsx` | Bloco mostra uma acao primaria clara e feedback nao compete com abrir/concluir | Testing Library |
| UX-04 | Pular com motivo | `Today.tsx`, dominio/storage se necessario | `Pular` pede motivo curto e salva no log/bloco; cancelar nao pula | Unit + React test |
| UX-05 | Anotacao curta pos-treino | `types.ts`, storage, `Today.tsx` | Usuario consegue salvar nota curta sem PGN/token/PII; export respeita privacidade | Unit + backup test |
| UX-06 | Corrigir estados de botao | `index.css` | Disabled nao usa cursor wait; loading real tem classe distinta | CSS check + visual |
| UX-07 | Foco visivel | `index.css` | Teclado mostra foco claro em buttons, links, inputs e selects | Teste manual/Playwright screenshot |
| UX-08 | Microcopy PT-BR polida | `Today.tsx`, `Config.tsx`, testes por texto | Textos visiveis usam acentos e termos consistentes | `npm test` atualizado |
| UX-09 | Config em secoes | `Config.tsx`, `index.css` | Primeiro uso separa essencial, dados locais e Lichess opcional | Screenshot mobile |
| UX-10 | Spike AlertDialog | `package.json`, componente local | Apagar tudo usa dialog acessivel com confirmacao clara; sem regressao | Keyboard test + build |
| UX-11 | Sonner para feedback nao critico | `package.json`, `App.tsx`, handlers | Salvar/exportar/importar mostram toast; erros criticos continuam inline | React test |
| UX-12 | Teste visual baseline | devDependencies/config ou script local | Captura Config/Hoje desktop/mobile em comando documentado | Playwright script |
| UX-13 | user-event nos testes de fluxo | testes React | Substituir `fireEvent` onde ha clique/typing de usuario | `npm test` |
| UX-14 | Progresso minimo sem grafico | `Today.tsx` ou nova `Progress.tsx` | Mostra dias treinados, tarefas feitas e temas fracos sem gamificacao | Teste + screenshot |

## 10. Fontes

Acesso em 2026-06-07.

- `AGENTS.md`: confirmou guardrails de clean-room, APIs oficiais, sem tabuleiro proprio, sem ajuda ao vivo, OAuth minimo e workflow.
- `PLANO.md`: confirmou objetivo PWA local-first, P0-P3 concluidas e P4/P5 congeladas.
- `docs/ux/product-flows.md`: confirmou expectativas de primeiro uso, Hoje, Progresso e Mobile.
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility): confirmou foco em WAI-ARIA, focus management e navegacao por teclado.
- [Radix UI Styling](https://www.radix-ui.com/primitives/docs/guides/styling): confirmou primitives sem estilo e compativeis com qualquer CSS.
- `npm view @radix-ui/react-dialog`: confirmou MIT, versao `1.1.16`, peers React 16-19.
- `npm view @radix-ui/react-select`: confirmou MIT, versao `2.3.0`, peers React 16-19.
- [React Aria Accessibility](https://react-spectrum.adobe.com/react-aria/accessibility.html): confirmou semantica, screen reader e teclado, com responsabilidade do app por labels.
- [React Aria Quality](https://react-aria.adobe.com/quality): confirmou foco em acessibilidade, internacionalizacao e interacoes.
- `npm view react-aria-components`: confirmou Apache-2.0, versao `1.18.0`.
- [Ariakit Components](https://ariakit.com/components): confirmou Dialog, Select, Tabs, Tooltip e padroes WAI-ARIA.
- `npm view @ariakit/react`: confirmou MIT, versao `0.4.29`, peers React 17-19.
- [Headless UI](https://headlessui.com/): confirmou componentes sem estilo e acessiveis para React.
- `npm view @headlessui/react`: confirmou MIT, versao `2.2.10`, peers React 18/19.
- [Base UI About](https://base-ui.com/react/overview/about): confirmou biblioteca headless acessivel dos criadores de Radix/MUI/Floating UI.
- `npm view @base-ui-components/react`: confirmou MIT e estado `1.0.0-rc.0`.
- [shadcn/ui Vite](https://ui.shadcn.com/docs/installation/vite): confirmou instalacao em Vite e exigencia de Tailwind.
- [shadcn/ui components.json](https://ui.shadcn.com/docs/components-json): confirmou configuracao, paths e registries.
- [shadcn/ui Registry](https://ui.shadcn.com/docs/registry/getting-started): confirmou modelo de registry/copy into project.
- [Mantine](https://mantine.dev/): confirmou versao 9.3.0, 120+ componentes, 70+ hooks, CSS nativo e popularidade.
- `npm view @mantine/core`: confirmou MIT, versao `9.3.0`, peers React 19.2.
- [MUI Overview](https://mui.com/material-ui/getting-started/): confirmou biblioteca React completa, open-source, Material Design e pronta para producao.
- [MUI Installation](https://mui.com/material-ui/getting-started/installation/): confirmou peer dependencies React 17-19 e Emotion.
- `npm view @mui/material`: confirmou MIT, versao `9.0.1`.
- [Chakra UI Components](https://chakra-ui.com/docs/components/concepts/overview): confirmou catalogo amplo de componentes acessiveis.
- `npm view @chakra-ui/react`: confirmou MIT, versao `3.35.0`, React >=18 e Emotion.
- [Lucide](https://lucide.dev/): confirmou icones SVG leves, customizaveis, tree-shakeable e licenca ISC.
- `npm view lucide-react`: confirmou ISC, versao `1.17.0`.
- [Sonner Getting Started](https://sonner.emilkowal.ski/getting-started): confirmou `<Toaster />` e `toast()`.
- [Sonner GitHub](https://github.com/emilkowalski/sonner): confirmou MIT, uso e maturidade comunitaria.
- `npm view sonner`: confirmou MIT, versao `2.0.7`, peers React 18/19.
- [Recharts GitHub](https://github.com/recharts/recharts): confirmou chart library React/D3 e MIT.
- `npm view recharts`: confirmou MIT, versao `3.8.1`, peers React 16-19 e `react-is`.
- [Tremor](https://npm.tremor.so/): confirmou componentes React/Tailwind para dashboards e charts.
- [Open Props](https://open-props.style/): confirmou tokens CSS MIT, framework-agnostic.
- `npm view open-props`: confirmou MIT, versao `1.7.23`.
- [Pico CSS](https://picocss.com/): confirmou framework CSS minimalista para HTML semantico, MIT.
- `npm view @picocss/pico`: confirmou MIT, versao `2.1.1`.
- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots): confirmou `toHaveScreenshot()` para regressao visual.
- [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing): confirmou integracao com `@axe-core/playwright` e limites de testes automatizados.
- `npm view @axe-core/playwright`: confirmou MPL-2.0, versao `4.11.3`.
- [Testing Library user-event](https://testing-library.com/docs/user-event/intro/): confirmou simulacao de interacoes mais realista que `fireEvent`.
- `npm view @testing-library/user-event`: confirmou MIT, versao `14.6.1`.
