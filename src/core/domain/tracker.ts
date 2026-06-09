/**
 * Tipos del dominio para Tracker y su valor diario.
 * Las uniones discriminadas garantizan que un `TrackerValue` solo lleve los
 * datos relevantes para su tipo, evitando estados imposibles.
 */
export type TrackerType = 'CHECK' | 'SCALE' | 'COUNTER';
export type Polarity = 'POSITIVE' | 'NEGATIVE' | 'UNKNOWN';

export interface Tracker {
  id: string;
  name: string;
  type: TrackerType;
  unit?: string;
  target?: number;
  expectedPolarity: Polarity;
  categoryId?: string;
  order: number;
  createdAt: Date;
  archivedAt?: Date;
}

export type TrackerValue =
  | { trackerId: string; kind: 'CHECK'; done: boolean; quality?: number } // quality 1-5
  | { trackerId: string; kind: 'SCALE'; value: number } // 0..10
  | { trackerId: string; kind: 'COUNTER'; value: number };

/**
 * Define la ventana de vida de un tracker. Se usa para filtrar qué días entran
 * a las estadísticas (§6.1, "no registrado ≠ 0").
 */
export interface TrackerWindow {
  trackerId: string;
  createdAt: Date;
  archivedAt?: Date;
}
