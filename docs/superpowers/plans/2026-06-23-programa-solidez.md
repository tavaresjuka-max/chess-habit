# Programa "App Nota 9.5" — Loop autônomo de melhoria contínua

**Charter do dono (2026-06-23):** rodar um loop autônomo que cobre TODAS as áreas do app, com execução por GLM, agregação por Sonnet, council criticando, e auditoria de bugs entre ciclos. **Condição de parada: nota ≥ 9.5 em TODAS as áreas, pelo council (DeepSeek V4 Pro + GLM 5.2) E pelo Opus.** Não parar antes disso. Entre ciclos: auditar bugs, corrigir, brainstorm + council → roadmap ideal → recomeçar.

## Papéis
- **Opus (maestro):** planeja, adjudica council, revisa RISCO, dá a nota final, decide parar.
- **GLM 5.2 (executor):** escreve código/testes por milestone em branch, roda gates, auto-fix.
- **Sonnet 4.6 (agregador):** consolida relatórios e saídas de council em 1 tela.
- **Council externo (DeepSeek V4 Pro + GLM 5.2):** critica planos (VERIFICAR), diverge em decisões abertas (DIVERGIR), e PONTUA cada área /10.
- **Haiku 4.5:** mapeamento/buscas read-only (feature map, dead-code, evidência).

## Guardrails (invariantes do loop)
- Gate objetivo é o árbitro: `npm run test && npm run typecheck && npm run lint && npm run build` + e2e Playwright quando tocar UI. Voto de IA não fecha nada.
- 1 dono na escrita (GLM), branch por milestone, merges serializados. Opus commita após revisar risco.
- Opus revisa só: segredo/.env, comando destrutivo, schema/API, escopo além do plano.
- Auto-fix 3x; persistindo, escala pro Opus.
- Reversível: tudo em branch; produção só com pedido explícito do dono.
- Para e fala só por: bloqueio externo real (Cloudflare), ação destrutiva não pré-aprovada. (Mudança de escopo NÃO pausa — o loop é o escopo aprovado.)

## As 12 áreas avaliadas (cobertura total do app)
1. **Onboarding & placement** — funil, questionário, calibração.
2. **Sync & import** — Lichess/Chess.com, OAuth, rate-limit, banda automática.
3. **Plano & scheduler** — geração de plano, scheduler híbrido bloco→intercalado.
4. **Treino & feedback** — registrar treino, pending items, loop de hipóteses.
5. **Diplomas, bandas & progresso** — gates de diploma, progressão de banda, conquistas.
6. **Backup/restore & integridade de dados** — export/import, migrações Dexie, bug DATA-1.
7. **UI/UX & acessibilidade** — hierarquia, mobile, a11y (axe/WCAG AA), estados de erro.
8. **Arte & polimento visual** — assets premium, consistência, loading states.
9. **Performance** — Lighthouse, bundle, lazy-load, offline/PWA.
10. **Saúde de código** — código morto/órfão, cobertura de testes, tipos, duplicação.
11. **Segurança & privacidade** — CSP, manuseio de token, local-first, sem vazamento.
12. **Texto & copy** — pt-BR, clareza TDAH, sem redundância, tom.

## Rubrica de nota (/10 por área)
- **9.5–10:** sem bug conhecido; coberto por teste/e2e; usado de fato pela UI; polido; council sem ressalva relevante.
- **8–9.4:** funciona, mas tem gaps (cobertura parcial, polimento, edge case) → vira backlog do próximo ciclo.
- **<8:** bug real ou feature ausente/órfã → prioridade alta no ciclo.
A nota da área é o **mínimo** entre (média do council) e (nota do Opus) — conservador de propósito: basta um avaliador reprovar para a área não fechar.

## Ciclo do loop (repete até 9.5 em tudo)
**A. Brainstorm + roadmap (início de fase):** Opus propõe melhorias por área (focando as de menor nota); council DIVERGE (maior risco + alternativa + o que quebra); Opus sintetiza o **roadmap ideal do ciclo**.
**B. Planejar milestones:** Opus escreve PLAN.md bite-size com aceite binário; council VERIFICA plano se arquitetural.
**C. Executar:** branch → GLM implementa → gates → auto-fix 3x.
**D. Agregar:** Sonnet consolida o relatório (mudanças, gates, risco, pendências).
**E. Auditar bugs:** bug hunt (suite+e2e+council VERIFICAR); todo candidato a bug só vira ação após teste que FALHA; GLM corrige → gates.
**F. Pontuar:** council + Opus dão nota /10 a cada uma das 12 áreas (com evidência: teste, caminho de UI, ausência de bug).
**G. Decidir:** se TODAS ≥ 9.5 → **PARAR** + relatório final. Senão → volta ao A mirando as áreas de menor nota.

## Estado dos milestones (entram no roadmap conforme o ciclo)
- **M2a — Banda automática Lichess:** plano final pronto ([link](2026-06-23-m2a-banda-automatica-lichess.md)); GLM executando (ciclo 1).
- **M-Hardening — auditoria "tudo funcionando":** matriz feature×evidência + dead-code + bug bar (ciclo 1).
- **M3a — Cravadas:** depende de M2a + asset diploma-cravada.
- **Polimentos por área:** UI/UX, copy, performance, arte — distribuídos pelos ciclos conforme as notas.
- **M2b (sync) e M4 (comunidade):** BLOQUEADOS — dono precisa provisionar Cloudflare Workers + D1. Fora do loop até liberar.

## Relatório
1 relatório por milestone e 1 placar de notas por ciclo. Sem updates intermediários que pedem resposta.
