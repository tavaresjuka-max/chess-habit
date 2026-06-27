# Progresso

## Planejamento

- [x] Escopo definido (ferramenta pessoal Lichess-first, adaptativa).
- [x] Separacao do app pago anterior (clean-room reafirmado).
- [x] Modelo gratuito/aberto definido.
- [x] Auditoria estrategica por outras IAs — concluida.
- [x] Revisao do spec unificado por tres IAs — concluida; correcoes aceitas.
- [x] Decisao do dono: moldura **pessoal primeiro, comunidade depois**.
- [x] Spec de execucao escrito (`2026-06-06-rotina-pessoal-adaptativa-design.md`).
- [x] Regras e docs atualizados (AGENTS, PLANO, decisions, state, ADRs).
- [x] Rodada 2 de revisao (Codex, Antigravity, DeepSeek) — convergiu; zero P0 de governanca; aprovado com correcoes.
- [x] Correcoes de consenso aplicadas no spec (Adendo 22).
- [x] Plano de execucao P0 escrito (`docs/superpowers/plans/2026-06-06-plano-execucao-P0.md`).
- [x] Executar P0 (scaffold + dominio + plano fixo + PWA minimo) — concluida.
  - [x] Tarefa 1: scaffold Vite limpo.
  - [x] Tarefa 2: estrutura de camadas e regra de isolamento do dominio.
  - [x] Tarefa 3: tipos do dominio.
  - [x] Tarefa 4: allowlist estatica de destinos Lichess.
  - [x] Tarefa 5: time budget + gerador de plano fixo.
  - [x] Tarefa 6: persistencia local com Dexie.
  - [x] Tarefa 7: UI minima Hoje + Config.
  - [x] Tarefa 8: PWA minimo.
  - [x] Tarefa 9: gate final e privacidade.

## Fases De Codigo

- [x] **P0** Scaffold limpo + dominio tipado (Signal/Weakness/Plan) + gerador sensivel a tempo.
- [x] **P1** Chess.com diagnostico primario + detector de fraquezas + plano adaptado.
  - [x] Detector puro `Signal[] -> Weakness[]`.
  - [x] Gerador de plano prioriza fraqueza real e cai para tema conservador sem dados suficientes.
  - [x] Cliente Chess.com PubAPI read-only (`stats`, `games/archives`, arquivos mensais), serial.
  - [x] Cache mensal guarda apenas sinais derivados; PGN completo nunca e persistido.
  - [x] UI atualiza diagnostico Chess.com e importa sinais manuais genericos confirmados pelo dono.
- [x] **P2** Loop de valor: feedback facil/dificil + regen + tema semanal + Lichess secundario.
  - [x] Timer/log local ao abrir treino no Lichess.
  - [x] Aviso sonoro/visual ao atingir tempo combinado, sem bloquear continuar treinando.
  - [x] Concluir salva tempo real treinado e preserva `done`.
  - [x] Cliente/parser oficial preparado para `/api/puzzle/activity` com OAuth `puzzle:read`.
  - [x] Blocos de principios de abertura abrem uma aula concreta de principios de abertura em vez de Learn/explorador/filtro genericos.
  - [x] Catalogo Lichess tipado criado para recomendar Practice guiado, temas de puzzle, modos e filtros de video por fraqueza.
  - [x] Sintese da pasta `LEARN CHESS` aplicada em playbook de planos de estudo Lichess com guarda clean-room.
  - [x] Blocos de plano carregam `weeklyFocus`, `weaknessTag` e `resourceStage` para escolher Practice/video, puzzle theme ou Analysis conforme estagio.
  - [x] Feedback `easy`/`good`/`hard` salvo no bloco/log local e usado ao regenerar plano: facil avanca para repeticao, bom sai de licao guiada estatica para puzzles variados, dificil volta para explicacao.
  - [x] Roadmap local de proximos passos e sessao extra no mesmo dia quando sobrar tempo.
  - [x] OAuth/token local para reconciliar resultado real de puzzles.
  - [x] Lichess diagnostico secundario.
- [x] **P3** OAuth PKCE opt-in + gerador de Study Lichess privado/unlisted.
  - [x] OAuth Authorization Code Flow with PKCE em cliente local, com `puzzle:read` e `study:write`.
  - [x] Token salvo somente no IndexedDB local e omitido do backup JSON.
  - [x] Reconciliacao manual e oportunista de resultado real de puzzles via `/api/puzzle/activity`.
  - [x] Geracao de Study privado do dia via `POST /api/study` + import PGN transiente em capitulos.
- [x] **Estabilizacao pos caca-bug remanescente (2026-06-07)**.
  - [x] Bloco `done` nao mostra mais `Concluir`/feedback/`Pular`; fica apenas reabertura.
  - [x] `Abrir no Lichess` virou link real com `target="_blank"` e inicia log/timer no clique.
  - [x] Token OAuth expirado e removido do IndexedDB ao carregar.
  - [x] Cobertura React adicionada para fluxo de treino, feedback `easy/good/hard`, Study sem OAuth e NDJSON quebrado.
  - [x] Configuracao PWA exportada e coberta por smoke unitario; build gera `sw.js` e manifest.
  - [x] `state.ts` refatorado para modulos de data, erro, OAuth, abertura externa e logs de treino.
  - [x] Limite mitigado em 2026-06-09: links externos agora aguardam salvar o log local antes de abrir o Lichess; se nova aba for bloqueada, a navegacao na aba atual acontece depois da persistencia.
- [x] **Rodada UX/UI + pesquisa comunidade preparada (2026-06-07)**.
  - [x] Prompt multi-IA criado em `prompts/ux-ui-community-audit.md`.
  - [x] Pasta de relatorios designada em `docs/review/ux-ui-community-audit/`.
  - [x] Fontes de bibliotecas prontas, acessibilidade e teste visual registradas em `docs/research/sources.md`.
- [x] **Relatorio Codex da rodada UX/UI executado (2026-06-07)**.
  - [x] Relatorio salvo em `docs/review/ux-ui-community-audit/relatorio-codex-ux-ui-comunidade-2026-06-07.md`.
  - [x] Capturas Playwright desktop/mobile geradas em `output/playwright/`.
  - [x] Pesquisa complementar de licencas, peers e maturidade registrada em `docs/research/sources.md`.
