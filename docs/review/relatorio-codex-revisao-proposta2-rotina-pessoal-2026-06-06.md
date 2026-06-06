# Relatorio De Revisao: Proposta 2 No Trilho Estreito — Codex GPT-5 / assinatura: consultor tecnico

- IA/autoria: Codex GPT-5
- Papel: consultor tecnico; insumo, nao ordem
- Data da analise: 2026-06-06
- Documento analisado: `docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md`
- Moldura fixa respeitada: pessoal primeiro, comunidade depois; `jukasparov`; sem relitigar validacao de mercado antes de codar
- Arquivos correlatos lidos: `AGENTS.md`, `PLANO.md`, `memory/decisions.md`, `memory/state.md`, ADR-004 a ADR-007, docs de sync/integracoes/privacidade/pedagogia, spec superseded e revisoes anteriores
- Checagem clean-room: `chessking-tutor/` foi inspecionado somente em leitura para verificar riscos de heranca; nenhum arquivo foi copiado

## 1. Veredito Executivo

**A Proposta 2 e uma correcao real do spec anterior, mas ainda nao e um plano de implementacao pronto para Codex executar sem adivinhar.**

Nao vou recomendar "validar mercado antes de codar"; essa moldura foi substituida pelo dono para a ferramenta pessoal. Dentro da moldura pessoal, o rumo geral esta correto: app novo clean-room, Lichess-first, sem ChessKing, sem OAuth, sem engine, sync depois do valor, Chess.com so P4, comunidade so P5.

O problema agora e outro: o spec esta bom como **design de produto/arquitetura**, mas ainda tem lacunas que fariam o Codex inventar detalhes na hora de codar, principalmente em P0 e P1.

Minha decisao tecnica:

- **P0 pode avancar somente depois de um plano de implementacao atomico.**
- **P1 nao deve ser implementado como esta**; precisa corrigir contratos do coletor Lichess, limiares do detector e a regra de slugs dinamicos.
- **P3 melhorou muito com D1 + merge por registro**, mas ainda falta resolver clock skew, tombstones, chave/codigo, criptografia opcional e modelo de eventos.
- **A correcao clean-room foi aplicada no texto**, mas precisa de barreira operacional no plano: proibicao explicita de ler/copiar codigo do `chessking-tutor` durante implementacao, exceto auditoria documental.

Nota:

| Dimensao | Nota | Comentario |
|---|---:|---|
| Alinhamento com governanca atual | 8/10 | Respeita a moldura pessoal e corrige os P0 do spec superseded. |
| Prontidao para P0 | 6/10 | Falta plano atomico, dependencias, schema IndexedDB e plano fixo exato. |
| Prontidao para P1 | 4/10 | API Lichess e detector ainda tem ambiguidades que geram falso sinal. |
| Clean-room/IP | 8/10 | Correto no texto; falta checklist operacional anti-copia. |
| Sync P3 | 6/10 | Melhor direcao, mas ainda subespecificado para conflito real. |
| Risco de violar regra inquebravel | medio | Principal risco: "validar slugs em runtime" pode virar scraping de HTML. |

## 2. Fatos Revalidados Em Fontes Oficiais

### FATO

