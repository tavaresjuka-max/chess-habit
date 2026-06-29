# Fase 5 — Sync multi-aparelho (plano de execução, versão enxuta)

Status: **DESENHO FECHADO** (dono 2026-06-28). Modelo NORMAL de app de estudo (Anki/Duolingo/Chess.com/
Lichess): loga e sincroniza. **Sem E2EE, sem passphrase, sem frase de recuperação** — isso era cerimônia
de carteira de cripto, exagero pra um app de xadrez (dado de baixa sensibilidade). Decisão do dono.

## Decisões do dono
- **Login:** só "Entrar com Lichess" (OAuth). Sem login/senha próprio. Esqueceu? Loga de novo, está tudo lá.
- **Dados:** ficam no servidor (Cloudflare D1), **legíveis pelo operador** — modelo de conta normal.
- **Privacidade:** política HONESTA ("seus dados ficam no nosso servidor pra sincronizar; usados só pra
  operar o app; apague quando quiser") + consentimento (já existe) + botão de apagar (já existe).
- **Marketing:** não agora (opt-in de contato pode entrar depois).
- **Sobre o council:** ele apontou risco técnico real (dado legível), mas a PROPORÇÃO é decisão de
  produto — pra um app de estudo com dado de baixa sensibilidade, conta-normal é o padrão da indústria e
  é LGPD-ok com medidas proporcionais (não exige E2EE). Regra: council valida raciocínio, não realidade.

## Blocos
**B1 — Login Lichess de verdade no backend (M13) [gate segurança]**
- Hoje o backend confia no header `x-sync-user` (M12) = sem auth real → em produção qualquer um se passa
  por qualquer um. Trocar por: cliente manda o token OAuth Lichess; o worker VALIDA (chama a API do
  Lichess) → obtém o usuário → userId. CACHE da validação por token (TTL ~30s) p/ não estourar rate-limit
  por IP. Token expirado/revogado (401) → pede re-login, mas o app segue funcionando LOCAL (nunca trava).
- Mantém o modo 'local' (header) só pra dev/testes.
**B2 — Deploy do backend** `wrangler d1 create` → database_id; SYNC_AUTH_MODE='oauth'; SYNC_BACKEND_URL;
script de deploy. Dono: criar conta Cloudflare (grátis) + aprovar.
**B3 — Conflito simples** último a salvar vence (LWW), + merge do carimbo de adoção (já feito). Council:
HLC = exagero p/ 2-3 aparelhos do mesmo usuário.
**B4 — Prova E2E real [gate]** push aparelho A → pull aparelho B; teste "pull vazio NÃO apaga o local"; 1º
sync grande. Depois: dogfood do dono em 2 aparelhos.
**B5 — Conteúdo legível + política + UX + flip** cliente manda o JSON por HTTPS (sem cifrar p/ o servidor;
remover a etapa de E2EE/passphrase do fluxo de sync); reescrever política de privacidade (honesta sobre
servidor) ANTES de qualquer dado subir; remover a UI de passphrase do SyncPanel; UX = "Entrar com Lichess"
→ sincroniza; flip SYNC_UI_ENABLED no fim.
**B6 — Custo** Cloudflare + Vercel free tier → ~R$0 no beta.

## Ordem
B1 (auth) → B2 (deploy) → B4 (E2E + dogfood) → B5 (legível + política + flip). Política antes de qualquer
dado subir. NÃO ligar a flag sem B1 + B4 verdes.

## Execução
Opus revisa risco (B1 = segurança) → subagente in-boundary implementa test-first → gates (lint/test/build/
worker + E2E) → Opus commita. Dono: conta Cloudflare + aprovar deploy + dogfood. Gate objetivo = árbitro.

## Estimativa
~1-1,5 semana (bem mais curto sem E2EE/passphrase). Reaproveita SyncClient, backend, merge, ciclo
crash-safe. Infra ~R$0.

## Descartado (e por quê)
E2EE + passphrase + frase de recuperação BIP39: exagero pra app de estudo (decisão do dono 2026-06-28).
O backend já guardava "ciphertext opaco"; no modelo enxuto, o cliente manda o conteúdo legível (HTTPS +
at-rest do Cloudflare + isolamento por userId + acesso restrito ao banco).
