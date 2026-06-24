# Backlog completo — o que falta (2026-06-24)

> Artefato para council criticar. Depois vira plano + prompt GLM. Executor: GLM
> (fallback Sonnet). Opus revisa risco + gates + caça-bugs. Gates: test+lint+build+E2E.
> Deploy/merge a produção só com OK do dono.

## Estado (em produção, master)
M0 visual · M1 beta · M2a banda automática · M-Hardening · M-Pedagogia · M-Solidez
(DD-Ped6 + cobertura + E2E) · fix anti-ratchet · M-Retenção (acumulação) · R2b
(suporte crônico) · **M-Sinal-9.5** (captura de erro + roteamento aditivo + teto FM
explícito) — recém-deployado. 1013 testes + 38 E2E, lint, build verdes. a11y 100.

## Inventário do restante (classificado por executabilidade)

### A. EXECUTÁVEL AGORA (código, sem decisão do dono, sem bloqueio externo)
- **A1 — Telemetria do roteamento (#3 da auditoria):** o efeito do errorRouting é
  HIPÓTESE não-medida (council). Instrumentar: registrar quando uma ênfase foi
  aplicada e medir se a taxa de 'hard' NAQUELE tipo de erro cai nos próximos N
  blocos do tema. Métrica local (sem backend), visível em algum diagnóstico.
  Critério de sucesso a definir. É a próxima alavanca REAL de 9.5.
- **A2 — Limpeza de branches:** apagar branches já mergeados (feat/m-solidez,
  feat/m2a-banda-automatica, feat/sinal-pedagogico-9.5) + estetica-emblemas-dourados
  (antigo). Trivial.
- **A3 — Polish de qualidade (baixo valor):** fechar branches UI restantes (App.tsx,
  PlanProposalCard) + auditar redundância de testes (1013 testes p/ 1 usuário; GLM
  alertou que pode ser dívida). Perf 87→90 já é incerto (code-split feito).

### B. PRECISA DO DONO (decisão/arte — NÃO autônomo)
- **B1 — M3a Cravadas:** branch codex/m3a-diploma-cravada (gates verdes). DECISÃO
  pedagógica pendente: band/threshold/sections + a DIVERGÊNCIA diplomas.ts '1200-1400'
  vs bandProgression.ts '1600-2000'. + OK de merge/deploy.
- **B2 — M-Transparência:** diagnósticos visíveis. Rebaixada pelo council (retenção
  venceu); o risco do floor é parcialmente coberto por R2b. Reabrir só se o dono quiser.
- **B3 — Visual premium:** dono gera imagens premium no ChatGPT Plus; contínuo.

### C. BLOQUEADO (infra externa)
- **C1 — M2b sync multi-device:** aguarda o dono provisionar Cloudflare Workers + D1.
  Nota: seed E2EE = `id` imutável do /api/account; LWW arriscado com clock skew.
- **C2 — M4 comunidade:** depende de M2b funcional.

## Plano de execução autônoma (só A — o que o GLM PODE fazer)
1. **A1 (telemetria)** — maior valor; instrumenta a hipótese do roteamento. TDD.
2. **A2 (limpeza de branches)** — trivial, ao fim.
3. **A3 (polish)** — só se sobrar; auditar redundância ANTES de inflar cobertura.
Depois: **caça-bugs** (council VERIFICAR / finder sobre as mudanças recentes) + relatório.

## PLANO FINAL (pós-council, adjudicado — ESTE vale)

Council (DeepSeek + GLM, convergiram):
- **A3 CORTADO** — cobertura UI = gold-plating p/ 1 usuário; auditar 1013 testes = meta-trabalho.
- **A1 telemetria de dev = vaidade em n=1** (sem significância; ruído + reatividade).
  Validação honesta = TRANSPARÊNCIA (mostrar ao aluno o porquê do roteamento) +
  congruência auto-reportada. Vira **A1'**.
- **Gaps adicionados ao backlog** (council): backup/restore não validado (EXISTENCIAL);
  a11y do fluxo de 3 botões; off-by-one GMT-3 no pendingItems; privacidade do export.

### EXECUTÁVEL AGORA (GLM, fallback Sonnet):
- **A1' — Sinal transparente:** quando o coaching do bloco-tema foi roteado por
  ênfase de erro, mostrar o PORQUÊ ao aluno (1 linha: "seu padrão recente é ERREI A
  CONTA → foco em cálculo hoje"). ADITIVO, sem dashboard de dev, sem tap extra
  (evita custo de interrupção TDAH). Tom Lemos, passa BANNED_PHRASES. TDD.
- **A2 — Limpeza de branches** mergeados (trivial).

### CAÇA-BUGS (Opus + council VERIFICAR), mira nos gaps do council:
- **GMT-3 no pendingItems** — re-verificar se há aritmética de data em hora local
  (`setDate`) que cause off-by-one; escrever teste que reproduz GMT-3. (NOTA: addDays
  de pendingItems e getPurgeCutoff já são UTC — confirmar que não sobrou nada.)
- **a11y do fluxo de sinal** — os 3 botões pós-erro: foco/teclado/aria.
- **backup/restore** — sanidade do export/import (checksum, tabelas) — já tem testes;
  confirmar que cobre o caminho do dono.

### NÃO autônomo (decisão do dono / bloqueado):
B1 M3a (decisão pedagógica), B2 M-Transparência completa, B3 arte premium;
C1 M2b sync (Cloudflare), C2 M4 comunidade.

### Métrica honesta da hipótese de roteamento (quando for medir):
Congruência auto-reportada ("o coaching bateu com o erro real?") — magnitude
intra-sujeito, NÃO p-valor. n=1 nunca é significativo; triangular com "o aluno SENTE
que ajuda?". Cuidado com overfit a ruído e reatividade.
