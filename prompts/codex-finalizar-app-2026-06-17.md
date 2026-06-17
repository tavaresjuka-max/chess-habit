# PROMPT — Finalizar o app até o beta (Codex), com caça-bugs final e relatório final

> Cole isto no Codex e deixe rodando. Você (Codex) executa **TODAS as pendências do app até o fim**,
> sem parar, milestone a milestone, com gate objetivo em cada um, depois faz um **caça-bugs final**
> adversarial e escreve um **relatório final com notas**. Quando faltar uma decisão, registre em
> `DECISIONS.md` com a suposição adotada e **siga** — o dono confere de manhã.

## 0. Contexto e leitura obrigatória (nesta ordem)

App: `lichess-tutor` (nome público de trabalho **"Rotina"**). PWA pessoal de treino de xadrez no
Lichess. React 19 + TypeScript estrito + Vite + Dexie (IndexedDB) + PWA Workbox. PT-BR. Local-first.
Em produção em `rotina-pied.vercel.app`. Trabalhe na pasta `lichess-tutor`.

1. `AGENTS.md` — regras canônicas + bloco "Autorizacao P4 + P5" (dono descongelou P4/P5 em 2026-06-16)
   + seção "Comandos & Capacidades" + "Falsos Positivos Refutados".
2. `docs/review/consolidacao-multi-ia-2026-06-17.md` — **a fonte de verdade desta rodada**: arbitragem
   dos 4 relatórios, bugs verificados, severidades **corrigidas** e plano de ação. Priorize-a.
3. `docs/review/roadmap-beta-2026-06-16.md` — milestones M1–M15 (escopo de cada fase).
4. `docs/review/analise-completa-sistema-2026-06-17-*.md` (Codex/Gemini/DeepSeek) — detalhe por achado.
5. `memory/{state,decisions,progress}.md` — estado e decisões do projeto.

## 1. Missão

Levar o app de "ferramenta pessoal boa" a **beta público pronto**, executando **tudo** que está
pendente: todos os bugs P1/P2/P3 da consolidação **+** os milestones M1–M15 do roadmap. Terminar com um
**caça-bugs final** e um **relatório final com notas por área**. Vá o mais longe que conseguir; pare
sempre num **estado verde** (gates passando) e nunca deixe o app quebrado.

## 2. Contrato de operação (NÃO violar)

- **Non-stop.** Não pergunte ao dono. Faltou decisão de produto não coberta? Escolha a opção mais
  conservadora alinhada à consolidação/AGENTS.md, registre em `DECISIONS.md` (data, milestone, decisão,
  alternativa, porquê) e continue.
- **Gates substituem checkpoint humano.** Antes de QUALQUER commit: `npm run lint && npm test &&
  npm run build` verdes. **tsc estrito pega o que o vitest não pega — sempre rode `npm run build`,
  não só vitest.** Cobertura: ver §4 (a suíte é FLAKY, não quebrada).
- **Commits atômicos**, um por unidade verificável, mensagem em PT-BR: o que mudou · arquivos ·
  verificações · riscos remanescentes. Termine cada uma com:
  `Co-Authored-By: Codex <noreply@openai.com>`
- **PROIBIDO:** deploy de produção (front OU back); provisionar nuvem / criar contas / tocar secrets de
  produção; `git push --force`; `git reset --hard` destrutivo; pular hooks (`--no-verify`); editar
  histórico já enviado. **Sem deploy** — o dono revisa e deploya.
- **TDD para bugs:** escreva o teste que REPRODUZ o bug (falhando) antes de corrigir. **Não alucine
  bugs** — trace input→saída-errada no código real (inclua os chamadores). Antes de "corrigir" qualquer
  coisa da seção "Falsos Positivos Refutados" do `AGENTS.md`, releia-a.
