# Cross-AI Review
_gerado por ai-council.sh em 2026-06-19 14:28_

## Revisor: openai/gpt-5.5-pro

_(sem resposta — modelo falhou ou sem credito)_

---

## Revisor: deepseek/deepseek-v4-pro

# Revisão Técnica Independente — Spec Finalização Beta: Design, UX, Imagens, Pedagogia, Timer

---

## 1. Resumo

Spec ambicioso e bem fundamentado em evidência de código (15 claims verificadas: 13 confirmadas, 2 parcialmente confirmadas, 0 refutadas). Propõe transformar o app de "livro vertical" em experiência guiada por etapas com imagens didáticas, carrossel de foco, mobile impecável e timer honesto — tudo ancorado em gates objetivos. O DNA está correto: a auditoria pedagógica achou dedup quebrado, cooldown ausente e rótulo de confiança mentiroso; o timer expôs que "tempo treinado" é wall-clock puro. Porém, **2 claims estão parcialmente incorretas sobre o estado atual do código** (claim 4: `LearningPlanProposalCard` já usa `<Fold>` colapsável, não "tudo na mesma rolagem"; claim 5: `Config.tsx` não tem seção "zona de perigo" separada), o que pode inflar o escopo da Frente B. O plano de execução em 7 fases com gates é disciplinado, mas a Frente B (carrossel + chunking) está subespecificada em bibliotecas e a Frente E (timer) tem uma lacuna funcional: o mecanismo de pergunta na anomalia pressupõe que o usuário está presente no app ao concluir, mas o treino real acontece no Lichess (app externo).

---

## 2. Pontos Fortes

- **Evidência sobre opinião.** A auditoria pedagógica não especula — cita linhas exatas (`generatePlan.ts:313`, `resourceSelector.ts:136-185`, `learningPlanProposal.ts:76-96`) com o comportamento confirmado. Raro e valioso.
- **Timer honesto pragmaticamente brilhante.** Reconhece a restrição fundamental (app não sabe se você está no Lichess ou no YouTube), rejeita a solução ingênua (pausar quando a aba oculta) e propõe crédito planejado com pergunta só na anomalia. Alinhado com o perfil TDAH do público-alvo.
- **Progressive disclosure em 4 níveis.** Carrossel de blocos, chunking de placement (1/3, 2/3, 3/3), aprovação em passos, Config em sub-cartões — hierarquia consistente, não um remendo pontual.
- **TacticDiagram bem especificado.** SVG, estilo Lichess, sem texto na imagem, `role="img"` + `aria-label`, tema escuro por tokens. Cobre a11y, consistência visual e restrição de assets.
- **Fora de escopo explícito.** Sync P4, currículo avançado, troca de `sonner`, nome público — tudo fora. Impede scope creep.
- **Gates objetivos substituem checkpoints humanos.** 5× `npm run coverage`, `smoke:pwa` com a11y + CSP, `tsc -b && vite build` estrito. Alinhado com a regra global do dono de fases longas autônomas.

---

## 3. Riscos e Lacunas

### HIGH — Risco Alto

| # | Risco | Detalhe |
|---|-------|---------|
| **H1** | **Claim 4 parcialmente incorreta → esforço inflado na Frente B** | `LearningPlanProposalCard.tsx:161,170` já usa `<Fold>` colapsável para "Como o plano foi montado" e "Como vamos medir progresso". O spec diz que está "tudo na mesma rolagem" mas **já está chunked**. A Frente B propõe "revelados um a um em vez de tudo na mesma rolagem" — isso já existe. O que falta é chunking dos blocos (estratégia → montagem → métricas → aprovar) como passos numerados com indicador 1/4, não o colapso básico. O risco é implementar algo que o código já faz e perder tempo que deveria ir para o carrossel e placement. |
| **H2** | **Timer honesto: lacuna no caso "conclusão com app em background"** | O fluxo proposto é: bloco aberto → usuário vai ao Lichess → volta muito depois → conclui → pergunta aparece. Mas **e se o usuário concluir o bloco enquanto o app está em background ou a tab está inativa?** (ex.: fecha o Lichess, volta ao app horas depois, clica "concluir"). A pergunta aparece no ato de concluir — ok. Mas o timer de anomalia usa `completedAt − startedAt` que **já está inflado** no momento da conclusão. A pergunta ("Quanto você realmente treinou?") aparece, mas a detecção de anomalia é correta. O risco real é: **se o app for recarregado/remontado entre a abertura do bloco e a conclusão**, o estado de `startedAt` pode vir do `sessionLog` persistido e o wall-clock pode ser massivo (horas/dias). O teto de 90 min mitiga parcialmente. |
| **H3** | **12 SVGs inline sem lazy loading nem budget de performance** | `TacticDiagram` renderiza SVG inline para ~12 conceitos. Num carrossel com 4-5 blocos, cada um com seu diagrama, são 4-5 SVGs no DOM simultâneo. Em mobile 375px com CPU lenta, o parse/repaint acumulado pode causar jank. Nenhuma menção a `loading="lazy"`, virtualização, ou code splitting dos diagramas. |

