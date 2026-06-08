# Decisoes

## 2026-06-06: Projeto Separado

Decidido criar `lichess-tutor` separado do app pago anterior. Motivo: evitar confusao de escopo, conteudo, nome, dados e arquitetura.

## 2026-06-06: Lichess-first

O app sera construido ao redor do Lichess por ser aberto, gratuito, documentado e alinhado ao modelo do produto.

## 2026-06-06: PWA Com Sync — REVISADA em 2026-06-06

**Original:** O produto deve funcionar em computador e mobile. PWA foi escolhida como primeira distribuicao. Sync entre dispositivos exige backend minimo.

**Revisao do Diretor Geral:** Sync e backend adiados para Fase 2. MVP Fase 1 sera PWA local-first sem backend. Sync permanece como objetivo de longo prazo.

## 2026-06-06: Gratuito E Aberto

Modelo definido: gratuito, open-source, AGPL-3.0 planejada, doacao externa e sem recurso pago funcional. **Mantido.**

## 2026-06-06: Sem Tabuleiro Proprio No MVP

O MVP nao deve repetir a dificuldade mecanica do app anterior. O treino abre no Lichess; o tutor organiza, mede e orienta. **Mantido e reforcado.**

## 2026-06-06: Governanca Multi-IA Da Auditoria Global

Decidido que Claude sera o Diretor Geral da auditoria estrategica: ele consolida os relatorios, arbitra divergencias e emite diretivas. Codex sera o Executor: realiza apenas tarefas claras, pequenas e verificaveis, sempre subordinado ao `AGENTS.md`. DeepSeek e Gemini serao Consultores: suas analises entram como insumo critico, mas nao tem autoridade final.

Essa governanca vale especialmente para os relatorios do fluxo `global-strategic-audit`. Nenhuma IA pode aprovar implementacao, app, backend, banco, `package.json`, `src` ou dependencias enquanto a fase de implementacao nao estiver formalmente aprovada.

## 2026-06-06: Consolidacao Do Diretor Geral

Apos receber os relatorios Codex e Antigravity, o Diretor Geral (Claude) emitiu:

### Decisao 1: Renomeacao Obrigatoria
Nome publico "Lichess Tutor" rejeitado. Nome de trabalho interno mantido. Novo nome sera escolhido via experimento na Fase 0.

### Decisao 2: MVP Local-First Puro
MVP sem backend, sem OAuth, sem sync, sem Chess.com. PWA com IndexedDB, regras locais, username Lichess opcional, foco 0-1200.

### Decisao 3: Fase 0 de Validacao
Nenhum codigo antes de validar: experimento de nome, landing page, 20 entrevistas, piloto manual com 10 usuarios, prototipo Figma.

### Decisao 4: Arquitetura em Tres Fases
Fase 0 (validacao sem app) → Fase 1 (MVP local-first) → Fase 2 (sync + OAuth + Chess.com) → Fase 3 (expansao 1200-2000, i18n).

### Decisao 5: Professor Lemos Como Tom
No MVP, Professor Lemos e tom de voz (microcopy), nao promessa de tutor ou personagem central. Expansao futura se usuarios responderem bem.

### Decisao 6: Chess.com Adiado
Importador Chess.com movido para Fase 2+. Foco total em Lichess.

### Decisao 7: Sem Tabuleiro Proprio Mantido
Reafirmado e permanente para Fase 1.

Fonte: `docs/review/relatorio-claude-diretor-geral-consolidado-2026-06-06.md`

## 2026-06-06: Decisao Do Dono — Moldura Pessoal-Primeiro (SUBSTITUI parte da consolidacao acima)

Apos receber tres relatorios revisando o spec unificado (Codex "Spec em Xeque", Claude/DeepSeek
consolidacao, Antigravity), o **dono** esclareceu que isto e, antes de tudo, uma **ferramenta pessoal**
para ele estudar no Lichess, a ser compartilhada com a comunidade apenas depois, se ficar boa.

Decisao: adotar a moldura **pessoal primeiro, comunidade depois**.

Consequencias que substituem decisoes anteriores:

- **A "Fase 0 de validacao de mercado" (entrevistas, landing, waitlist, piloto manual) NAO se aplica
  a ferramenta pessoal.** O dono e a propria validacao. Esse frame fica reservado para a versao-
  comunidade (Fase P5). (Substitui a Decisao 3 da consolidacao para o escopo pessoal.)
- **A fase de codigo foi aberta pelo dono.** Codigo permitido em `lichess-tutor`.
- **Escopo adaptativo e multi-fonte aprovado, porem faseado:** Lichess (P1), adaptacao (P2), sync (P3),
  Chess.com leve (P4). (Atualiza as Decisoes 2 e 6 da consolidacao: nao sao cortados, sao faseados.)
  **Nota posterior:** roadmap revisado apos P0: Chess.com ficou P1, Study/OAuth P3 e sync P4.
- **Renomeacao e OAuth ficam para a Fase P5 (comunidade).** Na ferramenta pessoal (um usuario), nome
  interno basta e nao ha OAuth. **Nota posterior:** a parte de OAuth foi substituida pela decisao
  "OAuth Permitido Pelo Dono Para Evolucao Futura" abaixo; renomeacao publica continua em P5.

