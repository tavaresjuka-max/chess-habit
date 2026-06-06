# Relatorio De Auditoria: Torre Aberta

- IA/autoria: Codex GPT-5
- Nome proprio do relatorio: Relatorio Torre Aberta
- Data da analise: 2026-06-06
- Versao dos documentos analisados: pasta local `lichess-tutor` em planejamento/auditoria, sem app, backend, banco, build, testes ou dependencias
- Sugestao de nome de arquivo: relatorio-codex-torre-aberta-lichess-tutor.md

## 1. Veredito Executivo

Recomendacao: continuar, mas pivotar e reduzir escopo antes de codar.

Como esta, "Lichess Tutor" tem um problema estrategico grave: o proprio Lichess ja possui uma rota `https://lichess.org/tutor`, citada publicamente em 2026 por usuarios como um recurso de analise estatistica de estilo, forcas, fraquezas, tempo e aberturas. Isso muda a tese. O projeto nao deve tentar ser "o tutor do Lichess"; deve virar uma camada externa de rotina, acompanhamento e traducao pedagogica das proximas acoes.

Nota geral:

- Como proposta atual, com nome Lichess Tutor, OAuth, sync e backend no MVP: 4.8/10.
- Como "rotina de treino externa, local-first, PT-BR, sem backend inicial, usando Lichess como destino": 7.1/10.

Decisao recomendada: construir apenas um MVP menor depois de validacao sem app. O primeiro produto nao deve competir com Lichess, Chess.com, Aimchess ou Chessable em analise. Deve competir com a desorganizacao do aluno.

## 2. Fatos Pesquisados

Pesquisa externa feita em 2026-06-06.

