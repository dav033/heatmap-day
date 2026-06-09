import type { DatedNumber } from './movingAverages';

/**
 * Racha = secuencia de días consecutivos en los que un valor cumple un
 * predicado. Es lo más fiel posible al concepto de "varios días seguidos…".
 *
 * Importante: una serie con HUECOS (días sin registrar) rompe la racha en ese
 * hueco. Esto es coherente con la regla §6.1: no inventamos días.
 */
export interface Streak {
  startDate: string;
  endDate: string;
  length: number;
  /** Valores que componen la racha, en orden cronológico. */
  values: number[];
}

export function findStreaks(
  series: ReadonlyArray<DatedNumber>,
  predicate: (v: number) => boolean,
): Streak[] {
  if (series.length === 0) return [];
  const out: Streak[] = [];
  let current: { startIdx: number; values: number[] } | null = null;

  const flush = (endIdx: number) => {
    if (!current) return;
    const startDate = series[current.startIdx]!.date;
    const endDate = series[endIdx]!.date;
    out.push({ startDate, endDate, length: current.values.length, values: current.values });
    current = null;
  };

  for (let i = 0; i < series.length; i++) {
    const p = series[i]!;
    const consecutive =
      current !== null && isConsecutiveDay(series[i - 1]!.date, p.date);
    if (predicate(p.value) && (current === null || consecutive)) {
      if (current === null) current = { startIdx: i, values: [p.value] };
      else current.values.push(p.value);
    } else {
      flush(i - 1);
      if (predicate(p.value)) current = { startIdx: i, values: [p.value] };
    }
  }
  flush(series.length - 1);
  return out;
}

/**
 * Compara dos fechas YYYY-MM-DD y devuelve si la segunda es justo el día
 * siguiente. Evita instanciar Date para no caer en problemas de timezone.
 */
function isConsecutiveDay(prev: string, next: string): boolean {
  const a = toDayNumber(prev);
  const b = toDayNumber(next);
  return b - a === 1;
}

function toDayNumber(s: string): number {
  // Días desde la "época" Gregoriana proleptic (Rata Die). Suficiente para
  // comparar consecutividad sin tocar Date.
  const [y, m, d] = s.split('-').map(Number) as [number, number, number];
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}
