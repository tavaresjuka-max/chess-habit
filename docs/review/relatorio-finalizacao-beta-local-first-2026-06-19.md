# Relatorio de finalizacao beta local-first - 2026-06-19

## Veredito

O app ficou pronto para revisao de **beta publico local-first** dentro do escopo sem backend. As lacunas alcancaveis nesta fase foram fechadas: auditoria axe automatizada, smoke de CSP, transparencia de privacidade na UI, contrato E2EE documentado para P4, coverage com funcoes acima de 90% e bateria final verde.

Nao houve deploy, push, provisionamento Cloudflare, criacao de secrets ou mudanca de nome publico.

## Notas por area

| Area | Antes | Depois | Observacao |
| --- | ---: | ---: | --- |
| Acessibilidade | 7,7 | 9,3 | Axe automatizado em Welcome, Hoje, Config, Progresso e onboarding de contas; smoke desktop/mobile trava regressao seria/critica. |
| Seguranca/CSP | 7,8 | 8,8 | Estilos inline proprios removidos; CSP aplicada no preview por meta build-only e testada por Playwright. `style-src 'unsafe-inline'` permanece por dependencia de runtime do `sonner`. |
| P5 local-first publico | 8,0 | 9,2 | `APP_NAME`, privacidade, feedback opcional, AGPL/disclaimer e URL de codigo-fonte pendente centralizados/visiveis. |
| P4 documentacao | 6,5 | 8,5 | Contrato E2EE por passphrase independente e runbook de backend documentados, sem implementar sync. |
| Testabilidade/estabilidade | 8,8 | 9,5 | Coverage 5x verde, functions >=90%, smoke PWA 34/34, build sem sourcemaps. |

## O que foi feito por fase

### Fase 1 - Acessibilidade axe

- Instalado `@axe-core/playwright`.
- Adicionado script `npm run a11y`.
- Criado `e2e/a11y.spec.ts`.
- Cobertura axe:
  - tela de boas-vindas;
  - Hoje;
  - Config;
  - Progresso;
  - passo "Suas contas" do onboarding.
- Corrigido contraste transiente removendo a opacidade inicial da animacao de `.panel`.

Commits:

- `61d8b3e test(a11y): auditoria axe automatizada em Welcome/Hoje/Config/Progresso + correcoes`
- `f691aba test(a11y): cobre passo Suas contas do onboarding`

### Fase 2 - CSP e inline styles

- `LemosAvatar` passou a usar classe CSS em vez de `style` inline.
- Barras de progresso foram removidas do modelo de `style={{ width }}` e passaram para elementos/estilos compatíveis com CSP.
- Criado smoke `e2e/csp.spec.ts`, que falha em bloqueios reais de CSP no console.
- A CSP de producao foi espelhada no preview por plugin build-only em `vite.config.ts`.
- Gate de decisao: a tentativa de remover `style-src 'unsafe-inline'` encontrou bloqueio real no `sonner`, que injeta `<style>`/estilos runtime. A politica foi mantida como `style-src 'self' 'unsafe-inline'`, com decisao registrada em `DECISIONS.md`. O app proprio ficou sem inline style autoral nos pontos auditados.

Commits:

- `9bde64a refactor(csp): avatar usa classe CSS em vez de style inline`
- `72c230a refactor(csp): barras de progresso via custom property (CSSOM), sem style inline`
- `879f02f feat(csp): remove unsafe-inline de style-src e trava por smoke (ou documenta limite do sonner)`

### Fase 3 - P5 local-first: privacidade e feedback

- Criadas constantes centralizadas `PRIVACY_SUMMARY` e `FEEDBACK_URL` em `src/config/appIdentity.ts`.
- `LegalFooter` exportado e ampliado com aviso de privacidade em `<details>`.
- Link de feedback preparado, mas fica oculto enquanto `FEEDBACK_URL` for `undefined`.
- Testes cobrem as constantes e o footer.

Commits:

- `cd8c9ca feat(p5): constantes PRIVACY_SUMMARY e FEEDBACK_URL centralizadas`
- `993636f feat(p5): aviso de privacidade in-app e link de feedback no footer`

### Fase 4 - Contrato E2EE P4

