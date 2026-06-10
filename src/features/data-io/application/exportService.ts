import { getCurrentUserId } from '@/core/config/user';
import type { Category, DayEntry, Tag, Tracker } from '@/core/domain';
import { repos } from '@/core/repositories/prisma';

/**
 * Exportación completa de los datos del usuario a un bundle JSON.
 * Incluye trackers archivados: el objetivo es backup/portabilidad sin pérdida.
 * El campo `format`/`version` permite validar el archivo al importarlo.
 */
export interface ExportBundle {
  format: 'dayscore-export';
  version: 1;
  exportedAt: string;
  trackers: Tracker[];
  categories: Category[];
  tags: Tag[];
  days: DayEntry[];
}

export async function buildExportBundle(): Promise<ExportBundle> {
  const userId = await getCurrentUserId();
  const [trackers, categories, tags, days] = await Promise.all([
    repos.trackers.list(userId, { includeArchived: true }),
    repos.categories.list(userId),
    repos.tags.list(userId),
    repos.dayEntries.listAll(userId),
  ]);
  return {
    format: 'dayscore-export',
    version: 1,
    exportedAt: new Date().toISOString(),
    trackers,
    categories,
    tags,
    days,
  };
}
