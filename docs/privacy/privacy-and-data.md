# Privacidade E Dados

## Principio

Guardar o minimo necessario para orientar estudo e sincronizar progresso.

## Dados Do MVP

Pode salvar localmente:

- id interno;
- username Lichess;
- username Chess.com opcional;
- preferencias de treino;
- tempo disponivel;
- metas;
- dificuldades declaradas;
- plano gerado;
- missoes concluidas;
- notas;
- sinais derivados;
- token OAuth Lichess opt-in no IndexedDB local, apenas para `puzzle:read`/`study:write`;
- link/id do Study Lichess criado para o dia.

Evitar por padrao:

- PGN completo;
- token em backup JSON, logs, bundle publico ou arquivo versionado;
- senha;
- mensagens privadas;
- dados de pagamento;
- dado bruto que nao seja usado.

## Direitos Do Usuario

O MVP deve incluir:

- exportar dados;
- excluir conta;
- desconectar plataformas;
- limpar cache local;
- explicar o que e salvo.

## Doacao

Doacao e feita por link externo. O app nao precisa saber quem pagou. Se houver reconhecimento futuro de apoiador, deve ser moral e opcional.

## Estado P3

- Backup JSON exporta perfil, planos, logs, sinais, fraquezas e links/id de Study Lichess; nao exporta token OAuth.
- PGNs completos continuam proibidos. O PGN do Study e montado apenas para a chamada de importacao e nao e salvo.
- P4/P5 estao congeladas; nao ha backend, sync, conta propria, sessao HTTP-only nem publicacao comunitaria.

## Riscos A Revisar

- Armazenamento de token local: aceito no marco pessoal com escopos minimos; reavaliar antes de P5.
- OAuth callback: manter revisao quando o fluxo mudar; token continua fora de backup, logs e bundle.
- Sessao HTTP-only: fora do escopo do marco atual (P4/P5; nao ha backend).
- Retencao de dados apos exclusao: fora do escopo do marco atual enquanto nao ha conta/backend.
- Logs de erro contendo dados pessoais: risco vigente; manter mensagens sem token, PGN completo ou PII.
- Importacao excessiva de partidas: risco vigente; Chess.com continua read-only, serial e sem persistir PGN completo.
