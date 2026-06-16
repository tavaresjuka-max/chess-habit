# Relatorio Codex - Revisao Critica Da Auditoria Nota 9,5

Data: 2026-06-14
Autor: Codex
Escopo: revisao critica do relatorio Claude `relatorio-claude-analise-completa-nota-95-2026-06-14.md`, leitura direta do codigo atual pos-Cortes A/B/C, rechecagem oficial de API/PWA/privacidade e proposta propria de cortes.

## 1. Veredito

Eu concordo com a tese principal do Claude: o caminho para 9,5 nao e mais adicionar uma camada grande de features. E fechar loops internos que hoje existem no codigo mas ainda nao fecham a experiencia: plano adaptativo, durabilidade do dado, rede sob falha e fluxo diario no celular.

Mas minha nota e um pouco menos severa: **7,7 / 10**, nao 7,4. O Corte A ja resolveu parte relevante de mobile/a11y; o Corte B resolveu um pedaço importante de import seguro; e a camada `app/` nao esta sem testes, embora ainda esteja concentrada demais em `state.ts`.

Minha leitura: o app ja esta bom para uso pessoal continuo, mas ainda nao merece 9,5 porque o que ele promete de "professor que adapta" ainda e parcialmente decorativo.

## 2. Notas Por Frente

| Frente | Nota Claude | Minha nota | Ajuste |
|---|---:|---:|---|
| UX / mobile / a11y | 7,5 | **8,0** | Corte A subiu densidade, contraste, alvos 44px e foco. O problema real que sobrou e a acao principal abaixo da dobra e alguns labels/fallbacks. |
| Pedagogia / dominio | 7,2 | **7,1** | Aqui sou ate mais duro. `computeMastery` existe mas nao dirige o plano; `progress-diplomas` nao entra no seletor; revisao espaciada ignora feedback. |
| Dados / privacidade | 7,5 | **8,1** | "10 de 16 tabelas" e uma leitura alarmista: tokens, caches e handles nao devem entrar no backup. O gap real e backup v2, snapshot atomico, `lichessStudies` e talvez `appMeta`. |
| Rede / PWA / offline | 7,3 | **7,0** | O bug do replay 429 e grave porque fura a regra operacional do Lichess. Tambem faltam timeout, retry/backoff e smoke real de offline. |
| Engenharia / testes / build | 7,8 | **7,8** | Existem testes em `app/`, mas `state.ts` segue grande demais e um teste flakou no primeiro full run. Build ainda avisa chunk principal acima de 500 kB. |

Ponderando pelo uso real do dono, minha nota geral fica **7,7 / 10**. O maior peso deve continuar em UX diaria e pedagogia, porque sao as duas coisas que o dono sente toda vez que abre o app.

## 3. Onde O Claude Acertou

- **Bug real no replay Lichess:** `src/app/trainingLogFlow.ts` engole erro no replay e pode esconder `LichessRateLimitError`. Isso quebra a invariante do Corte C: 429 do Lichess precisa ativar cooldown e pausa de pelo menos 1 minuto.
- **Pedagogia ainda nao fecha o loop:** `computeMastery` e trilhas existem, mas ainda nao controlam o plano com forca suficiente.
- **Backup precisa de formato evolutivo:** rejeitar qualquer versao diferente de `1` funciona hoje, mas vira bomba quando o schema mudar.
- **Hero/acesso ao proximo passo no celular:** o app ainda gasta a primeira dobra com contexto demais antes da acao.
- **Rede precisa de robustez operacional:** serializacao e cooldown foram um salto, mas falta timeout, backoff e tratamento fino de offline.

## 4. Onde Eu Corrigiria A Auditoria Claude

- **Nao repetir Corte A:** contraste primario, alvos de toque, microtexto minimo e foco de teclado ja foram verificados no Corte A. O proximo corte de UX deve focar no que sobrou: ordem da tela, labels contextuais e fallbacks perigosos.
- **Backup "10/16" nao e sinonimo de falha:** `lichessOAuthTokens`, caches mensais, `backupMeta` e `autoBackup` devem ficar fora por privacidade ou por serem estado operacional. O criterio certo e: tudo que o usuario criou e espera recuperar entra; token/cache/handle nao entra.
- **`app/` nao tem zero testes:** ha testes em fluxos de app. O problema e que as responsabilidades de `state.ts` ainda estao pouco isoladas, entao refatorar exige mais rede de seguranca.
- **Placement nao parece totalmente aberto:** no fluxo de `Config`, aplicar banda chama `onSave`, e `saveProfile` regenera plano. O que pode faltar e teste de regressao e clareza de comportamento, nao necessariamente codigo morto.
- **Faltou um achado de privacidade/UX:** `Config.tsx` usa fallback para usuarios hardcoded quando o perfil nao tem nomes. Isso pode reintroduzir `jukasparov`/`jukatavares` e disparar sync errado se a pessoa salvar sem perceber.
- **Faltou persistencia no momento certo:** o app chama `storage.persist()` no carregamento. A recomendacao atual para dados criticos e pedir persistencia quando o usuario salva algo importante, idealmente dentro de um gesto.