### MEDIUM — Risco Médio

| # | Risco | Detalhe |
|---|-------|---------|
| **M1** | **Carrossel swipe: sem biblioteca especificada** | "Swipe/arrasto e/ou setas para navegar" implica touch + keyboard + a11y + animação + pontinhos de progresso. Implementar do zero é ~200-400 linhas de TSX com edge cases (momentum, preventScroll, resize, RTL). Bibliotecas maduras como Embla Carousel (4KB, a11y-ready, vanilla) ou Swiper (maior, React wrapper) reduziriam o risco. A decisão de build-vs-buy está ausente. |
| **M2** | **Dedup secundária = primária: comportamento substituto não definido** | O spec diz que quando só há 1 fraqueza, o bloco de transferência NÃO deve repeti-la. Mas **o que colocar no lugar?** Remover o bloco de transferência (reduz sessão)? Trocar por um tema fixo (ex.: opening principles)? Trocar por replay do recurso com menor mastery? O spec diz "dedup secundária = primária" mas não especifica o fallback. Sem isso, o implementador vai adivinhar. |
| **M3** | **Fase 0 (verificação mobile) é 100% manual e frágil** | "Screenshot está instável neste ambiente — usar inspeção de estilos, que é mais precisa". Ok, mas inspeção manual de 7 riscos de CSS em 375px é um checklist humano, não um gate automatizado. Se o revisor pular um item, o bug escapa. Não há snapshot test, visual diff nem axe em viewport 375px. |
| **M4** | **a11y: re-validação após novos componentes não está no plano** | `smoke:pwa` cobre a11y e CSP, mas é executado no fim (Fase 6). Os componentes novos (TacticDiagram, carrossel, chunking) são construídos nas Fases 2-3 e não têm gate de a11y intermediário. Um `aria-label` errado no SVG ou um carrossel não-focusável só será pego no final, forçando re-trabalho. |
| **M5** | **Cooldown de fraquezas: sem trade-off documentado** | Adicionar cooldown/spacing resolve o tédio, mas pode **suprimir uma fraqueza real que o usuário continua cometendo**. Ex.: jogador com rating 900 blundering forks toda semana — o cooldown o impediria de treinar forks dois dias seguidos, mesmo sendo exatamente o que ele precisa. O spec não define se o cooldown cede a erros recentes (ex.: "spacing mínimo de 1 dia, a menos que houve blunder no tema nas últimas 24h"). |

### LOW — Risco Baixo

| # | Risco | Detalhe |
|---|-------|---------|
| **L1** | **PRIVACY_SUMMARY tem acentos faltando em texto quasi-legal** | As correções de acentuação são triviais (`s/so/só/g`, etc.), mas o array `PRIVACY_SUMMARY` toca em claims de privacidade ("Nao armazenamos PGN completo..."). Um typo no texto legal não afeta compliance, mas afeta credibilidade. O risco é de digitação, não de regressão funcional. |
| **L2** | **Claim 5 parcialmente incorreta: "zona de perigo" como seção separada não existe** | `Config.tsx:366-394` tem botões de destruição (apagar tudo) mas eles estão inline dentro do `<Fold>` "Dados locais", sem cabeçalho "Zona de perigo". Se o spec quer uma seção visualmente distinta (com cor de alerta, separador), isso é trabalho adicional não precificado. |
| **L3** | **Diagramas SVG podem ficar pedagogicamente errados se não revisados por um enxadrista** | O spec diz "precisão pedagógica primeiro", mas 12 diagramas táticos (garfo, cravada, espeto, descoberto, mate-in-1, mate-in-2, finais...) têm posições específicas que ilustram o conceito. Um diagrama de "espeto" que parece um "garfo" ensina errado. Idealmente, cada SVG deve ser validado contra um exemplo canônico do Lichess. |
| **L4** | **Carrossel pode degradar em desktop** | Swipe horizontal é ótimo em mobile, mas usuários de desktop com mouse esperam scroll vertical ou setas. O fallback "setas + link ver lista completa" existe, mas a experiência principal de arrastar com mouse é awkward. |

---

## 4. Sugestões Concretas de Melhoria

### Para H1 — Recalibrar escopo da Frente B
Revisar os arquivos afetados com o estado real (já verificado):
- `LearningPlanProposalCard.tsx:147-244` → já tem `<Fold>`. O que falta é **step indicator** (1/4, 2/4…) com navegação entre folds, não criar colapso que já existe.
- `Config.tsx:288-397` → renomear "Dados locais" para 3 sub-cards (Status, Backup, Zona de Perigo) com separadores visuais e cor de alerta no último.

