# ADR-008: Chess.com Como Fonte Primaria De Diagnostico (P1)

## Status

Aceito (2026-06-06, decisao do dono). Atualiza ADR-006 (que assumia Lichess como fonte primaria) e a
secao 14 do spec vigente.

## Contexto

O dono joga principalmente no Chess.com (os amigos estao la). O detector de fraquezas precisa de
historico real de partidas. Se a fonte de diagnostico fosse so o Lichess (`jukasparov`), o sinal
seria raso, porque la ha poucas partidas. O dono pediu explicitamente para antecipar o Chess.com e,
se possivel, usar a API publica para informacoes mais completas.

## Decisao

- **Chess.com vira a fonte primaria de diagnostico**, antecipada de P4 para **P1**.
- Usar a Chess.com Published Data API (read-only, sem login): `/pub/player/{username}/stats` +
  historico completo de arquivos mensais `/pub/player/{username}/games/{YYYY}/{MM}` (via `/games/archives`).
- **Privacidade preservada (regra inquebravel mantida):** parse de PGN **transiente** (extrair sinais
  e descartar); **nunca persistir PGN completo**; guardar so `Signal[]` derivados; sem PII de perfil
  (nome/avatar/localizacao).
- **Profundidade:** historico **completo** (o dono joga pouco ultimamente; cortar por meses deixaria
  o app sem dados). Todos os arquivos mensais, serial + cache (passados imutaveis). Recencia entra como
  **peso** no score, nao como corte de meses.
- **Destinos de treino seguem no Lichess** (puzzles/practice/analysis gratuitos). O Chess.com e
  leitura de historico/nivel, nao destino.
- **Lichess vira fonte de diagnostico secundaria (P2)**, somando sinais quando o dono treinar la.
- O detector (cadeia Signal->Weakness->Plan) e o mesmo; muda apenas a EXTRACAO de sinais por fonte.
  Chess.com nao da o agregado de judgment do Lichess; usar `accuracies` (quando houver) como proxy de
  `blunder-rate`, mais abertura/ritmo/cor/resultado.

## Consequencias

- P1 implementa `services/chesscom.ts` (coletor + parser transiente) em vez do coletor Lichess.
- `services/lichess.ts` move-se para P2.
- Custo/limite: arquivos mensais podem ser grandes; mitigar com cache de arquivos passados
  (imutaveis), requisicao serial e recencia como peso no score, nao cutoff. `User-Agent` identificavel so com proxy/backend (browser
  proibe via JS); nao criar backend so para UA na ferramenta pessoal sem avaliar necessidade.
- Username Chess.com do dono: **jukatavares**. Profundidade: **historico completo**.
- Import adicional do onboarding: nivel/temas que o dono ja conhece (inclusive observados no ChessKing)
  como Signals manuais genericos (`source:'outro'`), sem taxonomia proprietaria (ver ADR-005 e spec 14.3).
- P0 nao e afetada (offline, plano fixo). Continua pronta para execucao.
