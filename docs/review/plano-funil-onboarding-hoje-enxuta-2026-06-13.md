# Plano — Funil de onboarding + tela Hoje enxuta (2026-06-13)

Status: **PROPOSTA para avaliação** (nada implementado ainda).
Modelo recomendado p/ executar: Sonnet 4.6 nas fases mecânicas; Opus/Fable nas decisões de copy/UX.

## Objetivo (pedido do dono)

1. **Onboarding como funil**: uma tela por vez, só a opção necessária —
   Boas-vindas → Configurar (Lichess + Chess.com + faixa + tempo) → Aprovar plano → cai no **Hoje**. Aparece só na primeira vez.
2. **Tela Hoje enxuta**: hoje é "kilômetros de scroll". A principal deve ser
   **botões que expandem** (dobras), com o **mínimo sempre visível**.

---

## Phase 0 — Descoberta (concluída)

Estado real do código hoje (verificado nesta sessão):

- **`App.tsx`** roteia por `activeView: 'today' | 'progress' | 'config'` (useState local, default `'today'`, **não persiste** — reseta a cada load) + gate de Welcome:
  - `shouldShowWelcome = profile === undefined && !wantsManualSetup`
  - `activeView = profile === undefined ? 'config' : appState.activeView`
  - Welcome: `onStart` = `saveProfile(createDefaultProfile())`; `onConfigure` = `setWantsManualSetup(true)`.
  - Há **dois caminhos** hoje: "Começar agora" (perfil default instantâneo) e "Ajustar antes" (Config completa). É ramificado, não um funil.
- **`useAppState`** expõe: `profile`, `todayPlan`, `activeView`, `setActiveView`, `loadState` ('loading'|'ready'|'error'), `saveProfile`, `approveLearningPlan`, `regeneratePlan`, etc. Aprovação do plano é lida via `todayPlan.learningPlanResponse?.status === 'approved'`.
- **Plano diário** novo nasce com `learningPlanResponse === undefined` → todo dia o plano começa "não aprovado". (Por isso o funil **não** pode depender só disso, senão reapareceria todo dia.)
- **Vários `setActiveView('config')`** espalhados em `state.ts` (erros/sync que exigem config) — a lógica do funil precisa conviver com isso.
- **Config.tsx** já está em Folds (Essencial aberto; Avaliação/Lichess/Dados fechados). Tem prop `onBack` quando `profile === undefined`.
- **Today.tsx** sempre-aberto hoje: header (data) + barra de progresso + `day-stats` (números) + **TutorCard longo** + **card de proposta** (quando não aprovado) + **pendências** + **hero** ("Próximo passo"); e dobras: Plano do dia, Metas da fase, Mapa da jornada, Sua semana, O que seus jogos revelam, Próximos passos, Sincronizar e estudar, Plano-de-hoje-aprovado.
- **`LearningPlanProposalCard`** já colapsa para dobra compacta quando aprovado (It.15).
- **`Fold.tsx`** controlado: `useState(defaultOpen)` + `onToggle`. Filhos sempre no DOM (testes acham texto em dobra fechada).
- **Testes (370, vitest)**: `trainingFlow.test.tsx` faz `beforeEach → saveProfile(profile)` (perfil semeado, pula Welcome) e depois interage com Today (Concluir, "Aprovar plano", "Sincronizar e estudar"...). `smoke.test.tsx` fixa strings da Welcome. **Risco central**: com o funil, perfil semeado sem "onboarding concluído" cairia no passo "Aprovar plano", não no Hoje → quebraria a maioria dos testes de fluxo. Mitigação: flag persistida + semente atualizada (Phase 1).

---

## Decisão de arquitetura — máquina de estados do funil

O funil é **derivado**, com UMA flag persistida nova (`onboardingCompletedAt`):

```
boot →
  loadState === 'loading'              → tela de carregamento (já existe)
  onboardingCompletedAt !== undefined  → APP PRINCIPAL (Hoje/Progresso/Config, com nav)
  senão (primeira vez): FUNIL, sem nav, um passo por tela:
    profile === undefined && !startedSetup → Passo 1: Boas-vindas
    profile === undefined &&  startedSetup → Passo 2: Configuração essencial
    profile !== undefined  && plano não aprovado → Passo 3: Aprovar plano
    profile !== undefined  && plano aprovado      → marca onboardingCompletedAt → APP PRINCIPAL
```

