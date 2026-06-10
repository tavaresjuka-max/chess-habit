# Relatório DeepSeek — Contestação da Análise Geral (2026-06-10)

Autor: DeepSeek (consultor crítico). Papel: advogado do diabo. O que sobreviver aqui merece
implementação; o que não sobreviver, volta para correção.

---

## 1. Veredito geral do relatório do Claude

**Nota: 6/10**

O relatório é honesto e bem estruturado, mas sofre de três vícios de quem está dentro do projeto:
otimismo sobre custo real de features "narrativas" (G-4), subestimação da complexidade de placement
sem tabuleiro (G-2) e uma priorização que inverte o que o próprio dono declarou como urgente. A seção
de riscos captura o IndexedDB mas ignora o risco de abandono por TDAH — o aluno some por 3 semanas,
os sinais envelhecem e o loop de adaptação colapsa.

---

## 2. Tabela achado-a-achado

| # | Achado | Veredito | Argumento |
|---|--------|----------|-----------|
| A-2 | `state.md` dizia "iniciada", método concluído | CONCORDO (já corrigido) | Staleness trivial. Corrigido. Sem objeção. |
| A-3 | Spec vigente em `AGENTS.md` obsoleto | CONCORDO, mas gravidade SUBESTIMADA | O relatório classifica como "Alta" e joga no Corte 0 como "promover spec de archive para specs/". O problema é mais grave: não existe UM spec canônico do método implementado. O código seguiu 9 commits a partir de um prompt de execução (`prompts/archive/2026-06-method/codex-implementar-metodo-professor-lemos.md`), não de uma spec de design. Se outro agente ler AGENTS.md hoje e seguir o spec 2026-06-06, implementará um app sem método 5 trilhas, sem DAMP, sem diplomas. Isso não é "higiene" — é risco de regressão. A correção proposta (mover de archive para specs/) é insuficiente: o prompt de execução não é spec de design. É preciso escrever UMA spec de design do método implementado que unifique o que de fato está no código. |
| A-4 | ADR-006: nome "sem-oauth" vs conteúdo "com OAuth" | CONCORDO | Cosmético, mas revela desleixo em nomeação que pode confundir busca. O relatório minimiza como "Baixa". Concordo com a gravidade, discordo que seja só renomear: ADRs são imutáveis por convenção. O correto é criar ADR-006a ou adendo, não renomear arquivo de decisão já tomada. |
| A-5 | Numeração duplicada em decisions.md | CONCORDO (já corrigido) | Trivial. |
| A-6 | LICENSE ausente | CONCORDO, mas INCOMPLETO | O relatório diz "barato de resolver". É barato colocar o arquivo. Mas AGPL-3.0 tem implicações para P5 que o relatório não discute: se P5 for SaaS (Cloudflare Workers/D1), AGPL-3.0 NÃO cobre SaaS — precisa de AGPL-3.0 + Commons Clause ou mudar para AGPL-3.0-or-later com nota. Decidir licença AGORA sem pensar no modelo de distribuição futuro é criar dívida legal. |
| C-4 | Visão colaborativa vs P4/P5 congeladas | CONCORDO | O relatório acerta: é sequenciamento, não contradição. Mas erra ao dizer que "a ordem P0→P5 ficou obsoleta como mapa". As fases P0-P3 foram concluídas conforme o plano. O que aconteceu depois (Polish, Lemos 1/2A/2B, catálogo, método) foi trabalho DENTRO de P3, não fora da numeração. O relatório está confundindo "trabalho adicional dentro de uma fase" com "fases faltando no mapa". O mapa P0-P3→P4→P5 segue válido; o que precisa é decidir se os cortes 1-7 são "P3 continuada" ou "nova fase P3.5". |
| C-5 | Tom adulto vs microcopy iniciante | CONCORDO | A harmonização "simples ≠ infantil" é correta. Mas o relatório não aponta a contradição REAL: `metodo-consolidado` tem microcopy como "O tabuleiro é um mapa de ruas" (infantilizante) ao lado de "Dama por torre é mau negócio — a menos que venha mate" (adulto). A banlist do Lemos proíbe "missão épica" mas "mapa de ruas" é exatamente isso. O problema não é tom — é inconsistência interna no microcopy já escrito nos 19 blocos. |
| C-6 | Bandas para organização vs metas do aluno | CONCORDO, mas a solução é FRACA | O relatório diz "bandas para sequenciar, horas/esforço para metas, diplomas para marcos. Os três sistemas já existem em embrião". Isso é verdade no domínio, mas NÃO na UI. A tela Hoje mostra bandas? Não. Mostra horas? Sim, nos checkpoints. Mostra diplomas? Sim, Peão/Torre/Rei. Mas o aluno NÃO VÊ em que banda está. A separação é correta como princípio; a implementação atual confunde os três sistemas porque dois deles são visíveis e um é invisível. |
| G-1 | Currículo 0→teto | CONCORDO com o gap, DISCORDO da priorização | O gap é real e grande. Mas o relatório coloca currículo 1200-2200 como Corte 7 (último). Isso faz sentido tático (o dono está em 800-1200), mas é estrategicamente perigoso: se o app já nasce com 19 blocos 0-1200 e ZERO blocos 1200-2200, o placement (G-2) não tem onde pousar acima de 1200. Ou seja: G-2 depende de G-1 para faixas acima de 1200. Priorizar G-2 antes de G-1 faz sentido para a faixa do dono; para qualquer outro usuário, é construir entrada sem saída. |
| G-2 | Placement | DISCORDO da priorização (ver seção 5) | O dono citou placement como item 2 da visão. O relatório coloca como Corte 6 (penúltimo), depois de recompensas, importação e painel. Isso é uma inversão grave. Placement é PRÉ-REQUISITO para o painel fazer sentido (como o próprio relatório admite: "placement sem mapa de habilidades não tem onde pousar"). Mas o inverso também é verdade: painel sem placement mostra dados sem contexto. A diferença é que placement é FUNDACIONAL — determina todo o resto do plano. Não pode vir depois de features cosméticas. |
| G-3 | Importação de atividade livre | CONCORDO com o gap, DISCORDO da complexidade estimada | O relatório diz que é "Médio" e que "APIs já usadas". Isso subestima brutalmente o trabalho: importar atividade livre exige (a) janela temporal configurável, (b) deduplicação contra treino já creditado, (c) reconciliação de partidas como "estudo" vs "diversão" (o dono joga com amigos no Chess.com — isso conta?), (d) evitar que o botão vire "CTRL+Z do plano" (importar atividade que contradiz o plano do dia). Nenhum app conhecido faz isso bem por um motivo: é um problema de classificação de intenção, não de API. |
| G-4 | Relatório pós-sessão | DISCORDO veementemente da complexidade estimada | O relatório classifica como "Médio" e diz "quase tudo é narrativa sobre dados já persistidos". Isso é FALSO. Um relatório que explica "o que os sinais mostram" e "o que vem na próxima e POR QUÊ" exige: (a) interpretação causal dos sinais (por que o aluno errou garfos HOJE? foi cansaço? lacuna de conhecimento? distração?), (b) projeção de trajetória (se continuar assim, em quantas sessões o gap fecha?), (c) linguagem natural em PT-BR que não pareça template. O que está implementado hoje (`dayCompletionSummary`) é um resumo de contagem, não um relatório. A distância entre "você fez 3 blocos e acertou 70% em garfos" e "seus garfos estão melhorando, mas você ainda erra quando o cavalo e o bispo atacam juntos — na próxima sessão vamos isolar esse padrão" é ENORME. Isso é NLG (natural language generation) com raciocínio causal. Classificar como "narrativa sobre dados existentes" é subestimar em uma ordem de grandeza. |
| G-5 | Painel de progresso | CONCORDO | Gap real. Mas o relatório não especifica quais visualizações, quais métricas, qual granularidade. "Mapa de habilidades" é vago. Isso vai gerar retrabalho quando a spec de UI for escrita. |
| G-6 | Recompensas por esforço | CONCORDO com a direção, DISCORDO do otimismo | O relatório diz "pesquisa curta → spec → domínio → UI". Pesquisa sobre gamificação para TDAH em contexto educacional não é "curta". É um campo com décadas de literatura e resultados MISTOS (muitos estudos mostram que gamificação pode AUMENTAR ansiedade em TDAH, não reduzir). O anti-pattern listado no próprio método ("gamificação vazia") existe por um motivo. Fazer isso certo exige mais do que uma "pesquisa curta". |
| G-7 | Metas semanais/mensais | CONCORDO | Gap pequeno. Agregação sobre logs. Único gap que o relatório estima corretamente. |
| G-8 | Pesquisa pedagógica contínua | CONCORDO, mas INCOMPLETO | O relatório diz "formalizar ciclo". Mas não especifica quem formaliza, com que custo, com que frequência. A pesquisa de 3 ondas consumiu 3 IAs em paralelo por dias. Isso não escala como "ciclo contínuo". Precisa de um protocolo de triagem (quais livros merecem análise completa vs sumária?) e um orçamento de atenção (quantas horas de IA por mês?). |
| G-9 | UX parecida com Lichess/Chess.com | CONCORDO | Gap médio. Mas "audit de UX + design tokens inspirados" é vago. O Lichess usa múltiplas paletas (board themes); Chess.com tem UI proprietária. "Parecido" sem "copiado" é difícil de especificar. |
| G-10 | Plataforma colaborativa | CONCORDO (congelado) | Sem objeção. |
| G-11 | Sync multi-dispositivo | CONCORDO (mitigar R-1 primeiro) | Sem objeção. |

