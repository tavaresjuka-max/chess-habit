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

## Contrato E2EE (P4 - a implementar em fase futura)

Decisao do dono (2026-06-19): criptografia ponta-a-ponta com **passphrase independente**.

- A chave de cifragem e derivada (Argon2id/PBKDF2) de uma **passphrase que so o usuario sabe** -
  **nunca** da identidade publica do Lichess nem do token OAuth.
- O servidor **nunca** recebe: token, passphrase, chave nem plaintext. Recebe so **blobs cifrados** +
  metadados minimos (`userId` opaco, `seq`, `updatedAt`, `clientId`).
- "D1 cifrado em repouso" **nao** e E2EE; o app cifra **antes** de enviar.
- Login Lichess (OAuth identity-only, sem escopo de jogo) serve so para **identificar a conta de sync**;
  nao da acesso aos dados, que continuam cifrados pela passphrase.
- Merge por `updatedAt` + tombstones; **nunca** replace destrutivo entre aparelhos.
- Recuperacao/perda de chave: sem a passphrase, os blobs sao irrecuperaveis (E2EE real). Avisar isso na
  UI e oferecer o **backup local exportado** como caminho de recuperacao fora do sync.
- Limites do D1 free (aprox. 5GB / 5M leituras-dia / 100k escritas-dia) cobrem o escopo pessoal/beta.
