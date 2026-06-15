# Arbitragem Final Multi-IA — Plano Nota 9,5

Data: 2026-06-14
Autor: Claude (Diretor), Opus 4.8
Insumos: 4 auditorias independentes do código pós-Cortes A/B/C —
[Claude](relatorio-claude-analise-completa-nota-95-2026-06-14.md),
[Codex](relatorio-codex-revisao-critica-nota-95-2026-06-14.md),
[Antigravity/Gemini](relatorio-antigravity-analise-completa-nota-95-2026-06-14.md), DeepSeek (sem achado próprio).
Status: **decisões do dono aprovadas** (4× Sim). Fase D0–I autorizada e em execução.

---

## 1. Convergência

As quatro auditorias convergiram na tese e divergiram pouco na nota. Consenso unânime:
**o caminho para 9,5 é fechar loops internos abertos, não adicionar features.** Os três pares
com achado próprio confirmaram o bug do replay 429.

| Frente | Claude | Codex | Antigravity | **Arbitrado** |
|--------|:------:|:-----:|:-----------:|:-------------:|
| UX / mobile | 7,5 | 8,0 | 7,6 | **7,7** |
| Pedagogia | 7,2 | 7,1 | 7,0 | **7,1** |
| Dados | 7,5 | 8,1 | 7,4 | **7,8** |
| Rede | 7,3 | 7,0 | 7,0 | **7,1** |
| Engenharia | 7,8 | 7,8 | 7,7 | **7,8** |
| **Geral** | 7,4 | 7,7 | 7,3 | **7,5** |

## 2. Correções aceitas do Codex

1. **"Backup 10/16" era alarmista.** Só 2 tabelas não-cobertas são dado durável do usuário
   (`lichessStudies`, `appMeta`). Token (por design), caches mensais e file handles **devem**
   ficar fora. Critério: *o que o usuário criou e espera recuperar entra; token/cache/handle não.*
   → Dados sobe de 7,5 para 7,8.
2. **Não refazer o Corte A.** Contraste primário, alvos 44px e foco já fechados. O corte de UX
   foca só no que sobrou: ordem da tela, labels contextuais e o contraste de `.fold-meta`.

## 3. Achado novo do Codex (incorporado)

- **Flake de teste:** `src/app/preserveProgress.test.tsx` deu timeout no 1º full run, passou
  isolado e no rerun. Estabilizar **antes** de refatorar `state.ts` (entra no Corte H).

## 4. Decisões do dono — APROVADAS 2026-06-14

| # | Decisão | Resposta | Corte |
|---|---------|:--------:|:-----:|
| 1 | Bloco de transferência alterna fraqueza secundária | **Sim** | E |
| 2 | Revisão espaçada reage ao feedback (SM-2 simplificado: 'Fácil' +2, 'Bom' +1, 'Difícil' −1) | **Sim** | E |
| 3 | Diploma promove a trilha de método por ~1–2 semanas | **Sim** | E |
| 4 | Auto-sync Lichess puxa só recente; histórico completo só no botão manual | **Sim** | G |

Decisão 4 honra a preferência registrada de "histórico completo" (mantida no manual) e protege o mobile.

## 5. Ordem final de execução

```
D0  Hotfix de invariantes ......... CONCLUÍDO (90e1750)
      replay 429 re-lança; fallback de username vazio; 3 testes
D1  UX: ação na primeira dobra ..... próximo
      hero acima do TutorCard; .fold-meta contraste; aria-labels; nav 44px global
E   Pedagogia adaptativa real ......
      SM-2 (dec.2); mastery→plano; trilha diploma (dec.3); 2ª fraqueza (dec.1);
      threshold de blunder por banda; re-disparo pós-placement
F   Durabilidade do dado ...........
      backup v2 + migrateBackup; lichessStudies + appMeta; export atômico;
      validação profunda; persist() após 1ª ação significativa
G   Rede sob falha .................
      timeout AbortController; retry/backoff (não-429); auto-sync recente (dec.4); offline
H   Engenharia .....................
      estabilizar flake → testes app/ → buildPlanContext/syncService → manualChunks → coverage
I   Acabamento .....................
      confirmação inline (vs window.confirm); testes PlanBlockCard/Onboarding; coach 5min
```

**Dependências:** H estabiliza o flake e escreve testes **antes** de refatorar `state.ts`.
G inclui o respeito a `Retry-After` no 429. D1, F, G são independentes entre si.

## 6. Projeção

| Frente | Hoje | Pós D–I | 
|--------|:----:|:-------:|
| UX | 7,7 | 9,4 |
| Pedagogia | 7,1 | 9,2 (9,5 no Corte 8) |
| Dados | 7,8 | 9,5 |
| Rede | 7,1 | 9,3 |
| Engenharia | 7,8 | 9,4 |
| **Geral** | **7,5** | **~9,4** |

Pedagogia chega ao teto com o Corte 8 (currículo denso) e a revisão de eficácia de 2026-07-08.
