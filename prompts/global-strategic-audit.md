# Prompt: Auditoria Global Estrategica Do Lichess Tutor

Voce e uma IA consultora senior contratada por uma empresa global que esta avaliando entrar no mercado de treinamento de xadrez digital. Sua tarefa e auditar com profundidade o projeto `Lichess Tutor`, criticando a ideia em todas as perspectivas relevantes antes de qualquer implementacao.

Nao seja apenas simpatico. Seja util. Elogie o que for forte, mas procure falhas, gargalos, ingenuidades, riscos ocultos, concorrentes, problemas de crescimento, custos, questoes legais, limitacoes tecnicas e pontos em que o projeto pode estar reinventando algo que ja existe melhor.

## Contexto Do Projeto

O Lichess Tutor e uma proposta de PWA gratuita e open-source para ajudar estudantes a estudarem melhor usando o Lichess. Ele nao pretende ser um app de jogar xadrez nem criar outro tabuleiro proprio no MVP. O app deve:

- analisar historico do usuario no Lichess;
- opcionalmente importar dados publicos do Chess.com;
- fazer perguntas curtas sobre tempo, objetivos e dificuldades;
- criar plano de treino personalizado;
- abrir tarefas no Lichess;
- acompanhar progresso;
- ajustar aulas conforme desempenho e rotina;
- sincronizar progresso entre computador e mobile;
- usar modelo gratuito com doacao externa opcional;
- nao criar paywall, anuncios ou vantagem funcional para apoiadores;
- ser app nao oficial e nao afiliado ao Lichess.

## Documentos Para Ler Primeiro

Leia, no minimo:

- `README.md`
- `PLANO.md`
- `AGENTS.md`
- `memory/project.md`
- `memory/state.md`
- `memory/decisions.md`
- `docs/review/ai-audit-pack.md`
- `docs/architecture/system.md`
- `docs/architecture/sync.md`
- `docs/architecture/interfaces.md`
- `docs/integrations/lichess.md`
- `docs/integrations/chesscom.md`
- `docs/privacy/privacy-and-data.md`
- `docs/pedagogy/curriculum-0-2000.md`
- `docs/pedagogy/professor-lemos.md`
- `docs/ux/product-flows.md`
- `docs/research/sources.md`

Se algum arquivo essencial estiver ausente, diga exatamente qual e avalie com base no que houver.

## Obrigacao De Pesquisa Externa

Voce deve pesquisar a web antes de concluir. Use fontes atuais e cite links. A pesquisa deve incluir:

- documentacao oficial do Lichess;
- regras, API, OAuth, rate limits e fair play do Lichess;
- Chess.com Published Data API;
- concorrentes diretos e indiretos;
- apps de treino de xadrez;
- apps que criam planos personalizados;
- produtos com tutor/coach de xadrez;
- ferramentas de analise de partidas;
- ferramentas baseadas em Lichess;
- modelos gratuitos, freemium, assinatura, doacao e open-source;
- custos atuais de infraestrutura provavel;
- tendencias de mercado em xadrez online, educacao digital e mobile/PWA.

Informe a data da pesquisa e separe fato, inferencia e opiniao.

## Postura Da Analise

Avalie como se a decisao fosse de empresa grande:

- vale investir?
- qual e a tese de mercado?
- qual e o diferencial defensavel?
- qual e o risco de virar feature de outra plataforma?
- qual e o custo de oportunidade?
- qual seria o MVP mais inteligente?
- o que deve ser cortado sem pena?
- o que precisa ser validado antes de codar?
- o que pode matar o projeto?

Nao aceite a premissa so porque ela parece boa.

## Entregavel Esperado

Produza um relatorio estruturado, longo e minucioso, com:

1. Veredito executivo.
2. Nota geral de atratividade do projeto, de 0 a 10.
3. Tese de oportunidade.
4. Principais pontos fortes.
5. Principais pontos fracos.
6. Riscos P0/P1/P2.
7. Analise de mercado.
8. Analise de concorrentes.
9. Analise de substitutos.
10. Analise de produto.
11. Analise pedagogica.
12. Analise tecnica.
13. Analise de privacidade, seguranca e compliance.
14. Analise de custos.
15. Modelo de negocio e sustentabilidade.
16. Plano de marketing e distribuicao.
17. Metodos de administracao e operacao.
18. Metodos de avaliacao e metricas.
19. Gargalos de crescimento.
20. Roadmap recomendado.
21. MVP revisado.
22. Experimentos de validacao.
23. Perguntas abertas.
24. Recomendacao final: continuar, pivotar, reduzir escopo ou abandonar.