Correcoes tecnicas/legais dos tres relatorios **aceitas integralmente**:

- Clean-room: app novo do zero; proibido herdar codigo/assets de `chessking-tutor`/`chessking-assets`.
- ChessKing **nao** e fonte nem taxonomia no app; estudo externo vira fonte generica "outro" (texto livre).
- Tipos estritos (sem `value: unknown`; union discriminada por `kind`).
- Sync por registro (timestamp por item, preserva `done`), adiado para depois do valor; D1 preferido a KV.
- Slugs de tema do Lichess validados dinamicamente.
- Erro/offline/migracao especificados.
- Linguagem de fraqueza como hipotese; sem promessa de rating.

Spec de execucao vigente: `docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md`.
ADRs: ADR-004 (pessoal-primeiro), ADR-005 (clean-room/sem ChessKing), ADR-006 (revisado: OAuth
opt-in para Study, sem engine/escopos de jogo), ADR-007 (sync depois do valor, por registro). Spec
unificado anterior: superseded.

## 2026-06-06: Banda E Chess.com Antecipado

- Banda inicial do dono confirmada: **800-1200** (tema fixo de P0 = `fork`).
- O dono joga no Chess.com (amigos la). Decisao: **Chess.com promovido a fonte primaria de
  diagnostico e antecipado para P1**, com uso mais completo da API publica (`/stats` + arquivos
  mensais recentes de partidas), nao so o snapshot `/stats`. Parse de PGN transiente; guardar so
  sinais derivados; nunca PGN completo; sem PII de perfil; bound de recencia (~3 meses/~100 jogos).
  Destinos de treino seguem no Lichess. Lichess vira fonte de diagnostico secundaria (P2). Ver ADR-008.
- Rodada 2 de revisao (Codex, Antigravity, DeepSeek): convergiu, aprovado com correcoes ja aplicadas
  no spec (Adendo 22). Plano P0 atomico escrito. Nao e necessaria nova rodada de debates para iniciar.

## 2026-06-06: OAuth Permitido Pelo Dono Para Evolucao Futura

O dono decidiu: **"vamos usar oauth sim"**. A P0 permanece sem rede/OAuth, mas a decisao remove a
restricao anterior como direcao de produto futura. Reconciliacao aplicada em `AGENTS.md`, `PLANO.md`,
ADR-006 e spec: OAuth PKCE e opt-in, restrito a `study:write` para Study e `puzzle:read` para
reconciliar puzzles, tokens somente locais, sem escopos de jogo e sem ajuda durante partidas ao vivo.

## 2026-06-06: Ajuste Do Signal De Cor Para P1

Durante a implementacao P1, o contrato `SignalValue.kind === 'color'` foi ajustado para incluir
`games`. Motivo: o Adendo 22.2 exige minimo de partidas para disparar a hipotese de desequilibrio
entre brancas e pretas; sem `games`, o detector teria que adivinhar frequencia ou persistir sinais
por partida. O app continua persistindo apenas sinais derivados, nunca PGN completo.

## 2026-06-06: Puzzle Activity Como Leitura Opt-In

O dono pediu que concluir um treino tente salvar como foi o resultado do exercicio no Lichess. A API
oficial exige OAuth `puzzle:read` para `/api/puzzle/activity`. Decisao: permitir `puzzle:read` como
escopo opt-in minimo de leitura para reconciliar resultado de puzzles, sem `puzzle:write`, sem escopos
de jogo, sem engine, sem token em logs/export/bundle. Enquanto OAuth nao estiver ligado, o app salva
timer/log local (`startedAt`, `completedAt`, `elapsedSeconds`) e pode reconciliar depois.

## 2026-06-06: P3 Fechada E P4/P5 Congeladas

O dono pediu para fazer tudo ate P3 completo e congelar P4/P5. Decisao aplicada:

- P0-P3 ficam como escopo atual da ferramenta pessoal.
- P4 (sync PC<->celular, backend/D1, merge por registro e texto livre "outro estudo") fica congelada.
- P5 (versao-comunidade, renomeacao publica, disclaimers publicos, i18n, polish e revisao publica)
  fica congelada.
- Study gerado em P3 e privado por padrao. Estudo publico/seguivel para outros usuarios e assunto de P5,
  nao da ferramenta pessoal atual.
- Escopos OAuth ativos no app pessoal: `puzzle:read` e `study:write`; sem escopos de jogo, sem
  `puzzle:write`, sem mensagens, sem engine.

## 2026-06-08: Licao Guiada Nao Deve Repetir Todo Dia

Uso real mostrou que o foco fixo `fork` na faixa 800-1200 fazia o app abrir a mesma licao guiada do
Lichess Practice em dias diferentes. Decisao: o plano novo deve consultar o plano anterior salvo como
memoria de progresso, e feedback `good` depois de `guided` avanca para `retrieval`. Assim a rotina
passa para puzzle theme variado (`/training/fork`) em vez de repetir o mesmo Practice estatico; `hard`
continua voltando para explicacao.