- [x] **Polish UX/UI implementado e fechado (2026-06-07/2026-06-08)**.
  - [x] Plano de execucao `docs/superpowers/plans/2026-06-07-polish-ux-ui.md` marcado como concluido.
  - [x] `sonner` e `lucide-react` adotados de forma contida; sem framework UI completo.
  - [x] Tela Hoje reorganizada com treino primeiro, diagnostico recolhido, card de treino em duas etapas e avaliacao obrigatoria.
  - [x] Config reorganizada em Essencial, Lichess opcional e Dados locais; feedback local por toast.
  - [x] Acessibilidade/polish CSS: foco visivel, cursor disabled correto, alvo mobile de 44px e microcopy PT-BR acentuada.
  - [x] Gate final reexecutado: `npm run lint`, `npm run test` e `npm run build` verdes.
  - [x] Checagem visual final Playwright em 1280x800 e 390x844; capturas `ux-polish-final-*-2026-06-08.png` salvas em `output/playwright/`.
- [x] **Ajuste pos-uso real: revisao/transferencia sem Analysis generico (2026-06-08)**.
  - [x] Blocos de revisao curta herdam o tema do dia em vez de virar `conversion` generico.
  - [x] Estagios `review`/`transfer` preferem treino concreto de tema antes de `https://lichess.org/analysis`.
  - [x] Planos antigos com `Revisao curta` + `/analysis` sao normalizados para o foco semanal quando carregados.
  - [x] Regressao coberta por testes de destino, gerador de plano, normalizacao e roadmap.
- [x] **Ajuste pos-uso real: evitar repetir a mesma licao guiada de garfos (2026-06-08)**.
  - [x] Plano de um novo dia usa o plano anterior salvo como memoria de progresso pedagogico.
  - [x] Feedback `good` em estagio `guided` agora avanca para `retrieval`, abrindo puzzle theme variado (`/training/fork`) em vez do mesmo Practice estatico.
  - [x] Plano ja salvo no dia tambem pode ser reparado ao carregar, preservando status/feedback existentes.
  - [x] Regressao coberta por testes de gerador, storage e fluxo React com IndexedDB isolado.
- [x] **Professor Lemos Etapa 1: envelope de sessao na tela Hoje (2026-06-08)**.
  - [x] Tipos `Consistency`, `CoachMessage`, `Diagnosis` e `PuzzleThemeStats` adicionados ao dominio.
  - [x] `computeConsistency` calcula sequencia atual, maior sequencia, dias desde ultimo treino e retorno apos ausencia.
  - [x] `diagnose` so afirma causa quando fraqueza primaria tem score/confidence suficientes e tag mapeada; caso contrario pergunta.
  - [x] `buildSessionMessage` cobre abertura, retorno e fechamento por feedback, com banlist testada.
  - [x] `TutorCard` renderizado em Hoje logo apos o cabecalho, com estado pre e pos-treino.
  - [x] Gate final verde: `npm run test`, `npm run lint`, `npm run build`; Browser validado em 1280x720 e 375x812 sem overflow horizontal.
- [x] **Ajuste pos-uso real: remover filtros genericos de video Lichess (2026-06-08)**.
  - [x] `video-filter` removido do catalogo de recursos recomendaveis.
  - [x] Video de abertura usa rota direta `/video/gpsZAim-mYc`.
  - [x] Feedback `hard` em garfos/taticas volta para Practice concreto em vez de `/video?tags=beginner%2Ftactics`.
  - [x] Normalizador repara planos antigos com `/video?tags=...` quando ha `weaknessTag`.
  - [x] Regressao coberta por testes de catalogo, destinos, gerador, normalizador e fluxo React.
- [x] **Professor Lemos Etapa 2A: personalizacao honesta e anti-repeticao (2026-06-08)**.
  - [x] Plano executavel criado em `docs/superpowers/plans/2026-06-08-professor-lemos-tutor-etapa2a.md`.
  - [x] `TutorCard` explicita fallback quando ainda faltam sinais reais suficientes.
  - [x] Blocos concluidos nao sao mais reescritos por regeneracao; viram historico do que foi feito.
  - [x] Adaptacao por feedback aparece na proxima sessao; depois de `hard` em explicacao, o tema troca para `retrieval` variado.
  - [x] `summarizePuzzleActivity` salva `themeStats`, e `diagnose` usa tema de puzzle quando ha volume claro.
  - [x] Pergunta do Lemos virou acao: `Tempo`, `Calculo` e `Peca solta` registram sinal manual local sem apagar sinais anteriores.
  - [x] Card do Lemos oferece `Conferir puzzles` quando ha bloco de puzzle concluido sem resultado real reconciliado.
  - [x] Fonte oficial Lichess `api-puzzle-activity` registrada em `docs/research/sources.md`.
  - [x] Gate final verde: `npm run test`, `npm run lint`, `npm run build`; Browser smoke confirmou card de fallback, pergunta acionavel e sem overflow horizontal.
- [x] **Curadoria Lichess profunda e auditoria de qualidade (2026-06-08)**:
  - [x] Relatório completo assinado por Antigravity salvo em `docs/research/relatorio-antigravity-curadoria-lichess-professor-lemos-2026-06-08.md`.
  - [x] Auditoria de links e verificação de copyright (descarte de estudos piratas e IDs inválidos).
  - [x] Catalogação de novas fontes de alta qualidade (NoseKnowsAll Endgames, jomega TOC e atualizações).
  - [x] Registro das fontes complementares em `docs/research/sources.md`.
- [x] **Professor Lemos Etapa 2B: catalogo curado e ranking de recursos Lichess (implementada em 2026-06-08)**.
  - [x] Plano de implantacao final criado em `docs/superpowers/plans/2026-06-08-professor-lemos-tutor-etapa2b-catalogo-curado.md`.
  - [x] Enriquecer o catalogo Lichess com metadados de qualidade, idioma, risco de direitos, status de revisao e OAuth.
  - [x] Adicionar videos diretos especificos da biblioteca Lichess; manter proibicao de filtros genericos `/video?tags=...`.
  - [x] Adicionar estudos comunitarios seguros somente como reforco e manter rejeitados fora do catalogo ativo.
  - [x] Ajustar ranking por estagio para evitar Analysis generico e priorizar Practice, puzzle themes, ferramentas e videos concretos.
  - [x] Rodar gate final: `npm run lint`, `npm run test`, `npm run build` e smoke visual desktop/mobile.
