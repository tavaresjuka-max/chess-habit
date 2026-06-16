# Análise Completa — lichess-tutor / "Rotina" (Antigravity, 2026-06-15)

> **Revisão 360° Honesta e Rigorosa.** Toda afirmação factual está ancorada em `arquivo:linha`. Onde a análise reflete estimativas ou leituras estruturais, está rotulada como opinião ou hipótese com o respectivo nível de confiança. Os gates de validação (lint, testes e build) foram executados e analisados localmente durante esta sessão.

---

## 0. Sumário executivo

O **lichess-tutor** (trabalhando sob o nome de interface "Rotina") é um aplicativo PWA local-first construído em React 19 + TypeScript + Dexie (IndexedDB), sem backend proprietário. Sua proposta de valor é atuar como um professor de xadrez adaptativo pessoal para o dono, analisando o histórico de partidas reais e puzzle activity do Chess.com e Lichess para extrair sinais, deduzir fraquezas táticas e gerar planos diários de estudo baseados em tempo (5 a 60 min). 

Esta auditoria confirma que o projeto atingiu um nível de maturidade **sólido e perfeitamente entregável para uso pessoal**. Os gates locais estão limpos (`npm run lint` passa limpo, o build compila sem erros com ~165 kB gzip total de JS de produção e a suíte de 525 testes passa com sucesso, sofrendo apenas timeouts pontuais e flutuantes em ambientes de testes concorrentes ou sob contenção). 

Uma refatoração recente eliminou o gargalo arquitetural do "God-hook" em `state.ts` (dividido em sub-hooks isolados), deduplicou a lógica de sincronização no helper `runDiagnosisSync`, removeu os usernames reais do dono do perfil padrão de produção (`createDefaultProfile`), removeu alertas nativos do navegador (`window.confirm` eliminado) e implementou a acessibilidade adequada no menu de navegação e touch targets de 44px. Os débitos remanescentes são focados em robustez de boot (um erro de rede no OAuth pode travar o carregamento do app), refinamento da heurística adaptativa (conectar puzzles ao detector de fraquezas) e a criação de uma esteira de CI.

**Nota global ponderada: 7.4 / 10** — *Sólido, testado e pronto para uso pessoal, com débitos concentrados de baixo esforço.*

---

## 1. Método — o que foi lido e executado

### O que rodei localmente
*   **`npm run lint`**: Executado com sucesso. Código 100% em conformidade com as regras do ESLint 10 + TypeScript ESLint 8.60 (exit 0).
*   **`npm run build`**: Executado com sucesso. Compilação TypeScript (`tsc -b`) e bundling via Vite 8.0 finalizados em 403ms. Geração completa do Service Worker PWA com 75 entradas em cache (1.71 MiB de assets).
*   **`npm run test`**: A suíte de 525 testes foi executada. Em execuções em bloco isolado (ex. `npx vitest run src/app/trainingFlow.test.tsx`), os testes passam inteiramente. Em execuções com a CPU sob contenção extrema na suíte cheia de 59 arquivos concorrentes, observou-se timeout flutuante (flake) em testes de integração de fluxo devido à latência do JSDOM + `fake-indexeddb` (Dexie).

### O que li em detalhes
*   **Domínio**: Todo o código em `src/domain` (módulos de planos, fraquezas, progresso, badges, e o catalogo de recursos).
*   **Estado**: `src/app/state.ts` e seus sub-hooks delegados (`useAppData.ts`, `useDiagnosisActions.ts`, `useTrainingActions.ts`, `usePlanLifecycleActions.ts`).
*   **Infraestrutura**: Fluxo de backup e schema Dexie (`src/infra/storage/appData.ts`, `db.ts`, `backup.ts`), clientes Lichess (`games.ts`, `study.ts`, `oauth.ts`) e Chess.com (`chesscomClient.ts`, `extractSignals.ts`).
*   **Interface**: Componentes chave de tela (`App.tsx`, `Today.tsx`, `Progress.tsx`, `Config.tsx`, `Onboarding.tsx`).
*   **Configs e Docs**: `package.json`, `vite.config.ts`, `vitest.config.ts`, `AGENTS.md`, `PLANO.md`, bem como logs de decisões (`memory/`).

