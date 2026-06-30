# Arquitetura Do Sistema

## Decisao Atual

Construir a ferramenta atual como **PWA local-first**; P4 foi descongelada pelo dono em 2026-06-16,
mas o agente so constroi/testa backend localmente, sem deploy, contas ou secrets de producao:

- Frontend: React + Vite + TypeScript.
- PWA: instalavel em desktop e mobile.
- Estado local: IndexedDB/Dexie para perfil, planos, sinais derivados, logs, metodo, pendencias,
  conquistas, backups e metadados locais.
- Integracoes externas: Chess.com PubAPI publica read-only; Lichess via endpoints oficiais e OAuth
  PKCE opt-in somente para `puzzle:read` e `study:write`.
- Backend/D1/Worker: autorizado para P4 local-only com Cloudflare Workers + D1, E2EE por passphrase
  e tokens OAuth sempre locais. Producao/provisionamento ficam com o dono.

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

Sem backend de producao na fase atual:

- Sem sessao propria do app.
- Sem sync multi-dispositivo em producao ate o dono provisionar a nuvem.
- Sem conta propria.
- Sem proxy.
- Sem log centralizado.

Autorizado para P4/P5, ainda pendente de implementacao completa:

- Sync PC<->celular opt-in.
- Worker/D1 local-only.
- Exclusao de conta/servidor, se houver conta futura.
- Proxy apenas se uma fase futura justificar por privacidade/CORS/rate limit e o dono aprovar.
- Renomeacao publica via `APP_NAME`, disclaimers publicos, aviso de copyright (proprietario) e docs de privacidade.

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

Sync P4 esta descongelado para desenvolvimento local: Workers + D1, login "Entrar com Lichess" apenas
como identidade, blobs cifrados ponta-a-ponta por passphrase do dono, merge por `updatedAt`/tombstone e
tokens OAuth nunca enviados ao servidor. Producao, secrets e provisionamento continuam fora do agente.
Atualizacao de dados Lichess/Chess.com continua por APIs oficiais e com minimo armazenamento.

## Pendencias De Arquitetura Registradas Em 2026-06-13

- Criar uma fila/cooldown central por provedor para reforcar as regras oficiais de rate limit:
  uma requisicao por vez no Lichess e pausa minima de 1 minuto apos HTTP 429; acesso serial no
  Chess.com para evitar 429.
- Adicionar smoke test de PWA em producao: `npm run build`, `npm run preview`, registro do service
  worker, reload offline e prompt de update.
- Registrar a escolha atual por `vite-plugin-pwa` como decisao implementada/testada, ja que contratos
  antigos mencionavam `manifest.webmanifest`/`sw.js` manuais.
- Endurecer a validacao de shape do import de backup alem de checksum e presenca de tabelas.
- Criar ledger de assets gerados antes de qualquer preparo P5: arquivo, fonte/ferramenta, prompt,
  data, licenca/termos e status de aprovacao.
