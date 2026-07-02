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

## Rollback

Rollback é sempre reverter para o último estado conhecido bom (deployment/versão
anterior), não um `git revert` seguido de novo deploy — é mais rápido e reduz janela
de indisponibilidade.

### Frontend (Vercel)

O deploy deste app é **só via prebuilt** (ver `memory/deploy-vercel.md`): a pasta
`output/` chega a ~779MB e quebra o upload direto do `vercel deploy` sem
`--prebuilt`. Isso vale também para rollback — promover um deployment anterior é
sempre mais seguro que tentar reconstruir e reenviar.

1. **Dashboard (recomendado):** Vercel → projeto `rotina-pied` → aba **Deployments**
   → localizar o deployment anterior com status "Ready" → menu `⋯` → **Promote to
   Production**. Não requer rebuild nem upload.
2. **CLI:**
   ```sh
   vercel ls rotina-pied            # lista deployments recentes com URL e estado
   vercel promote <deployment-url>  # promove um deployment já construído para produção
   ```
   `vercel promote` reaproveita um build já existente — não recria `output/`, então
   não esbarra no limite de 779MB.
3. **Se o deployment anterior não estiver mais disponível** (expirado/removido):
   fazer checkout do commit anterior bom, rodar o build local (`npm run build`) e
   redeployar via prebuilt (`vercel deploy --prebuilt`, conforme o fluxo semanal
   documentado em `memory/deploy-vercel.md`).

### Backend (Cloudflare Worker)

Wrangler não versiona deployments do Worker automaticamente da mesma forma que a
Vercel — o rollback é por redeploy do código-fonte anterior.

1. Ver histórico de deployments do Worker (se disponível no plano):
   ```sh
   wrangler deployments list -c backend/wrangler.toml
   ```
2. Reverter para uma versão anterior, se o histórico permitir:
   ```sh
   wrangler rollback -c backend/wrangler.toml
   ```
   (reverte para o deployment anterior mais recente; confirme no dashboard
   Cloudflare qual versão ficou ativa.)
3. **Alternativa sempre disponível — redeploy do estado anterior por git:**
   ```sh
   git checkout <commit-anterior-bom> -- backend/
   npm run typecheck:worker && npm run test:worker   # gate antes de reaplicar
   npm run deploy:worker
   git checkout HEAD -- backend/                      # volta o worktree ao normal
   ```
   Preferir esta rota quando `wrangler rollback` não estiver disponível no plano ou
   quando a causa raiz exigir um commit específico (não só "o deployment anterior").

### Checklist de verificação pós-rollback

- [ ] `GET https://rotina-sync.chesshabit.workers.dev/health` responde 200 (Worker) —
      ou a URL de produção do frontend carrega (Vercel).
- [ ] Login OAuth Lichess completa sem erro (fluxo ponta a ponta, ver Smoke E2E abaixo).
- [ ] `wrangler tail -c backend/wrangler.toml` (ou Vercel Runtime Logs) não mostra
      erro novo nos primeiros minutos pós-rollback.
- [ ] CSP (`vercel.json` → `connect-src`) ainda inclui a URL do Worker ativo — um
      rollback do Worker para outro domínio/subdomínio quebraria isso silenciosamente.
- [ ] Registrar o rollback na seção "Registro de deploys" abaixo (data, motivo, o que
      foi revertido, como foi verificado).

## Monitoramento mínimo local-first

Sem dashboard de observabilidade dedicado — monitoramento é local-first: logs sob
demanda via CLI, não coleta contínua de terceiros.

### Worker (Cloudflare)

```sh
wrangler tail -c backend/wrangler.toml
```

Mantém um stream ao vivo de requisições/erros do Worker em produção. Rodar durante
uma janela de deploy ou quando o dono suspeitar de erro ativo; não precisa (e não
deve) ficar rodando continuamente em background sem necessidade.

### Frontend (Vercel)

Vercel → projeto `rotina-pied` → aba **Logs** (Runtime Logs) para erros de função/
edge, se houver; como o app é estático (Vite build), a maior parte da observação
real acontece no console do navegador (`vercel:verification`/DevTools) e no
`wrangler tail` do backend, já que a lógica de servidor mora no Worker.

