import type { Polarity, Tracker, TrackerType, TrackerWindow } from '@/core/domain';

export interface NewTrackerInput {
  name: string;
  type: TrackerType;
  unit?: string;
  target?: number;
  expectedPolarity?: Polarity;
  categoryId?: string;
}

export interface UpdateTrackerInput {
  name?: string;
  unit?: string | null;
  target?: number | null;
  expectedPolarity?: Polarity;
  categoryId?: string | null;
  type?: TrackerType; // solo se permite si no hay valores; la application capa lo controla
}

export interface TrackerRepository {
  /**
   * Lista trackers de un usuario. Por defecto, solo los activos (no archivados).
   */
  list(userId: string, opts?: { includeArchived?: boolean }): Promise<Tracker[]>;

  /**
   * Trackers activos en una fecha dada (createdAt ≤ fecha y no archivados antes).
   * Util para la pantalla de captura diaria.
   */
  listActiveOnDate(userId: string, dateISO: string): Promise<Tracker[]>;

  /**
   * Solo las ventanas de vida — útil para las estadísticas, no necesita el resto.
   */
  listWindows(userId: string, opts?: { includeArchived?: boolean }): Promise<TrackerWindow[]>;

  getById(userId: string, trackerId: string): Promise<Tracker | null>;

  create(userId: string, input: NewTrackerInput): Promise<Tracker>;

  update(userId: string, trackerId: string, input: UpdateTrackerInput): Promise<Tracker>;

  /**
   * Soft-archive. No borra valores históricos.
   */
  archive(userId: string, trackerId: string): Promise<Tracker>;

  /**
   * Vuelve a activar un tracker archivado.
   */
  restore(userId: string, trackerId: string): Promise<Tracker>;

  /**
   * Reordena la lista de trackers. Recibe `ids` en el orden deseado.
   */
  reorder(userId: string, ids: string[]): Promise<void>;

  /**
   * Cuántos valores tiene un tracker. Sirve para permitir/no `cambiar tipo`.
   */
  countValues(userId: string, trackerId: string): Promise<number>;
}
