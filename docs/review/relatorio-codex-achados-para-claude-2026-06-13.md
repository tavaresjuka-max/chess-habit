# Relatorio Codex — Achados Para Analise Do Claude

Data: 2026-06-13  
Autor: Codex  
Destino: Claude / diretor de produto-arquitetura  
Escopo: achados auditaveis do estado atual do `lichess-tutor` apos a auditoria geral e a aprovacao
dos badges v1.

## Contrato Que Deve Guiar A Analise

- Ferramenta pessoal primeiro; comunidade fica congelada para P5.
- PWA local-first sem backend na fase atual.
- P4/P5 continuam congeladas: sem Worker, D1, sync multi-dispositivo, conta propria, proxy ou versao
  publica ate nova decisao do dono.
- Sem tabuleiro proprio, sem engine, sem ajuda em partida viva, sem Board/Bot/Challenge API.
- APIs externas somente oficiais/documentadas.
- OAuth Lichess opt-in apenas com `puzzle:read` e `study:write`.
- Chess.com segue PubAPI publica read-only, sem login e sem persistir PGN completo.
- Gate por fase: `npm run lint && npm run test && npm run build`.

## Estado Atual Verificado

- `npm run lint`: verde em 2026-06-13.
- `npm run test`: verde, 370 testes em 57 arquivos.
- `npm run build`: verde, PWA gerada com 73 entradas de precache.
- `npm audit --audit-level=moderate`: 0 vulnerabilidades.
- `npm audit --omit=dev --audit-level=moderate`: 0 vulnerabilidades.
- Smoke Playwright desktop/mobile: tela Hoje carrega, dobras `Fold` alternam, sem erro de console e
  sem overflow horizontal.

## Achados Ja Resolvidos

1. **Spec de badges estava stale**
   - Antes: `docs/superpowers/specs/2026-06-10-badges-spec-draft.md` dizia rascunho/bloqueado.
   - Agora: aprovada pelo dono em 2026-06-13.
   - V1 aprovada: 5 conquistas unicas, esforço/habito, sem rating, sem streak punitivo, com metrica
     de qualidade, export/backup via Dexie.

2. **Arquitetura documentada parecia full-stack**
   - Antes: `docs/architecture/system.md` descrevia Worker/D1 como decisao atual.
   - Agora: descreve PWA local-first sem backend; Worker/D1/sync ficam congelados para P4.

3. **Lint estava vermelho por comentario ESLint invalido**
   - Antes: `src/ui/Fold.tsx` usava `react-hooks/exhaustive-deps` sem plugin/regra.
   - Agora: `Fold` usa `useState(defaultOpen)` para preservar abertura/fechamento pelo usuario.

4. **Artefato local sujava o status**
   - `output/imagegen/` agora esta no `.gitignore`.
   - Os assets otimizados continuam em `public/art`.

## Achados Ainda Abertos

### A1 — Falta Fila/Cooldown Central De API

**Risco:** chamadas paralelas acidentais ou retries sem cooldown podem bater em rate limit e quebrar
fluxos de diagnostico/reconciliacao.  
**Evidencia externa:** Lichess pede uma requisicao por vez e espera de 1 minuto apos HTTP 429; Chess.com
declara PubAPI read-only e alerta que paralelismo pode gerar 429.  
**Arquivos provaveis:** `src/infra/lichess/*.ts`, `src/infra/chesscom/chesscomClient.ts`,
`src/app/state.ts`, `src/app/trainingLogFlow.ts`.  
**Recomendacao Codex:** criar um `rateLimitedFetch` ou fila por provedor, com testes de concorrencia,
429 e cooldown.

### A2 — PWA So Tem Smoke Parcial De Producao

**Risco:** build gera service worker, mas a garantia atual e mais forte no unit/config e no dev server
do que em preview/offline real.  
**Arquivos provaveis:** `vite.config.ts`, `src/ui/ReloadPrompt.tsx`, `src/pwaConfig.test.ts`,
`scripts/check-prod.mjs` se for reaproveitado.  
**Recomendacao Codex:** automatizar build + preview + service worker registrado + reload offline +
prompt de update.

### A3 — Import De Backup Ainda Pode Validar Shape Mais Profundamente

**Risco:** checksum e tabelas-array protegem contra corrupcao grossa, mas backup com campos internos
errados pode importar inconsistencias que so aparecem depois.  
**Arquivos provaveis:** `src/infra/storage/backup.ts`, `src/infra/storage/appData.ts`,
`src/infra/storage/*.test.ts`.  
**Recomendacao Codex:** guards por entidade para profile, plans, logs, signals, weaknesses, pendencias,
conquistas e placement.

### A4 — Falta Ledger De Assets Gerados

**Risco:** hoje ha assets premium gerados e otimizados, mas P5/open-source/publicacao futura precisa
rastro claro de origem, prompt, ferramenta, data, licenca/termos e aprovacao.  
**Arquivos provaveis:** `public/art/`, `entrega/`, `prompts/geracao-*.md`, novo
`docs/design/assets-ledger.md`.  
**Recomendacao Codex:** criar ledger antes de qualquer polish publico/comunidade.

### A5 — Cobertura E2E Pode Virar O Diferencial De Confianca

**Risco:** a suite unit/integration e forte, mas fluxos de valor completos ainda dependem de smoke
manual/script solto.  
**Fluxos candidatos:** primeira entrada, Config, atualizar Chess.com, gerar plano, abrir treino,
concluir feedback, desbloquear conquista, exportar/restaurar backup, mobile 390px.

### A6 — Estado/Bundle Ainda Sao Pontos De Manutencao

**Risco:** `useAppState` ainda concentra muita orquestracao; build avisa chunk principal acima de
500 kB. Nao e blocker, mas limita a nota de DevEx/performance.  
**Recomendacao Codex:** quebrar por fatias quando houver testes E2E protegendo os fluxos; investigar
code-split antes de ajustar limite de warning.

## Perguntas Para O Claude

1. A fila/cooldown central de API deve ser o proximo corte obrigatorio antes de qualquer feature?
2. O smoke PWA de producao deve entrar antes ou depois da validacao profunda de backup?
3. O ledger de assets deve ser tratado como obrigatorio agora, mesmo com P5 congelada, ou apenas antes
   de qualquer publicacao?
4. E2E deve ser um corte proprio ou acoplado a cada melhoria tecnica?
5. O refactor de `useAppState` deve esperar API/PWA/backup ficarem blindados?

## Veredito Codex

Para elevar o projeto de "muito bom" para "maduro", eu priorizaria nesta ordem:

1. Fila/cooldown central de API.
2. Smoke PWA de producao/offline.
3. Validacao profunda de backup.
4. E2E dos fluxos de valor.
5. Ledger de assets.
6. Refactor gradual de estado e bundle.

Essa ordem melhora confianca sem abrir P4/P5 e sem criar produto publico antes da hora.
