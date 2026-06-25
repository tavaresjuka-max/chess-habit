# SPEC — Lever concept→themeSet: HARDEN o que já existe (não construir mapa novo)

**Data:** 2026-06-25 · **Branch:** `feat/gap1-roteamento-observado` · **Decisão:** maestro + council VERIFICAR.

## Achado que muda o escopo
O "lever" (mapa CONCEITO→themeSet por ESTÁGIO) que eu ia construir **já existe**: é
`catalogSkillNodes` (`src/domain/sources/catalogSkills.ts`). Cada node =
`{ weaknessTag, themeSlugs[], stageFit[], bands[], timeFits[], resourceIds[], lemosCue }`,
para os 14 `WeaknessTag`. Está **ligado à seleção** via `getNodeScore` (+180 quando um
recurso puzzle-theme tem slug ∈ `node.themeSlugs`; +250 quando `resourceId` casa) e
`getWeakThemeScore` (boost ponderado por erro observado). Gate de retenção SM-2 por cima.
→ O acoplamento "retrieval ligado ao conceito" + "prova de retenção" (gap #1 do council de
pedagogia) **já está no produto**. O NON-GOAL do gap1 ("não curar mapa estático de IDs") foi
honrado: o acoplamento é **sinal de scoring**, não mapa rígido.

Auditoria manual: todos os `themeSlugs` dos 14 nodes ∈ catálogo verificado de 74. Sem 404 hoje.

## NON-GOALS
- NÃO criar um `conceptToThemeSet` paralelo (duplicaria `catalogSkillNodes`, reintroduz o
  mapa que o gap1 rejeitou). Slugs estáveis, nunca IDs de puzzle individuais.
- NÃO inventar slug/studyId. NÃO prometer treino offline.
- NÃO expandir conceitos (novos `WeaknessTag` p/ posicional/psicológico) — é decisão de produto.

## Correção do achado (pós-recon + council): a "lacuna" original NÃO existe
A integridade referencial dos skill nodes JÁ É GUARDADA por `catalogSkills.test.ts` (eu havia
perdido este arquivo no recon — reportado honestamente):
- `:30-38` — todo `resourceId` de `catalogSkillNodes` resolve via `findLichessResourceById` (sem orphan ID).
- `:40-50` — todo `themeSlug` de `catalogSkillNodes` ∈ slugs oficiais do catálogo (anti-404).

→ A fase A que eu ia escrever (guard themeSlugs/resourceIds ⊆ catálogo) **já existe**. NÃO duplicar.

## O que o council (DeepSeek V4 Pro + GLM 5.2, VERIFICAR, convergente) elevou como REAL
1. O guard referencial testa SINTAXE (o slug existe), não COMPORTAMENTO (o +180 dispara e vence)
   nem SEMÂNTICA (é o slug CERTO p/ o conceito). `fork` com `themeSlugs:['pin']` passaria o guard
   atual e estaria errado. **Falta guard semântico + teste comportamental do scorer.**
2. Fase C (fallback consciente de estágio) PIORA: reintroduz o mapa rígido rejeitado (14×4 pointers
   a manter). Ambos: descartar; no máximo "degradação honesta" (sinalizar 'sem recurso elegível'
   em vez de encher de recurso errado). → **DEFERIR C.**
3. GAP arquitetural (decisão de PRODUTO, não mexer de madrugada): tags-proxy. `time-trouble` →
   `['short','mix']` não TEM tema conceitual no Lichess (proxies de "puzzle rápido"). Flag p/ o dono.

## Fases REVISADAS (test-only salvo se o gate exigir fix; commit por fase; sem push)
- **A — JÁ EXISTE** (`catalogSkills.test.ts:30-50`). Skip. Documentar.
- **A2 — Guard COMPORTAMENTAL (TDD)** em `resourceSelector.test.ts`: data-driven — p/ cada tag
  TÁTICA, o estágio retrieval seleciona um puzzle-theme ON-CONCEITO (slug ∈ node.themeSlugs), não
  Study/vídeo. Prova que o acoplamento +180 dispara e vence. O GATE decide se há bug peso×estágio.