- **Regras Inquebráveis sempre valem** (mesmo em P4/P5): clean-room; sem scraping (só APIs oficiais);
  sem tabuleiro próprio; sem ajuda em partida ao vivo; OAuth mínimo (`puzzle:read`/`study:write`);
  **tokens OAuth só no aparelho, nunca sobem no sync, nunca em log/bundle/backup**; **PGN transiente,
  nunca persistir**; sem PII de perfil; rate-limit Lichess (1 req/vez, 429→≥1min); AGPL; **sem promessa
  de rating**; sem engine.

## 3. Decisões já tomadas (use, não re-decida)

- **Nome público:** PENDENTE. Crie/centralize **`APP_NAME`** (ex.: `src/config/appIdentity.ts`),
  placeholder `'Rotina'`, e roteie TODO uso de nome público por ela (manifest, títulos, README,
  disclaimers, nome do banco Dexie se viável sem migração destrutiva). Deixe 1 ponto de troca + TODO
  e um teste/grep de CI que barre nome público antigo.
- **Diagnóstico Chess.com:** fazer **as duas coisas** — (a) limiares Chess.com-aware (`opening`>0,5;
  `clock` 1 timeout se jogos≥15) **e** (b) comunicar na UI que Chess.com dá sinal mais raso e reforçar
  a avaliação de entrada como caminho forte para quem só tem Chess.com.
- **Sync P4:** Cloudflare Workers + D1; login = **Entrar com Lichess** (identidade, sem escopo de jogo);
  dados sobem **cifrados ponta-a-ponta com chave derivada de PASSPHRASE do dono (NÃO da identidade
  Lichess)**; **tokens nunca sobem**; merge por `updatedAt`/tombstone (não replace destrutivo).
  Construir + testar **local** (wrangler/miniflare); **não provisionar nuvem**; entregar `DEPLOY-BACKEND.md`.
- **Beta:** pode abrir **local-first com backup robusto** (não bloquear no P4) — mas deixe o P4 pronto
  no código para o dono ligar quando quiser.
- **Deploy:** só commits. Não deployar.

## 4. Correções de rumo (NÃO desperdice esforço aqui)

A consolidação arbitrou dois pontos que os 4 relatórios anteriores erraram — **respeite a correção**:

- **`addDays` NÃO é off-by-one.** Probe empírico (`tmp/audits/Claude/addDays-probe.mjs`) prova
  `setDate ≡ setUTCDate` em GMT-3 e até em fusos com DST. **Não "conserte um off-by-one no `addDays`".**
  O problema real (P2) é que o "hoje" é **UTC** em todo o domínio de datas (`isDueToday`, constância),
  então a virada do dia cai ~21h local. **Fix correto:** primitiva de **data local injetável (`nowFn`)**
  usada em `isDueToday`, constância e `getNextDueDate` — o que também torna tudo testável. Adicione
  teste com `TZ=America/Sao_Paulo` cobrindo 21h–23h locais.
- **Coverage não está "quebrado" — está FLAKY** (passa às vezes, falha às vezes, por timing/IndexedDB/
  ordem). **Trate como estabilização de QA (P2):** DB nomeado por arquivo/teste, teardown agressivo,
  reduzir dependência de timing real, fake-indexeddb isolado. Critério de pronto: `npm test` e
  `npm run coverage` passam **5× seguidas** em ambiente limpo.

## 5. Backlog completo, priorizado (executar em ordem)

### Fase A — Estabilizar (bugs P1/P2 que bloqueiam confiança)
1. **[P1] Card herda feedback** — hero `PlanBlockCard` sem `key`: adicionar `key={heroBlock.id}` em
   `Today.tsx:280` **e** resetar `isRating/isOpening/isSavingPending/openWarning` por
   `useEffect([block.id])` em `PlanBlockCard.tsx`. Teste E2E: concluir bloco 1 → bloco 2 NÃO mostra
   "Como foi o treino?".
2. **[P1] Race de fraquezas** — `saveProfile`/`runOnboardingImport` rodam Chess.com+Lichess em paralelo
   e cada um faz `replaceWeaknesses` total → o último apaga o outro. Fix: `replaceWeaknessesForSource(source, …)`
   (preferido; adicionar `source` ao `WeaknessRecord`) **ou** serializar. Teste: 2 fontes paralelas → união preservada.
