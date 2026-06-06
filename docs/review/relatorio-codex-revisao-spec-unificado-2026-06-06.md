# Relatorio De Revisao: Codex - Spec Unificado Em Xeque

- IA/autoria: Codex GPT-5
- Nome proprio do relatorio: Relatorio Spec Unificado Em Xeque
- Data da analise: 2026-06-06
- Documento analisado: `docs/superpowers/specs/2026-06-06-chess-tutor-unified-app-design.md`
- Versao dos documentos analisados: pasta local `lichess-tutor`, apos consolidacao do Diretor Geral em 2026-06-06
- Sugestao de nome de arquivo: `relatorio-codex-revisao-spec-unificado-2026-06-06.md`

## 1. Veredito Executivo

Minha recomendacao e direta: **rejeitar este spec como ordem de execucao**.

Ele pode ser preservado como documento de ideias tecnicas futuras, mas nao deve guiar Codex, Claude ou qualquer outro agente na fase atual. O spec e bom em arquitetura de dominio e ruim em governanca de produto. Ele mistura uma proposta tecnicamente sofisticada com uma premissa estrategica ja recusada: unir Lichess, ChessKing, Chess.com, screenshots, sync e coletores antes de validar a dor central.

O problema nao e falta de inteligencia. O problema e excesso de inteligencia aplicada no momento errado.

O projeto ja consolidou uma decisao superior: Fase 0 e validacao sem app; Fase 1 e MVP local-first puro, sem backend, sem OAuth, sem sync, sem Chess.com, foco 0-1200, nome publico a definir. O spec unificado tenta reabrir tudo isso por baixo da mesa, chamando-se de "ordem de execucao" e apontando para `chessking-tutor` como base de codigo. Isso conflita com `AGENTS.md`, `PLANO.md`, `memory/state.md`, `memory/decisions.md` e o relatorio consolidado do Diretor Geral.

Classificacao:

| Dimensao | Nota | Comentario |
|---|---:|---|
| Valor tecnico futuro | 7.5/10 | Ha bons tipos, camadas, regras puras e ideias de mapeamento fonte -> destino. |
| Aderencia ao plano atual | 2/10 | Viola ou contorna varias decisoes consolidadas. |
| Risco de escopo | 9/10 | Multi-fonte, sync, API, screenshot, ChessKing e Chess.com cedo demais. |
| Risco juridico/IP | 8/10 | Reabre contaminacao com app pago anterior e marca ChessKing. |
| Executabilidade imediata | 0/10 | Nao deve ser executado na fase atual. |

Decisao recomendada: **marcar o spec como nao executavel / superseded**, extrair dele apenas uma lista de ideias futuras, e pedir ao Diretor Geral que aprove qualquer reaproveitamento apos a Fase 0.

## 2. O Que O Spec Tenta Fazer

O documento propoe um PWA unico, local-first e multi-fonte, capaz de:

- ler historico publico do Lichess;
- importar dados publicos do Chess.com;
- registrar progresso manual de ChessKing;
- receber prints de outros apps;
- gerar plano por fraquezas;
- abrir tarefas no Lichess ou registrar destinos ChessKing;
- sincronizar PC e celular por Worker + KV;
- evoluir a base de codigo de `chessking-tutor`;
- tratar o documento e planos derivados como "ordens de execucao".

Como conceito de produto maduro, isso parece tentador. Como proximo passo deste projeto, e perigoso.

## 3. Conflito Central: O Spec Nao Tem Autoridade

O ponto mais grave aparece logo no topo do documento:

- O spec diz que a base de codigo deve evoluir o app existente em `chessking-tutor`.
- O spec diz que ele e os planos derivados sao "ordens de execucao".
- O spec diz que Codex deve implementar exatamente o que esta escrito.

Isso entra em choque com a governanca atual:

- `AGENTS.md` define que Claude e Diretor Geral, Codex e Executor, DeepSeek/Gemini sao Consultores.
- `AGENTS.md` diz que diretivas so podem ser executadas se forem compativeis com as regras inquebraveis.
- `memory/decisions.md` registra que o projeto deve permanecer separado do app pago anterior.
- `memory/decisions.md` registra que nenhum codigo deve ser feito antes da Fase 0 de validacao.
- `PLANO.md` revisado define Fase 0 sem app, sem backend, sem banco, sem pacote NPM e sem service worker.

