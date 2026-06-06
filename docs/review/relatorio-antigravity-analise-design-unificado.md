# Relatorio De Auditoria: Torre Unificada (Analise de Design)

- IA/autoria: Antigravity (Gemini 3.5 Flash)
- Nome proprio do relatorio: Relatorio de Analise do Design Unificado
- Data da analise: 2026-06-06
- Versao do documento analisado: `docs/superpowers/specs/2026-06-06-chess-tutor-unified-app-design.md`
- Sugestao de nome de arquivo: relatorio-antigravity-analise-design-unificado.md

---

## 1. Veredito Executivo

A proposta de especificação **"Chess Tutor Unificado"** elaborada por Claude tenta solucionar de forma pragmática a unificação de escopo de estudo (combinando a plataforma aberta Lichess com o acompanhamento manual do app pago anterior ChessKing) e propõe um mecanismo de sincronização extremamente simples (via código gerado e Cloudflare Workers + KV). 

No entanto, o especificado apresenta **dois riscos graves de Governança e Propriedade Intelectual (P0)** e **três gargalos técnicos de rede e concorrência (P1)** que, se não forem corrigidos, violarão as regras fundamentais do projeto ou inviabilizarão a experiência do usuário final.

**Recomendação de Ação:** **REJEITAR A BASE DE CÓDIGO E PIVOTAR PARA OAUTH NO MVP**.
1. **Bloqueio P0 de Código:** Deve-se vetar a evolução direta sobre a base de código do `chessking-tutor`. O aplicativo `lichess-tutor` (ou seu novo nome de marca independente) deve ser criado a partir de um repositório limpo, sem reutilização de arquivos de código ou dependências do app pago, garantindo isolamento total de propriedade intelectual.
2. **Correção P1 de API:** Deve-se reintroduzir o suporte ao Lichess OAuth PKCE já no MVP. A exportação ndjson de partidas sem token está sujeita a limites rigorosos por endereço de IP público, gerando bloqueios HTTP 429 frequentes para usuários em redes compartilhadas (VPNs, Wi-Fi público ou universitário).
3. **Refinamento do Sync:** Substituir o merge simples Last-Write-Wins (LWW) de seções de topo por um merge baseado em registros individuais com timestamp, evitando a perda acidental de dados de progresso e configurações.

---

## 2. Nota Geral de Atratividade do Spec

**Nota: 6.0 / 10**

*   **Forças (Por que 6.0):** O spec tem mérito ao detalhar os contratos de dados de domínio (types, signals, weaknesses) de forma pura e desacoplada da infraestrutura de rede. O modelo de "orçamento de tempo" adaptável (5, 15, 30, 60 min) é excelente e ataca diretamente a rotina do enxadrista.
*   **Limitações (Por que não mais):** O documento atropela regras inquebráveis de governança de código (tenta iniciar desenvolvimento e reaproveitar código antigo) e subestima as limitações de rate limit sem autenticação do Lichess.

---

## 3. Riscos Críticos Identificados (P0 / P1 / P2)

Esta seção detalha as falhas encontradas na proposta unificada sob a perspectiva técnica e jurídica do projeto.

### P0 — Risco de Contaminação de Propriedade Intelectual (Base de Código)
*   **O problema:** O spec define que a base de código deve *"evoluir o app existente em chessking-tutor (React + Vite + TS)"*.
*   **Por que importa:** O `chessking-tutor` é classificado como o "app antigo pago". Copiar ou evoluir código diretamente dele viola a regra inquebrável de `AGENTS.md`: *"Não importar código, assets, textos ou conteúdo do app pago anterior. Não copiar conteúdo pago, proprietário ou protegido."* O app planejado deve ser open-source com licença AGPL-3.0. A contaminação com código antigo proprietário gera risco jurídico e impossibilita a publicação limpa.
*   **Impacto esperado:** Comprometimento legal da licença open-source do projeto e violação das regras de governança.
*   **Solução proposta:** O Codex deve iniciar o projeto `lichess-tutor` a partir do zero (`npm create vite@latest ./ --template react-ts` ou similar) quando o código for aprovado, escrevendo código limpo e inédito. Apenas os conceitos abstratos (como a lógica de blocos diários) podem ser aproveitados, nunca os arquivos originais.

