# Relatório de Auditoria UX/UI e Pesquisa de Comunidade - Gemini (2026-06-07)

## 1. Resumo Executivo

- **Status da UI Atual:** **Promissora e Altamente Funcional.** O aplicativo atual é extremamente leve, focado na rotina de estudo e livre de distrações ou dinâmicas de engajamento artificial (cassinização).
- **Desempenho e Arquitetura:** O carregamento inicial local-first funciona sem latência. A separação do domínio sem rede e infraestrutura reativa é excelente.
- **Problema de Densidade Visual (Cards):** A listagem de treinos exibe 5 botões de ação simultâneos por card de bloco ("Concluir", "Foi fácil", "Foi bom", "Foi difícil", "Pular"). Isso gera sobrecarga cognitiva e polui a visualização, especialmente em dispositivos móveis.
- **Desperdício de Espaço no Desktop:** A interface está travada em uma coluna central estreita (`560px`). No desktop, isso empilha todo o conteúdo verticalmente e exige rolagem desnecessária, desperdiçando o espaço horizontal útil de telas maiores.
- **Estética e Feedback de Ações:** O salvamento de configurações e a conclusão de diagnósticos dependem de mensagens de texto simples e estáticas que se misturam ao layout, dificultando a percepção imediata do usuário sobre o sucesso da ação.
- **Acessibilidade:** A estrutura semântica HTML está bem implementada. No entanto, a ausência de estilos customizados para foco do teclado (`:focus-visible`) e a falta de contraste nos botões secundários prejudicam a acessibilidade prática.
- **Diretriz de Dependências:** Bibliotecas pesadas de UI completa (como Mantine, MUI e Chakra UI) ou que exigem lock-in de estilização (como shadcn/ui com Tailwind CSS) devem ser **rejeitadas** para preservar a leveza e a flexibilidade do CSS Vanilla do projeto.
- **Recomendação Tecnológica:** Adotar **Lucide React** para iconografia elegante, **Sonner** para toasts de notificação dinâmicos e melhorar o CSS Vanilla nativo com um layout responsivo de duas colunas no desktop, unificando o fluxo de feedback de conclusão diretamente no card.

---

## 2. Mapa do Funcionamento Atual

O código atual expõe as seguintes telas e fluxos de interação:

1. **Aba de Configuração (`src/ui/Config.tsx`):**
   - Funciona como onboarding e painel de preferências. Permite editar os nomes de usuário do Lichess e Chess.com, selecionar a faixa de rating (`0-800` ou `800-1200`) e definir o tempo padrão de sessão (`5`, `15`, `30`, `60` minutos).
   - Oferece botões de ações locais: Salvar, Exportar backup JSON, Adicionar sinais manuais (onboarding/ChessKing) e Apagar tudo.
   - Gerencia a conexão OAuth do Lichess (Conectar, Reconectar e Remover conexão).

2. **Aba Hoje (`src/ui/Today.tsx`):**
   - **Cabeçalho:** Mostra a data, o número de sessões e o tempo total do plano, além do foco semanal ativo.
   - **Seletor de Tempo Rápido:** Permite alterar os minutos da sessão atual e gerar uma sessão extra ("Fazer próxima sessão").
   - **Barra de Diagnóstico e Ações Lichess:** Permite atualizar dados do Chess.com, Lichess, reconciliar puzzles e gerar o Study do Lichess.
   - **Fraquezas Ativas:** Exibe as 3 fraquezas dominantes calculadas a partir dos sinais (ex: "garfos", "peças penduradas").
   - **Roadmap ("Próximos passos"):** Lista os blocos futuros planejados para treino.
   - **Lista de Sessões e Blocos:** Agrupa as tarefas em blocos com timer integrado. Clicar em "Abrir no Lichess" inicia o timer local. Clicar em "Concluir" ou nos feedbacks de dificuldade finaliza o bloco e salva o log localmente.

### Divergências em relação a `docs/ux/product-flows.md`

