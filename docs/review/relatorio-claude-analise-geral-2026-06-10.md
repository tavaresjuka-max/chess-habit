# Relatório Claude — Análise Geral Profunda do Projeto (2026-06-10)

Autor: Claude (Diretor Geral). Papel desta rodada: análise crítica completa do estado do
projeto contra a visão declarada pelo dono em 2026-06-10 (`docs/VISAO.md`). Este relatório
será contestado por DeepSeek, Gemini e Codex; depois da contra-argumentação, o que sobreviver
vira plano de implementação.

Verificação técnica feita nesta análise: `npm run lint` OK; `npm run test` 250 testes verdes
em 41 arquivos; `npm run build` PWA OK. Working tree limpa no commit `efd8e51`.

---

## 1. Sumário executivo

**A ideia é boa e o projeto está saudável — mas a visão de 2026-06-10 muda a escala do jogo.**
O que existe hoje é uma ferramenta pessoal 0-1200 sólida, com método pedagógico baseado em
evidência real (426+ livros/papers analisados em 3 ondas), privacidade exemplar e disciplina
de engenharia rara (domínio puro, 250 testes, gate verde em todo commit). O que a visão pede
é um **curso completo com placement, recompensas, relatórios de sessão, painel de progresso e
plataforma colaborativa** — nada disso contradiz as fundações, mas quase tudo está faltando.

Encontrei **6 erros/staleness factuais** (3 já corrigidos nesta sessão), **6 contradições ou
ambiguidades de escopo** que precisam de decisão do dono, **1 risco crítico subestimado**
(perda de dados: anos de progresso vivem só em IndexedDB local, que o browser pode apagar) e
**11 lacunas** entre a visão e o estado atual, priorizadas na seção 8.

Veredito: não falta qualidade, falta **decisão de teto, camada de progresso/recompensa e
resiliência de dados**. A pesquisa pedagógica está à frente da implementação — o gargalo agora
é produto, não método.

---

## 2. O que existe hoje (inventário verificado)

### Código (src/)
- **Domínio puro testado**: `Signal → Weakness → Plan` (`generatePlan`, `normalizePlan`,
  `planSessions`, `timeBudget`); coach (`diagnosis`, `sessionMessage`, `sessionMilestones`,
  `learningPlanProposal`, `dayCompletionSummary`); método 5 trilhas (`methodTracks`,
  `pendingItems` com repetição espaçada 1/3/7/14, `diplomas` Peão/Torre/Rei, `mastery`,
  `selectMethodTrack`); catálogo curado (`resourceCatalog`, `catalogSkills`,
  `resourceSelector`, `destinations`).
- **Integrações**: Chess.com PubAPI read-only (diagnóstico primário, parse PGN transiente),
  Lichess NDJSON (secundário), OAuth PKCE opt-in (`puzzle:read`, `study:write`), Puzzle
  Dashboard/Replay agregados.
- **UI**: tela Hoje treino-first (TutorCard, LearningPlanProposalCard, PendingReviewCard,
  SessionMilestonesCard), Config em seções, PWA offline-shell, Dexie v4.

### Documentação (80+ arquivos .md)
- Governança: `AGENTS.md`, `PLANO.md`, 8 ADRs, `memory/` (6 arquivos vivos).
- Pedagogia canônica: `metodo-professor-lemos.md`, `metodo-consolidado-acervo-2026-06-09.md`
  (escada 0→2200+, 19 blocos 0-1200, 12 drill formats, regras SE-ENTÃO),
  `curriculum-0-2000.md`, playbook, plano pedagógico do acervo.
- Pesquisa: 3 ondas de análise de acervo (124 + 235 + 67 arquivos) por DeepSeek/Gemini/Codex,
  evidência acadêmica (24 estudos), mapa de 17 métodos, listas de compra e download.

### Processo
- Governança multi-IA funcionando: Claude planeja/arbitra, Codex executa, DeepSeek/Gemini
  consultam. Rodadas de debate com relatórios nomeados já são prática estabelecida.

---

## 3. O que já está ótimo (não mexer)

