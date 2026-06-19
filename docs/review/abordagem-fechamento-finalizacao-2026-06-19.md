# Conselho do council — fechamento da finalização (estado + o que falta)

PWA de treino de xadrez (Professor Lemos), local-first, React 19. Uma rodada de "finalização" foi executada. Critique o estado e oriente o fechamento. Marque achados HIGH/MEDIUM/LOW e responda às perguntas no fim.

## Já entregue (commitado, gates verdes: 80 arq./652 testes, lint, build)

1. **Mobile:** acentuação corrigida (`appIdentity`); quebras órfãs via `text-wrap: balance/pretty`. (Verificação derrubou 6 dos "7 riscos" de um audit anterior — o CSS já era responsivo.)
2. **Imagens didáticas:** componente `TacticDiagram` (SVG, lazy via IntersectionObserver, `role="img"`+aria-label) com 13 conceitos táticos, renderizado no `PlanBlockCard` via `block.weaknessTag`.
3. **Métricas honestas:** nº de exercícios (real do Lichess) vira a métrica principal; tempo agora é **estimado pelos timestamps** dos puzzles (`estimateActiveSeconds`: soma gaps < 3 min, piso 8 s/puzzle, teto 1 h), não wall-clock do "abrir→concluir". Bloco sem atividade Lichess mostra só "Concluído.".
4. **Modo foco:** `BlockCarousel` (Embla) — o plano do dia virou carrossel (swipe, pontinhos, alterna "ver lista"). Substituiu o padrão "hero + lista na dobra" no `Today.tsx`. Stubs globais de teste (matchMedia/ResizeObserver/IntersectionObserver) para jsdom.
5. **Pedagogia (5a):** rótulo de confiança honesto (low+score≥0.5 não vira "média"); estágio "fácil" avança 1 nível (`advanceThemeStage`), não pula consolidação.
6. **Progressão de banda (6):** `promoteBandForDiplomas` (Peão→800-1000, Torre→1000-1200, Rei→1200-1600), chamado no `saveProfile` pós-`generatePlan`. **Ressalva crítica:** `saveDiplomaAttempt` NÃO tem chamador em produção — o fluxo de "fazer o diploma" não existe na UI, então a promoção é **no-op** até isso ser implementado.

## O que falta

- **5b reduzida** (council anterior cortou o resto): dedup de replay (não escolher o mesmo `destination.url` de replay em sessões consecutivas) + fallback de transferência sem fraqueza secundária = primária com estágio reduzido.
- **7 · Agregação no Progresso:** `SessionMilestonesCard`/`progressOverview` ainda somam "horas" (wall-clock) em vez de exercícios — incoerente com a decisão 3 (métricas honestas).
- **Testes de game manuais** ponta a ponta (screenshot do preview trava neste ambiente).
- **Follow-ups:** gravação de tentativas de diploma (destrava a banda); 6b (`computeMastery` nos blocos normais).

## Perguntas

1. Prioridade de fechamento: o que entrega mais valor primeiro — agregação do Progresso (coerência das métricas), 5b (anti-repetição), ou destravar a gravação de diploma (a banda só funciona com isso)?
2. A promoção de banda ser **no-op** sem gravação de diploma é aceitável de entregar assim, ou é melhor implementar um gatilho mínimo de gravação de diploma agora?
3. Risco em alguma decisão já entregue? (ex.: `estimateActiveSeconds` heurístico; carrossel esconder o panorama do dia; estágio "fácil" agora poder chegar a `transfer`.)
4. Algo virou over-engineering ou ficou incoerente após essas mudanças?
5. Para um beta PESSOAL (um usuário), o que é desperdício de esforço fechar agora vs deixar como follow-up?
