# M-Sinal-9.5 — Sinal pedagógico rico + escada até 2400

> Council 2026-06-24 (DeepSeek + GLM, CONVERGENTE): a maior alavanca para 9.5 NÃO
> é mais bandas — é SINAL mais rico. O gerador roda sobre "acertou/errou", grosso
> demais. Decisões do dono: (1) feature de sinal AGORA; (2) esticar escada até 2400 (FM).
> Executor: GLM 5.2 (opencode), guiado por ESTE plano. Opus revisa risco + gates + audit.
> NÃO commitar em master, NÃO deploy (precisa OK do dono). Gates: test+lint+build+E2E.

## Princípio (não violar)
Progresso por SINAL LOCAL, nunca por rating. Tom "Professor Lemos" (sóbrio, sem
'parabéns'/confete — ver BANNED_PHRASES em src/domain/coach/sessionMessage.ts).
TDAH: micro-input sem fricção (2s), nunca trava o fluxo. Respeitar prefers-reduced-motion.

## FASE 1 — Sinal rico (a alavanca de 9.5)

### 1a. Taxonomia de erro em 1 toque (GLM 5.2)
Quando o aluno marca dificuldade no fechamento do bloco (hoje: easy/good/hard, ver
o fluxo de feedback do treino — o grupo "Como foi o treino?" na UI e o handler
onCompleteBlockTraining; PlanBlockFeedback em src/domain/types.ts), oferecer — SÓ
quando o sinal indica erro/dificuldade ('hard') — UMA escolha de 1 toque:
**NÃO VI · ERREI A CONTA · ESCOLHI ERRADO** (2s, opcional, não bloqueia).
- Modelo: adicionar `errorType?: 'nao-vi' | 'errei-conta' | 'escolhi-errado'` ao
  TrainingLog (e ao PendingTrainingItem se fizer sentido p/ revisão). Migração Dexie
  se virar campo indexado (não precisa indexar — campo simples, sem migração de schema).
- Tom Lemos no rótulo: "O que falhou?" → as 3 opções. Sem juízo.

### 1b. Autoexplicação de 1 frase (GLM 5.2)
Antes de revelar a solução (ou no fechamento, o que for menos intrusivo no fluxo
atual), um campo curto opcional: "Por que esse lance?" (self-explanation effect).
- Modelo: `selfExplanation?: string` no TrainingLog. NÃO obrigatório (TDAH — fricção
  zero); é um convite, não uma trava.

### 1c. Roteamento do gerador pela taxonomia (GLM 5.2 — núcleo pedagógico)
O errorType refina o que o gerador prescreve (council). Estender as regras por sinal
local em src/domain/plan/generatePlan.ts (e/ou um módulo novo src/domain/method/errorRouting.ts):
- `nao-vi` predominante → subir VOLUME de reconhecimento/detecção (DAMP-scan, temas
  rotulados; estágio mais apoiado).
- `errei-conta` predominante → drill de CÁLCULO (CCT/forcings).
- `escolhi-errado` predominante → SELEÇÃO de candidatos (listar 2-3 candidatos +
  prever resposta) — a fronteira real ≥1400.
- "Predominante" = maioria nos últimos N erros do tema (derivar dos TrainingLogs;
  reusar a convenção de janela de recentActivity/consistency). Sem rating.

### 1d. Testes (TDD)
- Roteamento: dado um histórico com errorType X predominante → o plano enfatiza o
  drill correto (Y). Casos para as 3 taxonomias + sem dado (fallback atual).
- Captura: TrainingLog aceita errorType/selfExplanation; persistência round-trip.
- UI: o seletor de 1 toque aparece SÓ em feedback 'hard'; não aparece em easy/good.
  Copy passa BANNED_PHRASES.

## FASE 2 — Escada de ensino até 2400 (FM)

> Council: o teto REAL é 2200 (acima disso o sinal local colapsa); 2400 é stretch
> aceito pelo dono. Implementar como ESBOÇO honesto, marcado como teto aspiracional —
> NÃO inventar densidade de método que o acervo não cobre (1800+ é só esboço).

### 2a. Banda (GLM 5.2)
- Estender LearnerBand (src/domain/types.ts) com a faixa até 2400 (ex.: adicionar
  '2200-2400' à união; conferir as 7 bandas atuais e como bandProgression.ts mapeia).
- Migração Dexie v(N): perfis com banda atual não quebram (ver o padrão de migração
  em src/infra/storage/db.ts — migrateLegacyBand). Teste de migração.

### 2b. Currículo 2200-2400 (GLM 5.2)
- Adicionar à escada (onde vive o currículo por banda — curriculum/diplomas) a faixa
  2200-2400 com 3 eixos do council: (1) cálculo profundo multi-variante (3+ linhas,
  6+ lances); (2) preparação por princípio + estrutura (não decoreba); (3) finais
  teóricos (tablebase como destino de estudo). Marcar `aspiracional: true` ou comentar
  que acima de 2200 o método é esboço (sinal fraco).
- NÃO prometer rating. Acima de 2200, enquadrar como "estrutura de autoestudo", não
  "método-puzzle" (o app vira mais organizador).

### 2c. Testes
- Migração de banda; geração de plano não quebra nas novas faixas; gates verdes.

## Execução
GLM 5.2 via opencode executa Fase 1 → Fase 2, guiado por este plano (lê o código p/
achar os hooks exatos). TDD. Se GLM stall/gates falharem 3x → escala p/ Sonnet/Opus.
Opus revisa classes de risco (modelo de dados, migração, escopo) + roda gates.
NÃO merge/deploy sem OK do dono. Ao fim: AUDITORIA FINAL (council + Opus).

## NON-GOALS
- Sem engine, sem ajuda ao lance ao vivo (Fair Play). Sem prometer rating.
- Não ir além de 2400. Não inventar conteúdo de mestre que o acervo não cobre.
- Sem gamificação vazia / 'parabéns' / confete.
- Não tocar M2a/DD-Ped6/M-Retenção/R2b já em produção além do necessário p/ o sinal.