---

## 3. Os 5 pontos mais fracos do relatório do Claude

### Ponto fraco 1: O relatório acredita na própria estimativa de custo

O relatório classifica G-4 como "Médio" e G-2 como "Médio", mas G-7 como "Pequeno". Isso revela um
viés sistemático: features que o Claude ENTENDE bem (agregação de logs) são "pequenas"; features que
o Claude NÃO entende completamente (NLG causal, classificação de intenção) são "médias" porque a
ignorância as faz parecer mais simples do que são.

**Evidência**: o relatório diz que G-4 é "quase tudo narrativa sobre dados já persistidos". O código
atual em `dayCompletionSummary` (ver `src/domain/coach/`) é literalmente um template de contagem. A
distância entre o que existe e o que a visão pede ("explica o que será feito na sessão seguinte e por
quê") é um problema de NLG + raciocínio causal que exigiria um modelo de linguagem ou, no mínimo,
uma máquina de templates com dezenas de regras condicionais. Nenhum dos dois está no escopo atual
(sem engine, sem API de IA externa).

### Ponto fraco 2: A priorização dos cortes contradiz a visão declarada do dono

O dono declarou (VISAO.md, item 2): "Avaliação de entrada (placement). Onde a pessoa entra no curso".
Placement é o SEGUNDO item da visão. No relatório, placement é o Corte 6 — penúltimo lugar, depois
de badges, importação e painel.

A justificativa do relatório ("placement sem mapa de habilidades não tem onde pousar") se
auto-refuta: o painel (G-5) também não tem sentido sem placement. Um painel de progresso sem saber
de onde o aluno partiu é um placar sem baseline. E pior: implementar painel ANTES de placement
significa escrever UI que depois terá que ser reestruturada quando placement entrar, porque o painel
precisa mostrar "você começou em X, está em Y, seu gap é Z".

### Ponto fraco 3: O relatório ignora o risco de abandono por TDAH

O projeto inteiro é desenhado para um dono com TDAH (checkpoints 6h/12h, retorno sem vergonha,
metas pequenas visíveis). Mas o relatório não menciona o risco de ABANDONO como risco crítico. Se o
aluno some por 3 semanas (padrão TDAH clássico), o que acontece?

- Os sinais de Chess.com envelhecem (P1 usa bound de recência de ~3 meses, mas a relevância
  pedagógica decai antes).
- As pendências com repetição espaçada (1/3/7/14) perdem o timing.
- O plano do dia foi gerado para um estado de conhecimento que já não é mais verdadeiro.
- O retorno após ausência (`daysSinceLastSession >= 2`) é definido na Etapa 1 do Lemos, mas é só
  uma mensagem de boas-vindas — não recalibra o plano inteiro.

Isso é MAIS crítico que R-1 (perda de dados) porque dados perdidos podem ser regenerados; um aluno
perdido por abandono não volta. A mitigação deveria incluir um "modo de retorno após ausência longa"
que reavalia o plano inteiro, não só dá bom-dia.

### Ponto fraco 4: O relatório não propõe métricas de validação

O relatório menciona que "tudo que o método afirma ainda precisa sobreviver ao uso real do dono por
semanas" (seção 9). Mas não propõe NENHUMA métrica de validação. O que significa "sobreviver"? O
dono usar por 2 semanas e não desinstalar? O dono melhorar em puzzles? O dono sentir que aprendeu?

O próprio método (`metodo-professor-lemos.md`) tem um Protocolo de Validação Pessoal com checkpoints
de 6h, 12h, 24h — mas ele mede ADESÃO ("o aluno voltou ao app?"), não EFICÁCIA ("o aluno melhorou
em algo mensurável?"). Para um projeto que se orgulha de honestidade epistêmica, a ausência de um
plano de validação da eficácia é uma lacuna grave.

**Proposta**: antes de implementar qualquer Corte 2-7, rodar um protocolo de validação de 4 semanas
com o dono medindo:
- Taxa de acerto em puzzles do tema-foco (pré vs pós 10 sessões)
- Redução de blunders/partida (Lichess analysis)
- Tempo até abandono de sessão (medir se o aluno conclui ou pula)
- Qualidade do feedback (taxa de `hard` vs `good` vs `easy`)
Sem esses números, implementar features novas é construir no escuro.

### Ponto fraco 5: O relatório confunde "congelado" com "não preciso pensar agora"

P4 está congelada, mas a decisão 4 de 2026-06-10 explicitamente diz: "Schema Dexie deve considerar
merge-key por registro desde já". O relatório menciona isso de passagem, mas não propõe NENHUMA ação
concreta AGORA para preparar o schema para sync futuro.

O que deveria estar no Corte 0:
- Auditar o schema Dexie atual: toda tabela tem `id` único? `updatedAt`? `createdAt`?
- Campos que serão mergeados (ex.: `trainingLog`) precisam de `id` determinístico (UUID), não
  autoincrement.
- Definir a chave de merge AGORA (UUID + timestamp + dispositivo) para não ter que migrar schema
  depois.
- Planejar a serialização de export: JSON lines? NDJSON? SQLite?

Isso não é implementar P4 — é não criar dívida que torne P4 3x mais cara depois.

---

## 4. O que faltou (lacunas, riscos, contradições não vistos pelo Claude)

### Lacuna 1: O método quebra acima de 1200 e o relatório não diz COMO

O `metodo-consolidado` tem 19 blocos detalhados para 0-1200 e uma tabela com 3 linhas para
1200-2200. A lacuna "cálculo-ponte 800-1200" é reconhecida como aberta. Mas o relatório trata G-1
(currículo 1200-2200) como Corte 7 — "continuar pesquisa dirigida" — sem reconhecer que:

1. A abordagem pedagógica para 0-1200 (temas rotulados, Practice guiado, LPDO) NÃO funciona acima
   de 1400, onde os problemas são posicionais, não táticos.
2. O Lichess tem ZERO recursos oficiais para estratégia, estrutura de peões, profilaxia e cálculo
   profundo — os recursos que o método consolidado lista para 1400+.
3. Acima de 1800, o método depende de Dvoretsky, Aagaard e material que é PROPRIETÁRIO — o projeto
   não pode usar sem comprar/licenciar.

Em outras palavras: o método atual é um curso 0-1200 com um apêndice aspiracional 1200-2200. Isso
não é um "curso completo". Chamar de "curso completo 0→2200" quando 80% do conteúdo acima de 1200
não existe é desonesto — exatamente o tipo de promessa que o projeto diz evitar.

### Lacuna 2: O app não funciona offline de verdade

O relatório diz "PWA offline-shell" como item concluído. Mas o app depende de:
- Abertura de links no Lichess (requer internet)
- Puzzle Activity/Dashboard/Replay via OAuth (requer internet)
- Chess.com PubAPI (requer internet)

O que funciona offline? A tela Hoje com plano do dia já gerado, os logs locais e o timer. Se o aluno
está offline, ele pode VER o que deveria estudar, mas não pode ESTUDAR (porque o treino abre no
Lichess). Isso não é "offline" — é "cache de UI".

**Risco**: a PWA é instalável, o que cria a expectativa de funcionamento offline. Se o aluno instala
e depois abre sem internet, vê um plano que não pode executar. Isso é pior que não ter PWA: gera
frustração.

**Mitigação**: o modo offline deveria oferecer atividades locais (revisão de conceitos em texto,
quiz de reconhecimento de padrões sem tabuleiro interativo, revisão do histórico de erros). Nada
disso existe no plano atual.

### Lacuna 3: Zero discussão sobre acessibilidade

O projeto é para um dono com TDAH. Mas TDAH frequentemente coexiste com outras condições
(dislexia, ansiedade). O relatório não menciona:
- Contraste e tamanho de fonte ajustáveis
- Suporte a leitor de tela (os cards do Lemos são texto puro ou têm ARIA?)
- Redução de animações (respeitar `prefers-reduced-motion`)
- Navegação por teclado

Se a PWA vai ser usada por anos, acessibilidade não é "nice to have" — é retenção.

### Lacuna 4: O relatório não audita o código contra as regras inquebráveis

O relatório diz que verificou `npm run lint && npm run test && npm run build`. Isso verifica que o
código compila e os testes passam. NÃO verifica:
- Se há PGN completo persistido em algum caminho de código (a regra é "nunca persistir PGN
  completo")
- Se tokens OAuth aparecem em algum log/export
- Se a clean-room foi violada em algum lugar (ex.: nomes de arquivo, comentários, referências)
- Se há importação de código do app pago

Uma auditoria de compliance contra as 15+ regras inquebráveis de `AGENTS.md` deveria ser um gate
antes de qualquer Corte novo. Não foi feita.

### Lacuna 5: "Diplomas" como soft gate são frágeis

O sistema de diplomas (Peão/Torre/Rei) é baseado em Tirado & Silva (1999) — uma fonte brasileira de
25+ anos atrás. O relatório aceita isso sem questionar:
- Os critérios de diploma são calibrados para a federação brasileira de 1999. Eles traduzem para
  Lichess Puzzles em 2026?
- O diploma do Rei cobre 1000-1200. O curso vai até 2200. Cadê os diplomas para 1200-1800 e
  1800-2200?
- Se o aluno falha no diploma, o que acontece? Fica preso na banda? Por quanto tempo? O relatório
  não especifica o comportamento de falha.

O sistema de diplomas é uma ideia excelente, mas está subespecificado para 60% do curso.

### Contradição 1: "Sem prometer rating" vs "curso 0→2200"

O relatório resolve C-1 definindo 0→2200 como teto. Mas o próprio nome "0→2200" É uma promessa de
rating. Dizer que "o curso ensina até o aluno não precisar mais do app" é um eufemismo: o que
significa "não precisar mais"? Significa atingir 2200? Significa ter autonomia de estudo? O primeiro
é promessa de rating; o segundo é vago demais para ser medido.

A resolução honesta: o curso não é "0→2200" — é "0→autonomia", onde autonomia é definida como "o
aluno consegue analisar as próprias partidas sem engine, identificar seus erros e escolher o que
estudar". Isso é mensurável (avaliação de saída: "analise esta partida e monte um plano de estudos
para a semana") sem prometer rating. Mas o relatório não propõe essa reformulação.

### Contradição 2: Badges por esforço vs anti-pattern "gamificação vazia"

O relatório diz que C-3 está resolvido (badges aprovados). Mas o próprio método consolidado lista
"gamificação vazia (badges/pontos sem aprendizado)" como anti-pattern. A distinção "badges por
ESFORÇO" vs "badges por RATING" é insuficiente: um badge "1000 puzzles este mês" pode incentivar
fazer puzzles rápido e mal para bater a meta. Badge por esforço SEM qualidade é gamificação vazia
com outro nome.

A spec de badges precisa incluir MÉTRICAS DE QUALIDADE (ex.: "1000 puzzles com taxa de acerto >70%"
ou "1000 puzzles sem pular a revisão de erros"). O relatório não menciona essa necessidade.

### Risco não visto: Dependência de APIs de terceiros sem fallback

O app depende de:
- Lichess API (oficial, gratuita, mas pode mudar)
- Chess.com PubAPI (não documentada oficialmente como estável)
- Lichess OAuth (se o Lichess revogar o registro do app, para de funcionar)

O relatório não discute o que acontece se uma dessas APIs mudar ou for descontinuada. Para um app
"local-first", a dependência de 3 serviços externos para funcionamento BÁSICO (diagnóstico, treino,
reconciliação) é uma fragilidade arquitetural.

---

## 5. Priorização alternativa de cortes

| Posição | Corte original (Claude) | Corte proposto (DeepSeek) | Justificativa |
|---------|--------------------------|---------------------------|---------------|
| Corte 0 | Higiene e decisões (C-1, A-3, A-4, A-6) | **Higiene + preparação para P4** | Adicionar: auditoria de schema Dexie para merge-key, escolha de UUID determinístico, definição de formato de export. Aproveitar que vai mexer no schema para já deixar pronto para sync. |
| Corte 1 | Resiliência (R-1) | **Resiliência + validação do método** | R-1 é urgente. Mas junto com ele, iniciar protocolo de validação de 4 semanas com o dono (métricas de eficácia, não só adesão). Sem validação, os Cortes 2-7 são construídos sobre areia. |
| Corte 2 | Relatório pós-sessão (G-4) + metas (G-7) | **Placement (G-2) + currículo base 1200-2200 (G-1 parcial)** | Placement é item 2 da visão do dono. É fundacional: determina TODO o resto. Sem placement, relatório de sessão não tem baseline, painel não tem ponto de partida, importação não sabe o que creditar. G-1 parcial (esboço de blocos 1200-1400) é pré-requisito para placement acima de 1200. |
| Corte 3 | Importação (G-3) | **Resiliência offline real** | Antes de importar atividade livre, garantir que o app funciona sem internet. Atividades offline locais (revisão de conceitos, quiz de reconhecimento, revisão de histórico). Se o aluno está offline 30% do tempo (transporte, fila, etc.), o app hoje é inútil nesses momentos. |
| Corte 4 | Painel (G-5) | **Relatório pós-sessão (G-4) + metas (G-7)** | Com placement e validação no lugar, o relatório agora TEM baseline e TEM significado. Mas NOTA: a complexidade real de G-4 exige scoping cuidadoso (ver ponto fraco 1). Sugiro começar com "resumo de sessão enriquecido" (template com 2-3 regras condicionais), não com NLG completo. |
| Corte 5 | Recompensas (G-6) | **Painel (G-5)** | Com placement, validação e relatórios, o painel tem dados reais para mostrar. |
| Corte 6 | Placement (G-2) | **Importação (G-3)** | Só depois que o loop básico (placement→plano→sessão→relatório→painel) funciona é que faz sentido importar atividade externa. |
| Corte 7 | Currículo (G-1) | **Recompensas (G-6)** | Badges vêm por ÚLTIMO. São a camada de açúcar, não de nutrição. E exigem pesquisa TDAH adequada (2-4 semanas de revisão de literatura + design iterativo), não "pesquisa curta". |
| — | — | **Currículo 1200-2200 denso (G-1 completo)** | Depende de pesquisa adicional, compra de material de referência (Yusupov, Dvoretsky, Aagaard) e resolução da lacuna "recursos Lichess para estratégia". É um projeto à parte. |

### Defesa da inversão G-2 (placement) sobre G-4 (relatório):

O relatório defende G-4 como "feature de maior valor/custo" porque "quase tudo é narrativa sobre
dados já persistidos". Isso é falso por duas razões:

1. **Dados sem baseline são ruído.** Um relatório que diz "você fez 3 blocos e acertou 70% em
   garfos" não responde "onde você está no curso e para onde vai". Sem placement, o relatório é um
   extrato bancário sem saldo inicial.

2. **Placement é usado TODA VEZ que um novo usuário entra.** Relatório é usado a cada sessão. Se o
   app vai ter 1 usuário (o dono), placement é usado 1 vez e relatório 100 vezes — faria sentido
   priorizar relatório. Mas a visão é de plataforma colaborativa (item 4 da visão), o que implica
   múltiplos usuários no futuro. Placement é o funil de entrada de cada um.

---

## 6. Respostas às 7 perguntas abertas da seção 10

### Pergunta 1: Teto do curso: 2200+autonomia ou manter "3000"?

**Resposta**: 2200+autonomia é o honesto. Mas o nome público não pode ser "0→2200" — isso É promessa
de rating. O nome deve ser "0→autonomia" e o teto 2200 fica como referência interna de
sequenciamento, não como promessa visível. A comunicação: "O curso cobre do zero até o jogador forte
de clube. A partir daí, você aprendeu a estudar sozinho — e o app te ajudou a chegar lá."

### Pergunta 2: Meta escondida: número absoluto ou marcos elásticos?

**Resposta**: A decisão já está tomada (marcos elásticos). Mas o relatório não especifica: os marcos
são VISÍVEIS ou ESCONDIDOS? A visão do dono diz "quebradas em metas semanais e mensais a partir de
uma meta escondida". Isso implica que os marcos de longo prazo (100h, 500h, 1000h) são escondidos e
as metas semanais/mensais são visíveis. Concordo. Marcos de longo prazo visíveis viram fonte de
ansiedade ("ainda faltam 800 horas??"). Mas as metas semanais/mensais precisam de um design que
evite a sensação de "estou atrasado" — sugiro metas como "esta semana: 5 sessões" em vez de "this
week: 2.5 horas", porque sessão concluída é binário (fez/não fez) enquanto horas são contínuas e
geram comparação.

### Pergunta 3: Ordem dos cortes 2-6: discordam?

**Resposta**: Discordo totalmente. Ver seção 5 acima. Placement (G-2) precisa subir para Corte 2.
Relatório (G-4) desce para Corte 4. A justificativa está detalhada na seção 5.

### Pergunta 4: R-1: export automático local basta por quanto tempo?

**Resposta**: Indefinidamente se for combinado com `storage.persist()` + backup em arquivo local +
backup via Lichess Study (opt-in). Mas há um cenário que o relatório não considera: o dono usa o app
em DOIS dispositivos (desktop + celular) e faz export/import manual entre eles. Isso funciona para 1
usuário técnico, mas é frágil: overwrite de dados mais recentes, merge de logs parcial, esquecimento
de exportar antes de trocar de dispositivo.

**Recomendação**: implementar as 3 mitigações do relatório (persist, export automático, Study
backup). Mas ADICIONAR um hash de integridade no export (SHA-256 do conteúdo) e um contador de
versão monotônico para detectar conflitos de merge manual. E definir o schema Dexie com merge-key
agora (ver ponto fraco 5).

### Pergunta 5: Placement: questionário + histórico bastam, ou precisa de calibração?

**Resposta**: Questionário + histórico NÃO bastam para placement de qualidade. Por quê:
- Histórico de partidas dá rating e temas de erro, mas não dá profundidade conceitual (o aluno SABE
  o que é um garfo ou só acerta por instinto?).
- Questionário autodeclarado sofre de viés de autoavaliação (iniciantes se superestimam;
  experientes se subestimam).
- Sem tabuleiro próprio, a calibração tem que usar recursos Lichess + autorrelato.

**Proposta**: um fluxo de placement em 3 etapas:
1. **Questionário curto** (5 perguntas): "Você sabe o que é oposição?", "Já estudou finais de
   torre?", "Costuma analisar suas partidas depois?" — respostas SIM/NÃO/PARCIALMENTE.
2. **Sessão de calibração no Lichess**: o app gera um Study com 10-15 posições de diagnóstico (mate
   em 1, garfo, peça pendurada, final de peão) e pede para o aluno jogar contra o computador ou
   resolver. O aluno clica em "Acertei" / "Errei" / "Não sei" (autorrelato).
3. **Leitura de histórico**: Chess.com/Lichess APIs para sinais objetivos (blunder rate, accuracy,
   temas de puzzle errados).

O placement final é a interseção das 3 fontes com peso maior para a etapa 2 (performance observada,
mesmo que autorrelatada). Sem tabuleiro próprio, é a melhor aproximação possível.

Quanto ao custo: isso é MAIS trabalho do que o relatório estima (não é "Médio", é "Grande"). Mas é
trabalho que precisa ser feito ANTES de features dependentes.

### Pergunta 6: Badges para TDAH: evidência e desenho?

**Resposta**: A literatura é MISTA. Alguns achados relevantes:
- Recompensas intermitentes e imprevisíveis (como notificações de badge surpresa) podem ser mais
  eficazes para TDAH do que recompensas previsíveis (déficit de dopamina busca novidade). Mas também
  podem viciar — o aluno busca o badge, não o aprendizado.
- Streaks (sequências) são particularmente PERIGOSOS para TDAH: perder um streak gera desmotivação
  desproporcional ("já quebrei, pra que continuar?"). O relatório acerta em proibir streak punitivo.
- Feedback imediato e concreto funciona melhor que recompensa abstrata ou distante. "Você concluiu 5
  sessões esta semana" é melhor que "Badge: Guerreiro da Consistência".

**Desenho recomendado**:
1. Badges são SURPRESA (não tem barra de progresso "só mais 2 para o próximo badge").
2. Badges celebram COMPORTAMENTO ESPECÍFICO, não acúmulo: "Esta semana você revisou todos os seus
   erros antes de fazer puzzles novos" é melhor que "1000 puzzles".
3. Badges são EFÊMEROS na UI (aparecem, celebram, somem). Não viram coleção permanente que gera
   ansiedade de completar.
4. NUNCA mostrar "badges que você não tem". Sem grid cinza de "você ainda não conquistou".
5. Pesquisa formal antes de implementar: revisão sistemática de gamificação para TDAH em contexto
   educacional (Google Scholar: "gamification ADHD education systematic review"). Estimar 2-4
   semanas de trabalho de pesquisa antes da spec.

### Pergunta 7: Algo FACTUALMENTE errado no relatório?

**Resposta**: SIM.

1. **"O spec do método vive em pasta de archive" (A-3)**: Parcialmente falso. O spec de design do
   método NÃO EXISTE como spec. O que está em archive é um PROMPT DE EXECUÇÃO, não um spec de
   design. Dizer que o spec "vive em archive" implica que existe um spec e está no lugar errado. A
   verdade é pior: o spec não foi escrito.

2. **"G-4 é quase tudo narrativa sobre dados já persistidos"**: Falso. Narrativa requer NLG ou
   máquina de templates complexa. Os dados persistidos são logs de sessão (horas, blocos feitos,
   feedback). Transformar isso em "o que os sinais mostram e o que vem na próxima e por quê" exige
   raciocínio causal. Isso não está implementado nem é trivial.

3. **"G-3: APIs já usadas"**: Parcialmente falso. As APIs de puzzle activity/dashboard/replay são
   usadas para reconciliação. Mas importação de ATIVIDADE LIVRE GERAL (partidas jogadas por conta,
   puzzles feitos fora do plano, estudos abertos espontaneamente) não tem API no Lichess que diga
   "o que o usuário fez nas últimas horas". O Lichess não expõe um feed de atividade geral. A única
   forma seria cruzar múltiplas APIs (puzzle activity + games export + estudos) e INFERIR o que foi
   "estudo" vs "diversão". Isso é um problema de classificação, não de API.

4. **"O trabalho real desde P3 aconteceu fora da numeração de fases" (C-4)**: Discutível. Polish,
   Lemos 1/2A/2B, catálogo e método 5 trilhas são todos trabalho DENTRO do escopo de P3 (loop de
   valor, timer, feedback, OAuth, reconcilição de puzzles, Study). O relatório trata como se fosse
   trabalho "fora" da numeração, mas P3 foi uma fase grande que incluiu múltiplas iterações. A
   numeração P0→P3→P4→P5 segue válida; o que existe é trabalho adicional DENTRO de P3, não fases
   novas.

---

## 7. Top-3 recomendações que defendo contra qualquer contra-argumento

### Recomendação 1: Placement ANTES de qualquer feature de progresso

Se o app não sabe de onde o aluno partiu, NENHUMA feature de progresso (relatório, painel,
recompensas, metas) tem significado. É como um GPS que mostra "você andou 3km" sem saber de onde
você saiu nem para onde vai.

Placement (G-2) deve ser o Corte 2, imediatamente após higiene e resiliência de dados (Cortes 0 e
1). Nenhuma feature de "mostrar progresso" faz sentido sem baseline. Esta recomendação é
auto-evidente e não requer validação externa: sem placement, o resto é cosmético.

### Recomendação 2: Protocolo de validação de eficácia ANTES de expandir features

O projeto já tem 250 testes, lint verde, build verde e ZERO evidência de que o método funciona para
melhorar o xadrez do dono. Implementar 7 cortes de features novas sem validar se o que já existe
funciona é construir um castelo sobre um alicerce não testado.

Proponho um protocolo de 4 semanas:
- Semanas 1-2: baseline (medir acerto em puzzles, blunders/partida, taxa de conclusão de sessão)
- Semanas 3-4: intervenção (usar o app como está, sem features novas)
- Métricas: delta de acerto em puzzles do tema-foco, delta de blunders/partida, taxa de abandono de
  sessão, tempo até segunda sessão após ausência
- Gate: se não houver melhora mensurável em PELO MENOS UMA métrica, repensar o método antes de
  expandir

Esta recomendação é desconfortável (atrasa features novas) mas necessária: o projeto se define pela
honestidade epistêmica. Validar o método é a única forma de manter essa honestidade.

### Recomendação 3: Preparar schema e arquitetura para sync AGORA, mesmo com P4 congelada

A decisão 4 de 2026-06-10 já determinou isso. Mas precisa de ações concretas:
1. Auditar todo schema Dexie e garantir que cada registro tem UUID determinístico (não
   autoincrement).
2. Adicionar campos `createdAt`, `updatedAt`, `deviceId` em toda tabela que será sincronizada.
3. Definir estratégia de merge (last-write-wins com timestamp? CRDT? log de operações?).
4. Implementar export com checksum de integridade e versão monotônica.
5. Testar cenário de merge: dispositivo A e B offline, ambos produzem dados, depois sincronizam.

Isso não implementa P4. É o equivalente a deixar os canos passados na parede antes de rebocar: custa
pouco agora, evita quebrar a parede depois. O custo de fazer isso AGORA é baixo (1-2 dias de
trabalho). O custo de NÃO fazer é reescrever metade do schema Dexie e toda a lógica de export quando
P4 descongelar.

---

## Resumo executivo para o dono

O relatório do Claude é competente e bem-intencionado, mas sofre de excesso de otimismo sobre a
facilidade de features "narrativas" e de uma priorização que coloca cosméticos (badges, relatórios)
antes de fundações (placement, validação). As três coisas que precisam acontecer ANTES de qualquer
feature nova são: (1) definir onde o aluno entra no curso, (2) provar que o método funciona com
dados reais, e (3) preparar o banco local para não ter que ser reescrito quando sync chegar. O resto
pode esperar.
