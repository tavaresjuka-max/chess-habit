# Relatorio De Revisao: Torre Adaptativa — Antigravity

- IA/autoria: Antigravity (Gemini 3.5 Flash)
- Nome proprio do relatorio: Relatorio de Revisao Torre Adaptativa
- Data da analise: 2026-06-06
- Versao do documento analisado: [2026-06-06-rotina-pessoal-adaptativa-design.md](file:///C:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md) (Proposta 2)
- Sugestao de nome de arquivo: relatorio-antigravity-torre-adaptativa-lichess-tutor.md

---

## 1. Veredito Executivo

A Proposta 2 ([2026-06-06-rotina-pessoal-adaptativa-design.md](file:///C:/Users/tavar/OneDrive/Documentos/CLAUDE%20CODE/APRENDER%20XADREZ/lichess-tutor/docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md)) representa um avanço excepcional em relação à especificação anterior e consolida com precisão as correções exigidas na auditoria geral. O escopo pessoal ajustado para a modelagem clean-room elimina completamente os riscos de contaminação de Propriedade Intelectual (PI) com o repositório pago `chessking-tutor`.

Entretanto, para que a especificação esteja **100% pronta para execução segura pelo Codex**, é necessário corrigir **dois erros de contrato de API do Lichess**, detalhar as **fórmulas matemáticas do detector de fraquezas** e preencher as **lacunas de tempo do gerador de planos**. Sem esses ajustes, o Codex será obrigado a "adivinhar" regras essenciais, violando as premissas de determinismo.

---

## 2. Análise Detalhada dos 9 Pontos de Avaliação

### 1. Execução-Prontidão para o Codex
O spec está estruturado e delimitado de forma muito superior à primeira versão, porém **ainda não está pronto para o Codex implementar de forma autônoma** devido a ambiguidades em regras de domínio:
*   **Ausência de Divisão Exata do Orçamento de Tempo (Seção 10):** A especificação define a estrutura para 5 min e 60 min, mas para **15 min** e **30 min** ela indica apenas os blocos qualitativos (*"1 tema + revisao curta"*; *"aquecimento + tema + transferencia"*), sem definir o tempo exato estimado de cada bloco (ex: no plano de 30 min, o aquecimento é de 5 ou 10 min? A transferência é de 10 ou 15 min?). O Codex terá que inventar estes números.
*   **Falta de Normalização Matemática de Scores (Seção 7):** O spec descreve qualitativamente os gatilhos das fraquezas, mas não fornece os limites e pesos numéricos exatos para o cálculo de `score` (uma variável do tipo `number` de 0 a 1). 
*   **Vagueza no Fallback de Slugs (Seção 8):** O documento prevê a validação de temas no runtime contra `lichess.org/training/themes` com um fallback local. O mecanismo de parser desse HTML de temas de puzzles do Lichess no runtime não está especificado, o que é um fator de risco de quebra caso o layout do Lichess mude.

### 2. Análise da Arquitetura
A arquitetura baseada em camadas (`UI` -> `Aplicação` -> `Domínio` -> `Infra`) com a regra de ouro de isolamento do Domínio em TypeScript puro é tecnicamente correta, robusta e facilita o teste sistemático.
*   **Fragilidade de Validação de Slugs:** O Domínio não pode importar a Infra. Portanto, a validação de slugs contra a web na inicialização exige que a camada de Aplicação gerencie o estado do cache de slugs obtido pela Infra e injete no Domínio. O fluxo de injeção desse mapa de temas dinâmico no domínio precisa estar explícito para que o domínio permaneça puro.
*   **Volatilidade dos Dados Locais (Pré-P3):** Durante as Fases P0, P1 e P2 (antes da implementação do sync em P3), a PWA dependerá 100% da integridade do banco de dados local IndexedDB do navegador. Limpezas automáticas de cache do navegador do usuário podem deletar todo o histórico e notas locais.

### 3. Correções Herdadas dos Relatórios Anteriores
A Proposta 2 resolve com sucesso quase todos os P0 apontados anteriormente:
*   **Clean-room e Isolamento IP (ADR-005):** Plena conformidade. O repositório nasce isolado. Verificamos o repositório original `chessking-tutor` em modo leitura e constatamos que a nova especificação de dados abandonou inteiramente os schemas proprietários (`ChessKingCourse`, `ChessKingProgressItem`, `ChessKingRecord`).
*   **Tipos Estritos (Seção 6):** Resolvido. A introdução de `SignalValue` como uma union discriminada (`kind`) substituiu o tipo genérico `unknown`, garantindo a validação de tipos em compilação.
*   **Taxonomia Generificada:** ChessKing foi integralmente retirado do domínio, existindo apenas a fonte genérica `'outro'` de texto livre para registros manuais de estudo off-line.
*   **Sync Adiado e Seguro (ADR-007):** Plenamente integrado no roadmap para a Fase P3, especificando o merge por registro usando `updatedAt` para resolver o problema de sobrescritas LWW.

### 4. Integração Lichess: Contratos e Limites

#### Fatos Pesquisados
1.  **Falta do parâmetro `accuracy` na exportação em massa (ndjson):** Conforme verificado na documentação viva da API do Lichess (`GET /api/games/user/{username}`), não existe o parâmetro de consulta `accuracy=true`. A acurácia e o ACPL (Average Centipawn Loss) só são retornados nativamente no JSON se a partida tiver análise computacional prévia e a requisição contiver `evals=true` (ou no endpoint individual do jogo `/game/export/{game_id}`).
2.  **Falta do parâmetro `sort`:** O endpoint de exportação de partidas do Lichess não aceita `sort=dateDesc`. Ele ordena por data decrescente (mais recentes primeiro) por padrão ao exportar ndjson.
3.  **Lichess Fair Play e Análise:** O Lichess desencoraja fortemente a análise de partidas em andamento. O spec está correto ao limitar a importação de partidas exclusivamente a jogos finalizados (`sort=dateDesc` de partidas jogadas).

#### Inferências
*   A inclusão de `accuracy=true` e `sort=dateDesc` na chamada de API é inútil ou pode causar rejeições de query HTTP (dependendo do rigor do gateway do Lichess). O Codex deve remover esses parâmetros da consulta de exportação de partidas do Lichess, mantendo apenas os válidos (`evals=true`, `clocks=true`, etc.).

#### Opinião
*   A extração de sinais derivados das partidas analisadas (judgment/acpl/blunders) é sólida, mas o parser de ndjson precisa estar preparado para quando o objeto `analysis` estiver ausente (jogos rápidos não analisados pelo usuário). A especificação aborda isso corretamente no parser tolerante.

### 5. Detector de Fraquezas
As regras propostas na Seção 7 são conceitualmente sólidas para a faixa de 0 a 1200 ELO (foco em peças penduradas, mate em 1 e 2, e táticas básicas), mas têm duas fragilidades matemáticas:
*   **Ausência de Limite Mínimo de Partidas (Volume):** Se o usuário tiver um único sinal de `clock` com timeoutLoss em 3 partidas, a regra o classificará como tendo fraqueza de `time-trouble` com confiança `medium`. O detector deve exigir uma quantidade mínima de partidas (ex: mínimo de 10 jogos no ritmo analisado) antes de disparar scores de fraqueza altos.
*   **Atribuição Inadequada de Sinal (Color bias):** Associar a perda maior de brancas/pretas (`color.lossRate` desbalanceado) diretamente à tag de fraqueza `opening-principles` é conceitualmente fraco. Um desbalanceamento de cores pode ser fruto de perfil tático ou problemas de meio-jogo/defesa. A confiança deve ser reduzida para `low` ou a regra deve ser redefinida como apenas uma indicação para revisar aberturas sob aquela cor específica.

### 6. Privacidade e Propriedade Intelectual (IP)
O spec obedece rigidamente à governança de clean-room de dados:
*   Não há herança de tabelas ou dados proprietários do app pago.
*   O armazenamento local (IndexedDB) de notas e metadados não contém PII de contato (sem e-mail, telefone ou nome real).
*   A chave de sync em P3 baseada em `hash(codigo)` garante anonimato absoluto nos registros da nuvem Cloudflare D1.

### 7. Sincronização (Fase P3)
A decisão (ADR-007) de adotar o Cloudflare D1 em vez de Workers KV soluciona o problema de consistência eventual e a concorrência de escritas. O merge no nível de registro com `updatedAt` mitiga as perdas de dados críticas mapeadas no relatório anterior.
*   **Lacuna no Mecanismo de Remoção (Exclusão):** O spec detalha o status dos blocos (`pending`/`done`/`skipped`) mas não descreve como lidar com a exclusão física de registros locais (ex: excluir uma nota de estudo off-line ou apagar um sinal manual). Sem um mecanismo de **tombstone** (marcação lógica de deletado com timestamp), itens deletados localmente reaparecerão no pull após a sincronização com o banco de dados central.

### 8. Ordem das Fases ( Roadmap P0 a P5 )
A ordem das fases está tecnicamente correta:
1.  **P0:** Base do Domínio + PWA local + Planos Fixos (valida a estrutura local antes de tocar a rede).
2.  **P1:** Integração com Lichess de forma adaptativa local (primeira entrega de valor real).
3.  **P2:** Mecanismo de feedback e consistência local (loop de valor pedagógico).
4.  **P3:** Sync em D1 (conveniência agregada após validação do valor pedagógico).
5.  **P4:** Chess.com e outras fontes manuais leves.
6.  **P5:** Lançamento público da comunidade (OAuth, internacionalização).
A conveniência do sync e integrações secundárias estão corretamente posicionadas após a consolidação do valor local.

---

## 3. O que cortar, o que falta, o que está perigoso

### O que cortar do Spec
*   **Parâmetros inválidos de API:** Remover `accuracy=true` e `sort=dateDesc` da lista de parâmetros da URL de exportação de partidas no Lichess (Seção 9).
*   **Imagens em Sync:** Reafirmar explicitamente o corte de sincronização de arquivos de imagem no D1 (Seção 13) para evitar inflar o banco e estourar os limites gratuitos de armazenamento de 5GB.

### O que falta no Spec (Adicionar antes do Codex executar)
1.  **Matemática de Orçamento de Tempo (Seção 10):**
    *   Definir regras de duração de blocos para 15 minutos (ex: 10 min de tema + 5 min de revisão).
    *   Definir regras de duração de blocos para 30 minutos (ex: 5 min de aquecimento + 15 min de tema + 10 min de transferência).
2.  **Definição das Fórmulas do Detector (Seção 7):**
    *   Exemplo: `score = (blunders + (mistakes * 0.5)) / total_moves`.
    *   Exemplo: `score` de `time-trouble` = `timeoutLosses / games` (para `games` >= 10).
3.  **Tombstones no Sync (Seção 13):**
    *   Especificar que deletar um registro localmente apenas marca `deleted = 1` e atualiza `updatedAt`, permitindo que o D1 replique a exclusão física em outros dispositivos e limpe o registro posteriormente.

### O que está perigoso (Avisos Críticos)
> [!WARNING]
> **Risco de perda total de dados locais nas fases P0 a P2:** Como o app funciona de forma puramente local-first por meio do IndexedDB e não há servidor ou sync implementados até a fase P2, o usuário pode perder todo o seu progresso caso decida limpar os dados de navegação (cookies/cache do navegador). 
> *   *Mitigação:* É fundamental introduzir na UI principal um botão visível de **"Exportar Backup Manual (JSON)"** desde a Fase P0, instruindo o usuário a salvar o progresso regularmente até a implementação da sincronização na Fase P3.