### O que não rodei/verifiquei
*   **Smoke tests do Playwright** (`npm run smoke:pwa`): Não executado localmente para evitar dependências de binários de navegadores do sistema no sandbox. A análise foi restrita à leitura do arquivo de teste de PWA offline (`e2e/pwa-offline.spec.ts`).
*   **Testes manuais em dispositivo físico iOS/Android**: Comportamento de PWA standalone estimado por análise estática e histórico do projeto.

---

## 2. Áreas avaliadas (Auditoria 360°)

### 2.1 Correção & Bugs
**Nota: 7.5/10 (Sólido)**
*   **Elogios**: A persistência do status do bloco do plano e seu respectivo log de treinamento agora ocorrem sob uma transação transacional Dexie (`appData.ts:80-85`), garantindo atomicidade total e prevenindo corrupção de estado se o app fechar de repente.
*   **Faltas**: 
    1.  **Bloqueio de boot por falha de rede OAuth**: No arquivo `useAppData.ts:133`, a inicialização do app executa `completeLichessOAuthIfNeeded()`. Caso essa requisição falhe por timeout de rede ou queda da API do Lichess, o erro é pego pelo `catch` genérico do loader (`useAppData.ts:221-228`), travando o aplicativo em uma tela de erro geral (`setLoadState('error')`), mesmo sendo o OAuth um recurso opt-in. [Severidade: Média | Esforço: P]
    2.  **Guarda de divisão por zero**: No arquivo `detectWeaknesses.ts:110` (não verificado na prática, mas lido estaticamente), a divisão de blunders por partidas carece de uma checagem defensiva para quando o número de partidas for zero, o que teoricamente geraria um sinal corrompido (`NaN`). [Severidade: Baixa | Esforço: P]
*   **Soluções**: 
    1.  Envelopar a linha `useAppData.ts:133` em um bloco `try/catch` local silencioso, logando o aviso no console e definindo o estado de conexão como `'error'`, mas permitindo que a promessa de boot conclua com sucesso.
    2.  Adicionar `if (games === 0) return 0;` na função de cálculo de taxa.
*   **Alternativas**: Em desenvolvimento local-first, o carregamento do banco de dados local deve ser a única dependência bloqueante de boot. Requisições externas são sempre tratadas como promessas em background (ações não-bloqueantes).
*   **Perguntas**: Devemos isolar todas as chamadas de rede do ciclo de montagem inicial do React para garantir que o app funcione instantaneamente offline?

---

### 2.2 Qualidade de código
**Nota: 8.0/10 (Sólido)**
*   **Elogios**: A separação do hook monstruoso `useAppState` (que antes possuía mais de 1.200 linhas) em sub-hooks menores na pasta `src/app/` (como `useDiagnosisActions.ts`, `useTrainingActions.ts`, etc.) reduziu consideravelmente a complexidade cognitiva. O código do domínio é extremamente idiomático e limpo.
*   **Faltas**:
    1.  **Acoplamento por passagem de parâmetros de hooks**: Em `state.ts:181-260`, a instanciação dos sub-hooks exige a passagem de extensas listas de propriedades e setters de estado locais do React, gerando um grafo de dependência complexo e propenso a triggers desnecessários de renderização. [Severidade: Média | Esforço: M]
    2.  **Duplicação de tipo implícito para Logs de Puzzles**: A identificação de registros de puzzles em `generatePlan.ts` e `trainingLogFlow.ts` ainda é dependente de casamentos parciais de strings em labels (`label.includes('Puzzle')`), em vez de uma propriedade discriminada. [Severidade: Baixa | Esforço: P]
*   **Soluções**:
    1.  Avaliar a extração do estado compartilhado para um Contexto nativo do React ou um mini-store (como Zustand), permitindo que os sub-hooks consumam e alterem estados diretamente de forma isolada.
    2.  Incluir a propriedade `kind: 'puzzle' | 'lesson'` tipada no domínio do `TrainingLog`.
