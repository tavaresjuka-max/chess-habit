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

- Backup JSON exporta perfil, planos, logs, sinais e fraquezas; nao exporta token OAuth nem links de Study.
- PGNs completos continuam proibidos. O PGN do Study e montado apenas para a chamada de importacao e nao e salvo.
- P4/P5 estao congeladas; nao ha backend, sync, conta propria, sessao HTTP-only nem publicacao comunitaria.

## Riscos A Revisar

- Armazenamento de token.
- OAuth callback.
- Sessao HTTP-only.
- Retencao de dados apos exclusao.
- Logs de erro contendo dados pessoais.
- Importacao excessiva de partidas.