- [x] **Catalogo Premium Lichess do Professor Lemos (implementado em 2026-06-08)**.
  - [x] Adicionar `CatalogSkillNode` e mapeamento de sub-habilidades por fraqueza, tema oficial, faixa, estagio e tempo.
  - [x] Criar `selectLichessResource` com ranking por contexto, erros recentes e anti-repeticao, preservando `getDestinationForWeakness`.
  - [x] Implementar Puzzle Dashboard e Puzzle Replay oficiais com OAuth `puzzle:read`, 429 como `LichessRateLimitError` e sem persistir IDs/PGN/solucoes.
  - [x] Conectar `PuzzleThemeStats` de Activity/Dashboard/Replay ao gerador de plano e ao fluxo `Conferir puzzles`.
  - [x] Adicionar campos de auditoria de catalogo: `lastLinkCheckStatus`, `replacementResourceId`, `reviewCadenceDays`.
  - [x] Revalidar fontes oficiais em `docs/research/sources.md`.
  - [x] Gate final: `npm run lint`, `npm run test` (181 testes), `npm run build`; smoke Browser/Playwright salvo em `output/playwright/premium-catalog-*-2026-06-08.png`.
- [x] **Ajuste pos-uso real: fechamento do dia na tela Hoje (2026-06-08)**.
  - [x] `buildDayCompletionSummary` resume plano/logs/roadmap sem rede nova e sem dados sensiveis.
  - [x] Hoje renderiza cartao de fechamento depois do Professor Lemos quando todos os blocos saem de `pending`.
  - [x] Resumo mostra blocos feitos, minutos, feedback, puzzles reconciliados ou aviso de placar pendente, e proxima sessao.
  - [x] Plural do placar curto do Professor Lemos corrigido (`1 errado`, `2 errados`).
  - [x] Gate final: `npm run lint`, `npm run test` (185 testes), `npm run build`; Browser desktop e Playwright CLI mobile validados sem overflow aparente.
- [x] **Estabilizacao final da fase pessoal pos-P3 (2026-06-09)**.
  - [x] Abertura externa do Lichess passou a salvar/aguardar o log de treino antes de chamar `window.open`.
  - [x] Fechamento do dia cobre tambem planos totalmente pulados, sem inventar placar de puzzle para bloco pulado.
  - [x] Varredura estatica sem `TODO`, `FIXME`, `console.log`, `debugger`, `ts-ignore`, `unknown as` ou `as never` em `src/public`.
  - [x] P4/P5 permanecem congeladas; nenhuma API, backend, engine, Board/Bot/Challenge API ou escopo novo foi aberto.
- [x] **Ajuste pos-uso real: garfos sem repetir Practice fixo (2026-06-09)**.
  - [x] Revalidado no Lichess que `Fork` existe como tema variado de puzzles em `/training/fork`.
  - [x] Gerador agora trata aula guiada anterior sem feedback como exposicao suficiente para avancar a `retrieval`.
  - [x] Plano de hoje repara destino repetido: se ontem havia `The Fork` pendente/sem feedback, hoje abre `Puzzles Lichess: Fork`.
  - [x] Regressao coberta em dominio puro e fluxo React/Dexie.
- [x] **Ajuste pedagogico: introducao simples para garfos guiados (2026-06-09)**.
  - [x] Nota contextual do Professor Lemos explica o que e garfo e por que treinar o padrao.
  - [x] Texto cita garfos com cavalo, bispo, peao e dama e prepara o aluno para ver o padrao com antecedencia.
  - [x] Introducao entra no bloco principal de garfos, tanto em aula guiada quanto em puzzles variados, e no Study do dia; sem rede nova, sem conteudo copiado e sem tabuleiro proprio.
- [x] **Ajuste pedagogico: saudacao no aquecimento (2026-06-09)**.
  - [x] Bloco de aquecimento agora abre com saudacao simples do Professor Lemos e convite para ativar o cerebro.
  - [x] Texto reforca que aquecimento nao e prova de velocidade: olhar o tabuleiro inteiro, procurar pecas soltas e seguir com calma.
  - [x] Regressao coberta por teste de geracao de plano de 30 minutos, onde o aquecimento aparece como bloco proprio.
- [x] **Correcao pos-uso real: abertura Lichess sem duplicar abas (2026-06-09)**.
  - [x] Botao `Abrir no Lichess` nao usa mais fallback automatico para navegar a aba atual quando a nova aba retorna `null`.
  - [x] Tela do Lemos permanece aberta; se popup for bloqueado, o app mostra aviso local apos salvar o log.
  - [x] Plano salvo antigo com bloco guiado ja aberto localmente e reparado para puzzles variados de garfos (`/training/fork`).
  - [x] Regressao coberta por testes de fluxo React/Dexie e gerador de plano.
- [x] **Ajuste pedagogico: proposta de fase antes do treino (2026-06-09)**.
  - [x] Professor Lemos mostra uma proposta de primeira fase antes dos blocos de treino.
  - [x] Proposta inclui foco, itens de estudo, estimativa de horas/sessoes, ritmo por tempo escolhido e checkpoint de reavaliacao.
  - [x] Usuario pode aprovar o plano ou pedir revisao com nota livre e sugestoes como mais exercicios, mais partidas e sessoes de 30 min.
  - [x] Resposta fica no plano local do dia e e preservada quando o plano e regenerado no mesmo dia.
- [x] **Ajuste metodologico: metas acumuladas da fase (2026-06-09)**.
  - [x] Dominio puro calcula progresso por sessoes e horas concluidas a partir dos logs locais.
  - [x] Checkpoints definidos em 6h e 12h, primeiro ciclo em 24h e ciclos seguintes de 24h.
  - [x] Tela Hoje mostra meta atual, proximos marcos e estatisticas de sessoes, horas, blocos e puzzles reconciliados.
  - [x] Historico completo de logs e carregado para metas acumuladas; plano do dia continua usando apenas logs do dia.
  - [x] Logs diagnosticos do Lichess entram nas estatisticas de puzzles, mas nao contam como sessao/hora treinada.
