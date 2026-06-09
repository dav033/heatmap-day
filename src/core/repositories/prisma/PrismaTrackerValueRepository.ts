import type { PrismaClient } from '@prisma/client';

import type { TrackerType, TrackerValue } from '@/core/domain';
import type { DateRange, DateString } from '@/core/lib/date';
import type {
  TrackerValueRepository,
  TrackerValueWithDate,
} from '@/core/repositories/interfaces';

import { mapTrackerValue } from './mappers';

export class PrismaTrackerValueRepository implements TrackerValueRepository {
  constructor(private readonly db: PrismaClient) {}

  async listByDate(userId: string, date: DateString): Promise<TrackerValue[]> {
    const day = await this.db.dayEntry.findUnique({
      where: { userId_date: { userId, date } },
      include: { values: { include: { tracker: { select: { type: true, userId: true } } } } },
    });
    if (!day) return [];
    const out: TrackerValue[] = [];
    for (const v of day.values) {
      if (v.tracker.userId !== userId) continue;
      out.push(mapTrackerValue(v, v.tracker.type as TrackerType));
    }
    return out;
  }

  async upsert(userId: string, date: DateString, value: TrackerValue): Promise<void> {
    // Verifica que el tracker pertenezca al usuario y que el kind del valor
    // coincida con el type del tracker (estado imposible -> error explícito).
    const tracker = await this.db.tracker.findFirst({
      where: { id: value.trackerId, userId },
      select: { id: true, type: true },
    });
    if (!tracker) throw new Error('Tracker no pertenece al usuario');
    if (tracker.type !== value.kind) {
      throw new Error(
        `Discordancia: tracker es ${tracker.type} pero el valor es ${value.kind}`,
      );
    }

    const day = await this.db.dayEntry.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date },
      update: {},
      select: { id: true },
    });

    const payload =
      value.kind === 'CHECK'
        ? {
            boolValue: value.done,
            numericValue: null,
            quality: value.quality ?? null,
          }
        : { numericValue: value.value, boolValue: null, quality: null };

    await this.db.trackerValue.upsert({
      where: { dayEntryId_trackerId: { dayEntryId: day.id, trackerId: value.trackerId } },
      create: { dayEntryId: day.id, trackerId: value.trackerId, ...payload },
      update: payload,
    });
  }

  async remove(userId: string, date: DateString, trackerId: string): Promise<void> {
    const day = await this.db.dayEntry.findUnique({
      where: { userId_date: { userId, date } },
      select: { id: true },
    });
    if (!day) return;
    await this.db.trackerValue.deleteMany({
      where: { dayEntryId: day.id, trackerId },
    });
  }

  async listByTrackerInRange(
    userId: string,
    trackerId: string,
    range: DateRange,
  ): Promise<TrackerValueWithDate[]> {
    const tracker = await this.db.tracker.findFirst({
      where: { id: trackerId, userId },
      select: { type: true },
    });
    if (!tracker) return [];

    // Solo días con fila — la regla §6.1 ("no registrado ≠ 0") se respeta
    // simplemente porque no fabricamos valores faltantes.
    const rows = await this.db.trackerValue.findMany({
      where: {
        trackerId,
        day: { userId, date: { gte: range.start, lte: range.end } },
      },
      include: { day: { select: { date: true } } },
    });
    return rows.map((r) => ({
      date: r.day.date,
      value: mapTrackerValue(r, tracker.type as TrackerType),
    }));
  }

  async listAllValuesInRange(
    userId: string,
    range: DateRange,
  ): Promise<Map<string, TrackerValueWithDate[]>> {
    const trackers = await this.db.tracker.findMany({
      where: { userId },
      select: { id: true, type: true },
    });
    const typeById = new Map<string, TrackerType>(
      trackers.map((t) => [t.id, t.type as TrackerType]),
    );

    const rows = await this.db.trackerValue.findMany({
      where: {
        day: { userId, date: { gte: range.start, lte: range.end } },
      },
      include: { day: { select: { date: true } } },
    });

    const map = new Map<string, TrackerValueWithDate[]>();
    for (const r of rows) {
      const type = typeById.get(r.trackerId);
      if (!type) continue;
      const entry: TrackerValueWithDate = {
        date: r.day.date,
        value: mapTrackerValue(r, type),
      };
      const arr = map.get(r.trackerId);
      if (arr) arr.push(entry);
      else map.set(r.trackerId, [entry]);
    }
    return map;
  }
}