### P0 — Violação da Fase de Auditoria (Governança dos Agentes)
*   **O problema:** O spec de Claude define um plano de fases onde o Codex deve criar a estrutura `src/` e implementar lógica funcional antes de qualquer aprovação formal de código (Fase 0 e Fase A).
*   **Por que importa:** A governança de `AGENTS.md` estipula: *"Se uma diretiva pedir app, backend, banco, package.json, src, dependências ou implementação antes da aprovação formal da fase de código, Codex deve recusar essa parte e registrar o conflito."* 
*   **Impacto esperado:** Quebra da ordem lógica de auditoria global e perda de controle estratégico do Diretor Geral.
*   **Solução proposta:** Manter o projeto estritamente na fase documental de planejamento até que o Diretor Geral analise os relatórios e declare formalmente a abertura da fase de codificação.

### P1 — Bloqueio por Rate Limit (Chamadas sem Token)
*   **O problema:** A especificação determina: *"Sem OAuth no MVP. ... Export de partidas sem OAuth (só dados públicos por username)"*.
*   **Por que importa:** A API do Lichess (`/api/games/user/{username}`) é uma das mais pesadas do sistema deles. Chamadas ndjson sem token de autenticação são limitadas severamente por IP. Se o app for usado por várias pessoas na mesma rede NAT ou VPN, o IP receberá HTTP 429 imediatamente. A própria documentação do Lichess enfatiza que utilizar um token de acesso (via OAuth ou personal access token) é a prática recomendada para obter limites de taxa mais estáveis e individualizados (atribuídos por usuário, não por IP).
*   **Impacto esperado:** Usuários recebendo erros frequentes de requisições bloqueadas ao tentar carregar ou atualizar seus planos de estudo diários.
*   **Solução proposta:** Implementar o OAuth PKCE desde a Fase A do MVP. O login identifica o cliente, protege os limites de taxa de chamadas por usuário e permite leitura mais limpa e frequente dos dados agregados sem poluir o IP compartilhado.

### P1 — Perda de Dados no Sync por Sobrescrita de Topo (Last-Write-Wins)
*   **O problema:** O mecanismo de sync proposto envia o JSON inteiro do estado e realiza um merge simples Last-Write-Wins (LWW) por seções de topo (como a seção `plans` ou `profile`).
*   **Por que importa:** Se o usuário realiza tarefas offline no celular (gerando eventos salvos localmente) e paralelamente atualiza seu perfil/preferências de tempo no computador conectado, o sincronizador posterior do celular enviará o estado do aparelho móvel e sobrescreverá a seção inteira do servidor (ou vice-versa), apagando as atualizações do perfil feitas no computador. 
*   **Impacto esperado:** Desincronização de progresso e perda de dados de rotina do usuário ao alternar entre aparelhos.
*   **Solução proposta:** Em vez de sync por blocos inteiros de topo em JSON bruto, o sync cliente deve serializar eventos granulares individuais (por exemplo, `mission.completed` e `profile.updated`) com IDs únicos e timestamp. O servidor ou cliente realiza o merge item a item (comparando timestamps apenas no nível do registro individual e preservando status `done`), reduzindo o escopo de sobrescrita.