- [x] **Ajuste metodologico: metodo explicito do Professor Lemos (2026-06-09)**.
  - [x] Documento canonico criado em `docs/pedagogy/metodo-professor-lemos.md`.
  - [x] Proposta de fase mostra resumo do metodo, confianca da evidencia e criterios de progresso.
  - [x] Card de metas mostra sinais separados de habito e habilidade, alem do proximo sinal a medir.
  - [x] Fontes pedagogicas e limites de comprovacao registrados em `docs/research/sources.md`.
  - [x] Sem nova API, backend, engine, scraping, escopo OAuth, P4/P5 ou dado sensivel novo.
- [x] **Biblioteca de literatura de xadrez - lote-semente (2026-06-09)**.
  - [x] Fase 1 aberta em `docs/research/chess-literature/` com plano, fontes abertas e lista inicial de compra.
  - [x] Lote-semente baixou 10 itens validos: 6 Internet Archive/Gutenberg, 1 Project Gutenberg direto e 3 artigos OpenAlex/OA sobre educacao de xadrez.
  - [x] Dois itens IA foram removidos porque eram metadados/headers, nao livros.
  - [x] Manifesto em `docs/research/chess-literature/manifests/phase1-downloads.jsonl`; relatorio em `docs/research/chess-literature/phase1-seed-report.md`.
- [x] **Pesquisa profunda de literatura — 5 frentes (2026-06-09)**.
  - [x] Frente 1: Catalogo de downloads legais — 85+ itens catalogados em `docs/research/open_download_candidates.md`.
  - [x] Frente 2: Evidencia academica — 24 estudos em `docs/research/academic_evidence.md`.
  - [x] Frente 3: Mapa de metodos — 17 metodos mapeados em `docs/research/curriculum_map.md`.
  - [x] Frente 4: Lista de compra — 60+ itens precificados em `docs/research/paid_buylist.md`.
  - [x] Frente 5: Sintese para metodo proprio — 10 principios, 8 anti-padroes, templates. Documentado em `docs/research/method_synthesis.md`.
- [x] **Download seletivo da biblioteca (2026-06-09)**.
  - [x] 31 itens legais baixados e verificados com SHA-256 (IA: livros PD/CC + OpenAlex: artigos OA + Gutenberg: classicos).
  - [x] 8 itens removidos por copyright suspeito ou fora do escopo.
  - [x] Manifesto reconciliado em `docs/research/chess-literature/manifests/phase1-downloads.jsonl`.
- [x] **Analise do acervo pessoal ONDA 2 — DeepSeek (2026-06-09)**.
  - [x] 235 livros triados: 91 descartados, 144 com valor.
  - [x] 68 AZW/AZW3 em PT-BR descobertos em segunda varredura — dobra o material PT-BR.
  - [x] Documentos: `analise-acervo-ONDA2-DEEPSEEK.md` + `analise-acervo-ONDA2-DEEPSEEK-AZW.md`.
- [x] **Conversao de formatos ilegiveis (2026-06-09)**.
  - [x] Calibre 9.9.0 instalado. 67/68 AZW/AZW3/EPUB convertidos para TXT (1.8 MB). 1 corrompido.
  - [x] `.gitignore` atualizado para excluir `LIVROS XADREZ PARA CONSULTA/`.
- [x] **Analise dos convertidos — DeepSeek (2026-06-09)**.
  - [x] DAMP confirmado: Defesa/Alinhamento/Mobilidade/Promocao (Gemini errou).
  - [x] "Como montar treinamento" = GM Rafael Leitao (hexacampeao brasileiro).
  - [x] John C. Murray e autor de ~60 livros das colecoes "Escola"/"Passo a Passo".
  - [x] Documento `analise-convertidos-DEEPSEEK.md` com:
    - Correcao do significado de DAMP (checklist de deteccao tatica).
    - Time budgeting do Leitao (50% tatica, 20% finais, 15% abertura, 15% partidas para <1900).
    - Manual de Aberturas (Lazzarotto) como referencia PT-BR.
    - 2 novos drill_formats: DAMP-Scan, Time-Budget-Leitao.
    - 2 novos blocos: 600-1000-tatica-00 (DAMP-Scan), 0-1200-meta-01 (Time Budget).
    - Nota: 8.0/10. 3 contribuicoes de ALTO impacto. ~60 livros Murray sao redundantes.
- [x] **Plano pedagogico a partir do acervo baixado (2026-06-09)**.
  - [x] Leitura aplicada de Capablanca, Edward Lasker, manuais introdutorios, problemas de mate, finais, Morphy/Generalship e artigos open-access sobre educacao enxadristica.
  - [x] Documento criado em `docs/pedagogy/plano-pedagogico-acervo-baixado-2026-06-09.md`.
  - [x] Decidido que o acervo orienta sequenciamento e feedback, mas nao vira banco bruto de textos, diagramas, problemas ou variantes.
  - [x] Ordem pedagogica recomendada: fundamentos, seguranca material, mates/finais, calculo tatico, aberturas por principios, planejamento simples e transferencia para partidas encerradas.
  - [x] Registro das fontes complementares em `docs/research/sources.md`.
- [x] **Análise do Acervo ONDA 2 - GEMINI (2026-06-09)**:
  - [x] Leitura e indexação dos 235 novos livros (PDFs/Kindle) na pasta ONDA 2.
  - [x] Fichamento detalhado de livros nucleares (DAMP, Programação de Treinos de Lapertosa, Woodpecker, de la Villa, Aagaard, Ramesh, Hawkins).
  - [x] Elaboração do relatório de comparação pedagógica e deltas curriculares salvo como `analise-acervo-ONDA2-GEMINI.md`.
  - [x] Triagem de redundâncias (manuais genéricos) e definição de rituais de segurança (DAMP) em PT-BR para o Professor Lemos.