- `startedSetup`: estado **local** (não persiste) — só distingue Boas-vindas de Config dentro da primeira sessão. Substitui o atual `wantsManualSetup`.
- `onboardingCompletedAt`: **persistido** (Dexie). Garante que (a) reabrir o app vai direto pro Hoje; (b) **aprovação diária** depois do 1º dia continua sendo a dobra compacta dentro do Hoje (não volta pro funil); (c) revisar plano não re-dispara o funil.
- **Nav (Hoje/Progresso/Config) escondida durante o funil** — senão o aluno escapa pelas abas e quebra o "uma tela por vez".

Por que flag persistida e não derivar de "tem log de treino"? Porque é robusto a restore de backup e a planos diários novos, e é 1 campo isolado.

---

## Phase 1 — Persistir conclusão do onboarding (base, invisível)

**O que implementar (copiar o padrão de `backupMeta`/auto-backup já existente em `appData.ts`):**
1. Novo registro de meta em Dexie (ex.: store `appMeta` ou reusar tabela de settings existente) com `onboardingCompletedAt?: string`.
2. `appData.ts`: `loadOnboardingCompletedAt()` / `saveOnboardingCompletedAt(iso)` (espelhar `loadBackupMeta`/`saveBackupMeta`).
3. `state.ts`: expor `onboardingCompletedAt` no `useAppState` + callback `completeOnboarding()` que grava `new Date().toISOString()` e seta em memória. Incluir no `exportBackup`/`importBackup`/`clearAllData` (consistência com as outras metas).
4. **Semente de teste**: criar helper `markOnboardingComplete()` e chamá-lo no `beforeEach` de `trainingFlow.test.tsx` (e onde mais semeia perfil) para os testes de fluxo continuarem caindo no Hoje.

**Verificação:** teste unitário do load/save da meta; `npx vitest run` verde (370 + novos), `tsc` limpo.
**Anti-padrão:** não criar flag em `localStorage` (tudo é Dexie/local-first aqui); não inferir conclusão de heurística frágil.

---

## Phase 2 — Orquestração do funil em `App.tsx`

**O que implementar:**
1. Derivar `onboardingStep` (`'welcome' | 'setup' | 'plan' | 'done'`) com a máquina acima.
2. Renderização condicional **sem nav** quando `step !== 'done'`:
   - `welcome` → `Welcome` (Passo 1, ver Phase 3 p/ copy).
   - `setup` → novo `<EssentialSetup>` (Passo 2, ver Phase 4).
   - `plan` → novo wrapper `<PlanApprovalStep>` reusando `LearningPlanProposalCard` em tela cheia; ao aprovar, chama `approveLearningPlan()` **e** `completeOnboarding()`.
   - `done` → app atual com nav (Hoje/Progresso/Config).
3. **Foco gerenciado** entre passos (mover foco ao `<h1>` do passo; `aria-live` na transição) — acessibilidade.
4. **Voltar um passo** (Config ← Boas-vindas) sem ficar preso. Sem pular passos pra frente.
5. Remover `wantsManualSetup`; conviver com os `setActiveView('config')` internos (só têm efeito quando `step==='done'`).

**Verificação:** novos testes de funil (caminha Boas-vindas→Config→Salvar→Aprovar→Hoje; reabrir = Hoje direto). Atualizar `smoke.test.tsx`. `tsc` + `vitest` verdes. Screenshots dos 3 passos (mobile claro/escuro).
**Anti-padrão:** não duplicar lógica de view; não deixar nav visível no funil.

---

## Phase 3 — Passo 1 (Boas-vindas) enxuto

**O que implementar:** ajustar `Welcome.tsx` para o funil: 1 ação primária **"Vamos configurar"** (avança p/ Passo 2) + 1 link discreto **"Começar rápido"** (salva `createDefaultProfile()`, pula direto pro Passo 3 — preserva quem quer velocidade, atende "não irritar"). Manter o retrato/escrivaninha. Atualizar strings fixadas em `smoke.test.tsx`.
**Verificação:** smoke test atualizado; screenshot.

---

## Phase 4 — Passo 2 (Configuração essencial) + extração `EssentialProfileForm`

**O que implementar:**
1. Extrair os campos essenciais de `Config.tsx` (usuário Lichess, usuário Chess.com, faixa, tempo padrão, botão Salvar) para `<EssentialProfileForm>` reutilizável.
2. Usar em **dois lugares** (DRY): o Passo 2 do funil **e** a dobra "Essencial" da Config (tab). Campos já vêm pré-preenchidos (defaults atuais) → "Salvar" em 1 toque.
3. Passo 2 mostra só esses campos + Salvar (importar Lichess/Chess.com na mesma tela, como pedido). Conexão OAuth do Lichess, backup e avaliação **não** entram no funil — ficam na Config-tab depois.
4. Ao Salvar: `saveProfile` → gera plano → avança p/ Passo 3.

