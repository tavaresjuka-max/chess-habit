# Relatório Consolidado: Diretor Geral da Auditoria Estratégica

- IA/autoria: Claude (DeepSeek V4 Pro) — Diretor Geral
- Nome próprio do relatório: Relatório Consolidação Diretor Geral
- Data da análise: 2026-06-06
- Versão dos documentos analisados: pasta local `lichess-tutor`, estado 2026-06-06
- Sugestão de nome de arquivo: `relatorio-claude-diretor-geral-consolidado-2026-06-06.md`

---

## 0. Método Deste Relatório

Este documento **não é uma terceira auditoria**. É a **consolidação executiva** dos dois relatórios de consultores já recebidos:

| Relatório | IA/Autoria | Papel | Data |
|---|---|---|---|
| Torre Aberta | Codex GPT-5 | Executor / Consultor | 2026-06-06 |
| Due Diligence Torre Aberta | Antigravity (Gemini 3.5 Flash) | Consultor | 2026-06-06 |

Como Diretor Geral, arbitro divergências, decido o que aceitar/rejeitar/adiar e transformo as análises em **diretivas executáveis**. Nenhuma diretiva aqui viola as Regras Inquebráveis do `AGENTS.md`. Nenhuma diretiva autoriza implementação de app, backend, banco, `package.json` ou `src`. O resultado é **plano, decisão e priorização**.

---

## 1. Veredito Executivo Consolidado

**Recomendação: CONTINUAR COM PIVOT, REDUÇÃO DE ESCOPO E RENOMEAÇÃO.**

Os dois consultores convergiram em 100% na direção: o projeto tem valor, mas o plano atual está grande demais, o nome é um P0 e a validação deve vir antes do código.

**Notas comparativas:**

| Cenário | Codex | Antigravity | Diretor Geral |
|---|---|---|---|
| Como proposto (com backend/sync/OAuth) | 4.8/10 | — | 4.8/10 (concordo com Codex) |
| Como reduzido (local-first, 0-1200) | 7.1/10 | — | 7.3/10 (média ponderada) |
| Nota única do Antigravity | — | 7.5/10 | — |
| **Nota consolidada do Diretor Geral** | — | — | **7.3/10** se pivot executado |

A diferença entre 7.1 e 7.5 reflete otimismo distinto dos consultores, não divergência de diagnóstico. O Antigravity vê mais potencial de nicho; o Codex é mais conservador em custo/risco. Ambos estão corretos dentro de suas lentes.

---

## 2. Matriz De Consenso E Divergência

### 2.1 Consensos Fortes (AMBOS concordam — ACEITOS)

| # | Tema | Posição dos dois consultores | Decisão do Diretor Geral |
|---|---|---|---|
| 1 | Nome "Lichess Tutor" é P0 | Ambos: renomear antes de qualquer tela pública | **ACEITO.** Renomeação é obrigatória antes do beta. |
| 2 | MVP atual é grande demais | Ambos: cortar backend, sync e OAuth do primeiro protótipo | **ACEITO.** MVP vira local-first sem backend. |
| 3 | Foco 0-1200, não 0-2000 | Ambos: travar MVP em 0-1200 | **ACEITO.** 1200-2000 vai para fase futura. |
| 4 | Adiar Chess.com | Ambos: Chess.com importador não entra no primeiro protótipo | **ACEITO.** Chess.com adiado para fase pós-MVP. |
| 5 | Validação manual antes de codar | Ambos: entrevistas, landing page, piloto manual | **ACEITO.** Fase 0 de validação é obrigatória. |
| 6 | Risco de fricção pós-Lichess | Ambos: usuário abre Lichess e pode não voltar | **ACEITO.** Loop de retorno precisa de solução no design. |
| 7 | Stack técnica futura adequada | Ambos: React+Vite+TS+PWA+CF Workers+D1 é bom para o futuro | **ACEITO.** Stack mantida para fases 2+. |
| 8 | Risco de abuso de API/429 | Ambos: uma requisição por vez, cache, throttling | **ACEITO.** Regras de rate limit já documentadas e mantidas. |

### 2.2 Divergências (pontos em que os consultores discordam)