- `docs/architecture/sync.md` recebeu contrato E2EE: passphrase independente, servidor sem token/passphrase/chave/plaintext, blobs cifrados e merge por registro/tombstone.
- Criado `DEPLOY-BACKEND.md` como runbook do dono para a fase P4.
- Nenhum backend foi implementado e nenhum recurso de nuvem foi provisionado.

Commit:

- `197407d docs(p4): contrato E2EE com passphrase independente + runbook de backend para o dono`

### Fase 5 - Gates finais e estabilidade

- Adicionado teste para a meta CSP build-only em `src/pwaConfig.test.ts`.
- Estabilizados testes de fluxo de treino que clicavam em `Concluir`/`Bom` de forma global e fragil.
- Adicionado `src/domain/assertNever.test.ts` para cobrir funcao pura de dominio e elevar functions para >=90%.

Commit:

- `a1fa8d3 test: estabiliza coverage final do beta local-first`

## Gates finais

Executados em 2026-06-19, sem deploy/push:

| Gate | Resultado |
| --- | --- |
| `npm run lint` | exit 0 |
| `npm test` | 76 arquivos, 627 testes, exit 0 |
| `npm run coverage` 1/5 | 76 arquivos, 627 testes; statements 85,85%; branches 80,12%; functions 90,02%; lines 85,62% |
| `npm run coverage` 2/5 | 76 arquivos, 627 testes; statements 85,85%; branches 80,12%; functions 90,02%; lines 85,62% |
| `npm run coverage` 3/5 | 76 arquivos, 627 testes; statements 85,85%; branches 80,12%; functions 90,02%; lines 85,62% |
| `npm run coverage` 4/5 | 76 arquivos, 627 testes; statements 85,85%; branches 80,12%; functions 90,02%; lines 85,62% |
| `npm run coverage` 5/5 | 76 arquivos, 627 testes; statements 85,88%; branches 80,12%; functions 90,02%; lines 85,65% |
| `npm run build` | exit 0; `tsc -b && vite build` |
| `npm run smoke:pwa` | 34/34 passed, desktop + mobile |
| `Get-ChildItem dist -Recurse -Filter *.map` | nenhum resultado |
| `npm audit --audit-level=high` | 1 high em `undici` via `jsdom` dev dependency |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilidades |

Observacao: Vitest/jsdom ainda imprime `Not implemented: navigation to another Document` em alguns fluxos; isso nao quebrou a suite e ja e ruido conhecido de ambiente de teste, nao navegacao real do app.

## Achados refutados ou decididos

- **CSP sem `unsafe-inline` nao foi fingida como concluida.** O bloqueio vem de terceiro (`sonner`) e foi documentado. O app proprio foi limpo nos estilos inline auditados.
- **URL publica de codigo-fonte nao foi inventada.** `SOURCE_CODE_URL` continua `undefined` ate o dono fornecer a URL real.
- **Nome publico nao foi trocado.** `APP_NAME='Rotina'` permanece como placeholder centralizado.
- **P4 nao foi implementada nesta fase.** Somente contrato e runbook foram documentados.
- **`computeMastery` -> `masteryTarget` em `generatePlan` nao foi mexido.** O prompt travava isso como fora de escopo.

## Follow-ups

1. Implementar P4 sync com Cloudflare Workers + D1, E2EE no cliente e testes locais com wrangler/miniflare. O dono continua responsavel por conta, secrets e deploy.
2. Substituir `sonner` ou carregar seus estilos de forma estatica para remover `style-src 'unsafe-inline'` da CSP.
3. Preencher `SOURCE_CODE_URL` com a URL publica real antes do beta publico.
4. Trocar `APP_NAME` quando o dono decidir o nome publico final.
5. Avaliar `computeMastery` -> `masteryTarget` no `generatePlan` numa fase pedagogica propria, sem misturar com hardening.
6. Expandir curriculo avancado 1200-2200 apos validacao de eficacia.
7. Acompanhar update de `jsdom`/`undici`: risco alto atual e dev-only; runtime/prod esta limpo por `npm audit --omit=dev --audit-level=high`.

## Status final

Beta local-first: pronto para revisao do dono. Pendencias restantes dependem de decisao/provisionamento externo do dono ou de uma fase futura dedicada.