Minha leitura: este spec e um documento de planejamento externo ou alternativo, nao uma decisao canonica. Ele nao pode dar ordens ao Codex.

## 4. Pontos Fortes Reais

Apesar do veredito duro, ha material bom aqui.

### 4.1 Arquitetura de dominio limpa

A regra "Dominio nao importa Infra" e excelente. Separar dominio puro, aplicacao, UI e infra e exatamente o tipo de arquitetura que vai reduzir erro quando o app existir.

O desenho abaixo e forte:

- `weakness/` como detector puro;
- `plan/` como gerador puro;
- `metrics/` como calculo local;
- `coach/` como selecao de microcopy;
- `sources/` como mapa fonte -> destino;
- services externos isolados.

Isso deve ser preservado como orientacao futura, nao como tarefa de agora.

### 4.2 Modelo Signal -> Weakness -> Plan

A cadeia conceitual e boa:

```text
sinais pequenos e derivados -> fraquezas priorizadas -> plano diario com blocos
```

Ela evita salvar PGN completo por padrao e cria uma base testavel. O projeto precisa dessa ideia no futuro.

O problema e que o spec tenta alimentar essa cadeia cedo demais com Lichess games export, Chess.com, ChessKing e screenshots. A estrutura e boa; o timing e ruim.

### 4.3 Sessao por tempo disponivel

O plano sensivel a 5, 15, 30 ou 60 minutos e uma das melhores ideias do documento. Isso conversa diretamente com a dor real do aluno: "tenho pouco tempo e nao sei o que fazer hoje".

Essa parte deveria entrar no design do MVP local-first, mesmo sem API externa.

### 4.4 Guardrails de API

O spec acerta ao exigir:

- uma requisicao por vez;
- espera minima apos HTTP 429;
- `User-Agent` identificavel;
- revalidacao de campos contra a documentacao oficial;
- sem OAuth no MVP;
- sem engine no MVP;
- sem Board/Bot/Challenge API;
- sem ajuda ao vivo.

Esses pontos continuam validos. Eles ja aparecem tambem em `AGENTS.md` e nas fontes oficiais revalidadas.

### 4.5 Professor Lemos como microcopy

O uso de `task`, `stopRule`, `reason` e `coachNote` e bom. Ele transforma o "tutor" em orientacao curta, nao personagem inflado.

Mas isso deve ficar no tom do MVP, nao em uma promessa de tutor adaptativo amplo.

## 5. Problemas Bloqueadores P0

### P0.1 - O spec manda executar app antes da Fase 0

No plano consolidado, Fase 0 significa validacao sem app:

- experimento de nome;
- landing page;
- 20 entrevistas;
- piloto manual;
- prototipo Figma.

No spec unificado, "Fase 0" significa refatorar dominio em codigo, alterar tipos e rodar `npm run lint && npm run test && npm run build`. Isso e uma inversao completa do calendario. O nome "Fase 0" foi reutilizado para uma coisa oposta.

Decisao: rejeitar a nomenclatura do spec. A Fase 0 canonica e a de `PLANO.md`.

### P0.2 - Ele reabre a mistura com `chessking-tutor`

O spec diz para evoluir o app existente em `chessking-tutor` e manter ChessKing como fonte dentro do mesmo app. Isso e exatamente o tipo de risco que a separacao do projeto queria evitar.

Mesmo que o spec proiba copiar conteudo proprietario, a direcao "app unico Lichess + ChessKing" cria quatro riscos:

- contaminacao de escopo;
- contaminacao de UX;
- dependencia mental do app pago anterior;
- confusao juridica/comercial com uma marca e um produto pagos.

O projeto atual existe para ser novo, gratuito, aberto e Lichess-first. ChessKing, se aparecer, deve no maximo ser uma nota manual do usuario em fase futura, nao uma fonte de produto.

Decisao: rejeitar qualquer "ADR-004: app unico multi-fonte" enquanto a governanca atual estiver de pe.

