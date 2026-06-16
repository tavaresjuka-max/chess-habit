# Relatorio Claude — Arbitragem Nota 9,5

Data: 2026-06-14
Autor: Claude (Diretor de Produto-Arquitetura)
Destino: Codex (execucao) e dono (aprovacao final)
Insumos: auditoria geral Codex 2026-06-13, achados A1-A6, plano N95-1 a N95-8, decisions.md, state.md

---

## 1. Veredito Geral

O plano Codex esta correto no diagnostico e errado na ordenacao.

**O que esta certo:** os 8 cortes identificam problemas reais. Nenhum desbloqueia P4/P5. A divisao
em cortes atomicos com DoD e boa governanca.

**O que esta exagerado:** 9,5 como meta numerica unica e ficção util, nao metrica real. O projeto
tem areas em 7,5 (PWA smoke, DevEx) e areas em 8,5 (dados, testes, privacidade). A "nota do
proprietario" nao e media — e a nota do fluxo mais critico, que e o uso diario no celular. Um
relatorio de progresso impecavel nao ajuda nada se a tela Hoje continua densa demais para navegar
com polegar no mobile.

**Discordancia estrutural:** Codex coloca fila/cooldown de API como primeiro corte. Discordo. O
cache guard de 6h implantado em 741fb4e ja mitiga o caso mais comum — re-sync acidental no mesmo
Save. A fila serial ainda e necessaria para proteger chamadas concorrentes dentro da sessao, mas o
risco imediato caiu. O que o dono sente em cada sessao real e a densidade mobile (N95-5). O que
protege o dataset unico e irreplacavel e a validacao de shape no backup (N95-3). Essas duas sobem.

**Sobre N95-8 (revisao pedagogica):** nao e um corte novo. O baseline ja esta na tela Progresso
(Corte 5). A revisao ~2026-07-08 esta programada nas decisoes registradas. Tratar como corte
separado infla escopo sem adicionar trabalho novo.

---

## 2. Tabela de Decisoes

| Corte | Decisao | Justificativa |
|-------|---------|---------------|
| N95-1 API Queue | **Aprovar — 3o** | Cache guard de 6h ja cobre re-sync acidental. Fila serial ainda protege chamadas concorrentes intra-sessao e 429 direto. Nao e bloqueador agora, mas e divida tecnica real. |
| N95-2 PWA Smoke | **Adiar** | App rodando em Vercel desde 2026-06-11, testado no mobile pelo dono. Margem real de melhora e baixa para ferramenta de uso pessoal. Reavaliar antes de P5. |
| N95-3 Backup Guards | **Aprovar — 2o** | Dataset unico. Perda de dados nao tem compensacao. Corte 1 ja tem checksum e transacao; a camada de validacao de shape por entidade e o passo que falta para "confiavel de verdade". |
| N95-4 E2E | **Adiar** | Playwright smoke existe. E2E completo tem custo de manutencao desproporcionalmente alto para ferramenta de 1 usuario. Reavaliar antes do Corte 8, quando mudancas de curriculo precisarao de regressao protegida. |
| N95-5 Mobile/Acessibilidade | **Aprovar — 1o** | Uso diario no mobile. Densidade e fricção em cada sessao de treino. Impacta motivacao e constancia — que sao o objetivo central do app. |
| N95-6 Asset Ledger | **Adiar** | P5 congelada, nenhuma publicacao iminente. Nenhum risco atual. Obrigatorio antes de abrir P5, nao antes. |
| N95-7 DevEx/Bundle | **Adiar** | Refactor de useAppState sem E2E protegendo os fluxos e risco desnecessario. O warning de 517 kB e investigavel, mas nao demonstrou impacto em caching offline ainda. |
| N95-8 Revisao Pedagogica | **Ja em execucao** | Baseline implementado no Corte 5. Revisao ~2026-07-08 registrada nas decisoes. Nao e corte novo — e uma data de revisao. Executar na data planejada. |

---

## 3. Ordem Final de Execucao

