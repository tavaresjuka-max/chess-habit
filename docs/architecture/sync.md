# Sincronizacao

## Objetivo

Permitir que o aluno use computador e mobile sem perder progresso.

## Modelo

Local-first com eventos:

- O cliente grava tudo primeiro no IndexedDB.
- Cada acao importante gera um `SyncEvent`.
- Quando online, o cliente envia eventos pendentes.
- O servidor retorna eventos mais novos vindos de outros dispositivos.
- Conflitos simples usam `updatedAt` e origem do evento.

## Eventos Do MVP

- `profile.updated`
- `onboarding.completed`
- `plan.generated`
- `mission.completed`
- `mission.skipped`
- `note.saved`
- `coach.message.seen`
- `account.connected`
- `account.disconnected`

## API Planejada

- `POST /api/sync/push`
- `GET /api/sync/pull?after=<seq>`

## Regras

- Cada evento tem `id`, `userId`, `clientId`, `type`, `payload`, `createdAt`.
- Servidor atribui `seq` monotono.
- Cliente deve reenviar evento sem duplicar efeito.
- Payload deve ser pequeno.
- Nao enviar PGN completo por padrao.
- Nao enviar token para tabela de eventos.

## Falhas

- Offline: manter fila local.
- 401: pausar sync e pedir novo login.
- 429 externo: pausar chamadas externas por no minimo 1 minuto.
- Conflito de plano: preservar conclusoes do aluno e regenerar plano depois.