Atualizar o spec para refletir que o chunking de aprovação **já é colapsável**; o trabalho é adicionar step indicator e forçar revelação sequencial.

### Para H2 — Robustecer o timer para o caso background
Adicionar ao mecanismo de anomalia: além do wall-clock, verificar `document.visibilityState` no momento da conclusão. Se o bloco foi concluído com a página visível, a pergunta aparece. Se foi concluído após um período de hidden, o crédito planejado é aplicado automaticamente (sem perguntar), porque o usuário pode nem ver a pergunta. Alternativa: usar `pagehide`/`visibilitychange` para registrar timestamps de ocultação e usar isso como ajuste no wall-clock antes da detecção de anomalia.

### Para H3 — Lazy loading de SVGs
Renderizar `TacticDiagram` com `loading="lazy"` ou, se for SVG inline, usar `IntersectionObserver` para só montar o SVG quando o card estiver visível no carrossel. Adicionar `will-change: transform` nos cards do carrossel para isolar repaint.

### Para M1 — Escolher biblioteca de carrossel
Recomendação: **Embla Carousel** (4KB gzip, vanilla TS, a11y-ready com `role="region"` + `aria-roledescription="carousel"`, suporta loop + drag + keyboard). Alternativa mais leve: implementar com `scroll-snap-type: x mandatory` + `scrollTo({ behavior: 'smooth' })` nativo (sem lib, ~50 linhas), mas perde animação de swipe momentum.

### Para M2 — Definir fallback explícito de dedup
Quando `secondaryWeakness === undefined`:
- **Opção A (recomendada):** substituir bloco de transferência por replay do recurso com menor taxa de acerto ou mais antigo (já existe `createReplayResourceIfUseful`).
- **Opção B:** pular o bloco de transferência e aumentar o tempo de warm-up ou practice.
- **Opção C:** manter um tema fixo default ("tactics fundamentals") como fallback.

Escolher UMA e documentar no spec.

### Para M3 — Automatizar verificação mobile
Adicionar um teste Playwright com viewport 375×812 que captura screenshots da página principal e faz snapshot comparison (baseline). Mesmo que "screenshot está instável" para cores, usar `toHaveScreenshot()` com threshold de 1% para detecção de quebras de layout. Complementar com axe-core no mesmo viewport.

### Para M4 — Inserir gate de a11y por fase
Após cada fase com novo componente de UI (Fase 2: TacticDiagram, Fase 3: carrossel), executar `npx axe --include 'svg, [role="region"]'` ou equivalente. Não esperar a Fase 6.

### Para M5 — Cooldown com override por erro recente
Regra: "não repetir o mesmo tema em dias consecutivos, **a menos que** o aprendiz tenha blundered (erro por peça) nesse tema nos últimos N jogos (ex.: 3 jogos)". Isso mantém a proteção contra tédio mas não suprime necessidades reais.

### Para L3 — Validar diagramas contra exemplos canônicos
Antes de codar cada SVG, referenciar um estudo/puzzle do Lichess que ilustre o conceito (ex.: garfo → `practice:fundamental-tactics:the-fork`). O próprio `resourceCatalog.ts` já mapeia fraquezas a resources — usar esse mapeamento como fonte da posição correta.

---

## 5. Risco Geral: **MEDIUM**

**Justificativa:** O spec é superior à média em fundamentação (15 claims verificadas contra código real) e em honestidade intelectual (admite que o timer é wall-clock puro, que dedup está quebrado, que confiança é rotulada errado). As 6 frentes são bem delimitadas e os gates são objetivos. Porém, **3 problemas estruturais** elevam o risco de MEDIUM para HIGH se não corrigidos antes da execução:

1. **2 claims sobre o estado do código estão parcialmente erradas** (H1), o que significa que a Frente B pode gastar esforço em algo já feito ou mal dimensionado.
2. **O timer honesto tem uma lacuna funcional** (H2) no caso de conclusão pós-background que o spec não trata — teto de 90 min é paliativo, não solução.
3. **O carrossel e os SVGs não têm decisão de build-vs-buy ou budget** (H3, M1), transferindo risco de arquitetura para a implementação.

Com as correções sugeridas (recalibrar Frente B, robustecer timer com visibility state, escolher Embla para carrossel, definir fallback explícito de dedup), o risco cai para **LOW**. Sem elas, a Fase 3 (maior e mais arriscada) pode estourar ou entregar experiência inferior em mobile.

---

**Próxima ação recomendada:** Submeter ao council para decidir as 5 questões abertas (seção 8), incorporar as correções de H1 e H2 no spec, e só então iniciar `writing-plans`. Modelo recomendado para a sessão de council: **Opus 4.8 / Fable 5** (decisões de produto + arquitetura).

---

