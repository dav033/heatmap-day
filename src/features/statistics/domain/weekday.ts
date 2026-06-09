import type { DatedNumber } from './movingAverages';

export interface WeekdayStat {
  /** 0 = lunes, …, 6 = domingo. */
  weekday: number;
  mean: number;
  n: number;
}

/**
 * Promedio de una serie por día de la semana. No interpola: solo cuenta lo que
 * efectivamente está registrado.
 */
export function meanByWeekday(series: ReadonlyArray<DatedNumber>): WeekdayStat[] {
  const buckets: { sum: number; n: number }[] = Array.from({ length: 7 }, () => ({
    sum: 0,
    n: 0,
  }));
  for (const s of series) {
    const w = weekdayFromString(s.date);
    buckets[w]!.sum += s.value;
    buckets[w]!.n += 1;
  }
  return buckets.map((b, i) => ({
    weekday: i,
    mean: b.n === 0 ? Number.NaN : b.sum / b.n,
    n: b.n,
  }));
}

function weekdayFromString(s: string): number {
  // Zeller-like: día de la semana sin instanciar Date. Lunes = 0.
  const [y, m, d] = s.split('-').map(Number) as [number, number, number];
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const yy = m < 3 ? y - 1 : y;
  const dow = (yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) + t[m - 1]! + d) % 7;
  // dow: 0=domingo,1=lunes... -> queremos 0=lunes...6=domingo
  return (dow + 6) % 7;
}
