# Professor Lemos — Etapa 2A (Personalizacao Honesta E Anti-Repeticao)

Data: 2026-06-08

## Objetivo

Corrigir a dor de uso real em que o app parece personalizado, mas cai em tema conservador e repete o
mesmo destino do Lichess. Esta etapa torna o tutor mais honesto sobre a qualidade da evidencia e faz
o gerador parar de tratar a mesma licao estatica como progresso suficiente.

## Escopo

- Mostrar, no card do Professor Lemos, quando o plano esta em modo inicial/fallback por falta de
  sinais suficientes.
- Preservar blocos ja concluidos como historico do que foi feito, sem reescrever destino/estagio ao
  regenerar o plano.
- Quando um tema ja voltou para explicacao e ainda foi marcado como dificil, a proxima sessao deve
  trocar para treino variado do tema em vez de repetir a mesma licao guiada.
- Usar resultados reconciliados de puzzles, quando existirem, para diagnostico por tema sem inventar
  numeros.
- Quando o diagnostico ainda for pergunta, oferecer resposta curta no card do Lemos e registrar essa
  resposta como sinal manual local.
- Expor no card um atalho para conferir puzzles quando houver log de puzzle concluido sem resultado
  reconciliado.

## Fora De Escopo

- Nada de engine, PGN completo, analise lance a lance ou ajuda durante partida ao vivo.
- Nada de sync P4/P5.
- Nada de nova API externa; esta etapa reaproveita `puzzle:read` ja existente e dados locais.

## Arquivos

- `src/domain/plan/generatePlan.ts`
- `src/domain/plan/generatePlan.test.ts`
- `src/domain/coach/diagnosis.ts`
- `src/domain/coach/diagnosis.test.ts`
- `src/domain/coach/puzzleThemeStats.ts`
- `src/domain/coach/puzzleThemeStats.test.ts`
- `src/domain/manual/knownManualSignals.ts`
- `src/domain/manual/knownManualSignals.test.ts`
- `src/domain/types.ts`
- `src/infra/lichess/puzzleActivity.ts`
- `src/infra/lichess/puzzleActivity.test.ts`
- `src/infra/storage/appData.ts`
- `src/infra/storage/appData.test.ts`
- `src/app/state.ts`
- `src/ui/TutorCard.tsx`
- `src/ui/TutorCard.test.tsx`
- `src/ui/Today.tsx`
- `src/ui/App.tsx`
- `memory/state.md`
- `memory/decisions.md`
- `memory/progress.md`

## Criterio De Pronto

- `npm run test`
- `npm run lint`
- `npm run build`
- Smoke no browser: card deixa claro fallback e proxima sessao nao repete Practice apos hard em
  explicacao.