1. **Honestidade epistêmica como arquitetura.** "Linguagem de hipótese, sem promessa de
   rating" está em AGENTS, método, microcopy e até nos tipos. Isso é raro e é o maior
   diferencial competitivo contra apps que vendem fumaça.
2. **Privacidade local-first real**: PGN transiente, tokens fora de export, sinais derivados
   apenas. Compatível com LGPD por design — crucial para a fase comunidade.
3. **Clean-room disciplinado** com pipeline de direitos autorais (estudos rejeitados por
   copyright catalogados, manifestos com licença/SHA-256). O projeto pode virar open-source
   sem esqueleto no armário.
4. **Método com base real**: a fusão DeepSeek+Gemini+Codex corrigiu erros entre rodadas (caso
   DAMP: interpretação errada do Gemini corrigida por leitura direta da fonte). O processo de
   pesquisa se autocorrige — isso valida o modelo multi-IA.
5. **Engenharia**: domínio puro sem rede/React, 250 testes, gate por fase, commits atômicos.
6. **Design TDAH-coerente**: metas pequenas visíveis, checkpoints 6h/12h/24h, retorno sem
   vergonha, pendências agendadas invisivelmente. A visão de recompensas por esforço é a
   extensão natural disso.

---

## 4. Erros e staleness encontrados (A-1 a A-6)

| # | Erro | Gravidade | Status |
|---|------|-----------|--------|
| A-1 | `README.md` afirmava "este projeto ainda não contém app, src ou código executável" — falso há semanas; status "planejamento e auditoria" | Alta (engana qualquer agente/colaborador novo) | **Corrigido em 2026-06-10** |
| A-2 | `memory/state.md` dizia que a implementação do método estava "iniciada" — os 9 commits foram concluídos e o gate está verde | Média | **Corrigido em 2026-06-10** |
| A-3 | `AGENTS.md` aponta como "spec de execução vigente" o spec de 2026-06-06, mas o trabalho real desde então seguiu specs posteriores (polish, Lemos etapas 1/2A/2B, método 5 trilhas em `prompts/archive/`). O ponteiro canônico está obsoleto e o spec do método vive em pasta de archive | Alta (ambiguidade sobre qual documento manda) | Aberto — proposta na seção 8 |
| A-4 | `docs/adr/ADR-006-adaptativo-sem-oauth-sem-engine.md`: nome do arquivo diz "sem-oauth", conteúdo revisado diz "Com OAuth Opt-in" | Baixa (cosmético, mas confunde busca) | Aberto — renomear ou registrar nota |
| A-5 | `memory/decisions.md`, seção Onda 2: numeração duplicada (dois itens "5.") | Baixa | **Corrigido em 2026-06-10** |
| A-6 | LICENSE ausente. AGPL-3.0 é "planejada" desde o início e o projeto se declara open-source em todo documento, mas o repositório não tem arquivo de licença. Sem LICENSE, o código é "todos os direitos reservados" por padrão | Média (barato de resolver, bloqueia colaboração futura) | Aberto |

---

## 5. Contradições e ambiguidades de escopo (C-1 a C-6)

### C-1. Quatro tetos de curso diferentes (a contradição mais importante)
- `PLANO.md`: "Foco pessoal: faixa **0-1200**".
- `memory/project.md`: público "até cerca de **2000**".
- `docs/pedagogy/curriculum-0-2000.md`: currículo **0-2000**.
- `metodo-consolidado`: escada **0→2200+** ("2200+: aluno já autônomo — fora do escopo").
- Visão 2026-06-10: "curso completo do **0 ao 3000**".

Não existe hoje UMA resposta para "até onde vai o curso". Além disso, "3000" tem problema de
honestidade: 3000 FIDE nunca foi atingido por humano (pico de Carlsen: 2882); em rating
Lichess, 3000 é território de super-GM/título. Um projeto cuja regra inquebrável é "não
prometer rating" não pode ter como promessa de marketing um número que nenhum usuário
atingirá. **Recomendação**: adotar a escada do método consolidado como verdade única — curso
denso 0→2200 + faixa final "2200+: autonomia" (o curso ensina o aluno a não precisar mais
dele). Comunicar como "do zero ao jogador forte de clube" e tratar "0 ao 3000" como aspiração
interna, não promessa. Atualizar PLANO.md e project.md para a mesma resposta.

