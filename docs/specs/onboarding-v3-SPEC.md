# SPEC — Onboarding v3 (Lichess-é-a-escola + acolhimento chess.com)

- **Status:** ✅ IMPLEMENTADO E MERGEADO em `master` (2026-07-02, merge commit `fe00ecc`). Gates: 1604/1604 testes, TS limpo, ESLint limpo, build+PWA ok. Bug crítico do header `Accept: application/json` no `/api/import` pego em teste ao vivo e corrigido antes do merge. Aprovado pelo dono (2026-07-02, "siga implementação por glm"); executor: GLM 5.2 (texto) + aplicador barato + gates. **Falta só validação de produto** (gate dos 30 iniciantes) e revisão humana do texto de ToS — não há trabalho de código pendente.
- **Origem:** proposta Fable v1 → council VERIFICAR (GLM 4/10, DeepSeek 7/10) → **Fugu-maestro (rodízio) adjudicou 5/10 e reescreveu** → selo leve Fable com correção técnica (evals exigem análise no Lichess; automatizável = fetch+import, não a análise)
- **Spike validado (2026-07-02):** `POST https://lichess.org/api/import` funciona ANÔNIMO (teste real → `lichess.org/nJQmQMRZ`). API pública do chess.com NÃO busca partida por ID — fluxo assistido usa username → arquivos mensais → escolha da partida.

## Tese

O visitante abandona porque em 60s não responde: (1) o que o app faz, (2) por que Lichess,
(3) cadê o progresso se trocar de aparelho. Mensagem-mestra (copy POSITIVA, decisão do council —
nunca "aqui você não joga"):

> **"Você treina no Lichess; eu organizo, corrijo e salvo seu plano."**

Papéis: **Lichess = sua escola e seu cofre** (onde os exercícios acontecem, grátis; conectar =
sync + acompanhamento automático). **Chess.com = só leitura, opcional** (partidas públicas para
diagnóstico; sem login).

## ON-A — Copy do Welcome (S)

- Nova linha-mestra após a fala do Tavarez (copy acima, tom Tavarez).
- Bullet novo: "Não tem conta no Lichess? É grátis — te levo lá."
- NÃO remover as 3 portas existentes.

## ON-B — Contas com papéis + CTA de signup (M)

- AccountsStep (Onboarding.tsx) reescrito em 2 blocos com título de papel:
  - **Lichess — sua escola e seu cofre**: [Conectar Lichess] + **[Criar conta grátis]**
    (abre `https://lichess.org/signup` em nova aba `noopener`; o funil JÁ persiste em
    sessionStorage e sobrevive à volta — reforçar dica "crie e volte aqui").
  - **Chess.com — só leitura (opcional)**: username, hint "uso suas partidas públicas
    para o diagnóstico — sem login, sem senha".
- Mensagens tardias viram convites: SyncPanel "Faça login com o Lichess antes de sincronizar."
  → "Conectar Lichess para sincronizar — não tem conta? Criar grátis (1 min)" (com o mesmo
  link signup). Idem no fold de conexão da Config.

## ON-C — Autópsia chess.com assistida (M/L) — A MÁQUINA TRABALHA

Council: "PGN manual = abandono (>90%)". Fluxo assistido:

1. Input da autópsia detecta URL do chess.com (ou o usuário informa username chess.com;
   se já existe no perfil, usa direto): busca os arquivos mensais públicos
   (`api.chess.com/pub/player/{u}/games/{Y}/{M}`, client base JÁ existe em
   src/infra/chesscom/), lista as últimas ~10 partidas (data, cor, oponente, resultado).
2. Usuário escolhe a partida → app **importa sozinho** o PGN via `POST lichess.org/api/import`
   (anônimo ok; rate-limit tratado com backoff + mensagem honesta).
3. Tela de 1 instrução: "Importei sua partida para o Lichess. Toque em **Solicitar análise**
   lá e volte — eu continuo daqui." (deep-link para o jogo importado; se o Lichess pedir
   login para analisar, o texto acolhe: "é a deixa para criar sua conta grátis — te espero").
4. Botão "Já pedi a análise" → app re-consulta o export (fetchGameForAutopsy já trata
   no-analysis) com re-tentativa educada; quando os evals chegam → autópsia normal.
5. PGN manual (lichess.org/paste) vira SÓ fallback num fold "outra forma de trazer a partida".

Robustez obrigatória (ON-D embutido): perfil chess.com privado/404 → mensagem honesta;
sem partidas no mês → busca mês anterior (máx 2); rate-limit chess.com/lichess → backoff +
copy honesta; import falhou → fallback manual. NUNCA fabricar análise (ADR-006).

## ON-7 — NON-GOAL registrado (decisão do dono, sustentada unânime pelo council)

**NÃO portar estudos/treino para o chess.com.** Racional triplo: (a) técnico — API pública é
read-only, não existe rotear puzzle/estudo por tema nem deep-link equivalente; (b) estratégico —
dobra a superfície de manutenção para plataforma fechada/paga; (c) missão — bases abertas.
O usuário chess.com NÃO é perdido: diagnóstico já lê chess.com (ADR-008) + ON-C o acolhe pela
própria dor. Reavaliação só se o chess.com abrir API de conteúdo.

## Gate (entra no protocolo dos 30 iniciantes — pré-registrado)

- P1 consegue o 1º treino sem criar conta.
- **P3: ≥70% chegam de username/link chess.com até "erros agendados" SEM tocar em PGN.**
- ≥70% explicam de volta: "o app organiza; o treino acontece no Lichess".
- Técnicos: allowlist/sanitização de URL (parseGameRef já cobre lichess; estender detecção
  chess.com), chess.com 200/403/404/rate-limit testados, OAuth cancelado/timeout com UX,
  import rate-limited, merge local→sync idempotente (sanitize já shippado).
- **"Se PGN manual continuar sendo o caminho principal do P3 → reprova."**
