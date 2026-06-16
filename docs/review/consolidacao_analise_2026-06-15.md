# Consolidação da Análise — lichess-tutor / "Rotina" (Diretor, 2026-06-15)

> Pacote de decisão, não resumo. Quatro auditorias 360° de hoje foram julgadas contra o **código real**
> (li os arquivos e **rodei os gates**). Relatório que contradiz o código perde. Onde derrubei um
> revisor, a prova está em `arquivo:linha`. Diretor: Claude Opus 4.8.

---

## 0. Veredito executivo

O app está **sólido e entregável para uso pessoal**, melhor do que minha própria auditoria sugeriu e
pior do que os relatórios mais generosos (Gemini 8.1 / Codex 8.0) afirmaram. A divergência decisiva foi
resolvida na fonte: **os 409 testes passam (rodei `npm run test` → exit 0)** — portanto todo o bloco de
achados "Crítico/Alto: teste X falha" do DeepSeek e o "1 teste falhou" do Gemini são **falsos contra o
HEAD atual** (a memória confirma que o flake do `preserveProgress` foi corrigido hoje). Isso recalibra
para baixo a confiança nesses dois revisores e derruba ~6 dos achados de maior severidade do conjunto.

**Nota global do diretor: 7,2 / 10** — "sólido com débitos concentrados e de baixo esforço". Não é
média (média seria 7,6); ponderei por evidência: penalizei Processo/Segurança porque os relatórios
otimistas ignoraram fatos verificados (ausência de CI; PII real no bundle), e elevei Testes acima do
DeepSeek porque a suíte de fato passa.

**As 5 decisões mais importantes (detalhe nas seções 5–6):**
1. **ACEITAR e corrigir já:** usernames reais do dono no bundle de produção (`state.ts:1289-1290`). É o único achado com cara de segurança/privacidade real. Esforço P. — Exec, até 2026-06-16.
2. **ACEITAR:** criar CI mínimo (lint+test+build). Consenso dos 4, verificado (`.github/workflows` não existe). Maior ROI do backlog. — Exec, até 2026-06-17.
3. **ACEITAR:** atomicidade/durabilidade do par log↔plano (`state.ts:1065`) + validação estrita de import de backup (`appData.ts:424`). — Exec, até 2026-06-18.
4. **DONO DECIDE (produto/pedagogia):** ligar ou remover `computeMastery` (código morto confirmado) e a ponte puzzle→fraqueza. Define o "pronto" pedagógico.
5. **REJEITAR (falsos/over-engineering):** "testes quebrados", "sem dark mode", "mutação em `applyAdaptiveReviewRatio`" — todos refutados por código (Apêndice).

---

## 1. Notas finais por área

Diretor ≠ média. Coluna "Diretor" justificada por evidência verificada.