3. **[P1] Diagnóstico Chess.com mudo** — 294 sinais → 0 fraquezas (ver §3). Fixture de 294 sinais
   Chess.com → ≥1 fraqueza temática; E2E do perfil só-Chess.com mostra diagnóstico real (print).
4. **[P2] Estabilizar a suíte flaky** + coverage 5× (ver §4).
5. **[P2] `clearAllData` cancela sync em voo** — `operationEpoch`/AbortController; teste: clear durante
   sync → DB permanece vazio.
6. **[P2] Datas locais (`nowFn`)** — ver §4 (rótulo corrigido).
7. **[P2] Hardening de exposição** — `sourcemap:'hidden'` (ou 404 em `/assets/*.map`); `getEvidenceLevel`
   → `switch(confidence)`; remover `unsafe-inline` de style-src se possível + `upgrade-insecure-requests`.
8. **[P2] A11y pack** — skip-nav antes da `<nav>`; foco no lazy-load de Config/Progress; `<h2>` fora do
   `<summary>` (span estilizado); `<div role="alert">` no lugar de `<p role="alert">`; remover
   `aria-busy` de `<a>`; aria-label "(abre em nova aba)"; 44px via `@media (pointer:coarse)`. Rodar axe.

### Fase B — Pedagogia/dados (P2)
9. **`computeMastery` → `generatePlan`** (enviesar `resourceStage`); ativar trilha `progress-diplomas`;
   badge "Diplomado".
10. **`buildPuzzleThemeStats` double-count** — filtrar `result.kind==='puzzle-dashboard'`.
11. **`puzzleActivity` `since` inexistente** — remover param + paginar por `before` (>200 puzzles).
12. **Backup completo (16 tabelas) + `migrateBackup` v1→v2** + validação de shape e **limite de tamanho
    antes de ler o arquivo** (`Config.tsx`); **validar URLs do backup** (`lichessStudies.url`/destino)
    contra `lichess.org`; sanitizar `href` de treino (`PlanBlockCard`) via `isAllowedExternalUrl`.
13. **Teste de regressão de privacidade**: `exportAllAsJson()` não contém `accessToken`.
14. **Currículo/conteúdo** (M5/M8 do roadmap): notas de coach por tema além de `fork`; trilha "Finais
    Essenciais"; `knownManualSignals` 9+; `puzzleThemeLabel` ampliado. Currículo denso 1200-2200 fica
    **scaffold + TODO** (Corte 8, bloqueado pelo gate de eficácia).

### Fase C — UX/insights/robustez (P2/P3)
15. **Bloco de 0 min × Progresso "Sem treinos ainda"** — contrato de "treino mínimo" ou "feito fora do
    app"; mensagem coerente.
16. **Insights** (M10): accuracy por tema no Today; painel Progresso com tendências/eficácia/before-after.
17. **Robustez P3:** `oauthFlow` `JSON.parse` em `try/catch`; `Retry-After`-aware cooldown + jitter;
    `chesscomClient`/`importPgnToStudy` validar shape em runtime; smoke com porta parametrizável;
    microcopy de OAuth em 2 camadas; considerar `max`/streaming em `games`.
18. **Gamificação** (M9): marcos elásticos 100h/500h/1000h (sem streak punitivo).
19. **Higiene de docs:** corrigir `memory/state.md` (trecho "P4/P5 congeladas"); resolver conflitos
    P4/P5 em `PLANO.md`/`docs/architecture/system.md`/`progress.md`; `weaknessLabels` canônico (eliminar
    as 4 cópias com drift de acento); fence ESLint cobrindo `../app/*`.

### Fase D — Sync (P4, local-only) — ver §3
20. Backend Workers/D1 + auth Sign-in-with-Lichess + storage de blobs E2EE; wrangler/miniflare + testes;
    `DEPLOY-BACKEND.md`. **Sem provisionar.**
21. Engine de sync no cliente (push/pull, conflito por `updatedAt`/tombstone, derivação de chave por
    passphrase, tokens locais); UI de Config; E2E simulando 2 aparelhos.

