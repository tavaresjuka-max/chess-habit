# PROMPT — Execução autônoma overnight (Codex) — lichess-tutor → beta

> Cole isto no Codex e deixe rodando. Você (Codex) executa **sem parar** a noite toda, milestone a
> milestone, com gate objetivo em cada um. Você NUNCA pergunta ao dono durante a noite: quando faltar
> uma decisão, registra em `DECISIONS.md` com a suposição que adotou e **segue**. O dono confere de
> manhã.

## 0. Contexto

App: `lichess-tutor` (nome público de trabalho **"Rotina"**), PWA pessoal de treino de xadrez no
Lichess. React 19 + TypeScript estrito + Vite + Dexie (IndexedDB) + PWA Workbox. PT-BR. Local-first.
Em produção em `rotina-pied.vercel.app`. Trabalhe na pasta `lichess-tutor`.

**LEIA PRIMEIRO, NA ORDEM:**
1. `AGENTS.md` — regras canônicas + a "Autorizacao P4 + P5" (o dono descongelou P4/P5 em 2026-06-16).
2. `docs/review/roadmap-beta-2026-06-16.md` — o plano-mestre com os milestones M1–M15 (este prompt
   referencia os números de lá; o detalhe de escopo de cada milestone está nele).
3. `memory/` (se acessível) — estado e decisões do projeto.

## 1. Missão

Avançar o app rumo ao **beta público** seguindo M1→M15 do roadmap, em ordem, fechando cada milestone
com o **Protocolo de QA (§4 do roadmap)**: gates de código + E2E com prints + **jogar o fluxo** +
caça-bug + commit atômico. Comece em **M1** e vá o mais longe que a noite permitir. Pare sempre num
**milestone verde**.

## 2. Contrato de operação (NÃO violar)

- **Non-stop.** Não pergunte ao dono. Faltou decisão de produto não coberta? Escolha a opção mais
  conservadora alinhada ao roadmap/AGENTS.md, registre em `DECISIONS.md` (data, milestone, decisão,
  alternativa, por quê) e continue. Nunca fique ocioso esperando input.
- **Gates substituem checkpoint humano.** Antes de QUALQUER commit: `npm run lint && npm test &&
  npm run build` verdes; `npm run coverage` ≥ thresholds; `npm run smoke:pwa` verde quando o milestone
  toca UI/PWA. **tsc estrito pega o que o vitest não pega — sempre rode `npm run build`, não só vitest.**
- **Commits atômicos**, um por unidade verificável, com mensagem: o que mudou · arquivos · verificações
  feitas · riscos remanescentes. Mensagens em PT-BR. Finalize cada uma com:
  `Co-Authored-By: Codex <noreply@openai.com>`
- **PROIBIDO nesta noite:** deploy de produção (front OU back); provisionar nuvem / criar contas /
  tocar secrets de produção; `git push --force`; `git reset --hard` destrutivo; pular hooks
  (`--no-verify`); editar histórico já enviado. **Sem deploy** — o dono revisa e deploya (decisão D5).
- **TDD para bugs:** escreva o teste que REPRODUZ o bug (falhando) antes de corrigir. Não alucine bugs
  — trace input→output errado no código real (incluindo os chamadores) antes de reportar/corrigir. Veja
  a seção "Falsos Positivos Refutados" do `AGENTS.md` (mas note: `addDays` de `pendingItems.ts` NÃO é
  refutado — é bug real a investigar).
- **Regras Inquebráveis sempre valem** (mesmo em P4/P5): clean-room (zero ChessKing); sem scraping (só
  APIs oficiais); sem tabuleiro próprio; sem ajuda em partida ao vivo; OAuth mínimo; **tokens OAuth só
  no aparelho, nunca sobem no sync, nunca em log/bundle/backup**; **PGN transiente, nunca persistir**;
  sem PII de perfil; rate-limit Lichess (1 req/vez, 429→≥1min); AGPL; **sem promessa de rating**; sem
  engine.

## 3. Decisões já travadas (use, não re-decida)

- **Sync (P4):** Cloudflare Workers + D1. Login = **Entrar com Lichess** (identidade via OAuth, sem
  escopo de jogo). Dados sobem **cifrados ponta-a-ponta** (chave derivada do login, NUNCA enviada ao
  servidor). **Backend: construir + testar LOCAL** (wrangler/miniflare) — não provisionar. Escrever
  `DEPLOY-BACKEND.md` para o dono provisionar.
- **Comunidade (P5):** rename via **constante única `APP_NAME`** (crie-a numa config, ex.
  `src/app/appName.ts`, e roteie TODO uso de nome público por ela). Placeholder `'Rotina'` — o dono
  fornecerá o nome final; deixe um único ponto de troca + TODO. Disclaimers de não-afiliação, AGPL à
  mostra, doação = link externo.
- **Deploy:** só commits. **Não deployar.**

