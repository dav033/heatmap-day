import { startOfDay } from 'date-fns';

import { fromDateString, type DateString } from '@/core/lib/date';

import type { TrackerWindow } from './tracker';
import type { TrackerValue } from './tracker';

/**
 * Filtra los valores de un tracker para que entren a las estadísticas SOLO si
 * están dentro de su ventana de vida (§6.1):
 *   - fecha ≥ tracker.createdAt
 *   - si está archivado, fecha ≤ tracker.archivedAt
 *
 * La comparación es date-only: si un tracker se creó hoy a las 14:30, su valor
 * registrado hoy SÍ entra (lo que cuenta es el día, no la hora exacta).
 *
 * Esta función NO inventa días faltantes. "No registrado" sigue siendo no
 * registrado: el llamador ya recibe solo filas que existen.
 */
export interface DatedValue {
  date: DateString;
  value: TrackerValue;
}

export function filterValuesByWindow(
  values: ReadonlyArray<DatedValue>,
  window: TrackerWindow,
): DatedValue[] {
  const createdDay = startOfDay(window.createdAt);
  const archivedDay = window.archivedAt ? startOfDay(window.archivedAt) : null;
  return values.filter((v) => {
    const d = fromDateString(v.date);
    if (d < createdDay) return false;
    if (archivedDay && d > archivedDay) return false;
    return true;
  });
}