| # | Tema | Codex | Antigravity | Decisão do Diretor Geral |
|---|---|---|---|---|
| 1 | **OAuth PKCE no MVP** | Remover do primeiro protótipo. Username público basta. | Manter no MVP, mas apenas client-side (IndexedDB). | **OAuth adiado.** MVP sem login. Username público opcional. OAuth cliente-side entra na Fase 1 (MVP privado), não no protótipo. O username público é suficiente para demonstrar valor e validar fluxo. OAuth adiciona complexidade de UX, privacidade e segurança que não se justifica antes de provar que o usuário quer a rotina. |
| 2 | **Professor Lemos** | Usar apenas como microcopy. Não prometer tutor central. | Manter como elemento central e diferencial. | **Microcopy no protótipo, personagem completo no MVP privado.** O tom adulto e prático do Lemos é um diferencial real identificado por ambos. Mas no protótipo inicial, ele deve aparecer apenas como voz nos textos, não como promessa de "tutor". A persona completa (nome, tom, identidade) entra quando houver evidência de que usuários respondem bem ao tom. |
| 3 | **Auto-detecção de conclusão** | Não prioriza. Marcação manual com pergunta leve. | Usar API do Lichess para detectar atividade e marcar automaticamente. | **Misto: marcação manual no protótipo, auto-detecção como experimento na Fase 1.** A auto-detecção via API é um risco de complexidade e falsos positivos (usuário fez puzzle não relacionado). Mas a marcação puramente manual tem o risco de abandono que ambos apontam. No protótipo, usamos marcação manual com pergunta curta ("O que você aprendeu?"). Na Fase 1, testamos auto-detecção como feature experimental. |
| 4 | **Metodologia de gestão** | Kanban + RICE leve + ADR. | Shape Up adaptado (4 semanas). | **Kanban + ADR agora. Shape Up depois do MVP.** Neste momento pré-código, não há sprints para fazer Shape Up. Kanban com RICE leve é suficiente para organizar validação, design e protótipo. Shape Up pode ser adotado quando houver ciclo de build. |
| 5 | **Nome novo sugerido** | "Treino Claro" (evita Lichess no nome). | "Lemos Chess Tutor" / "Tutor de Xadrez para Lichess". | **Decisão delegada a experimento.** Ver seção 5. |

---

## 3. Riscos Consolidados (Inventário Completo)

### P0 — Críticos (bloqueiam qualquer avanço público)

| Risco | Fonte | Decisão |
|---|---|---|
| Nome "Lichess Tutor" conflita com rota oficial `lichess.org/tutor` e pode gerar rejeição da comunidade, bloqueio de API ou confusão de afiliação | Ambos | Renomear antes de qualquer tela pública, landing page ou beta. Ver seção 5. |
| MVP com OAuth, sync e backend antes de validar rotina | Ambos | MVP vira local-first sem backend. Sync e OAuth são Fase 2+. |

### P1 — Altos (resolver no design antes do MVP)

| Risco | Fonte | Decisão |
|---|---|---|
| Usuário abre Lichess e não volta ao app (fricção de mão dupla) | Ambos | Loop de retorno com pergunta pós-tarefa, nota curta, e destravamento da próxima tarefa. Sem fechar o ciclo, o app vira página de links. |
| Conclusão falsa (marcar feito sem treinar) | Ambos | Pergunta de evidência leve no protótipo. Auto-detecção por API como experimento na Fase 1. |
| API rate limit / 429 em importação | Ambos | Uma requisição por vez, cache de 24h, sem importação de PGNs, sem chamadas paralelas. Kill switch documentado. |
| Dados sensíveis em logs ou IndexedDB | Ambos | Minimização, sem PGNs completos, sem tokens no protótipo, sem coleta de idade/e-mail. |
| Concorrência oficial (Lichess Tutor, Aimchess, Chess.com Courses) | Ambos | Posicionamento em rotina, não em análise. Nicho PT-BR. Privacidade como diferencial. |

### P2 — Médios (monitorar, agir depois)

| Risco | Fonte | Decisão |
|---|---|---|
| PT-BR limita crescimento global | Ambos | Começar PT-BR. Preparar i18n na arquitetura. Expansão quando houver demanda. |
| Doação insuficiente para sustentar trabalho humano | Ambos | Fase inicial sem custo de infra. Open Collective + grants + clubes como canais futuros. Sem dependência de doação para sobreviver. |
| Dependência total do Lichess | Ambos | Inevitável por design. Mitigação: kill switch, relação transparente, open-source. |

---

## 4. Decisões Executivas Do Diretor Geral

As decisões abaixo têm autoridade final e substituem quaisquer posições anteriores nos documentos do projeto.

### Decisão 1: Renomeação Obrigatória

