import { isRecord } from '../utils/typeGuards';

// E1: parser PURO da série temporal de rating do Lichess
// (/api/user/{u}/rating-history). Sem fetch, sem Dexie, sem IO — só
// transforma o array cru recebido. O cliente de rede e a persistência
// (E1b) ficam em outro lugar; este módulo é só a transformação.
//
// Formato autoritativo (SPEC e1-lichess-rating-history-SPEC.md):
//   entrada  = [{ name: string, points: number[][] }]
//   point    = [ano, mes0, dia, rating]   (mes0 = 0-indexed, igual ao Date do JS)
//   saída    = [{ perf: string, points: [{ date: 'YYYY-MM-DD', rating }] }]
// Categorias relevantes: rapid, blitz, classical (case-insensitive).
// Bullet/UltraBullet/Correspondence/variantes são descartadas.

export type LichessRatingPoint = {
  date: string;
  rating: number;
};

export type LichessRatingSeries = {
  perf: string;
  points: LichessRatingPoint[];
};

// Categorias de jogo que importam pra eficácia (within-subject pré/pós).
// Canonical em lowercase pra casar com LichessAccountSummary.perfs.
const RELEVANT_PERFS = new Set<string>(['rapid', 'blitz', 'classical']);

// Parser puro: recebe o JSON cru do endpoint e devolve a série por categoria
// relevante. Degrada sem throw: entrada não-array → [], entrada/categoria/
// ponto malformado é descartado silenciosamente.
export function parseRatingHistory(value: unknown): LichessRatingSeries[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const series: LichessRatingSeries[] = [];

  for (const entry of value) {
    const parsed = parseEntry(entry);
    if (parsed !== undefined) {
      series.push(parsed);
    }
  }

  return series;
}

function parseEntry(entry: unknown): LichessRatingSeries | undefined {
  if (!isRecord(entry) || typeof entry.name !== 'string') {
    return undefined;
  }

  const perf = entry.name.trim().toLocaleLowerCase('en-US');
  if (!RELEVANT_PERFS.has(perf)) {
    // Categoria irrelevante (bullet/ultrabullet/correspondence/variantes).
    return undefined;
  }

  if (!Array.isArray(entry.points)) {
    // `points` malformado (não-array) → descarta a categoria inteira.
    return undefined;
  }

  const points: LichessRatingPoint[] = [];

  for (const raw of entry.points) {
    const point = parsePoint(raw);
    if (point !== undefined) {
      points.push(point);
    }
  }

  if (points.length === 0) {
    // Categoria vazia (points: []) ou só com pontos inválidos → descarta.
    return undefined;
  }

  return { perf, points };
}

function parsePoint(raw: unknown): LichessRatingPoint | undefined {
  // Ponto malformado (não-array ou com <4 números) → ignora o ponto.
  if (!Array.isArray(raw) || raw.length < 4) {
    return undefined;
  }

  // Array.isArray estreita pra any[]; reanoto como unknown[] e estreito cada
  // campo com typeof (lint strict proíbe usar valor `any`).
  const point = raw as unknown[];
  const year = point[0];
  const month0 = point[1];
  const day = point[2];
  const rating = point[3];

  if (
    typeof year !== 'number' ||
    typeof month0 !== 'number' ||
    typeof day !== 'number' ||
    typeof rating !== 'number' ||
    !Number.isFinite(year) ||
    !Number.isFinite(month0) ||
    !Number.isFinite(day) ||
    !Number.isFinite(rating)
  ) {
    return undefined;
  }

  const date = formatIsoDate(year, month0, day);
  if (date === undefined) {
    return undefined;
  }

  return { date, rating };
}

// Converte (ano, mes0, dia) → 'YYYY-MM-DD'. mes0 é 0-indexed na entrada;
// ISO usa mes+1. Ano com 4 dígitos (zero-pad), mes e dia com 2. Retorna
// undefined se mes0/dia estiverem fora do intervalo plausível.
function formatIsoDate(year: number, month0: number, day: number): string | undefined {
  const month = month0 + 1;

  if (month < 1 || month > 12) {
    return undefined;
  }

  if (day < 1 || day > 31) {
    return undefined;
  }

  const yyyy = String(year).padStart(4, '0');
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}
