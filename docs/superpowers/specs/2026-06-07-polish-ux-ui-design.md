# Spec de Design: Polish UX/UI da ferramenta pessoal (Hoje, Card, Config, a11y, feedback)

- Data: 2026-06-07
- Planejador: Claude (claude-opus-4-8)
- Executor: Codex
- Origem: rodada multi-IA de auditoria UX/UI em `docs/review/ux-ui-community-audit/`
  (relatórios `relatorio-claude-…`, `relatorio-codex-…`, `relatorio-gemini-…`, 2026-06-07).
- Base de produto: `docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md` (não substitui;
  apenas refina a camada de UI/UX da ferramenta pessoal).

> Documento aprovado pelo dono via brainstorming visual em 2026-06-07.
> Não sobrepõe `AGENTS.md` nem `PLANO.md`. O Codex implementa exatamente o escrito;
> diante de ambiguidade ou contrato de API divergente, PARA e pergunta, nunca adivinha.

---

## 1. Objetivo

Deixar a ferramenta pessoal **clara, calma e bem-acabada no celular** (mobile-first), corrigindo os
problemas estruturais de UX que as três IAs apontaram em consenso, sem migrar para biblioteca de UI
completa e sem ferir as regras inquebráveis do projeto.

A pergunta que guia o trabalho: *o que deixa o app mais claro e agradável para o dono estudar todos
os dias, com o menor custo de manutenção?*

## 2. Regras inquebráveis (herdadas, reafirmadas)

- Sem tabuleiro próprio, sem engine, sem ajuda durante partida ao vivo.
- Sem scraping de Lichess/Chess.com; só APIs oficiais já em uso.
- Sem copiar código/assets/taxonomia de app pago anterior; ChessKing nunca é fonte nem dependência.
- P4 (sync/backend) e P5 (comunidade) permanecem **congeladas**.
- App é pessoal primeiro; não exige validação de mercado para melhorar a própria UI.

## 3. Decisões tomadas no brainstorming

| Tema | Decisão | Motivo |
|---|---|---|
| Biblioteca de UI completa (Mantine/MUI/Chakra/shadcn+Tailwind) | **Rejeitada** | Consenso unânime das 3 IAs; peso, lock-in visual e custo de migração não se justificam. |
| Layout da tela Hoje | **Coluna única reordenada** (opção A), sem duas colunas no desktop | Dono usa mais no celular; no mobile A e B são idênticos, então o esforço de Grid de 2 colunas não paga. |
| Card de treino | **Fluxo em duas etapas**, com avaliação **obrigatória** | Reduz 6 ações para o essencial; avaliação obrigatória mantém o sinal pedagógico (ajuste de plano / score de fraquezas). |
| Confirmação destrutiva | Manter `window.confirm` neste round | Radix adiado (voto 2/3 das IAs por esperar). |
| Dependências novas | **Adotar `sonner` + `lucide-react`**; nada além disso | Resolvem feedback e iconografia com custo quase nulo; leves, MIT/ISC, compatíveis com React 19. |

## 4. Escopo deste round (polish pass)

### 4.1 Tela "Hoje" — reordenar (`src/ui/Today.tsx`, `src/index.css`)

Nova ordem, de cima para baixo:

1. **Cabeçalho compacto** — data · nº de sessões · minutos · foco semanal (peso visual menor).
2. **🎯 Treino de agora** — o bloco atual/próximo pendente, como âncora visual da tela.
3. **Próxima sessão** + seletor de tempo.
4. **Próximos passos** (roadmap).
5. **Diagnóstico** — os 4 botões (Chess.com, Lichess, reconciliar puzzles, gerar Study) movidos para
   um `<details>` **fechado por padrão**, abaixo do treino.

- Largura permanece estreita (painel ~560px atual). **Sem** layout de duas colunas no desktop.
- Chips de fraquezas permanecem próximos ao contexto do treino.

Critério de aceite: em 390×844, o primeiro `Abrir no Lichess` aparece na primeira dobra ou muito
perto dela; os 4 botões de diagnóstico não aparecem antes do treino.

### 4.2 Card de bloco — fluxo em duas etapas (`src/ui/Today.tsx`, testes)

- **Estado padrão (pendente):** `Abrir no Lichess` (ação primária) → `Concluir` → link discreto `Pular`.
- **Após `Concluir`:** o rodapé do card vira "Como foi o treino?" com `Fácil` / `Bom` / `Difícil`
  e um `Voltar`.
