# Prompt: Revisao Externa Da Proposta 2 (Rotina — ferramenta pessoal)

> Cole este prompt inteiro em cada IA consultora (uma por vez). Cada IA preenche o proprio nome e
> assinatura no relatorio. Objetivo: revisar a Proposta 2 antes de implementar.

---

Voce e uma IA consultora senior revisando uma proposta tecnica ANTES da implementacao. Pela
governanca do projeto (`AGENTS.md`), consultores sao INSUMO, nao ordem. Seja critico, tecnico e
especifico. Nao seja simpatico. Encontre o que o planejador (Claude) nao viu. Elogie so o que for
forte de verdade.

## Contexto fixo (NAO relitigar)

O dono decidiu a moldura **pessoal primeiro, comunidade depois** (ADR-004). Isto e uma ferramenta
pessoal para o dono estudar xadrez no Lichess (username: `jukasparov`), a ser compartilhada com a
comunidade depois, se for boa. **NAO recomende "validar mercado antes de codar"** para o escopo
pessoal — esse frame vale apenas para a versao-comunidade (Fase P5). Voce PODE e DEVE apontar
qualquer violacao das Regras Inquebraveis do `AGENTS.md`.

## Documento sob revisao

`docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md` (Proposta 2).

## Leia tambem

- `AGENTS.md`, `PLANO.md`, `memory/decisions.md`, `memory/state.md`
- `docs/adr/ADR-004-moldura-pessoal-primeiro.md` ate `ADR-007-sync-depois-do-valor-por-registro.md`
- `docs/architecture/sync.md`, `docs/integrations/lichess.md`, `docs/integrations/chesscom.md`,
  `docs/privacy/privacy-and-data.md`, `docs/pedagogy/curriculum-0-2000.md`
- O spec anterior (superseded) `2026-06-06-chess-tutor-unified-app-design.md` e os tres relatorios de
  revisao ja existentes em `docs/review/` (para NAO repetir pontos ja aceitos e checar se foram aplicados)
- `chessking-tutor/` apenas em modo LEITURA, para verificar que a Proposta 2 NAO herda codigo dele
  (regra clean-room, ADR-005)

## Obrigacao de pesquisa

Onde tocar API, preco ou plataforma (Lichess games export, rate limit/429, fair play, Chess.com
`/stats`, Cloudflare D1 vs KV, PWA), revalide na documentacao oficial e cite link + data. Separe
**FATO / INFERENCIA / OPINIAO**.

## Avalie (responda cada ponto)

1. **Execucao-prontidao para o Codex:** o spec e detalhado o bastante para implementar sem adivinhar?
   Onde ha ambiguidade que faria o Codex errar?
2. **Arquitetura** (dominio puro, camadas, `Signal -> Weakness -> Plan`): correta? fragil em que?
3. **Correcoes herdadas:** o spec realmente resolve os P0 dos relatorios anteriores (clean-room, sem
   ChessKing no dominio, tipos estritos sem `unknown`, sync por registro e adiado, slugs dinamicos,
   erro/offline)? Algum ainda aberto?
4. **Lichess:** contratos de API corretos? rate limit e fair play respeitados? riscos de parser
   quando faltar analise?
5. **Detector de fraquezas:** as regras sao solidas para 0-1200 ou geram falsos sinais? `confidence`
   bem usada? linguagem de hipotese suficiente?
6. **Privacidade/IP:** algo viola Regras Inquebraveis? risco de herdar do app pago? PII em logs/dados?
7. **Sync (P3):** merge por registro + D1 resolve a perda de dados apontada antes? lacunas?
8. **Ordem das fases P0->P5:** correta? algo fora de ordem (ex.: conveniencia antes de valor)?
9. **O que cortar, o que falta, o que esta perigoso.**

## Entregavel

Relatorio em Markdown. No TOPO, obrigatorio (preencha com SEU nome e assinatura):

```md
# Relatorio De Revisao: [nome curto unico escolhido por voce] — [SUA IA / assinatura]

- IA/autoria: [seu nome de modelo, ex.: Codex GPT-5, Antigravity Gemini 3.x, DeepSeek V4]
- Assinatura: [identificador unico seu]
- Documento analisado: docs/superpowers/specs/2026-06-06-rotina-pessoal-adaptativa-design.md
- Data da analise: 2026-06-06
- Sugestao de nome de arquivo: relatorio-[sua-assinatura]-revisao-proposta2-rotina-2026-06-06.md
```

Inclua obrigatoriamente:

- **Veredito:** aprovar / aprovar com correcoes / rejeitar como ordem de execucao.
- **Nota 0-10** de prontidao para execucao pelo Codex.
- **Riscos P0/P1/P2** especificos deste spec (nao genericos).
- **Correcoes obrigatorias** antes de codar (lista acionavel).
- **Resposta direta:** "Este spec pode virar o plano de execucao do Codex para a Fase P0? SIM/NAO e
  por que."
- Fontes oficiais com data quando tocar API/preco/plataforma.

Se voce tem acesso ao repositorio, salve o relatorio em `docs/review/` com o nome sugerido (incluindo
sua assinatura). Se nao tem, entregue o Markdown completo para o dono salvar.

## Criterio de qualidade

Sua revisao sera boa se: encontrar erros reais que travariam o Codex; confirmar (ou derrubar) que as
correcoes dos relatorios anteriores foram aplicadas; proteger o projeto de problemas de IP,
privacidade e API; e dizer com clareza se o spec esta pronto para virar codigo.