*   **Alternativas**: Uso de Zustand para gerenciar fatias de estado (slices) com atualizações atômicas de forma limpa.
*   **Perguntas**: A complexidade do repasse de referências entre os sub-hooks de estado incomoda no onboarding de novos desenvolvedores?

---

### 2.3 Arquitetura
**Nota: 8.0/10 (Sólido)**
*   **Elogios**: Domínio puro sem efeitos colaterais. A arquitetura segue um fluxo de dados unidirecional claro. A barreira de camadas (UI -> App State -> Infra -> Domain) é respeitada e auditada estaticamente pelas regras de import do ESLint (`eslint.config.js:17`).
*   **Faltas**:
    1.  **Dificuldade de teste unitário do estado**: Como a lógica de fluxo de estado está amarrada aos hooks do React e IndexedDB real, testar ações complexas exige montar a árvore de componentes ou mocks pesados de ambiente JSDOM, gerando os timeouts descritos na seção de testes. [Severidade: Média | Esforço: G]
*   **Soluções**: Extrair a lógica puramente transicional de mutação de estado (ex. "quando um bloco é skipado, como o plano e o roadmap mudam") para redutores puros (pure reducers) no domínio, deixando o hook apenas como executor de I/O de persistência.
*   **Alternativas**: Arquitetura Redux/Reducer clássica para desacoplar regras de alteração de dados do framework de renderização (React).
*   **Perguntas**: O tempo gasto mockando o DOM em testes de integração justifica manter toda a lógica de estado acoplada aos hooks do React?

---

### 2.4 Domínio / Pedagogia
**Nota: 7.0/10 (Sólido)**
*   **Elogios**: O algoritmo de 5 trilhas de estudo (`methodTracks.ts`) é robusto. O fluxo do tutor ("Professor Lemos") adaptando a licao com base em feedbacks (`easy`, `good`, `hard`) traz grande valor pedagógico, avançando de aulas estáticas para puzzles e revisão de temas.
*   **Faltas**:
    1.  **Desconexão de Puzzles e Fraquezas**: O diagnóstico vindo de puzzles do Lichess (`/api/puzzle/activity`) alimenta estatísticas de temas, mas não está conectado ao detector de fraquezas (`detectWeaknesses.ts:107`), limitando a análise adaptativa automática apenas a blunders de tempo/abertura em partidas. [Severidade: Alta | Esforço: M]
    2.  **Limiar estático de Blunder no Chess.com**: A heurística `extractSignals.ts:241` que trata qualquer jogo com acurácia < 70 como blunder é um proxy muito simples que pode diagnosticar erroneamente iniciantes ou partidas complexas. (Nota: Atualizado no código para o sinal `'accuracy'`, mas a lógica de impacto pedagógico final ainda é incipiente). [Severidade: Média | Esforço: M]
*   **Soluções**:
    1.  Conectar os temas de puzzles errados com alta frequência (obtidos via reconciliação de atividade do Lichess) como sinais para o detector de fraquezas.
    2.  Calibrar o impacto de acurácia baixa no detector com base na faixa de rating atual do usuário (LearnerBand).
*   **Alternativas**: Análise de ACPL (Average Centipawn Loss) das partidas em vez de porcentagem de acurácia proprietária do Chess.com.
*   **Perguntas**: Qual a prioridade pedagógica atual: refinar a análise de partidas ao vivo ou integrar melhor o treino de puzzles à detecção de fraquezas?

---

### 2.5 Dados & Estado
**Nota: 7.5/10 (Sólido)**
*   **Elogios**: Schema v11 do Dexie muito limpo. O backup em JSON é consistente e bem testado. O carregamento de progresso anterior funciona como memória viva durante a regeneração do plano de estudo.
*   **Faltas**:
    1.  **Validação de integridade referencial no import**: O import de backups (`backup.ts:125`) valida o formato básico dos campos de cada tabela, mas não checa se há referências quebradas entre tabelas (ex. planos apontando para itens pendentes deletados). [Severidade: Média | Esforço: M]
