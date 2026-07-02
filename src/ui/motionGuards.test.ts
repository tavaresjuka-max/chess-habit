// @vitest-environment node
//
// Regra "sem cassino": nenhuma animação nova pode escapar de
// prefers-reduced-motion. Este teste lê o CSS real (fs.readFileSync) e
// valida, para cada @keyframes definido, que ele está coberto por pelo
// menos UMA das três redes de segurança:
//
//   1. Guarda LOCAL — o seletor que usa o keyframe é redefinido (ou tem a
//      animação removida/trocada) dentro de um bloco
//      `@media (prefers-reduced-motion: reduce) { ... }` no próprio arquivo.
//   2. Catch-all GLOBAL — a regra `*, *::before, *::after` dentro de
//      `@media (prefers-reduced-motion: reduce)` zera animation-duration e
//      transition-duration para tudo no site (rede de segurança padrão).
//   3. ALLOWLIST explícita neste teste, com comentário justificando por que
//      é aceitável depender só do catch-all global (ex.: só opacidade, sem
//      movimento físico/parallax que cause desconforto).
//
// Se alguém adicionar um @keyframes novo que mexa em transform/posição sem
// guarda local nem allowlist, este teste FALHA — obrigando a pessoa a
// decidir conscientemente (guarda local, ou allowlist com justificativa).

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const CSS_PATH = resolve(__dirname, '../index.css');
const css = readFileSync(CSS_PATH, 'utf-8');

/**
 * Allowlist de @keyframes cobertos SOMENTE pelo catch-all global (sem guarda
 * local própria). Cada entrada exige um motivo por escrito.
 *
 * Regra de bolso: só entra aqui animação que, mesmo sem redução, não causa
 * desconforto físico significativo (nada de parallax grande, shake, ou loop
 * rápido de posição em área grande da tela) — E cuja falha do catch-all
 * (ex.: alguém remove a regra global sem querer) é pega pelo teste
 * `catch-all global existe` abaixo, que roda sempre.
 */
const ALLOWLIST: Record<string, string> = {
  'brand-pulse':
    'Spinner de carregamento (tela de loading): scale 1↔0.96 + opacity, ' +
    'raio de movimento mínimo (4%), tempo de exposição curto (tela de ' +
    'transição, não permanece). Catch-all global zera a duração.',
  'rating-spin':
    'Ícone pequeno (spinner inline ao lado de rating "carregando"), rotação ' +
    'pura sem deslocamento de posição — não é o tipo de movimento que ' +
    'prefers-reduced-motion visa evitar (parallax/deslocamento amplo). ' +
    'Catch-all global zera a duração.',
  'panel-enter':
    'Transição de entrada de painel: translateY(6px), deslocamento de 6px ' +
    'apenas, dura 240ms, dispara 1x por troca de tela (não é loop). ' +
    'Catch-all global zera a duração.',
};

/** Extrai os nomes de todos os `@keyframes <nome> { ... }` do CSS. */
function extractKeyframeNames(source: string): string[] {
  const names: string[] = [];
  const re = /@keyframes\s+([a-zA-Z0-9_-]+)\s*\{/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    const name = match[1];
    if (name) names.push(name);
  }
  return names;
}

/**
 * Extrai o conteúdo de todos os blocos top-level
 * `@media (prefers-reduced-motion: reduce) { ... }`, respeitando chaves
 * aninhadas (o @media pode conter várias regras `.seletor { ... }` dentro).
 */
function extractReducedMotionBlocks(source: string): string[] {
  const blocks: string[] = [];
  const openerRe = /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{/g;
  let match: RegExpExecArray | null;
  while ((match = openerRe.exec(source)) !== null) {
    const start = match.index + match[0].length;
    let depth = 1;
    let i = start;
    while (i < source.length && depth > 0) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}') depth--;
      i++;
    }
    blocks.push(source.slice(start, i - 1));
  }
  return blocks;
}

const keyframeNames = extractKeyframeNames(css);
const reducedMotionBlocks = extractReducedMotionBlocks(css);
const reducedMotionSource = reducedMotionBlocks.join('\n');