### Fase E — Comunidade (P5)
22. Rename público via `APP_NAME`; **link "Código-fonte" visível na UI (AGPL §13)**; disclaimer de
    não-afiliação; doação = link externo; doc de privacidade.
23. Prontidão beta: página sobre/landing simples; onboarding público; canal de feedback; release notes.

## 6. Protocolo de QA por milestone (obrigatório antes de avançar)

Para FECHAR qualquer item:
1. **Gates:** `npm run lint && npm test && npm run build` verdes; `npm run coverage` ≥ thresholds e
   estável (ver §4); `npm run smoke:pwa` verde quando tocar UI/PWA (alvo: **26/26** — investigue a
   falha atual do `oauth-callback` no mobile-chromium / porta 4188).
2. **E2E com prints:** rodar Playwright; gerar/atualizar screenshots dos fluxos tocados em
   `e2e/__screenshots__/`; citar caminhos no commit.
3. **Jogar o fluxo:** dirigir o app real (Playwright headed ou dev server) pelo caminho alterado —
   onboarding→Hoje, iniciar bloco→timer→completar→feedback→log, reconciliar puzzles, backup —, conferir
   os prints. Regressão → **corrigir antes de avançar**.
4. **Caça-bug do milestone:** revisão adversarial do diff (sem alucinar). Corrigir reais.
5. **Commit atômico.** Atualizar `DECISIONS.md` e o progresso.

## 7. Caça-bugs FINAL (depois de M1–M15)

Quando o backlog estiver fechado (ou a noite acabar), faça uma varredura final adversarial:
- Multi-passe por camada (domain/infra/app/ui), exigindo **trace input→saída-errada** antes de reportar.
- Verifique de novo os falsos-positivos do `AGENTS.md` (NÃO reabrir: OAuth state validado, purge de
  signals, `hard`→`explain`, deps de `useCallback` estáveis, **`addDays` NÃO é off-by-one**).
- Para cada bug confirmado: corrigir com teste de regressão (TDD) ou, se arriscado, **documentar** no
  relatório com severidade e proposta (não "consertar" às cegas perto do fim).
- Rodar a suíte completa + coverage 5× + smoke + build ao final.

## 8. Relatório FINAL (entregar ao terminar)

Escreva `docs/review/relatorio-final-app-2026-06-17.md` (ajuste a data se virar o dia) com:
1. **Resumo executivo** — estado, **nota geral 0–10**, **prontidão para beta público 0–10**, principais forças/riscos.
2. **Notas por área 0–10** (Produto, UX, Diagnóstico, Plano, Método 5 trilhas, Arquitetura, TS, Testes,
   Privacidade, Segurança, PWA/offline, Integrações, Performance, Acessibilidade, Mobile, Documentação,
   Prontidão beta) — cada nota com motivo de 1 linha.
3. **O que foi feito** — milestones/bugs fechados, com commits e resultados dos gates (números reais:
   testes, coverage, smoke).
4. **O que falta** — pendências reais, com severidade e proposta.
5. **Caça-bugs final** — confirmados (corrigidos/documentados) × refutados.
6. **O que deveria ser feito** — plano priorizado (ação · prioridade · esforço · impacto · critério de pronto).
7. **Decisões do dono** — o que ainda precisa de decisão humana (no mínimo: nome público final;
   passphrase do E2EE; beta local-first vs. esperar P4).
8. `DECISIONS.md` — todas as suposições adotadas na noite.

**Não deployar.** Deixe tudo commitado e verde.

---

### Resumo de uma linha
Feche TODO o backlog (Fase A→E: bugs verificados da consolidação + M1–M15), em ordem, com gate verde +
E2E com prints + jogar o fluxo + corrigir antes de avançar; respeite as correções (addDays NÃO é
off-by-one; coverage é flaky); centralize `APP_NAME`; construa o P4 local + E2EE por passphrase;
registre suposições em `DECISIONS.md`; faça o caça-bugs final e escreva o relatório final com notas —
sem deployar, sem provisionar nuvem, sem force-push.