- Lichess API Tips diz que a API deve ser usada com uma requisicao por vez e, apos HTTP 429, deve-se esperar um minuto completo antes de retomar. Fonte revalidada em 2026-06-06: https://lichess.org/page/api-tips
- Lichess prefere endpoint oficial a scraping/browser automation. Fonte revalidada em 2026-06-06: https://lichess.org/page/api-tips
- `GET /api/games/user/{username}` exporta jogos em PGN ou NDJSON, ordenados do mais recente para o mais antigo; a propria spec recomenda streaming porque a resposta pode ser longa. Fonte revalidada em 2026-06-06: https://github.com/lichess-org/api/blob/master/doc/specs/tags/games/api-games-user-username.yaml
- O export de jogos aceita parametros relevantes: `max`, `rated`, `perfType`, `analysed`, `moves`, `pgnInJson`, `clocks`, `evals`, `accuracy`, `opening`, `ongoing`, `finished`, `sort`. Fonte revalidada em 2026-06-06: https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/games/api-games-user-username.yaml
- O schema `GamePlayerUser` tem `players.white/black.analysis.{inaccuracy,mistake,blunder,acpl,accuracy}` quando disponivel. Fonte revalidada em 2026-06-06: https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/schemas/GamePlayerUser.yaml
- O schema `GameJson` tambem pode incluir uma `analysis` top-level por lance quando `evals=true`; isto e mais pesado do que contar erros agregados por jogador. Fonte revalidada em 2026-06-06: https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/schemas/GameJson.yaml
- Lichess Fair Play proibe assistencia externa durante partidas em tempo real e programas/extensoes que ajudem a jogar lances. Fonte revalidada em 2026-06-06: https://lichess.org/page/fair-play
- Chess.com Published Data API e read-only, publica, nao permite enviar lances/comandos, e acesso serial deve evitar rate limit; requisicoes paralelas podem receber 429. Fonte revalidada em 2026-06-06: https://www.chess.com/news/view/published-data-api
- Chess.com recomenda user-agent reconhecivel com contato para poder avisar se bloquear aplicacao por atividade suspeita. Fonte revalidada em 2026-06-06: https://www.chess.com/news/view/published-data-api
- Chess.com `/stats` pode omitir objetos/campos nao coletados ou sem atividade. Fonte revalidada em 2026-06-06: https://www.chess.com/news/view/published-data-api
- Cloudflare D1 Free inclui 5M rows read/dia, 100k rows written/dia e 5 GB total; D1 cobra por linhas lidas/escritas e armazenamento. Fonte revalidada em 2026-06-06: https://developers.cloudflare.com/d1/platform/pricing/
- Cloudflare KV e eventualmente consistente; mudancas podem levar ate 60s ou mais para aparecer em outras localidades, e KV nao e ideal para operacoes atomicas/transacionais. Fonte revalidada em 2026-06-06: https://developers.cloudflare.com/kv/concepts/how-kv-works/
- D1 read replication, quando habilitado, usa replicas assincronas; a Sessions API garante consistencia sequencial dentro de uma sessao. Fonte revalidada em 2026-06-06: https://developers.cloudflare.com/d1/best-practices/read-replication/
- MDN informa que PWA instalavel precisa de manifest com `name`/`short_name`, icones 192/512, `start_url`, `display`/`display_override` e HTTPS/localhost/loopback. Service worker nao e requisito absoluto de instalabilidade, mas e comum para offline. Fonte revalidada em 2026-06-06: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- A pagina `lichess.org/training/themes` lista temas e links como `fork`, `hangingPiece`, `backRankMate`, `mateIn1`, `mateIn2`, `rookEndgame`/temas relacionados de final etc. Fonte revalidada em 2026-06-06: https://lichess.org/training/themes

### INFERENCIA

- Buscar e parsear `lichess.org/training/themes` em runtime para "validar slugs dinamicos" parece scraping de HTML, nao uso de API oficial documentada. Isso colide com `AGENTS.md`, que proibe scraping e exige APIs oficiais/documentadas.
- Para a ferramenta pessoal de um usuario, sem OAuth e aceitavel se houver cache agressivo, botao manual, uma requisicao por vez, `max` baixo e tolerancia a 429. Para P5 comunidade, a propria governanca ja empurra OAuth.
- `evals=true` provavelmente e desnecessario para o primeiro detector se `players.*.analysis` estiver presente; `evals=true` traz analise por lance e aumenta payload.
- `moves=false` dificulta ou impede detectar "derrotas longas" por numero de lances, a menos que o parser use outro proxy confiavel como tamanho de `clocks`, o que o spec nao define.
- D1 e melhor que KV para sync por registro, mas dizer "consistencia imediata" sem qualificar Sessions API/read replication e impreciso.

### OPINIAO

- A Proposta 2 deve ser aprovada como **base de planejamento**, nao como ticket executavel direto.
- O maior erro que o planejador ainda nao viu e a tensao entre "slugs dinamicos" e "sem scraping". Corrigir isso antes do coletor evita violar regra inquebravel em nome de robustez.
- O segundo maior erro e tratar o detector como simples tabela de regras. Para 0-1200, os sinais sao ruidosos; sem minimos de amostra, recencia e filtro por ritmo, o app vai inventar fraquezas convincentes e erradas.

## 3. Achados Criticos

### P0 - "Slugs dinamicos" em runtime pode violar a regra anti-scraping

O spec diz para validar temas contra `lichess.org/training/themes` no runtime. Essa pagina e HTML, nao API. Se o Codex implementar fetch + parse dessa pagina, isso e scraping. O fato de ser uma pagina publica nao torna o uso permitido dentro das regras do projeto.