- **Aviso de App Não Oficial:** O fluxo de "Primeiro Uso" do documento prevê um aviso destacado e claro de que o app é independente e não oficial. Atualmente, esse aviso não possui um banner ou destaque visual dedicado, aparecendo de forma indireta apenas na caixa de conexão do Lichess OAuth.
- **Aba Progresso:** O documento prevê uma tela ou seção dedicada para "Progresso" (dias treinados, tarefas concluídas, temas fracos, evolução). No código atual, a visualização está unificada na tela "Hoje" através dos chips de fraquezas e do roadmap. Embora atenda a necessidade pessoal, uma reorganização futura pode isolar melhor o histórico de treinos.

---

## 3. Auditoria UX/UI

### Heurísticas Avaliadas

- **Clareza de Fluxo e Decisão:**
  - O fluxo de treino é funcional, mas a coexistência de "Concluir" ao lado de botões de feedback direto ("Foi fácil", "Foi bom", "Foi difícil") causa hesitação cognitiva. O usuário se pergunta se deve clicar em "Concluir" ou em uma das opções de dificuldade.
- **Hierarquia Visual:**
  - A barra de diagnóstico ("Atualizar Chess.com", "Atualizar Lichess", etc.) no topo da tela Hoje compete visualmente com as sessões práticas. Os botões possuem pesos semelhantes, diluindo a prioridade da sessão do dia.
  - Os títulos das sessões ("Sessão 1", "Sessão 2") são exibidos com tamanho de fonte muito discreto, fazendo com que os blocos pareçam uma lista contínua e amorfa.
- **Feedback de Interação (Feedback Loops):**
  - O timer sonoro (beep via Web Audio API) e visual funciona perfeitamente ao estourar o tempo combinado.
  - A confirmação de ações críticas (ex: configurações salvas, atualização de diagnósticos) ocorre via strings de texto comuns abaixo das seções (`Config.tsx#L186`, `Today.tsx#L194`). Essas mensagens estáticas não atraem a atenção do olhar e podem sumir da tela dependendo do scroll.
- **Mobile First e Quebras de Layout:**
  - O media query atual (`index.css#L391-L419`) força todos os botões a ocuparem `width: 100%`. Em telas estreitas (390px), os 5 botões de controle de cada card de treino são empilhados verticalmente, criando blocos gigantescos de botões que dobram a altura física do card e prejudicam a escaneabilidade.
- **Acessibilidade (a11y):**
  - **Semântica:** O HTML5 é bem utilizado (`main`, `nav`, `section`, `article`, `header`). Os formulários e labels estão associados corretamente.
  - **Teclado:** A falta de customização da pseudo-classe `:focus-visible` faz com que o navegador use o outline padrão (muitas vezes invisível ou pouco contrastante contra o fundo do app), dificultando o acompanhamento visual do foco durante a tabulação.
  - **Contraste:** Os botões secundários (`.secondary-button`) usam texto escuro em fundo branco com borda cinza. A diferenciação entre o estado inativo e focado é sutil diante da cor de fundo padrão.

---

## 4. Problemas Prioritários

| Severidade | Problema | Evidência | Impacto | Correção Recomendada | Risco |
|---|---|---|---|---|---|
| **Alta** | Excesso de botões de feedback por card e empilhamento mobile | `src/ui/Today.tsx` (linhas 334 a 380) | Sobrecarga cognitiva no card; quebra visual e rolagem excessiva em telas mobile. | Substituir a linha de 5 botões por um fluxo de estado simplificado: exibir apenas "Iniciar" / "Abrir no Lichess" e "Concluir". Ao clicar em "Concluir", revelar inline ou via popover as opções de feedback ("Fácil", "Bom", "Difícil") com um botão de "Pular" secundário. | **Baixo**. Melhora significativamente a usabilidade e a estética do card. |
| **Média** | Desperdício de layout desktop (coluna única rígida) | `src/index.css` (linha 37) | Em telas desktop, o app fica centralizado em uma coluna estreita de 560px, empilhando informações de forma ineficiente. | Implementar um layout responsivo de duas colunas no desktop: a coluna da esquerda com as sessões e blocos (foco principal); a coluna da direita com o status de diagnóstico, chips de fraquezas e roadmap. | **Baixo**. Utiliza CSS Grid para redirecionar as seções sem alterar componentes. |
| **Média** | Notificações estáticas e invisíveis | `src/ui/Config.tsx` (linha 186) e `src/ui/Today.tsx` (linha 194) | O usuário pode não perceber que seus dados foram salvos ou que a sincronização falhou/concluiu. | Integrar a biblioteca leve `Sonner` para emitir toasts visuais dinâmicos de sucesso, erro ou alerta de rede. | **Mínimo**. Biblioteca de alta performance e compatível com React 19. |
| **Média** | Indicador de foco de teclado invisível | `src/index.css` (ausência de `:focus-visible` customizado) | Usuários que navegam via teclado perdem a referência visual de onde estão na tela. | Adicionar uma regra global de foco `:focus-visible` com borda contrastante e offset adequado para todos os elementos interativos. | **Nulo**. Apenas regras de estilização CSS. |
| **Baixa** | Ausência de disclaimer institucional claro | `src/ui/Config.tsx` e `src/ui/Today.tsx` | Violação conceitual do item de disclaimers e não afiliação previstos no `AGENTS.md`. | Adicionar um pequeno rodapé estilizado em todas as visualizações com o aviso de app independente e não oficial. | **Nulo**. Apenas texto de rodapé. |

