# AGENTS.md

Este arquivo e a fonte canonica de regras para agentes neste projeto.

## Moldura Atual (decidida pelo dono em 2026-06-06)

**Pessoal primeiro, comunidade depois.** Esta e, antes de tudo, uma ferramenta pessoal do dono para
estudar xadrez no Lichess. O dono e a propria validacao: nao ha "Fase 0 de mercado" (entrevistas,
landing, waitlist) antes de codar a ferramenta pessoal. Se a ferramenta ficar boa, uma
versao-comunidade (Fase P5) reentra em renomeacao, revisao publica e endurecimento de seguranca.

A fase de codigo da ferramenta pessoal foi **aberta pelo dono**. Codigo e permitido na pasta
`lichess-tutor`. A auditoria estrategica (relatorios Codex, Antigravity, DeepSeek consolidacao) foi
lida e suas correcoes tecnicas/legais foram aceitas; suas recomendacoes de "validar mercado antes de
codar" nao se aplicam a ferramenta pessoal e ficam reservadas para a Fase P5.

Specs vigentes: `docs/superpowers/specs/2026-06-08-professor-lemos-tutor-design.md` (tutor:
envelope de sessao, diagnostico, constancia) e
`docs/superpowers/specs/2026-06-10-metodo-5-trilhas-design.md` (metodo 5 trilhas, as-built).
Specs anteriores (2026-06-06, 2026-06-07) estao executados e valem como historico.
Roadmap vigente: plano consolidado de cortes 0-8 em
`docs/review/relatorio-claude-arbitragem-contestacoes-2026-06-10.md` (aprovado pelo dono em 2026-06-10).

## Autorizacao P4 + P5 (dono, 2026-06-16)

O dono, **autoridade final**, DESCONGELOU P4 (sync multi-dispositivo) e P5 (versao-comunidade) e
autorizou implementar TODAS as features ate um beta publico. Decisoes travadas:

- **Sync (P4):** backend **Cloudflare Workers + D1**. Login = **Entrar com Lichess** (identidade via
  OAuth, sem escopo de jogo). Dados sobem como **conteudo legivel** (blob JSON, **sem E2EE/passphrase**
  — decisao `d92aeb4` "sync conta-normal"; a variante E2EE com passphrase de `309e558` foi removida de
  proposito). O servidor le o conteudo, isolado por `userId` derivado do OAuth Lichess; tokens OAuth
  continuam **so no aparelho**. ⚠️ Implicacao: dados sincronizados sao legiveis no servidor — se quiser
  privacidade no servidor de volta, e decisao de produto (reintroduzir cifragem antes do `pushBlob`).
  Provisionamento da nuvem fica com o dono — o agente **constroi + testa local** (wrangler/miniflare),
  nao cria conta nem mexe em secrets de producao.
- **Comunidade (P5):** nome publico aprovado via **constante unica `APP_NAME`** = `'Chess Habit'`,
  com disclaimers de nao-afiliacao, aviso de copyright (proprietario), canal de feedback, doacao =
  link externo.
- Roadmap detalhado: `docs/review/roadmap-beta-2026-06-16.md`. Execucao autonoma:
  `prompts/codex-overnight-beta-2026-06-16.md`.

TODAS as outras Regras Inquebraveis abaixo permanecem (clean-room, sem scraping, sem tabuleiro, tokens
locais, sem PGN/PII, sem promessa de rating, etc.). Descongelar fase **NAO afrouxa nenhuma regra
de privacidade/seguranca**.

## Regras Inquebraveis

- Construir como **clean-room**: app novo do zero em `lichess-tutor`. **Proibido** copiar arquivos,
  pastas, dependencias ou assets de `chessking-tutor` ou `chessking-assets`. Pode-se reimplementar do
  zero conceitos proprios (estrutura de blocos, time budget, cadeia Signal->Weakness->Plan); nenhuma
  linha por copia.
- Nao importar codigo, assets, textos ou conteudo do app pago anterior. Nao copiar conteudo pago,
  proprietario ou protegido. **ChessKing nunca e fonte (`SourceId`) nem taxonomia dentro do app.**