### P0.3 - O spec declara autoridade que nao possui

Um arquivo em `docs/superpowers/specs/` nao pode sobrepor:

- `AGENTS.md`;
- `PLANO.md`;
- `memory/decisions.md`;
- relatorio do Diretor Geral.

A frase "ordens de execucao" deve ser considerada invalida. Codex deve parar se receber tarefa baseada nela sem confirmacao do Diretor Geral.

### P0.4 - Ele contradiz o MVP consolidado

MVP consolidado:

- sem backend;
- sem OAuth;
- sem sync;
- sem Chess.com;
- foco 0-1200;
- sem codigo antes da validacao.

Spec unificado:

- sync em Fase C;
- Chess.com em Fase D;
- import Lichess automatico em Fase A/B;
- detector de fraquezas por historico real;
- foco ate 1600 no tipo `LearnerProfile`;
- backend Worker + KV;
- execucao por fases de codigo.

Mesmo quando o spec joga alguns itens para fases posteriores, ele os coloca dentro do mesmo plano de implementacao. Isso muda o centro de gravidade do projeto de "validar rotina" para "construir plataforma".

Decisao: rejeitar como roadmap.

### P0.5 - Ele atualiza "conscientemente" uma decisao que ja foi revisada pelo Diretor Geral

O spec afirma que backend minimo existe para sync de um usuario e que isso atualiza a decisao antiga "sem backend no MVP". Essa atualizacao nao tem autoridade.

A decisao canonica mais recente e outra: sync e backend estao adiados para Fase 2, e o MVP e local-first puro.

Decisao: manter `PLANO.md` e `memory/decisions.md`; nao aceitar a revisao embutida no spec.

## 6. Riscos Tecnicos E De Plataforma

### 6.1 Lichess API

O spec usa endpoints reais e plausiveis:

- `GET /api/user/{username}`;
- `GET /api/user/{username}/rating-history`;
- `GET /api/games/user/{username}`;

As fontes oficiais confirmam que:

- Lichess recomenda uma requisicao por vez e esperar ao menos um minuto apos 429.
- O endpoint de exportacao de jogos pode devolver PGN ou NDJSON e pode ser muito longo.
- Parametros como `max`, `rated`, `analysed`, `moves`, `pgnInJson`, `clocks`, `evals`, `accuracy`, `opening` existem.
- OAuth PKCE no Lichess usa tokens long-lived e sem refresh token, entao e assunto sensivel para fases futuras.
- Board API e Bot API envolvem jogo e fair play, e devem continuar fora do MVP.

O problema nao e o endpoint existir. O problema e usar `games export` como fundacao cedo demais.

Riscos:

- `analysis`, `accuracy` e `evals` so existem quando disponiveis; o parser precisa tolerar ausencia.
- Jogos recentes podem ser ruidosos para diagnostico pedagogico.
- Exportar 50 jogos com `evals=true`, `accuracy=true`, `clocks=true` e `opening=true` e mais pesado do que o necessario para validar rotina.
- Abrir links de analise precisa garantir que o jogo esta terminado; qualquer orientacao durante jogo ao vivo e risco de fair play.

Recomendacao:

- Fase 1: zero chamadas automaticas de API.
- Fase 2: comecar por perfil publico e rating history.
- Fase 2+: game export apenas com `max` baixo, `finished=true`, `moves=false`, `pgnInJson=false`, parser tolerante e descarte de bruto.

### 6.2 Chess.com Published Data API

O spec acerta ao tratar Chess.com como publico, read-only e serial.

A fonte oficial confirma que a API e read-only, usa dados publicos, pode ter dados com atualizacao limitada/cache, e recomenda evitar paralelismo. Tambem informa que perfil publico pode conter campos como nome, avatar e localizacao.

Riscos:

- Importar perfil inteiro pode trazer PII desnecessaria.
- Buscar archives/games pode trazer PGNs completos ou dados alem do necessario.
- Comparar rating Chess.com e Lichess pode criar falsa precisao.

Recomendacao:

- manter Chess.com fora do MVP;
- se entrar, usar primeiro apenas `/stats`;
- evitar `/player/{username}` salvo necessidade explicita;
- se usar games/archives, parsear transientemente e descartar bruto.

### 6.3 Cloudflare Worker + KV para sync

O spec propoe `PUT /state/{keyHash}` e `GET /state/{keyHash}` com um JSON de estado inteiro em Workers KV.

Isso e simples, mas nao e automaticamente seguro.

Riscos:

- Workers KV e eventualmente consistente; mudancas podem demorar para aparecer em outras localidades. Isso enfraquece sync quase imediato entre PC e celular.
- Last-write-wins por secao pode perder edicoes se dois dispositivos alterarem secoes proximas.
- Um segredo no path (`keyHash`) vira a unica barreira de acesso. Se vazar em log, historico, analytics ou suporte, o estado fica exposto.
- Um JSON unico escala mal para prints, notas longas e historico.
- O spec nao exige criptografia do blob antes de enviar ao Worker.
- O spec nao separa "dados sincronizaveis" de "dados locais que nunca devem subir", como screenshots.

Recomendacao:

- manter sync fora do MVP;
- quando voltar, comparar D1, Durable Objects e KV com criterios claros;
- se KV for usado, tratar como armazenamento de blob criptografado client-side;
- nao sincronizar screenshots por padrao;
- definir KDF, versao de schema, limite de tamanho, delete remoto e rotacao do codigo.

### 6.4 PWA

PWA continua adequada. MDN confirma requisitos de instalabilidade como manifest, icones, `start_url`, `display` e HTTPS/local dev.

Mas PWA nao precisa significar "build agora". Na fase atual, PWA e uma decisao arquitetural futura, nao tarefa executavel.

## 7. Riscos De Produto

### 7.1 Multi-fonte enfraquece o diferencial

O projeto consolidado venceu um conflito estrategico ao escolher simplicidade:

> rotina externa para estudar melhor usando Lichess.

O spec unificado volta para:

> app pessoal multi-fonte que entende Lichess, Chess.com, ChessKing, prints e outros apps.

Isso parece mais poderoso, mas e menos vendavel. O usuario 0-1200 nao precisa de um painel universal de fontes. Ele precisa de uma tarefa clara hoje.

### 7.2 O app vira cockpit, nao rotina

Quando o produto vira "fonte configuravel", "detector", "sync", "print", "importador", "revisao semanal", "feedback", "mapa de destino", "ChessKing sem URL", "Chess.com stats", ele deixa de ser um assistente leve.

O risco e repetir o problema que o app tenta resolver: mais uma superficie para administrar estudo.

### 7.3 O foco 0-1600 e largo demais

O tipo `LearnerProfile` trava a banda ate `1200-1600`. Isso ja e maior do que o MVP consolidado. O salto 1200-1600 muda o problema pedagogico: calculo, conversao, abertura, finais e revisao ficam mais complexos.

Recomendacao: manter 0-1200 no MVP e tratar 1200-1600 como outra tese.

### 7.4 A falsa personalizacao e um risco central

O detector de fraquezas por dados publicos pode parecer cientifico demais para sinais fracos. Exemplo:

- derrota longa vira `conversion` ou `endgame`;
- cor com desempenho ruim vira `opening-principles`;
- relogio baixo vira `time-trouble`.

Essas inferencias podem ser uteis, mas devem ser apresentadas como hipoteses, nao diagnostico. Para iniciante, muitas "fraquezas" sao apenas ruido estatistico.

Recomendacao: linguagem sempre probabilistica: "sinal possivel", "vamos testar", "parece valer revisar", nunca "voce perde por X".

## 8. Riscos De Privacidade, Direito E Contaminacao

### 8.1 ChessKing como fonte e um risco desnecessario

O spec tenta ser cuidadoso: nao copiar conteudo, usar apenas nomes de curso/secao e progresso informado. Ainda assim, inserir ChessKing como fonte oficial do novo app e um risco estrategico.

Problemas:

- reforca dependencia do app pago anterior;
- incentiva o usuario/agente a olhar estrutura proprietaria;
- aproxima a nova proposta aberta de uma marca paga externa;
- aumenta superficie de acusacao de copia, mesmo sem copia literal.