---

## 5. O Que Melhorar Sem Biblioteca Nova

1. **Estrutura Responsiva Desktop em Duas Colunas (CSS Grid):**
   No `index.css`, criar um contêiner de duas colunas ativo para telas acima de `1024px`:
   ```css
   @media (min-width: 1024px) {
     .app-layout-grid {
       display: grid;
       grid-template-columns: 1.6fr 1fr;
       gap: 24px;
       width: min(100%, 1024px);
     }
     .sidebar-panel {
       display: flex;
       flex-direction: column;
       gap: 16px;
     }
   }
   ```

2. **Refatoração do Estado de Conclusão do Card (React Local State):**
   Dentro de `PlanBlockCard` em `Today.tsx`, gerenciar um estado local `isConfirmingDone`:
   - Por padrão, exibe apenas `Abrir no Lichess` (ou `Iniciar`) e `Concluir` (com um botão discreto de `Pular`).
   - Ao clicar em `Concluir`, o card exibe uma pequena transição com a pergunta: "Como foi o treino?" e as 3 opções de feedback ("Fácil", "Bom", "Difícil") junto com uma opção de "Voltar". Isso limpa a interface primária.

3. **Polimento Visual das Abas de Navegação:**
   Aumentar o contraste visual da aba ativa e adicionar transições de cor sutis para dar um toque mais premium ao design local-first:
   ```css
   .nav-button {
     transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
     border: 1px solid #cdd7cf;
   }
   .nav-button:hover {
     background: #eef4f1;
   }
   .nav-button-active {
     background: #1f3f36;
     color: #fff;
     border-color: #1f3f36;
   }
   ```

---

## 6. Pesquisa de Coisas Prontas da Comunidade

| Pacote | Uso no App | Licença | Compatibilidade R19/Vite/TS | Maturidade | Custo (Peso) | Benefício | Risco | Recomendação |
|---|---|---|---|---|---|---|---|---|
| **Radix UI Primitives** | Dialog / Alert Dialog / Tooltip | MIT | Totalmente compatível | Altíssima | Muito Baixo (Tree-shakeable, sem estilos) | Fornece comportamento de popover/modal 100% acessível (teclado e leitor) | Nenhum | **Testar em Spike** (Utilizar se precisarmos de modais flutuantes no futuro) |
| **React Aria Components** | Select, Dialogs, Tooltips | Apache-2.0 | Totalmente compatível | Altíssima | Médio | Excelente comportamento mobile-first e touch | Curva de aprendizado das APIs | **Deixar para depois** (Demasiado complexo para as necessidades de tela do app atual) |
| **shadcn/ui** | Componentes de estilo rápidos | MIT | Compatível | Altíssima | Alto | Agilidade visual | Exige Tailwind CSS, o que viola o requisito de usar Vanilla CSS flexível no projeto | **Rejeitar** |
| **Mantine** | Kit de UI e hooks integrados | MIT | Compatível | Altíssima | Alto | Polish instantâneo | Runtime CSS pesado, altera a arquitetura de estilo e quebra o minimalismo | **Rejeitar** |
| **MUI / Chakra UI** | Componentes prontos corporativos | MIT | Compatível | Altíssima | Muito Alto | Componentes prontos | Bundle grande, acoplamento visual e inadequado para PWA leve offline | **Rejeitar** |
| **Sonner** | Toasts modernos de notificação | MIT | Totalmente compatível | Alta | Baixo (~3KB) | Excelente feedback de ações (config salva, sync concluído) sem poluir a UI | Nenhum | **Adotar agora** (Traz excelente acabamento com custo de manutenção quase nulo) |
| **Lucide React** | Iconografia consistente de UI | ISC | Totalmente compatível | Altíssima | Baixo (SVG inline exportados) | Padronização de ícones sem peso extra | Nenhum | **Adotar agora** (Essencial para refinar a estética do app pessoal) |
| **Recharts** | Gráficos de progresso semanal | MIT | Compatível (v3.7+) | Altíssima | Médio | Gráficos declarativos integrados com React | Peso do D3 e requisitos de container fixo | **Deixar para depois** (Reservar para a fase de Progresso futuro) |
| **Open Props** | Variáveis CSS para tokens | MIT | Compatível | Alta | Irrelevante | Acelera estilização de gradientes e sombras | Curva de adoção em arquivos CSS | **Testar em Spike** |
| **Playwright a11y & Testing Library user-event** | Testes automatizados de fluxo e acessibilidade | MIT | Totalmente compatível | Altíssima | Apenas DevDependency | Garante que as melhorias de design preservem o comportamento e a acessibilidade | Nenhum | **Adotar agora** (Instalar nas dependências de desenvolvimento) |

