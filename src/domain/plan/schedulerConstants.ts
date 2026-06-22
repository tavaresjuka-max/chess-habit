/**
 * Constantes do scheduler híbrido bloco→intercalado (§5 do SPEC 2026-06-22).
 * Exportadas como nomeadas para facilitar teste e ajuste futuro.
 */
import type { PlanResourceStage } from '../types';

/** Estágios de AQUISIÇÃO: bloco puro, sem pool. */
export const ACQUISITION_STAGES: readonly PlanResourceStage[] = ['explain', 'guided'];

/** Estágios de PÓS-AQUISIÇÃO: intercalação ligada. */
export const INTERLEAVE_STAGES: readonly PlanResourceStage[] = ['retrieval', 'transfer'];

/** Máximo de temas distintos de pool por sessão (protege working memory TDAH). */
export const POOL_MAX_PER_SESSION = 2;

/** Mínimo de puzzles para qualificar graduação de tema. */
export const GRADUATION_MIN_PUZZLES = 30;

/**
 * Acurácia mínima para graduação (alinhada ao SECTION_ACCURACY_TARGET do diploma,
 * diplomas.ts:8). Expressa em percentual inteiro (0-100).
 */
export const GRADUATION_ACCURACY = 80;

/**
 * Teto anti-trava: se o tema for primário por mais de N sessões sem graduar,
 * força rotação. N = 12 (SPEC D4).
 */
export const PRIMARY_SESSION_CEILING = 12;
