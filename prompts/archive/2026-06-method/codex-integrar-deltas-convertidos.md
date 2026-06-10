# Codex - Integrar Os Deltas Verificados Dos Convertidos Ao Metodo Consolidado

Voce e o **Codex**, rodando localmente neste repo com acesso a disco. Data: 2026-06-09.

Tarefa: aplicar **edicao cirurgica** em
`docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md`, integrando apenas os **deltas ja decididos** da
analise dos convertidos. **Nao reescreva o documento.** Preserve tudo que ja esta fechado. Ao final,
mostre um resumo do diff (secoes tocadas + antes/depois curtinho de cada mudanca).

As decisoes abaixo ja foram tomadas (convergencia DeepSeek + Gemini + Codex, com desempate). **Aplique
exatamente isto — nao re-derive, nao adicione o que esta na lista de "NAO fazer".**

## Contexto Minimo (Ja Decidido)

- Os e-books PT-BR foram convertidos e analisados. Tres relatorios em `analise-convertidos-DEEPSEEK.md`,
  `analise-convertidos-GEMINI.md`, `analise-convertidos-CODEX.md`. Voce pode consulta-los para detalhe,
  mas **a fonte de verdade do que integrar e este prompt**.
- Principios travados do produto: progresso por **sinal local, nunca rating/engine**; `exerciseMode`
  fixos (`explain | guided | retrieval | review | transfer`); treino roda no Lichess; clean-room (so
  influencia, nunca copiar texto/exercicio); voz Professor Lemos PT-BR adulto.

## FAZER — Deltas A Integrar

### 1. Corrigir a entrada do DAMP (a mudanca mais importante)
Onde o documento mencionar DAMP como "candidato a validar" / ritual de seguranca, **substituir** pela
definicao verificada no texto do livro:

- **DAMP = Defesa, Alinhamento, Mobilidade, Promocao** — um **checklist de DETECCAO tatica** (onde
  procurar tatica na posicao), criado por Claudio Nunes Duarte e Julio Lapertosa (PT-BR).
- Encaixe: **`drill_format` sob `stage: tatica`**, na familia "Detectar-antes-de-calcular" (Neiman),
  agora com versao PT-BR. **Nao** e novo `exerciseMode`. **Nao** substitui o ritual de seguranca
  (Heisman/LPDO) nem o CCT (Hertan) — DAMP acha ONDE ha tatica; CCT/seguranca tratam do calculo e da
  seguranca do proprio lance. Mantê-los separados.
- Adicionar o drill na biblioteca de `drill_formats`:
  `damp-scan` — passos: D (peca indefesa/rei exposto) -> A (pecas alinhadas: cravada/espeto/raio-X) ->
  M (peca com pouca mobilidade/presa) -> P (peao perto de promover) -> so depois calcular. Band 600-1200,
  stage tatica, exerciseMode explain->guided->retrieval, mapa Lichess: temas hangingPiece (D), pin+skewer
  (A), trapped/mobility (M), pawnEndgame (P). sourceInfluence: DAMP (Duarte & Lapertosa). Confianca alta.

### 2. Adicionar o bloco DAMP-scan
Inserir na tabela de blocos 0->1200 (use o ID ja convergente):

- `600-1000-tatica-00` | band 600-1000 | stage tatica | signal: acerta tema isolado mas nao sabe onde
  procurar tatica em posicao nova | weakness: olho vai direto ao lance sem detectar o defeito |
  learningGoal: identificar o defeito DAMP antes de calcular | exerciseMode: explain->guided |
  lichess_destino: puzzles tematicos por letra (hangingPiece/pin+skewer/trapped/pawnEndgame) | tempo_min:
  15 | sourceInfluence: DAMP (Duarte & Lapertosa) | avoid: pular o scan e chutar lance | criterio: nomeia
  o defeito provavel antes do lance em >=80% de 10-20 posicoes | microcopy (Lemos): "Antes do lance
  bonito, ache o defeito dele: Defesa (peca solta), Alinhamento (pecas na mesma reta), Mobilidade (peca
  presa) ou Promocao (peao quase virando dama). O calculo vem depois."

### 3. Adicionar a proporcao de treino do Leitao (como regra do gerador, elastica)
- Registrar como influencia: **GM Rafael Leitao**, divisao de tempo para ate ~1900: **~50% calculo/tatica,
  ~20% partidas classicas/revisao, ~15% finais, ~15% abertura por principios.**
