# Prompt: Auditoria UX/UI E Pesquisa De Bibliotecas Prontas

Use este prompt para uma rodada multi-IA de avaliacao completa do funcionamento, UX e UI do projeto
`lichess-tutor`.

## Identidade Da Rodada

Voce e uma IA revisora independente. Seu trabalho e avaliar o app atual como ferramenta pessoal,
simples, funcional e bem arrumada para estudo de xadrez no Lichess.

Antes de opinar, leia os arquivos locais:

- `AGENTS.md`
- `PLANO.md`
- `package.json`
- `docs/ux/product-flows.md`
- `docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md`
- `src/ui/App.tsx`
- `src/ui/Today.tsx`
- `src/ui/Config.tsx`
- `src/index.css`
- testes React relevantes em `src/app/*.test.tsx` e `src/smoke.test.tsx`

Se conseguir rodar o app, avalie tambem em browser real:

- desktop: 1280x800
- mobile: 390x844
- estados: primeiro uso, plano gerado, sem dados, com erro, offline quando possivel, treino ativo,
  bloco concluido, OAuth desconectado/conectado quando inferivel

## Regras Inquebraveis

Nao proponha nada que viole o projeto:

- Sem tabuleiro proprio.
- Sem engine.
- Sem ajuda durante partida ao vivo.
- Sem scraping de Lichess ou Chess.com.
- Sem Board API, Bot API, Challenge API, escopos de jogo ou mensagens.
- Sem copiar codigo, assets, textos, taxonomia ou conteudo do app pago anterior.
- ChessKing nunca e fonte nem dependencia.
- P4 sync/backend e P5 comunidade/renomeacao estao congeladas; voce pode apontar riscos futuros, mas
  nao deve transformar isso em recomendacao de implementacao agora.
- O app e pessoal primeiro. Nao exija validacao de mercado para melhorar UX/UI da ferramenta pessoal.

## Objetivo Da Avaliacao

Queremos uma UI simples e funcional, mas bem arrumada. A pergunta central nao e "qual biblioteca esta
na moda?", e sim:

> O que deixa o app mais claro, confiavel e agradavel para o dono estudar todos os dias, com o menor
> custo de manutencao e sem ferir as regras do projeto?

Avalie:

- clareza do fluxo `Config -> Hoje -> abrir Lichess -> timer/log -> feedback -> proxima sessao`;
- hierarquia visual da tela Hoje;
- excesso ou falta de botoes;
- linguagem PT-BR adulta, pratica, sem infantilizar;
- estados de carregamento, erro, offline, sucesso e vazio;
- mobile first: toque, quebra de texto, densidade, botoes, scroll e foco;
- acessibilidade: nomes acessiveis, contraste, foco, teclado, semantica, `aria-live`;
- privacidade: token, usernames, backup, apagar dados, mensagens que podem expor informacao sensivel;
- confirmacoes destrutivas, toasts, banners e feedback;
- necessidade real de iconografia;
- se a tela deve continuar estreita e densa ou ganhar layout responsivo mais amplo no desktop;
- se o app precisa de uma tela "Progresso" agora ou apenas reorganizar o que existe.

## Pesquisa Obrigatoria

Faca pesquisa web atualizada e cite links. Prefira documentacao oficial, GitHub oficial e npm para
licenca/compatibilidade; use Reddit/comunidade apenas como sinal fraco, nunca como contrato.

Pesquise, no minimo, estas frentes:

- Radix UI Primitives: Dialog, Alert Dialog, Tabs, Select, Tooltip, Visually Hidden.
- React Aria Components: acessibilidade, mobile/touch, forms, select/dialog.
- Ariakit ou Headless UI como alternativas headless.
- shadcn/ui: Vite, Tailwind, ownership do codigo, blocks, custo de migracao.
- Mantine: biblioteca completa, componentes prontos, hooks, notificacoes/modals/forms.
- MUI e Chakra: comparar como opcoes completas, mesmo que a conclusao seja rejeitar por peso/estilo.
- Sonner ou alternativa de toast.
- lucide-react ou outra biblioteca de icones.
- Recharts, Tremor ou alternativa para uma futura tela de progresso.
- Open Props, Pico CSS ou outro caminho de tokens/CSS pronto sem trocar a arquitetura.
- Playwright screenshots/visual regression, `@axe-core/playwright`, Testing Library `user-event` e
  Lighthouse/user flows para avaliar UX sem fazer ferramenta propria.

Para cada candidato, cheque:

- licenca;
- maturidade e manutencao;
- compatibilidade com React 19, Vite e TypeScript estrito;
- impacto no bundle e no CSS;
- risco de lock-in visual;
- o quanto economiza trabalho de verdade;
- se exige Tailwind, CSS-in-JS, provider global ou refatoracao grande;
- acessibilidade pronta versus responsabilidade que ainda fica no app;
- se combina com uma ferramenta pessoal local-first.

