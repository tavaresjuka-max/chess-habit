# Fase 2 — TacticDiagram + slots de imagem (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development ou executing-plans. Steps usam checkbox (`- [ ]`).

**Goal:** dar identidade visual de "app de xadrez" ilustrando cada conceito tático com um mini-diagrama de tabuleiro (estilo A), começando pelo `PlanBlockCard`.

**Architecture:** componente SVG puro `TacticDiagram` que lê um spec declarativo (`TacticDiagramSpec`) de um dataset por `WeaknessTag`. Renderiza tabuleiro N×N (cores Lichess), peças (glifos Unicode), setas (motivo do golpe) e marcas. Lazy mount via IntersectionObserver. `role="img"` + `aria-label`. Integra no `PlanBlockCard` quando `block.weaknessTag` existe.

**Tech Stack:** React 19, TypeScript estrito, Vitest + Testing Library, SVG inline.

---

## File Structure

- Create: `src/ui/art/tacticDiagrams.ts` — tipos `TacticDiagramSpec` + dataset `tacticDiagrams: Partial<Record<WeaknessTag, TacticDiagramSpec>>`.
- Create: `src/ui/art/tacticDiagrams.test.ts` — cobertura (todo motivo tem spec válido) + chess-sanity (setas/peças coerentes).
- Create: `src/ui/art/TacticDiagram.tsx` — componente SVG + lazy mount.
- Create: `src/ui/art/TacticDiagram.test.tsx` — render: `role="img"`, aria-label, nº de casas.
- Modify: `src/ui/PlanBlockCard.tsx` — renderiza `<TacticDiagram tag={block.weaknessTag} />` no header quando houver tag.
- Modify: `src/index.css` — estilo do contêiner do diagrama (responsivo).

## Conceitos cobertos (13; `time-trouble` = sem diagrama → null)

| Tag | Motivo ilustrado (correção pedagógica) |
|---|---|
| fork | cavalo ataca rei e dama (2 setas) |
| pin | bispo prende cavalo contra o rei atrás (peça menor na frente) |
| skewer | bispo ataca rei na frente; ao sair, expõe a dama atrás (peça maior na frente) |
| discovered | peça sai da frente e revela ataque da peça atrás (2 setas) |
| hanging-piece | peça sem defensor sob ataque (1 seta) |
| mate-in-1 | dama dá mate, rei sem fuga (setas + marcas nas casas cobertas) |
| mate-in-2 | rede de mate: 2 atacantes convergindo |
| back-rank | rei preso atrás dos próprios peões, torre na última fileira |
| opening-principles | centro + peças desenvolvidas + rei no roque (sem seta; marcas no centro) |
| endgame-pawn | rei apoia peão promovendo (seta à promoção) |
| endgame-rook | torre corta o rei, peão avança |
| conversion | vantagem material esmagadora (dama x rei) |
| blunder-rate | peça própria deixada pendurada (alerta) |

> **Correção pedagógica (council L3):** pin vs skewer diferem pela peça da frente (menor=pin, maior=skewer); espeto ≠ garfo. Cada diagrama é **verificado visualmente no preview** antes do commit.

## Tasks (TDD)

### Task 1: dataset + tipos + cobertura
- [ ] Definir `TacticDiagramSpec` (`size`, `pieces[{at,glyph,side}]`, `arrows[{from,to}]`, `marks[]`, `label`) e o dataset em `tacticDiagrams.ts`.
- [ ] Teste `tacticDiagrams.test.ts`: cada um dos 13 motivos tem spec; `label` não-vazio; toda casa de peça/seta dentro de `0..size-1`; ≥1 peça.
- [ ] Rodar: `npm test -- tacticDiagrams` → PASS.
- [ ] Commit.

### Task 2: componente TacticDiagram + lazy mount
- [ ] `TacticDiagram.tsx`: props `{ tag: WeaknessTag | undefined }`. Sem spec → `null`. Com spec → SVG (`role="img"`, `aria-label={spec.label}`), casas claras/escuras, peças (fill por `side`), setas com marker, marcas. IntersectionObserver monta o SVG só quando visível (fallback: monta direto se IO indisponível, ex.: jsdom).
- [ ] `TacticDiagram.test.tsx`: tag com spec → `getByRole('img')` com aria-label; nº de `rect` de casa = `size*size`; tag `time-trouble` → não renderiza img.
- [ ] Rodar: `npm test -- TacticDiagram` → PASS.
- [ ] Commit.

### Task 3: integrar no PlanBlockCard
- [ ] Em `PlanBlockCard.tsx`, após `block-header`, renderizar `{block.weaknessTag !== undefined ? <TacticDiagram tag={block.weaknessTag} /> : null}`.
- [ ] Teste no `PlanBlockCard.test.tsx`: bloco com `weaknessTag: 'fork'` mostra `img` com aria-label de garfo; bloco sem tag não mostra img.
- [ ] CSS do contêiner em `index.css` (largura responsiva, centralizado).
- [ ] Rodar: `npm test -- PlanBlockCard` → PASS.
- [ ] **Verificação visual:** preview 375px, abrir um plano, confirmar o diagrama renderiza correto (fork/pin/skewer distinguíveis).
- [ ] Gates: lint · test · build. Commit.

## Self-review
- Cobertura do spec Frente A1 ✓ (TacticDiagram + 13 motivos + a11y + lazy). A2 (slots premium) é fase posterior (precisa das imagens do dono).
- Sem placeholders: specs com coordenadas concretas no código; correção verificada no preview.
- Consistência de nomes: `TacticDiagramSpec`, `tacticDiagrams`, `TacticDiagram`, `tag`.
