import { mean } from './correlation';

/**
 * Compara el promedio de `scores` cuando un predicado es verdadero vs falso.
 * Devuelve null si alguno de los grupos no llega al tamaño mínimo.
 */
export interface GroupCompareResult {
  meanTrue: number;
  meanFalse: number;
  delta: number; // meanTrue - meanFalse
  nTrue: number;
  nFalse: number;
}

export function compareGroups(
  pairs: ReadonlyArray<{ pred: boolean; score: number }>,
  minPerGroup: number,
): GroupCompareResult | null {
  const yes: number[] = [];
  const no: number[] = [];
  for (const p of pairs) (p.pred ? yes : no).push(p.score);
  if (yes.length < minPerGroup || no.length < minPerGroup) return null;
  const mt = mean(yes);
  const mf = mean(no);
  return { meanTrue: mt, meanFalse: mf, delta: mt - mf, nTrue: yes.length, nFalse: no.length };
}