Recomendacao: remover ChessKing do plano do MVP e dos ADRs. Se o usuario quiser registrar estudo externo, usar categoria generica "Outro estudo" com texto livre.

### 8.2 Screenshots sao dados pesados e possivelmente sensiveis

Prints podem conter:

- nome de usuario;
- avatar;
- progresso em produto pago;
- dados de terceiros;
- elementos protegidos por copyright;
- informacao pessoal acidental.

IndexedDB local pode aceitar isso em fase futura, mas sincronizar prints ou tratar prints como evidencia central cria risco.

Recomendacao: prints fora do MVP; se entrarem, apenas local, com aviso de direitos e privacidade, e nunca por upload remoto padrao.

### 8.3 `value: unknown` e perigoso

O tipo `Signal.value: unknown` da flexibilidade, mas tambem permite guardar qualquer coisa. Em um projeto guiado por privacidade, isso e uma porta aberta para dados brutos.

Recomendacao: substituir por union types estritos quando a fase de codigo existir.

Exemplo:

```ts
type SignalValue =
  | { type: 'rating'; perf: 'rapid' | 'blitz' | 'classical'; rating: number }
  | { type: 'time-control'; speed: string; count: number }
  | { type: 'manual-tag'; tag: WeaknessTag; note?: string }
```

## 9. O Que Deve Ser Aceito, Rejeitado Ou Adiado

### Aceitar como diretriz futura

- Camadas UI -> Aplicacao -> Dominio -> Infra.
- Dominio sem rede e sem React.
- Funcoes puras para detector e gerador.
- Modelo conceitual `Signal -> Weakness -> DailyPlan`.
- Blocos com `task`, `stopRule`, `reason` e `coachNote`.
- Sessao por tempo disponivel: 5, 15, 30, 60 minutos.
- Revalidacao obrigatoria de APIs oficiais antes de coletor.
- Nao usar OAuth, engine, OCR ou ajuda ao vivo no MVP.
- Guardrails de rate limit e 429.

### Rejeitar agora

- Tratar o spec como ordem de execucao.
- Evoluir `chessking-tutor` como base.
- Criar app unico Lichess + ChessKing.
- Criar ADR que "atualiza" separacao de projeto.
- Refatorar dominio como "Fase 0".
- Implementar API Lichess, Chess.com, sync ou Worker antes da validacao.
- Usar Worker + KV como decisao aprovada de sync.
- Incluir Chess.com no MVP ou na primeira linha de produto.
- Incluir ChessKing como fonte nominal.
- Foco 0-1600 no MVP.

### Adiar para decisao futura

- Coletor publico Lichess.
- Export de jogos Lichess com NDJSON.
- Detector de fraquezas por partidas analisadas.
- Chess.com `/stats` como sinal de banda.
- Screenshots manuais.
- Sync por codigo.
- Worker + KV, D1 ou Durable Objects.
- Auto-deteccao de conclusao.
- Faixas 1200-1600 e 1600-2000.

## 10. Minha Opiniao Profunda

Este spec e o tipo de documento que seduz engenheiro e trai fundador.

Ele da a sensacao de progresso porque tem tipos, camadas, endpoints, fases, DoD e testes. Mas o que ele realmente faz e deslocar o projeto da pergunta certa para a pergunta errada.

A pergunta certa agora e:

> Jogadores 0-1200 querem uma rotina simples o bastante para cumprir por uma semana?

A pergunta do spec e:

> Como construir um sistema multi-fonte local-first com detectores, sync e destinos generalizados?

A segunda pergunta so merece existir se a primeira for respondida com evidencia. Ainda nao foi.

O spec tambem tem uma ansiedade escondida: ele tenta salvar trabalho do app antigo (`chessking-tutor`) e ao mesmo tempo fazer o novo produto nascer limpo. Essas duas coisas brigam. Se o novo projeto precisa ser gratuito, aberto, sem contaminacao e sem conteudo pago, a separacao nao e burocracia; e higiene estrategica.