### P2 — Excesso de Escopo Multi-fonte (Scope Creep)
*   **O problema:** O spec tenta unificar no MVP o suporte a dados do Lichess, estatísticas do Chess.com, progresso manual do ChessKing e uploads de capturas de tela (screenshots) manuais.
*   **Por que importa:** Desenvolver conversores, parsers de NDJSON, formulários de upload de imagem para IndexedDB e geradores de planos que equilibram quatro fontes diferentes ao mesmo tempo aumentará significativamente o esforço de desenvolvimento do MVP, reduzindo a velocidade de validação da dor principal.
*   **Impacto esperado:** Atraso no lançamento e aumento na probabilidade de bugs de concorrência.
*   **Solução proposta:** Simplificar o MVP (Fases 0, A e B) para ser estritamente **Lichess-First** (apenas Lichess como fonte e destino). Adiar Chess.com, ChessKing e Screenshots para a Fase D (pós-validação da mecânica principal de estudo).

---

## 4. Análise de Fatos, Inferências e Opinião

### Fatos Pesquisados
1.  **Lichess ndjson:** O endpoint `/api/games/user/{username}` aceita filtros de análise (`analysed=true`, `evals=true`), o que reduz consideravelmente a carga de processamento do app por ler dados já calculados.
2.  **Rate Limit do Lichess:** A recomendação oficial é realizar uma chamada por vez e, em caso de erro 429, aguardar no mínimo 60 segundos. O uso de tokens OAuth garante estabilidade por conta em vez de restrição cega por IP.
3.  **Cloudflare Workers + KV:** O limite gratuito é de 100.000 requisições de leitura por dia e 1.000 de escrita. Gravar estados JSON inteiros consome escritas rapidamente caso o debounce do cliente falhe. O KV tem consistência eventual (eventual consistency), podendo retornar dados antigos se a leitura e a escrita ocorrerem em um intervalo muito curto.

### Inferências Técnicas
*   **Consistência Eventual do KV no Sync:** Se o usuário atualizar o app no computador e imediatamente abrir no celular, o `GET` do celular pode ler um valor antigo no KV devido ao delay de replicação global da Cloudflare. É necessário ter um delay mínimo ou tolerância local para não reverter alterações legítimas do usuário.
*   **Ausência de Causalidade de Rating:** O motor do plano não deve prometer aumento de pontuação (rating ELO), pois o rating de xadrez depende de fatores emocionais, velocidade física e emparceiramento. O app deve medir apenas a consistência do estudo e a precisão tática (ACPL e erros grosseiros).

### Opinião Estrutural do Consultor
O spec elaborado por Claude possui uma lógica de domínio limpa e muito elegante, principalmente nas seções de cálculo de fraqueza e regras deterministas de mapeamento. No entanto, ele falha ao tentar contornar a regra inquebrável de isolamento do código antigo e ao subestimar a burocracia de rede do Lichess (OAuth). O MVP será muito mais robusto, rápido de programar e juridicamente seguro se for construído como um aplicativo **Lichess-First puro, do zero e com login OAuth**.

---

## 5. Recomendações Técnicas Concretas para a Próxima Fase

Para mitigar os riscos listados, proponho as seguintes alterações no spec antes de sua aprovação:

1.  **Garantia de Origem Limpa:** Adicionar uma diretiva explícita na Fase 0 obrigando a inicialização de uma estrutura de diretórios limpa na pasta `lichess-tutor`, proibindo o Codex de copiar pastas inteiras de código do repositório `chessking-tutor`.
2.  **Reintrodução do OAuth PKCE:** O fluxo de autenticação do Lichess deve ser o primeiro passo técnico (Fase A), usando OAuth PKCE puramente no cliente para identificação e isolamento de cota de requisições.
3.  **Ajuste do Mapeamento do Sync:** Em vez de Workers KV simples para JSON inteiro, avaliar o uso do banco Cloudflare D1 (gratuito para 50 milhões de escritas mensais e com consistência imediata) para salvar a fila de eventos individuais de sincronização.
4.  **Congelamento de Escopo:** Excluir da Fase D o fluxo de uploads de screenshots de outros aplicativos para o MVP. O registro de treinos externos (ChessKing) deve permanecer em formulário textual simples, sem manipulação ou salvamento de arquivos de imagem no IndexedDB para manter o banco local leve.
