# Relatorio Codex — Plano Para Levar O App A Nota 9,5

Data: 2026-06-13  
Autor: Codex  
Destino: Claude / arbitragem e ordem de execucao  
Objetivo: transformar as propostas de melhoria em cortes pequenos, verificaveis e compativeis com a
fase pessoal atual.

## Principio Do Plano

Nota 9,5 nao significa mais superficie de produto. Significa reduzir risco operacional, aumentar
confianca, proteger dados, consolidar offline, melhorar verificabilidade e preparar o projeto para
mudancas futuras sem quebrar a ferramenta pessoal do dono.

As propostas abaixo nao descongelam P4/P5.

## Corte N95-1 — Fila E Cooldown Central De API

**Objetivo:** garantir que Lichess e Chess.com sejam acessados de forma serial, previsivel e testada.  
**Por que sobe a nota:** integrações/API deixam de depender apenas de disciplina local dos fluxos.  
**Escopo sugerido:**

- Criar utilitario de fila por provedor, por exemplo `src/infra/http/providerQueue.ts`.
- Lichess: uma requisicao por vez; em HTTP 429, cooldown minimo de 60s antes da proxima chamada.
- Chess.com: acesso serial; preservar bound de recencia e cache existente.
- Erros devem continuar mapeados para mensagens sem vazar token/PII/response body sensivel.
- Nao criar backend/proxy.

**Arquivos candidatos:** `src/infra/lichess/*.ts`, `src/infra/chesscom/chesscomClient.ts`,
`src/app/errorMessages.ts`, testes de infra.  
**Testes obrigatorios:** concorrencia, ordenacao, 429, cooldown, erro normal, token nao logado.  
**DoD:** lint/test/build verdes; testes unitarios provando que duas chamadas simultaneas saem em serie.

## Corte N95-2 — Smoke PWA Producao/Offline

**Objetivo:** provar que o app buildado funciona como PWA, nao apenas no dev server.  
**Por que sobe a nota:** PWA/offline sai de "configurado" para "verificado".  
**Escopo sugerido:**

- Criar ou reforcar script de smoke com build + preview.
- Verificar manifest, service worker registrado/controlando pagina, app shell apos reload offline e
  prompt de update quando houver nova versao.
- Rodar em desktop e viewport mobile.
- Nao mudar estrategia PWA sem ADR.

**Arquivos candidatos:** `scripts/check-prod.mjs`, `vite.config.ts`, `src/ui/ReloadPrompt.tsx`,
`src/pwaConfig.test.ts`.  
**Testes obrigatorios:** script local reproduzivel; falha com exit code != 0 quando SW/offline falhar.  
**DoD:** `npm run build` + smoke PWA documentado e rodavel por Codex/Claude.

## Corte N95-3 — Backup Import Com Shape Guards

**Objetivo:** impedir que backups formalmente validos, mas semanticamente errados, entrem no Dexie.  
**Por que sobe a nota:** data safety fica mais perto de "confiavel de verdade".  
**Escopo sugerido:**

- Criar guards puros para as entidades do backup.
- Validar campos essenciais, unions, datas ISO ou `YYYY-MM-DD`, status, feedback, IDs e arrays.
- Rejeitar backup ruim sem tocar dados existentes.
- Manter compatibilidade com backups anteriores quando campos opcionais forem ausentes.

**Arquivos candidatos:** `src/infra/storage/backup.ts`, `src/infra/storage/appData.ts`,
`src/infra/storage/backup.test.ts`, `src/infra/storage/appData.test.ts`.  
**Testes obrigatorios:** backup bom roundtrip; backup com campo errado; backup antigo sem campos novos;
backup adulterado sem tocar estado atual.  
**DoD:** import so escreve dentro de transacao depois de validar tudo.

## Corte N95-4 — E2E Dos Fluxos De Valor

**Objetivo:** cobrir os caminhos que representam a ferramenta funcionando de ponta a ponta.  
**Por que sobe a nota:** QA deixa de ser "muito teste isolado" e passa a proteger uso real.  
**Fluxos sugeridos:**

