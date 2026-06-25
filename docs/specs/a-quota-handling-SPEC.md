# SPEC — A: tratamento de QuotaExceededError (cofre de dados)

## Contexto (des-stalado 2026-06-25)
Backup/restore/migração estão ROBUSTOS (restore transacional, dupla-validação
formato+checksum+shape, migrações testadas). O ÚNICO gap real: `QuotaExceededError` do
IndexedDB **não tem tratamento específico** — cai no catch genérico do restore
(`src/infra/storage/appData.ts`, ~L507) e do auto-backup (`src/infra/storage/autoBackup.ts`,
~L68), vazando mensagem técnica em vez de algo claro em PT pro usuário. Quando o
armazenamento enche, o usuário vê erro críptico e não sabe o que fazer.

## Objetivo
Detectar `QuotaExceededError` especificamente e devolver uma mensagem **user-facing em PT**
clara e acionável — SEM apagar dado do usuário.

## Teste primeiro (vitest — TDD)
1. **Restore sob quota** — simule uma escrita que lança `DOMException` com `name ===
   'QuotaExceededError'` (ou o equivalente do Dexie) no caminho de restore. Asserta: o
   handler distingue quota de erro genérico e retorna/lança um erro TIPADO com mensagem PT
   acionável (ex.: "Armazenamento do dispositivo cheio. Libere espaço ou exporte um backup
   antes de continuar."), NÃO a `DOMException` crua.
2. **Auto-backup sob quota** — simule a mesma exceção no auto-backup; asserta que ele NÃO
   quebra o fluxo do app (degrada com aviso/log claro, não crash) e expõe a mesma classe de
   mensagem PT.
3. **Erro genérico continua genérico** — uma exceção comum (não-quota) NÃO deve ser
   classificada como quota (sem falso-positivo).

Rode SÓ esses testes → VERMELHO antes.

## Fix (mínimo)
- Um discriminador de quota reutilizável (ex.: `isQuotaExceeded(err)` checando
  `err instanceof DOMException && err.name === 'QuotaExceededError'`, mais o nome do erro
  Dexie correspondente).
- Aplicar no catch do restore (`appData.ts` ~L507) e do auto-backup (`autoBackup.ts` ~L68):
  mapear quota → constante de mensagem PT user-facing; demais erros seguem o caminho atual.

## NON-GOALS (fronteira de risco)
- NÃO mexer no happy-path de backup/restore (já robusto) nem na lógica transacional.
- **NÃO apagar/truncar dado do usuário** (a degradação que trunca logs >90d é uma FASE
  SEPARATE, opt-in com consentimento explícito — FORA deste SPEC).
- NÃO tocar placement/diplomas/bandProgression.
- NÃO inventar IDs; NÃO commitar; NÃO rodar council; NÃO agir como maestro.

## Gate de aceite (binário)
- Testes novos: VERMELHO antes, VERDE depois.
- `npm test` (suíte cheia) VERDE. `npm run lint` + `npm run build` VERDES.

## Entrega
Arquivos mudados + diff resumido + saída do teste antes/depois + arquivos lidos. NÃO
commitar — o maestro revisa e commita.