- Integrar na secao de **regras do gerador de plano** como **proporcao-base**, com a ressalva explicita:
  **reponderada por fraqueza local detectada e tempo disponivel; NUNCA usar rating como porta de avanco
  nem como gate.** Ex.: se ha perda de material, sobe seguranca/tatica; se perde finais ganhos, sobe
  finais — a proporcao e ponto de partida, nao camisa de forca.
- Opcional: um bloco `0-1200-meta-01` (stage existente mais proximo; **nao crie um stage `meta` novo no
  contrato de tipos** — descreva como nota de gerador ou bloco `explain` unico). Microcopy: "Abertura
  entra, mas nao engole o treino. Primeiro calculo, final e revisao honesta de partida."

### 4. Adicionar fontes PT-BR como sourceInfluence (sem mudar a estrutura)
- **Manual de Aberturas (Marcio Lazzarotto, PT-BR)**: adicionar como `sourceInfluence` nos blocos de
  `abertura-principio`. **Rotular como REFERENCIA de principios/vocabulario PT-BR, NAO como repertorio
  pronto** — o repertorio minimo adaptativo continua a construir.
- **Fundamentos do Xadrez (Capablanca, PT-BR, dominio publico provavel do original)**: adicionar como
  `sourceInfluence` nos blocos de `fundamento`/`final` e na tabela de dominio publico (separar status do
  original vs. da traducao/edicao).
- **Movimento Forcado (Murray, PT-BR)**: pode entrar como `sourceInfluence` de calculo **a partir de
  1200+** (banco de exercicios). **Deixar explicito que NAO cobre 800-1200** (vol. 1 comeca em FIDE
  ~1201) e que e exercicio, nao metodo.

### 5. Atualizar a secao de lacunas
Marcar como **parcialmente melhoradas**: repertorio de abertura PT-BR (agora ha referencia/vocabulario) e
calculo 1200+ (Movimento Forcado). Manter como **ainda abertas** e explicitas:
- **calculo-ponte 800-1200** (a construir; Movimento Forcado comeca acima disso);
- **defesa/profilaxia pratica 1000-1400** (DAMP "D" e deteccao, nao manual de defesa);
- **repertorio minimo adaptativo** (Lazzarotto e referencia, nao plano);
- **microcopy PT-BR validada** (depende de uso real do dono).

## NAO FAZER (Decisoes Que Ja Filtrei — Nao Reintroduzir)

- **Nao** trate DAMP como ritual de seguranca nem como substituto de Heisman/CCT.
- **Nao** afirme que Movimento Forcado fecha o calculo 800-1200, nem que Lazzarotto e "repertorio pronto".
- **Nao** crie novos `exerciseMode` nem um novo `stage` (`visualizacao`, `meta`, `calculo-iniciante`
  como tipo etc.) no contrato. Formatos especiais sao `drill_formats`; a ponte de calculo, quando vier,
  fica sob `tatica`/`calculo` ja existentes.
- **Nao** use rating ou vitoria contra engine como criterio de avanco em nenhuma regra nova.
- **Nao** importe as ~50-60 colecoes "Jogue como X" como metodo — no maximo cite-as como biblioteca de
  partidas-modelo PT-BR (uso futuro com PGN licito + comentario original do app).
- **Nao** copie texto, exercicios, variantes ou problemas dos livros para o documento. So influencia.
- **Nao** reescreva secoes ja fechadas; so insira/edite os pontos acima.

## Entrega

1. Edite `docs/pedagogy/metodo-consolidado-acervo-2026-06-09.md` aplicando 1-5.
2. Atualize, se existirem, `memory/state.md` (registrar: pendencia DAMP resolvida = Defesa/Alinhamento/
   Mobilidade/Promocao, deteccao tatica) e `memory/progress.md` (analise dos convertidos integrada).
3. Como este e um documento de planejamento (nao codigo), **nao** ha gate de testes; mas confirme que o
   doc continua coerente (sem secao duplicada, sem DAMP descrito de duas formas).
4. Termine com um **resumo do diff**: lista de secoes tocadas e, por mudanca, 1-2 linhas de antes/depois.
   Nao faca commit a menos que o dono peca.