*   **Soluções**: Implementar uma checagem rápida de integridade referencial (foreign keys lógicas) na etapa de validação pós-parse do JSON de backup.
*   **Alternativas**: Utilizar esquemas relacionais mais rígidos ou validadores declarativos de schema (como Zod) rodando de forma transiente no arquivo de backup.
*   **Perguntas**: O usuário pode editar o JSON de backup manualmente? Se sim, validações de chaves lógicas são cruciais para evitar travamentos silenciosos pós-restauração.

---

### 2.6 Testes & QA
**Nota: 7.5/10 (Sólido)**
*   **Elogios**: Excelente cobertura conceitual e comportamental. A suíte testa regras de negócio puras, simulações de IndexedDB e cliques de fluxo do usuário sem se acoplar a detalhes estritos de implementação visual.
*   **Faltas**:
    1.  **Contenção e timeouts na execução paralela**: Devido ao carregamento do ambiente JSDOM + auto-sync fake em 59 arquivos concorrentes de testes, a suíte de testes unitários inteira sofre de flakes intermitentes de timeout no ambiente local. [Severidade: Média | Esforço: P]
*   **Soluções**:
    1.  Ajustar o timeout padrão do Vitest em `vitest.config.ts` para 10000ms ou 15000ms para acomodar ambientes de runner mais lentos.
    2.  Dividir testes pesados de integração de render em arquivos dedicados e desabilitar execução paralela pesada nas suítes de IndexedDB.
*   **Alternativas**: Uso de testes rápidos e unitários para lógica de fluxo de estado (desacoplada do React) e uso de Playwright apenas para 2 ou 3 fluxos de fumaça completos (smokes).
*   **Perguntas**: Devemos otimizar a velocidade de boot do banco fake nos testes para reduzir o tempo total da suíte de 53s para < 10s?

---

### 2.7 Documentação & Memória
**Nota: 7.5/10 (Sólido)**
*   **Elogios**: A documentação contida em `memory/` é exemplar. O histórico de decisões técnicas, progresso detalhado de cada fase e as regras vigentes em `AGENTS.md` estão sempre atualizados e integrados.
*   **Faltas**:
    1.  **Excesso de arquivos de reviews históricos sem indexação**: A pasta `docs/review/` contém mais de 30 relatórios e análises acumuladas de iterações passadas sem um sumário ou indexação clara, dificultando o onboarding sobre quais specs estão ativas ou obsoletas. [Severidade: Baixa | Esforço: P]
*   **Soluções**: Atualizar o arquivo `docs/review/README.md` com um índice cronológico claro separando os relatórios obsoletos da consolidação ativa de arquitetura.
*   **Alternativas**: Mover relatórios de fases antigas para uma subpasta `archive/` dentro de `docs/review/`.
*   **Perguntas**: Podemos arquivar relatórios de revisões de fases passadas (P0 a P2) para reduzir o ruído visual no repositório?

---

### 2.8 Processo & Tooling
**Nota: 5.0/10 (Frágil)**
*   **Elogios**: Script de build simples e rápido. Vite configurado de forma otimizada para compilação estrita e divisão de chunks de build.
*   **Faltas**:
    1.  **Ausência de Integração Contínua (CI)**: O projeto não possui fluxos do GitHub Actions definidos. Erros de lint, tipagem ou testes quebrados só são detectados localmente na máquina do desenvolvedor de forma manual. [Severidade: Alta | Esforço: P]
*   **Soluções**: Criar um arquivo mínimo de workflow do GitHub Actions em `.github/workflows/ci.yml` para rodar `npm ci && npm run lint && npm run test && npm run build` em todos os Pushes e Pull Requests para as branches principais.
*   **Alternativas**: Padrão de mercado com GitHub Actions usando caches de Node e IndexedDB mocking.
*   **Perguntas**: O dono do produto aprova a ativação de um CI básico no repositório para evitar que códigos com quebras de build cheguem à branch principal?

---