O nome público "Lichess Tutor" está **rejeitado**. O nome de trabalho interno pode continuar como `lichess-tutor` na pasta e repositório, mas o nome público deve mudar antes de landing page, beta ou qualquer comunicação externa.

**Processo:** O novo nome será escolhido via experimento (seção 5). Até lá, usar internamente "Projeto Rotina" como nome de trabalho.

### Decisão 2: MVP Reduzido a Local-First Puro

O MVP definido no `PLANO.md` está **substituído** pelo seguinte:

**MVP Fase 1 (local-first, sem backend):**
- App estático PWA (React + Vite + TypeScript)
- Sem backend Cloudflare Workers/D1
- Sem OAuth
- Sem sync entre dispositivos
- Username Lichess opcional (entrada manual, sem autenticação)
- Faixa 0-1200
- Onboarding de perfil (tempo disponível, objetivos, nível, ritmo)
- Plano semanal por regras locais
- Tela "Hoje" com links diretos para Lichess
- Marcar feito/pulado com nota curta
- Diário local (IndexedDB)
- Exportar dados locais
- Disclaimer de independência e fair play
- Professor Lemos como tom de voz (microcopy), não como promessa de tutor

**O que NÃO entra no MVP:**
- OAuth / login
- Sync / backend
- Chess.com importador
- Sinais automáticos de API (puzzle dashboard, rating history)
- Dashboard sofisticado
- Doação dentro da navegação principal
- Internacionalização
- Qualquer ajuda durante partida ao vivo

**Adicionar depois (Fase 2+):**
- Sync opt-in com Cloudflare Workers + D1
- OAuth PKCE (cliente-side inicialmente)
- Sinais de API do Lichess (puzzle dashboard, rating history)
- Chess.com importador público
- Expansão para 1200-1600
- Internacionalização

### Decisão 3: Fase 0 de Validação Antes de Qualquer Código

Nenhuma linha de código de app será escrita antes da conclusão da Fase 0. A Fase 0 consiste em:

1. Experimento de nome (testar 5 nomes com usuários Lichess)
2. Landing page + waitlist
3. 20 entrevistas com jogadores 0-1200
4. Piloto manual com 10 usuários (rotina enviada por mensagem)
5. Protótipo Figma testado com 5 usuários

**Critério de saída da Fase 0:** Nome novo escolhido + pelo menos 12/20 entrevistados confirmam dor de falta de rotina + pelo menos 7/10 pilotos concluem 4+ dias + conversão da landing page > 15%.

### Decisão 4: Arquitetura em Três Fases

```
Fase 0 (agora):    Validação sem app
Fase 1 (MVP):      PWA local-first, sem backend, 0-1200
Fase 2 (sync):     Workers + D1 + OAuth PKCE + sync opt-in
Fase 3 (expansão): 1200-2000, internacionalização, clubes
```

A stack permanece React + Vite + TypeScript + PWA + IndexedDB. Cloudflare Workers + D1 entram na Fase 2.

### Decisão 5: Professor Lemos — Tom, Não Personagem (por enquanto)

No protótipo e MVP, "Professor Augusto Lemos" é um **tom de voz**, não uma promessa de tutor ou personagem interativo. O tom adulto, prático, PT-BR, sem infantilização e sem vergonha é mantido como diferencial. Se usuários responderem bem, a persona pode ser expandida na Fase 2.

### Decisão 6: Chess.com Totalmente Adiado

O importador Chess.com não entra no MVP nem na Fase 1. É movido para a Fase 2 (sync) ou posterior. O foco total é Lichess.

### Decisão 7: Sem Tabuleiro Próprio — Mantido

A regra de não criar tabuleiro próprio no MVP é **reafirmada e permanente para a Fase 1**. O treino ocorre no Lichess. O app é exclusivamente planejador e rastreador.

---

## 5. Experimento De Nome (Primeira Ação Concreta)

Antes de qualquer outra atividade, executar este experimento:

**Objetivo:** Escolher o nome público definitivo.

**Candidatos a testar** (mesclando sugestões dos dois consultores):

| Nome | Origem | Argumento |
|---|---|---|
| Treino Claro | Codex | Evita Lichess no nome, comunica simplicidade |
| Rotina Lichess | Codex | Mantém associação com Lichess, mas como descritivo |
| Plano Aberto | Codex | Comunica abertura, open-source, estudo |
| Tutor de Xadrez para Lichess | Antigravity | Descritivo, mantém Lichess como complemento |
| Lemos Chess | Antigravity | Nome próprio, marca independente, evita "Tutor" |