- **Avaliação obrigatória:** escolher uma dificuldade é o que conclui o bloco (com o comportamento
  atual de log/ajuste). `Voltar` cancela e volta ao estado padrão. Não há conclusão neutra.
- **Estado concluído:** mantém o comportamento seguro atual — ações somem, fica só `Abrir de novo`.
- `Pular` continua um link simples, sem pedir motivo (pular-com-motivo está fora de escopo).

Critério de aceite: o card pendente mostra no máximo 1 ação primária + 1 secundária + 1 link; as três
avaliações só aparecem após `Concluir`; concluir sem escolher dificuldade é impossível.

### 4.3 Tela "Configuração" — três seções (`src/ui/Config.tsx`, `src/index.css`)

Ordem e agrupamento:

1. **Essencial** — usuário Lichess, usuário Chess.com (marcado opcional), faixa, tempo padrão, `Salvar`.
2. **Lichess (opcional)** — conectar/remover OAuth, com a linha curta:
   "Conectar habilita reconciliar puzzles e criar o Study do dia. O backup não inclui o token."
3. **Dados locais** — `Exportar backup`, `Adicionar sinais manuais`, e `Apagar tudo` numa **zona de
   perigo** visualmente destacada. `Apagar tudo` mantém `window.confirm`.

Critério de aceite: primeiro uso separa visualmente o essencial do administrativo; "Apagar tudo" fica
isolado na zona de perigo.

### 4.4 Acessibilidade e acabamento (CSS, sem dependência) (`src/index.css`)

- `:focus-visible` consistente: anel de 2px na cor primária (`#1f3f36`) com `outline-offset`, em
  botões, links, inputs e selects.
- Corrigir `button:disabled`: `cursor: not-allowed` (não `wait`); reservar classe `.is-loading` para
  carregamento real assíncrono.
- Alvo de toque no mobile: `min-height: 44px` nos botões.
- Microcopy PT-BR **com acentos**: `Configuração`, `sessão`, `próxima`, `fácil`, `difícil`, etc.

### 4.5 Feedback e ícones (`sonner`, `lucide-react`)

- **`sonner`:** `<Toaster />` montado em `src/ui/App.tsx`. Toasts apenas para sucesso não crítico:
  "Configuração salva", backup exportado, diagnóstico concluído. **Erros críticos continuam inline**
  (falhas de OAuth, falha de carga, falha de API) — não podem auto-desaparecer antes de serem lidos.
- **`lucide-react`:** uso **contido**, só onde ajuda a escanear: navegação (Hoje/Config), seta de
  link externo em "Abrir no Lichess", refresh no diagnóstico, check em "Concluir", lixeira em
  "Apagar tudo". Ícones com `aria-hidden="true"`; o texto do botão segue sendo o nome acessível.

## 5. Fora de escopo (adiado, nomeado para depois)

Não implementar agora; pode virar round futuro:

- Layout de duas colunas no desktop.
- `Pular` com motivo curto.
- Anotação curta pós-treino (exige novo tipo/storage).
- Banner de offline (`navigator.onLine`).
- Disclaimer "app não oficial".
- Radix (ou outra primitive) para diálogos acessíveis.
- Tela "Progresso" dedicada e biblioteca de gráficos (Recharts).
- Testes visuais/acessibilidade automatizados (Playwright + `@axe-core/playwright`).

## 6. Verificação

- `npm run lint` verde.
- `npm run test` verde — testes React existentes atualizados para o novo fluxo do card
  (as queries de `src/app/trainingFlow.test.tsx` e `src/smoke.test.tsx` mudam: as avaliações deixam
  de estar visíveis no estado pendente e passam a aparecer após `Concluir`).
- `npm run build` verde (confirmar que `sonner`/`lucide-react` não quebram peers de React 19).
- Conferência visual manual em 390×844 e 1280×800.

## 7. Critério de abandono

- Se reorganizar `Today.tsx` exigir construir diálogo/popover/select customizado complexo, PARA e
  reavalia adotar uma primitive acessível (Radix/Ariakit) num round próprio.
- Se `sonner` ou `lucide-react` conflitarem com React 19.2.x, reverter para implementação local
  (status inline + ícones Unicode discretos).
