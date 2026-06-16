# Arquitetura Do Sistema

## Decisao Atual

Construir a ferramenta pessoal atual como **PWA local-first sem backend**:

- Frontend: React + Vite + TypeScript.
- PWA: instalavel em desktop e mobile.
- Estado local: IndexedDB/Dexie para perfil, planos, sinais derivados, logs, metodo, pendencias,
  conquistas, backups e metadados locais.
- Integracoes externas: Chess.com PubAPI publica read-only; Lichess via endpoints oficiais e OAuth
  PKCE opt-in somente para `puzzle:read` e `study:write`.
- Backend/D1/Worker: **fora da fase atual**. Permanecem congelados para P4, se o dono decidir
  descongelar sync PC<->celular.

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

Sem backend na fase atual:

- Sem sessao propria do app.
- Sem sync multi-dispositivo.
- Sem conta propria.
- Sem proxy.
- Sem log centralizado.

Congelado para P4/P5:

- Sync PC<->celular opt-in.
- Worker/D1 ou alternativa equivalente.
- Exclusao de conta/servidor, se houver conta futura.
- Proxy apenas se uma fase futura justificar por privacidade/CORS/rate limit e o dono aprovar.
- Versao-comunidade, renomeacao publica e disclaimers publicos.

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

Sync automatico esta congelado. O schema local ja carrega preparos de higiene para eventual merge por
registro, mas nenhum agente deve implementar Worker, D1, proxy ou conta sem nova decisao explicita do
dono. Atualizacao de dados Lichess/Chess.com continua local, manual/opt-in, por APIs oficiais e com
minimo armazenamento.

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