- Nao usar scraping em Lichess ou Chess.com. Usar apenas APIs oficiais e documentadas.
- Revalidar contratos de API contra a doc oficial viva antes de escrever coletores; registrar em
  `docs/research/sources.md`.
- Nao criar tabuleiro proprio. Treino abre no Lichess.
- Nao dar ajuda durante partida ao vivo. Nunca sugerir lances. Abrir analise so de partidas terminadas.
- Nao usar Board API, Bot API, Challenge API ou escopos de jogo.
- Respeitar rate limit do Lichess: uma requisicao por vez; em HTTP 429, esperar no minimo 1 minuto.
- OAuth foi autorizado pelo dono para a ferramenta pessoal, mas apenas como **opt-in** e com escopos
  minimos: criacao/importacao de Studies (`study:write`) em fase propria e leitura de atividade de puzzles
  (`puzzle:read`) para reconciliar resultado de treino. Tokens ficam so locais, nunca em logs, bundle
  publico ou arquivos versionados. Proibido `puzzle:write`, escopos de jogo, engine e mensagens.
- Chess.com entra na Fase P1 como fonte primaria de diagnostico (o dono joga la), via API publica
  read-only: `/stats` + arquivos mensais de partidas (historico completo). Sem login. Parse de PGN **transiente**
  (extrair sinais e descartar); **nunca persistir PGN completo**. Sem PII de perfil (nome/avatar/local).
  Serial, lendo o historico completo de arquivos mensais (decisao do dono 2026-06-13, revertendo o bound
  de recencia do achado Codex 2026-06-10; cache mensal evita refetch). O filtro de recencia fica como
  utilitario opt-in. Destinos de treino seguem no Lichess.
- Nao armazenar PGNs completos, tokens ou dados sensiveis por padrao. Nada de PII em logs.
- App gratuito e proprietario (codigo fechado). Sem anuncios, sem paywall, sem venda de dados. Doacao (se houver) e link
  externo, so na versao-comunidade; apoiador nao recebe vantagem funcional.

## Identidade Do Produto

- Nome de trabalho interno: `lichess-tutor` (pasta/repo). Nome publico aprovado: `Chess Habit` via `APP_NAME`. O app continua não oficial e não afiliado ao Lichess.
- App nao oficial, nao afiliado ao Lichess (disclaimer obrigatorio na versao-comunidade).
- Tom: adulto, pratico, PT-BR, sem infantilizar. "Professor Tavarez" e a identidade pedagógica/tom de voz visível do tutor, sem virar personagem infantilizado.

## Governanca Dos Agentes

- O dono tem autoridade final sobre escopo, produto e arquitetura.
- Fugu dirige, sintetiza e revisa. **GLM executa tudo** por padrao, em tarefas pequenas, verificaveis
  e com gates objetivos. DeepSeek e GLM formam o council: insumo critico, nao ordem final.
- Nenhuma decisao de qualquer IA pode violar as Regras Inquebraveis.
- Codex implementa exatamente o spec vigente; diante de ambiguidade ou contrato de API divergente,
  PARA e pergunta, nunca adivinha.
- Ordem de fases obrigatoria: P0 -> P1 -> P2 -> P3 -> P4 -> P5. Nao adiantar fases. **EXCECAO
  autorizada pelo dono em 2026-06-16:** P4 e P5 DESCONGELADAS (ver "Autorizacao P4 + P5" acima).

## Pesquisa

Quando a tarefa tocar API, licenca, preco, deploy, auth, privacidade, PWA ou plataforma externa,
consultar documentacao oficial atual e registrar a fonte em `docs/research/sources.md`.

Fontes preferenciais: Lichess API, Lichess API Tips, Lichess Database, Chess.com Published Data API,
MDN PWA, Cloudflare Workers/D1.

## Workflow De Codigo

- Planejar antes de editar comportamento central. Mudancas pequenas e verificaveis.
- TypeScript estrito. Dominio puro (sem rede, sem React), testavel.
- Gate por fase: `npm run lint && npm run test && npm run build` verdes antes de fechar tarefa.
- Testar regra de plano, detector de fraquezas, privacidade e (quando existir) sync e PWA offline.
- Verificar desktop e mobile no browser.
- Atualizar `memory/state.md`, `memory/decisions.md` e `memory/progress.md` a cada decisao relevante.