## Nivel De Detalhe

Trate cada area como se fosse uma due diligence. Nao responda com generalidades. Para cada critica importante, inclua:

- o problema;
- por que importa;
- evidencia ou raciocinio;
- impacto esperado;
- probabilidade;
- severidade;
- solucao proposta;
- custo aproximado ou esforco relativo;
- como validar.

## Perspectiva 1: Produto

Analise:

- O problema do usuario e real?
- Quem sente essa dor com frequencia?
- O aluno quer mais um app ou quer uma rotina simples?
- O posicionamento "tutor que abre Lichess" e claro?
- O nome "Lichess Tutor" ajuda ou gera risco de parecer oficial?
- O app resolve uma necessidade que o proprio Lichess ja resolve?
- O foco 0-2000 e amplo demais?
- O MVP deveria focar 0-1200?
- O app deve ser para iniciantes, intermediarios ou ambos?
- Quais fluxos sao essenciais?
- Quais fluxos parecem vaidade?
- O que torna o produto memoravel?
- O que o usuario faria todos os dias?
- Qual e o "aha moment"?
- Qual e o risco de o usuario abrir o Lichess e nunca voltar?

Entregue uma proposta de posicionamento em uma frase, um paragrafo e uma landing page curta.

## Perspectiva 2: Mercado E Concorrencia

Pesquise e compare, no minimo:

- Lichess;
- Chess.com;
- Chessable;
- Aimchess;
- Lucas Chess;
- ChessTempo;
- DecodeChess;
- Dr. Wolf;
- Noctie;
- ChessMood;
- Listudy;
- OpeningTree;
- ferramentas de estudo baseadas em PGN;
- apps de coach com IA, se houver;
- comunidades, planilhas e rotinas manuais usadas por jogadores.

Para cada concorrente relevante, responda:

- o que faz;
- publico-alvo;
- modelo de negocio;
- pontos fortes;
- pontos fracos;
- o que ele ja resolve;
- o que nao resolve;
- se compete diretamente ou substitui parcialmente;
- o que podemos aprender;
- onde nao devemos competir.

Crie uma matriz de concorrencia com colunas:

- Produto;
- Preco/modelo;
- Personalizacao;
- Usa Lichess;
- Usa Chess.com;
- Analisa partidas;
- Cria plano diario;
- Tem tutor/coach;
- Mobile;
- Offline/PWA;
- Open-source;
- Risco para Lichess Tutor;
- Oportunidade de diferenciacao.

## Perspectiva 3: Potencial E Diferencial

Avalie se o projeto tem um diferencial real ou apenas reorganiza recursos existentes.

Perguntas:

- Qual e o "moat" possivel?
- Dados do usuario podem virar vantagem?
- Comunidade open-source pode ser vantagem?
- PT-BR e Professor Lemos sao diferencial local ou distração global?
- O app pode ser internacionalizado depois?
- O app depende demais do Lichess?
- Se o Lichess criar "study planner", o projeto morre?
- Existe uma versao B2C, B2B, escolar ou clube?
- Existe possibilidade de se tornar camada de organizacao para qualquer plataforma?

Entregue tres teses:

- tese otimista;
- tese realista;
- tese pessimista.

## Perspectiva 4: Pedagogia E Metodo De Treino

Analise o metodo proposto:

- plano personalizado;
- treino no Lichess;
- progressao 0-2000;
- revisao adaptativa;
- tutor Lemos;
- ausencia sem vergonha;
- metas por tempo disponivel;
- ajuste por progresso.

Compare com metodos conhecidos:

- pratica deliberada;
- repeticao espacada;
- interleaving;
- retrieval practice;
- Steps Method;
- Woodpecker method;
- revisao de partidas;
- treino por temas;
- treino por erros reais;
- estudo de finais;
- estudo de aberturas por principios.

Perguntas:

- O curriculo esta correto por faixa?
- O que falta para 0-800?
- O que falta para 800-1200?
- O que falta para 1200-1600?
- O que falta para 1600-2000?
- O app consegue medir progresso sem tabuleiro proprio?
- Como evitar que o aluno marque "feito" sem treinar?
- Como validar aprendizado real se o exercicio acontece no Lichess?
- Quais sinais do Lichess sao confiaveis?
- Quais sinais sao ruidosos?
- Como lidar com blitz excessivo?
- Como lidar com rating tilt?
- Como lidar com multiplas contas?

Entregue uma proposta de metodo pedagogico revisado e uma versao mais enxuta para MVP.

## Perspectiva 5: Arquitetura Tecnica

Avalie a arquitetura planejada:

