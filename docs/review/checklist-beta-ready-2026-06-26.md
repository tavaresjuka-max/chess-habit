# Checklist Beta-Ready (P5, versão-comunidade) — 2026-06-26

Checklist de pronto-para-beta público. Auditoria de invariantes + testes de guarda. Em 2026-06-27,
o PWA foi publicado em produção Vercel; provisionamento/secrets Cloudflare continuam fora deste checklist.
Artefato companheiro do
[relatório de finalização beta local-first (2026-06-19)](relatorio-finalizacao-beta-local-first-2026-06-19.md)
e do [roadmap beta (2026-06-16)](roadmap-beta-2026-06-16.md); difere destes por ser uma lista de
invariantes binários (verde/vermelho), não um relatório narrativo.

Fonte canônica de identidade pública: `src/config/appIdentity.ts` (`APP_NAME = 'Chess Habit'`).

## 1. Identidade pública na UI

| Item | Onde | Estado |
| --- | --- | --- |
| `APP_NAME = 'Chess Habit'` numa constante única | `src/config/appIdentity.ts:2` | ✅ |
| Título/descrição do HTML usam "Chess Habit" | `index.html:7,10` | ✅ |
| `document.title` via `APP_NAME` | `src/main.tsx:10` | ✅ |
| Manifest PWA `name`/`short_name` via `APP_NAME` | `vite.config.ts:33-34` | ✅ |
| Marca no nav e loading via `APP_NAME` | `src/ui/App.tsx:208,303` | ✅ |
| Nomes públicos rejeitados (`Lichess Tutor`, `Rotina`) bloqueados em entry points | `src/config/appIdentity.test.ts` (grep em README/index.html/vite.config/App.tsx/study.ts) | ✅ |

Observação: `lichess-tutor` permanece como **nome interno** (repo, package, IndexedDB
`storageDatabaseName`, formato de backup `lichess-tutor-backup`, `clientId` OAuth `lichess-tutor-local`,
chaves de sessionStorage). Isso é permitido pelo AGENTS.md ("nome de trabalho interno") e não é
exibido ao usuário como marca.

## 2. Rodapé/legal público (`LegalFooter` em `src/ui/App.tsx`)

| Item | Onde | Estado |
| --- | --- | --- |
| Disclaimer de não-afiliação | `APP_LEGAL_DISCLAIMER` → `App.tsx:69` | ✅ |
| Nota AGPL-3.0 visível | `App.tsx:70` | ✅ |
| Link de código-fonte (definido, não pendente) | `SOURCE_CODE_URL` → `App.tsx:74-81` | ✅ `https://github.com/tavaresjuka-max/chess-habit` |
| Link de feedback (definido) | `FEEDBACK_URL` → `App.tsx:91-100` | ✅ `.../issues` |
| Resumo de privacidade em `<details>` | `PRIVACY_SUMMARY` → `App.tsx:83-90` | ✅ 4 linhas |
| Doação só aparece se definida (hoje `undefined`) | `DONATION_URL` → `App.tsx:101-105` | ✅ oculto |
| Disclaimer + AGPL + source + feedback renderizados no DOM | `src/ui/App.test.tsx` (LegalFooter) | ✅ |

## 3. Anti-indexação e segurança HTTP

| Item | Onde | Estado |
| --- | --- | --- |
| `robots.txt` disallow all | `public/robots.txt` | ✅ |
| `X-Robots-Tag: noindex, nofollow` | `vercel.json:8-10` | ✅ |
| CSP estrita (script-src 'self') | `vite.config.ts:12-13`, `vercel.json:28-29` | ✅ (`style-src 'unsafe-inline'` documentado — `sonner`) |
| Headers X-Content-Type-Options / Frame-Options / Referrer-Policy / Permissions-Policy | `vercel.json:11-26` | ✅ |
| Build sem source maps | `vite.config.ts:93` (`sourcemap: false`) | ✅ |

## 4. Documentação de privacidade

| Item | Onde | Estado |
| --- | --- | --- |
| Doc de privacidade reflete beta público + `Chess Habit` | `docs/privacy/privacy-and-data.md:48-57` | ✅ |
| Drift Study-links×backup resolvido (links entram no backup) | `docs/privacy/privacy-and-data.md:50` | ✅ |
| Contrato E2EE P4 (passphrase independente) documentado | `docs/architecture/sync.md` + `DEPLOY-BACKEND.md` | ✅ (doc; sync não implantado em produção) |

## 5. Licença

| Item | Onde | Estado |
| --- | --- | --- |
| LICENSE AGPL-3.0 no repo | `LICENSE` | ✅ |
| README declara AGPL-3.0 + cláusula 13 | `README.md:50-57` | ✅ |

## Testes adicionados nesta auditoria

- `src/config/appIdentity.test.ts`: afirma que `SOURCE_CODE_URL` e `FEEDBACK_URL` estão definidos
  (`https://`) para o beta público — antes só se testava o comportamento opcional (undefined).
- `src/ui/App.test.tsx`: afirma que o `LegalFooter` renderiza disclaimer (`não oficial`/`não
  afiliado`) e a nota `AGPL-3.0` no DOM.

## Gates e deploy (2026-06-27)

Resultado final após commit, push e deploy:

| Gate | Resultado |
| --- | --- |
| GitHub CI `master` | ✅ success |
| `npm run lint` | ✅ exit 0 |
| `npm test` | ✅ 119 arquivos, 1294 testes |
| `npm run build` | ✅ exit 0 (`tsc -b && vite build`); sem source maps |
| `npm run smoke:pwa` | ✅ 40/40 (desktop + mobile) |
| `npm run typecheck:worker` | ✅ exit 0 (`tsc -p backend/tsconfig.json`) |
| `npm run test:worker` | ✅ 1 arquivo, 22 testes |
| Deploy Vercel produção | ✅ `https://rotina-pied.vercel.app` HTTP 200 |
| Anti-indexação produção | ✅ `X-Robots-Tag: noindex, nofollow` |

## Riscos/follow-ups (não bloqueantes para o checklist, mas registrar)

- **Identidade/persona `Tavarez`×`Lemos`**: a UI de voz usa "Professor Tavarez"
  (`src/ui/TutorCard.tsx`) enquanto docs pedagógicos canônicos usam "Professor Lemos". É
  **microcopy/persona**, não nome público do app; flagado para decisão do dono em
  `SPEC-execucao-autonoma-2026-06-26.md` (T4). Não afeta o nome "Chess Habit".
- **`Rotina` residual em arquivos não-públicos**: comentário em `src/index.css:2`, título de
  `docs/design/preview.html`, e menções históricas em `memory/` e `docs/review/*.md`. Nenhum é
  entry point público embarcado no PWA; o teste de rejeição cobre os 5 entry points que importam.
- **`style-src 'unsafe-inline'`** permanece na CSP por dependência do `sonner`; documentado em
  `DECISIONS.md`.
- **Sync P4 (Cloudflare)**: implementado local-only; UI de Config existe atrás de feature flag OFF.
  Provisionamento/secrets Cloudflare, OAuth de sync, merge Dexie, fila offline e E2E dois-dispositivos
  ainda pendem de fase dedicada. Não bloqueia o beta público estático/local-first.
