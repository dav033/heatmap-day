import { mean } from './correlation';

/**
 * Tendencia: pendiente de una regresión lineal simple `y ~ a + b * t`, donde
 * `t` es el índice del día en la serie. Útil para decir "el puntaje viene bajando".
 */
export function trendSlope(values: ReadonlyArray<number>): number | null {
  const n = values.length;
  if (n < 3) return null;
  const xs = Array.from({ length: n }, (_, i) => i);
  const mx = mean(xs);
  const my = mean(values);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i]! - mx) * (values[i]! - my);
    den += (xs[i]! - mx) ** 2;
  }
  if (den === 0) return null;
  return num / den;
}