**Impacto:** violacao direta de `AGENTS.md`.

**Correcao:** trocar por:

- allowlist estatica de slugs validada manualmente contra a pagina oficial durante pesquisa;
- testes que verificam formato de URL, nao scrape runtime;
- opcionalmente uma tarefa manual de revalidacao antes de release;
- se existir API oficial de temas no futuro, so entao usar dinamicamente.

### P1 - O coletor Lichess nao especifica como extrair cor/usuario com seguranca

O detector depende de saber se `jukasparov` jogou de brancas ou pretas. O spec nao define:

- comparacao por `players.white.user.id` ou `name`;
- case folding;
- como lidar com usuario anonimo/AI/deleted;
- como ignorar variantes nao-standard;
- como lidar com username alterado ou conta inexistente.

**Impacto:** Codex pode contar blunders do adversario como blunders do dono.

**Correcao:** P1 deve exigir uma funcao pura:

```ts
getPlayerSide(game, username): 'white' | 'black' | null
```

com fixtures para username maiusculo/minusculo, user ausente e jogo fora de standard.

### P1 - `moves=false` contradiz a regra "derrotas longas"

O spec quer inferir `conversion` / `endgame-*` a partir de derrotas longas, mas o coletor define `moves=false`. Sem moves, nao ha numero de lances. Talvez `clocks` tenha comprimento correlacionado com plies, mas isso nao esta especificado e nao deve ser assumido.

**Impacto:** detector implementado por chute ou regra morta.

**Correcao:** cortar essa regra de P1 ou especificar uma fonte de `plyCount` permitida:

- `moves=true` apenas transiente, parsear contagem e descartar imediatamente; ou
- usar `clocks.length` somente se confirmado por fixture real; ou
- adiar `conversion/endgame-*` ate um coletor com dados suficientes.

### P1 - `evals=true` e provavelmente payload demais para o primeiro detector

O spec inclui `evals=true`, mas o objetivo inicial e usar contagens agregadas `players.*.analysis`. A doc indica que `evals=true` inclui avaliacoes/comentarios por lance em `analysis` JSON, o que aumenta payload e superficie de parse.

**Impacto:** mais carga no Lichess e parser mais complexo sem necessidade imediata.

**Correcao:** P1 deve testar primeiro:

```text
analysed=true&accuracy=true&opening=true&clocks=true&moves=false&pgnInJson=false&evals=false
```

Se `players.*.analysis` nao vier, so entao justificar `evals=true`.

### P1 - `User-Agent identificavel` e impossivel em fetch direto do browser

O spec exige `User-Agent` identificavel. Em uma PWA client-side, JavaScript no browser nao pode definir o header `User-Agent` arbitrariamente. Para Chess.com, a fonte oficial recomenda user-agent reconhecivel; para Lichess, o spec tambem exige. Isso conflita com "sem backend ate P3".

**Impacto:** Codex pode tentar setar header proibido, falhar silenciosamente ou criar backend cedo.

**Correcao:** explicitar:

- P1/P4 client-side: nao tentar setar `User-Agent`; usar `Accept`, cache e serializacao;
- P3/P5 backend/proxy: `User-Agent` identificavel passa a ser possivel;
- nao criar proxy so para satisfazer UA na ferramenta pessoal.

### P1 - Sync por `updatedAt` ainda perde dados se relogios divergem

Merge por registro e melhor que LWW por secao. Mas se PC e celular tiverem relogios divergentes, `updatedAt` client-side vira criterio inseguro. Tambem falta regra para empate e tombstone de delete.

**Impacto:** perda ou ressurreicao de registros em conflito.

**Correcao:** P3 precisa de:

- `clientId`;
- `recordId`;
- `updatedAtClient`;
- `serverSeq` monotono no D1;
- tombstones (`deletedAt`);
- tie-breaker deterministico (`serverSeq`, depois `clientId`);
- regra de status especifica: `done` vence `pending`, mas conflito `done` vs `skipped` precisa de semantica.

## 4. Ponto 1 - Execucao-Prontidao Para Codex

**Resposta curta:** P0 ainda nao esta pronto para Codex implementar direto; esta pronto para virar plano atomico. P1-P4 nao estao prontos sem detalhamento adicional.

Ambiguidades que fariam o Codex errar:

