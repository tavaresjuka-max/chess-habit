# Relatório Antigravity — Auditoria Completa e Plano Nota 9,5

- **IA/Autoria**: Antigravity (Gemini 3.5 Flash / High)
- **Papel**: Arquiteto Principal & Diretor de Engenharia Pedagógica
- **Data da Análise**: 2026-06-14
- **Contexto**: Revisão crítica pós-Cortes A/B/C do codebase na pasta [lichess-tutor](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor) e do relatório preliminar do Claude.
- **Insumos Técnicos**: Análise direta do código-fonte, validação de execução verde do test suite (385 testes/58 arquivos) e inspeção do bug de rede confirmado.

---

## 1. Veredito Geral de Auditoria

**Nota Geral da Antigravity: 7,3 / 10** → Meta: 9,5

A fundação construída até o momento no `lichess-tutor` é altamente resiliente e bem estruturada, especialmente após a implementação das barreiras protetivas dos Cortes A (UX/A11y básica), B (validação de schema de backup) e C (fila serial contra 429). 

No entanto, o veredito da Antigravity é **tecnicamente mais rigoroso do que o do Claude (7,4)**. A análise detalhada do código-fonte revela que o aplicativo sofre de **"integrações falsamente completas"** (pseudomorfismos pedagógicos). Diversas variáveis e classes cruciais para a adaptabilidade estão implementadas na teoria (com testes isolados), mas são **código morto** ou **comportamentos puramente lineares** no runtime do plano diário.

