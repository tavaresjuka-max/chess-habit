import { isLearnerBand, learnerBands } from '../bands';
import type { LearnerBand } from '../types';
import { promoteBandForDiplomas } from './bandProgression';
import type { DiplomaAttempt } from './types';

// GRUPO D (dados-2 + merge do sync, council 2026-07-01): saneamento semântico
// aplicado nos DOIS pontos de entrada de dados externos — restore de backup
// (importBackupFromJson) e merge de sync (mergeRemoteMutationsIntoStorage).
// Mesma superfície de ataque nos dois: um backup/blob forjado (tipado-válido,
// mas semanticamente impossível) não pode elevar privilégio pedagógico.
//
// Direção CONSERVADORA (decisão do dono, ver prompt do Grupo D): a
// re-derivação de banda NUNCA sobe — só clampa para baixo. Se a lógica de
// promoção real (promoteBandForDiplomas) discordar da banda restaurada,
// vence o mínimo dos dois. Isso evita que um ataque "grátis" suba banda,
// mas também evita que o saneamento AVANCE alguém que legitimamente já
// estava mais adiantado por outro caminho (placement, etc.) — nunca inventamos
// progresso, só recusamos aceitar mais do que os diplomaAttempts provam.

function bandRank(band: LearnerBand): number {
  return learnerBands.indexOf(band);
}

/**
 * Deriva, a partir do zero, a banda mais alta que os diplomaAttempts
 * fornecidos justificam — aplicando promoteBandForDiplomas repetidamente
 * (cada chamada só sobe um degrau) até estabilizar num ponto fixo.
 */
function deriveEarnedBand(diplomaAttempts: DiplomaAttempt[]): LearnerBand {
  let band: LearnerBand = learnerBands[0];

  // learnerBands.length é o teto de degraus possíveis; suficiente para
  // estabilizar mesmo subindo um degrau por iteração.
  for (let i = 0; i < learnerBands.length; i += 1) {
    const next = promoteBandForDiplomas(band, diplomaAttempts);

    if (next === band) {
      break;
    }
    band = next;
  }

  return band;
}

/**
 * Clampa a banda restaurada/mesclada para nunca exceder o que os
 * diplomaAttempts (também restaurados/mesclados) comprovam. Só desce —
 * nunca sobe além do valor já presente (ver nota de direção conservadora
 * acima). Bandas desconhecidas ou fora do spine caem para o piso.
 */
export function sanitizeBand(claimedBand: string, diplomaAttempts: DiplomaAttempt[]): LearnerBand {
  const earned = deriveEarnedBand(diplomaAttempts);

  if (!isLearnerBand(claimedBand)) {
    // Banda fora do spine conhecido: não há como confiar nela — cai pro piso
    // provado pelos diplomas (nunca abaixo do piso do spine).
    return earned;
  }

  return bandRank(claimedBand) > bandRank(earned) ? earned : claimedBand;
}

// Época mais antiga plausível para o app (1º commit do repositório,
// 2026-06-06): nenhum carimbo de adoção/consentimento restaurado pode ser
// anterior a isso — sinal de dado forjado ou corrompido.
export const APP_EPOCH_ISO = '2026-06-06T00:00:00.000Z';
const APP_EPOCH_MS = Date.parse(APP_EPOCH_ISO);

/**
 * Clampa um timestamp ISO restaurado para o intervalo [APP_EPOCH, now].
 * undefined permanece undefined (campo ausente não é uma alegação forjada).
 * Timestamp inválido (não parseável) é descartado (undefined) — mais seguro
 * que herdar um valor arbitrário.
 */
export function clampTimestamp(value: string | undefined, nowIso: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const ms = Date.parse(value);
  const nowMs = Date.parse(nowIso);

  if (Number.isNaN(ms)) {
    return undefined;
  }

  const effectiveNowMs = Number.isNaN(nowMs) ? Date.now() : nowMs;
  const clampedMs = Math.min(Math.max(ms, APP_EPOCH_MS), effectiveNowMs);

  return new Date(clampedMs).toISOString();
}

// ── Adapters de nível "array de registros" ──────────────────────────────────
// Usados pelos DOIS caminhos de entrada de dados externos: restore de backup
// (src/infra/storage/appData.ts) e merge de sync (src/infra/sync/syncStorage.ts).
// Operam sobre `unknown[]`/objetos soltos (pré-tipagem do Dexie) porque é
// exatamente essa a forma em que os dados chegam nos dois caminhos.

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractDiplomaAttempts(items: readonly unknown[]): DiplomaAttempt[] {
  // Best-effort: itens que não têm o formato mínimo são ignorados pela
  // extração (não contam como diploma para fins de sanitização), mas
  // continuam seguindo seu próprio caminho de persistência normalmente —
  // esta função só informa o cálculo de banda, não filtra a tabela real.
  const result: DiplomaAttempt[] = [];

  for (const item of items) {
    if (!isRecordObject(item)) {
      continue;
    }
    if (typeof item.diplomaId !== 'string' || typeof item.sectionId !== 'string') {
      continue;
    }
    if (typeof item.passed !== 'boolean') {
      continue;
    }
    result.push(item as unknown as DiplomaAttempt);
  }

  return result;
}

/**
 * Saneia o array de registros de `profile` (tipicamente 0 ou 1 item, id
 * 'default') clampando a banda para o que os diplomaAttempts restaurados/
 * mesclados comprovam. Não muda mais nada no registro.
 */
export function sanitizeProfileRecords<T extends Record<string, unknown>>(
  profileRecords: readonly T[],
  diplomaAttemptRecords: readonly unknown[],
): T[] {
  const diplomaAttempts = extractDiplomaAttempts(diplomaAttemptRecords);

  return profileRecords.map((record) => {
    const band = record.band;

    if (typeof band !== 'string') {
      return record;
    }

    const sanitizedBand = sanitizeBand(band, diplomaAttempts);

    if (sanitizedBand === band) {
      return record;
    }

    return { ...record, band: sanitizedBand };
  });
}

/**
 * Saneia o array de registros de `appMeta` (tipicamente 0 ou 1 item, id
 * 'app') clampando adoptedAt/consentedAt para o intervalo [APP_EPOCH, now].
 */
export function sanitizeAppMetaRecords<T extends Record<string, unknown>>(
  appMetaRecords: readonly T[] | undefined,
  nowIso: string,
): T[] {
  if (appMetaRecords === undefined) {
    return [];
  }

  return appMetaRecords.map((record) => {
    const adoptedAt = typeof record.adoptedAt === 'string' ? record.adoptedAt : undefined;
    const consentedAt = typeof record.consentedAt === 'string' ? record.consentedAt : undefined;

    const clampedAdoptedAt = clampTimestamp(adoptedAt, nowIso);
    const clampedConsentedAt = clampTimestamp(consentedAt, nowIso);

    if (clampedAdoptedAt === adoptedAt && clampedConsentedAt === consentedAt) {
      return record;
    }

    const next: Record<string, unknown> = { ...record };

    if (clampedAdoptedAt === undefined) {
      delete next.adoptedAt;
    } else {
      next.adoptedAt = clampedAdoptedAt;
    }

    if (clampedConsentedAt === undefined) {
      delete next.consentedAt;
    } else {
      next.consentedAt = clampedConsentedAt;
    }

    return next as T;
  });
}
