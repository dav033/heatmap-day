export type Rng = () => number;

/**
 * Mulberry32: PRNG determinista de 32 bits. Con la misma semilla produce
 * exactamente la misma secuencia, lo que hace reproducibles los datos de prueba.
 */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Aproximación a una normal (promedio de 3 uniformes, re-escalado a la sd
 * pedida). Suficiente para datos de prueba; acota a ±3 sd por construcción.
 */
export function gaussish(rng: Rng, mean: number, sd: number): number {
  const u = (rng() + rng() + rng()) / 3; // media 0.5, sd ≈ 0.1667
  return mean + ((u - 0.5) / 0.1667) * sd;
}

export function clamp(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}
