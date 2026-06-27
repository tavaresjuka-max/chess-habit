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

## Estado atual (beta publico)

- Backup JSON exporta perfil, planos, logs, sinais, fraquezas e links/id de Study Lichess; nao exporta token OAuth.
- PGNs completos continuam proibidos. O PGN do Study e montado apenas para a chamada de importacao e nao e salvo.
- P4 (sync) e P5 (versao-comunidade) foram descongeladas pelo dono em 2026-06-16. O sync usa backend
  Cloudflare Workers + D1 com blobs cifrados ponta-a-ponta por passphrase do dono; tokens OAuth continuam
  so no aparelho e fora do backup. O agente so constroi/testa o backend localmente (wrangler/miniflare);
  producao, secrets e provisionamento ficam com o dono.
- Versao-comunidade (P5): nome publico `Chess Habit` (`APP_NAME` em `src/config/appIdentity.ts`),
  disclaimer de nao-afiliacao, AGPL-3.0 visivel, URL publica de codigo-fonte e feedback no rodape.

## Riscos A Revisar

- Armazenamento de token local: aceito com escopos minimos; token continua fora de backup, logs e bundle.
- OAuth callback: manter revisao quando o fluxo mudar; token continua fora de backup, logs e bundle.
- Sync P4 (E2EE): blobs sobem cifrados; a passphrase do dono nunca sai do aparelho; tokens OAuth nao sao enviados ao servidor.
- Sessao HTTP-only: o sync P4 nao cria sessao propria do app; login e "Entrar com Lichess" so como identidade.
- Retencao de dados no servidor: pendente de politica de retencao/conta em producao, a definir pelo dono.
- Logs de erro contendo dados pessoais: risco vigente; manter mensagens sem token, PGN completo ou PII.
- Importacao excessiva de partidas: risco vigente; Chess.com continua read-only, serial e sem persistir PGN completo.