- P0 nao define versoes/dependencias: React, Vite, TypeScript, Dexie, Vitest, ESLint, plugin PWA ou nao.
- P0 diz "PWA", mas o DoD nao exige manifest, icones, `start_url`, `display`, HTTPS/local check, service worker ou estrategia offline.
- P0 nao define o plano fixo exato para 5/15/30/60. Exemplos nao sao contrato.
- P0 nao define schema Dexie: nomes de stores, indices, versao, shape de `AppData`, export/delete.
- P0 nao define UI minima: telas, estados vazios, configuracao de username, ou se `jukasparov` entra como default editavel.
- P1 diz "limiares exatos no plano de implementacao"; portanto o spec sozinho nao permite implementar detector.
- P1 nao define fixtures minimas: jogo analisado, jogo sem analysis, timeout, abertura recorrente, color imbalance, usuario nao encontrado.
- P2 nao define se feedback `easy/hard` fica em `PlanBlock` ou em log separado. Se ficar no bloco, regenerar plano pode apagar historico.
- P3 nao define endpoints, tabelas D1, evento/registro, tombstones, tie-breakers ou criptografia.
- P4 nao define quais campos de `/stats` viram rating e como lidar com campos ausentes.

**Correcao operacional:** criar um plano de implementacao P0 antes de qualquer codigo. Esse plano deve ser pequeno e fechado; depois P1 ganha outro plano.

## 5. Ponto 2 - Arquitetura

O desenho UI -> Aplicacao -> Dominio -> Infra esta correto. A cadeia `Signal -> Weakness -> Plan` tambem esta correta como arquitetura.

Fragilidades:

- `Signal.source` e `Signal.value.kind` podem divergir. Exemplo: `source:'lichess'` com `value.kind:'manual'`. Para tipos realmente estritos, `Signal` deveria ser uma union discriminada por fonte/kind ou validada em construtor.
- `SignalValue.manual.note` e texto livre. Tudo bem localmente, mas precisa limite de tamanho e aviso de privacidade.
- `Weakness.evidence` e string livre gerada no dominio; isso mistura calculo com texto. Melhor: dominio retorna `evidenceCode` + parametros; camada coach transforma em PT-BR. Se o dominio gerar texto, testes ficam acoplados a copy.
- `Destination.url` opcional permite bloco Lichess sem URL por acidente. Para `source:'lichess'`, URL deveria ser obrigatoria, exceto recomendacoes de ritmo/revisao sem destino.
- `DailyPlan` nao tem `id` nem `updatedAt`; sync P3 vai precisar disso.
- `PlanBlock.feedback?: 'easy' | 'hard'` omite `ok`, aceito para simplicidade, mas o algoritmo deve definir se ausencia significa `ok`, nao respondido, ou bloco antigo.

O core arquitetural e bom, mas os tipos ainda nao blindam os erros que o proprio spec quer evitar.

## 6. Ponto 3 - Correcoes Herdadas

| Correcao herdada | Status | Avaliacao |
|---|---|---|
| Clean-room | Parcialmente resolvida | O texto corrige. A implementacao ainda precisa checklist anti-copia e proibicao operacional de usar `chessking-tutor` como referencia de codigo. |
| Sem ChessKing no dominio | Resolvida | `SourceId` nao inclui ChessKing; P4 usa `outro`. |
| Tipos estritos sem `unknown` | Parcialmente resolvida | `SignalValue` e union, bom. Mas `Signal.source` e `value.kind` ainda podem formar combinacoes incoerentes. |
| Sync por registro e adiado | Parcialmente resolvida | P3 apos P2 esta correto. Falta server seq, tombstones, clock skew e tie-breaker. |
| Slugs dinamicos | Ainda aberto | A solucao proposta pode virar scraping. Deve mudar para allowlist validada manualmente ou API oficial se existir. |
| Erro/offline | Parcialmente resolvido | Ha fallback geral, mas falta maquina de estados, cancelamento, retry, TTL por endpoint e mensagens exatas. |
| Parser tolerante | Parcialmente resolvido | O spec pede tolerancia, mas nao define fixtures nem campos opcionais por schema. |
| Linguagem de hipotese | Resolvida no texto | Precisa testes de copy para bloquear frases deterministas. |

## 7. Ponto 4 - Lichess

Contratos principais estao plausiveis, mas nao suficientes.

O que esta correto:

