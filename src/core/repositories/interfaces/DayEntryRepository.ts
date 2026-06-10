import type { DateString, DateRange } from '@/core/lib/date';
import type { DayEntry, DayScore } from '@/core/domain';

export interface DayEntryRepository {
  /**
   * Devuelve el día completo (con valores y tagIds) o null si no existe.
   */
  getByDate(userId: string, date: DateString): Promise<DayEntry | null>;

  /**
   * Versión ligera para el heatmap: solo `date`, `score`, `predictedScore`.
   * No incluye días sin fila — el calendario los renderiza como vacíos.
   */
  getScoresInRange(userId: string, range: DateRange): Promise<DayScore[]>;

  /**
   * Todos los días del usuario (con valores y tagIds), ordenados por fecha.
   * Pensado para export/backup; no usar en vistas paginadas.
   */
  listAll(userId: string): Promise<DayEntry[]>;

  /**
   * Setea el puntaje manual del día (crea la fila DayEntry si no existe).
   * Pasar `score = null` borra el puntaje sin borrar la fila.
   */
  upsertScore(userId: string, date: DateString, score: number | null): Promise<void>;

  /**
   * Setea la nota libre del día.
   */
  upsertNote(userId: string, date: DateString, note: string | null): Promise<void>;

  /**
   * Guardado del puntaje predicho. La predicción se calcula en su feature aparte.
   */
  setPredictedScore(userId: string, date: DateString, predicted: number | null): Promise<void>;

  /**
   * Borra por completo el día: la fila DayEntry y, en cascada, sus
   * TrackerValue y DayTag asociados. Si el día no existía, no-op.
   */
  deleteByDate(userId: string, date: DateString): Promise<void>;
}