| Área | Gemini | DeepSeek | Codex | Claude | **Diretor** | Justificativa do diretor (evidência) |
|---|:--:|:--:|:--:|:--:|:--:|---|
| Correção & Bugs | 7,5 | 6 | 8,2 | 6,5 | **7,0** | Suíte verde (rodei); bugs reais são durabilidade não-atômica (`state.ts:1065`) e falha silenciosa (`:563`), não os "testes quebrados" do DeepSeek (falsos). |
| Qualidade de código | 8,0 | 8 | 7,4 | 7,5 | **7,5** | TS estrito + domínio puro; penalizado por God-hook `state.ts` (1.296 ln, lido) e duplicação `:381/:460`. |
| Arquitetura | 8,0 | 9 | 7,8 | 7,0 | **7,5** | Camadas limpas verificadas por lint; o 9 do DeepSeek ignora a concentração em `useAppState`. |
| Domínio / Pedagogia | 7,5 | 7 | 8,0 | 6,5 | **6,5** | `computeMastery` morto (confirmado), detecção de fraqueza rasa (`detectWeaknesses.ts:107`), puzzle≠fraqueza. O fluxo funciona, mas o "cérebro" adaptativo está parcialmente desligado. |
| Dados & Estado | 8,5 | 7 | 8,1 | 7,5 | **7,5** | Export transacional e schema v11 ótimos; import valida pouco (`appData.ts:424`, confirmado). 8,5 é generoso. |
| Testes & QA | 7,8 | 6 | 8,4 | 7,0 | **7,5** | 409 verdes de boa qualidade; sem cobertura medida, `state.ts`/UI sem teste direto. DeepSeek 6 baseado em falhas inexistentes. |
| Documentação & Memória | 8,5 | 9 | 7,1 | 8,0 | **7,5** | Memória viva excelente; **30 relatórios em `docs/review` sem índice** + drift documental (Codex A6) puxam para baixo. |
| Processo & Tooling | 8,0 | 6 | 7,0 | 4,0 | **5,0** | Sem CI, sem pre-commit, Playwright morto, pinagem inconsistente — fatos. Gemini 8,0 é insustentável. |
| Visual & Design | 9,0 | 9 | 8,6 | 8,0 | **8,0** | Identidade coesa real; arte SVG provisória por decisão do dono (não penalizar). |
| UX | 8,0 | 8 | 8,0 | 7,5 | **7,5** | Hero "Agora" + números visíveis (bom p/ TDAH); onboarding não cobre OAuth (`Onboarding.tsx`, confirmado obs 5374). |
| UI | 9,0 | 8 | 8,5 | 7,0 | **7,5** | Boa, mas `window.confirm` sobreviveu no restore (`Config.tsx:95`); 9,0 ignora inconsistências. |
| Conteúdo & Comunicação | 8,5 | 8 | 8,4 | 8,0 | **8,0** | pt-BR firme, sem promessa de rating; só slug técnico vaza (`Progress.tsx:236`). |
| Plataforma & Performance | 8,8 | 9 | 7,6 | 7,0 | **7,5** | PWA limpa, JS ~165 kB gzip (medido); sem smoke offline em prod. 8,8/9 otimistas. |
| Acessibilidade & i18n | 8,0 | **3** | 7,5 | 6,5 | **6,5** | DeepSeek 3 parte de premissa **falsa** ("sem dark mode" — existe em `index.css:1920`). Bases boas, faltam `aria-current` e alvos de radio. |
| Segurança & Privacidade | 9,2 | 8 | 7,8 | 6,5 | **6,5** | PKCE S256 correto, mas **PII real no bundle** + import frágil. 9,2 é internamente inconsistente (o próprio Gemini citou os usernames). |
| Build, Release & Operação | 8,0 | 6 | 7,0 | 6,0 | **6,0** | manualChunks bom; sem sourcemap, sem versão semântica, deploy manual. |

---

## 2. Matriz de achados (consolidada, com veredito por código)

Severidade/esforço são do diretor (reconciliados). Veredito = o que o código provou.