/** Um keyframe tem guarda local se, dentro de algum bloco reduce, existir
 * `animation: <nome>` / `animation-name: <nome>` (troca para outra
 * animação) OU `animation: none` / `animation-name: none` associado ao
 * MESMO seletor que usa o keyframe fora do bloco reduce (desliga).
 *
 * Simplificação pragmática: como os blocos reduce deste arquivo sempre
 * miram o seletor que originalmente disparava o keyframe (ver comentários
 * acima de cada bloco), basta checar se o bloco reduce contém `animation:
 * none` para o seletor correspondente OU referencia um keyframe de
 * substituição. Para não acoplar ao nome do seletor (frágil), usamos uma
 * aproximação mais forte: um keyframe X tem guarda local se (a) o próprio
 * bloco reduce contém `animation: none` em ALGUM seletor, e esse seletor
 * aparece fora do bloco reduce associado a `animation: X ...`.
 */
function hasLocalGuard(keyframeName: string): boolean {
  // Encontra os seletores que usam este keyframe fora de blocos reduce.
  const usageRe = new RegExp(
    `([^{}]+)\\{[^{}]*animation(?:-name)?:\\s*${keyframeName}\\b[^{}]*\\}`,
    'g',
  );
  const cssWithoutReducedBlocks = reducedMotionBlocks.reduce(
    (acc, block) => acc.replace(block, ''),
    css,
  );
  const selectors: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = usageRe.exec(cssWithoutReducedBlocks)) !== null) {
    const selector = match[1];
    if (selector) selectors.push(selector.trim());
  }
  if (selectors.length === 0) {
    // Não achou uso fora de bloco reduce (pode ser usado só como
    // substituto DENTRO de um bloco reduce, ex.: block-stamp-fade).
    // Nesse caso, considera guardado — ele É a versão reduzida.
    const isUsedAsReplacement = new RegExp(
      `animation(?:-name)?:\\s*${keyframeName}\\b`,
    ).test(reducedMotionSource);
    return isUsedAsReplacement;
  }

  // Para cada seletor que usa o keyframe normalmente, checa se ELE (ou uma
  // combinação dele, ex. ".foo.bar") aparece dentro de algum bloco reduce
  // com `animation: none` ou trocando para outro keyframe.
  return selectors.some((selector) => {
    const lastPart = selector.split(',').pop()?.trim() ?? selector;
    const simplified = lastPart.split(/\s+/).pop() ?? lastPart;
    const guardRe = new RegExp(
      `${simplified.replace(/[.#]/g, '\\$&')}[^{}]*\\{[^{}]*animation(?:-name)?:\\s*(none|[a-zA-Z0-9_-]+)`,
    );
    return guardRe.test(reducedMotionSource);
  });
}

describe('motion guards — regra "sem cassino"', () => {
  it('o CSS tem pelo menos um @keyframes (sanity check do parser)', () => {
    expect(keyframeNames.length).toBeGreaterThan(0);
  });

  it('catch-all global existe: @media (prefers-reduced-motion: reduce) zera animation-duration e transition-duration para *, *::before, *::after', () => {
    const catchAllRe =
      /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{\s*\*,\s*\*::before,\s*\*::after\s*\{[^}]*animation-duration:\s*0\.01ms\s*!important;[^}]*transition-duration:\s*0\.01ms\s*!important;/;
    expect(css).toMatch(catchAllRe);
  });

  it.each(keyframeNames)(
    '@keyframes %s tem guarda local, está na allowlist, ou é coberto pelo catch-all global',
    (name) => {
      const guardedLocally = hasLocalGuard(name);
      const allowlisted = Object.prototype.hasOwnProperty.call(ALLOWLIST, name);

      if (!guardedLocally && !allowlisted) {
        throw new Error(
          `@keyframes ${name} não tem guarda local (@media prefers-reduced-motion: ` +
            `reduce trocando/removendo a animação) nem está na allowlist deste teste. ` +
            `Adicione uma guarda local no CSS, ou inclua "${name}" em ALLOWLIST em ` +
            `src/ui/motionGuards.test.ts com um comentário justificando por que o ` +
            `catch-all global basta.`,
        );
      }
      expect(guardedLocally || allowlisted).toBe(true);
    },
  );

  it('todo nome na ALLOWLIST ainda existe como @keyframes no CSS (evita allowlist morta)', () => {
    for (const name of Object.keys(ALLOWLIST)) {
      expect(keyframeNames).toContain(name);
    }
  });
});