### As 5 Grandes Gaps Identificadas pela Antigravity:
1. **Falso Espaçamento de Revisões (Pedagogia):** A função [advancePendingItem](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/domain/method/pendingItems.ts#L76-L87) aceita um parâmetro opcional `feedback`, mas o ignora completamente na computação do intervalo. O espaçamento progride em um array fixo e linear de tentativas (`[1, 3, 7, 14]` dias) sem nenhuma diferenciação se o usuário marcou "Fácil" ou "Difícil". Isso não é repetição espaçada adaptativa.
2. **Mastery Desconectada (Domínio):** O cálculo de maestria em [mastery.ts](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/domain/method/mastery.ts) é código morto. Nenhuma linha de lógica em [generatePlan.ts](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/domain/plan/generatePlan.ts) invoca `computeMastery` para adaptar o plano.
3. **Swallow Mortal de Rate Limit (Rede):** Confirmamos a existência de um bug arquitetural crítico em [trainingLogFlow.ts:258](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/app/trainingLogFlow.ts#L258). O bloco `catch {}` na consulta de replay de puzzles engole todas as exceções, inclusive `LichessRateLimitError`. Isso significa que um HTTP 429 retornado pela API do Lichess falha silenciosamente, retorna `undefined` à UI e **nunca dispara o cooldown de 1 minuto da fila de rede**, quebrando a invariante do Corte C.
4. **Acúmulo Exaustivo Abaixo da Dobra (UX):** No mobile, a ordem atual do fluxo na página principal do app empilha `TutorCard`, `LearningPlanProposalCard` e `PendingReviewCard` antes do hero `heroBlock` ("Treinando agora" / "Próximo passo"). Isso empurra a ação real do dia para mais de 1000px abaixo da dobra do celular, destruindo o engajamento diário.
5. **Backups Incompletos (Dados):** O backup do app falha em salvar as tabelas `lichessStudies` (estudos salvos) e `appMeta` (estado do onboarding). Ao restaurar o backup em outro dispositivo, o usuário é forçado a passar pelo onboarding novamente e perde o mapeamento de seus estudos de análise.

---

## 2. Notas por Área de Impacto

Abaixo, a Antigravity estabelece seu critério de notas fundamentado na usabilidade prática do dono e na robustez da engenharia de software:

| Área | Peso | Nota Claude | Nota Antigravity | Diagnóstico & Critério Técnico |
| :--- | :---: | :---: | :---: | :--- |
| **Pedagogia / Domínio** | 25% | 7,2 | **7,0** | **Queda para 7,0**: Spaced repetition é linear; `computeMastery` é código morto; `progress-diplomas` nunca é ativado. O motor adaptativo hoje é cosmético. |
| **Frontend / UX / Mobile** | 25% | 7,5 | **7,6** | **Alta para 7,6**: Componentes bem isolados e CSS sem Tailwind de alta qualidade. Peca na ordem visual mobile (foco do TDAH) e no contraste das classes `.fold-meta`. |
| **Dados / Storage** | 20% | 7,5 | **7,4** | **Queda para 7,4**: Perda de dados em `lichessStudies` e `appMeta`; ausência total de migração versionada (`version !== 1` quebra o app). |
| **Rede / PWA / Offline** | 15% | 7,3 | **7,0** | **Queda para 7,0**: Swallowing de erro 429 no replay fura a invariante do Corte C; fila serial sem timeout pode travar o app indefinidamente em conexões 3G oscilantes. |
| **Engenharia / Testes** | 15% | 7,8 | **7,7** | **Queda para 7,7**: Cobertura excelente no domínio, mas nula na camada `src/app/` (lógica orquestradora). `state.ts` com excesso de repetição de contexto. |

**Nota Geral Ponderada (Antigravity): 7,33 / 10** (Equivalente a 7,3).

---

## 3. Revisão e Critique dos Cortes Propostos (D a I)

A Antigravity aceita a taxonomia de Cortes proposta pelo Diretor (Claude), mas sugere **refinamentos estruturais urgentes** em cada escopo para garantir que a execução atinja a excelência da meta 9,5:

### [Corte D — UX: Hero & Acessibilidade]
- **Acordo**: Essencial subir o hero "Próximo passo".
- **Refinamento Antigravity**: O hero deve ficar imediatamente abaixo da barra de progresso e estatísticas diárias (`day-stats`), mas **acima** do `TutorCard`. O `TutorCard` traz feedback narrativo e diagnósticos secundários de erros passados; o que o usuário quer ver ao abrir o app no celular é o botão imediato para iniciar ou continuar o treino atual.
- **Ações**: 
  - Ajustar a ordem em [Today.tsx](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/ui/Today.tsx).
  - Elevar alvos de toque globais `.nav-button` para `44px` no CSS ([index.css](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/index.css)).
  - Ajustar contraste de texto de `.fold-meta` (trocar `--ink-500` por `--ink-600`).

### [Corte E — Pedagogia Adaptativa Real]
- **Acordo**: Ligar as pontas soltas do motor adaptativo.
- **Refinamento Antigravity**: A adaptação do espaçamento não deve ser um simples "pular ou recuar". Propomos um algoritmo de **SM-2 Simplificado** em [pendingItems.ts](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/domain/method/pendingItems.ts):
  - Se `feedback === 'easy'`: `attempts = Math.min(attempts + 2, 4)`. O item salta no tempo (ex: de 1 dia para 7 dias).
  - Se `feedback === 'good'` ou indefinido: `attempts = Math.min(attempts + 1, 4)`.
  - Se `feedback === 'hard'`: `attempts = Math.max(attempts - 1, 0)`. O item recua no espaçamento e repete amanhã (ou permanece em 1 dia).
- **Ações**: 
  - Integrar `computeMastery` no gerador de planos ([generatePlan.ts](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/domain/plan/generatePlan.ts)) para ajustar dinamicamente os valores de `masteryTarget` nos blocos de treino.
  - Implementar o re-disparo do plano imediatamente após a calibração de placement (limpar o plano atual se a banda de ELO mudar).

### [Corte F — Durabilidade dos Dados]
- **Acordo**: Completar o backup e preparar versionamento.
- **Refinamento Antigravity**: O versionamento de backup deve incluir um pipeline de migração formal `migrateBackup(data, fromVersion, toVersion)`. Se o app for atualizado para v2 e receber um backup v1, ele aplica `migrateV1toV2(data)` sequencialmente, em vez de disparar erro fatal.
- **Ações**:
  - Adicionar [lichessStudies](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/infra/storage/appData.ts#L104) e `appMeta` no array de tabelas salvas por [backup.ts](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/infra/storage/backup.ts).
  - Envolver o export de dados em uma transação do Dexie `db.transaction('r', ...)` para evitar exports inconsistentes se o usuário estiver salvando progresso em segundo plano.

### [Corte G — Robustez de Rede]
- **Acordo**: Correção do bug do rate limit no replay e timeouts.
- **Refinamento Antigravity**: O timeout da fila serial deve usar um `AbortController` injetado no fetcher customizado de [providerQueue.ts](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/infra/http/providerQueue.ts). Se uma requisição passar de 30 segundos, ela é abortada, liberando a fila para ações subsequentes do usuário.
- **Ações**:
  - **Urgente**: Corrigir a captura de erro em [trainingLogFlow.ts:258](file:///c:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/src/app/trainingLogFlow.ts#L258) para re-lançar (`throw`) a exceção se ela for instância de `LichessRateLimitError`.
  - Adicionar política de retry com exponencial backoff (1s -> 2s -> 4s) apenas para falhas de rede de transporte (5xx ou `TypeError: Failed to fetch`), mas **nunca** para 429 (que deve respeitar o cooldown estrito).

### [Corte H — Testes & Refatoração de Código]
- **Acordo**: Escrever testes da camada `app/` e dividir bundle.
- **Refinamento Antigravity**: A extração de lógica comum de sync para `syncService.ts` deve deduplicar o carregamento do perfil de usuário e salvamento de timestamps.
- **Ações**:
  - Extrair o helper redundante `buildPlanContext` (repetido em múltiplos métodos de `state.ts`) para centralizar a derivação de estado do plano.
  - Configurar `vite.config.ts` com um objeto `build.rollupOptions.output.manualChunks` explícito para separar dependências de terceiros (como `dexie` e `lucide-react`) em bundles sob demanda.

---

## 4. Recomendações para Decisão do Dono (Corte E)

Para que o **Corte E** (Pedagogia Adaptativa) seja executado sem surpresas visuais na rotina do dono, recomendamos adotar as seguintes respostas para as 3 decisões em aberto:

1. **Plano alternar fraqueza secundária?** 
   - **Sim (Recomendado)**. A repetição exaustiva da fraqueza primária em todos os blocos de transferência gera saturação e cansaço mental. Alternar com a fraqueza secundária no bloco de transferência simula o ambiente de jogo real, onde problemas táticos ocorrem de forma integrada e variada.
2. **Revisão espaçada recuar/avançar no SM-2 Simplificado?**
   - **Sim (Recomendado)**. Se o usuário erra um tema ou acha um exercício muito difícil, o intervalo fixo de 3 ou 7 dias vai frustrá-lo ao reexpor a fraqueza tarde demais. Recuar um nível de attempts no feedback "Difícil" garante re-exposição rápida.
3. **Diploma conquistado mudar a trilha de método?**
   - **Sim (Recomendado)**. O diploma não deve ser apenas cosmético. Conquistar o "Diploma de Peão" ou "Torre" deve sinalizar proficiência tática básica ao currículo, promovendo o usuário de forma automática para trilhas focadas em estruturas mais complexas de meio-jogo ou profilaxia por 7 a 14 dias, validando o esforço de forma tangível.

---

## 5. Resumo Executivo das Notas Pós-Plano

Ao executar a sequência completa de correções, o app atingirá um nível de acabamento, adaptabilidade e robustez de elite:

| Frente | Nota Atual | Nota Alvo (Pós-Corte D-I) | Principais Entregáveis Técnicos |
| :--- | :---: | :---: | :--- |
| **UX / Mobile** | 7,6 | **9,4** | Hero acima do TutorCard, touch targets de 44px, contraste das fontes. |
| **Pedagogia** | 7,0 | **9,2** *(9,5 no Corte 8)* | Algoritmo SM-2 no runtime, mastery ativa, track de diplomas. |
| **Dados** | 7,4 | **9,5** | Backup de `lichessStudies` + versionamento migrável. |
| **Rede** | 7,0 | **9,3** | Correção do rate limit replay, timeouts e retries na fila. |
| **Engenharia** | 7,7 | **9,4** | Testes de fluxo na camada `app/`, refatoração de helpers do `state.ts`. |
| **Geral** | **7,3** | **~9,4 / 10** | **App com loops fechados, adaptativo e resiliente.** |

---

> [!NOTE]
> Este relatório foi consolidado pela Antigravity como uma diretriz de arquitetura e qualidade técnica para orientar os próximos passos de implementação. A aprovação deste plano de ação autoriza a execução atômica dos cortes propostos na ordem de prioridades sugerida.