| # | Achado | Quem apontou | Evidência (file:line) | Veredito | Sev × Esf |
|---|---|---|---|---|---|
| 1 | Usernames reais do dono no bundle/onboarding | Gemini(Baixo), Claude(Alto) | `state.ts:1289-1290` (raiz) → `Config.tsx:61` | **CONFIRMADO** (li) | Alto × P |
| 2 | Escrita não-atômica log↔plano | Claude | `state.ts:1065` (saveTrainingLog + savePlan sem transação) | **CONFIRMADO** | Alto × M |
| 3 | Auto-sync em `void IIFE` engole erro | DeepSeek, Claude | `state.ts:563-573` | **CONFIRMADO** | Médio × P |
| 4 | `computeMastery` é código morto | Gemini, Claude | `mastery.ts:9` (sem chamada fora de teste) | **CONFIRMADO** | Alto × M |
| 5 | Diagnóstico de puzzle não alimenta detector de fraqueza | Claude | `detectWeaknesses.ts:107` vs `diagnosis.ts:107` | **CONFIRMADO** | Alto × G |
| 6 | Proxy `accuracy<70` = "blunder" (Chess.com) | Claude | `extractSignals.ts:241` | **CONFIRMADO** | Alto × M |
| 7 | Recência Chess.com vira "diagnóstico recente" falso | Codex | `chesscomClient.ts:45-63` + `detectWeaknesses.ts:34-50` | **CONFIRMADO (parcial)** | Médio × P |
| 8 | Import de backup valida poucos campos | Codex(A2), Claude | `appData.ts:424` | **CONFIRMADO** | Alto × M |
| 9 | Sem allowlist defensiva p/ URLs de backup | Codex(A2) | `backup.ts:119-211` + `externalOpen.ts` | **CONFIRMADO** | Médio × M |
| 10 | Sem CI/CD | Gemini, DeepSeek, Codex, Claude | `.github/workflows` ausente | **CONFIRMADO** | Alto × M |
| 11 | God-hook `state.ts` (~1.296 ln) | Gemini, DeepSeek, Codex, Claude | `state.ts` inteiro | **CONFIRMADO** | Médio × G |
| 12 | Duplicação `runChesscomSync`/`runLichessSync` | DeepSeek, Claude | `state.ts:381` e `:460` | **CONFIRMADO** | Alto × M |
| 13 | `window.confirm` no restore de backup | Gemini(implícito), Claude | `Config.tsx:95` | **CONFIRMADO** | Médio × P |
| 14 | nav-buttons sem `aria-current` | Claude | `App.tsx:143/151/159` | **CONFIRMADO** | Médio × P |
| 15 | Radios < 44px no mobile | Claude | `PlacementCard`/`index.css:2391` | **CONFIRMADO** | Alto(a11y) × P |
| 16 | Slug técnico de fraqueza exposto | Claude | `Progress.tsx:236` (vs `formatWeaknessTag` em `Today.tsx:745`) | **CONFIRMADO** | Médio × P |
| 17 | Playwright dep morta | Claude | `package.json` (sem `playwright.config`) | **CONFIRMADO** | Médio × P |
| 18 | Sem `default`/`assertNever` em switches de `kind` | DeepSeek(Alto) | `generatePlan.ts:304`, `:349` | **PARCIAL** (TS strict cobre; nicety) | Baixo × P |
| 19 | Headers de segurança de deploy mínimos | Codex(A4) | `vercel.json:3-12` | **CONFIRMADO** (relevante só em P5) | Baixo × P |
| 20 | `persist()` pedido cedo demais | Codex(A5) | `state.ts:233` + `persistence.ts:19` | **CONFIRMADO** | Baixo × P |
| 21 | Onboarding não cobre OAuth Lichess | Gemini, Claude | `Onboarding.tsx` | **CONFIRMADO** (obs 5374) | Médio × P |
| 22 | Hero/proposal abaixo da dobra no mobile | Gemini, Claude | `Today.tsx:274` | **PARCIAL** (depende de viewport; conf. média) | Médio × M |
| — | "Testes quebrados" (5+ achados) | DeepSeek, Gemini | `trainingFlow.test.tsx`, `preserveProgress.test.tsx` | **FALSO** (rodei: 409 ✓) | rejeitado |
| — | "Sem dark mode / a11y 3" | DeepSeek | `index.css:74` | **FALSO** (dark em `:1920`) | rejeitado |
| — | "`applyAdaptiveReviewRatio` muta in-place" | DeepSeek | `generatePlan.ts:250-276` | **FALSO** (`.map` puro) | rejeitado |

---

## 3. Divergências resolvidas (com código)

**D1 — A suíte passa ou falha? (a divergência mais cara).**
DeepSeek listou 5 achados Alto ("Treinando há" não aparece, "Dia concluído" ausente, timeout no feedback
Difícil, "Feito" ausente, botão "Concluir" sumido) e Gemini disse "408 passaram, 1 falhou". **Rodei
`npm run test` nesta sessão: 409 passed / 59 files, exit 0.** A memória (obs 6114-6117) registra que o
flake do `preserveProgress` foi corrigido hoje via stub de `fetch`. **Veredito: tests verdes; esses
achados são falsos contra o HEAD atual.** Hipótese benigna: DeepSeek/Gemini rodaram antes do fix de
hoje — mas a fonte da verdade é o código atual. Quem estava certo: **Codex e Claude** ("409 passando").

**D2 — Existe dark mode? (Acessibilidade 3 vs 8).**
DeepSeek: "`index.css:74 color-scheme: light` fixo — sem dark mode" → nota 3. Gemini: "dark mode nativo".
`index.css:1920` tem `@media (prefers-color-scheme: dark) { … }` e `:1980 color-scheme: dark`. **Dark
mode existe.** DeepSeek leu só a linha 74 e parou. Quem estava certo: **Gemini**. A nota 3 do DeepSeek
está contaminada por premissa falsa; a a11y real é ~6,5 (faltam `aria-current` e alvos de radio, reais).

