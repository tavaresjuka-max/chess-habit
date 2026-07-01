# Fase 5 — Sync multi-aparelho (plano executado / estado vigente)

Status: **EXECUTADO PARCIALMENTE E SUPERSEDIDO COMO PLANO**. Este documento era o plano enxuto definido pelo dono em 2026-06-28. O estado vigente deve ser lido em `docs/architecture/sync.md`, `docs/privacy/privacy-and-data.md`, `DEPLOY-BACKEND.md` e `src/config/syncConfig.ts`.

## Decisões vigentes

- Login: "Entrar com Lichess" como identidade; sem login/senha proprio.
- Backend: Cloudflare Workers + D1.
- Auth de producao: `SYNC_AUTH_MODE='oauth'`; o Worker valida Bearer token contra `https://lichess.org/api/account`.
- Dados: progresso sincronizado fica legivel pelo operador no servidor; sem E2EE/passphrase por decisao do dono.
- Tokens OAuth: usados para validar identidade, mas nao salvos como blob de sync.
- UI: `SYNC_UI_ENABLED=true`; backend configurado em `https://rotina-sync.chesshabit.workers.dev`.
- CSP: Vite/Vercel permitem o Worker em `connect-src`.

## O que foi executado

- B1 auth Lichess real no backend: implementado.
- B2 deploy/config do backend: Worker/D1 configurado no codigo e URL publica no app.
- B5 conteudo legivel + politica + flip: executado; docs/UI declaram sync opt-in legivel no servidor.
- CORS do Worker: adicionado para permitir sync cross-origin do PWA.
- Direito de exclusao: `DELETE /blobs` no backend e cliente `deleteAllBlobs()`.

## O que ainda precisa dogfood/gate antes de divulgacao ampla

- E2E real em dois aparelhos/dispositivos com conta Lichess do dono.
- Politica de retencao/compactacao segura para blobs antigos.
- Monitorar conflitos reais; LWW por registro continua aceitavel para beta pessoal, mas colecoes path-dependent precisam cuidado antes de escala.
- Canal de feedback/dominio proprio e politica operacional de suporte.

## Historico descartado

E2EE + passphrase + frase de recuperacao BIP39 foi descartado por decisao do dono: exagero para app de estudo com dado de baixa sensibilidade. O modelo vigente e conta-normal com privacidade honesta.