- Lichess e gratuito, open-source, sem anuncios e sem venda de dados; informa mais de cinco milhoes de partidas por dia e recursos como puzzles, studies, insights, Learn from your mistakes, opening explorer e analise Stockfish. Fonte: [Lichess About](https://lichess.org/about), [Lichess Features](https://lichess.org/features).
- Lichess API Tips recomenda uma requisicao por vez e, ao receber HTTP 429, esperar um minuto completo antes de retomar. Fonte: [Lichess API Tips](https://lichess.org/page/api-tips).
- Lichess Fair Play proibe assistencia externa durante partidas em tempo real; extensoes ou programas que ajudam a jogar lances tambem sao proibidos. Fonte: [Lichess Fair Play](https://lichess.org/page/fair-play), [Terms of Service](https://lichess.org/terms-of-service).
- A especificacao da API do Lichess lista escopos sensiveis como `board:play`, `bot:play`, `challenge:*`, `msg:write`, `puzzle:read` e outros. Fonte: [Lichess API spec](https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml).
- Lichess Database libera exports sob CC0 e informa puzzles, jogos e avaliacoes atualizados em 2026-06-04. Fonte: [Lichess Database](https://database.lichess.org/).
- Chess.com Premium oferece Game Review, puzzles, lessons, Play Coach e ausencia de anuncios; os precos vistos na pagina em 2026-06-06 iam de US$ 4.17/mes a US$ 16.67/mes quando cobrado anualmente, sujeitos a localidade. Fonte: [Chess.com Membership](https://www.chess.com/membership).
- Chess.com integrou recursos de cursos/Chessable e MoveTrainer com spaced repetition. Fonte: [Chess.com Courses announcement](https://www.chess.com/news/view/announcing-courses), [MoveTrainer scheduling](https://support.chess.com/en/articles/10319322-how-does-the-spaced-repetition-scheduling-work).
- Aimchess analisa jogos recentes, compara habilidades com pares, cria planos semanais, puzzles personalizados e treinamentos a partir dos jogos; precos vistos: gratis, US$ 7.99 mensal, US$ 57.99 anual. Fonte: [Aimchess](https://aimchess.com/).
- ChessTempo oferece tacticas, abertura, finais, guess-the-move, database e planos gratis/pagos; precos vistos incluem US$ 3/mes ou US$ 20/ano no Silver e US$ 9/mes ou US$ 79/ano no Diamond. Fonte: [ChessTempo Memberships](https://chesstempo.com/memberships/).
- Dr. Wolf oferece coach em app com comentarios durante jogo contra o proprio app, licoes, treino de erros passados e repeticao espacada. Fonte: [Learn Chess with Dr. Wolf](https://www.learnchesswithdrwolf.com/).
- Noctie oferece IA human-like, treino de aberturas, puzzles de erros, feedback e spaced repetition. Fonte: [Noctie](https://noctie.ai/).
- Listudy e gratuito/open-source e usa repeticao espacada para aberturas, finais e tacticas. Fonte: [Listudy](https://listudy.org/en).
- OpeningTree agrega partidas de Chess.com, Lichess, PGN e bases para gerar arvore de abertura. Fonte: [OpeningTree GitHub](https://github.com/openingtree/openingtree).
- Cloudflare Workers Free tem 100.000 requests/dia, CPU de 10 ms; Standard inclui 10M requests/mes e cobra excedente. Fonte: [Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/).
- Cloudflare D1 Free inclui 5M rows read/dia, 100k rows written/dia e 5GB; plano pago inclui 25B rows read/mes e 50M writes/mes antes de excedentes. Fonte: [D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/).
- MDN define requisitos de instalabilidade PWA: manifest, icones, `start_url`, `display`, HTTPS/local dev; service worker e comum para offline. Fonte: [MDN PWA installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).
- Chess.com publicou Q1 2026 com Chessable/Courses: 527k novos usuarios, 630k ativos, +132% YoY, e 33M variacoes estudadas. Fonte: [Chess.com Quarterly Report Q1 2026](https://www.chess.com/board-reports/2026-q1).

## 3. Inferencias

- O mercado nao carece de analise de jogo. Ele carece de uma rotina simples que o aluno realmente cumpra.
- A palavra "Tutor" ficou perigosa porque ja existe uma experiencia oficial do Lichess com esse nome/rota.
- O diferencial defensavel nao esta em "analisar historico"; Aimchess, Chess.com, Lichess e varias ferramentas menores ja fazem isso melhor ou mais fundo.
- A oportunidade real esta em PT-BR adulto, plano diario curto, retorno sem vergonha, privacidade e uso disciplinado do Lichess como ambiente de treino.
- Sync automatico no MVP aumenta custo, privacidade, OAuth e risco sem provar demanda.

## 4. Opiniao Estrategica

O projeto deve sobreviver como "companheiro de rotina" e nao como "analista". A melhor tese e: o usuario ja tem o Lichess, mas nao sabe transformar recursos soltos em uma rotina semanal consistente. Isso e valioso, mas so se o produto for mais simples do que abrir tres abas, ver um video e esquecer.

O projeto deveria renomear antes de qualquer tela publica. Sugestoes: `Rotina Lichess`, `Plano Aberto de Xadrez`, `Treino Claro`, `Estudo Aberto`, `Xadrez Em Rotina`. Se quiser evitar marca Lichess no nome: `Treino Claro` e o melhor equilibrio.

## 5. Tese De Oportunidade

Oportunidade: jogadores 0-1200, especialmente em PT-BR, querem melhorar mas se perdem entre partidas blitz, puzzles aleatorios, videos e analise que nao vira acao. O app pode transformar sinais simples em uma tarefa diaria concreta no Lichess.

Tese otimista: vira a camada open-source de rotina para qualquer plataforma de xadrez, com comunidade, traducao, privacidade e padroes pedagogicos melhores que apps comerciais.

Tese realista: vira um PWA pequeno, util para iniciantes e clubes, com nicho PT-BR, baixo custo e crescimento organico modesto.

Tese pessimista: Lichess melhora seu Tutor e adiciona study planner; Chess.com/Aimchess/Noctie capturam personalizacao; o app vira uma lista externa que usuarios abandonam.

## 6. Pontos Fortes

- Alinhamento cultural com Lichess: gratis, aberto, sem anuncios, sem paywall.
- Escopo etico claro: nao ajuda partida ao vivo, nao usa Board/Bot/Challenge API no MVP, nao copia conteudo pago.
- Boa intuicao de produto: organizar estudo em vez de repetir tabuleiro.
- Professor Lemos tem tom adulto, raro em apps de iniciante.
- Privacidade ja aparece como principio, nao como remendo.
- Documentacao previa boa para receber auditoria antes do codigo.

## 7. Pontos Fracos

- Nome e conceito sobrepostos ao Lichess Tutor oficial.
- MVP grande demais: OAuth, Chess.com, regra adaptativa, PWA, IndexedDB, backend, D1, sync, export/delete, doacao.
- "0-2000" e amplo demais para um primeiro produto.
- Sem tabuleiro proprio, a verificacao de conclusao vira declarativa e ruidosa.
- Falta uma tese de retorno: por que o usuario volta ao app depois de abrir o Lichess?
- Personalizacao por dados externos pode virar promessa maior que os sinais permitem.
- Backend no MVP cria obrigacoes de seguranca e suporte antes da prova de valor.

## 8. Riscos P0/P1/P2

| Risco | Classe | Problema | Impacto | Prob. | Sever. | Solucao | Validacao |
|---|---:|---|---|---:|---:|---|---|
| Nome "Lichess Tutor" | P0 | Ja existe rota/recurso Lichess Tutor; pode parecer afiliado | bloqueio de marca, confusao, rejeicao da comunidade | alta | alta | renomear antes do beta | testar 5 nomes com usuarios Lichess |
| MVP com sync/OAuth | P0 | Excesso tecnico antes de validar rotina | atraso, privacidade, bugs | alta | alta | MVP sem backend e sem OAuth | prototipo local + username publico |
| Concorrencia oficial | P0 | Lichess e Chess.com podem virar planner | perda de tese | media | alta | foco em rotina, PT-BR, clubes, privacidade | entrevistar nicho 0-1200 |
| Ajuda durante partida | P0 | Qualquer UI ambigua pode violar fair play | banimento reputacional | baixa/media | alta | travas de produto e disclaimers | checklist fair play |
| API/rate limit | P1 | importacao pesada causa 429 ou abuso | bloqueio, lentidao | media | media | uma requisicao por vez, cache, opt-in | teste com contas reais pequenas |
| Dados sensiveis | P1 | notas, usernames, rating e sinais podem identificar menor | risco LGPD/GDPR | media | alta | minimizacao, delete/export, sem logs brutos | privacy review antes beta |
| Conclusao falsa | P1 | aluno marca tarefa feita sem treinar | recomendacoes ruins | alta | media | perguntar evidencia leve/autoavaliacao | comparar com sinais Lichess quando houver |
| Doacao insuficiente | P1 | custo humano supera doacoes | abandono | alta | media | grants, Open Collective, clubes | meta de contribuidores e custo mensal |
| PT-BR limitado | P2 | reduz mercado global | crescimento menor | media | baixa | PT-BR primeiro, i18n preparada | medir demanda em ingles depois |

## 9. Mercado E Concorrencia

O mercado e lotado, mas fragmentado. Ha quatro grupos:

1. Plataformas completas: Lichess e Chess.com.
2. Treino guiado/comercial: Chessable, Aimchess, ChessTempo, DecodeChess, Dr. Wolf, Noctie.
3. Ferramentas abertas/baseadas em Lichess: Listudy, OpeningTree, Chessdriller, repositorios de analise.
4. Substitutos informais: planilhas, YouTube, Discord, professores, estudos Lichess, rotinas manuais.

Conclusao: o projeto nao deve competir em conteudo, engine, jogo, database, abertura profunda ou explicacao de lance. Deve competir em "o que eu faco hoje, por 15 minutos, e por que".

### Matriz De Concorrencia

| Produto | Preco/modelo | Personalizacao | Usa Lichess | Usa Chess.com | Analisa partidas | Cria plano diario | Tutor/coach | Mobile | Offline/PWA | Open-source | Risco | Diferenciacao possivel |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Lichess | gratis/doacao | media | nativo | nao | sim | nao/baixo | baixo | sim | parcial | sim | altissimo | rotina externa, PT-BR, acompanhamento |
| Lichess Tutor oficial | gratis | alta estatistica | nativo | nao | sim | nao claro | baixo | web | nao claro | sim | P0 | transformar insight em plano concreto |
| Chess.com | freemium/assinatura | alta | nao | nativo | sim | parcial | sim | sim | nao | nao | alto | gratis, aberto, Lichess-first |
| Chessable/Courses | cursos/pro | media | indireto | Chess.com | nao foco | revisoes | instrutor conteudo | web/mobile parcial | nao | nao | medio | rotina sem vender curso |
| Aimchess | free/pago | alta | sim | sim | sim | semanal | baixo | sim | nao | nao | alto | privacidade, baixo escopo, PT-BR |
| ChessTempo | free/pago | media | indireto | indireto | sim | nao | nao | sim | nao | nao | medio | simplicidade para iniciante |
| DecodeChess | free/pago | posicao | PGN | PGN | sim | nao | explicador | web | nao | nao | medio | nao competir em explicacao engine |
| Dr. Wolf | assinatura/app | alta no app | nao | nao | interno | licoes | sim | sim | nao | nao | medio | estudo externo e fair-play estrito |
| Noctie | freemium? | alta | indireto | indireto | sim | parcial | sim | sim | nao | nao | medio | nao criar bot; rotina no Lichess |
| Lucas Chess | gratis | baixa/media | nao | nao | local | nao | treino local | desktop | sim | sim | baixo | web/mobile e rotina |
| Listudy | gratis/open | media | estudos/PGN | PGN | nao foco | nao | nao | web | nao claro | sim | medio | plano adaptativo e PT-BR |
| OpeningTree | gratis/open | abertura | sim | sim | abertura | nao | nao | web | nao | sim | baixo/medio | nao competir em arvore |

## 10. Analise De Produto

Problema real: sim, especialmente em 0-1200. O usuario sabe que deveria treinar, mas nao sabe escolher entre puzzle, partida, review, final, abertura, estudo e videos.

Cliente inicial recomendado: adulto iniciante/intermediario leve, 600-1200 Lichess rapid/blitz ou 400-1000 Chess.com rapid, que joga mais do que estuda e fala PT-BR.

O que cortar sem pena:

- 1200-2000 no MVP.
- sync automatico.
- Chess.com importador no primeiro prototipo.
- OAuth no primeiro prototipo.
- mensagens longas do tutor.
- dashboard sofisticado.
- doacao dentro da navegacao principal.
- qualquer "analise de partida" que concorra com Lichess.

Aha moment: "em 2 minutos recebi uma rotina de hoje com link direto para o Lichess, motivo claro e carga que cabe no meu tempo".

Risco de abrir Lichess e nunca voltar: alto. Mitigacao: a tarefa deve exigir fechamento no app: marcar feito, nota curta, dificuldade percebida, proxima tarefa destravada. Sem isso, o app vira apenas uma pagina de links.

### Posicionamento

Frase: "Um planejador de treino que transforma o Lichess em uma rotina diaria simples."

Paragrafo: "Treino Claro organiza seu estudo de xadrez sem substituir o Lichess. Ele pergunta quanto tempo voce tem, observa sinais simples do seu historico e entrega uma tarefa curta para hoje: puzzle, revisao, final, partida lenta ou estudo. Voce treina no Lichess e volta para registrar o que aprendeu."

Landing page curta:

- H1: Treino Claro
- Sub: Sua rotina diaria de xadrez usando o Lichess.
- CTA: Montar treino de hoje
- Secao 1: Escolha tempo, nivel e objetivo.
- Secao 2: Receba uma tarefa clara com link para o Lichess.
- Secao 3: Volte, marque o que fez e ajuste a proxima sessao.
- Disclaimer: App independente. Nao afiliado ao Lichess. Nao oferece ajuda durante partidas ao vivo.

## 11. Analise Pedagogica

O curriculo 0-2000 e bom como mapa, mas grande demais como produto inicial. O MVP deve focar 0-1200.

O que falta:

- 0-800: rotina anti-blunder muito concreta: antes de mover, perguntar "o que ele ameaca?", "minha peca fica pendurada?", "ha xeque/mate/captura?". Coordenadas e legalidade devem ser tratadas como base.
- 800-1200: revisao de derrotas com uma unica causa por partida, nao analise completa.
- 1200-1600: so depois de provar o ciclo; precisa de calculo, lances candidatos e finais praticos.
- 1600-2000: provavelmente outro produto; exige profundidade e sinais melhores.

Metodo revisado:

1. Diagnostico minimo: rating, ritmo jogado, tempo disponivel, maior dor, habito atual.
2. Carga diaria: 10, 20 ou 40 minutos.
3. Ciclo semanal: 2 dias tactica, 1 dia final, 1 dia revisao, 1 dia partida lenta, 1 dia recuperacao/leve, 1 dia livre.
4. Registro: feito/pulado, dificuldade, um erro percebido.
5. Adaptacao: repetir tema fraco, reduzir carga apos falta, evitar blitz excessivo, inserir revisao se jogar muito.

Validacao de aprendizagem sem tabuleiro proprio:

- confiavel: rating trends com janela grande, puzzle activity, volume de revisoes, consistencia de treino, mudanca de ritmo, notas do aluno.
- ruidoso: rating diario, puzzle rating isolado, auto-marcacao de "feito", comparacao direta Chess.com/Lichess, poucas partidas.

## 12. Analise Tecnica

Stack planejada e adequada para o futuro, mas pesada para o primeiro MVP. React + Vite + TypeScript + PWA + IndexedDB faz sentido. Workers + D1 + OAuth + sync por eventos deve vir depois.

Arquitetura revisada:

```text
Fase 1 sem backend
Usuario -> PWA estatica -> IndexedDB/localStorage
                    -> links Lichess
                    -> import publico leve por username, quando necessario

Fase 2 com sync opt-in
Usuario -> PWA -> IndexedDB -> /api/sync -> Workers -> D1
                       -> Lichess public/OAuth calls com throttle
```

Componentes:

- Onboarding: tempo, nivel, objetivos, ritmo.
- Planner local: regras simples, sem LLM no core.
- Mission launcher: links para Lichess Learn/Practice/Training/Analysis/Study.
- Journal: nota curta e conclusao.
- Signal fetcher: apenas leitura publica/autorizada, com cache.
- Sync service: adiado; opt-in.

Dados persistidos no MVP sem backend:

- perfil local;
- username Lichess opcional;
- plano semanal;
- tarefas;
- status e notas;
- sinais derivados;
- consentimentos.

APIs internas futuras:

- `generatePlan(profile, signals, history)`
- `recordMissionResult(missionId, result)`
- `deriveSignals(rawExternalSummary)`
- `buildLichessUrl(task)`
- `syncPush(events)` e `syncPull(afterSeq)` apenas na fase 2.

Plano de testes:

- regras de plano por faixa;
- nao gerar tarefa de ajuda ao vivo;
- cache/rate limit;
- export/delete quando houver backend;
- offline: abrir plano salvo, marcar tarefa, sincronizar depois;
- mobile: onboarding, Hoje e retorno apos falta.

## 13. API, Fair Play E Relacao Com Lichess

Endpoints seguros no futuro: `GET /api/user/{username}`, rating history, perf, puzzle dashboard/activity se autorizado, game export com parcimonia e sem guardar PGN completo por padrao.

Evitar no MVP:

- Board API;
- Bot API;
- Challenge API;
- escopos de chat/mensagem;
- escopos de escrita;
- automatizacao de browser;
- qualquer overlay ou sugestao durante partida.

Plano de relacionamento:

1. Renomear para nao parecer oficial.
2. Publicar disclaimer em onboarding, footer e README.
3. Abrir issue/discussao ou pedir feedback no canal de suporte de API do Lichess antes do beta publico.
4. Documentar rate limiting e caching.
5. Compartilhar codigo open-source e forma de reduzir carga.
6. Ter kill switch para chamadas externas se houver 429 ou reclamacao.

## 14. Privacidade, Seguranca E Compliance

Tabela de dados:

| Dado | Finalidade | Retencao | Risco | Mitigacao |
|---|---|---|---|---|
| username Lichess | buscar sinais e montar links | ate desconectar/excluir | identifica pessoa se username real | opcional, explicito |
| username Chess.com | nivel inicial | local/ate excluir | associacao de contas | adiar no MVP |
| tempo/objetivos/dificuldades | plano | local/ate excluir | perfil sensivel leve | minimizacao |
| notas | reflexao | local/ate excluir | pode conter dado pessoal | aviso e delete |
| tarefas feitas | adaptacao | local/ate excluir | habito/performance | export/delete |
| PGN completo | nao necessario | nao salvar por padrao | alto | apenas opt-in futuro |
| token OAuth | login/autorizacao | nao persistir no MVP | alto | sessao curta/HTTP-only se backend |
| logs | debug | curto | vazamento | redacao e sem payload bruto |
| doacao | apoio externo | app nao sabe | financeiro | link externo sem webhook |

Texto preliminar:

> Este app guarda apenas o necessario para montar sua rotina de treino. No MVP, seus dados ficam no seu dispositivo, salvo quando voce optar por sincronizacao futura. Nao vendemos dados, nao exibimos anuncios e nao damos vantagem funcional a apoiadores. Voce pode exportar, limpar ou excluir seus dados. O app e independente e nao afiliado ao Lichess.

Menores: usar linguagem simples, sem coleta de idade no MVP, sem ranking social, sem publicidade, e aviso para responsavel se houver uso escolar.

## 15. Custos E Sustentabilidade

Custos tecnicos aproximados, assumindo PWA leve:

| Escala | Sem backend | Com sync Cloudflare | Risco dominante |
|---:|---:|---:|---|
| 100 usuarios | US$ 0-5/mes | US$ 0-5/mes | tempo do fundador |
| 1.000 usuarios | US$ 0-5/mes | US$ 5-20/mes | suporte e bugs |
| 10.000 usuarios | US$ 5-20/mes | US$ 20-150/mes | API, D1, observabilidade |
| 100.000 usuarios | US$ 20-100/mes | US$ 300-2.000+/mes | suporte, seguranca, moderacao |

Doacao pura dificilmente sustenta tempo humano. Ela pode sustentar infra se o app for leve. Recomendacao: GitHub Sponsors/Open Collective, grants, parcerias com clubes/escolas sem paywall funcional, e relatorio publico de custos.

Ponto de equilibrio inicial: 50 apoiadores a US$ 5/mes cobrem infra e ferramentas basicas, nao trabalho integral.

## 16. Marketing E Distribuicao

Publico inicial: adultos PT-BR 0-1200 que ja jogam no Lichess mas nao estudam com metodo.

30 dias:

- landing page com waitlist;
- 20 entrevistas;
- rotina manual por mensagem para 10 usuarios;
- posts em comunidades PT-BR com disclaimer claro.

60 dias:

- prototipo navegavel sem backend;
- beta fechado com 30 usuarios;
- calendario de conteudo: "15 minutos de treino", "como revisar uma derrota", "menos blitz automatico".

90 dias:

- beta publico local-first;
- pedir feedback a clubes/professores;
- publicar roadmap e custo mensal.

Mensagem para comunidade:

> Estou testando um planejador independente e open-source para estudar melhor usando o Lichess. Ele nao joga por voce, nao ajuda partida ao vivo e nao e afiliado ao Lichess. A ideia e transformar os recursos gratuitos do Lichess em uma rotina diaria curta. Feedback brutal e bem-vindo.

## 17. Administracao, Operacao E Governanca

Metodo recomendado para projeto pequeno:

- Kanban simples para execucao.
- RICE leve para priorizacao.
- ADR para decisao central.
- RFC curto para mudancas de API, privacidade, sync e pedagogia.
- Checklist de release.
- Governance open-source minima: `CONTRIBUTING`, `CODE_OF_CONDUCT`, guia de privacidade, labels P0/P1/P2.

Nao usar OKRs complexos agora. Shape Up pode servir para ciclos de 4 semanas depois do MVP.

## 18. Metricas E Avaliacao

Eventos locais sem invasao:

- onboarding iniciado/concluido;
- tarefa aberta;
- tarefa marcada feita/pulada;
- nota salva;
- retorno apos falta;
- export/delete;
- erro externo 429.

Metricas de sucesso:

- ativacao: 70% recebem tarefa em menos de 3 minutos;
- D7: 35% voltam pelo menos 3 dias;
- comportamento: 50% concluem ao menos 4 tarefas na primeira semana;
- pedagogico: aumento de revisoes pos-partida e reducao auto-relatada de blitz automatico;
- tecnico: zero chamadas paralelas externas, zero dados brutos sensiveis em logs.

Evitar vanity metrics: pageviews, numero de planos gerados, rating semanal.

## 19. Gargalos De Crescimento

Em 1.000 usuarios: suporte, bugs de onboarding, confusao com Lichess oficial.

Em 10.000 usuarios: API throttling, custos de sync, privacidade, tradutores, docs, comunidade.

Em 100.000 usuarios: abuso, menores, reputacao com Lichess, incidentes de dados, necessidade de equipe.

Desenhar agora: minimizacao, logs seguros, kill switch de API, export/delete, ADRs.

Nao superengenheirar agora: D1 complexo, fila, cron, LLM, multi-plataforma completa, analytics centralizados.

## 20. Roadmap Recomendado

| Fase | Objetivo | Features | Nao escopo | Pronto quando |
|---|---|---|---|---|
| 0 validacao sem app | provar dor | entrevistas, rotina manual, landing | codigo | 10 usuarios completam 1 semana |
| 1 prototipo | provar UX | onboarding, Hoje, links, diario local | OAuth, sync | usuario entende em 3 min |
| 2 MVP privado | provar habito | PWA local-first, regras 0-1200, export local | backend | D7 >= 35% |
| 3 beta publico | estabilidade | import Lichess publico leve, doacao externa | tokens persistentes | sem 429 problematico |
| 4 sync opt-in | multi-dispositivo | Workers + D1 + delete/export | Chess.com pesado | sync sem conflitos graves |
| 5 internacionalizacao | ampliar | EN/ES, nomes neutros | conteudo 1600+ | demanda comprovada |
| 6 avancado | profundidade | sinais melhores, clubes | ajuda ao vivo | revisao legal/API |

Ultra enxuto em 2 semanas:

- landing;
- formulario de perfil;
- gerador manual/estatico de plano 7 dias;
- links Lichess;
- diario local simples;
- 10 usuarios piloto.

## 21. MVP Revisado

MVP recomendado:

- nome novo;
- app estatico PWA/local-first;
- sem backend;
- sem OAuth;
- username Lichess opcional;
- faixa 0-1200;
- plano semanal por regras;
- tela Hoje;
- link para Lichess;
- marcar feito/pulado;
- nota curta;
- exportar dados locais;
- disclaimer de independencia e fair play.

Adicionar depois:

- import publico Chess.com;
- sync opt-in;
- OAuth PKCE;
- sinais de puzzle dashboard;
- clubes/professores;
- internacionalizacao.

## 22. Experimentos Antes De Codar

| Experimento | Pergunta | Execucao | Tempo | Sucesso | Fracasso |
|---|---|---|---:|---|---|
| 20 entrevistas | dor e real? | chamada 20 min | 1 semana | 12 relatam falta de rotina | maioria ja tem metodo |
| rotina manual | seguem plano? | enviar tarefa diaria | 2 semanas | 7/10 concluem 4 dias | abandono ate D3 |
| landing | nome/valor | 3 nomes, waitlist | 1 semana | conversao > 20% | confusao com Lichess oficial |
| prototipo Figma | UX clara? | teste 5 usuarios | 3 dias | tarefa entendida sem explicacao | pedem analise/jogo |
| professor/clubes | B2B possivel? | 5 professores | 1 semana | querem usar com alunos | veem como redundante |
| doacao | sustentabilidade | link fake/intent | 2 semanas | 5% clicam | ninguem considera apoiar |

## 23. Critica Ao Plano Atual

| Documento | Forte | Fraco/Vago | Perigoso | Decisao necessaria |
|---|---|---|---|---|
| README | separacao e postura clara | nome arriscado | "Lichess Tutor" parece oficial | renomear |
| PLANO | bom mapa de produto | MVP grande | 0-2000 e sync cedo | travar 0-1200 sem backend |
| AGENTS | regras eticas fortes | nao define nome alternativo | marca/API | ADR de renomeacao |
| memory/project | promessa boa | publico amplo | 2000 no escopo | persona inicial |
| memory/state | status claro | proxima etapa generica | falta criterio de validacao | fase 0 antes app |
| decisions | ADRs objetivas | PWA+sync aceito cedo | pode engessar | nova ADR de MVP sem sync |
| architecture/system | stack plausivel | backend cedo | tokens/sync | separar fases |
| architecture/sync | eventos bons | sofisticado para MVP | conflitos e privacidade | adiar |
| interfaces | tipos uteis | `value: unknown` muito aberto | payload sensivel | schemas minimos |
| lichess.md | respeita API | endpoints demais | games export/PGN | limitar sinais |
| chesscom.md | escopo pequeno | archives pode crescer | import pesado | adiar |
| privacy | boa minimizacao | politica ainda curta | menores/logs | privacy review |
| curriculum | boas faixas | amplo | 1600-2000 exige outro metodo | foco 0-1200 |
| Professor Lemos | tom forte | pode virar camada cosmetica | prometer tutor demais | usar so em microcopy |
| product-flows | fluxo simples | falta retorno pos-Lichess | abandono | fechar loop no app |
| sources | boas fontes base | precisa data de revalidacao | fontes externas mudam | atualizar por auditoria |

## 24. Alternativas

| Caminho | Vantagem | Desvantagem | Custo | Recomendacao |
|---|---|---|---|---|
| PWA com sync planejado | experiencia completa | lento e arriscado | medio/alto | nao agora |
| PWA sem backend | rapido, privado, barato | sem multi-dispositivo | baixo | melhor MVP |
| assistente por username | quase sem auth | menos preciso | baixo | bom experimento |
| extensao/browser companion | contexto forte | risco fair play alto | medio | evitar no MVP |
| produto para professores/clubes | canal B2B | exige gestao de turmas | medio | explorar depois |
| PT-BR iniciantes | nicho claro | mercado menor | baixo | recomendado |
| global ingles | mercado maior | concorrencia brutal | medio | depois |
| analise pos-partida | valor claro | lotado | alto | nao competir |

## 25. Concorrente Ja Existe?

Sim, parcialmente. Aimchess ja faz plano e analise personalizada por jogos. Lichess ja tem Tutor oficial e recursos gratuitos profundos. Chess.com tem Play Coach, Game Review, Courses e Chessable. Listudy e OpeningTree cobrem partes abertas.

Ainda faz sentido se o projeto for menor e diferente: rotina diaria, PT-BR, privacidade, sem paywall, sem promessa de engine, usando Lichess como destino.

Classificacao: construir MVP menor. Nao construir como proposto.

## 26. Perguntas Abertas

- Qual nome novo evita confusao com Lichess e ainda comunica integracao?
- Usuarios 0-1200 querem plano diario ou preferem videos/praticas soltas?
- O "Professor Lemos" aumenta aderencia ou parece personagem demais?
- O app precisa de login no dia 1?
- Quantos usuarios realmente precisam de sync entre computador e mobile?
- Quais sinais do Lichess Tutor oficial podem ser referenciados sem copiar ou competir?
- Lichess aceitaria/ignoraria/criticaria uma camada externa de rotina?

## 27. Top 10 Mudancas No Plano

1. Renomear antes de qualquer beta.
2. Reduzir MVP para 0-1200.
3. Remover backend/sync do MVP.
4. Remover OAuth do primeiro prototipo.
5. Adiar Chess.com.
6. Transformar Professor Lemos em microcopy, nao promessa central.
7. Fechar loop de retorno apos abrir Lichess.
8. Medir consistencia, nao rating rapido.
9. Publicar plano de API/fair play.
10. Fazer validacao manual antes do app.

## 28. Recomendacao Final

Continuar com pivot. O projeto tem valor se assumir humildemente que Lichess, Chess.com e Aimchess vencem em analise. O espaco aberto e orientar rotina, reduzir ansiedade de escolha e transformar recursos gratuitos em habito. A primeira tarefa tecnica nao e React; e um prototipo sem backend que entrega plano de hoje em menos de 3 minutos. A primeira tarefa de pesquisa e entrevistar 20 jogadores 0-1200. A primeira tarefa de marketing e testar o novo nome. A primeira tarefa de privacidade e escrever a politica local-first. A primeira tarefa de arquitetura e criar uma ADR substituindo "PWA com sync no MVP" por "PWA local-first, sync opt-in futuro".

