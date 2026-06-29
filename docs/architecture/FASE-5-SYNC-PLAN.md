# Fase 5 — Sync multi-aparelho (plano de execução)

Status: **DESENHO FECHADO** (decisões do dono 2026-06-28, pós-council). Aguardando OK pra executar.
Origem: [[launch-readiness-council-2026-06-27]]; council GLM (achou o split-brain de passphrase) +
DeepSeek (achou a responsabilidade de dado legível → manter E2EE; sugeriu frase de recuperação).

## Decisões do dono (fechadas)
- **Privacidade: E2EE MANTIDO** — o operador NÃO lê dado individual. A promessa de privacidade do app
  NÃO muda (continua "nem nós lemos").
- **Segredo: frase de recuperação de 12 palavras (BIP39)** GERADA pelo app (não senha escolhida pelo
  usuário) — alta entropia + UX "anote estas palavras". Substitui a passphrase digitada.
- **Análise: métricas AGREGADAS/anônimas opt-in** — o dono melhora o app sem guardar dado legível por
  usuário. (Resolve o "quero analisar" sem a responsabilidade LGPD de dado legível.)
- **Marketing: NÃO agora** (pode entrar depois com opt-in de contato separado).
- **Login/identidade: Lichess OAuth** — sem login/senha próprio do app.

## Por que NÃO o Caminho B (dado legível): council
DeepSeek: dado de progresso É dado pessoal; guardá-lo legível no servidor colide com LGPD (segurança
desde a concepção, art. 46) e a legibilidade é só conveniência (sync funciona E2EE; análise via agregado).
"Isolamento por userId" é filtro de query, não barreira de segurança. → Mantido E2EE.

## Blocos
**B0 — Frase de recuperação + protocolo de passphrase no servidor [gate de dados]**
- Gerar BIP39 (12 palavras) na 1ª configuração; derivar a chave (PBKDF2 600k já existe em crypto.ts;
  a entropia agora vem da frase, não de senha fraca humana). O checksum do BIP39 pega erro de digitação
  no próprio aparelho.
- **Canary NO SERVIDOR:** o 2º aparelho valida a frase contra o servidor ANTES de subir qualquer coisa;
  frase divergente = bloqueia push + recuperação guiada → mata o split-brain (achado do GLM: hoje o
  canary é só local, 2 frases diferentes corromperiam o servidor em silêncio).
- "Esqueceu a frase" = dados de sync irrecuperáveis (preço do E2EE) → avisos fortes + "anote". Rotação de
  frase = fora do escopo do beta (documentado, com o caveat "aparelho perdido").

**B1 — Auth Lichess (M13) + cache de token + ciclo de vida [gate segurança]**
- Worker valida o token Lichess COM cache (TTL ~30s) → evita 429 por IP compartilhado (egress único do
  Worker, achado do GLM). 401 (token expira/revoga) → pede re-login, mas o app segue funcionando LOCAL
  (grace), nunca trava.
- userId derivado do Lichess. Como é E2EE, vazamento do D1 expõe só identidade/metadados, NÃO o conteúdo
  (que é ilegível). Documentar essa exposição residual.

**B2 — Deploy do backend**
- `wrangler d1 create` → database_id real; secrets; SYNC_AUTH_MODE='oauth'; SYNC_BACKEND_URL no front;
  script de deploy. Dono: criar conta Cloudflare (grátis) + aprovar.

**B3 — Conflito LWW "bom o suficiente"** + aviso de clock-skew. (Council 2026-06-28: HLC/log-de-reviews =
YAGNI p/ 2-3 aparelhos NTP do mesmo usuário. Ver [[launch-readiness-council-2026-06-27]] / SYNC-HARDENING.)

**B4 — Prova E2E real [gate de qualidade]**
- wrangler dev/Miniflare: push aparelho A → pull aparelho B; **frase errada é REJEITADA sem corromper**;
  **"pull vazio NÃO apaga o local"**; 1º sync grande (tamanho). Depois: dogfood do dono em 2 aparelhos.

**B5 — Métricas agregadas opt-in + UX + política + flip**
- Métricas anônimas/agregadas (opt-in, com consentimento) p/ o dono analisar/melhorar — SEM dado legível
  por usuário.
- UX: "Entrar com Lichess" + tela da frase de recuperação ("anote estas 12 palavras"). Remover o campo de
  "digite uma passphrase" do SyncPanel.
- Política de privacidade: E2EE mantido (promessa intacta); ACRESCENTAR o opt-in de métricas. Atualizar
  ANTES de qualquer métrica fluir (sequenciamento, achado do DeepSeek).
- Flip SYNC_UI_ENABLED=true só no fim.

**B6 — Custo:** Cloudflare Workers + D1 + Vercel no free tier → ~R$0 no beta.

## Ordem
B0 + B1 (gates) → B2 (deploy) → B4 (E2E + dogfood) → B5 (métricas/UX/política/flip). Política/consentimento
de métricas antes de qualquer métrica subir. NÃO ligar a flag sem B0+B1+B4 verdes.

## Execução (padrão do projeto)
Council fechou o desenho → Opus revisa risco (B0/B1 = classe dado/segurança) → subagente in-boundary
implementa test-first → gates (lint/test/build/worker + E2E) → Opus commita. Dono só: conta Cloudflare +
aprovar deploy + dogfood em 2 aparelhos. Gate objetivo (E2E) = árbitro final, não o voto.

## Estimativa
~2-3 semanas de trabalho (pipeline), infra ~R$0. Reaproveita muito do que já existe (crypto E2EE,
SyncClient, backend, merge, ciclo crash-safe).