- endpoints publicos escolhidos existem;
- `games/user` com NDJSON e `max=30` e melhor que `max=50`;
- `analysed=true`, `accuracy=true`, `opening=true`, `clocks=true`, `moves=false`, `pgnInJson=false` estao alinhados com minimizacao, salvo a ressalva de `evals=true`;
- parser tolerante a ausencia de analysis e obrigatorio;
- fair play esta respeitado no design: sem Board/Bot/Challenge, sem lance, analise so de partidas terminadas.

O que esta errado ou incompleto:

- Falta `perfType=rapid,classical,blitz` ou regra explicita de ritmos. Bullet deve ser ignorado ou ter peso muito baixo para diagnostico 0-1200.
- Falta explicitar `finished=true&ongoing=false`, mesmo que os defaults ajudem. Melhor nao depender de default para fair play.
- Falta funcao de identificacao de lado do usuario.
- Falta criterio de descarte para partidas sem `players[side].analysis`.
- Falta diferenciar "sem analysis" de "analysis zerada".
- Falta abort/timeout de fetch. Sem isso, UI pode travar.
- Falta politica de cache por endpoint: perfil/rating-history/games nao precisam todos do mesmo TTL.
- Falta proteger contra `404` username inexistente e `410`/conta fechada.

## 8. Ponto 5 - Detector De Fraquezas

As regras sao boas como primeira taxonomia, mas ruins como detector se implementadas literalmente.

Problemas:

- `judgment.blunders alto por jogo -> high` so deve ser high com amostra minima. Com 1 partida analisada, high e falso.
- `opening.lossRate alto` precisa minimo de jogos por abertura. Em 30 jogos, muitas aberturas terao 1 ou 2 amostras.
- `color.lossRate desbalanceado -> opening-principles` e fraco. Cor desbalanceada pode vir de amostra, rating de adversarios, ritmo ou casualidade.
- `clock.timeoutLosses` deve ser separado por ritmo. Timeout em bullet nao implica o mesmo plano que timeout em rapid.
- `derrotas longas -> conversion/endgame` nao e implementavel com `moves=false`, e pedagogicamente e uma inferencia fraca para 0-1200.
- `manual -> low` talvez subestime o dono. Para ferramenta pessoal, um manual recorrente deveria poder virar medium apos repeticao.

Regras minimas que faltam:

- `minGames`;
- `minAnalysedGames`;
- recency weighting;
- peso por ritmo;
- sample-size penalty;
- empate e desempate de weakness;
- teto de score para sinais low confidence;
- regra de "sem dados suficientes": gerar plano conservador, nao inventar diagnostico.

Linguagem de hipotese: o texto exige, mas precisa contrato. Exemplo aceitavel:

```text
Sinal possivel: nas partidas analisadas recentes, apareceram mais blunders do que o esperado para sua faixa. Hoje vamos testar uma rotina curta anti-blunder.
```

Exemplo proibido:

```text
Voce perde porque deixa peca pendurada.
```

## 9. Ponto 6 - Privacidade/IP

Nao vi violacao direta das Regras Inquebraveis na Proposta 2, com uma excecao potencial: **runtime slug validation por HTML**.

Clean-room:

- O spec superseded esta marcado como nao executar.
- A Proposta 2 remove ChessKing como fonte.
- A Proposta 2 diz explicitamente para nao copiar `publicChess.ts`.
- A inspeccao read-only de `chessking-tutor/` confirmou que existem arquivos tentadores (`src/domain/types.ts`, `src/domain/tutor.ts`, `src/services/publicChess.ts`, `package.json`). O plano de implementacao precisa proibir abrir/copiar esses arquivos durante coding, salvo auditoria expressa.

Privacidade:

- Username Lichess e dado publico, mas ainda e identificador persistente. Deve haver opcao de limpar.
- Notas pessoais podem conter PII. Devem ter limite de tamanho e aviso.
- Logs precisam ser definidos: nada de username, keyHash, sync code, payload de signals, notas ou response bodies em log persistido.
- P3 D1 em plaintext e aceitavel para ferramenta pessoal se o dono aceitar, mas para P5 nao basta. Melhor preparar client-side encryption desde P3 se o custo for baixo.

## 10. Ponto 7 - Sync P3

Merge por registro + D1 resolve o problema anterior de perda por LWW de secao. Mas ainda nao fecha o desenho.

Lacunas:

