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

Spec de execucao vigente: `docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md`.

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
  read-only: `/stats` + arquivos mensais recentes de partidas. Sem login. Parse de PGN **transiente**
  (extrair sinais e descartar); **nunca persistir PGN completo**. Sem PII de perfil (nome/avatar/local).
  Serial, com bound de recencia. Destinos de treino seguem no Lichess.
- Nao armazenar PGNs completos, tokens ou dados sensiveis por padrao. Nada de PII em logs.
- App gratuito e open-source. Sem anuncios, sem paywall, sem venda de dados. Doacao (se houver) e link
  externo, so na versao-comunidade; apoiador nao recebe vantagem funcional.

## Identidade Do Produto

- Nome de trabalho interno: `lichess-tutor` (pasta/repo). Nome publico fica para a Fase P5
  (renomeacao obrigatoria antes de qualquer comunicacao externa, por causa da feature oficial
  `lichess.org/tutor`).
- App nao oficial, nao afiliado ao Lichess (disclaimer obrigatorio na versao-comunidade).
- Tom: adulto, pratico, PT-BR, sem infantilizar. "Professor Lemos" e tom de voz (microcopy), nao
  personagem central, ate haver evidencia (P5).

## Governanca Dos Agentes

- O dono tem autoridade final sobre escopo, produto e arquitetura.
- Claude planeja (escreve specs e ordens detalhadas). Codex executa (tarefas pequenas, verificaveis,
  commits atomicos). DeepSeek/Gemini sao consultores: insumo, nao ordem.
- Nenhuma decisao de qualquer IA pode violar as Regras Inquebraveis.
- Codex implementa exatamente o spec vigente; diante de ambiguidade ou contrato de API divergente,
  PARA e pergunta, nunca adivinha.
- Ordem de fases obrigatoria: P0 -> P1 -> P2 -> P3 -> P4 -> P5. Nao adiantar fases.

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

## Resposta Final Dos Agentes

Toda entrega deve informar: o que mudou; quais arquivos foram criados/alterados; quais verificacoes
foram feitas; quais riscos continuam.