- React + Vite + TypeScript;
- PWA;
- IndexedDB;
- Cloudflare Workers;
- Cloudflare D1;
- Lichess OAuth PKCE;
- sync por eventos;
- importador Chess.com;
- regra local de plano;
- sem LLM no core inicial.

Perguntas:

- A stack e adequada?
- Cloudflare Workers + D1 aguenta crescimento?
- O modelo local-first complica demais?
- O sync por eventos e necessario no MVP?
- O app deveria comecar sem backend?
- Se precisa de backend, qual e o minimo seguro?
- Como lidar com OAuth sem armazenar token long-lived?
- Como atualizar progresso automaticamente sem token armazenado?
- Quais limites de API podem atrapalhar?
- O que deve ser cacheado?
- O que nunca deve ser cacheado?
- Como testar offline?
- Como testar duas sessoes em dispositivos diferentes?
- Como lidar com dados conflitantes?
- Quais tabelas minimas seriam necessarias?
- O que deve ser adiado?

Entregue uma arquitetura revisada com:

- diagrama textual;
- componentes;
- responsabilidades;
- APIs internas;
- dados persistidos;
- riscos;
- plano de testes.

## Perspectiva 6: API, Fair Play E Relacao Com Lichess

Analise profundamente:

- OAuth PKCE;
- endpoints planejados;
- escopos;
- puzzle dashboard/activity;
- games export;
- rating history;
- rate limit;
- fair play;
- risco de parecer assistencia durante partida;
- risco de marca/afiliacao.

Perguntas:

- O nome "Lichess Tutor" e seguro?
- Devemos usar outro nome publico?
- Devemos pedir permissao ou avisar comunidade Lichess?
- Como deixar claro que nao e oficial?
- Quais endpoints sao seguros?
- Quais endpoints evitar?
- Que escopos nao devemos pedir?
- O app poderia ser visto como abuso de API?
- Como reduzir carga no Lichess?
- Como lidar com 429?

Entregue um plano de relacionamento com o ecossistema Lichess.

## Perspectiva 7: Privacidade, Seguranca E Compliance

Avalie:

- minimizacao de dados;
- tokens;
- sessoes;
- cookies;
- logs;
- exportacao;
- exclusao;
- consentimento;
- menores de idade;
- contas Lichess e Chess.com;
- dados de desempenho;
- dados de doacao;
- privacidade em app open-source;
- LGPD/GDPR como direcao.

Perguntas:

- Quais dados sao estritamente necessarios?
- Quais dados parecem convenientes mas perigosos?
- Como desenhar exportacao?
- Como desenhar delete account?
- Como evitar vazamento em logs?
- Como documentar privacidade em linguagem simples?
- Como lidar com menor de idade?
- Como lidar com usuario que usa nome real no username?

Entregue:

- tabela de dados;
- finalidade;
- retencao;
- risco;
- mitigacao;
- texto preliminar de politica de privacidade.

## Perspectiva 8: Modelo De Negocio E Sustentabilidade

O usuario definiu que o app sera gratuito, com doacao externa e possivel reconhecimento moral. Analise se isso sustenta o projeto.

Perguntas:

- Doacao e suficiente?
- Qual custo mensal esperado em 100, 1.000, 10.000, 100.000 usuarios?
- Quais custos sao tecnicos?
- Quais custos sao humanos?
- Quais custos sao suporte/comunidade?
- Existe risco de API/custo com crescimento?
- Como evitar que usuarios pesados gerem custo alto?
- Que modelo gratuito e sustentavel?
- Existe alternativa etica: patrocinio, grants, escolas, clubes, open collective?
- "Apoiador moral" faz sentido?
- Como evitar virar paywall?

Entregue:

- planilha textual de custos por escala;
- modelos de sustentabilidade possiveis;
- recomendacao de modelo;
- ponto de equilibrio aproximado;
- plano para manter custo baixo.

## Perspectiva 9: Administracao, Operacao E Governanca

Proponha metodos de administracao para o projeto:

- como organizar roadmap;
- como priorizar issues;
- como aceitar contribuicoes;
- como revisar conteudo pedagogico;
- como revisar seguranca;
- como lidar com bugs de sync;
- como lidar com abuso;
- como lidar com pedidos da comunidade;
- como fazer releases;
- como medir saude do projeto;
- como documentar decisoes.

Compare metodos:

- Shape Up;
- OKRs;
- RICE;
- MoSCoW;
- Kanban;
- dual-track discovery/delivery;
- RFC/ADR;
- open-source governance.

Entregue um metodo recomendado para um projeto pequeno que pode crescer.

## Perspectiva 10: Metodos De Avaliacao E Metricas