```
Agora (batch 1, sem dependencia entre si):
  [A] N95-5 Mobile/Acessibilidade
  [B] N95-3 Backup Shape Guards

Em seguida (batch 2, apos batch 1 verde):
  [C] N95-1 API Queue/Cooldown

Data fixa (sem corte novo):
  [D] Revisao pedagogica ~2026-07-08 (usar tela Progresso ja existente)

Antes do Corte 8 (curriculo denso):
  [E] N95-4 E2E dos fluxos de valor

Antes de P5 (sem pressa):
  [F] N95-2 PWA Smoke automatizado
  [G] N95-6 Asset Ledger
  [H] N95-7 DevEx/Bundle (gradual, acoplado a cada refactor futuro)
```

Dependencias:
- [C] pode comecar antes de [A]/[B] terminarem (independentes), mas [A] e [B] em paralelo
  consomem foco do Codex — executar sequencialmente e mais seguro.
- [E] depende de [C] estar verde (E2E nao deve mockear a fila; precisa da real).
- [H] depende de [E] estar verde (refactor sem regressao e risco).

---

## 4. Ordens Para Codex

### Corte A — Mobile/Acessibilidade

**Escopo:**
- Mapear os viewports 390px (Hoje, Progresso, Config) com Playwright screenshot antes das mudancas.
- Verificar contraste minimo WCAG AA nos dois temas (claro e escuro) nos textos e controles principais.
  Usar ferramentas de inspecao de CSS; nao redesenhar paleta.
- Garantir alvos touch >= 44px nos botoes de acao criticos: Concluir bloco, Facil/Bom/Dificil, Salvar,
  Atualizar.
- Verificar que Fold expande/colapsa com Tab + Enter e que o foco visivel nao some ao colapsar.
- Verificar que informacoes criticas (estado de conexao Lichess/Chess.com, mensagem do Lemos sobre
  fallback) nao dependem apenas de hover.
- Ajustar densidade onde houver sobreposicao ou corte de conteudo em 390px sem mudar hierarquia
  de informacao.
- Smoke Playwright mobile 390px antes e depois; screenshots devem mostrar diff visual.

**Arquivos candidatos:** `src/ui/*.tsx`, `src/index.css`, `src/components/*.tsx`.
**Nao fazer:** redesenho de paleta, novos componentes, mudanca de logica de negocio.
**DoD:** zero overflow horizontal em 390px; todos controles de acao criticos acessiveis por teclado;
contraste AA verificado; smoke Playwright verde antes e depois; lint/test/build verdes.

---

### Corte B — Backup Shape Guards

**Escopo:**
- Criar guards puros (funcoes sem efeito colateral) em `src/infra/storage/backup.ts` para validar:
  - `profile`: campos obrigatorios (ageCategory, band), campos opcionais sem rejeicao por ausencia.
  - `plans`: array; cada plano tem `id` string, `date` no formato YYYY-MM-DD, `blocks` array nao-vazio.
  - `signals`: array; cada signal tem `kind` discriminado por union valida, `date` ISO 8601.
  - `logs`: array; cada log tem `startedAt`, `completedAt` ISO 8601, `elapsedSeconds` numero nao-negativo.
  - `weaknesses`: array; cada weakness tem `tag` string, `level` numerico.
  - `achievements`: array; cada achievement tem `id` string, `unlockedAt` ISO 8601.
  - `placement`: se presente, tem `confidence` numerico 0-1 e `band` string valida.
- A validacao rejeita o backup inteiro antes de iniciar a transacao Dexie se qualquer guard falhar.
- Backups sem campos opcionais (versoes antigas) passam se os obrigatorios estiverem presentes.
- Mensagem de erro de validacao deve especificar qual entidade e campo falhou, sem vazar conteudo.

**Arquivos candidatos:** `src/infra/storage/backup.ts`, `src/infra/storage/backup.test.ts`.
**Testes obrigatorios (4 cenarios):**
  1. Backup bom — roundtrip exportar/importar sem perda.
  2. Backup com campo critico errado (signal.kind invalido) — rejeita sem tocar Dexie.
  3. Backup antigo sem campo novo opcional — importa sem erro.
  4. Backup com array corrompido (plans: null) — rejeita sem tocar Dexie.
**DoD:** import so escreve dentro de transacao apos validar tudo; 4 cenarios passando; nenhuma
quebra de testes existentes; lint/build verdes.

---

### Corte C — API Queue/Cooldown