---

## 7. Debate

### As Vozes

- **Minimalista (M):** Defende que o aplicativo deve permanecer o mais limpo possível, com 100% de controle sobre o CSS escrito à mão. Rejeita dependências externas de design, acreditando que HTML semântico e estilização vanilla tratam todas as situações com menor custo de compilação.
- **Acelerador (A):** Prioriza a entrega visual premium rápida. Defende o uso de pacotes consagrados (como Radix, Lucide e Sonner) para garantir acessibilidade sem reinventar comportamentos interativos complexos (foco de modais, transições de toasts, etc.).
- **Guardião do Projeto (G):** Focado nas regras inquebráveis do `AGENTS.md`: garantia de clean-room, não usar APIs proprietárias, manter o app utilizável offline-first, sem vazamento de dados ou PII em logs, e total respeito à arquitetura limpa sem adiantar as fases congeladas (P4/P5).

---

### Teses em Debate

#### Tese 1: CSS próprio + primitives pontuais (Radix UI)
- **Defesa (A/G):** Radix resolve a acessibilidade complexa (WAI-ARIA) de elementos interativos como diálogos, permitindo que a estilização permaneça no CSS Vanilla local. Evita bugs de tabulação e fechamento no escopo mobile.
- **Objeção (M):** Introduz bibliotecas no bundle final para comportamentos que podem ser resolvidos com elementos nativos do HTML5 como a tag `<dialog>`, mantendo o controle total da renderização.

#### Tese 2: shadcn/ui seletivo
- **Defesa (A):** Fornece componentes com design refinado de mercado que reduzem o esforço de estilização para quase zero.
- **Objeção (M/G):** Exige a inclusão de Tailwind CSS no projeto, quebrando o padrão arquitetural de Vanilla CSS do repositório, introduzindo complexidade de configuração e dependência de compilação adicional no Vite.

#### Tese 3: Mantine completo
- **Defesa (A):** Traz um ecossistema completo com hooks de formulário, animações de modal e alertas, acelerando o desenvolvimento do frontend.
- **Objeção (G/M):** Aumenta drasticamente o tamanho do bundle e insere um provedor de estado CSS-in-JS pesado, o que contraria as premissas de uma ferramenta leve e local-first rodando em PWA.

#### Tese 4: Sem nova biblioteca de UI (CSS nativo + Lucide + Sonner)
- **Defesa (M):** Preserva o controle estrito e a simplicidade. Utiliza apenas Lucide para padronizar ícones e Sonner para resolver o feedback dinâmico de toasts. O layout e a simplificação dos cards são resolvidos puramente no CSS nativo do projeto.
- **Objeção (A):** Sem primitives acessíveis para modais ou tooltips, a implementação desses recursos no futuro exigirá muito código de infraestrutura visual para garantir que leitores de tela e focos de teclado funcionem de forma robusta.