Nao limite sua pesquisa aos nomes acima. Traga tambem alternativas melhores se encontrar.

## Hipoteses A Debater

Debata explicitamente estas teses, com defesa e ataque:

1. **CSS proprio + primitives pontuais**: manter a UI atual, melhorar design tokens e usar Radix/React
   Aria/Ariakit apenas para dialog, tabs/select, tooltip e talvez alert dialog.
2. **shadcn/ui seletivo**: adotar Tailwind e copiar poucos componentes/blocos, ganhando acabamento rapido
   mas assumindo migracao de estilo.
3. **Mantine completo**: trocar para uma biblioteca pronta, ganhando polish e componentes, mas aceitando
   mais peso e uma identidade visual de biblioteca.
4. **Sem nova biblioteca de UI**: resolver com HTML semantico, CSS atual melhorado, `lucide-react`,
   Sonner e testes de acessibilidade/visual.
5. **Biblioteca de dashboard/graficos**: adotar agora ou deixar para uma tela Progresso futura.

Inclua pelo menos tres vozes no debate:

- Minimalista: defende menor dependencia e CSS local.
- Acelerador: defende reaproveitar componentes prontos da comunidade.
- Guardiao do projeto: filtra por clean-room, privacidade, PWA, acessibilidade e regras inquebraveis.

Finalize com uma sintese: onde houve consenso, onde houve divergencia e qual recomendacao voce assinaria.

## Formato Do Relatorio

Crie um arquivo Markdown com seu proprio nome nesta pasta:

`docs/review/ux-ui-community-audit/relatorio-NOME-DA-IA-ux-ui-comunidade-2026-06-07.md`

Exemplos:

- `docs/review/ux-ui-community-audit/relatorio-codex-ux-ui-comunidade-2026-06-07.md`
- `docs/review/ux-ui-community-audit/relatorio-claude-ux-ui-comunidade-2026-06-07.md`
- `docs/review/ux-ui-community-audit/relatorio-gemini-ux-ui-comunidade-2026-06-07.md`
- `docs/review/ux-ui-community-audit/relatorio-deepseek-ux-ui-comunidade-2026-06-07.md`

Se voce nao tiver acesso ao filesystem, devolva o relatorio completo em Markdown e informe exatamente
qual nome de arquivo deve ser usado.

## Estrutura Obrigatoria Do Relatorio

Use esta estrutura:

1. `Resumo executivo`
   - 5 a 10 bullets objetivos.
   - Diga se a UI atual esta aceitavel, confusa, pesada, incompleta ou promissora.

2. `Mapa do funcionamento atual`
   - Descreva as telas e fluxos reais encontrados no codigo.
   - Aponte onde o fluxo bate ou diverge de `docs/ux/product-flows.md`.

3. `Auditoria UX/UI`
   - Heuristicas: clareza, hierarquia, feedback, recuperacao de erro, consistencia, mobile, acessibilidade.
   - Cite arquivos/linhas quando possivel.

4. `Problemas prioritarios`
   - Tabela com: severidade, problema, evidencia, impacto, correcao recomendada, risco.
   - Separe bugs funcionais de polish visual.

5. `O que melhorar sem biblioteca nova`
   - Lista curta de mudancas CSS/HTML/React locais.
   - Foque em simplicidade, densidade, estado visual e mobile.

6. `Pesquisa de coisas prontas da comunidade`
   - Matriz com: pacote, uso no app, licenca, compatibilidade, maturidade, custo, beneficio, risco,
     recomendacao (`adotar agora`, `testar em spike`, `deixar para depois`, `rejeitar`).

7. `Debate`
   - Traga as vozes Minimalista, Acelerador e Guardiao do projeto.
   - Para cada tese, escreva a melhor defesa e a melhor objecao.
   - Termine com seu voto final.

8. `Plano recomendado`
   - 3 trilhas possiveis:
     - `Trilha conservadora`
     - `Trilha acelerada`
     - `Trilha experimental`
   - Cada trilha deve conter passos, arquivos provaveis, verificacoes e criterio de abandono.

9. `Backlog pronto para Codex`
   - Itens pequenos, atomicos, verificaveis.
   - Cada item deve ter: objetivo, arquivos provaveis, criterio de aceite, comandos de verificacao.
   - Nao proponha implementar P4/P5.

10. `Fontes`
    - Links, data de acesso e uma frase dizendo o que cada fonte confirmou.

## Criterio De Qualidade

Um bom relatorio deve:

- ser pratico, nao decorativo;
- separar "queremos" de "precisamos";
- apontar melhorias que cabem numa ferramenta pessoal;
- recusar dependencias bonitas mas desnecessarias;
- defender alguma biblioteca pronta quando ela realmente evita trabalho dificil, como dialog acessivel,
  select customizado, tooltip, toast, teste visual ou acessibilidade automatizada;
- transformar opiniao em matriz comparavel para debate com outras IAs.
