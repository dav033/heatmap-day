import type { Tracker, TrackerValue } from '@/core/domain';
import type { DateString } from '@/core/lib/date';

import { clamp, gaussish, mulberry32, type Rng } from './prng';

export type Quality = 'bad' | 'medium' | 'good';

/**
 * Perfil de cada calidad: media/desvío para muestrear puntajes y la banda
 * donde debe caer el promedio final (malo < 6, medio 6–8, bueno > 8).
 * Las bandas dejan margen frente a los límites para que el redondeo a un
 * decimal no las rompa.
 */
interface QualityProfile {
  mean: number;
  sd: number;
  bandMin: number;
  bandMax: number;
}

const PROFILES: Record<Quality, QualityProfile> = {
  bad: { mean: 4.3, sd: 1.5, bandMin: 1.5, bandMax: 5.8 },
  medium: { mean: 7.0, sd: 0.9, bandMin: 6.1, bandMax: 7.9 },
  good: { mean: 8.9, sd: 0.6, bandMin: 8.1, bandMax: 9.8 },
};

export interface GeneratedDay {
  date: DateString;
  score: number;
  values: TrackerValue[];
}

function average(xs: number[]): number {
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

/**
 * Genera un día por fecha, con puntaje pseudoaleatorio según el perfil y
 * un valor por cada tracker activo, correlacionado con ese puntaje.
 * Misma semilla + mismas fechas + mismos trackers => mismo resultado.
 */
export function generateDays(
  dates: DateString[],
  trackers: Tracker[],
  quality: Quality,
  seed: number,
): GeneratedDay[] {
  const rng = mulberry32(seed);
  const p = PROFILES[quality];

  const scores = dates.map(() => clamp(gaussish(rng, p.mean, p.sd), 0, 10));

  // El muestreo (sobre todo con pocas fechas) puede dejar el promedio fuera de
  // la banda objetivo; se corrige empujando los puntajes hacia la media del perfil.
  for (let i = 0; i < 30; i++) {
    const mean = average(scores);
    if (mean >= p.bandMin && mean <= p.bandMax) break;
    const shift = (p.mean - mean) * 0.5;
    for (let j = 0; j < scores.length; j++) {
      scores[j] = clamp(scores[j] + shift, 0, 10);
    }
  }

  const rounded = scores.map((s) => Math.round(s * 10) / 10);

  // Plan alto/bajo balanceado para TODOS los trackers: garantiza que cada uno
  // tenga días "alto" y "bajo" en partes iguales dentro de cada mes calendario,
  // para que las estadísticas (que exigen ≥5 días por grupo en el rango) nunca
  // descarten un tracker. Para CHECK el flag es hecho/no-hecho; para SCALE y
  // COUNTER decide si el valor cae por encima o por debajo de su centro.
  const highDayPlans = new Map<string, Map<DateString, boolean>>();
  const centers = new Map<string, number>();
  for (const t of trackers) {
    highDayPlans.set(t.id, planHighDays(dates, rounded, t.expectedPolarity, rng));
    if (t.type === 'SCALE') {
      const avgTendency = average(
        rounded.map((s) => (t.expectedPolarity === 'NEGATIVE' ? 10 - s : s)),
      );
      centers.set(t.id, clamp(Math.round(avgTendency), 2, 8));
    } else if (t.type === 'COUNTER') {
      centers.set(t.id, 3);
    }
  }

  return dates.map((date, i) => ({
    date,
    score: rounded[i],
    values: valuesForDay(trackers, date, rounded[i], highDayPlans, centers, rng),
  }));
}

/**
 * Asigna alto/bajo por pares de días del mes calendario: (1,2), (3,4), …
 * Cada par completo recibe exactamente un día "alto", así cualquier ventana
 * "mes calendario" con ≥10 días de datos tiene ≥5 días en cada grupo y el
 * análisis de impacto siempre puede medir el tracker.
 *
 * La influencia no se pierde: dentro de cada par, el día con mejor puntaje se
 * lleva el "alto" (o el peor, si la polaridad es negativa), con un 20% de
 * pares invertidos como ruido.
 */
function planHighDays(
  dates: DateString[],
  scores: number[],
  polarity: Tracker['expectedPolarity'],
  rng: Rng,
): Map<DateString, boolean> {
  const done = new Map<DateString, boolean>();

  // Agrupa índices por par calendario: YYYY-MM + floor((día-1)/2).
  const pairs = new Map<string, number[]>();
  dates.forEach((d, i) => {
    const dayOfMonth = Number(d.slice(8, 10));
    const key = `${d.slice(0, 7)}-${Math.floor((dayOfMonth - 1) / 2)}`;
    const arr = pairs.get(key);
    if (arr) arr.push(i);
    else pairs.set(key, [i]);
  });

  for (const idxs of pairs.values()) {
    if (idxs.length === 2) {
      const [a, b] = idxs;
      let pick: number;
      if (scores[a] === scores[b]) {
        pick = rng() < 0.5 ? a : b;
      } else {
        const aIsBetter = scores[a] > scores[b];
        pick = aIsBetter === (polarity !== 'NEGATIVE') ? a : b;
      }
      if (rng() < 0.2) pick = pick === a ? b : a;
      done.set(dates[a], pick === a);
      done.set(dates[b], pick === b);
    } else {
      // Día suelto (día 31 o borde del rango generado): moneda al aire.
      for (const i of idxs) done.set(dates[i], rng() < 0.5);
    }
  }
  return done;
}

function valuesForDay(
  trackers: Tracker[],
  date: DateString,
  score: number,
  highDayPlans: Map<string, Map<DateString, boolean>>,
  centers: Map<string, number>,
  rng: Rng,
): TrackerValue[] {
  const out: TrackerValue[] = [];
  for (const t of trackers) {
    // Tendencia de lo registrado según el día. Con polaridad negativa se
    // invierte: un día malo implica mucho "sobrepensar" / "uso celular".
    const tendency = t.expectedPolarity === 'NEGATIVE' ? 10 - score : score;
    const isHighDay = highDayPlans.get(t.id)?.get(date) ?? rng() < 0.5;

    if (t.type === 'CHECK') {
      const check: Extract<TrackerValue, { kind: 'CHECK' }> = {
        trackerId: t.id,
        kind: 'CHECK',
        done: isHighDay,
      };
      if (isHighDay && rng() < 0.5) {
        check.quality = clamp(Math.round(gaussish(rng, tendency / 2, 0.8)), 1, 5);
      }
      out.push(check);
    } else {
      // SCALE / COUNTER: los días "alto" caen en [centro, centro+2] y los
      // "bajo" en [centro-3, centro-1]. Nunca se cruzan, así siempre existe un
      // corte balanceado para el análisis bajo/alto de las estadísticas.
      const center = centers.get(t.id) ?? 5;
      const offset = Math.floor(rng() * 3); // 0..2
      const value = isHighDay
        ? Math.min(10, center + offset)
        : Math.max(0, center - 1 - offset);
      out.push({ trackerId: t.id, kind: t.type as 'SCALE' | 'COUNTER', value });
    }
  }
  return out;
}