- relogios de cliente nao sao confiaveis;
- falta `serverSeq`;
- falta tombstone para delete;
- falta modelo de endpoint (`push`, `pull`, `sinceSeq`);
- falta idempotencia;
- falta schema D1;
- falta limite de payload;
- falta criptografia ou decisao explicita por plaintext;
- falta migracao quando schema local muda;
- falta regra de conflito `done` vs `skipped`;
- falta especificar D1 Sessions API ou read replication disabled. D1 com read replicas pode ter lag; Sessions API resolve consistencia sequencial por sessao.

Recomendacao P3:

```text
Eventos locais -> push idempotente -> servidor atribui seq -> pull afterSeq -> aplicar eventos -> recomputar plano.
```

Nao sincronizar `DailyPlan` inteiro se ele pode ser regenerado. Sincronizar:

- profile;
- logs de conclusao;
- feedback;
- notas;
- manual signals;
- cache metadata, se necessario.

## 11. Ponto 8 - Ordem Das Fases

A ordem P0 -> P1 -> P2 -> P3 -> P4 -> P5 esta correta no macro.

Mas eu ajustaria dentro das fases:

- **P0:** scaffold + dominio + plano fixo + IndexedDB schema + export/delete basico. Sem isso, privacidade fica prometida mas nao testada.
- **P1a:** perfil/rating-history + plano conservador por faixa.
- **P1b:** games export + detector. Nao misturar tudo em uma unica fase P1.
- **P2:** feedback e revisao semanal, correto.
- **P3:** sync, correto depois do valor.
- **P4:** Chess.com `/stats`, correto depois do core. "Outro estudo" texto livre poderia entrar antes se o dono realmente usa, mas nao e necessario.
- **P5:** comunidade, rename, OAuth, disclaimers e validacao publica, correto.

O que esta fora de ordem:

- PWA minimo nao pode ficar so em P5 se o objetivo pessoal inclui mobile. Manifest/instalabilidade/offline basico devem entrar antes, provavelmente P0/P2.
- Slug runtime validation nao deve entrar em P1; trocar por allowlist manual antes de P1.

## 12. Ponto 9 - Cortar, Falta, Perigoso

### Cortar agora

- Runtime fetch/parse de `lichess.org/training/themes`.
- `evals=true` por padrao.
- `conversion/endgame-*` baseado em "derrotas longas" ate haver fonte confiavel de ply count.
- `color.lossRate` como sinal medium; no maximo low.
- Qualquer tentativa de setar `User-Agent` no browser.
- Qualquer leitura de `chessking-tutor/src/*` durante implementacao.

### Falta

- Plano atomico P0.
- Schema Dexie e versao.
- Estrutura exata de pastas.
- Plano fixo exato para 5/15/30/60.
- Contrato de fixtures P1.
- Limiares do detector.
- Politica de cache por endpoint.
- Timeout/AbortController.
- Parser NDJSON streaming ou line-split seguro.
- Redacao de logs.
- Export/delete/clear-cache no DoD inicial.
- PWA manifest/offline DoD.
- Clean-room checklist.

### Perigoso

- Falsa precisao pedagogica do detector.
- `jukasparov` hardcoded em dominio ou codigo publico. Deve ser default/configuracao editavel, nao constante estrutural.
- Notes/sync em plaintext sem decisao explicita.
- D1 chamado "consistencia imediata" sem Sessions API/read replication.
- "Codex implementa exatamente o escrito" quando o escrito ainda manda detalhes para futuro plano de implementacao.

## 13. Recomendacao Final

**Aprovar a Proposta 2 como direcao, nao como execucao direta.**

Antes de Codex codar P0, Claude ou Codex deve gerar um plano P0 atomico com:

- dependencias e versoes;
- estrutura de pastas;
- schema Dexie;
- tipos finais;
- plano fixo exato por tempo;
- testes esperados;
- PWA minimo;
- export/delete/local privacy;
- checklist clean-room;
- criterio de nao abrir/copiar `chessking-tutor/src/*`.

Antes de P1, corrigir:

- slugs: allowlist manual, sem runtime scraping;
- coletor: remover `evals=true` por padrao, explicitar `finished=true&ongoing=false`, `perfType`, timeout, cache, parser;
- detector: limiares, amostra minima, recencia, ritmo e fixtures;
- linguagem: testes contra diagnostico determinista.

Minha avaliacao final: **a Proposta 2 esta no trilho certo, mas o trilho ainda e estreito. Se Codex executar direto, vai inventar. Se virar plano por fase, da para construir.**