**Escopo:**
- Criar `src/infra/http/providerQueue.ts`:
  - Fila serial por provedor: chamadas enfileiradas esperem a anterior terminar antes de comecar.
  - Lichess: se resposta e 429, cooldown minimo de 60s antes de liberar proxima da fila.
  - Chess.com: fila serial; cache existente (arquivos mensais e cache guard de 6h) permanece intacto.
- Plugar o wrapper nos pontos de saida de rede: `src/infra/lichess/lichessClient.ts` e
  `src/infra/chesscom/chesscomClient.ts`.
- Erros continuam mapeados para mensagens de usuario sem vazar token, PII ou response body sensivel.
- Nao criar backend, proxy ou dependencia nova de runtime.

**Arquivos candidatos:** `src/infra/http/providerQueue.ts` (novo), `src/infra/lichess/lichessClient.ts`,
`src/infra/chesscom/chesscomClient.ts`, `src/app/errorMessages.ts`.
**Testes obrigatorios:**
  1. Duas chamadas simultaneas ao mesmo provedor saem em serie (nao em paralelo).
  2. 429 do Lichess dispara cooldown e a fila espera >= 60s antes da proxima chamada.
  3. Erro HTTP normal (500) nao trava fila indefinidamente.
  4. Chamadas a provedores diferentes nao se bloqueiam entre si.
**DoD:** lint/test/build verdes; testes sem rede real; nenhuma mudanca de contrato nos fluxos
existentes; cache guard de 6h permanece intacto no state.ts.

---

## 5. Riscos Que Continuam

| Risco | Nivel | Mitigacao Atual | Gap Restante |
|-------|-------|-----------------|--------------|
| Perda de dados em iOS/Safari | Alto | storage.persist + export opt-in (Corte 1) | Safari pode limpar IndexedDB sem aviso. Unica protecao real e backup recente. Dono deve ter exportado recentemente. |
| 429 acidental intra-sessao | Medio | Cache guard 6h; fila vem no Corte C | Antes do Corte C, duas operacoes manuais rapidas podem disparar parallel fetch. |
| Bundle ~517 kB | Baixo | Sem impacto observado em caching real ainda | Investigar antes do Corte 8 (curriculo denso vai crescer o bundle). |
| Assets premium em tema escuro | Baixo | SVGs atuais adaptam por CSS token | Imagens raster futuras precisarao de versao escura ou overlay. Nao e risco atual (SVGs ainda). |
| useAppState monolitico | Baixo | Nao trava nenhum fluxo | Divida tecnica acumulada; pior antes de refactors de curriculo. Tratar no Corte H. |

---

## 6. Perguntas Ao Dono

Nenhuma. Todas as decisoes necessarias para os cortes A, B e C estao cobertas pelas decisoes
registradas. A revisao pedagogica de ~2026-07-08 esta confirmada. Os cortes D-H ficam para
momento oportuno sem decisao nova necessaria agora.

---

## 7. Nota Sobre "Nota 9,5"

A nota-alvo deve ser avaliada por area, nao como media global. A meta pratica e:

> O dono nao bate em fricao, perda de dados ou falha silenciosa em uso diario normal.

Isso implica:
- Mobile/UX: hoje 8,0 de experiencia de uso real → meta 9,0 (Corte A)
- Data safety: hoje 8,5 → meta 9,5 (Corte B)
- API reliability: hoje 8,0 → meta 9,0 (Corte C)
- Pedagogia: hoje 8,0 → avaliado em 2026-07-08 (revisao ja planejada)

Areas como PWA smoke automatizado e DevEx podem ficar em 8,0 por tempo indefinido sem impactar
a experiencia do dono. Perseguir 9,5 global antes do Corte 8 seria festival de polish, nao
melhoria de produto.

---

## Proximo Passo Para Execucao

**Corte A (Mobile/Acessibilidade)** e o primeiro. Nao quebra API, nao toca backup, nao muda logica
de negocio. O dono ve o resultado imediatamente no proximo uso no celular. Pode comecar sem
aprovacao adicional — todas as restricoes do contrato de produto sao respeitadas.

Handoff para Codex: implementar Corte A com os arquivos e DoD descritos na secao 4. Apos gate
verde (lint/test/build + smoke Playwright 390px), iniciar Corte B.