- [x] **Análise dos Livros Convertidos - GEMINI (2026-06-09)**:
  - [x] Leitura e análise dos ~66 livros convertidos em `.txt` na pasta `_convertidos`.
  - [x] Correção conceitual definitiva do acrônimo **DAMP** (Defesa, Alinhamento, Mobilidade, Promoção) como detecção tática, baseada no texto do livro real.
  - [x] Integração da rotina de estudos baseada em tempo (Time Budgeting) do GM Rafael Leitão.
  - [x] Elaboração e salvamento do relatório como `analise-convertidos-GEMINI.md`.
- [x] **Analise do Acervo ONDA 1 + ONDA 2 - CODEX (2026-06-09)**:
  - [x] Contagem real confirmada: 124 PDFs na Onda 1, 167 PDFs na Onda 2 e 68 e-books nao-PDF na Onda 2.
  - [x] Varredura tecnica com `pypdf`/`pdfplumber`: 250 PDFs com texto extraivel e 41 com OCR/texto fraco; nenhum texto bruto incorporado ao relatorio.
  - [x] Terceira voz independente salva em `analise-acervo-CODEX.md`, com fichas coletivas, curriculo, drill formats, blocos 0-1200, regras do gerador e avaliacao final.
  - [x] Divergencia registrada: DAMP e programacao de treinamento existem como e-books, mas precisam de leitura/conversao direta antes de virar evidencia forte independente.
- [x] **Analise dos Livros Convertidos - CODEX (2026-06-09)**:
  - [x] Manifesto e pasta `_convertidos` auditados: 68 processados, 1 falha, 67 saidas OK, 66 `.txt` unicos por colisao de nome em `Xadrez Vitorioso`.
  - [x] DAMP confirmado por leitura direta como Defesa/Alinhamento/Mobilidade/Promocao; encaixe corrigido para deteccao tatica, nao ritual de seguranca.
  - [x] Leitao, Movimento Forcado, Manual de Aberturas, Capablanca PT e colecoes "Jogue como" fichados como deltas clean-room.
  - [x] Relatorio salvo em `docs/research/analise-convertidos-CODEX.md`, com nota 8.1/10, concordancia/desempate, blocos 0-1200 e proximos passos de integracao.
- [x] **Integracao dos deltas verificados dos convertidos no metodo consolidado (2026-06-09)**.
  - [x] `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md` atualizado sem reescrever o documento-base.
  - [x] DAMP fixado como Defesa/Alinhamento/Mobilidade/Promocao sob tatica/deteccao, com `damp-scan` e bloco `600-1000-tatica-00`.
  - [x] Proporcao-base do Leitao absorvida nas regras do gerador sem usar rating como gate.
  - [x] Lazzarotto, Capablanca PT-BR e Movimento Forcado integrados com escopo limitado e lacunas remanescentes explicitadas.
- [x] **Pesquisa Codex das lacunas do Metodo Professor Lemos (2026-06-10)**.
  - [x] Terceiro vertice independente executado a partir de `prompts/archive/2026-06-method/codex-lacunas-pesquisa-recursos.md`.
  - [x] Relatorio salvo em `docs/research/relatorio-codex-lacunas-pesquisa-recursos.md`, focado em open source, datasets, tooling e evidencia tecnica/academica.
  - [x] Lichess Puzzle Database e Puzzle Themes classificados como fonte A para calculo/tatica e selecao por temas, rating, popularidade e comprimento.
  - [x] Lacunas sem resposta A direta registradas: defesa/profilaxia, porcentagem exata de dominio, timing preciso de abertura e proporcao revisao/novo.
  - [x] Fontes oficiais e academicas registradas em `docs/research/sources.md`.
- [x] **Análise dos PDFs Baixados + ONDA 3 - GEMINI (2026-06-10)**:
  - [x] Triagem e classificação de 67 novos arquivos (31 do lote-downloads e 36 da Onda 3) em tabelas de inventário e triagem.
  - [x] Fichamento pedagógico individual de 8 documentos de alta prioridade (A) e coletivo de 4 grupos (B, C e D).
  - [x] Descoberta da correlação científica ($r=0.29$) sobre reflexão de tarefas falhadas (Gevorgyan 2024) e do método "Tratamento de Pendências" (Christofoletti 2007) para estudantes intermediários.
  - [x] Integração da estrutura de milestones locais baseada em "Diplomas" (Peão, Torre, Rei) de Tirado & Silva (1999).
  - [x] Salvamento do relatório como [analise-pdfs-baixados-onda3-GEMINI.md](docs/research/analise-pdfs-baixados-onda3-GEMINI.md) em `docs/research/`.
- [x] **Analise dos PDFs Baixados + ONDA 3 - CODEX (2026-06-10)**.
  - [x] Inventario tecnico de 75 itens: 39 em `output/chess-literature-library/files/` e 36 na pasta `onda 3 livros xadrez`.
  - [x] PDFs mapeados: 31 do lote DeepSeek-downloads e 30 da Onda 3; 1 PDF corrompido/ilegivel identificado.
  - [x] Relatorio salvo em `docs/research/analise-pdfs-baixados-onda3-CODEX.md`.
  - [x] Veredito: Onda 3 melhora defesa/profilaxia, calculo-ponte 800-1200 e abertura por principios, mas tem alto risco legal como fonte direta.
  - [x] Recomendacao: integrar apenas abstracoes originais e confirmar execucao via Lichess/fontes limpas; nao copiar exercicios, comentarios, FEN/PGN, diagramas ou variantes.
- [x] **Analise Diretora dos PDFs Baixados + ONDA 3 (2026-06-10)**.
  - [x] Relatorios `docs/research/analise-pdfs-baixados-onda3-DEEPSEEK.md`, `docs/research/analise-pdfs-baixados-onda3-GEMINI.md` e `docs/research/analise-pdfs-baixados-onda3-CODEX.md` comparados.
  - [x] Consolidado salvo em `docs/research/analise-pdfs-baixados-onda3-DIRETOR.md`.
  - [x] Nota diretora: 8.8/10 para estudo pessoal privado, 8.5/10 para metodo pedagogico, 7.2/10 para produto/app publico.
  - [x] Decidido que a proxima etapa deve ser curadoria de estudos pessoais privados no Lichess: Tratamento de Pendencias, Calculo Ponte 800-1200, Defesa Ativa, Abertura Como Plano e Diplomas de Progresso.