### Síntese e Voto Final

Há um consenso claro de que **Mantine e shadcn/ui/Tailwind devem ser rejeitados** por introduzirem dependências estéticas e arquiteturais incompatíveis com o foco minimalista e local-first do projeto.

**Voto Final da IA (Gemini):** **Adoção da Tese 4 Híbrida.** O caminho mais pragmático e elegante é manter a estilização em CSS Vanilla próprio, adicionando apenas **Lucide React** (para ícones consistentes) e **Sonner** (para toasts modernos). A reorganização de layout (duas colunas no desktop) e a unificação das ações de feedback no card podem ser resolvidas de forma limpa apenas com HTML semântico e CSS local. Deixamos as primitives do **Radix UI** em modo de espera ("Testar em Spike") para quando necessitarmos de diálogos flutuantes ou modais mais robustos.

---

## 8. Plano Recomendado

### Trilha Conservadora (Recomendada)
Esta trilha visa corrigir as falhas primárias de densidade visual, estruturar o layout em duas colunas no desktop e adicionar feedbacks de sucesso por toast, usando apenas CSS Vanilla local e as bibliotecas leves Lucide e Sonner.

#### Passos de Execução
1. **Instalação das Bibliotecas de Apoio:** Adicionar `lucide-react` e `sonner` nas dependências do projeto.
2. **Implementação do Container de Toasts:** Importar `<Toaster />` no `src/ui/App.tsx` e estilizar a integração básica.
3. **Refatoração do Card de Treino (`Today.tsx`):**
   - Introduzir um estado local no componente `PlanBlockCard` para alternar entre visualização de ações primárias ("Abrir no Lichess" / "Concluir") e seleção de feedback de dificuldade ("Como foi o treino?").
   - Remover os botões extras estáticos que poluem a tela mobile.
4. **Layout Grid de Duas Colunas no Desktop:**
   - Modificar a estrutura interna de `.app-shell` no `index.css` para aplicar display grid responsivo com o plano na coluna esquerda e diagnósticos/roadmap na coluna direita em telas amplas.
5. **Integração de Ícones e Toasts:**
   - Substituir as strings estáticas de status na Configuração e Diagnóstico por disparos de `toast.success` e `toast.error`.
   - Adicionar ícones correspondentes do Lucide nos botões e abas de navegação.

#### Arquivos Envolvidos
- `package.json` (adicionar `lucide-react` e `sonner`)
- `src/ui/App.tsx` (montar o Toaster global)
- `src/ui/Today.tsx` (refatorar lógica dos cards, layout grid responsivo e disparar toasts)
- `src/ui/Config.tsx` (limpar formulário e adicionar toasts ao salvar ou importar)
- `src/index.css` (regras do Grid de duas colunas, focus-visible e estilizações de hover)

#### Verificações
- Executar `npm run lint` e `npm run build` para garantir que o build do Vite não apresenta problemas com as importações.
- Executar `npm run test` para certificar que os testes do React que simulam cliques em botões de feedback continuam passando (ou ajustar as queries de teste para refletir a simplificação dos cards).

#### Critério de Abandono
- Abandonar caso a inserção do `Toaster` ou `Lucide` cause incompatibilidade nas dependências peer de React 19 do projeto, ou se o build final aumentar o bundle JS principal em mais de 10% do tamanho atual.

---

## 9. Backlog Pronto para Codex

Estes são itens de trabalho pequenos, atômicos e totalmente testáveis para implementação na Trilha Conservadora.

### Item 1: Instalar Dependências Estéticas Auxiliares
- **Objetivo:** Adicionar `lucide-react` e `sonner` como dependências oficiais de produção.
- **Arquivos Prováveis:** [package.json](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/package.json)
- **Critério de Aceite:** O arquivo `package.json` deve listar `lucide-react` e `sonner` nas dependencies. O comando `npm install` deve rodar limpo.
- **Comando de Verificação:** `npm run build` deve rodar com sucesso.

