/**
 * Media móvil simple sobre una serie indexada por fecha. NO inventa días: si
 * faltan filas, esos días no aparecen en la salida.
 */
export interface DatedNumber {
  date: string;
  value: number;
}

export function movingAverage(
  series: ReadonlyArray<DatedNumber>,
  window: number,
): DatedNumber[] {
  if (window <= 0) throw new Error('window debe ser > 0');
  if (series.length === 0) return [];
  const out: DatedNumber[] = [];
  for (let i = 0; i < series.length; i++) {
    const from = Math.max(0, i - window + 1);
    const slice = series.slice(from, i + 1);
    if (slice.length < window) continue; // solo emitimos cuando se completa la ventana
    let sum = 0;
    for (const s of slice) sum += s.value;
    out.push({ date: series[i]!.date, value: sum / slice.length });
  }
  return out;
}
