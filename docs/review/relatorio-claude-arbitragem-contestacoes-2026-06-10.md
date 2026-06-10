# Relatório Claude — Arbitragem das Contestações da Análise Geral (2026-06-10)

Autor: Claude (Diretor Geral). Papel: avaliar os três relatórios de contestação
(Codex, DeepSeek, Gemini) contra o repositório real, dar nota a cada um, registrar
onde acertaram e erraram, e consolidar o plano de implementação para avaliação do dono.

Toda alegação disputada foi verificada diretamente no código/docs nesta sessão.
Verificações-chave:

- `docs/superpowers/specs/2026-06-08-professor-lemos-tutor-design.md` **existe** e está
  ativo — mas cobre o **tutor** (envelope de sessão, diagnóstico, constância), não o
  método 5 trilhas (methodTracks, pendingItems, diplomas, mastery).
- `AGENTS.md:17` ainda aponta o spec de 2026-06-06 como "vigente" — stale confirmado.
- `src/domain/types.ts:59`: `LearnerBand = '0-800' | '800-1200'` — confirmado.
- `navigator.storage.persist()` não existe no código — confirmado (grep sem ocorrência).
- Não existe import/restore de backup JSON; só export manual e import de sinais manuais —
  confirmado em `src/ui/Config.tsx`.
- `memory/decisions.md:417-419` tem nota stale dizendo que C-1/C-2/C-3 seguem pendentes,
  contradizendo as decisões fechadas em 383-396 — confirmado.
- `src/infra/chesscom/chesscomClient.ts:50` itera **todos** os `archives.archives` sem
  bound de recência no código — confirmado.
- Microcopy "O tabuleiro é um mapa de ruas" existe em
  `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md:79` — confirmado.
- `returnedAfterGap` existe, mas em `types.ts:239` (Gemini citou L88 — linha errada).
- `themeStats` com `attempts`/`losses` em `types.ts:263-264` — citação do Gemini correta.

---

## 1. Notas e veredito por relatório

| Relatório | Nota | Resumo |
|---|---|---|
| **Codex** | **9.0/10** | O mais rigoroso. Toda alegação com evidência file:line verificável e correta. Achou problemas reais que ninguém viu. Plano de R-1 executável. |
| **Gemini** | **7.5/10** | O mais construtivo (designs concretos de badges, placement, painel, sync). Mas a acusação central de "erro factual" do A-3 é só meio-verdade, e tem citação de linha errada. |
| **DeepSeek** | **7.0/10** | O mais estrategicamente provocador, com 3-4 contribuições de alto valor — mas contém um erro jurídico real (AGPL/SaaS) e exagera complexidades para vencer o argumento. |

### 1.1 Codex — 9.0/10

**Acertos (todos verificados):**

1. **Nota stale em `decisions.md:417-419`** — o único que percebeu que o próprio update do
   relatório contradiz a memória. Real.
2. **Chess.com sem bound de recência no código** (`chesscomClient.ts:50` itera todos os
   archives) — violação potencial de `AGENTS.md:39-41` que nem o relatório original nem os
   outros contestadores viram. Achado novo e importante.
3. **R-1 subespecificado**: backup sem restore é "tranquilizante, não seguro". O plano de
   6 commits (persist → backupMeta → export v1 → restore → opt-in automático → suite de
   regressão) é o único plano executável da rodada. Correto que restore não existe hoje.
4. **Auditoria do schema Dexie para sync**: `signals` sem `updatedAt` + `replaceSignalsForSource`
   destrutivo, `weaknesses` com `id = tag` e replace total, `pendingItems` com `Date.now()` —
   tudo confere com o código. É a resposta concreta à decisão 4 do dono.