### Item 2: Criar Layout Responsivo de Duas Colunas no Desktop
- **Objetivo:** Organizar as telas em duas colunas quando o dispositivo possuir largura maior ou igual a `1024px`, otimizando o uso do espaço físico.
- **Arquivos Prováveis:** [src/index.css](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/index.css) e [src/ui/Today.tsx](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/ui/Today.tsx)
- **Critério de Aceite:**
  - Em telas menores de 1024px, a exibição deve permanecer em coluna única contínua.
  - Em telas >= 1024px, as seções de Diagnóstico, Fraquezas e Roadmap devem ocupar uma coluna lateral direita (`sidebar`), enquanto o Plano do Dia e as Sessões ocupam a coluna principal esquerda.
- **Comando de Verificação:** Visualização em modo responsivo no navegador e `npm run lint`.

### Item 3: Adicionar Indicadores Visuais de Foco e Melhorar Hover de Botões
- **Objetivo:** Melhorar a acessibilidade visual fornecendo feedback claro para navegação por teclado e estados interativos de hover.
- **Arquivos Prováveis:** [src/index.css](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/index.css)
- **Critério de Aceite:**
  - Adicionar regra global `:focus-visible` para botões, links e inputs com `outline: 2px solid #1f3f36` e `outline-offset: 2px`.
  - Melhorar as transições de cor das abas de navegação do topo usando `transition: all 0.2s ease`.
- **Comando de Verificação:** Navegar no app usando a tecla `Tab` e verificar se a marcação de foco é nitidamente visível em todos os elementos.

### Item 4: Refatorar Card de Bloco para Simplificar Ações de Feedback
- **Objetivo:** Remover a fileira de 5 botões do card de treino, fornecendo um fluxo em duas etapas: ação de conclusão -> seleção de feedback.
- **Arquivos Prováveis:** [src/ui/Today.tsx](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/ui/Today.tsx) e testes associados em `src/app/trainingFlow.test.tsx`
- **Critério de Aceite:**
  - O card de bloco pendente exibe inicialmente apenas o link/botão de Início e um botão "Concluir" (com a opção discreta de "Pular").
  - Clicar em "Concluir" substitui visualmente o rodapé do card pela pergunta "Como foi o treino?" e as opções de botões "Fácil", "Bom" e "Difícil" junto com um botão de cancelamento "Voltar".
  - Selecionar um dos feedbacks conclui o bloco normalmente com o comportamento herdado.
- **Comando de Verificação:** `npm run test` deve continuar passando com 100% de sucesso.

### Item 5: Adicionar Notificações via Toast para Ações da Interface
- **Objetivo:** Substituir as mensagens de texto estáticas e de difícil leitura por toasts modernos disparados no canto da tela ao salvar configurações ou concluir diagnósticos.
- **Arquivos Prováveis:** [src/ui/App.tsx](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/ui/App.tsx), [src/ui/Config.tsx](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/ui/Config.tsx) e [src/ui/Today.tsx](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/ui/Today.tsx)
- **Critério de Aceite:**
  - Integrar o componente `<Toaster richColors />` no layout global do `App.tsx`.
  - Disparar `toast.success("Configuração salva.")` ao submeter o formulário de configuração.
  - Disparar toasts informativos durante o processo de atualização de diagnósticos (sucesso/erro).
- **Comando de Verificação:** `npm run test` e verificação manual das notificações durante as interações.

---

## 10. Fontes

- **[Radix UI Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction) (Acesso em 2026-06-07):** Confirmou suporte nativo e oficial para React 19, permitindo uso incremental focado em acessibilidade sem estilo pré-definido.
- **[Sonner GitHub](https://github.com/emilkowalski/sonner) (Acesso em 2026-06-07):** Confirmou licença MIT, compatibilidade direta com React 19 declarada em suas dependências e facilidade de integração local via wrapper limpo.
- **[Lucide React](https://lucide.dev/guide/react) (Acesso em 2026-06-07):** Confirmou licença ISC e exportação otimizada por tree-shaking para empacotamento leve com Vite/TypeScript.
- **[Tremor React GitHub Issues](https://github.com/tremorlabs/tremor/issues/1072) (Acesso em 2026-06-07):** Confirmou a falta de suporte estável para React 19 devido a dependências antigas não atualizadas, justificando a decisão de rejeição temporária.
- **[Recharts Documentation](https://recharts.org) (Acesso em 2026-06-07):** Confirmou suporte oficial a React 19 a partir da versão 3.7.0, consolidando seu papel para futuras implementações de gráficos na aba de progresso.
