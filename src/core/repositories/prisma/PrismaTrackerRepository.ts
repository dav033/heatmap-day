import { endOfDay, startOfDay } from 'date-fns';
import type { PrismaClient, TrackerType as PrismaTrackerType } from '@prisma/client';

import type { Tracker, TrackerWindow } from '@/core/domain';
import type {
  NewTrackerInput,
  TrackerRepository,
  UpdateTrackerInput,
} from '@/core/repositories/interfaces';
import { fromDateString } from '@/core/lib/date';

import { mapTracker } from './mappers';

export class PrismaTrackerRepository implements TrackerRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(userId: string, opts?: { includeArchived?: boolean }): Promise<Tracker[]> {
    const rows = await this.db.tracker.findMany({
      where: {
        userId,
        ...(opts?.includeArchived ? {} : { archivedAt: null }),
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(mapTracker);
  }

  async listActiveOnDate(userId: string, dateISO: string): Promise<Tracker[]> {
    // Comparamos contra el día completo (no contra medianoche):
    //  - createdAt cuenta como "creado en este día" si ocurrió en cualquier momento del día.
    //  - archivedAt cuenta como "archivado en este día" si ocurrió en cualquier momento del día.
    // Por eso usamos fin-de-día como cota superior de createdAt y comienzo-de-día como cota inferior de archivedAt.
    const target = fromDateString(dateISO);
    const dayEnd = endOfDay(target);
    const dayStart = startOfDay(target);
    const rows = await this.db.tracker.findMany({
      where: {
        userId,
        createdAt: { lte: dayEnd },
        OR: [{ archivedAt: null }, { archivedAt: { gte: dayStart } }],
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(mapTracker);
  }

  async listWindows(
    userId: string,
    opts?: { includeArchived?: boolean },
  ): Promise<TrackerWindow[]> {
    const rows = await this.db.tracker.findMany({
      where: {
        userId,
        ...(opts?.includeArchived ? {} : { archivedAt: null }),
      },
      select: { id: true, createdAt: true, archivedAt: true },
    });
    return rows.map((r) => ({
      trackerId: r.id,
      createdAt: r.createdAt,
      archivedAt: r.archivedAt ?? undefined,
    }));
  }

  async getById(userId: string, trackerId: string): Promise<Tracker | null> {
    const row = await this.db.tracker.findFirst({ where: { id: trackerId, userId } });
    return row ? mapTracker(row) : null;
  }

  async create(userId: string, input: NewTrackerInput): Promise<Tracker> {
    const last = await this.db.tracker.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const row = await this.db.tracker.create({
      data: {
        userId,
        name: input.name,
        type: input.type as PrismaTrackerType,
        unit: input.unit ?? null,
        target: input.target ?? null,
        expectedPolarity: input.expectedPolarity ?? 'UNKNOWN',
        categoryId: input.categoryId ?? null,
        order: (last?.order ?? -1) + 1,
      },
    });
    return mapTracker(row);
  }

  async update(
    userId: string,
    trackerId: string,
    input: UpdateTrackerInput,
  ): Promise<Tracker> {
    const row = await this.db.tracker.update({
      where: { id: trackerId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.unit !== undefined ? { unit: input.unit } : {}),
        ...(input.target !== undefined ? { target: input.target } : {}),
        ...(input.expectedPolarity !== undefined
          ? { expectedPolarity: input.expectedPolarity }
          : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.type !== undefined ? { type: input.type as PrismaTrackerType } : {}),
      },
    });
    // Guarda contra updates a otros usuarios (Prisma update no filtra por userId)
    if (row.userId !== userId) {
      throw new Error('Tracker no pertenece al usuario');
    }
    return mapTracker(row);
  }

  async archive(userId: string, trackerId: string): Promise<Tracker> {
    const owned = await this.db.tracker.findFirst({ where: { id: trackerId, userId } });
    if (!owned) throw new Error('Tracker no encontrado');
    const row = await this.db.tracker.update({
      where: { id: trackerId },
      data: { archivedAt: new Date() },
    });
    return mapTracker(row);
  }

  async restore(userId: string, trackerId: string): Promise<Tracker> {
    const owned = await this.db.tracker.findFirst({ where: { id: trackerId, userId } });
    if (!owned) throw new Error('Tracker no encontrado');
    const row = await this.db.tracker.update({
      where: { id: trackerId },
      data: { archivedAt: null },
    });
    return mapTracker(row);
  }

  async reorder(userId: string, ids: string[]): Promise<void> {
    // Validamos que todos los ids pertenezcan al usuario para evitar reorder cruzado.
    const owned = await this.db.tracker.findMany({
      where: { id: { in: ids }, userId },
      select: { id: true },
    });
    if (owned.length !== ids.length) {
      throw new Error('Algún tracker no pertenece al usuario');
    }
    await this.db.$transaction(
      ids.map((id, index) =>
        this.db.tracker.update({ where: { id }, data: { order: index } }),
      ),
    );
  }

  async countValues(userId: string, trackerId: string): Promise<number> {
    const owned = await this.db.tracker.findFirst({ where: { id: trackerId, userId } });
    if (!owned) return 0;
    return this.db.trackerValue.count({ where: { trackerId } });
  }
}
