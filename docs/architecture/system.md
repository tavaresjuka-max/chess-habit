# Arquitetura Do Sistema

## Decisao Atual

Construir a ferramenta atual como **PWA local-first por padrao**, com sync multi-dispositivo opt-in:

- Frontend: React + Vite + TypeScript.
- PWA: instalavel em desktop e mobile.
- Estado local: IndexedDB/Dexie para perfil, planos, sinais derivados, logs, metodo, pendencias,
  conquistas, backups e metadados locais.
- Integracoes externas: Chess.com PubAPI publica read-only; Lichess via endpoints oficiais e OAuth
  PKCE opt-in somente para `puzzle:read` e `study:write`.
- Backend/D1/Worker: P4 usa Cloudflare Workers + D1 em modelo conta-normal. O sync e opcional, valida identidade por Lichess e envia progresso legivel ao servidor; tokens OAuth continuam so no aparelho.

## Principio

O app deve continuar util se a internet falhar depois de carregado: ver plano salvo, marcar tarefas
locais, concluir blocos, registrar feedback, consultar progresso local, exportar/apagar dados e
restaurar backup. Abertura de treino no Lichess, importacao Chess.com, reconciliacao de puzzles e
criacao/importacao de Studies exigem internet.

## Fronteiras

Frontend:

- Onboarding.
- Plano diario e semanal.
- Progresso local.
- Mensagens do tutor.
- Links profundos para Lichess.
- Diagnostico Chess.com/Lichess por APIs oficiais.
- Backup/export/restore local.
- OAuth Lichess opt-in com token local fora do export.
- PWA/offline shell.

Backend/sync na fase atual:

- Sem sessao propria do app: identidade de sync vem do login Lichess.
- Sync multi-dispositivo opt-in via Worker/D1 publicado.
- Sem conta propria, senha propria ou proxy geral.
- Sem log centralizado automatico de uso.
- Exclusao de dados do servidor via endpoint `DELETE /blobs`.
- Proxy apenas se uma fase futura justificar por privacidade/CORS/rate limit e o dono aprovar.
- Nome publico via `APP_NAME`, disclaimers publicos, aviso de copyright proprietario e docs de privacidade.

Fora da ferramenta pessoal atual:

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
- Blocos/logs de treino concluidos.
- Feedback local.
- Sinais derivados de progresso.
- Pendencias, diplomas, conquistas e placement.
- Conexoes Lichess locais, sem senha e sem exportar token.

Evitar por padrao:

- PGN completo.
- Tokens em logs, backups, bundle publico ou arquivos versionados.
- Dados sensiveis.
- Historico bruto desnecessario.
- PII de perfil Chess.com alem do username informado pelo dono.

## Sync

Sync P4 esta em modelo opt-in de conta normal: Workers + D1, login "Entrar com Lichess" apenas
como identidade, progresso legivel no servidor para sincronizar aparelhos, merge por `updatedAt`/tombstone e
tokens OAuth nunca enviados ao servidor como dado salvo. Atualizacao de dados Lichess/Chess.com continua por APIs oficiais e com minimo armazenamento.

## Pendencias De Arquitetura Registradas Em 2026-06-13

- Criar uma fila/cooldown central por provedor para reforcar as regras oficiais de rate limit:
  uma requisicao por vez no Lichess e pausa minima de 1 minuto apos HTTP 429; acesso serial no
  Chess.com para evitar 429.
- Manter smoke test de PWA em producao: `npm run build`, `npm run preview`, registro do service
  worker, reload offline e prompt de update.
- Registrar a escolha atual por `vite-plugin-pwa` como decisao implementada/testada, ja que contratos
  antigos mencionavam `manifest.webmanifest`/`sw.js` manuais.
- Endurecer a validacao de shape do import de backup alem de checksum e presenca de tabelas.
- Criar ledger de assets gerados antes de divulgacao publica ampla: arquivo, fonte/ferramenta, prompt,
  data, licenca/termos e status de aprovacao.
