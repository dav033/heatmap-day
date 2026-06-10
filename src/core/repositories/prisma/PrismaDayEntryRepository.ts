import type { PrismaClient } from '@prisma/client';

import type { DayEntry, DayScore, TrackerType } from '@/core/domain';
import type { DateRange, DateString } from '@/core/lib/date';
import type { DayEntryRepository } from '@/core/repositories/interfaces';

import { mapDayEntry } from './mappers';

// Trae el tipo del tracker junto a cada valor: evita escanear la tabla de
// trackers completa para resolver el discriminante de la unión TrackerValue.
const DAY_INCLUDE = {
  values: { include: { tracker: { select: { type: true } } } },
  tags: true,
} as const;

function trackerTypeMap(
  values: ReadonlyArray<{ trackerId: string; tracker: { type: string } }>,
): Map<string, TrackerType> {
  return new Map(values.map((v) => [v.trackerId, v.tracker.type as TrackerType]));
}

export class PrismaDayEntryRepository implements DayEntryRepository {
  constructor(private readonly db: PrismaClient) {}

  async getByDate(userId: string, date: DateString): Promise<DayEntry | null> {
    const row = await this.db.dayEntry.findUnique({
      where: { userId_date: { userId, date } },
      include: DAY_INCLUDE,
    });
    if (!row) return null;
    return mapDayEntry(row, trackerTypeMap(row.values));
  }

  async listAll(userId: string): Promise<DayEntry[]> {
    const rows = await this.db.dayEntry.findMany({
      where: { userId },
      include: DAY_INCLUDE,
      orderBy: { date: 'asc' },
    });
    return rows.map((row) => mapDayEntry(row, trackerTypeMap(row.values)));
  }

  async getScoresInRange(userId: string, range: DateRange): Promise<DayScore[]> {
    const rows = await this.db.dayEntry.findMany({
      where: { userId, date: { gte: range.start, lte: range.end } },
      select: { date: true, score: true, predictedScore: true },
      orderBy: { date: 'asc' },
    });
    return rows.map((r) => ({
      date: r.date,
      score: r.score ?? undefined,
      predictedScore: r.predictedScore ?? undefined,
    }));
  }

  async upsertScore(
    userId: string,
    date: DateString,
    score: number | null,
  ): Promise<void> {
    await this.db.dayEntry.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, score: score ?? null },
      update: { score: score ?? null },
    });
  }

  async upsertNote(
    userId: string,
    date: DateString,
    note: string | null,
  ): Promise<void> {
    await this.db.dayEntry.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, note: note ?? null },
      update: { note: note ?? null },
    });
  }

  async setPredictedScore(
    userId: string,
    date: DateString,
    predicted: number | null,
  ): Promise<void> {
    await this.db.dayEntry.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, predictedScore: predicted ?? null },
      update: { predictedScore: predicted ?? null },
    });
  }

  async deleteByDate(userId: string, date: DateString): Promise<void> {
    // onDelete: Cascade en TrackerValue y DayTag se encarga del resto.
    await this.db.dayEntry.deleteMany({ where: { userId, date } });
  }
}
