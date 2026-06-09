import type { PrismaClient } from '@prisma/client';

import type { DayEntry, DayScore, TrackerType } from '@/core/domain';
import type { DateRange, DateString } from '@/core/lib/date';
import type { DayEntryRepository } from '@/core/repositories/interfaces';

import { mapDayEntry } from './mappers';

export class PrismaDayEntryRepository implements DayEntryRepository {
  constructor(private readonly db: PrismaClient) {}

  async getByDate(userId: string, date: DateString): Promise<DayEntry | null> {
    const row = await this.db.dayEntry.findUnique({
      where: { userId_date: { userId, date } },
      include: { values: true, tags: true },
    });
    if (!row) return null;
    const trackers = await this.db.tracker.findMany({
      where: { userId },
      select: { id: true, type: true },
    });
    const map = new Map<string, TrackerType>(
      trackers.map((t) => [t.id, t.type as TrackerType]),
    );
    return mapDayEntry(row, map);
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
  ): Promise<DayEntry> {
    await this.db.dayEntry.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, score: score ?? null },
      update: { score: score ?? null },
    });
    const out = await this.getByDate(userId, date);
    if (!out) throw new Error('DayEntry desapareció tras upsert');
    return out;
  }

  async upsertNote(
    userId: string,
    date: DateString,
    note: string | null,
  ): Promise<DayEntry> {
    await this.db.dayEntry.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, note: note ?? null },
      update: { note: note ?? null },
    });
    const out = await this.getByDate(userId, date);
    if (!out) throw new Error('DayEntry desapareció tras upsert');
    return out;
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