5. **Spine 0-2200 antes das telas novas** (Corte 7a): o argumento de dependência de modelo
   ("não construir Progresso/Placement/Badges sobre `LearnerBand` 0-1200 já sabidamente
   obsoleto") é o argumento de sequenciamento mais forte da rodada.
6. **Recusa do Corte 5 (badges) sem spec** — exatamente o que a decisão C-3 do dono exige.
   As 10 perguntas bloqueantes para a spec de badges são a base certa.
7. Fontes externas (MDN, Dexie, Lichess API) citadas e corretas.

**Erros/limitações:**

1. Quase não tocou pedagogia, validação de eficácia e risco de abandono — aceitou o frame
   de engenharia do relatório original (o gap que DeepSeek preencheu).
2. Conservador em G-4: confirmou que falta o "porquê", mas não propôs mecanismo (Gemini propôs).
3. Não questionou a priorização placement vs painel em profundidade — apenas reordenou.

### 1.2 Gemini — 7.5/10

**Acertos:**

1. **A-3 era impreciso, sim**: o spec `2026-06-08-professor-lemos-tutor-design.md` existe e
   está ativo em `docs/superpowers/specs/` — o relatório original não o mencionou. Meio ponto
   para o Gemini aqui.
2. **Contribuições construtivas concretas** — as melhores da rodada:
   - 5 badges desenhados com ancoragem no código real (ex.: "Retorno de Ouro" ligado a
     `returnedAfterGap`, que existe e funciona — `consistency.ts:58`).
   - Fluxo de placement em 3 passos sem tabuleiro e sem novo escopo OAuth (deep link
     `/training/<tema>` + leitura `puzzle:read` ou autorrelato) — viável e alinhado às regras.
   - Painel de progresso mapeado para tabelas/campos reais (`themeStats.attempts/losses`
     confirmados em `types.ts:263-264`, `elapsedSeconds` por `methodTrackId`, `diplomaAttempts`).
   - Mecanismo de projeção para G-4: "feedback `hard` → reduzir estágio → explicar o porquê" —
     é a ponte certa entre o otimismo do Claude e o pessimismo do DeepSeek.
3. **Política de expiração de sinais** (decay >90 dias) — lacuna real que ninguém mais viu.
4. **Risco de fallback após "Apagar tudo"** — cenário de borda legítimo.

**Erros:**

1. **A acusação "ERRO FACTUAL / Falso Testemunho" é exagerada.** O spec 2026-06-08 cobre o
   TUTOR (etapas Lemos), não o método 5 trilhas. O método 5 trilhas foi implementado a partir
   de um prompt de execução que está, sim, em `prompts/archive/2026-06-method/`. O ponteiro
   de `AGENTS.md:17` está, sim, obsoleto. Ou seja: o A-3 original era impreciso na frase, mas
   correto na substância — e o Gemini errou ao descartá-lo inteiro.
2. **Citação de linha errada**: `returnedAfterGap` está em `types.ts:239`, não L88.
3. **Inconsistência interna em G-4**: na tabela diz "CONCORDO — baixo custo técnico", na
   seção 5.2 diz que G-4 está incompleto e precisa de mecanismo de projeção. As duas não
   podem ser verdade ao mesmo tempo.
4. **Sugerir copiar as cores exatas do Lichess (`#161512`) e Chess.com** tensiona a própria
   regra clean-room que ele cita. "Inspirar familiaridade" ≠ replicar a paleta da marca.
5. Citação acadêmica frouxa: Przybylski et al. (2010) é sobre motivação em videogames
   (teoria da autodeterminação), não sobre gamificação para TDAH especificamente.

### 1.3 DeepSeek — 7.0/10

**Acertos (de alto valor estratégico):**

1. **A leitura mais profunda do A-3**: "o spec de design do método 5 trilhas NÃO EXISTE; o
   que existe em archive é prompt de execução" — verificado, é a descrição mais precisa da
   situação entre os quatro relatórios. A correção certa não é mover arquivo, é ESCREVER o
   spec do que foi implementado.
2. **Risco de abandono TDAH** — a crítica mais importante da rodada inteira. O projeto todo
   é desenhado para TDAH, mas só tem uma mensagem de boas-vindas após ausência
   (`returnedAfterGap`); não recalibra o plano. "Dados perdidos podem ser regenerados; aluno
   perdido não volta." Entra no plano.
3. **Protocolo de validação de eficácia** — para um projeto que se define por honestidade
   epistêmica, medir só adesão (checkpoints) e não eficácia é uma lacuna real. As 4 métricas
   propostas são razoáveis.
4. **"0→2200" também é promessa de rating** — refinamento legítimo do C-1: usar
   "0→autonomia" como comunicação pública e 2200 como referência interna de sequenciamento.
5. **Offline é "cache de UI", não offline real** — verdadeiro: o treino abre no Lichess;
   sem internet o aluno vê o plano mas não executa. A expectativa criada pela PWA instalável
   é um risco de frustração real.
6. **ADRs são imutáveis por convenção** — criar adendo/nota no ADR-006 em vez de renomear é
   a prática correta.
7. **Badge de esforço sem métrica de qualidade vira gamificação vazia** ("1000 puzzles
   rápidos e mal feitos") — refinamento necessário da spec C-3.

**Erros:**

1. **ERRO JURÍDICO: "AGPL-3.0 NÃO cobre SaaS".** É o contrário — a AGPL-3.0 existe
   exatamente para cobrir SaaS: a cláusula 13 (Remote Network Interaction) obriga oferta de
   código-fonte a usuários via rede, fechando a brecha de SaaS da GPL. E "AGPL + Commons
   Clause" tornaria o projeto não-open-source (Commons Clause restringe venda e é
   incompatível com a definição OSI). A recomendação de adiar a LICENSE com base nesse
   argumento deve ser rejeitada; A-6 segue barato e deve ser feito.
2. **Exagero sistemático de complexidade para vencer o argumento.** "G-4 exige NLG com
   modelo de linguagem" é falso: o app já faz mensagens determinísticas por template
   (`sessionMessage`, `coachCatalog`); um relatório com "porquê" é uma máquina de regras
   maior, não um LLM. O scoping correto é o que o próprio DeepSeek sugere depois ("resumo
   enriquecido com 2-3 regras condicionais") e o mecanismo do Gemini (feedback → ajuste →
   explicação). O exagero não anula o ponto (G-4 é maior que o estimado), mas mina a nota.
3. **"P1 usa bound de recência de ~3 meses"** — assumiu que o bound existe; o Codex provou
   que o código itera todos os archives sem bound. O DeepSeek confiou na doc, não no código.
4. Afirmações comportamentais sobre TDAH sem nenhuma citação (o relatório exige evidência
   dos outros, mas não cita as próprias fontes).
5. **Inversão "placement primeiro porque é o item 2 da visão"** é meio-forte, meio-fraca:
   o argumento de baseline é bom, mas "placement é usado 1x pelo dono" (admitido pelo
   próprio DeepSeek) e o app já tem o dono posicionado. A força real do argumento é para
   USUÁRIOS FUTUROS — o que depende do spine 0-2200 existir primeiro (ponto do Codex).

---

## 2. Convergências (consenso dos 3 — viram decisão sem debate adicional)

1. **Corte 0 (higiene) e Corte 1 (dados) primeiro.** Unânime.
2. **Corte 1 deve ser "Data Safety v1", não duas chamadas soltas**: persist + backup
   versionado com checksum + **restore testado** + metadata para sync. (Codex deu o plano;
   DeepSeek e Gemini pediram o mesmo por caminhos diferentes.)
3. **Preparar o schema Dexie para sync AGORA** (decisão 4 do dono): UUID/merge-key,
   `updatedAt` universal, soft delete, fim dos replaces destrutivos. Os três convergiram
   nos mesmos campos de forma independente.
4. **A-3: escrever um spec de design do método implementado** (não apenas mover arquivo) e
   atualizar o ponteiro de `AGENTS.md`.
5. **Badges só depois de spec** (e a spec tem agora bom material de entrada: 10 perguntas
   do Codex + 5 desenhos do Gemini + métricas de qualidade do DeepSeek).
6. **Placement sobe na prioridade** (DeepSeek e Gemini explicitamente; Codex implicitamente
   ao exigir spine de bandas antes das telas).
7. **R-1 mitigado localmente basta por meses**; P4 descongela quando houver segundo
   dispositivo em uso real.

## 3. Divergências arbitradas

| Questão | Posições | Arbitragem |
|---|---|---|
| Ordem: placement vs relatório vs painel | DeepSeek/Gemini: placement no Corte 2-3. Claude original: placement no 6. Codex: spine de bandas antes de tudo | **Spine 0-2200 primeiro (Codex), placement em seguida (DeepSeek/Gemini), relatório scoped depois, painel na sequência.** O argumento de dependência de modelo do Codex vence; o argumento de baseline do DeepSeek vence sobre a ordem original. |
| G-4: barato ou caríssimo? | Claude: "narrativa sobre dados". DeepSeek: "NLG, ordem de grandeza maior". Gemini: ambos | **Meio-termo com scoping explícito**: máquina de regras determinística (sem LLM, sem promessa causal sem sinal), usando o mecanismo de projeção do Gemini. A trava de evidência do spec do tutor já dá a regra: sem sinal claro, pergunta — não explicação inventada. |
| Badges: cedo (Gemini) ou tarde (Codex/DeepSeek)? | Gemini: Corte 4 por dopamina TDAH. Codex: recusa sem spec. DeepSeek: por último, com pesquisa de 2-4 semanas | **Spec/pesquisa começa cedo (é trabalho de documento, paraleliza), implementação só depois de placement + relatório.** A decisão C-3 do dono exige spec antes; nada impede a spec de andar em paralelo aos cortes 1-3. |
| Validação de eficácia bloqueia features? | DeepSeek: gate de 4 semanas antes de qualquer corte | **Não bloqueia — corre em paralelo.** O dono usa o app de verdade; medir baseline (acerto por tema, blunders/partida, conclusão de sessão) começa já, sem congelar o desenvolvimento. Se em 4 semanas nada melhorar, o resultado entra como gate do Corte de currículo. |
| LICENSE agora ou repensar? | DeepSeek: adiar por risco SaaS | **Agora.** O argumento jurídico do DeepSeek está errado (AGPL cobre SaaS; é seu propósito). Pendente apenas confirmação formal do dono como copyright holder. |
| ADR-006 | Claude: renomear. DeepSeek: adendo | **Adendo/nota, sem renomear** (imutabilidade de ADR). |

## 4. Plano consolidado proposto (para avaliação do dono)

Cada corte mantém o protocolo atual: tarefas pequenas, gate verde, commit atômico.

- **Corte 0 — Higiene canônica (S/M, 3-5 commits)**
  1. Corrigir nota stale `decisions.md:417-419` (achado Codex).
  2. Escrever `docs/superpowers/specs/` spec de design do **método 5 trilhas implementado**
     (resolve A-3 de verdade — achado DeepSeek) e atualizar ponteiro `AGENTS.md:17`.
  3. ADR-006: adendo de renomeação lógica (sem renomear arquivo).
  4. LICENSE AGPL-3.0 após confirmação do dono.
  5. Alinhar PLANO.md/project.md ao teto 0→2200 com comunicação "0→autonomia" (refinamento
     DeepSeek aceito).

- **Corte 1 — Data Safety v1 (M, 4-6 commits — plano do Codex + checksum do DeepSeek)**
  persist() com status visível → backupMeta → export v1 versionado com checksum →
  **restore/import validado** → backup automático opt-in (File System Access, fallback
  honesto) → suite de regressão de segurança de dados. Inclui auditoria sync-meta do schema
  (UUID, updatedAt universal, soft delete, eliminar replaces destrutivos de signals/weaknesses).

- **Corte 2 — Spine 0-2200 (M, 3-5 commits — Codex 7a)**
  Expandir `LearnerBand` e modelo de bandas/trilhas até 2200 SEM conteúdo denso ainda.
  Migração Dexie dos perfis existentes. Nenhuma promessa de rating na UI.

- **Corte 3 — Placement v1 (L — fluxo Gemini + 3 etapas DeepSeek)**
  Questionário curto (4-5 perguntas) + leitura de histórico público + calibração externa por
  deep link `/training/<tema>` com leitura `puzzle:read` ou autorrelato. UI mostra confiança
  (baixa/média/alta — exigência Codex). Sem tabuleiro próprio, sem novo escopo OAuth.

- **Corte 4 — Relatório pós-sessão + metas semanais/mensais (M, scoped)**
  Máquina de regras determinística: o que foi feito, o que os sinais mostram, o que vem e por
  quê — com trava de evidência (sem sinal claro → pergunta, não explicação). Mecanismo de
  projeção do Gemini (`hard` → reduzir estágio → explicar). Agregação semanal/mensal sobre
  logs (G-7). **Inclui modo de retorno após ausência longa** que recalibra o plano (achado
  DeepSeek de abandono TDAH).

- **Corte 5 — Painel Progresso MVP (L — mapeamento de dados do Gemini)**
  Mapa de habilidades por tema (taxa de acerto via `themeStats`), esforço por trilha,
  diplomas, tendência. Inclui política de expiração/decay de sinais >90 dias (achado Gemini).

- **Corte 6 — Importação de atividade livre (M/L)**
  Com fila de rate limit centralizada + bound de recência enforced em código (achado Codex,
  corrige também o Chess.com atual) + regras explícitas de crédito (janela temporal,
  deduplicação, partidas casuais contam como X — caveats do DeepSeek).

- **Corte 7 — Badges (spec primeiro; implementação depois)**
  Spec começa em paralelo aos Cortes 1-3 (documento): 10 perguntas do Codex + 5 desenhos do
  Gemini ("Retorno de Ouro" etc.) + métricas de qualidade do DeepSeek + pesquisa TDAH formal.
  Implementação apenas após aprovação da spec pelo dono.

- **Corte 8 — Currículo 1200-2200 denso (XL, ondas de pesquisa)**
  Separado em spine (já no Corte 2) e conteúdo. Depende de pesquisa dirigida e decisões de
  material licenciado acima de 1800.

- **Trilha paralela (não bloqueia nada) — Validação de eficácia (DeepSeek)**
  Começar a registrar baseline já: acerto por tema-foco, blunders/partida, taxa de conclusão
  de sessão, tempo até retorno. Revisão em 4 semanas; resultado alimenta os gates seguintes.

Itens explicitamente rejeitados nesta arbitragem:
- Adiar LICENSE por risco AGPL/SaaS (erro jurídico do DeepSeek).
- Copiar paleta exata Lichess/Chess.com (Gemini) — familiaridade sim, réplica de marca não.
- Gate de validação que congela todo desenvolvimento por 4 semanas (DeepSeek) — vira trilha
  paralela.
- Badges antecipados para antes de spec (Gemini) — contraria decisão C-3 do dono.
- Backup via Lichess Study como mitigação primária (relatório original) — Codex demonstrou
  que restore exigiria `study:read`, fora do ADR-006.

## 5. Decisões pendentes do dono

1. Aprovar (ou reordenar) a sequência de cortes 0-8 acima.
2. Confirmar LICENSE AGPL-3.0 (como copyright holder).
3. Aprovar comunicação pública "0→autonomia" com 2200 como referência interna.
4. Aprovar a trilha paralela de validação de eficácia (4 métricas, revisão em 4 semanas).
