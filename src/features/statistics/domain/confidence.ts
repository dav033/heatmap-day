/**
 * Etiqueta de confianza según tamaño muestral. Para no afirmar patrones con
 * muestras diminutas (ver §8 "Guardas").
 */
export type Confidence = 'insufficient' | 'preliminary' | 'consistent';

export const MIN_SAMPLE_PRELIMINARY = 5;
export const MIN_SAMPLE_CONSISTENT = 15;

export function confidenceFor(n: number): Confidence {
  if (n < MIN_SAMPLE_PRELIMINARY) return 'insufficient';
  if (n < MIN_SAMPLE_CONSISTENT) return 'preliminary';
  return 'consistent';
}