**Verificação:** Config-tab continua funcionando (Essencial usa o componente novo); testes de Config verdes; screenshot do Passo 2.
**Anti-padrão:** não recriar a Config inteira no funil; não duplicar markup dos campos.

---

## Phase 5 — Tela Hoje enxuta (o ponto do "kilômetros de scroll")

**Regra:** sempre-aberto = só o indispensável para agir hoje. Resto = dobra fechada.

**SEMPRE visível (topo, curto):**
- Cabeçalho compacto: data + **barra de progresso do dia** + `day-stats` (números).
- **Uma linha** do Professor (saudação curta), não o card inteiro.
- **Hero "Próximo passo"** (ou "Dia completo") — a ação única.
- **Pendências de hoje** só quando existem (já retorna null quando não há) — ação exigida.

**Dobrado (fechado por padrão, já são Fold ou viram):**
- "Recado do professor" (o conteúdo longo do TutorCard: diagnóstico/mensagem) — **novo**: hoje está sempre aberto.
- Plano do dia, Metas da fase, Mapa da jornada, Sua semana, O que seus jogos revelam, Sincronizar e estudar, Plano-de-hoje (aprovado).
- "Próxima sessão" (Tempo + Importar atividade) → dobra ou rodapé discreto.

**O que implementar:** reduzir o `TutorCard` sempre-aberto a uma saudação de 1 linha + mover o resto para uma dobra `concept="..."`; envolver `next-session` numa dobra; confirmar que tudo abaixo do hero está fechado ao abrir. Medir: a tela inicial deve caber em ~1–1,5 rolagens no celular.

**Verificação:** screenshot mobile do Hoje "ao abrir" (provar a redução de scroll vs print atual); Today.test.tsx verde; abrir/fechar cada dobra.
**Anti-padrão:** não esconder a ação principal; pendências não podem ficar enterradas.

---

## Phase 6 — Verificação final + deploy

1. `tsc --noEmit` limpo; `vitest run` verde (370 + novos de funil).
2. `vite build` ok.
3. Screenshots: 3 passos do funil + Hoje enxuto + Progresso/Config, em mobile claro/escuro e desktop.
4. Conferir acessibilidade: foco entre passos, nav escondida no funil, `aria-live`.
5. Deploy prebuilt (`vercel build --prod` + `vercel deploy --prebuilt --prod`) + `scripts/check-prod.mjs`.
6. Atualizar memória (project-vision) + relatório final.

---

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Funil irrita quem quer começar rápido | Link "Começar rápido" no Passo 1 (perfil default → Passo 3); campos pré-preenchidos (Salvar em 1 toque) |
| Funil reaparece todo dia (plano diário nasce não-aprovado) | Flag persistida `onboardingCompletedAt` — funil é só 1ª vez; aprovação diária segue como dobra no Hoje |
| Quebra dos ~370 testes (semeiam perfil, cairiam no Passo 3) | Phase 1 primeiro: helper `markOnboardingComplete()` no `beforeEach` |
| Strings fixadas (Welcome, Aprovar plano) | Atualizar smoke/flow nos passos certos |
| Acessibilidade (passos forçados) | Foco gerenciado, `aria-live`, voltar 1 passo, nav escondida só no funil |
| `setActiveView('config')` interno conflitar com funil | Só afeta quando `step==='done'`; no funil o roteamento é por `step` |
| Esconder demais no Hoje (descoberta) | Pendências e hero sempre visíveis; dobras têm selo+título+número (rótulo claro) |

---

## Decisões TRAVADAS (aprovadas pelo dono 2026-06-13)

1. **"Começar rápido" no Passo 1** — SIM, link discreto: cria perfil padrão e pula para o Passo 3 (Aprovar plano).
2. **Funil só na 1ª vez** — SIM. Aprovação dos planos seguintes segue como a dobra compacta dentro do Hoje.
3. **Professor no Hoje** — **MANTER o card aberto** (não dobrar). O enxugamento do Hoje vem de dobrar todo o resto abaixo do hero, não o professor.
4. **Indicador "Passo 1 de 3"** — SIM, sutil, no topo de cada passo do funil.
5. **Esconder abas (Hoje/Progresso/Config) durante o funil** — SIM. Aparecem só ao cair no Hoje.

Impacto na Phase 5: como o card do professor fica aberto, o sempre-visível do Hoje = cabeçalho (data+progresso+números) + **card do professor** + hero "Próximo passo" + pendências-se-houver. Todo o resto (plano do dia, metas, jornada, semana, jogos revelam, sincronizar, plano aprovado, próxima sessão) fica em dobra fechada.
