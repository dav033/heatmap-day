import type { DateString } from '@/core/lib/date';

import type { TrackerValue } from './tracker';

/**
 * Día puntuado. El score es manual; `predictedScore` viene del módulo de predicción.
 * Importante: `values` contiene solo lo registrado (la ausencia de fila ≠ "0").
 */
export interface DayEntry {
  id: string;
  date: DateString;
  score?: number;
  note?: string;
  predictedScore?: number;
  values: TrackerValue[];
  tagIds: string[];
}

/**
 * Versión "ligera" sin trackerValues, usada por el calendario que solo necesita
 * el score por celda.
 */
export interface DayScore {
  date: DateString;
  score?: number;
  predictedScore?: number;
}
