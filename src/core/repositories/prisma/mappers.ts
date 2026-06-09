import type {
  Category as PrismaCategory,
  DayEntry as PrismaDayEntry,
  DayTag as PrismaDayTag,
  Tag as PrismaTag,
  Tracker as PrismaTracker,
  TrackerValue as PrismaTrackerValue,
} from '@prisma/client';

import type {
  Category,
  DayEntry,
  Polarity,
  Tag,
  Tracker,
  TrackerType,
  TrackerValue,
} from '@/core/domain';

/**
 * Mapeo Prisma -> Domain. El dominio nunca expone tipos del ORM.
 * Centralizar acá evita filtrar detalles de persistencia hacia el resto del código.
 */

export function mapTracker(row: PrismaTracker): Tracker {
  return {
    id: row.id,
    name: row.name,
    type: row.type as TrackerType,
    unit: row.unit ?? undefined,
    target: row.target ?? undefined,
    expectedPolarity: row.expectedPolarity as Polarity,
    categoryId: row.categoryId ?? undefined,
    order: row.order,
    createdAt: row.createdAt,
    archivedAt: row.archivedAt ?? undefined,
  };
}

export function mapCategory(row: PrismaCategory): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color ?? undefined,
    order: row.order,
  };
}

export function mapTag(row: PrismaTag): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color ?? undefined,
  };
}

/**
 * Construye un TrackerValue (unión discriminada) a partir de la fila + el tipo
 * del tracker. Necesita el `type` porque Prisma guarda boolean y number en
 * columnas separadas y el discriminante vive en el Tracker.
 */
export function mapTrackerValue(row: PrismaTrackerValue, type: TrackerType): TrackerValue {
  switch (type) {
    case 'CHECK':
      return {
        trackerId: row.trackerId,
        kind: 'CHECK',
        done: row.boolValue ?? false,
        ...(row.quality != null ? { quality: row.quality } : {}),
      };
    case 'SCALE':
      return { trackerId: row.trackerId, kind: 'SCALE', value: row.numericValue ?? 0 };
    case 'COUNTER':
      return { trackerId: row.trackerId, kind: 'COUNTER', value: row.numericValue ?? 0 };
  }
}

/**
 * Mapea un DayEntry. Necesita acceso a las definiciones de tracker para
 * resolver el `type` de cada valor.
 */
export function mapDayEntry(
  row: PrismaDayEntry & { values: PrismaTrackerValue[]; tags: PrismaDayTag[] },
  trackerTypeById: Map<string, TrackerType>,
): DayEntry {
  const values: TrackerValue[] = [];
  for (const v of row.values) {
    const type = trackerTypeById.get(v.trackerId);
    if (!type) continue; // tracker desaparecido / inconsistencia: ignoramos
    values.push(mapTrackerValue(v, type));
  }
  return {
    id: row.id,
    date: row.date,
    score: row.score ?? undefined,
    note: row.note ?? undefined,
    predictedScore: row.predictedScore ?? undefined,
    values,
    tagIds: row.tags.map((t) => t.tagId),
  };
}