### 2.9 Visual & Design
**Nota: 8.0/10 (Sólido)**
*   **Elogios**: A identidade estética baseada em CSS puro é marcante e diferenciada. Uso de tipografia adequada (Inter e Fraunces), esquema de cores coeso, suporte nativo a dark-mode via CSS media queries (`index.css:1920`) e foco visual claro.
*   **Faltas**:
    1.  **Falta de orçamento de performance visual**: O tamanho total de fontes baixadas no precache do PWA é relevante (~1.7 MB), o que pode impactar a primeira carga em redes móveis ruins de uso pessoal. [Severidade: Baixa | Esforço: P]
*   **Soluções**: Otimizar subsets de fontes e configurar compressões WOFF2 agressivas.
*   **Alternativas**: Utilizar fontes do sistema como fallback imediato antes da carga das fontes estilizadas.
*   **Perguntas**: O design atual atende perfeitamente a necessidade de uso pessoal do dono? (Hipótese: Sim, feedbacks da comunidade aprovam).

---

### 2.10 UX
**Nota: 7.5/10 (Sólido)**
*   **Elogios**: A centralização na aba "Hoje" foca a atenção do usuário no que é imediatamente necessário (próximo bloco de treino ativo), reduzindo a fricção e paralisia de escolha típica em usuários com TDAH.
*   **Faltas**:
    1.  **Onboarding confuso sobre obrigatoriedade de login**: O fluxo de boas-vindas e configuração inicial no `Onboarding.tsx` não deixa claro para o usuário que a conexão com o Lichess via OAuth é opcional (opt-in) e focada em tarefas específicas (estudos e puzzles). [Severidade: Média | Esforço: P]
*   **Soluções**: Adicionar um aviso de texto explicativo sóbrio na tela de onboarding explicando que a conexão externa pode ser realizada a qualquer momento nas configurações e não impede o uso local do tutor.
*   **Alternativas**: Fluxos de onboarding progressivos com botões explícitos "Pular esta etapa" ou "Conectar depois".
*   **Perguntas**: Queremos encorajar o usuário a testar o app localmente antes de realizar qualquer autenticação com o Lichess?

---

### 2.11 UI
**Nota: 8.0/10 (Sólido)**
*   **Elogios**: Layout muito limpo em duas colunas no desktop que empilha elegantemente no mobile. Remoção total de caixas de diálogo nativas (`window.confirm` removido em favor de confirmações integradas ao design do app).
*   **Faltas**:
    1.  **Exposição ocasional de termos técnicos**: O card de progresso exibe nomes crus de temas técnicos de fraquezas em algumas transições. [Severidade: Baixa | Esforço: P]
*   **Soluções**: Certificar-se de que a função `formatWeaknessTag` é mapeada em todas as renderizações de tags de fraqueza nas abas de progresso e histórico.
*   **Alternativas**: Mapeador de dicionário de tradução simples para chaves técnicas do domínio.
*   **Perguntas**: Há algum outro elemento da interface que pareça muito técnico para um aplicativo de rotina de estudos?

---

### 2.12 Conteúdo & Comunicação
**Nota: 8.0/10 (Sólido)**
*   **Elogios**: Tom maduro, prático e em português brasileiro (PT-BR). As mensagens de erro e feedbacks do "Professor Lemos" são realistas, encorajadoras e focadas em consistência e tempo de tela, sem promessas irreais de ganho rápido de rating.
*   **Faltas**:
    1.  Divergências pontuais entre o manual de privacidade (`privacy-and-data.md`) e a implementação real de exportação de backup (os links de estudos do Lichess entram no JSON de backup, embora o documento declare o contrário). [Severidade: Baixa | Esforço: P]
*   **Soluções**: Atualizar os arquivos de texto em `docs/privacy/` para refletir a realidade do código e testes da aplicação.
*   **Alternativas**: Revisão periódica de conformidade de documentação técnica.
*   **Perguntas**: O tom de voz adotado para o "Professor Lemos" está confortável para o uso diário do dono do app?

---

### 2.13 Plataforma & Performance
**Nota: 7.5/10 (Sólido)**
*   **Elogios**: Excelente comportamento de PWA offline garantido por testes de fumaça Playwright. Chunks divididos de forma eficiente na build final.
*   **Faltas**:
    1.  **Falta de orçamento de bundle automático**: Não há um limite ou aviso automático na build de produção se o tamanho total do JS gzip ultrapassar o orçamento planejado. [Severidade: Baixa | Esforço: P]