- [x] **Prompts de planejamento da implementacao do metodo Lichess (2026-06-10)**.
  - [x] Criados prompts separados para DeepSeek, Gemini e Codex planejarem a implementacao do metodo aplicado no Lichess.
  - [x] Arquivos: `prompts/archive/2026-06-method/deepseek-plano-implementacao-metodo-lichess.md`, `prompts/archive/2026-06-method/gemini-plano-implementacao-metodo-lichess.md`, `prompts/archive/2026-06-method/codex-plano-implementacao-metodo-lichess.md`.
  - [x] Prompts exigem plano comparavel com mapa Lichess, modelo de dominio, 5 trilhas, UX, privacidade, testes, fases e notas.
  - [x] Fontes oficiais do Lichess para Studies, Puzzles, rate limits e API Tips registradas em `docs/research/sources.md`.
- [x] **Execucao do prompt Codex de plano implementavel (2026-06-10)**.
  - [x] Prompt `prompts/archive/2026-06-method/codex-plano-implementacao-metodo-lichess.md` executado pelo Codex.
  - [x] Plano salvo em `docs/research/plano-implementacao-metodo-lichess-CODEX.md`.
  - [x] Veredito: integrar as 5 trilhas como camada de metodo sobre o loop existente; comecar por Tratamento de Pendencias + Calculo Ponte; melhorar Study do dia antes de criar studies permanentes por trilha.
  - [x] Rechecagem oficial Lichess registrada em `docs/research/sources.md`.
- [x] **Relatorio diretor do plano de implementacao do metodo Lichess (2026-06-10)**.
  - [x] Relatorios DeepSeek, Gemini e Codex comparados.
  - [x] Consolidado salvo em `docs/research/plano-implementacao-metodo-lichess-DIRETOR.md`.
  - [x] Decisao: consenso suficiente; nao precisa de nova rodada com outras IAs antes de implementar.
  - [x] Ordem ideal: camada de metodo local, pendencias, calculo ponte, defesa ativa, abertura como plano, diplomas, Study do dia melhorado.
  - [x] Pontos rejeitados/deferidos: cinco studies permanentes agora, troca de `PlanBlock`, inflar `WeaknessTag`, hard gate de diplomas, app avaliar lances de abertura em tempo real, `gamebook` no primeiro corte e Puzzle DB local agora.
- [x] **Implementacao do Metodo Professor Lemos no app (concluida em 2026-06-10)**.
  - [x] Relatorios de pesquisa organizados em `docs/research/` e memoria atualizada.
  - [x] Camada de dominio das 5 trilhas, pendencias, mastery, diplomas e selecao de trilha adicionada.
  - [x] Trilhas, pendencias e tentativas de diploma persistidas em Dexie schema v4.
  - [x] Plano diario expandido com trilha ativa, pergunta-guia, prioridade para pendencias vencidas e ratio de revisao adaptativo.
  - [x] Tela Hoje mostra pendencias, trilha ativa, checkpoint de diploma e sugestao de pendencia apos feedback dificil.
  - [x] Study do dia enriquecido com trilha, pergunta-guia, tarefa, stop rule e destino.
- [x] **Organizacao de projeto pos-metodo (2026-06-10)**.
  - [x] Prompts executados da rodada do metodo arquivados em `prompts/archive/2026-06-method/`.
  - [x] Scripts de pesquisa movidos para `scripts/research/`.
  - [x] `docs/research/README.md`, `prompts/README.md` e `scripts/README.md` documentam o que e entrada ativa, arquivo historico e ferramenta local.
  - [x] `.gitignore` protege caches locais, downloads de acervo e colecoes pessoais fora do app.
- [x] **Pacote visual gabinete Professor Lemos gerado (2026-06-12)**.
  - [x] `prompts/geracao-imagens-gabinete-2026-06-11.md` executado como fonte canonica.
  - [x] 41 PNGs presentes em `entrega/`, incluindo personagem, fundos, medalhas, selos, diplomas, bandas, molduras, texturas e cenas de apoio.
  - [x] Validacao tecnica confirmou 41/41 arquivos, zero faltantes e proporcoes conforme o prompt.
  - [x] Folha de contato criada em `output/imagegen/gabinete-contact-sheet-2026-06-12.png` para revisao visual rapida.
  - [x] Gate final executado: `npm run lint`, `npm run test` e `npm run build` verdes.
- [x] **Selos de conceito premium integrados (2026-06-12)**.
  - [x] `prompts/geracao-selos-conceito-2026-06-12.md` executado com apoio multiagente para mapear prompts, conceitos e integracao.
  - [x] 15 PNGs `selo-{conceito}.png` gerados em `entrega/` e otimizados para `public/art/selo-{conceito}.webp` em 128px.
  - [x] `ConceptSeal` passou a usar os webp pintados, preservando fallback lucide por conceito.
  - [x] Gate final executado: `npm run lint`, `npm run test` e `npm run build` verdes; Browser confirmou assets em Hoje/Progresso/Config e Playwright validou Config em desktop/mobile.
- [x] **Auditoria geral Codex + docs zerados (2026-06-13)**.
  - [x] Badges v1 aprovados pelo dono e spec atualizada em `docs/superpowers/specs/2026-06-10-badges-spec-draft.md`.
  - [x] Relatorio de notas por area e melhorias salvo em `docs/review/relatorio-codex-auditoria-geral-2026-06-13.md`.
  - [x] Arquitetura atual corrigida para PWA local-first em `docs/architecture/system.md`; em 2026-06-17,
    reatualizada para P4/P5 descongeladas com backend apenas local-only ate provisionamento do dono.
  - [x] Fontes oficiais de API/PWA revalidadas e registradas em `docs/research/sources.md`.
  - [x] Lint breaker em `src/ui/Fold.tsx` corrigido sem alterar a experiencia do usuario.
  - [x] `.gitignore` atualizado para ignorar `output/imagegen/` (folhas de contato/previews locais pesados).
  - [x] Backlog tecnico registrado: fila/cooldown central de API, smoke PWA producao/offline, ADR `vite-plugin-pwa`, validacao profunda de backup, ledger de assets, bundle/estado.
  - [x] Gate final verde: `npm run lint`, `npm run test` (370 testes em 57 arquivos), `npm run build`,
    `npm audit --audit-level=moderate` e `npm audit --omit=dev --audit-level=moderate`.
  - [x] Smoke Playwright desktop/mobile em `http://127.0.0.1:5173/`: dobras `Fold` alternam corretamente,
    sem erro de console e sem overflow horizontal.
