# Relatorio Codex — Auditoria Geral E Estabilizacao

Data: 2026-06-13  
Escopo: projeto atual `lichess-tutor`, documentacao, governanca, runtime React/TypeScript, integracoes,
PWA/offline, persistencia, UI e gates locais.  
Status: achados criticos de governanca resolvidos nesta passada; melhorias restantes ficam como backlog
tecnico, sem descongelar P4/P5.

## Resumo Executivo

O projeto esta forte para a moldura atual: ferramenta pessoal, local-first, Lichess-first, clean-room,
sem tabuleiro proprio, sem engine, sem ajuda durante partida viva e sem PGN completo persistido. O dominio
esta bem separado da UI/infra, os testes cobrem o nucleo, a UI passou por smoke desktop/mobile sem overflow
horizontal e a privacidade esta alinhada ao AGENTS.md.

A auditoria encontrou quatro problemas que podiam confundir agentes, bloquear entrega ou sujar o status:
lint vermelho por
comentario ESLint invalido, spec de badges ainda marcada como rascunho apesar da implementacao existente,
arquitetura documentada como full-stack/Worker/D1 apesar de P4 estar congelada e artefato local de
imagegen aparecendo como untracked. Os quatro foram enderecados em 2026-06-13.

## Notas Por Area

| Area | Nota | Leitura |
|---|---:|---|
| Produto/governanca | 8.5 | Moldura pessoal e fases claras; badge aprovado e docs alinhados. |
| Arquitetura/camadas | 8.5 | Dominio puro e fronteiras boas; `useAppState` ainda e grande. |
| Dominio/pedagogia/adaptacao | 8.0 | Metodo rico, trilhas e pendencias coerentes; curriculo denso ainda e Corte 8. |
| Integracoes/API/privacidade | 8.0 | APIs oficiais, escopos minimos e PGN transiente; falta fila/cooldown central. |
| Persistencia/data safety | 8.5 | Dexie, backup, checksum, restore e storage.persist fortes; shape validation pode aprofundar. |
| PWA/offline | 7.5 | Build PWA e prompt existem; falta smoke automatizado de producao/offline. |
| UI/UX mobile/desktop | 8.5 | Visual premium, PT-BR adulto e sem overflow na auditoria; mobile continua denso. |
| Testes/QA | 8.5 | Suite ampla; lint corrigido nesta passada. |
| Seguranca/dependencias | 8.5 | Audit limpo na auditoria; fase publica exigira revisao de assets/licencas. |
| Documentacao/memoria | 8.0 | Rica e atualizada nesta passada; historico antigo ainda precisa ser lido como historico. |
| DevEx/manutencao | 7.5 | Tooling estrito; warning de bundle e componente/estado grandes permanecem. |

## Achados Resolvidos Nesta Passada

1. **Lint vermelho em `Fold`**: `src/ui/Fold.tsx` usava `eslint-disable-next-line react-hooks/exhaustive-deps`
   sem o plugin/regra configurado. O componente passou a guardar `open` com `useState(defaultOpen)`,
   preservando o toque do usuario sem comentario invalido.
2. **Badges em conflito de governanca**: a spec `docs/superpowers/specs/2026-06-10-badges-spec-draft.md`
   foi marcada como aprovada pelo dono em 2026-06-13. A v1 aprovada tem 5 badges unicos, sem rating,
   sem streak punitivo, com metrica de qualidade e export/backup via Dexie.
3. **Arquitetura stale**: `docs/architecture/system.md` foi atualizado para refletir a fase atual:
   PWA local-first sem backend, com Worker/D1/sync congelados para P4.
4. **Ruido de artefato local**: `.gitignore` passou a ignorar `output/imagegen/`, onde ficam folhas de
   contato/previews gerados localmente; os assets otimizados continuam em `public/art`.

## Melhorias Recomendadas

1. **Fila/cooldown central por provedor**: criar um `rateLimitedFetch` ou fila de requisicoes para Lichess
   e Chess.com. Deve garantir uma chamada por vez, pausar pelo menos 1 minuto apos 429 no Lichess e
   evitar paralelismo no Chess.com.
2. **Smoke PWA de producao/offline**: automatizar build + preview + service worker + reload offline +
   prompt de update, porque a checagem visual atual usa dev server.
3. **ADR curta para `vite-plugin-pwa`**: a implementacao atual usa plugin e esta testada; contratos antigos
   ainda mencionavam manifest/service worker manuais. Registrar a razao evita regressao documental.
4. **Validacao profunda de backup importado**: alem de checksum e tabelas-array, validar campos essenciais
   de profile, plans, logs, signals, pendencias, conquistas e placement.
5. **Ledger de assets gerados**: antes de qualquer P5, criar `docs/design/assets-ledger.md` com arquivo,
   fonte/ferramenta, prompt, data, licenca/termos e status de aprovacao.
6. **DevEx/manutencao**: reduzir gradualmente `useAppState`, investigar o warning de chunk principal
   acima de 500 kB e manter dependencias menores atualizadas em lote controlado.

## Fontes Oficiais Revalidadas

- Lichess API Tips: confirma preferencia por API oficial sobre scraping/browser automation, uma requisicao
  por vez e pausa de 1 minuto apos HTTP 429.
- Chess.com PubAPI Help Center, atualizado em 2026-04-20: confirma API publica read-only, sem comandos
  de jogo; acesso serial evita 429.
- MDN Service Workers/PWA: reforca responsabilidades de cache, instalacao, atualizacao e remocao de
  recursos antigos.
- Vite PWA prompt-for-update: confirma fluxo de prompt/update via `virtual:pwa-register` e estrategia
  de atualizar sem recarregar automaticamente.

## Verificacoes

- `npm run lint`: passou.
- `npm run test`: passou, 57 arquivos e 370 testes.
- `npm run build`: passou; PWA gerada com 73 entradas de precache. Permanece warning conhecido de chunk
  principal acima de 500 kB.
- `npm audit --audit-level=moderate`: passou, 0 vulnerabilidades.
- `npm audit --omit=dev --audit-level=moderate`: passou, 0 vulnerabilidades.
- Varredura runtime `rg "TODO|FIXME|any\b|ts-ignore|debugger|console\.log|unknown as|as never" src public`
  excluindo testes: sem ocorrencias.
- Smoke Playwright em `http://127.0.0.1:5173/`: desktop 1280x900 e mobile 390x844 abriram a tela Hoje,
  encontraram 6 dobras `Fold`, alternaram a primeira dobra de fechada para aberta, sem erros de console
  e sem overflow horizontal.
- Auditoria visual Playwright da rodada anterior: desktop/mobile sem overflow horizontal em Welcome, Hoje,
  Progresso e Config. Os screenshots temporarios `output/playwright/audit-*2026-06-13.png` foram removidos
  desta arvore de trabalho.