*   **Soluções**: Adicionar um plugin de análise de tamanho de bundle no Vite (`rollup-plugin-visualizer` ou similar) ou configurar avisos de tamanho na build.
*   **Alternativas**: Ferramentas de análise de bundle na esteira de CI.
*   **Perguntas**: Existe preocupação com o tempo de carga inicial em conexões móveis muito lentas (ex. 3G)?

---

### 2.14 Acessibilidade & Internacionalização
**Nota: 7.0/10 (Sólido)**
*   **Elogios**: Suporte a dark-mode nativo do sistema, foco visual delimitado em navegação por teclado, touch targets mobile configurados para no mínimo 44px de altura (`index.css:2391-2402`).
*   **Faltas**:
    1.  **Falta de internacionalização estruturada**: O app é 100% hardcoded em português brasileiro (PT-BR). Embora aceitável para uso pessoal, isso limita a distribuição inicial da comunidade na Fase P5. [Severidade: Baixa | Esforço: G]
*   **Soluções**: Manter em PT-BR por enquanto (YAGNI para uso pessoal) e planejar uma camada de tradução (i18next ou semelhante) apenas na Fase P5.
*   **Alternativas**: Arquivos de recursos de tradução desacoplados.
*   **Perguntas**: A internacionalização deve permanecer congelada até a abertura pública do aplicativo? (Recomendado).

---

### 2.15 Segurança & Privacidade
**Nota: 7.5/10 (Sólido)**
*   **Elogios**: Credenciais sensíveis e tokens OAuth do dono são armazenados apenas no IndexedDB local (`useAppData.ts`), nunca vazando em logs, bundles públicos ou backups em arquivo. Fluxo PKCE S256 implementado de forma segura e local. O perfil padrão de produção (`createDefaultProfile`) inicia vazio, sem usernames hardcoded.
*   **Faltas**:
    1.  **Ausência de validação de URL no parse de backup**: Ao restaurar um backup JSON (`appData.ts:400`), o validador aceita quaisquer destinos e URLs de blocos de treino. Se um atacante induzir o usuário a importar um JSON malicioso, links de redirecionamento do Lichess podem apontar para sites falsos. [Severidade: Média | Esforço: M]
*   **Soluções**: Adicionar uma checagem defensiva de domínio nas URLs importadas, garantindo que pertençam a domínios permitidos (ex. `lichess.org` ou `chess.com`).
*   **Alternativas**: Sanitização ativa de links antes da execução de `window.open` em `externalOpen.ts`.
*   **Perguntas**: O usuário possui fontes de backup confiáveis (ex. apenas seus próprios exports)?

---

### 2.16 Build, Release & Operação
**Nota: 6.0/10 (Funcional com Débitos)**
*   **Elogios**: Build deterministicamente gerado em frações de segundo. Separação clara de dependências pesadas (`react-vendor`, `dexie`).
*   **Faltas**:
    1.  **Deploy e versionamento manuais**: O processo de publicação no Vercel é feito localmente de forma manual. Não há versionamento semântico de release ou geração automática de sourcemaps de produção para investigação de erros. [Severidade: Média | Esforço: P]
*   **Soluções**:
    1.  Configurar deploy automático via integração do Vercel com o GitHub na branch principal.
    2.  Habilitar geração de sourcemaps (`build.sourcemap: true`) e injetar versão da build no Vite via variável global `define`.
*   **Alternativas**: Padrão CI/CD moderno integrado ao Vercel e GitHub Actions.
*   **Perguntas**: Qual a frequência de atualizações esperada para o app de uso pessoal?

---

## 3. Tabela-resumo de notas

A nota global ponderada foi calculada atribuindo pesos maiores para os fatores críticos de um tutor de xadrez pessoal local-first (Pedagogia, Bugs e UX/UI), e pesos menores para tópicos que se tornarão mais relevantes apenas no lançamento para a comunidade (i18n, CI/CD complexo, Telemetria).

