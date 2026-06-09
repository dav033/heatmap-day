import type { TrackerValue } from '@/core/domain';
import type { DateRange, DateString } from '@/core/lib/date';

/**
 * Snapshot crudo: un valor + su fecha. El motor de estadísticas necesita poder
 * cruzar el valor con el `score` del día y con la ventana del tracker.
 */
export interface TrackerValueWithDate {
  date: DateString;
  value: TrackerValue;
}

export interface TrackerValueRepository {
  /**
   * Valores registrados para un día (por DayEntryId o por fecha).
   */
  listByDate(userId: string, date: DateString): Promise<TrackerValue[]>;

  /**
   * Upsert por (dayEntry, tracker). Si el día no existe, lo crea.
   * Importante: el llamador es quien construye un `TrackerValue` consistente con
   * el `type` del tracker (kind === type).
   */
  upsert(userId: string, date: DateString, value: TrackerValue): Promise<void>;

  /**
   * Borra una fila de valor (vuelve a "no registrado").
   */
  remove(userId: string, date: DateString, trackerId: string): Promise<void>;

  /**
   * Para estadísticas: trae los valores de un tracker dentro de un rango.
   * Solo devuelve filas existentes (regla §6.1: "no registrado ≠ 0"). La
   * application capa filtra además por la ventana del tracker.
   */
  listByTrackerInRange(
    userId: string,
    trackerId: string,
    range: DateRange,
  ): Promise<TrackerValueWithDate[]>;

  /**
   * Para estadísticas (performance): trae TODOS los valores de TODOS los
   * trackers de un usuario dentro de un rango, agrupados por trackerId.
   * Una sola query en vez de N queries (una por tracker).
   */
  listAllValuesInRange(
    userId: string,
    range: DateRange,
  ): Promise<Map<string, TrackerValueWithDate[]>>;
}
