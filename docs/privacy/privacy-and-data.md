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

- exportar dados (backup JSON com checksum);
- excluir conta — local (`Apagar tudo` na Config) e **servidor** (endpoint `DELETE /blobs` no backend,
  apaga todos os blobs do usuario autenticado — Fase 2 2026-06-27);
- desconectar plataformas;
- limpar cache local;
- explicar o que e salvo.

## Consentimento (Fase 3, 2026-06-27)

- Usuario novo ve uma tela de **consentimento informado** no onboarding antes de configurar as contas:
  explica que os dados de progresso ficam no aparelho e que a evolucao pode ser medida de forma anonima/
  agregada para validar o metodo, com opt-out/exportar/apagar a qualquer momento.
- Persistido em `appMeta`: `consentedAt` (write-once) + `researchOptIn` (toggle). Ajustavel no fold
  "Privacidade e consentimento" da Config. A coorte de eficacia so usa dados de quem deu opt-in.
- Pre-registro do estudo (anti-p-hacking) em `docs/specs/e3-preregistration-DRAFT.md` (congelar ao
  fechar o tier do estimador).

## Doacao

Doacao e feita por link externo. O app nao precisa saber quem pagou. Se houver reconhecimento futuro de apoiador, deve ser moral e opcional.

## Estado atual (beta publico)

- Backup JSON exporta perfil, planos, logs, sinais, fraquezas e links/id de Study Lichess; nao exporta token OAuth.
- PGNs completos continuam proibidos. O PGN do Study e montado apenas para a chamada de importacao e nao e salvo.
- Sincronizacao multi-aparelho (OPCIONAL, decisao do dono 2026-06-28): login via Lichess; o progresso e
  enviado ao backend Cloudflare Workers + D1, onde fica LEGIVEL pelo operador (modelo de conta normal,
  tipo Anki/Duolingo — NAO e E2EE, pois e app de estudo com dado de baixa sensibilidade). Usado so para
  operar o app. O usuario pode DESLIGAR o sync, exportar (backup) ou apagar (local + `DELETE /blobs` no
  servidor) a qualquer momento. Tokens OAuth continuam so no aparelho, fora do backup. Cifrado em transito
  (HTTPS) e em repouso (Cloudflare); acesso por login do Lichess + isolamento por usuario.
- Versao-comunidade (P5): nome publico `Chess Habit` (`APP_NAME` em `src/config/appIdentity.ts`),
  disclaimer de nao-afiliacao e aviso de copyright (proprietario, codigo fechado) no rodape.

## Riscos A Revisar

- Armazenamento de token local: aceito com escopos minimos; token continua fora de backup, logs e bundle.
- OAuth callback: manter revisao quando o fluxo mudar; token continua fora de backup, logs e bundle.
- Sync (modelo conta normal, NAO E2EE): o dado de progresso fica LEGIVEL no servidor. Mitigacao: auth
  real (token Lichess validado no /api/account), isolamento por userId, HTTPS + at-rest do Cloudflare,
  acesso restrito ao console. Risco residual aceito conscientemente: vazamento do servidor expoe dado de
  progresso real (baixa sensibilidade p/ app de estudo). Marketing exige opt-in de contato separado (nao existe hoje).
- Sessao: o sync nao cria sessao propria do app; "Entrar com Lichess" e a identidade (token validado no servidor).
- Retencao de dados no servidor: direito de exclusao atendido (`DELETE /blobs`). Politica de retencao
  automatica (TTL) + compactacao de blobs superados continua pendente em
  `docs/architecture/SYNC-HARDENING.md`.
- Captura de erro: opt-in, **desligada por padrao**, somente local (tabela `errorLog`, cap 100), com
  export dedicado manual. Nada e enviado automaticamente. Mensagens devem ficar sem token/PGN/PII.
- Carimbo de adocao (`adoptedAt`): write-once, entra no backup; usado so para medir eficacia (data de
  inicio), nunca exposto como cobranca na UI.
- Importacao excessiva de partidas: risco vigente; Chess.com continua read-only, serial e sem persistir PGN completo.