## 5. Achados Prioritarios

### P1 - Replay 429 engolido

`src/app/trainingLogFlow.ts` tem um `catch {}` no replay de puzzles. Se `fetchPuzzleReplay` receber 429 e lancar `LichessRateLimitError`, esse erro vira `undefined` e a fila nao entra no cooldown. Isso viola diretamente a regra oficial do Lichess: uma request por vez e, em 429, esperar pelo menos 1 minuto.

Proposta: importar/reusar `LichessRateLimitError`, relancar esse erro especifico e manter fallback silencioso apenas para erro nao critico de replay.

### P1 - Fallback de usuario em Config

`src/ui/Config.tsx` mostra usuarios hardcoded como fallback quando o perfil existe sem username. Para ferramenta pessoal isso parece conveniente, mas e perigoso: pode salvar identidade errada e disparar coleta externa com conta errada.

Proposta: fallback visual deve ser string vazia. Defaults pessoais podem existir apenas no onboarding/seed inicial, nunca na tela de configuracao depois que ha perfil.

### P2 - Backup v2, nao "backup de tudo"

O backup deve incluir dados duraveis de usuario: perfil, planos, logs, sinais, fraquezas, trilhas, pendencias, diplomas, achievements, placement, `lichessStudies` e provavelmente `appMeta` de onboarding. Deve continuar excluindo OAuth token, cache Chess.com, metadata de backup e file handles.

Proposta: criar `BackupDataV2`, `migrateBackup(raw)`, export em transacao read-only e validacao mais profunda para pending/diplomas/studies.

### P2 - Persistencia fora do bootstrap

`navigator.storage.persist()` deve ser usado como protecao de dado critico, nao como ritual de load. A fonte recomendada diz explicitamente para nao pedir no page load/bootstrap.

Proposta: checar `persisted()` no load, mas pedir `persist()` depois da primeira acao significativa: salvar perfil, concluir primeiro bloco, criar primeiro backup, ou botao "Proteger meus dados".

### P2 - Adaptacao pedagogica ainda incompleta

O app ja tem bom desenho, mas falta fazer o plano reagir a evidencia:

- feedback `hard/good/easy` deveria mudar intervalo da pendencia;
- `computeMastery` deveria influenciar `masteryTarget` e ritmo do plano;
- `progress-diplomas` deveria ter uma rota real no seletor de trilha;
- bloco de transferencia deveria alternar uma fraqueza secundaria quando houver sinal suficiente;
- limiar de blunder deveria considerar banda/rating, sem prometer precisao cientifica.

### P2 - Lichess history materializado

O fetch de partidas Lichess aceita historico sem `max` e faz `response.text()` antes de parsear NDJSON. Para conta grande, isso pode travar mobile. A especificacao do Lichess lembra que endpoints NDJSON sao streaming; o app ainda nao aproveita isso.

Proposta: manter o principio do dono de historico completo quando intencional, mas separar:

- auto-sync Lichess com limite conservador ou janela recente;
- sync manual completo com aviso;
- parser NDJSON incremental quando fizer sentido.

### P3 - Teste flake e chunk grande

Na auditoria, o primeiro `npm run test` teve timeout em `src/app/preserveProgress.test.tsx`; o teste passou isolado e o full run seguinte tambem passou. Isso cheira a flake/interferencia, nao a falha deterministica. O build passa, mas ainda avisa chunk principal acima de 500 kB.

Proposta: estabilizar esse teste antes de refatorar `state.ts`; depois aplicar `manualChunks` para dexie/lucide/vendor.

## 6. Minha Sequencia Proposta

Eu mudaria a ordem do Claude. Antes do Corte D grande, eu faria um microcorte corretivo:

### Corte D0 - Hotfix De Invariantes

Escopo:

- relancar `LichessRateLimitError` no replay;
- teste de regressao para cooldown/propagacao;
- remover fallback hardcoded de usernames em `Config.tsx`;
- teste simples de Config/profile sem usernames.

Por que primeiro: e pequeno, nao exige decisao do dono e fecha duas arestas que podem causar comportamento errado imediatamente.

### Corte D1 - Mobile Diario

Escopo:

