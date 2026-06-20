# Prompt para o Codex — criticar o relatório do council

Cole isto no Codex, rodando na raiz do repo `lichess-tutor` (marca "Chess Habit").

---

## Contexto

PWA local-first de treino de xadrez. Stack: React 19 + Vite + TypeScript + Dexie (IndexedDB); camadas **puras** domain/app/infra/ui; testes Vitest (667 passando) + Playwright; deploy estático Vercel. Usuário-alvo: **dono único, TDAH, iniciante** (jornada 0→autonomia); prioriza metas pequenas, números visíveis, baixa fricção.

Um "council" de 6 agentes levantou tudo que pode ser feito e o resultado foi consolidado em:

**`docs/review/COUNCIL-relatorio-2026-06-19.md`** — leia este arquivo inteiro primeiro.

## Sua tarefa: criticar o relatório com rigor (NÃO implementar nada)

Você é um revisor adversarial. Não seja gentil nem concorde por inércia. Valide cada afirmação **contra o código real** (cite `arquivo:linha`). Entregue uma crítica acionável que vai virar o plano de implementação.

Faça, nesta ordem:

1. **Valide os diagnósticos de maior peso lendo o código:**
   - **§1.1 Chess.com mudo (294 sinais → 0 fraquezas).** A causa dupla está certa? Confira: (a) `filterFreshSignals` em `src/domain/weakness/detectWeaknesses.ts` realmente descarta sinais agregados do Chess.com pela janela de 90 dias? Como `observedAt` é setado p/ sinais Chess.com em `src/infra/chesscom/extractSignals.ts`? (b) `ACCURACY_LOW_RATE_BEGINNER` realmente é alto demais? `rating`/`color`/`time-control` realmente retornam `[]`? A correção proposta (exceção do filtro + baixar limiar p/ ~0.5) destrava de verdade, ou há um terceiro gargalo? Proponha a correção mínima correta com `arquivo:linha`.
   - **§0 (correção de premissa).** Confirme que o diploma por acurácia JÁ está plugado em `reconcileLichessResults` (`src/app/useStudyActions.ts` → `applyDiplomaProgress`/`evaluateDiplomaSections`/`saveDiplomaAttempt`/`promoteBandForDiplomas`) e que só dispara no "Conferir puzzles" (não no auto-sync). O council ou o relatório erraram em mais alguma coisa parecida (afirmação desatualizada sobre código que já existe)?
   - **§1.2 computeMastery desconectado** e **§1.4 graduação sem guard de acurácia**: confirme que são reais e que a correção proposta usa dados já disponíveis.

2. **Cace o que o relatório PERDEU.** Liste itens que faltaram (bugs, dívidas, riscos, melhorias pedagógicas/UX/dados) que um revisor que leu o código encontraria e o relatório não cita.

3. **Conteste prioridades e esforços.** Onde o valor/esforço (P/M/G, alto/médio/baixo) está errado? O que deveria subir ou descer? Há item "alto" que na verdade é cosmético, ou "baixo" que é risco sério?

4. **Cheque a sequência (§5).** A ordem de implementação faz sentido? Há dependências entre itens (ex.: precisa de X antes de Y)? Algum item que, se feito sozinho, quebra outro?

5. **Risco de regressão.** Para os itens do Tier 1, aponte o que pode quebrar (testes existentes, contratos de transação como "log+plano numa transação só", determinismo de data já corrigido).

## Formato da resposta

Markdown, conciso e específico (sempre com `arquivo:linha` quando afirmar algo sobre o código):

- **Veredito por item do relatório:** `CONFIRMA` / `REFUTA` / `AJUSTA` + 1-2 linhas de evidência no código.
- **Itens faltando:** lista nova (título, problema com `arquivo:linha`, proposta, valor, esforço).
- **Reordenação proposta:** a sequência que VOCÊ recomenda para implementação, com justificativa curta.
- **Top 5 para fazer primeiro** e por quê.
- **Armadilhas de regressão** a vigiar.

Não escreva código nem altere arquivos. Só a crítica.
