/**
 * Mapeo puntaje (0–10) -> color del heatmap.
 * Gradiente rojo -> naranja -> amarillo -> verde. Días sin puntaje -> neutro.
 * Función pura: testeable; sin dependencias de UI.
 */
export const SCORE_MIN = 0;
export const SCORE_MAX = 10;

// Anclas del gradiente (color en sRGB hex).
const STOPS: ReadonlyArray<{ at: number; color: [number, number, number] }> = [
  { at: 0, color: [191, 41, 33] }, // rojo intenso
  { at: 3, color: [217, 102, 36] }, // naranja
  { at: 5, color: [212, 168, 33] }, // amarillo
  { at: 7, color: [99, 173, 70] }, // verde medio
  { at: 10, color: [42, 142, 51] }, // verde óptimo
];

export const COLOR_EMPTY = '#1f1f24'; // neutro para "sin puntaje"

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function toHex(rgb: readonly [number, number, number]): string {
  const [r, g, b] = rgb.map((c) => clamp(Math.round(c), 0, 255));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export function scoreToColor(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) return COLOR_EMPTY;
  const s = clamp(score, SCORE_MIN, SCORE_MAX);
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i]!;
    const b = STOPS[i + 1]!;
    if (s >= a.at && s <= b.at) {
      const t = (s - a.at) / (b.at - a.at);
      const rgb: [number, number, number] = [
        lerp(a.color[0], b.color[0], t),
        lerp(a.color[1], b.color[1], t),
        lerp(a.color[2], b.color[2], t),
      ];
      return toHex(rgb);
    }
  }
  return toHex(STOPS[STOPS.length - 1]!.color);
}