### C-2. "30 mil horas" não tem fonte e contradiz a pesquisa do próprio projeto
A literatura que o projeto já catalogou (`academic_evidence.md`: prática deliberada explica
26-34% da variância; Gobet & Campitelli: média ~11.000h até mestre, variância 3.000-23.000h)
não sustenta "30 mil horas". 30.000h = 8h/dia por 10 anos — irreal como meta de hobby e
desnecessário: para "jogador forte de clube" (1800-2000), a ordem de grandeza é de poucos
milhares de horas. **Recomendação**: a "meta escondida" deve ser elástica e calibrável
(ex.: marcos de 100h / 500h / 1.000h / 5.000h), nunca um número único pseudocientífico. A
mecânica que o dono quer (quebrar em metas semanais/mensais, celebrar "30h este mês") fica
intacta — só o denominador muda.

### C-3. Badges/medalhas vs anti-pattern "gamificação vazia"
`metodo-consolidado` lista como anti-pattern "gamificação vazia (badges/pontos sem
aprendizado)"; `do-not-do.md` proíbe streak punitivo. A visão pede "badges e medalhas de
conquistas". **Não é contradição real, mas precisa de spec**: a fronteira é badges por
ESFORÇO E PROCESSO com significado pedagógico (horas, puzzles resolvidos, pendências
quitadas, constância sem punição por ausência) — nunca por rating, nunca com perda/vergonha,
nunca como moeda. O risco TDAH é real nos dois sentidos: recompensa demais vira ruído;
de menos, o app perde o aluno. Isso merece pesquisa própria (gamificação para TDAH em
contexto educacional) antes de implementar.

### C-4. Visão de plataforma colaborativa vs P4/P5 congeladas
A visão fala em comunidade, colaboração e contribuições externas; P4 (sync) e P5 (comunidade,
renomeação, disclaimers) estão congeladas por decisão do dono. **Não é contradição — é
sequenciamento sem data.** Mas a ordem de fases P0→P5 do AGENTS.md ficou obsoleta como mapa:
o trabalho real desde P3 (polish, Lemos 1/2A/2B, catálogo premium, método 5 trilhas) aconteceu
fora da numeração de fases. **Recomendação**: re-mapear o roadmap pós-P3 com fases nomeadas
(ver seção 8) e critérios objetivos de descongelamento de P4/P5, para o AGENTS.md voltar a
descrever a realidade.

