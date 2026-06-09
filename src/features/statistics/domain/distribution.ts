/**
 * Distribución de puntajes en bins de ancho 1 (0..10).
 */
export interface ScoreBin {
  from: number;
  to: number;
  count: number;
}

export function scoreDistribution(scores: ReadonlyArray<number>): ScoreBin[] {
  const bins: ScoreBin[] = [];
  for (let i = 0; i < 10; i++) bins.push({ from: i, to: i + 1, count: 0 });
  for (const s of scores) {
    if (!Number.isFinite(s)) continue;
    if (s < 0 || s > 10) continue;
    const idx = Math.min(9, Math.floor(s));
    bins[idx]!.count += 1;
  }
  return bins;
}

export function median(xs: ReadonlyArray<number>): number | null {
  if (xs.length === 0) return null;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}