**D3 — `applyAdaptiveReviewRatio` é impuro? (Alto vs elogio).**
DeepSeek: "muta array in-place, `kind` inconsistente com o ID" (Alto). `generatePlan.ts:265` usa
`budget.map(...)` retornando `{ ...block, kind: 'revisao' }` — **função pura, sem mutação**, e os IDs dos
blocos são criados depois (em `createPlanBlock`), então não há inconsistência de ID. Quem estava certo:
**Claude** (que elogiou). DeepSeek **falso**.

**D4 — Switch sem `default` é bug Alto? (DeepSeek solo).**
`getBlockCopy` (`:304`) e `getResourceStage` (`:349`) cobrem os 5 `PlanBlockKind`. Sem `default`, o TS
estrito **erra em compilação** se um 6º kind for adicionado sem tratar — não "retorna undefined
silenciosamente" em produção. **Veredito parcial:** vale adicionar `assertNever` como rede defensiva,
mas é **Baixo**, não Alto. DeepSeek **over-graded**.

**D5 — Severidade do leak de username (Baixo vs Alto).**
Gemini: Baixo. Claude: Alto. `state.ts:1289-1290` põe `'jukasparov'`/`'jukatavares'` em
`createDefaultProfile`, que é o fallback de `Config.tsx:61` para novo usuário e vai no bundle de produção
(verifiquei em `dist/`). É PII real + risco de sync de dados de terceiros. **Diretor decide: Alto.**

**D6 — Conflito docs vs testes sobre links de Study no backup (Codex auto-sinalizou).**
Codex apontou que `privacy-and-data.md` se contradiz, mas `appData.test.ts:441-459` prova que links de
Study **entram** no backup. **Veredito: o código/teste está certo; a documentação está desatualizada.**
Ação é corrigir o doc, não o código.

---

## 4. Qualidade dos revisores (calibração para o futuro)

| Revisor | Nota global que deu | Qualidade (diretor) | Por quê |
|---|:--:|:--:|---|
| **Codex** | 8,0 | **8,0** | Melhor ancoragem em `file:line`; achados reais e originais (recência Chess.com, allowlist de backup, headers de deploy, drift documental); honesto (auto-sinalizou contradição). Falha: não marcou nada Crítico e **não pegou o leak de username**. Peso futuro: **alto**. |
| **Claude (auto)** | 7,0 | **8,0** | Rodou gates, verificou achados à mão, corrigiu o próprio subagente (rebaixou `Fold`), pegou o leak (Alto), `computeMastery` morto, rótulo SM-2. Falha: não pegou recência Chess.com nem o hardening de switch. *Auto-avaliação — desconto por conflito de interesse aplicado.* Peso: **alto**. |
| **Gemini 3.5 Flash** | 8,1 | **6,0** | Acertou dark mode e `computeMastery`; estrutura boa. Mas **alucinou 1 falha de teste**, deu notas infladas (9,2 em Segurança **com** o leak que ele mesmo citou — inconsistência interna), sub-graduou o leak para Baixo, vários achados sem prova de grep. Peso futuro: **médio-baixo; reverificar afirmações fortes**. |
| **DeepSeek** | 7,4 | **5,0** | Trouve insights solo reais (auto-sync sem `.catch`, ideia do `assertNever`, duplicação `state.ts` com linhas certas). Mas **a maioria dos seus achados Crítico/Alto é falsa**: 5 "testes quebrados" (passam) e a11y 3/10 sobre "sem dark mode" (existe). Alta taxa de falso-positivo justo onde mais pesa. Peso futuro: **baixo nos High; minerar só os Médios/Baixos**. |

Calibração: **consenso entre Gemini+DeepSeek não é prova** — ambos erraram juntos sobre os testes.
Codex (sozinho) acertou a recência do Chess.com. Minoria com `file:line` venceu maioria sem execução.

---

## 5. Backlog priorizado (ordenado por severidade × impacto ÷ esforço)

Dono: **Exec** = implementação guiada (Sonnet 4.6); **Dono** = Juka (decisão de produto); **Diretor** =
Claude Opus (desenho/decisão técnica). Prazos relativos a 2026-06-15.

