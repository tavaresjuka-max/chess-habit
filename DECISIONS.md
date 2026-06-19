# Decisoes Operacionais Do Run Overnight

## 2026-06-17 - M1 - Screenshots E2E como evidencia gerada

- **Decisao:** os prints de M1 sao gerados em `e2e/__screenshots__/` durante `npm run smoke:pwa`
  nos projetos desktop e mobile, sem transformar este corte em visual-regression por diff de pixels.
- **Alternativa:** usar `expect(page).toHaveScreenshot()` como baseline bloqueante.
- **Por que:** o roadmap pede prints por etapa e visual snapshots, mas ainda nao define politica de
  tolerancia, SO/base de imagem ou revisao de baseline. Artefatos gerados entregam evidencia visual
  agora sem criar falso vermelho cross-platform; comparacao visual bloqueante pode entrar depois com
  baseline aprovado pelo dono.

## 2026-06-17 - M1 - Smoke E2E em PR

- **Decisao:** o job `smoke` do GitHub Actions roda tambem em `pull_request`, usando o mesmo comando
  local `npm run smoke:pwa`.
- **Alternativa:** manter smoke so em `push` para economizar tempo de CI.
- **Por que:** M1 pede que smoke+E2E rode em PR; a suite nova usa mocks locais, build Vite isolado,
  projetos desktop/mobile e `workers: 1`, entao o custo e aceitavel para proteger fluxos principais
  antes do merge.

## 2026-06-17 - P5 - URL publica de codigo-fonte ainda pendente

- **Decisao:** centralizar `APP_NAME`, disclaimer, doacao e URL de codigo-fonte em
  `src/config/appIdentity.ts`; enquanto nao houver remote/URL publica configurada, a UI mostra
  "Codigo-fonte: URL publica pendente." em vez de apontar para um link inventado.
- **Alternativa:** preencher uma URL de GitHub presumida.
- **Por que:** o repositorio local nao tem `git remote`; um link falso pioraria a conformidade AGPL e a
  confianca do beta. A troca ficou em uma constante unica para o dono preencher antes do beta publico.

## 2026-06-19 - CSP style-src e limite do sonner

- **Decisao:** manter `style-src 'self' 'unsafe-inline'` por enquanto porque `sonner` injeta `<style>` e
  usa estilos/variaveis inline em runtime. O smoke CSP sem `unsafe-inline` bloqueou esses estilos nos
  projetos desktop e mobile.
- **Alternativa:** remover `unsafe-inline` imediatamente.
- **Por que:** todo estilo inline de autoria propria foi removido/evitado; as barras de progresso usam
  `<progress value>` estilizado por CSS, e o avatar usa classe CSS. Fechar a CSP exige trocar o `sonner`
  ou carregar seus estilos estaticamente sem runtime inline.