## 4. Loop por milestone

Para cada Mi (começando em M1):
1. Releia o escopo de Mi em `docs/review/roadmap-beta-2026-06-16.md`.
2. Planeje em tarefas pequenas e verificáveis (TodoWrite/lista interna).
3. Implemente. Para bugs, TDD (teste falhando → fix → verde).
4. **Protocolo de QA (obrigatório antes de fechar Mi):**
   a. `npm run lint && npm test && npm run build` verdes; `npm run coverage` ≥ thresholds;
      `npm run smoke:pwa` verde (quando aplicável).
   b. **E2E com prints:** rode a suíte Playwright; gere/atualize screenshots dos fluxos que Mi tocou;
      salve em `e2e/__screenshots__/` e cite os caminhos no commit.
   c. **Jogar o fluxo:** dirija o app real (Playwright headed ou dev server na porta 5173) pelo caminho
      alterado — onboarding→Hoje, iniciar bloco→timer→completar→feedback→log, reconciliar puzzles,
      backup export/import — e confira o resultado nos prints. Regressão → corrija ANTES de avançar.
   d. **Caça-bug do milestone:** revisão adversarial do diff; corrija reais.
5. Commit(s) atômico(s). Atualize `DECISIONS.md` e o relatório de progresso.
6. Só então passe para M(i+1).

Se um milestone ficar grande, quebre em sub-commits, cada um com gate verde. Se travar de verdade num
ponto (ex.: precisa de credencial de nuvem para M12), **registre em `DECISIONS.md`, faça o que dá local
e pule a parte bloqueada**, seguindo para o próximo item executável. Nunca pare a noite.

## 5. Foco da Fase A (faça primeiro, é a fundação)

Front-load qualidade. Ordem: **M1** (harness E2E com prints) → **M2** (teste unitário profundo: 5 hooks
+ resourceSelector + os módulos sem cobertura) → **M3** (bugs reais da auditoria: `addDays` GMT-3 [TDD],
double-count, race condition do sync, `clearAllData` in-flight, `getEvidenceLevel`, `observedAt`,
backup completo 16 tabelas + `migrateBackup`, validação de import) → **M4** (hardening de segurança por
agente fresco). Só depois entre na Fase B (pedagogia), começando por **M5 — o diagnóstico mudo do
Chess.com (294 sinais → 0 fraquezas), que é a queixa central do dono.**

## 6. Bugs/lacunas conhecidos (da auditoria — endereçar onde o milestone manda)

`detectWeaknesses` mudo p/ Chess.com (M5); `addDays`/`setDate` off-by-one GMT-3 (M3, TDD);
`computeMastery`/`progress-diplomas` desconectados (M6); race `runDiagnosisSync` (M3); `buildPuzzle
ThemeStats` double-count (M3); `clearAllData` in-flight (M3); backup 10/16 tabelas + sem migração (M3);
5 hooks + `resourceSelector` + `learningPlanProposal`/`getEvidenceLevel` sem teste (M2);
`observedAt` Chess.com end_time (M3/M5); strings sem acento em `puzzleWeaknessTitle` (M8); `avoidWhen`
ignorado (M8); runtime-cache de arte + Retry-After (M4).

## 7. Backend (P4) — limites rígidos

- Crie o código do worker + schema D1 + testes que rodam em **miniflare/wrangler local**.
- API: `push(blobCifrado)`, `pull()`, autenticadas por identidade Lichess (valide o token do usuário
  contra a API do Lichess; escopo mínimo de identidade; **não** peça escopo de jogo).
- O servidor guarda **apenas blobs cifrados** (não consegue ler). Cifragem/decifragem só no cliente
  (M13). Tokens OAuth **nunca** entram no blob.
- **NÃO** rode `wrangler deploy`, **NÃO** crie conta Cloudflare, **NÃO** configure secrets de produção.
  Entregue `DEPLOY-BACKEND.md` com o passo-a-passo para o dono provisionar e fazer o deploy.

## 8. Relatório final (de manhã)

Ao parar (noite acabou ou bloqueio total), escreva `docs/review/relatorio-overnight-2026-06-17.md` com:
milestones concluídos e em que ponto parou; lista de commits; resultados dos gates (test/lint/build/
coverage/smoke) com números; screenshots gerados (caminhos); bugs corrigidos (com o teste que os pega);
conteúdo de `DECISIONS.md` (suposições adotadas); riscos remanescentes; e o que falta para o próximo Mi.
**Não deployar.** Deixe tudo commitado e verde.

---

### Resumo de uma linha
Vá de M1 a M15 em ordem, gate verde + E2E com prints + jogar o fluxo + corrigir antes de avançar, sem
parar, sem deployar, sem provisionar nuvem, registrando suposições em `DECISIONS.md`; comece pela Fase A
e pelo diagnóstico mudo do Chess.com; pare num milestone verde e escreva o relatório.