**Corte J1 — Higiene & Segurança (esforço P, alto ROI) — Exec, até 2026-06-16**
1. Trocar usernames hardcoded por `undefined` (`state.ts:1289-1290`); manter reais só em `*.test.*`. *(Apêndice: gate de PII no bundle.)*
2. Remover `playwright` morto do `package.json` (ou adicionar `playwright.config.ts` + smoke).
3. `aria-current="page"` nos nav-buttons (`App.tsx`).
4. `window.confirm` → confirmação inline no restore (`Config.tsx:95`), padrão do `confirmingClear`.
5. Reutilizar `formatWeaknessTag` no `Progress.tsx:236`.
6. `min-height:44px` nos radios do PlacementCard (CSS mobile).
7. `build.sourcemap:true` + `__APP_VERSION__` via `define` (`vite.config.ts`).
8. Hint de OAuth no `Onboarding.tsx` (passo Lichess).

**Corte J2 — CI & Gate (esforço M) — Diretor desenha + Exec, até 2026-06-17**
9. GitHub Action: `npm ci && npm run lint && npm run test && npm run build` em push/PR (`main`+`master`).
10. (Opcional) pre-commit husky + lint-staged.

**Corte J3 — Durabilidade de dados (esforço M) — Exec, até 2026-06-18**
11. Transação Dexie no par log↔plano (`state.ts:1065`).
12. Validação estrita de import de backup — PK + tipos por tabela (`appData.ts:424`).
13. Auto-sync com `Promise.allSettled` + log de erro por fonte (`state.ts:563`).
14. Boot: mover auto-backup para depois da carga do perfil (`state.ts:199`).

**Corte J4 — Pedagogia adaptativa (esforço M/G, exige decisão do Dono — ver §6) — após aprovação**
15. Ligar `computeMastery` ao fluxo de conclusão **ou** removê-lo (`mastery.ts:9`).
16. Ponte puzzle→fraqueza: mapear `weakThemes` → `WeaknessTag` como sinal `manual` (`detectWeaknesses.ts:107`).
17. Corrigir proxy de accuracy Chess.com (`extractSignals.ts:241`) + recência (`chesscomClient.ts:45`).

**Corte J5 — Refatoração & débito (quando houver fôlego) — Diretor + Exec**
18. Extrair `runDiagnosisSync` (deduplica `:381/:460`).
19. Dividir `useAppState` em dados + ações.
20. `assertNever` nos switches de `kind` (`generatePlan.ts:304/349`).
21. Smoke PWA offline em produção + orçamento de bundle.
22. `docs/review/README.md` (índice) + `memory/4-decisoes-vigentes.md` + corrigir drift de `privacy-and-data.md`.

---

## 6. Decisões que exigem o dono do produto (pacote único de aprovação)

Responda de uma vez; cada "sim/não" destrava um corte.

1. **`computeMastery` (D4 pedagógico):** ligar ao fluxo de conclusão de bloco (usa accuracy de puzzle reconciliada do Lichess, com latência assíncrona) **ou** remover e marcar como futuro? — *destrava J4 item 15.*
2. **Ponte puzzle→fraqueza:** autorizo conectar o diagnóstico de puzzles ao detector de fraquezas (o tutor passa a "ver" temas táticos além de blunder/tempo/abertura)? É o maior ganho pedagógico, esforço G. — *J4 item 16.*
3. **Proxy de accuracy Chess.com:** remover `accuracy<70 = blunder` ou recalibrar por banda? Hoje pode inflar o diagnóstico de iniciantes. — *J4 item 17.*
4. **Bloco `final` de 60 min sempre `endgame-pawn`:** intencional (finais sempre ajudam) ou parametrizar por banda? — *ajuste em `getBlockCopy`/`timeBudget`.*
5. **Quick Start com seus usernames:** confirmo a troca por vazio (novo usuário começa sem credenciais)? — *J1 item 1; é também privacidade.*
6. **CI + deploy:** aprovo um GitHub Action de gate agora, mantendo o deploy manual via prebuilt no Vercel? — *J2.*
7. **"Pronto" do release pessoal:** é J1+J2+J3 (higiene/CI/durabilidade) **ou** inclui J4 (pedagogia)? Define o marco.

---