Proponha como medir se o projeto funciona.

Metricas de produto:

- ativacao;
- retorno D1/D7/D30;
- tarefas abertas no Lichess;
- tarefas concluidas;
- abandono de onboarding;
- sync entre dispositivos;
- uso mobile vs desktop;
- cliques de doacao;
- retencao por faixa de rating.

Metricas pedagogicas:

- reducao de blunders;
- progresso em puzzle rating;
- consistencia de treino;
- partidas revisadas;
- queda de temas fracos;
- melhoria por ritmo;
- transferencia para partidas.

Metricas tecnicas:

- uptime;
- erro por endpoint;
- 429 externos;
- fila de sync;
- conflitos;
- tempo de carregamento;
- PWA install rate;
- uso offline.

Perguntas:

- Que metricas podem ser coletadas sem invadir privacidade?
- Que metricas devem ficar locais?
- Que metricas precisam de opt-in?
- Como evitar vanity metrics?
- Como validar melhora real sem prometer causalidade falsa?

Entregue um plano de avaliacao com eventos, dashboards e criterios de sucesso.

## Perspectiva 11: Marketing, Comunidade E Distribuicao

Proponha plano de marketing:

- posicionamento;
- publico inicial;
- canais;
- comunidades;
- conteudo;
- SEO;
- YouTube/TikTok/shorts;
- Reddit/Discord;
- clubes de xadrez;
- escolas;
- professores;
- streamers;
- comunidades Lichess;
- comunidades Chess.com;
- Brasil vs internacional;
- idioma PT-BR primeiro ou ingles primeiro.

Perguntas:

- Qual narrativa convence?
- Como adquirir os primeiros 100 usuarios?
- Como adquirir os primeiros 1.000?
- Como crescer sem gastar?
- Como evitar parecer parasita do Lichess?
- Como transformar open-source em distribuicao?
- Como pedir feedback de jogadores reais?
- Como usar Professor Lemos como marca sem parecer infantil?

Entregue:

- plano de lancamento em 30/60/90 dias;
- calendario de conteudo;
- landing page proposta;
- mensagens para comunidades;
- estrategia de waitlist;
- estrategia de beta fechado.

## Perspectiva 12: Linguagem, Marca E UX Writing

Analise:

- nome;
- tom;
- "Lichess Tutor";
- Professor Augusto Lemos;
- promessa do produto;
- linguagem para iniciante;
- linguagem para intermediario;
- linguagem de doacao;
- linguagem de retorno apos falta;
- aviso de nao afiliacao;
- risco juridico/comunicacional.

Perguntas:

- O nome deveria mudar?
- Quais nomes alternativos?
- A palavra "Tutor" promete demais?
- O app deve falar em "aulas", "treinos", "missoes" ou "rotina"?
- O Lemos e diferencial ou camada local demais?
- Como adaptar para ingles no futuro?

Entregue:

- guia de linguagem;
- exemplos de telas;
- textos para onboarding;
- textos para doacao;
- textos para erro;
- textos para ausencia;
- textos de disclaimers.

## Perspectiva 13: Crescimento E Expansao

Avalie problemas de escala:

- API limits;
- custo de sync;
- suporte;
- moderacao;
- privacidade;
- internacionalizacao;
- mobile;
- dados de usuarios;
- dependencia de plataformas;
- conteudo pedagogico;
- qualidade das recomendacoes;
- risco de recomendacoes ruins;
- crescimento open-source;
- migracao de backend;
- backup;
- observabilidade.

Perguntas:

- O que quebra em 1.000 usuarios?
- O que quebra em 10.000?
- O que quebra em 100.000?
- O que deve ser desenhado agora para nao reescrever tudo?
- O que nao deve ser superengenheirado?
- Quando precisaremos de fila/cron/cache?
- Quando precisaremos de banco melhor?
- Quando precisaremos de equipe?

Entregue um plano de escala por fases.

## Perspectiva 14: Roadmap

Proponha roadmap realista.

Inclua:

- fase 0: validacao sem app;
- fase 1: prototipo navegavel;
- fase 2: MVP privado;
- fase 3: beta publico;
- fase 4: crescimento;
- fase 5: internacionalizacao;
- fase 6: recursos avancados.

Para cada fase:

- objetivo;
- features;
- nao escopo;
- criterio de pronto;
- riscos;
- metricas;
- custo;
- equipe minima;
- tempo estimado.

Tambem proponha uma versao "ultra enxuta" que possa ser validada em 2 semanas.

## Perspectiva 15: Workflow De Desenvolvimento

Proponha workflow para construir com seguranca:

- organizacao de pastas;
- branching;
- commits;
- issues;
- ADRs;
- PR review;
- testes;
- security review;
- privacy review;
- release checklist;
- feedback de usuarios;
- bug triage;
- observabilidade.

Inclua:

- Definition of Ready;
- Definition of Done;
- checklist antes de merge;
- checklist antes de beta;
- checklist antes de producao.

## Perspectiva 16: Critica Ao Plano Atual

Critique diretamente os documentos atuais.

Para cada documento lido, responda:

- o que esta forte;
- o que esta fraco;
- o que esta vago;
- o que esta perigoso;
- o que precisa virar decisao;
- o que deve ser removido;
- o que deve ser detalhado.

Nao tenha medo de dizer que uma parte esta ingenua ou grande demais.

## Perspectiva 17: Propostas Alternativas

Proponha pelo menos 5 caminhos alternativos:

1. PWA com sync como planejado.
2. PWA sem backend inicialmente.
3. Bot/assistente de planejamento sem login, so por username.
4. Extensao/browser companion.
5. Produto para professores/clubes.
6. Produto apenas PT-BR para iniciantes.
7. Produto global em ingles desde o inicio.
8. Produto de analise pos-partida sem plano diario.

Para cada alternativa:

- descricao;
- vantagens;
- desvantagens;
- risco;
- custo;
- velocidade;
- potencial;
- recomendacao.

## Perspectiva 18: Concorrente Ja Existe?

Responda explicitamente:

- Existe algum produto que ja faca isso bem o suficiente?
- Se sim, qual?
- Por que o Lichess Tutor ainda faria sentido ou nao?
- O que seria desperdicio de tempo?
- O que seria diferencial verdadeiro?
- Qual nicho ainda esta aberto?

Classifique:

- "nao construir";
- "construir apenas se pivotar";
- "construir MVP menor";
- "construir como proposto";
- "construir com ambicao maior".

## Perspectiva 19: Plano De Validacao Antes De Codar

Proponha experimentos sem construir app completo:

- entrevistas;
- landing page;
- planilha manual;
- grupo piloto;
- rotina enviada por mensagem;
- prototipo Figma;
- prompts manuais de plano;
- teste com usuarios Lichess reais;
- teste com professores;
- teste de disposicao a doar.

Para cada experimento:

- pergunta que responde;
- como executar;
- tempo;
- custo;
- amostra minima;
- sinal de sucesso;
- sinal de fracasso;
- decisao apos resultado.

## Perspectiva 20: Decisao Final

Finalize com:

- recomendacao clara;
- top 10 mudancas no plano;
- top 10 riscos;
- top 10 oportunidades;
- roadmap recomendado;
- MVP recomendado;
- primeira tarefa tecnica;
- primeira tarefa de pesquisa de usuario;
- primeira tarefa de marketing;
- primeira tarefa de privacidade;
- primeira tarefa de arquitetura.

## Formato Da Resposta

Use Markdown. Seja organizado. Inclua tabelas onde ajudarem. Separe:

- Identificacao do relatorio;
- Fatos pesquisados;
- Inferencias;
- Opiniao estrategica;
- Recomendacoes.

No topo do relatorio, inclua obrigatoriamente:

```md
# Relatorio De Auditoria: [Nome curto escolhido pela IA]

- IA/autoria: [nome do modelo ou da IA]
- Nome proprio do relatorio: [nome unico e facil de identificar]
- Data da analise: [AAAA-MM-DD]
- Versao dos documentos analisados: [descrever se foi pasta local, zip, commit ou colagem]
- Sugestao de nome de arquivo: relatorio-[nome-da-ia-ou-modelo]-[nome-curto]-lichess-tutor.md
```

Escolha um nome proprio para o relatorio que ajude a diferenciar sua analise das demais. Exemplos de formato: `Relatorio Prisma`, `Relatorio Torre Aberta`, `Relatorio Mercado & Metodo`, `Relatorio Due Diligence Alpha`. Nao use apenas "Relatorio Final".

Inclua links das fontes usadas. Nao use fontes sem data quando informacao puder estar desatualizada. Quando nao souber, diga que nao sabe e proponha como descobrir.

## Criterio De Qualidade

Sua resposta sera considerada boa se:

- encontrar riscos que o fundador ainda nao viu;
- cortar escopo com coragem;
- apontar concorrentes reais;
- propor validacoes antes de codar;
- proteger o projeto de problemas de API, privacidade e custo;
- melhorar a tese de produto;
- entregar um roadmap acionavel;
- separar opiniao de evidencia;
- ajudar a decidir se vale fazer.