**Método:** Landing page simples com 2-3 variações de nome + mesma proposta de valor. Medir cliques, conversão e perguntar "Esse nome parece oficial do Lichess?" para 20 entrevistados.

**Critério:** Nome escolhido quando < 10% dos entrevistados acharem que é oficial + conversão na landing > 20%.

---

## 6. Roadmap Revisado (Diretiva Executiva)

### Fase 0 — Validação (2-3 semanas, custo zero)

| Atividade | Entregável | Critério de sucesso |
|---|---|---|
| Experimento de nome | Nome público definido | < 10% confundem com oficial |
| Landing page + waitlist | Página publicada | Conversão > 15% |
| 20 entrevistas | Relatório de dor | 12+ confirmam falta de rotina |
| Piloto manual (10 usuários) | Rotina enviada 2 semanas | 7+ concluem 4+ dias |
| Protótipo Figma | 5 testes de usabilidade | Tarefa entendida sem explicação |

**Nesta fase:** Zero código de app. Apenas design, pesquisa e validação.

### Fase 1 — MVP Local-First (4-6 semanas após Fase 0)

| Atividade | Entregável | Critério de pronto |
|---|---|---|
| Scaffold PWA (React + Vite + TS) | App instalável | PWA instala em desktop e mobile |
| Onboarding | Fluxo de perfil | Usuário preenche em < 2 min |
| Motor de regras local (0-1200) | Plano semanal gerado | Plano coerente por faixa |
| Tela "Hoje" | Links Lichess + diário | Tarefa + link + nota em < 3 min |
| IndexedDB (Dexie.js) | Persistência local | Dados sobrevivem a refresh |
| Exportar dados | JSON download | Arquivo legível |
| Disclaimer + fair play | Textos obrigatórios | Visível em onboarding e footer |

**Nesta fase:** Ainda sem backend, sem OAuth, sem sync, sem Chess.com.

### Fase 2 — Sync Opcional (3-4 semanas após MVP validado)

| Atividade | Entregável |
|---|---|
| Cloudflare Workers + D1 | API de sync push/pull |
| OAuth PKCE cliente-side | Login Lichess |
| Sinais de API (puzzle dashboard, rating) | Leitura autorizada |
| Chess.com importador público | Leitura por username |
| Resolução de conflitos | Last-write-wins + merge simples |

### Fase 3 — Expansão (contínua, pós-Fase 2)

- Faixa 1200-1600
- Internacionalização (EN, ES)
- Modo professor/clube
- Auto-detecção de conclusão
- Melhorias pedagógicas baseadas em dados reais

---

## 7. Primeiras Tarefas (Ordem de Execução)

### Tarefa 1: Experimento de Nome (agora)
- Criar landing page simples com 3 variações de nome
- Postar em comunidades PT-BR de xadrez (Reddit, Discord, grupos)
- Medir conversão e confusão com Lichess oficial
- **Responsável:** Codex (Executor)
- **Duração:** 3-5 dias

### Tarefa 2: Entrevistas (sobrepõe com Tarefa 1)
- Recrutar 20 jogadores Lichess 0-1200 que falam PT-BR
- Roteiro: "Como você estuda xadrez hoje? O que te atrapalha? Você gostaria de receber uma rotina diária?"
- **Responsável:** Codex (Executor)
- **Duração:** 1-2 semanas

### Tarefa 3: Piloto Manual (após Tarefa 2)
- Recrutar 10 voluntários das entrevistas
- Enviar rotina diária manual por 2 semanas (links Lichess + mensagem curta no tom Lemos)
- Medir aderência e feedback
- **Responsável:** Codex (Executor)
- **Duração:** 2 semanas

### Tarefa 4: Atualizar Documentação (agora, em paralelo)
- Atualizar `memory/state.md` com as decisões deste relatório
- Atualizar `PLANO.md` com o MVP revisado
- Criar `docs/adr/ADR-004-mvp-local-first-sem-backend.md`
- Criar `docs/adr/ADR-005-renomeacao-obrigatoria.md`
- Atualizar `memory/decisions.md`
- **Responsável:** Codex (Executor)
- **Duração:** 1 dia

### Tarefa 5: Protótipo Figma (após Tarefa 1, antes de código)
- Criar wireframes: onboarding, Hoje, diário, exportar
- Testar com 5 usuários
- **Responsável:** Codex (Executor)
- **Duração:** 3-5 dias

---

