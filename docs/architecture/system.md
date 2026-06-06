# Arquitetura Do Sistema

## Decisao

Construir como PWA full-stack leve:

- Frontend: React + Vite + TypeScript.
- PWA: instalavel em desktop e mobile.
- Local-first: IndexedDB para cache, estado offline e fila de eventos.
- Backend minimo: Cloudflare Workers.
- Banco: Cloudflare D1.
- Auth: Lichess OAuth PKCE.

## Principio

O app deve continuar util se a internet falhar depois de carregado: ver plano salvo, marcar tarefas locais, escrever notas e sincronizar depois. Abertura de treino no Lichess exige internet.

## Fronteiras

Frontend:

- Onboarding.
- Plano diario e semanal.
- Progresso local.
- Mensagens do tutor.
- Links profundos para Lichess.
- Fila local de eventos de sync.

Backend:

- Sessao do app.
- Sync de progresso entre dispositivos.
- Exportacao de dados.
- Exclusao de conta.
- Proxy somente quando necessario por privacidade/CORS/rate limit.

Fora do MVP:

- Engine propria.
- Board API.
- Bot API.
- Jogo dentro do app.
- Pagamento interno.
- Webhooks de assinatura.

## Dados Salvos

Salvar:

- Preferencias.
- Plano atual.
- Missoes concluidas.
- Notas do aluno.
- Sinais derivados de progresso.
- Conexoes de conta, sem senha.

Evitar por padrao:

- PGN completo.
- Tokens long-lived.
- Dados sensiveis.
- Historico bruto desnecessario.

## Sync

Sync automatico significa manter dados do tutor atualizados entre dispositivos. Atualizacao de dados Lichess depende de autorizacao do usuario e deve respeitar o principio de minimo armazenamento.

