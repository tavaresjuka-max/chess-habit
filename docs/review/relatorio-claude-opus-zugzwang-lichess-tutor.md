# Relatorio De Auditoria: Zugzwang

- IA/autoria: Claude (Anthropic), modelo claude-opus-4-8
- Nome proprio do relatorio: Relatorio Zugzwang
- Data da analise: 2026-06-06
- Versao dos documentos analisados: pasta local `lichess-tutor` (fase planejamento/auditoria, sem codigo). Documentos lidos: README, PLANO, AGENTS implicito, memory/*, docs/architecture/*, docs/integrations/*, docs/privacy/*, docs/pedagogy/*, docs/ux/*, docs/research/sources, ai-audit-pack.
- Sugestao de nome de arquivo: relatorio-claude-opus-zugzwang-lichess-tutor.md

> Por que "Zugzwang": e a posicao em que voce e obrigado a mover, e todo movimento piora algo. O projeto esta nessa posicao por um motivo concreto descoberto nesta auditoria (secao Fatos), e o relatorio existe para escolher o lance menos ruim com clareza.

---

## 0. Como Ler Este Relatorio

Separo deliberadamente:

- **FATO**: verificavel em fonte com data.
- **INFERENCIA**: deducao minha a partir de fatos.
- **OPINIAO**: julgamento estrategico meu, contestavel.

Datas de pesquisa: 2026-06-06. Fontes no fim.

---

## 1. Veredito Executivo

**OPINIAO.** O Lichess Tutor, como esta escrito hoje, e um bom projeto pessoal e um fraco projeto de empresa. A ideia central — "organizar a rotina de estudo de quem ja usa Lichess e abrir a tarefa certa" — e legitima e tem dor real. Mas tres coisas mudaram o tabuleiro:

1. **FATO.** Em 27/01/2026 o proprio Lichess lancou uma feature oficial chamada **Chess Tutor** (`lichess.org/tutor`, em beta), que analisa as partidas do jogador e mostra forcas/fraquezas — exatamente a camada de diagnostico que o seu MVP usaria como porta de entrada. O nome do seu projeto agora colide frontalmente com uma feature oficial do Lichess. (Forum Lichess; X/Nikhil Dixit; YouTube "I Tested The New Lichess Tutor Feature").
2. **FATO/INFERENCIA.** O espaco "analisa seus jogos e te diz o que treinar" ja e ocupado por Aimchess (US$7,99/mes, conecta Lichess/Chess.com, plano personalizado a partir das suas partidas) e parcialmente por DecodeChess, Dr. Wolf e Noctie. O seu diferencial declarado (analisar historico + plano semanal) e, em boa parte, commodity em 2026.
3. **INFERENCIA.** O seu "moat" real nao e a analise nem o plano. E **a curadoria opinativa em PT-BR com voz de professor (Lemos) + a disciplina anti-cassino + o fato de ser 100% gratis e aberto**. Isso e defensavel, mas e nicho, e nao justifica a complexidade tecnica que o plano atual ja assume (backend, D1, sync por eventos, OAuth).

Em uma frase: **a tese de produto e razoavel, mas o plano tecnico esta caro demais para o que ainda precisa ser validado, e a marca esta em rota de colisao com o Lichess.**

## 2. Nota Geral De Atratividade

**6.0 / 10** como projeto open-source de comunidade (PT-BR, gratuito, voz propria).
**3.5 / 10** como projeto com tese de "empresa global avaliando entrar no mercado" — que e a postura que o proprio prompt pediu que eu adotasse.

Justificativa: dor real (+), execucao barata possivel (+), mas mercado lotado (-), dependencia critica de uma unica plataforma que acabou de invadir seu territorio (-), sem moat economico (-), sem modelo de receita (por escolha) (-).

## 3. Tese De Oportunidade

**OPINIAO.** A oportunidade nao e "mais um analisador". E **"o treinador que decide por voce e te tira da paralisia de escolha"**. O ativo escasso do estudante 0-1200 nao e informacao (ha infinita e gratis), e **direcao + constancia + ausencia de culpa**. Nenhum dos grandes resolve isso com tom humano em PT-BR. Esse e o vao real. Mas e um vao de *experiencia e curadoria*, nao de *tecnologia*.

## 4. Principais Pontos Fortes

| # | Forte | Evidencia | Por que importa |
|---|-------|-----------|-----------------|
| 1 | Disciplina de escopo | PLANO "Nao Escopo", do-not-do, ADRs | Raro num projeto solo. Evita o erro classico de recriar tabuleiro. |
| 2 | Postura de privacidade-por-design | privacy-and-data, "evitar token long-lived", sinais derivados | Reduz risco legal e de seguranca antes de existir codigo. |
| 3 | Voz de produto definida (Lemos) | professor-lemos.md, banlist | Diferencial emocional defensavel; e o que NINGUEM copia facil. |
| 4 | Modelo etico coerente | AGPL-3.0, sem paywall, doacao externa | Alinha com a cultura Lichess; bom para distribuicao na comunidade. |
| 5 | Documentacao madura antes de codar | toda a pasta docs/ | Permite auditoria (como esta) sem custo de refatorar codigo. |
| 6 | Regra de fair play interiorizada | "tutor calado durante partida ao vivo" | Mitiga o risco P0 de parecer assistencia/cheating. |

## 5. Principais Pontos Fracos

| # | Fraco | Por que importa | Severidade |
|---|-------|-----------------|------------|
| 1 | Nome "Lichess Tutor" colide com feature oficial homonima | Confusao de marca, percepcao de oficial, risco de pedido de takedown | P0 |
| 2 | Backend + D1 + sync por eventos no MVP | Custo, tempo e superficie de risco para algo nao validado | P0 |
| 3 | Sem moat economico nem tecnico | Aimchess/DecodeChess/Lichess fazem o "core" melhor | P1 |
| 4 | "Plano por regras locais" e vago | E o coracao do produto e esta sub-especificado | P1 |
| 5 | Metrica de aprendizado depende de sinais que voce nao controla | Lichess pode mudar API; sinais ruidosos (blitz, multiconta) | P1 |
| 6 | Faixa 0-2000 ampla demais | Dilui curriculo e marketing | P1 |
| 7 | Sem nenhuma validacao com usuario real ainda | Risco de construir certo a coisa errada | P0 (de processo) |
| 8 | Token: contradicao latente entre "sync automatico" e "nao guardar token" | Ou o produto promete demais, ou guarda o que disse que nao guarda | P1 |

## 6. Riscos P0/P1/P2

**P0 — podem matar ou descarrilar o projeto**

- **R1 Colisao de marca com `lichess.org/tutor`.** FATO: feature oficial existe desde 27/01/2026. INFERENCIA: usar "Lichess Tutor" como nome publico induz a erro de oficialidade (vedado pelo seu proprio aviso de nao-afiliacao) e te poe na mira de moderacao. *Mitigacao:* renomear o produto publico (mantendo "para Lichess" como descritor). *Esforco:* baixo agora, altissimo depois do lancamento. *Validar:* buscar nome livre + checar ToS de uso de marca.
- **R2 Canibalizacao pela plataforma.** O risco teorico "e se o Lichess fizer isso?" ja se materializou parcialmente. *Mitigacao:* posicionar no que o Lichess explicitamente NAO faz (rotina diaria prescritiva + tom humano + constancia), nao no diagnostico. *Validar:* mapear gap exato entre lichess/tutor e sua proposta.
- **R3 Construir antes de validar.** Zero contato com usuario. *Mitigacao:* fase 0 sem app (secao 19/22). *Validar:* 10 entrevistas + 1 piloto manual.

**P1 — degradam fortemente**

- **R4 Fair play / percepcao de assistencia.** FATO: ToS e Fair Play do Lichess proibem assistencia externa em tempo real. Seu design ja mitiga ("tutor calado ao vivo"), mas o NOME "tutor" + deep links durante sessao de jogo podem ser mal lidos. *Mitigacao:* disclaimers, nunca abrir treino sobre uma partida em andamento, nunca sugerir lances.
- **R5 Rate limit / dependencia de API.** FATO: Lichess pede 1 request por vez, esperar >=1 min apos 429. Importacao Chess.com idem. *Mitigacao:* cache agressivo de sinais derivados, backoff, nunca paralelizar.
- **R6 Custo com usuarios pesados.** Sync por eventos + pulls frequentes podem gerar leitura D1 desproporcional. *Mitigacao:* (ver secao 14).
- **R7 Token long-lived vs sync automatico.** Contradicao de design.

**P2 — vigiar**

- R8 LGPD/GDPR para menores (xadrez tem muitos menores). R9 Internacionalizacao tardia trava crescimento. R10 Sustentabilidade so por doacao. R11 Sinais pedagogicos ruidosos gerando recomendacao ruim (risco reputacional do "tutor que erra").

## 7. Analise De Mercado

**FATO (pesquisa 2026-06-06).** O mercado de treino de xadrez online em 2026 esta maduro e segmentado:

- **Plataformas-mae**: Lichess (gratis, open-source, doacao) e Chess.com (freemium, Gold US$4,17/mes ate Diamond ~US$99/ano; ja integrou Chessable/Courses e MoveTrainer).
- **Camada de melhoria/analytics**: Aimchess (US$7,99/mes, US$57,99/ano), DecodeChess, Noctie (AI trainer), Dr. Wolf (coach/tutor conversacional).
- **Camada de memorizacao**: Chessable/MoveTrainer (repeticao espacada; cursos US$10-60+).
- **Gratuito/open-source**: Lucas Chess (desktop), Listudy (repeticao espacada OSS), OpeningTree (arvore de aberturas OSS).

**INFERENCIA.** O dinheiro novo do setor esta indo para (a) cursos com IP de GMs (Chessable/Courses) e (b) coach com IA conversacional. "Organizador de rotina gratuito" nao e onde o capital flui — o que e bom (menos concorrencia bem-financiada direta) e ruim (mercado nao valida disposicao a pagar por isso; voce ja decidiu nao cobrar, entao ok).

**OPINIAO.** Tamanho de mercado para a SUA fatia (estudante 0-1200, PT-BR, quer rotina gratis e humana) e pequeno em receita, mas razoavel em usuarios e altamente alinhado a distribuicao organica/comunidade. Como negocio: pouco atraente. Como bem publico/portfolio/comunidade: atraente.

## 8. Analise De Concorrentes (Matriz)

Legenda: S=sim, N=nao, P=parcial. Preco em 2026-06-06.

| Produto | Preco/modelo | Personaliza | Usa Lichess | Usa Chess.com | Analisa partidas | Plano diario | Tutor/coach | Mobile | Offline/PWA | Open-source | Risco p/ voce | Diferenciacao possivel |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Lichess (nativo) + lichess/tutor** | Gratis/doacao | P | S | N | S | N | P (beta) | S | P | S | **ALTO** | Lichess diagnostica, nao prescreve rotina diaria nem fala humano |
| **Chess.com** | Freemium ~US$5-99 | S | N | S | S | P (Courses) | P | S | N | N | Medio | Voce e gratis e Lichess-first |
| **Aimchess** | US$7,99/mes | S | S | S | S | P (semanal) | N | S | N | N | **ALTO** | Voce e gratis, opinativo, PT-BR, anti-cassino |
| **Chessable/Courses** | US$10-60/curso | P | N | S | N | N (revisao SR) | N | S | N | N | Baixo | Voce nao vende conteudo; organiza treino existente |
| **DecodeChess** | Freemium | P | S(import) | S(import) | S (explica) | N | P | S | N | N | Medio | Voce foca rotina, nao explicacao de lance |
| **Dr. Wolf** | Freemium app | S | N | N | P | N | S (conversa) | S | N | N | Medio | Voce usa Lichess real, nao tabuleiro proprio |
| **Noctie** | Freemium | S | P | N | P | N | S (AI) | S | N | N | Medio | Idem |
| **ChessTempo** | Freemium/assinatura | P | N | N | P | N | N | S | N | N | Baixo | Voce orquestra, nao e banco de puzzles |
| **Lucas Chess** | Gratis | P | N | N | S | N | N | N (desktop) | N | S | Baixo | Voce e PWA mobile + Lichess |
| **Listudy** | Gratis/OSS | N | N | N | N | N | N | S | P | S | Baixo | Voce adiciona plano + sinais |
| **OpeningTree** | Gratis/OSS | N | S | S | P | N | N | P | N | S | Baixo | Idem |
| **Planilha/rotina manual** | Gratis | S (humano) | S | S | S | S | S | S | S | - | Medio | Voce automatiza a planilha que jogadores ja mantem |

**INFERENCIA-chave:** seus dois concorrentes de maior risco sao **Lichess nativo** (de graca, dentro da plataforma, sem friccao) e **Aimchess** (faz o "analisa e te diz o que treinar" ha anos). Voce nao deve competir no diagnostico. Deve competir na **prescricao diaria + tom + constancia**, que e o quadrante vazio na matriz (coluna "Plano diario" so tem P e N).

## 9. Analise De Substitutos

**OPINIAO.** O substituto mais forte nao e um app — e o **proprio Lichess + um YouTuber/coach que o aluno segue + uma planilha**. O segundo substituto e "nao fazer nada de forma organizada e so jogar blitz". Seu produto compete contra a *inercia* e contra a *gratuidade ja existente*. Isso reforca que o valor tem que ser **reducao de friccao de decisao**, nao mais conteudo.

## 10. Analise De Produto

Respostas diretas as perguntas do prompt (OPINIAO salvo indicado):

- **A dor e real?** Sim, para 0-1200: "nao sei o que estudar hoje" e universal. Para 1600-2000 a dor e menor (ja sabem se organizar).
- **Quer app ou rotina?** Quer rotina. O app e meio. Logo, o app deve quase desaparecer (1 tela "Hoje").
- **Posicionamento "tutor que abre Lichess" e claro?** Claro, mas agora perigoso pelo nome (R1).
- **Nome ajuda ou gera risco?** FATO: gera risco (feature homonima oficial).
- **Resolve algo que o Lichess ja resolve?** Diagnostico: sim, o Lichess agora resolve. Rotina prescritiva diaria com voz: nao, ainda nao.
- **0-2000 amplo demais?** Sim. **MVP deve travar em 0-1200** (idealmente 600-1200). 1600-2000 e vaidade no MVP.
- **Fluxos essenciais:** login/identificacao -> 3 perguntas -> tela Hoje -> abrir no Lichess -> marcar feito. So isso.
- **Fluxos vaidade no MVP:** sync multiplataforma automatico, importacao Chess.com, dashboard rico de progresso, multiplas faixas.
- **Aha moment:** "abri o app, em 20s ele me disse exatamente o que treinar e por que, cliquei e ja estava treinando no Lichess." Esse e o produto inteiro.
- **Risco de abrir Lichess e nao voltar:** ALTO e estrutural. Mitigacao: o valor de voltar e o *registro de constancia* e a *proxima tarefa*. Sem isso, voce e so um botao.

**Posicionamento proposto:**

- **Uma frase:** "Seu treino de xadrez de hoje, decidido por voce, aberto direto no Lichess."
- **Um paragrafo:** "Voce ja tem o Lichess. O que falta e saber o que treinar hoje e nao desistir na terceira semana. [Nome] olha seu historico, pergunta o minimo e te entrega uma tarefa por dia — curta, com motivo, aberta no Lichess com um clique. Sem cassino, sem culpa quando voce some, sem mensalidade. Gratis e aberto."
- **Landing curta:** Headline: *"O que eu treino hoje?"* Sub: *"Um plano diario de xadrez, em PT-BR, que abre direto no Lichess. Gratis. Sem anuncio. Sem mensalidade."* CTA: *"Comecar com meu usuario"*. Prova: 3 prints da tela Hoje. Rodape: *"App nao oficial, sem vinculo com o Lichess."*

## 11. Analise Pedagogica

**OPINIAO.** O curriculo 0-2000 (curriculum-0-2000.md) e solido e bem alinhado a consenso (pratica deliberada, erro->causa->tarefa->repeticao->transferencia). Pontos:

- **Forte:** o ciclo "erro/sinal -> causa -> tarefa -> repeticao -> transferencia" e exatamente a literatura de pratica deliberada + retrieval practice. As regras de adaptacao (pula dias -> reduz carga; erra tema -> repete com variacao) sao corretas.
- **Fraco/faltando 0-800:** falta um onboarding para quem nem sabe abrir conta no Lichess; falta tratar "tabuleiro/coordenadas" com Lichess Learn de forma guiada. Falta criterio de saida da faixa.
- **800-1200:** bom, mas "revisao de partidas" exige que o aluno saiba usar a analise do Lichess — precisa de micro-tutorial.
- **1200-1600 e 1600-2000:** corretos mas fora do MVP. Cortar agora.
- **Medir sem tabuleiro proprio:** voce SO consegue medir via sinais Lichess (puzzle rating, rating por ritmo, volume, temas) + auto-relato. **INFERENCIA:** isso e suficiente para *constancia* e *tendencia*, insuficiente para *prova de aprendizado causal*. Nunca prometa causalidade ("nosso plano subiu seu rating"). Prometa metodo e constancia.
- **Evitar "marcar feito sem treinar":** use o sinal objetivo do Lichess (ex.: atividade de puzzle do dia, partidas jogadas) como confirmacao parcial, em vez de confiar so no checkbox. Onde nao houver sinal, aceite auto-relato com leveza (a banlist de vergonha ja cobre o tom).
- **Sinais confiaveis:** puzzle rating, rating por ritmo ao longo do tempo, volume, dias ativos. **Ruidosos:** rating de blitz isolado, sessoes curtas, multiconta, tilt. Trate ruidosos com `confidence` (o tipo `TrainingSignal` ja prevê isso — bom).

**Metodo enxuto para MVP (proposta):** *Uma* habilidade-foco por semana (escolhida pelo tema mais fraco detectado), *uma* tarefa por dia (3 tipos rotacionados: puzzle do tema, 1 partida rapid lenta, 1 revisao), regra de retomada sem culpa. Nada de repertorio/finais teoricos no MVP.

## 12. Analise Tecnica

**OPINIAO — a critica mais importante do relatorio.** O plano tecnico esta **superdimensionado para a fase**. Voce esta projetando sync por eventos, D1, OAuth e proxy antes de ter um unico usuario.

Respostas:

- **Stack adequada?** React+Vite+TS+PWA: sim, otima e barata. Cloudflare: boa, mas o *backend em si* e prematuro.
- **O app deveria comecar sem backend?** **SIM.** INFERENCIA: tudo do MVP (perfil, plano, missoes, notas, progresso) cabe em IndexedDB local. Sync entre dispositivos e desejavel, nao essencial para validar a tese.
- **Sync por eventos necessario no MVP?** Nao. E a parte mais cara e mais arriscada (conflitos, idempotencia, seq monotono) e resolve um problema secundario.
- **OAuth sem token long-lived + sync automatico de dados Lichess?** Aqui esta a **contradicao de design (R7)**: para "atualizar progresso automaticamente" voce precisa de um token vivo em background; mas voce decidiu nao guardar token. **Resolucao:** no MVP, nao prometa atualizacao automatica em background. Use OAuth so para *identificar* o usuario e *ler sob demanda* enquanto a sessao esta ativa (ou ate so o username publico — ver alternativa A3 na secao 17). Atualizacao em background fica para uma ADR futura com opt-in explicito (interfaces.md ja diz isso — mantenha).
- **Minimo seguro se precisar de backend:** um unico Worker stateless que (a) faz o handshake OAuth PKCE e devolve uma sessao HTTP-only, (b) opcionalmente proxia chamadas Lichess para respeitar CORS/rate limit. Sem D1 ate existir sync real.
- **Tabelas minimas (quando o backend chegar):** `user(id, lichess_username, created_at)`, `sync_event(id, user_id, client_id, type, payload, seq, created_at)`. So.
- **Cachear:** sinais derivados, plano gerado, perfil. **Nunca cachear:** token, PGN bruto, dados de outros usuarios.
- **Testar offline / 2 dispositivos / conflito:** so vira problema quando houver sync; adie o problema adiando o sync.

**Arquitetura revisada (MVP local-first, sem backend):**

```
[PWA React/Vite/TS]
  |- Onboarding (3 perguntas)            -> IndexedDB: LearnerProfile
  |- Motor de plano (regras locais TS)   -> IndexedDB: TrainingPlan/DailyMission
  |- Tela Hoje (deep links Lichess)      -> abre lichess.org/* em nova aba
  |- Progresso local (constancia)        -> IndexedDB: MissionCompletion
  |- Voz Lemos (catalogo de mensagens)   -> estatico no bundle
  |- Importador opcional                 -> fetch direto Lichess/Chess.com API publica
                                            (1 req por vez, backoff em 429)
  |- Export JSON / Apagar tudo           -> 100% local
Sem servidor. Sem login server-side. Sem D1.
```

Backend e sync entram **so na fase 3 (beta)**, atras de uma ADR, quando "uso em 2 dispositivos" for uma dor comprovada por usuarios reais.

**Plano de testes MVP:** unit no motor de plano (entrada de sinais -> missao esperada), testes de contrato dos parsers de API publica (mock de payload Lichess/Chess.com), teste de PWA instalavel + offline (carregar, ficar offline, ver plano salvo).

## 13. Privacidade, Seguranca E Compliance

O documento privacy-and-data ja e maduro. Reforcos:

| Dado | Finalidade | Retencao | Risco | Mitigacao |
|---|---|---|---|---|
| username Lichess | identificar/ler sinais | ate exclusao | baixo (publico) | so isso como identidade no MVP |
| username Chess.com (opt) | importar sinais | ate exclusao | baixo (publico) | manual, opcional |
| preferencias/metas | gerar plano | ate exclusao | baixo | local-first |
| sinais derivados | gerar plano | ate exclusao | medio | nao guardar PGN bruto |
| notas do aluno | memoria de estudo | ate exclusao | medio | local; sync so com opt-in |
| token OAuth | login | **nao reter** (MVP) | ALTO | sessao HTTP-only efemera; sem refresh em background |
| dados de doacao | nenhuma | nao coletar | ALTO | doacao 100% externa; app nao sabe quem pagou |

- **Menores:** FATO/INFERENCIA: xadrez tem muitos menores; LGPD (art. 14) e GDPR-K exigem cuidado. *Mitigacao MVP:* nao coletar idade, nao coletar nome real, local-first (sem servidor = menos dado pessoal sob sua guarda), aviso simples. Se um dia houver conta server-side, precisa de politica de menores.
- **Username = nome real:** alguns usam nome real no username Lichess. Nao exiba publicamente, nao logue, trate como pessoal.
- **Logs:** proibir PII em log de erro desde o dia 1 (a privacy doc ja lista isso — vire regra de lint/review).
- **Texto preliminar de politica (rascunho):** *"[Nome] guarda no seu proprio dispositivo apenas o necessario para te dar um plano de estudo: seu usuario do Lichess, suas respostas e seu progresso. Nao vendemos dados, nao temos anuncios e nao guardamos sua senha nem token permanente. Voce pode exportar tudo ou apagar tudo a qualquer momento. App nao oficial, sem vinculo com o Lichess."*

## 14. Analise De Custos

**FATO base:** Cloudflare Workers tem free tier (100k req/dia) e plano pago US$5/mes; D1 cobra por rows lidas/escritas e storage. PWA estatico em Pages/Workers e essencialmente gratis.

**INFERENCIA — custos por escala (MVP local-first, so hosting estatico):**

| Usuarios | Arquitetura | Custo infra/mes (aprox.) | Gargalo real |
|---|---|---|---|
| 100 | PWA estatica, sem backend | ~US$0 | nenhum |
| 1.000 | PWA estatica | ~US$0-5 | suporte humano (voce) |
| 10.000 | PWA + Worker OAuth/proxy | ~US$5-20 | rate limit Lichess no proxy; seu tempo |
| 100.000 | + D1 sync | ~US$20-200+ | leituras D1 do sync; moderacao; suporte |

**OPINIAO.** O custo financeiro nunca sera o que mata o projeto nessa escala. O custo que mata e **humano**: suporte, manutencao, revisao pedagogica e moderacao. Manter local-first o maximo possivel mantem o custo de infra perto de zero e adia o custo operacional. "Usuario pesado gera custo alto" so e verdade depois do sync server-side — mais uma razao para adia-lo.

## 15. Modelo De Negocio E Sustentabilidade

- **Doacao e suficiente?** **INFERENCIA: nao para te sustentar financeiramente, sim para cobrir infra.** Projetos OSS de nicho raramente pagam o tempo do mantenedor so com doacao.
- **"Apoiador moral" faz sentido?** Sim, como design anti-paywall. Nao como sustento.
- **Alternativas eticas compativeis com a filosofia:** grants (ex.: ligados a educacao/OSS), parceria com clubes/escolas/professores (eles distribuem, voce mantem), patrocinio transparente sem vantagem funcional, e — se um dia precisar — uma camada *paga-opcional que nao desbloqueia ensino* (ex.: temas visuais), embora isso atrite com a pureza atual.
- **Recomendacao:** trate como **bem publico/portfolio**, nao como startup. Defina explicitamente que o objetivo nao e receita. Isso libera decisoes (corta a pressao de monetizar) e e honesto com voce mesmo. Ponto de equilibrio: custo de infra ~US$0-20/mes ate dezenas de milhares de usuarios; cobrivel por doacao modesta.

## 16. Plano De Marketing E Distribuicao

- **Publico inicial:** estudantes BR 600-1200 no Lichess; subreddits de xadrez BR; servidores Discord de xadrez BR; professores de xadrez escolar.
- **Narrativa que convence:** "o app que decide seu treino de hoje e te tira da paralisia, gratis e sem cassino."
- **Primeiros 100:** voce mesmo + 2-3 comunidades + 5 professores piloto. Manual, na unha.
- **Primeiros 1.000:** 1 video curto "o que treinar hoje" + posts em r/chess (PT) + indicacao de professores.
- **Crescer sem gastar:** open-source como distribuicao (README forte, contribuicoes), conteudo de constancia (nao de "fique 2000"), boca a boca de clube.
- **Nao parecer parasita do Lichess:** sempre creditar, nunca usar marca/logo, reforcar "nao oficial", e (idealmente) avisar a comunidade Lichess com humildade.
- **PT-BR primeiro.** E seu unico moat de distribuicao hoje. Ingles depois, so se a tese se provar.
- **Lancamento 30/60/90:** 30 = piloto fechado manual (sem app pronto, planilha/prototipo); 60 = PWA local-first com 20-50 usuarios; 90 = beta publico PT-BR com landing + waitlist.

## 17. Propostas Alternativas (com recomendacao)

| # | Alternativa | Vantagem | Desvantagem | Risco | Velocidade | Recomendacao |
|---|---|---|---|---|---|---|
| A1 | PWA com sync (plano atual) | completo | caro, prematuro | alto | lenta | Adiar sync |
| A2 | **PWA local-first sem backend** | barato, rapido, valida tese | sem multidispositivo | baixo | rapida | **RECOMENDADA p/ MVP** |
| A3 | Assistente so por username publico (sem login) | zero auth, zero token, zero risco fair-play | sem dados privados | baixissimo | muito rapida | **RECOMENDADA p/ fase 0/1** |
| A4 | Extensao/companion de browser | contexto no Lichess | loja, manutencao, risco fair-play | medio-alto | media | Nao agora |
| A5 | Produto p/ professores/clubes | distribuicao + sustentabilidade | outro publico | medio | media | Explorar na fase 4 |
| A6 | So PT-BR iniciantes | foco | mercado pequeno | baixo | rapida | Combinar com A2/A3 |
| A7 | Global em ingles desde ja | mercado maior | perde unico moat (PT-BR), compete com Aimchess | alto | lenta | Nao |
| A8 | So analise pos-partida | simples | Lichess/tutor ja faz | alto | rapida | Nao (canibalizado) |

**OPINIAO:** comece em **A3 (username publico, sem login)** para validar, evolua para **A2 (PWA local-first)** como MVP real. A1 (sync) e fase 3+.

## 18. Concorrente Ja Existe? (resposta explicita)

**FATO/INFERENCIA.** Para *diagnostico e analise*, sim: Lichess/tutor + Aimchess ja fazem bem. Para *prescricao diaria prescritiva, em PT-BR, com voz humana e anti-cassino, gratis*, **nao ha um concorrente que faca isso bem**. Esse nicho esta aberto, mas e estreito.

Classificacao: **"construir MVP menor"** — especificamente, um MVP muito menor que o planejado (local-first, 0-1200, sem sync, nome novo), e so depois de uma validacao de fase 0. Nao e "construir como proposto" (escopo grande demais) nem "nao construir" (ha vao real e custo baixo).

## 19. Plano De Validacao Antes De Codar (fase 0)

| Experimento | Pergunta que responde | Como | Tempo | Custo | Amostra | Sucesso | Fracasso | Decisao |
|---|---|---|---|---|---|---|---|---|
| 10 entrevistas | "Voce sente a dor de nao saber o que treinar?" | call/DM com jogadores 600-1200 | 1 sem | 0 | 10 | >=7 confirmam dor | <=4 confirmam | seguir / repensar |
| Tutor manual (Mago de Oz) | "Eles seguem um plano diario se eu mandar?" | voce manda 1 tarefa/dia por WhatsApp p/ 5 pessoas, 2 semanas | 2 sem | 0 | 5 | >=3 ativos no dia 10 | <=1 ativo | construir A2 / parar |
| Landing + waitlist | "Tem demanda por isso?" | 1 pagina, headline da secao 10, trafego organico em comunidade | 3 dias | ~0 | 200 visitas | >=10% email | <2% | seguir / mudar narrativa |
| Teste de nome | "Nome novo evita confusao com Lichess?" | 5 pessoas reagem ao nome | 1 dia | 0 | 5 | nenhuma acha "oficial" | acham oficial | trocar nome |

**Sinal de ouro:** se o "tutor manual por WhatsApp" mantiver 3/5 pessoas treinando no dia 10 **sem app nenhum**, a tese esta validada e vale construir. Se nao mantiver, nenhum app salva.

## 20. Roadmap Recomendado

| Fase | Objetivo | Inclui | Nao escopo | Pronto quando | Tempo |
|---|---|---|---|---|---|
| **0 Validacao sem app** | provar a dor e a constancia | entrevistas + tutor manual + landing | qualquer codigo | 3/5 piloto ativos dia 10 | 2-3 sem |
| **1 Prototipo** | provar o fluxo | A3: pagina que pega username publico e gera 1 plano | login, sync, backend | usuario abre 1 tarefa no Lichess | 1-2 sem |
| **2 MVP local-first** | uso real diario | A2: PWA, 0-1200, tela Hoje, progresso local, Lemos, export/delete | sync, multi-faixa, Chess.com pesado | 20 usuarios usam 1 sem | 3-5 sem |
| **3 Beta publico** | escala inicial + sync | OAuth, Worker minimo, sync por eventos (ADR), import Chess.com | monetizacao | retencao D7 mensuravel | +4-6 sem |
| **4 Crescimento** | comunidade/clubes | professores, faixa 1200-1600 | i18n | uso em clubes | continuo |
| **5 i18n** | ingles | traducao, nome global | - | - | depois |

## 21. MVP Revisado (congelar isto)

**Dentro:** identificacao por usuario Lichess (A3) evoluindo p/ OAuth-leve; 3 perguntas; motor de plano local 0-1200; tela Hoje (1 tarefa, motivo, deep link, concluir, pular com motivo, nota); progresso de constancia; voz Lemos; export/apagar; tudo local-first; link doacao externo.

**Fora (cortar sem pena):** sync automatico, D1, Chess.com no fluxo principal, faixas 1200-2000, dashboard rico, multidispositivo, qualquer coisa que precise de token vivo.

## 22. Experimentos De Validacao

(Detalhados na secao 19.) Os dois que mais importam: **tutor manual Mago-de-Oz** (valida constancia sem codigo) e **teste de nome** (resolve R1 barato).

## 23. Perguntas Abertas

1. Qual nome publico substitui "Lichess Tutor"? (bloqueador de marca)
2. Faixa-alvo do MVP: 0-1200 ou 600-1200? (recomendo 600-1200)
3. A3 (username publico, sem login) e suficiente para o MVP, evitando OAuth de inicio?
4. O motor de plano por regras: qual a especificacao exata de "sinal -> missao"? (hoje vago)
5. Qual o sinal objetivo minimo aceitavel para confirmar "treinou" sem invadir privacidade?
6. Sync importa de verdade para o seu publico, ou e premissa nao validada?
7. Voce aceita posicionar isto como bem-publico/portfolio (nao-startup)?

## 24. Recomendacao Final

**REDUZIR ESCOPO e VALIDAR antes de codar. Nao abandonar, nao construir como proposto.**

A ideia tem vao real, mas estreito; o plano tecnico esta caro e prematuro; e a marca esta em colisao com uma feature oficial que nasceu enquanto voce planejava. O lance correto no zugzwang e: **encolher, renomear, validar de graca, e so entao construir um MVP minusculo local-first.**

### Top 10 mudancas no plano
1. Renomear o produto publico (sair de "Lichess Tutor").
2. Cortar backend/D1/sync do MVP (local-first).
3. Travar MVP em 0-1200 (de preferencia 600-1200).
4. Comecar por A3 (username publico, sem login) antes de OAuth.
5. Rodar fase 0 (tutor manual Mago-de-Oz) antes de qualquer codigo.
6. Especificar formalmente o motor "sinal -> missao".
7. Remover a promessa de "atualizacao automatica em background" (resolve R7).
8. Reposicionar no que o Lichess NAO faz: rotina diaria prescritiva + voz + constancia.
9. Assumir o projeto como bem-publico, nao negocio.
10. Adiar Chess.com para fora do fluxo principal.

### Top 10 riscos
R1 colisao de marca; R2 canibalizacao pelo Lichess; R3 construir sem validar; R4 percepcao de fair play; R5 rate limit/dependencia de API; R6 custo de sync; R7 token vs background; R8 menores/LGPD; R9 i18n tardio; R10 recomendacao pedagogica ruim.

### Top 10 oportunidades
1. Quadrante vazio "plano diario prescritivo". 2. Voz Lemos como moat emocional. 3. PT-BR primeiro. 4. Anti-cassino como contracultura. 5. Local-first = custo ~0. 6. Distribuicao via professores/clubes. 7. Open-source como aquisicao. 8. Complementar (nao competir) com lichess/tutor. 9. Constancia como metrica honesta. 10. Bem-publico = liberdade de produto.

### Roadmap recomendado
Fase 0 (validar) -> 1 (prototipo A3) -> 2 (MVP local-first 0-1200) -> 3 (sync atras de ADR) -> 4 (clubes/faixas) -> 5 (i18n). Detalhe na secao 20.

### MVP recomendado
Secao 21. Em uma linha: PWA local-first, 0-1200, 1 tarefa/dia com motivo e deep link, progresso de constancia, voz Lemos, export/delete — sem backend, sem sync, com nome novo.

### Primeiras tarefas
- **Tecnica:** prototipo A3 — pagina que recebe username Lichess, le sinais publicos (1 req, backoff), e gera 1 missao com deep link. Sem login.
- **Pesquisa de usuario:** recrutar 5 jogadores 600-1200 e rodar o tutor manual por 2 semanas.
- **Marketing:** publicar a landing de 1 pagina com a headline "O que eu treino hoje?" e medir conversao de waitlist.
- **Privacidade:** escrever a politica simples (rascunho na secao 13) e a regra "zero PII em logs".
- **Arquitetura:** escrever a ADR-004 "MVP local-first, sem backend ate sync ser validado" e a ADR-005 "renomear produto publico".

---

## Fontes (pesquisa 2026-06-06)

- [Lichess: "Lichess just introduced tutor mode" (forum)](https://lichess.org/forum/general-chess-discussion/lichess-just-introduced-tutor-mode) — feature oficial Tutor, escopo e beta.
- [Lichess Tutor Beta (forum)](https://lichess.org/forum/general-chess-discussion/lichess-tutor-beta)
- [Nikhil Dixit no X sobre Lichess Chess Tutor](https://x.com/Dixit__Nikhil/status/2016176969902391544)
- [YouTube: "I Tested The New Lichess Tutor Feature"](https://www.youtube.com/watch?v=YC4bXc_ohk8)
- [GitHub lila issue #19519: Tutor feature show changes over time](https://github.com/lichess-org/lila/issues/19519)
- [Aimchess](https://aimchess.com/) — preco US$7,99/mes, US$57,99/ano; plano personalizado a partir de Lichess/Chess.com.
- [CheckmateX: AI Chess Coach Apps in 2026](https://checkmatex.app/blog/ai-chess-coach-apps-2026-are-they-worth-it)
- [Chessable MoveTrainer](https://www.chessable.com/movetrainer/) — repeticao espacada.
- [Chess.com: Announcing Courses](https://www.chess.com/news/view/announcing-courses) — Chessable/MoveTrainer no Chess.com.
- [CircleChess: Chess.com vs Chessable pricing 2026](https://circlechess.com/blog/chesscom-pricing-vs-circlechess-vs-chessable-cost-comparison-2026/)
- Fontes herdadas do projeto (sources.md, revalidadas como ainda relevantes): [Lichess API Tips](https://lichess.org/page/api-tips), [Lichess Fair Play](https://lichess.org/page/fair-play), [Lichess ToS](https://lichess.org/terms-of-service), [Chess.com Published Data API](https://www.chess.com/news/view/published-data-api), [Cloudflare Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Cloudflare D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/).

> Nota de honestidade: nao consegui confirmar o escopo EXATO de `lichess.org/tutor` (se gera plano diario ou so diagnostico) — a feature esta em beta e a documentacao publica e escassa em 2026-06-06. INFERENCIA atual: e majoritariamente diagnostico, nao prescricao diaria. Como descobrir: testar a feature logado numa conta com partidas suficientes e revisar issues do repo `lichess-org/lila`. Essa verificacao deveria ser a tarefa de pesquisa #0, porque define o tamanho do seu vao.