- [x] **Pacote para Claude analisar achados Codex e plano nota 9,5 (2026-06-13)**.
  - [x] Relatorio factual criado em `docs/review/relatorio-codex-achados-para-claude-2026-06-13.md`.
  - [x] Plano por cortes N95 criado em `docs/review/relatorio-codex-plano-nota-95-para-claude-2026-06-13.md`.
  - [x] Prompt operacional criado em `prompts/claude-analise-nota-95-2026-06-13.md`.
  - [x] `prompts/README.md` atualizado para listar a analise ativa.
- [ ] **P4** DESCONGELADA pelo dono em 2026-06-16: sync PC<->celular opt-in com Workers + D1,
  E2EE por passphrase, merge por registro/tombstone, testes locais; sem deploy/provisionamento pelo agente.
- [ ] **P5** DESCONGELADA pelo dono em 2026-06-16: versao-comunidade, `APP_NAME='Chess Habit'`,
  disclaimers, AGPL visivel, privacidade, i18n/polish e revisao publica.

- [x] **Execucao Codex cortes M1-M5 para zerar pendencias (2026-06-16)**.
  - [x] Prompt `prompts/codex-cortes-M1-M5-zerar-pendencias-2026-06-15.md` executado.
  - [x] 21 commits atomicos criados, de M1.1 a M5.4, sem push.
  - [x] Principais entregas: boot de diplomas, bloqueio de URL externa, headers Vercel/CSP,
    transacoes Dexie, Chess.com por `end_time`, fraqueza derivada de puzzles, threshold de accuracy,
    hard sem avanco de estagio, cobertura/CI/pre-commit e classificacao estrutural `logKind`.
  - [x] Gate final verde: lint, testes 3x, build, coverage e smoke PWA.
  - [x] Relatorio salvo em `docs/review/relatorio-codex-execucao-cortes-M1-M5-2026-06-15.md`.

- [x] **Overnight beta M1 - Harness E2E com prints (2026-06-17)**.
  - [x] Helpers Playwright criados para mocks oficiais de Chess.com/Lichess, bloqueio de navegacao externa
    e screenshots por etapa em `e2e/__screenshots__/`.
  - [x] Suite E2E desktop/mobile ampliada para onboarding (7 perfis), Hoje (timer/feedback/log),
    reconciliacao de puzzles, Config (backup/export/import/clear), Progresso, callbacks OAuth e
    offline/PWA.
  - [x] CI `smoke` agora roda tambem em `pull_request`.
  - [x] Fonte oficial Playwright/GitHub Actions registrada em `docs/research/sources.md`; suposicoes
    operacionais registradas em `DECISIONS.md` e `memory/decisions.md`.

- [x] **Finalizacao Codex parcial ate estado verde (2026-06-17)**.
  - [x] Prompt `prompts/codex-finalizar-app-2026-06-17.md` executado ate estado verde, sem deploy e sem
    provisionamento de nuvem.
  - [x] Bugs de Fase A corrigidos: feedback herdado entre blocos, corrida de diagnostico por fonte,
    `clearAllData` contra escritas em voo, datas locais injetaveis e limiares Chess.com-aware.
  - [x] Hardening aplicado: backup com limite antes da leitura, validacao de URLs Lichess, export sem token,
    OAuth pendente corrompido recuperavel, Retry-After em 429, sourcemaps desativados e CSP com
    `upgrade-insecure-requests`.
  - [x] P5 parcial: `APP_NAME='Rotina'` centralizado na epoca, disclaimer/AGPL na UI e decisao registrada para
    nao inventar URL de codigo-fonte antes do dono confirmar o link publico; supersedido em 2026-06-26 por
    `APP_NAME='Chess Habit'` com URL publica confirmada.
  - [x] Fontes oficiais rechecadas e registradas em `docs/research/sources.md`.
  - [x] Gate final verde: `npm run lint`, `npm test` (74 arquivos / 622 testes), `npm run build`,
    `npm run coverage` 5x (85,85% statements / 80,17% branches / 90,07% funcs / 85,62% lines),
    `npm run smoke:pwa` (26/26) e build sem `*.map`.
  - [x] Relatorio final salvo em `docs/review/relatorio-final-app-2026-06-17.md`.
  - [ ] Pendentes para beta publico amplo: P4 sync Workers/D1 + E2EE local, URL real de codigo-fonte,
    docs publicas de privacidade/sync, axe formal e remocao de `style-src 'unsafe-inline'` se priorizada.

- [x] **Finalizacao beta local-first (2026-06-19)**.
  - [x] Prompt `prompts/codex-finalizar-beta-local-first-2026-06-19.md` executado sem deploy/push.
  - [x] Axe automatizado criado para Welcome, Hoje, Config, Progresso e onboarding "Suas contas".
  - [x] Inline styles proprios auditados/limpos; CSP smoke adicionado; `style-src 'unsafe-inline'`
    mantido apenas por limite real do `sonner`, documentado em `DECISIONS.md`.
  - [x] Privacidade local-first exibida no footer; `FEEDBACK_URL` preparado como constante opcional.
  - [x] Contrato P4 E2EE por passphrase independente documentado em `docs/architecture/sync.md` e
    runbook do dono criado em `DEPLOY-BACKEND.md`.
  - [x] Gate final verde: lint, `npm test` (76 arquivos/627 testes), coverage 5x (functions 90,02%),
    build, smoke PWA 34/34 e build sem sourcemaps.
  - [x] Relatorio salvo em `docs/review/relatorio-finalizacao-beta-local-first-2026-06-19.md`.