## 7. Roadmap consolidado (fases longas até o release pessoal estável)

Gate objetivo entre fases: `npm run lint && npm run test && npm run build` verdes.

- **Fase A — Higiene + CI (1–2 dias):** Cortes J1 + J2. Gate: verde + Action rodando no push. Sem decisão de produto pendente — pode começar já.
- **Fase B — Durabilidade (1–2 dias):** Corte J3. Gate: verde + teste novo de transação log↔plano.
- **Fase C — Pedagogia adaptativa (2–3 dias):** Corte J4, **somente após** respostas 1–3 do §6. Gate: verde + testes de ponte puzzle→fraqueza.
- **Fase D — Refatoração/débito (oportunístico):** Corte J5. Gate: verde, sem regressão de bundle.

Sequência respeita o princípio do dono (fases longas, mínima interação): A e B não precisam do dono; só
C abre com o pacote §6 aprovado.

---

## 8. O que NÃO fazer (rejeitado, com motivo)

- **Não "consertar testes quebrados"** — não há testes quebrados (rodei: 409 ✓). Achado falso (DeepSeek/Gemini).
- **Não adicionar dark mode** — já existe (`index.css:1920`). Achado falso (DeepSeek).
- **Não reescrever `applyAdaptiveReviewRatio`** por "mutação" — é puro (`.map`). Achado falso (DeepSeek).
- **Não implementar SM-2 completo com ease-factor** — o sistema de 4 níveis basta para 0-1200; só renomeie o comentário enganoso (`pendingItems.ts:78`). YAGNI.
- **Não criptografar token OAuth em repouso** — local-first, usuário único, escopos mínimos; ROI baixo (o próprio Gemini concedeu).
- **Não descongelar P4 (sync/D1) nem P5 (comunidade)** — decisão travada 2026-06-06. Headers CSP (Codex A4) só importam quando P5 abrir → **adiar**.
- **Não adicionar i18n/l10n** — ferramenta pessoal pt-BR; escopo de P5.
- **Não perseguir % de cobertura cega** — os 409 testes comportamentais valem mais; priorizar extrair `state.ts` para testá-lo.

---

## Apêndice — achados refutados com prova (para não voltarem)

| Achado refutado | Quem | Prova (file:line / ação) | Por que é falso |
|---|---|---|---|
| "≥5 testes Alto falham" | DeepSeek | `npm run test` → 409 passed/59, exit 0 (rodado 2026-06-15) | Suíte verde; flake do `preserveProgress` já corrigido (obs 6114-6117). |
| "1 teste falhou (408/409)" | Gemini | idem | idem. |
| "Sem dark mode → a11y 3/10" | DeepSeek | `index.css:1920` `@media (prefers-color-scheme: dark)`, `:1980 color-scheme: dark` | Dark mode implementado; só leu a linha 74. |
| "`applyAdaptiveReviewRatio` muta in-place / ID inconsistente" | DeepSeek | `generatePlan.ts:265` usa `budget.map(b => ({...b, kind}))`; IDs criados depois em `createPlanBlock` | Função pura; sem mutação nem inconsistência de ID. |
| "Switch retorna `undefined` silenciosamente em produção (Alto)" | DeepSeek | `generatePlan.ts:304/349` cobrem os 5 kinds; TS estrito erra em compilação se faltar | Parcial: vale `assertNever` defensivo, mas é Baixo, não Alto. |
| "Segurança 9,2/10" | Gemini | `state.ts:1289` PII real no bundle; `appData.ts:424` import frágil | Inconsistente com os próprios achados; real ~6,5. |
| "Docs vs testes: backup não exporta links de Study" | (Codex auto-sinalizou) | `appData.test.ts:441-459` prova que links entram no backup | O doc está errado, não o código — corrigir doc. |

**Notas de honestidade/confiança:** "hero abaixo da dobra no mobile" (#22) fica **confiança média**
(análise estrutural, não medição em device). A auto-avaliação do revisor Claude tem conflito de
interesse declarado. A hipótese de que DeepSeek/Gemini rodaram um estado pré-fix é **plausível mas não
verificada** — irrelevante para a decisão, pois o veredito é contra o código atual. Tudo o mais marcado
"CONFIRMADO" foi lido diretamente no código nesta sessão.