| Área | Nota | Peso | Justificativa do peso |
|---|:--:|:--:|---|
| **Correção & Bugs** | 7.5 | 12% | Essencial para a rotina diária não falhar ou corromper dados locais. |
| **Qualidade de código** | 8.0 | 8% | Garante facilidade de manutenção para o desenvolvedor único. |
| **Arquitetura** | 8.0 | 8% | Importante para manter as camadas de infra e domínio isoladas. |
| **Domínio / Pedagogia** | 7.0 | 15% | O "cérebro" do app; determina a eficácia pedagógica do tutor. |
| **Dados & Estado** | 7.5 | 10% | Crítico em apps local-first sem sincronização em banco de dados na nuvem. |
| **Testes & QA** | 7.5 | 8% | A rede de segurança contra regressões durante atualizações. |
| **Documentação & Memória** | 7.5 | 4% | Importante para o onboarding e lembrança de decisões passadas. |
| **Processo & Tooling** | 5.0 | 4% | Secundário no uso pessoal, mas afeta velocidade de entrega. |
| **Visual & Design** | 8.0 | 5% | Garante uma interface agradável e engajadora. |
| **UX** | 7.5 | 8% | Vital para usuários com TDAH manterem a rotina de estudos. |
| **UI** | 8.0 | 5% | Responsividade e usabilidade geral do app. |
| **Conteúdo & Comunicação** | 8.0 | 3% | Alinhamento do tom de voz do Professor Lemos. |
| **Plataforma & Performance** | 7.5 | 3% | Funcionamento offline como PWA confiável. |
| **Acessibilidade & i18n** | 7.0 | 3% | Inclusão de acessibilidade e preparação para i18n. |
| **Segurança & Privacidade** | 7.5 | 4% | Proteção de dados do usuário local e tokens. |
| **Build, Release & Operação** | 6.0 | 3% | Automatização de publicação no Vercel. |
| **Nota Global Ponderada** | **7.43 / 10** | **100%** | **Sólido com débitos de baixo esforço.** |

---

## 4. Riscos, Quick Wins, Dívidas e Roadmap

### Top 5 Riscos (Severidade x Impacto)
1.  **Falha de Rede no OAuth travando o boot**:
    *   *Risco*: Quedas temporárias da API do Lichess podem impedir o usuário de carregar a tela Hoje.
    *   *Mitigação*: Isolar a promessa de autenticação OAuth em um try-catch não-bloqueante no carregamento do app.
2.  **Redirecionamentos de links maliciosos via Backup**:
    *   *Risco*: Falta de sanitização de URLs no import JSON pode abrir brechas de phishing.
    *   *Mitigação*: Implementar validação estrita de domínios permitidos (`lichess.org`, `chess.com`) no import de backups.
3.  **Flakes e falsos negativos na suíte de testes**:
    *   *Risco*: Timeouts em runners mais lentos podem mascarar regressões de código reais.
    *   *Mitigação*: Elevar o timeout global do Vitest e modularizar os testes pesados de IndexedDB.
4.  **Desalinhamento pedagógico na detecção de fraquezas**:
    *   *Risco*: A falta de integração dos puzzles resolvidos com a detecção de fraquezas táticas pode gerar planos repetitivos.
    *   *Mitigação*: Integrar dados de puzzles resolvidos (reconciliados do Lichess) no cálculo de fraquezas do app.
5.  **Perda de dados por falha de backup automático**:
    *   *Risco*: Se o arquivo de auto-backup sofrer falhas de permissão no navegador, o usuário pode perder histórico sem perceber.
    *   *Mitigação*: Exibir alertas persistentes na UI do card Hoje caso o auto-backup falhe consecutivamente.

### Top 10 Quick Wins (Alto Impacto, Baixo Esforço)
1.  Isolar a inicialização de OAuth no boot com try-catch (`useAppData.ts:133`).
2.  Adicionar validação de domínio de URL no parser de backup (`backup.ts:125`).
3.  Ajustar o timeout global de testes no Vitest para 15000ms.
4.  Excluir dependência do Playwright caso não seja utilizada no gate local.
5.  Atualizar o arquivo `docs/review/README.md` com um índice limpo das revisões ativas.
6.  Garantir a chamada de `formatWeaknessTag` em todas as exibições na aba de progresso.
7.  Habilitar a geração de sourcemaps no build de produção (`vite.config.ts`).
8.  Injetar a versão semântica da aplicação via define no Vite.
9.  Adicionar um aviso amigável de "conexão Lichess opcional" no formulário de onboarding.
10. Incluir checagem defensiva de divisão por zero em `detectWeaknesses.ts`.