- [x] **P4 M12 - Backend Cloudflare Workers + D1 (local-only, key-agnostic) (2026-06-26)**.
  - [x] Pacote `backend/` criado: `worker.ts` (handler `fetch` puro), `store.ts` (queries D1
    parameterizadas), `auth.ts`, `types.ts` (superficie D1 sem deps), `schema.sql`
    (tabela `blobs`, PK `(userId, collection, clientMutationId)`, conteudo = `ciphertext` opaca),
    `fakeD1.ts` (D1 em memoria para testes), `wrangler.toml` (runbook do dono).
  - [x] API minima: `GET /health` (publico), `POST /blobs` (push upsert), `GET /blobs?collection=X`
    (pull por colecao), `GET /snapshot` (pull de todas). Servidor jamais decodifica ciphertext;
    userId vem do auth, nunca do payload.
  - [x] Auth local-only: `SYNC_AUTH_MODE='local'` confia em header `X-Sync-User` (teste/dev);
    qualquer outro valor/ausente => 501 apontando para M13. Worker nunca confia em header por
    padrao. OAuth Lichess real fica para M13 (nao implementado - isola decisao KDF/passphrase).
  - [x] Sem wrangler/miniflare instalado (preferido pelo dono): testes unitarios do worker com
    fake D1. `npm run test:worker` + `npm run typecheck:worker` verdes; `npm test`/`lint`/`build`
    do app inalterados e verdes.
  - [x] `DEPLOY-BACKEND.md` ganhou secao "Estado M12 (local-only)" + roteiro opcional de wrangler.
  - [x] Pendente M13: motor de sync no cliente, KDF/passphrase E2EE e validacao OAuth Lichess real.

- [x] **P4 M13 parcial - Cliente E2EE local-only (2026-06-26)**.
  - [x] Criado `src/infra/sync/crypto.ts`: envelope E2EE versionado com PBKDF2-SHA256 600k,
    salt 16 bytes, IV 12 bytes, AES-GCM 256 e chave nao-extraivel. Passphrase errada ou blob
    adulterado falha por auth tag; passphrase vazia e recusada.
  - [x] Criado `src/infra/sync/syncClient.ts`: cliente HTTP pequeno para backend M12 (`health`,
    `pushBlob`, `listBlobs`, `snapshot`) que envia apenas `ciphertext` opaco + metadados; nunca
    recebe ou envia plaintext, passphrase, chave ou token.
  - [x] Testes cobrem round-trip crypto, Unicode, aleatoriedade, no-plaintext/no-passphrase leak,
    passphrase errada, blob corrompido, parse de envelope, push/pull opaco com mock fetch,
    no-token/no-cookie/no-authorization e erros HTTP/rede/timeout.
  - [x] M13 publico ainda pendente: fila offline persistente, validacao OAuth Lichess real, backend
    Cloudflare/D1 provisionado e E2E de dois dispositivos. Sem provisionamento/secrets Cloudflare.
  - [x] Fixes pos-council: teto anti-DoS de `iterations` (2.000.000), rejeicao de base64 invalido,
    rejeicao de valores JSON nao-serializaveis, erro `SyncHttpError` para 200 nao-JSON e upsert
    anti-rollback no backend (`updatedAt` menor/igual nao sobrescreve).
  - [x] UI/canary local-only adicionada atras de feature flag OFF (`SYNC_UI_ENABLED=false`): painel
    isolado de Config mostra aviso de perda de passphrase, canary local em localStorage, bloqueio sem
    backend URL e sonda E2EE `probe` quando habilitado. Passphrase/chave/token nunca persistem.
  - [x] Hardening residual M13: `canaryStore.clear()` retorna sucesso/falha e a UI so limpa estado se
    remover o canary local com sucesso; validacao da sonda usa retry curto para evitar falso-negativo de
    consistencia eventual.

- [x] **P4 M13b - Merge Dexie por mutacao de entidade (2026-06-27)**.
  - [x] `src/infra/sync/syncRecords.ts` criado: mutation payload versionado por entidade, allowlist
    deny-by-default, LWW por `updatedAt`, tombstone e `clientMutationId` opaco (sem entityId claro).
  - [x] `src/infra/sync/syncStorage.ts` criado: ciclo local `pull -> merge -> push` por colecao,
    integrando Dexie sem sincronizar tokens OAuth, cache Chess.com, backupMeta ou autoBackup.
  - [x] Testes cobrem allowlist anti-token/cache, divergencia de dois aparelhos preservando entidades,
    LWW local/remoto, tombstone, passphrase errada e round-trip E2EE por mutation.
  - [x] Decisao: nao usar snapshot inteiro por colecao; council apontou clobber entre aparelhos.

- [x] **P5 docs/checks beta publico - Chess Habit (2026-06-26)**.
  - [x] `docs/privacy/privacy-and-data.md` atualizado para refletir beta publico: `APP_NAME='Chess Habit'`,
    disclaimer, AGPL, URL publica de codigo-fonte/feedback e P4 sync E2EE por passphrase independente.
  - [x] `src/config/appIdentity.test.ts` agora bloqueia nomes publicos rejeitados (`Lichess Tutor`,
    `Rotina`) nos entry points publicos (`README.md`, `index.html`, `vite.config.ts`, `src/ui/App.tsx`,
    `src/infra/lichess/study.ts`).
  - [x] `src/app/preserveProgress.test.tsx` estabilizado: timeout explicito para Config lazy/Suspense e
    limpeza de timers/mocks/history/IndexedDB no `afterEach`. Suite cheia repetida e verde.

- [x] **Push + deploy beta publico Vercel (2026-06-27)**.
  - [x] `master` enviado para `origin/master`; CI GitHub verde.
  - [x] Deploy de producao feito pelo fluxo prebuilt (`vercel build --prod --yes` +
    `vercel deploy --prebuilt --prod --yes`).
  - [x] URL estavel `https://rotina-pied.vercel.app` verificada com HTTP 200, titulo
    `Chess Habit - treino de xadrez` e `X-Robots-Tag: noindex, nofollow`.
  - [x] Gates finais verdes: `npm run lint`, `npm test` (119 arquivos / 1294 testes),
    `npm run build`, `npm run typecheck:worker`, `npm run test:worker` (22 testes) e
    `npm run smoke:pwa` (40/40).