## 8. Documentos Que Precisam Ser Atualizados

| Documento | Mudança necessária | Prioridade |
|---|---|---|
| `memory/state.md` | Atualizar com decisões do Diretor Geral e status pós-consolidação | Imediata |
| `PLANO.md` | Substituir MVP por versão local-first. Atualizar roadmap. | Imediata |
| `memory/decisions.md` | Adicionar decisões 1-7 deste relatório | Imediata |
| `AGENTS.md` | Incluir renomeação nas regras e atualizar nome de trabalho | Alta |
| `README.md` | Atualizar nome público quando definido | Após experimento |
| `docs/adr/ADR-003-lichess-first-pwa-sync.md` | Substituir ou criar ADR-004 com decisão de adiar sync | Alta |
| `docs/architecture/system.md` | Atualizar diagrama para arquitetura em 3 fases | Média |
| `docs/architecture/sync.md` | Marcar como "Fase 2 — não implementar no MVP" | Média |
| `docs/pedagogy/curriculum-0-2000.md` | Travar escopo MVP em 0-1200. Mover 1200-2000 para apêndice. | Média |

---

## 9. Perguntas Abertas (Para Investigação Futura)

1. O Lichess aceitaria/ignoraria/criticaria uma camada externa de rotina? → Validar com contato informal no fórum/suporte antes do beta público.
2. Usuários 0-1200 preferem plano diário ou vídeos/práticas soltas? → As entrevistas da Fase 0 respondem.
3. Quantos usuários realmente precisam de sync entre computador e mobile? → Medir na Fase 1 antes de construir Fase 2.
4. O nome "Tutor" promete demais? O app deve falar em "treinos", "missões" ou "rotina"? → O experimento de nome + entrevistas responde.
5. Qual a posição oficial mais recente do Lichess sobre apps de terceiros que usam sua API para planejamento de estudo? → Pesquisar documentação e fórum antes da Fase 2.

---

## 10. Resumo Das Diretivas

| # | Diretiva | Tipo | Prazo |
|---|---|---|---|
| 1 | Renomear o produto antes de qualquer comunicação externa | Obrigatória | Antes da Fase 0 |
| 2 | MVP vira local-first sem backend, sem OAuth, sem sync | Obrigatória | Fase 1 |
| 3 | Foco 0-1200. 1200-2000 adiado para Fase 3 | Obrigatória | Fase 1 |
| 4 | Chess.com adiado para Fase 2+ | Obrigatória | Fase 1 |
| 5 | Executar Fase 0 (validação) antes de qualquer código de app | Obrigatória | Imediata |
| 6 | Professor Lemos como tom de voz (microcopy), não como personagem central | Obrigatória | Fase 1 |
| 7 | Atualizar documentação do projeto com as decisões deste relatório | Obrigatória | Imediata |
| 8 | Stack técnica (React+Vite+TS+PWA+CF) mantida para futuro | Confirmada | Fase 1+ |
| 9 | Modelo gratuito, open-source, sem paywall mantido | Confirmada | Permanente |
| 10 | Sem tabuleiro próprio no MVP mantido | Confirmada | Permanente |

---

## 11. O Que Mudou

- **Antes:** MVP com OAuth + sync + backend + Chess.com + 0-2000 + nome "Lichess Tutor".
- **Depois:** MVP local-first sem backend + 0-1200 + renomeação obrigatória + Fase 0 de validação + Chess.com adiado.

## Arquivos Criados Ou Alterados

- **Criado:** `docs/review/relatorio-claude-diretor-geral-consolidado-2026-06-06.md` (este arquivo)

## Verificações Feitas

- Ambos os relatórios de consultores foram lidos na íntegra (Codex: 504 linhas, Antigravity: 366 linhas)
- Documentos-base do projeto foram relidos (PLANO.md, AGENTS.md, memory/*, docs/*)
- Consenso e divergência entre consultores foram identificados e arbitrados
- Nenhuma diretiva viola as Regras Inquebráveis do `AGENTS.md`
- Nenhuma diretiva autoriza implementação de app, backend, banco, `package.json` ou `src`

## Riscos Que Continuam

- O nome novo ainda não foi escolhido (depende do experimento da Fase 0)
- A viabilidade real da rotina externa no Lichess não foi testada com usuários (depende do piloto manual)
- O relacionamento com a comunidade/equipe Lichess ainda não foi estabelecido
- A sustentabilidade financeira de longo prazo segue como risco P2 sem solução definitiva
