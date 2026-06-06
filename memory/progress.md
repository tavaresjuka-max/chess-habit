# Progresso

## Planejamento

- [x] Escopo definido (ferramenta pessoal Lichess-first, adaptativa).
- [x] Separacao do app pago anterior (clean-room reafirmado).
- [x] Modelo gratuito/aberto definido.
- [x] Auditoria estrategica por outras IAs — concluida.
- [x] Revisao do spec unificado por tres IAs — concluida; correcoes aceitas.
- [x] Decisao do dono: moldura **pessoal primeiro, comunidade depois**.
- [x] Spec de execucao escrito (`2026-06-06-rotina-pessoal-adaptativa-design.md`).
- [x] Regras e docs atualizados (AGENTS, PLANO, decisions, state, ADRs).
- [x] Rodada 2 de revisao (Codex, Antigravity, DeepSeek) — convergiu; zero P0 de governanca; aprovado com correcoes.
- [x] Correcoes de consenso aplicadas no spec (Adendo 22).
- [x] Plano de execucao P0 escrito (`docs/superpowers/plans/2026-06-06-plano-execucao-P0.md`).
- [x] Executar P0 (scaffold + dominio + plano fixo + PWA minimo) — concluida.
  - [x] Tarefa 1: scaffold Vite limpo.
  - [x] Tarefa 2: estrutura de camadas e regra de isolamento do dominio.
  - [x] Tarefa 3: tipos do dominio.
  - [x] Tarefa 4: allowlist estatica de destinos Lichess.
  - [x] Tarefa 5: time budget + gerador de plano fixo.
  - [x] Tarefa 6: persistencia local com Dexie.
  - [x] Tarefa 7: UI minima Hoje + Config.
  - [x] Tarefa 8: PWA minimo.
  - [x] Tarefa 9: gate final e privacidade.

## Fases De Codigo

- [x] **P0** Scaffold limpo + dominio tipado (Signal/Weakness/Plan) + gerador sensivel a tempo.
- [ ] **P1** Coletor Lichess publico + detector de fraquezas + plano adaptado.
- [ ] **P2** Loop de valor: feedback facil/dificil + regen + tema semanal.
- [ ] **P3** Sync PC<->celular opt-in (merge por registro, D1).
- [ ] **P4** Multi-fonte leve: Chess.com `/stats` + "outro estudo" texto livre.
- [ ] **P5** Versao-comunidade: renomear, OAuth PKCE, disclaimers, i18n, polish.
