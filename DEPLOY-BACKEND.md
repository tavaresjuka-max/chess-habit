# Runbook do backend de sync (P4) - operado pelo dono

## Estado vigente

Backend Cloudflare Workers + D1 para sync multi-dispositivo opt-in em modelo conta-normal:

- Worker: `rotina-sync`.
- URL pública configurada no app: `https://rotina-sync.chesshabit.workers.dev`.
- Banco: D1 `rotina-sync`.
- Auth de produção: `SYNC_AUTH_MODE='oauth'`, validando `Authorization: Bearer <token>` no Lichess.
- Dados sincronizados: progresso JSON legível pelo operador, armazenado no campo legado `ciphertext`.
- Sem E2EE/passphrase por decisão de produto; tokens OAuth continuam só no aparelho e não são armazenados como blob.

## Regras invioláveis

- Não commitar secrets.
- Não salvar token OAuth como dado de sync.
- Não sincronizar PGN completo, soluções de puzzle, cache Chess.com bruto, backups locais ou handles de auto-backup.
- Manter CSP `connect-src` apontando para a URL pública do Worker enquanto `SYNC_UI_ENABLED=true`.
- Manter política de privacidade honesta: progresso sincronizado fica legível no servidor.

## Provisionamento

1. Criar/confirmar D1: `wrangler d1 create rotina-sync`.
2. Copiar o `database_id` para `backend/wrangler.toml`.
3. Aplicar schema: `wrangler d1 execute rotina-sync --file=./backend/schema.sql`.
4. Conferir `SYNC_AUTH_MODE='oauth'` em `backend/wrangler.toml`.
5. Deploy: `wrangler deploy -c backend/wrangler.toml` ou `npm run deploy:worker`.
6. Confirmar `GET /health` na URL pública.
7. Confirmar que Vite/Vercel CSP incluem `https://rotina-sync.chesshabit.workers.dev` em `connect-src`.

## API

- `GET /health` — healthcheck público.
- `POST /blobs` — push/upsert de mutação.
- `GET /blobs?collection=<nome>` — pull por coleção.
- `GET /snapshot` — pull de todas as coleções sincronizáveis.
- `DELETE /blobs` — exclusão de todos os blobs do usuário autenticado.

## Gates

- Worker: `npm run typecheck:worker && npm run test:worker`.
- App: `npm run lint && npm test && npm run build`.
- Smoke recomendado: `npm run smoke:pwa`.
- Validação manual crítica: sync real em dois aparelhos/dispositivos antes de divulgar uso amplo.

## Riscos pendentes

- Retenção/compactação de blobs antigos ainda precisa política segura.
- Conflitos complexos seguem LWW por registro; coleções path-dependent devem ser revisadas antes de escala.
- Canal de suporte/feedback e domínio próprio ainda dependem do dono.