## Comandos & Capacidades

Itemizacao do que o agente PODE rodar neste repo (declarar evita re-derivar do zero e
desperdicar tokens em todo sessao). Voce tem agencia: se achar que "nao da", esta errado — roda.

- **Gates** (rodar antes de fechar tarefa): `npm run lint` · `npm test` · `npm run build`.
  Cobertura (fora do gate, com thresholds no CI): `npm run coverage` — minimos atuais
  78 lines / 85 funcs / 72 branches, hoje em ~86% stmts / ~80% branches / ~90% funcs.
- **tsc estrito**: o `vitest` NAO pega tudo (noUncheckedIndexedAccess, mocks tipados).
  Sempre `npm run build` (= `tsc -b && vite build`), nao so vitest, ao revisar testes.
- **Nomes de teste Vitest**: usar `*.test.ts`/`*.test.tsx`; para integracao, usar
  `*.integration.test.ts`. Evitar `*.test.integration.ts`, que nao entra no include do `npm test`.
- **Pre-commit**: lint-staged roda `eslint --fix` + `tsc -b --noEmit` no commit. `--max-warnings=0`.
- **Smoke PWA** (isolado, fora do `npm test`/CI): `npm run smoke:pwa` (Playwright, webServer 127.0.0.1:4188).
- **Deploy (OBRIGATORIO via prebuilt)**: `vercel build --prod --yes` seguido de
  `vercel deploy --prebuilt --prod --yes`. O deploy direto (`vercel --prod`) **FALHA** com
  "Upload aborted" porque `output/` tem ~779 MB de artefatos de pesquisa; o prebuilt sobe so
  `.vercel/output` (~888 KB). URL estavel: https://rotina-pied.vercel.app (projeto `rotina`,
  conta `tavaresjuka-2166`). Anti-indexacao: `robots.txt` + `X-Robots-Tag` no `vercel.json`.
- **Preview/dev** (`.claude/launch.json`): `rotina-dev` na **porta 5173** — o OAuth do Lichess
  precisa dessa porta (redirectUri = origin+pathname); se ocupada pelo dev do dono, verificar por teste.
- **Dados local-first por padrao + sync opt-in:** sem sync, ponte entre aparelhos = export/import de backup. Com sync ligado, progresso sobe ao Worker/D1 legivel pelo operador para sincronizar dispositivos; tokens OAuth seguem so no aparelho. Backup automatico (File System Access) nao funciona no Android — export manual continua recomendado.

## Falsos Positivos Refutados (NAO Reabrir)

Auditorias passadas (DeepSeek/Gemini/Codex e subagentes) ja alucinaram bugs aqui. Antes de
"corrigir" um destes, leia o caminho de codigo end-to-end (inclusive os chamadores). Registro
completo em `memory/plano-nota-95-estado.md`. Refutados por codigo:

- **OAuth state E validado** em `app/oauthFlow.ts` (`pending.state !== callback.state`) — nao no
  `parseLichessOAuthCallback` de baixo nivel. Nao ha CSRF aberto.
- **Purge de signals** (`replaceSignalsForSource`, cutoff 90d) e GC global intencional, nao bug por fonte.
- **`hard` -> `explain`** (nao avanca o estagio) e intencional: dificuldade pede mais suporte.
- **Deps de `useCallback`** com setters do React sao estaveis; lint passa em `--max-warnings=0`.
- **`addDays`**: RESOLVIDO (2026-06-23). Ambos (`planSessions.ts` e `pendingItems.ts`) usam
  aritmetica UTC pura (`Date.UTC` + `setUTCDate` + `toISOString`), timezone-safe. O off-by-one em
  GMT-3 apontado pela auditoria de 2026-06-16 era codigo antigo com `setDate` local, ja substituido
  e coberto por teste. NAO reabrir sem um teste que reproduza a falha.
- **"Suite quebrada"/"sem dark mode"**: falso — suite verde; dark em `index.css`.

## Resposta Final Dos Agentes

Toda entrega deve informar: o que mudou; quais arquivos foram criados/alterados; quais verificacoes
foram feitas; quais riscos continuam.