- Primeira entrada e Config.
- Gerar plano de hoje.
- Abrir treino e preservar tela do Lemos.
- Concluir bloco com feedback.
- Desbloquear conquista quando fixture permitir.
- Exportar e restaurar backup.
- Mobile 390px sem overflow.

**Arquivos candidatos:** `scripts/`, `output/playwright/`, talvez `src/test/fixtures` se necessario.  
**DoD:** script E2E roda localmente, gera screenshots apenas quando solicitado/falha, e nao depende de
rede real para passar.

## Corte N95-5 — Acessibilidade E Mobile Pass

**Objetivo:** lapidar uso diario em desktop/mobile com teclado, foco, contraste, labels e densidade.  
**Por que sobe a nota:** UI bonita vira UI robusta.  
**Escopo sugerido:**

- Verificar labels/roles dos controles principais.
- Garantir foco visivel e ordem de tab coerente.
- Verificar contrastes nos temas claro/escuro.
- Checar alvos touch e textos longos em 390px.
- Usar Playwright + inspeção local; sem redesenhar o produto.

**DoD:** lista de ajustes aplicada ou documentada; smoke mobile/desktop sem overflow; sem hover-only
para informacao critica.

## Corte N95-6 — Ledger De Assets Gerados

**Objetivo:** criar trilha de origem e licenca para os assets premium.  
**Por que sobe a nota:** reduz risco de direitos/licenca antes de qualquer P5.  
**Escopo sugerido:**

- Criar `docs/design/assets-ledger.md`.
- Para cada asset em `public/art`: nome, origem, prompt/documento, ferramenta, data, status,
  licenca/termos, observacao de clean-room.
- Marcar itens desconhecidos como `needs-review`, nao como aprovados.

**DoD:** nenhum asset em `public/art` fica sem linha no ledger.

## Corte N95-7 — DevEx, Estado E Bundle

**Objetivo:** reduzir custo de mudanca depois que os fluxos principais estiverem blindados.  
**Por que sobe a nota:** manutencao e performance deixam de ser risco acumulado.  
**Escopo sugerido:**

- Mapear responsabilidades de `useAppState`.
- Extrair fatias sem mudar contrato publico dos componentes.
- Investigar chunk de ~517 kB antes de mudar limite de warning.
- Evitar refactor grande antes dos E2E.

**DoD:** pequenas extrações com testes verdes; warning de bundle explicado ou reduzido.

## Corte N95-8 — Revisao Mensal De Eficacia Pedagogica

**Objetivo:** medir se o metodo melhora o treino real do dono, nao so se o app funciona.  
**Por que sobe a nota:** dominio/pedagogia sobe quando o app aprende com uso real.  
**Escopo sugerido:**

- Relatorio local mensal: sessoes, horas, taxa de conclusao, feedback, pendencias, temas fortes/fracos,
  retorno apos pausa e proximas hipoteses.
- Sem prometer rating.
- Sem analytics remoto.

**DoD:** plano de revisao documentado ou prototipo local; resultado alimenta Corte 8/curriculo denso.

## Ordem Recomendada Por Codex

1. N95-1 Fila/cooldown central de API.
2. N95-2 Smoke PWA producao/offline.
3. N95-3 Backup import com shape guards.
4. N95-4 E2E dos fluxos de valor.
5. N95-5 Acessibilidade/mobile pass.
6. N95-6 Ledger de assets.
7. N95-7 DevEx/estado/bundle.
8. N95-8 Revisao mensal de eficacia.

## Alternativa Mais Conservadora

Se Claude quiser maximizar seguranca de dados antes de rede, inverter N95-2 e N95-3:

1. API queue.
2. Backup shape guards.
3. PWA prod smoke.
4. E2E.

Essa alternativa e boa se a prioridade imediata for "nao perder dados" acima de "nao bater rate limit".

## Decisao Que Claude Deve Emitir

Claude deve decidir:

- Quais cortes entram agora e quais ficam backlog.
- Qual ordem final deve virar plano de execucao.
- Se algum corte precisa de spec propria antes de Codex implementar.
- Quais verificacoes extras sao obrigatorias em cada corte.
- Se a nota-alvo 9,5 deve ser tratada por area ou como uma media geral do projeto.