A parte boa do spec deve virar "prateleira tecnica": quando o projeto entrar em codigo, talvez varias ideias sejam reaproveitadas. Mas deixar esse documento com status de ordem e perigoso. Um agente obediente poderia comecar a criar `src`, alterar arquitetura, importar conceitos do app pago e abrir backend antes de o produto ter nome validado.

Meu julgamento final: **o spec e uma boa arquitetura para uma fase que ainda nao existe, escrita como se essa fase ja tivesse sido aprovada.**

## 11. Recomendacao Operacional

1. Manter o spec no repositorio, mas marcar como **nao executavel** ou **superseded**.
2. Criar, se necessario, um documento menor: `docs/future/ideas-from-unified-spec.md`.
3. Extrair apenas estas ideias para backlog futuro:
   - dominio puro;
   - time budget;
   - Signal/Weakness/Plan;
   - mapa de destino por fonte;
   - guardrails de API.
4. Proibir execucao de qualquer fase deste spec sem nova aprovacao do Diretor Geral.
5. Manter a proxima etapa canonica: Fase 0 de validacao sem app.

## 12. Diretivas Para Codex Executor

Se alguem pedir para Codex executar este spec agora, Codex deve responder:

> Nao posso executar este spec como esta, porque ele conflita com `AGENTS.md`, `PLANO.md` e `memory/decisions.md`. Posso extrair ideias futuras ou ajudar a reescrever o spec como documento nao executavel, mas nao criar app, backend, `src`, `package.json` ou migrar `chessking-tutor` antes da Fase 0 de validacao ser concluida e aprovada.

Tarefas permitidas agora:

- revisar documentacao;
- criar relatorios;
- criar ADRs que reforcem a decisao vigente;
- preparar roteiro de entrevistas;
- preparar experimento de nome;
- preparar prototipo ou prompt de Figma, se aprovado;
- atualizar memoria e plano conforme decisoes do Diretor Geral.

Tarefas nao permitidas agora:

- implementar fases 0/A/B/C/D do spec;
- criar `package.json`;
- criar `src`;
- criar backend;
- conectar Cloudflare;
- importar codigo do app pago anterior;
- automatizar ChessKing;
- criar coletor Lichess ou Chess.com.

## 13. Fontes Oficiais Revalidadas

Pesquisa oficial revalidada em 2026-06-06:

- [Lichess API Tips](https://lichess.org/page/api-tips): uma requisicao por vez; apos HTTP 429, esperar um minuto completo antes de retomar.
- [Lichess API spec](https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml): OAuth PKCE, escopos sensiveis, endpoints de users, games e puzzles.
- [Lichess games export spec](https://github.com/lichess-org/api/blob/master/doc/specs/tags/games/api-games-user-username.yaml): parametros de exportacao de jogos, NDJSON, `max`, `moves`, `pgnInJson`, `evals`, `accuracy`, `opening`, `sort`.
- [Lichess rating history spec](https://github.com/lichess-org/api/blob/master/doc/specs/tags/users/api-user-username-rating-history.yaml): historico publico por usuario.
- [Lichess user public data spec](https://github.com/lichess-org/api/blob/master/doc/specs/tags/users/api-user-username.yaml): dados publicos de usuario.
- [Lichess Fair Play](https://lichess.org/page/fair-play): proibicao de assistencia externa durante partida real-time e restricoes sobre programas/extensoes de jogo.
- [Chess.com Published Data API](https://www.chess.com/news/view/published-data-api): API publica read-only, cuidado com paralelismo, cache e user-agent identificavel.
- [MDN PWA installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable): requisitos de instalabilidade PWA.
- [Cloudflare Workers KV - How KV works](https://developers.cloudflare.com/kv/concepts/how-kv-works/): KV e global, de baixa latencia e eventualmente consistente; mudancas podem demorar a aparecer em outras localidades.

## 14. Conclusao

Nao execute o spec.

Use-o como material de estudo. Ele tem pecas boas, mas esta montado no tabuleiro errado. A decisao mais saudavel e preservar a intencao tecnica e bloquear a ordem operacional.

O projeto nao precisa agora de um app unificado. Precisa provar que uma rotina curta, clara e independente ajuda jogadores 0-1200 a voltar no dia seguinte.