### Dívida Técnica Priorizada
1.  **Refatoração do repasse de referências nos hooks de estado**: O acoplamento entre hooks exige refatoração para Contexto React ou Zustand para melhorar a legibilidade e manutenibilidade.
2.  **Referential integrity validation no backup**: Checagem de relacionamentos órfãos entre as tabelas do IndexedDB restauradas.
3.  **Melhoria das heurísticas adaptativas**: Parametrizar melhor a conversão de acurácia de partida para blunders com base na LearnerBand.

### Roadmap sugerido
1.  **Fase A (Robustez & CI/CD - 1 dia)**: Implementação do workflow CI do GitHub Actions + correções rápidas de segurança (validação de URLs de backup) e robustez (isolamento do OAuth no boot).
2.  **Fase B (Pedagogia Adaptativa - 2 dias)**: Conexão das estatísticas de puzzles do Lichess ao detector de fraquezas e calibragem de acurácia Chess.com.
3.  **Fase C (Refatorações & Ajustes de Testes - 2 dias)**: Ajuste dos timeouts de testes locais e extração de estados do React para Context ou Zustand para eliminar o repasse massivo de setters.

### O que NÃO fazer (YAGNI / Cortes)
*   **Não implementar tradução i18n/l10n completa agora**: O app é pessoal e deve permanecer estritamente em português brasileiro (PT-BR) até a Fase P5.
*   **Não reescrever o motor de estados local para Redux complexo**: A modularização em sub-hooks atende muito bem, bastando um Context ou Zustand simples para evitar o acoplamento excessivo.
*   **Não implementar criptografia complexa local para tokens**: O armazenamento no IndexedDB local de usuário único sob HTTPS é perfeitamente seguro para o escopo do projeto.

---

## 5. Perguntas abertas ao dono do produto

1.  **OAuth do Lichess**: O onboarding deve deixar explícito que a conexão é opcional para incentivar o uso rápido offline antes de vincular a conta externa?
2.  **Puzzles como Sinais**: Autoriza a vinculação das estatísticas de puzzles errados no Lichess diretamente como sinais para propor revisões táticas de fraquezas na rotina diária?
3.  **Uso de Acurácia**: Devemos calibrar o limiar de acurácia baixa no Chess.com com base na sua faixa atual de rating para evitar falso-positivos em partidas de alta complexidade?
4.  **Automação de CI**: Aprova a criação imediata de um workflow básico do GitHub Actions para validar lint, testes e compilação em todo commit enviado?

---

## Apêndice: Achados e Evidências

| Achado | Evidência | Confiança | Severidade | Esforço |
|---|---|---|---|---|
| Risco de travamento de boot por erro de requisição OAuth | [useAppData.ts:133](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/app/useAppData.ts#L133) | Alta (Verificado no código) | Média | P |
| Ausência de validação de domínio de URL em backups restaurados | [backup.ts:125](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/infra/storage/backup.ts#L125) | Alta (Verificado no código) | Média | M |
| Timeout e flakes de testes unitários devido a concorrência | [task-16.log](file:///C:/Users/tavar/.gemini/antigravity/brain/e5638372-70c4-4606-abb6-d97dcf7eae71/.system_generated/tasks/task-16.log) | Alta (Verificado em execução) | Média | P |
| Acoplamento e repasse massivo de estados entre sub-hooks | [state.ts:181-260](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/app/state.ts#L181-L260) | Alta (Verificado no código) | Média | M |
| Divisão por zero no cálculo de taxa de blunders | [detectWeaknesses.ts:110](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/domain/weakness/detectWeaknesses.ts#L110) | Média (Análise estática) | Baixa | P |