- mover "Proximo passo" para a primeira dobra;
- manter contexto do Professor Lemos sem empurrar a acao para baixo;
- aria-labels nos comandos repetidos;
- revisar apenas os pontos de CSS que ainda forem necessarios, sem refazer Corte A.

Meta: UX sair de 8,0 para algo perto de 9,2.

### Corte E - Adaptacao Pedagogica Real

Escopo:

- spacing feedback-driven simples, inspirado em SM-2 mas nao uma implementacao pesada;
- `computeMastery` conectado ao plano;
- trilha `progress-diplomas` ativada;
- fraqueza secundaria no bloco de transferencia;
- threshold de blunder por banda.

Esse corte muda o que o dono ve no plano diario. Eu pediria aprovacao explicita antes.

### Corte F - Durabilidade Do Dado

Escopo:

- backup v2;
- `lichessStudies` e `appMeta` duravel;
- migracao v1 -> v2;
- export atomico;
- validacao mais profunda;
- persistencia solicitada no momento certo.

Meta: dado local deixar de ser "bom" e virar confiavel.

### Corte G - Rede/PWA Sob Falha

Escopo:

- timeout por `AbortController`;
- retry/backoff para 5xx/network;
- respeito a 429 e, quando houver, `Retry-After`;
- mensagens de offline;
- estrategia Lichess auto-sync vs sync completo;
- smoke Playwright de app offline em build de producao.

Meta: robustez real em celular e rede ruim.

### Corte H - Engenharia Para Crescer

Escopo:

- testes de app/fluxos antes de refatorar;
- extrair helpers de `state.ts`;
- deduplicar sync;
- `manualChunks`;
- coverage baseline.

Meta: permitir o Corte 8/curriculo denso sem medo.

## 7. Decisoes Que Eu Pediria Ao Dono

1. **Pedagogia adaptativa:** o plano pode alternar fraqueza secundaria e mover revisoes por `hard/good/easy`? Minha recomendacao: sim.
2. **Lichess auto-sync:** auto-sync deve ser limitado/recente e o historico completo ficar em acao manual? Minha recomendacao: sim, para mobile. Para Chess.com, manter historico completo com cache mensal, como ja decidido.
3. **`appMeta` no backup:** onboarding e preferencias leves entram no backup? Minha recomendacao: sim, desde que tokens, caches e handles continuem fora.

## 8. Pesquisa Oficial Usada

- [Lichess API Tips](https://lichess.org/page/api-tips): confirma preferencia por API oficial, uma request por vez e espera de 1 minuto apos 429.
- [Lichess OpenAPI](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/lichess-api.yaml): reforca rate limit, NDJSON streaming e seguranca de tokens/OAuth PKCE.
- [Chess.com Published Data API](https://www.chess.com/news/view/published-data-api): confirma PubAPI read-only, acesso serial, `ETag`/`Last-Modified` e refresh limitado.
- [MDN StorageManager.persist](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist): confirma retorno booleano e restricoes da API.
- [web.dev Persistent storage](https://web.dev/articles/persistent-storage): recomenda pedir persistencia ao salvar dado critico, idealmente com gesto do usuario, e nao no bootstrap.
- [Nature Reviews Psychology 2022](https://www.nature.com/articles/s44159-022-00089-1): reforca spacing e retrieval practice como estrategias de aprendizagem com boa evidencia geral.
- [SuperMemo SM-2](https://super-memory.com/english/ol/sm2.htm): referencia historica para intervalo adaptativo por qualidade de resposta; eu usaria apenas uma versao simplificada e local.

## 9. Verificacoes

- `npm run lint`: passou.
- `npm run build`: passou, com aviso de chunk principal acima de 500 kB.
- `npm run test`: primeiro full run teve timeout em `src/app/preserveProgress.test.tsx`; rerun isolado passou; segundo full run passou com 58 arquivos e 385 testes.
- Navegador/mobile: nao rodei novo smoke visual nesta revisao, porque o pedido foi auditoria/proposta. Usei as evidencias do Corte A e leitura do codigo para as notas.

## 10. Riscos Que Continuam

- A correcao do replay 429 deve vir antes de qualquer nova integracao Lichess.
- A adaptacao pedagogica pode ficar "inteligente demais" se tentar implementar SM-2 completo cedo; o melhor e uma versao pequena, testavel e explicavel.
- Backup v2 precisa preservar privacidade: token OAuth nao entra.
- Limitar auto-sync Lichess precisa respeitar a decisao do dono sobre historico completo. Minha proposta e limitar apenas automatico/mobile e manter completo manual.
- Refatorar `state.ts` antes de estabilizar testes de app aumenta risco. Primeiro rede de testes, depois refactor.