### Como forçar um erro de teste em preview

Validar que `wrangler tail` está de fato capturando erros: disparar uma chamada
inválida propositalmente e observar o log aparecer.

1. Rodar `wrangler tail -c backend/wrangler.toml` em um terminal e deixar aberto.
2. Em outro terminal, disparar um `POST /blobs` **sem** header `Authorization`:
   ```sh
   curl -i -X POST https://rotina-sync.chesshabit.workers.dev/blobs \
     -H "Content-Type: application/json" \
     -d '{"collection":"test","id":"smoke-test","payload":"{}"}'
   ```
3. Resultado esperado: resposta HTTP **401** (`SYNC_AUTH_MODE='oauth'` em produção
   rejeita requisição sem Bearer válido — ver `backend/worker.ts`, guard de
   `SYNC_LOCAL_ALLOWED`) e a linha correspondente aparece no terminal do
   `wrangler tail` quase em tempo real.
4. Se o 401 não aparecer (ex.: 200 ou 500), é sinal de regressão no guard de auth —
   tratar como incidente, não como falha de teste isolada.

## Riscos pendentes

- Retenção/compactação de blobs antigos ainda precisa política segura.
- Conflitos complexos seguem LWW por registro; coleções path-dependent devem ser revisadas antes de escala.
- Canal de suporte/feedback e domínio próprio ainda dependem do dono.

## Smoke E2E pré-lançamento

Checklist manual contra **produção**, para rodar antes de divulgar uso amplo (ou
depois de um deploy/rollback relevante do backend). Este checklist é só o roteiro —
**não** foi executado como parte desta tarefa de documentação; quem for rodá-lo deve
preencher data e resultado de cada passo.

1. [ ] **Login OAuth Lichess** — abrir o app em produção, iniciar o fluxo de conexão
       com o Lichess (PKCE), autorizar e confirmar retorno ao app com sessão
       conectada (sem erro no console).
       Data: ______  Resultado: ______

2. [ ] **Resolver 1 puzzle roteado** — a partir do plano do dia, abrir um treino de
       puzzle no Lichess pelo link gerado pelo app, resolver, e confirmar que o app
       reconcilia o resultado (puzzle aparece como concluído/registrado no app).
       Data: ______  Resultado: ______

3. [ ] **Sync entre 2 devices** — com sync habilitado e login Lichess em ambos, gerar
       progresso num aparelho, forçar sync, e confirmar que o segundo aparelho reflete
       a mudança (via pull/GET `/snapshot` ou UI de sync).
       Data: ______  Resultado: ______

4. [ ] **Backup export** — em **Ajustes → Dados**, usar "Exportar backup JSON" e
       confirmar que o arquivo baixado é um JSON válido e não vazio.
       Data: ______  Resultado: ______

5. [ ] **Restore** — em outro perfil/navegador (ou após "Apagar tudo" local), usar a
       opção de restaurar backup com o arquivo do passo 4 e confirmar que os dados
       voltam (progresso, plano, sinais) sem erro.
       Data: ______  Resultado: ______

6. [ ] **Delete de dados** — em **Ajustes → Dados**, usar "Apagar tudo" (confirmação
       inline) e, se sync estiver ativo, confirmar também a exclusão remota
       (`DELETE /blobs`); validar que o app volta ao estado inicial/onboarding e que
       um novo `GET /snapshot` não retorna dados antigos do usuário.
       Data: ______  Resultado: ______

## Registro de deploys (processo — deploys manuais DEVEM ser registrados aqui)

- **2026-06-30 (aprox., registrado retroativamente em 2026-07-02):** hardening de sync
  deployado manualmente no Worker de produção — guard `SYNC_LOCAL_ALLOWED` (POST sem
  Bearer → 401 em modo oauth) + `/health` sem o campo `mode`. Verificado por `curl` real
  em 2026-07-02 (auditoria do plano 9.5). Lição de processo: o deploy aconteceu sem
  registro no repo e uma auditoria posterior o tratou como "gap aberto" — todo deploy
  manual do Worker deve ganhar uma linha nesta seção (data, o quê, como foi verificado).