- **B — Guard SEMÂNTICO (TDD)** em `catalogSkills.test.ts`: tabela curada `expectedCoreSlugByTag` —
  cada node CONTÉM o slug-núcleo do conceito (fork⊇'fork', mateIn2⊇'mateIn2', …); `time-trouble`
  marcado como EXCEÇÃO-proxy documentada. Converte o teste-que-falha do GLM num guard VERDE que
  trava o drift semântico futuro.
- **C — DEFERIDA** (council convergente: piora). Documentar decisão + alternativa degradação-honesta.
- **D — Doc + memória + relatório** com: "A já existia", flag tags-proxy p/ o dono, verdicts do council.

## Critérios de aceite (binários)
- [ ] A2: guard comportamental cobre as tags táticas (retrieval → puzzle on-conceito). Gate verde OU bug corrigido.
- [ ] B: guard semântico `expectedCoreSlugByTag` verde; `time-trouble` documentado como proxy.
- [ ] C não implementada; decisão + alternativa documentadas.
- [ ] Gates verdes: testes, lint, tsc, build.
- [ ] Sem mapa paralelo novo; sem slug/ID inventado; NON-GOALs respeitados.

## Gate = árbitro
Teste/lint/tsc/build decidem. Council validou RACIOCÍNIO (e meu recon pegou que A já existia); gate é o árbitro final.

## Resultado (2026-06-25, gates verdes)
- **A** — confirmado JÁ EXISTENTE (`catalogSkills.test.ts:30-50`). Não duplicado.
- **A2** — guard comportamental adicionado (`resourceSelector.test.ts`): 8 tags táticas, retrieval
  5min → puzzle-theme on-conceito (prova o +180 dispara e vence). + sonda adversarial fork/pin a
  retrieval 10min: **o puzzle vence o Study mesmo com o study viável no tempo** → o risco
  +250(resourceId) vs +180(slug) levantado pelo council **NÃO se reproduz**; o kindPreference de
  retrieval domina. Concern levantado, concern fechado pelo gate.
- **B** — guard semântico adicionado (`catalogSkills.test.ts`): `expectedCoreSlugByTag` (13 tags) +
  `time-trouble` como exceção-proxy. Verde hoje; trava o drift semântico futuro.
- **C** — DEFERIDA (council convergente: piora; reintroduz o mapa rígido). Não implementada.
- Gates: testes 1067/1067, lint limpo, build (tsc -b + vite) ok. Mudança test-only (sem runtime).

## Flags p/ o dono (NÃO toquei de madrugada — fora do escopo unit/gate)
1. **Tags-proxy (decisão de PRODUTO).** `time-trouble` → `['short','mix']`: o Lichess não tem tema de
   gestão de tempo; o roteamento é por proxy. GLM disse "metade do produto é mapa rígido" — adjudiquei:
   factualmente exagerado (todas as 14 tags têm slug), mas o ponto sobrevive p/ `time-trouble` (e em
   parte `blunder-rate`). Para ENSINAR tempo de verdade: precisa Study próprio (camada controlável).
   Recomendo: Study "gestão de relógio" + manter o proxy. **Sua decisão.**
2. **Liveness catálogo↔Lichess (verificação periódica, não unit).** O guard prova consistência
   INTERNA, não que os 74 slugs ainda existem no Lichess vivo. Recomendo um check periódico
   (script/CI noturno) batendo na lista de temas do Lichess — fora do gate de unidade (rede = flaky).
   Não criei p/ não introduzir dependência de rede no CI sem seu OK.
3. **Redesign do scoring unificado (só SE o teto incomodar).** GLM sugeriu, caso a bifurcação
   tático/posicional vire dor: subir p/ council DIVERGIR + Opus. Hoje NÃO é dor (gate verde); registro.

## Procedência: fichas → lever
As fichas de livros-mestres (`docs/research/chess-literature/fichas-pedagogicas-batch4-lever.md`,
Reinfeld/Nunn-LCT etc.) são a fonte de verdade independente que corrobora o `expectedCoreSlugByTag`
do guard semântico (B). O lever em si mora em `catalogSkills.ts` (`catalogSkillNodes`).