### C-5. Tom "adulto, sem infantilizar" vs microcopy "adequado a um aluno jovem/iniciante"
`AGENTS.md` e `professor-lemos.md` definem tom adulto; a decisão de 2026-06-09 sobre a
introdução de garfos pede texto "adequado a um aluno jovem/iniciante". Tensão leve mas real
para quem escreve microcopy. **Recomendação**: harmonizar como "linguagem simples ≠ infantil":
vocabulário acessível, frases curtas, zero jargão — mantendo a banlist do Lemos (sem "missão
épica", sem gíria, sem mascote).

### C-6. A própria visão tem uma tensão interna: "0 ao 3000" vs "metas de horas, não de rating"
O dono pediu, na mesma mensagem, um curso denominado em rating (0→3000) e um sistema de metas
que rejeita rating como métrica. As bandas de rating funcionam como **organização de
conteúdo** (o que ensinar em que ordem) — isso é legítimo e o método já faz. O que não pode é
virar **meta do aluno** ("chegue a 1500"). A resolução: bandas para sequenciar, horas/esforço
para metas, diplomas para marcos. Os três sistemas já existem em embrião no código; falta
explicitar essa separação na UI e na comunicação.

---

## 6. Risco crítico subestimado

### R-1. Anos de progresso vivem em um único IndexedDB local
Um curso de milhares de horas gera anos de histórico (logs, sinais, pendências, diplomas,
feedback). Hoje tudo isso vive **apenas** no IndexedDB de UM browser em UM dispositivo.
Browsers podem apagar IndexedDB sob pressão de armazenamento ("best-effort storage"); limpar
dados do site, reinstalar o SO ou trocar de máquina destrói o histórico. Existe export
manual, mas backup manual é exatamente o tipo de tarefa executiva que o design TDAH do
projeto assume que o aluno NÃO fará.

P4 (sync com backend) resolve isso, mas está congelada — e não precisa ser descongelada
inteira: **mitigações locais baratas existem** e não violam nenhuma regra:
1. Solicitar `navigator.storage.persist()` (uma linha, reduz risco de eviction).
2. Export automático periódico para arquivo local (download silencioso ou File System
   Access API), com lembrete sóbrio quando o último backup estiver velho.
3. (Opcional, opt-in) usar o próprio Lichess Study como veículo de backup já autorizado por
   `study:write` — limitado, mas zero backend.

Isso deveria entrar ANTES de qualquer feature nova da visão: não adianta construir o curso
de anos se o save game pode evaporar.

---

## 7. Gap analysis: visão 2026-06-10 vs estado atual

| # | Item da visão | Estado atual | Tamanho do gap |
|---|---------------|--------------|----------------|
| G-1 | Curso completo 0→teto | Denso 0-1200 (19 blocos); 1400+ só esboço na escada | Grande: currículo denso 1200-2200, recursos curados por banda, decisão C-1 antes |
| G-2 | Placement (questionário + histórico Lichess/Chess.com) | Diagnóstico por sinais existe; onboarding importa nível/temas como sinais manuais; NÃO existe questionário estruturado que posicione o aluno numa banda/bloco do curso | Médio: fluxo de entrevista inicial + calibração por puzzles + leitura de histórico já implementada |
| G-3 | Botão "importar o que fiz por conta própria" | Reconciliação de puzzles via OAuth existe (manual e oportunista); NÃO existe importação geral de atividade recente creditada contra o plano | Médio: puzzle activity + partidas recentes → crédito em pendências/trilhas. APIs já usadas; respeitar "só sinais derivados" |
| G-4 | Relatório pós-sessão + "na próxima faremos X porque Y" | Fechamento do dia existe (resumo de blocos/tempo/feedback); adaptação acontece mas NÃO é explicada como relatório nem como plano da próxima sessão | Médio: camada de narrativa sobre dados que já existem |
| G-5 | Painel amplo de progresso ("o que sei, como melhoro, onde travo") | Reconhecido como lacuna no próprio método doc ("falta painel dedicado de Progresso") | Grande: tela Progresso com mapa de habilidades por tema (estável/instável/não visto), tendências, pendências, diplomas |
| G-6 | Sistema de recompensa por esforço (badges, medalhas) | Checkpoints 6h/12h/24h existem; nenhum sistema de badges | Médio: spec C-3 primeiro, depois domínio puro + UI |
| G-7 | Metas semanais/mensais da meta escondida | Checkpoints por horas acumuladas existem; não há agregação semanal/mensal ("você treinou 30h esse mês") | Pequeno: agregação sobre logs existentes |
| G-8 | Pesquisa pedagógica contínua | Funciona muito bem (3 ondas), mas é processo ad-hoc | Pequeno: formalizar ciclo ingestão→análise multi-IA→delta verificado→integração ao método |
| G-9 | UX parecida com Lichess/Chess.com | Polish feito, mas nunca auditado contra essa referência | Médio: audit de UX + design tokens inspirados (sem copiar assets) |
| G-10 | Plataforma colaborativa open-source | Congelada (P5); sem LICENSE, CONTRIBUTING, renomeação | Grande, mas explicitamente futuro |
| G-11 | Sync multi-dispositivo (implícito em "plataforma") | Congelada (P4); risco R-1 ativo | Grande; mitigar R-1 agora, P4 depois |

---

## 8. O que precisa ser feito — proposta priorizada

Princípio: continuar em cortes pequenos com gate verde, como até aqui. Nada abaixo descongela
P4/P5 sem decisão do dono.

**Corte 0 — Higiene e decisões (dias)**
1. Resolver C-1 (teto do curso) — decisão do dono após o debate. Alinhar PLANO.md,
   project.md, curriculum.
2. Corrigir A-3: promover o spec do método de `prompts/archive/` para
   `docs/superpowers/specs/` e atualizar o ponteiro "spec vigente" no AGENTS.md.
3. A-4, A-5: renomear/anotar ADR-006, corrigir numeração em decisions.md.
4. A-6: adicionar LICENSE AGPL-3.0 (decisão já tomada em todo doc; só falta o arquivo).

**Corte 1 — Resiliência de dados (R-1) — ANTES de feature nova**
`navigator.storage.persist()` + export automático/backup com lembrete sóbrio.

**Corte 2 — Fechar o loop do "treinador dos sonhos" (G-4 + G-7)**
Relatório pós-sessão (o que foi feito, o que os sinais mostram, o que vem na próxima e POR
QUÊ) + metas semanais/mensais sobre logs existentes. É a feature de maior valor/custo: quase
tudo é narrativa sobre dados já persistidos.

**Corte 3 — Importação de atividade livre (G-3)**
Botão "importar o que fiz": puzzle activity (já autorizada) + partidas recentes → créditos no
plano e nas pendências. Diferencial real do produto; nenhum app conhecido faz isso bem.

**Corte 4 — Painel Progresso (G-5)**
Tela dedicada: mapa de habilidades por tema, tendência, pendências, diplomas, horas.
Pré-requisito para G-6 fazer sentido.

**Corte 5 — Recompensas por esforço (G-6, após spec C-3)**
Pesquisa curta (gamificação TDAH) → spec → domínio puro → UI.

**Corte 6 — Placement (G-2)**
Questionário de entrada + calibração por puzzles + histórico → banda/bloco inicial.
(Vem depois do painel porque placement sem mapa de habilidades não tem onde "pousar".)

**Corte 7 — Currículo 1200-2200 denso (G-1)**
Continuar pesquisa dirigida às lacunas já documentadas (cálculo-ponte, defesa, Dvoretsky
acima de 1800) e escrever blocos por banda como os 19 existentes.

**Horizonte (decisão do dono)**: P4 sync → P5 comunidade (renomear, CONTRIBUTING,
disclaimers, hardening, G-9 audit UX, G-10).

---

## 9. Veredito sobre a ideia

A ideia é boa e — mais importante — o projeto provou nos últimos 4 dias que consegue executar
em alta velocidade sem quebrar as próprias regras. Os diferenciais defensáveis: honestidade
epistêmica, privacidade local-first, método com base bibliográfica real, grátis/open-source, e
a futura importação de atividade livre (G-3). O maior risco não é técnico nem pedagógico: é
**escopo** — a visão descreve produto de anos; sem a disciplina de cortes que o projeto já
tem, ela vira lista de desejos. O segundo maior risco é R-1 (dados). O terceiro é validação
n=1: tudo que o método afirma ainda precisa sobreviver ao uso real do dono por semanas.

---

## 10. Perguntas abertas para a rodada de debate

1. Teto do curso: 2200+autonomia (minha recomendação) ou manter "3000" como aspiração visível?
2. A meta escondida deve existir como número absoluto ou só como marcos relativos elásticos?
3. Ordem dos cortes 2-6: discordam da priorização? Qual troca de ordem e por quê?
4. R-1: export automático local basta por quanto tempo antes de P4 virar necessidade?
5. Placement: questionário + histórico bastam, ou precisa de bateria de puzzles de calibração
   (e como fazer isso sem tabuleiro próprio — via /training do Lichess + autorrelato)?
6. Badges para TDAH: qual evidência existe e qual desenho minimiza o risco de virar ruído?
7. Há algo no relatório que está FACTUALMENTE errado? Verificar contra o repositório antes
   de aceitar minhas afirmações.
