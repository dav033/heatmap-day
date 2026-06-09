import type { PrismaClient } from '@prisma/client';

import type { Tag } from '@/core/domain';
import type { DateString } from '@/core/lib/date';
import type { TagRepository } from '@/core/repositories/interfaces';

import { mapTag } from './mappers';

export class PrismaTagRepository implements TagRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(userId: string): Promise<Tag[]> {
    const rows = await this.db.tag.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
    return rows.map(mapTag);
  }

  async findOrCreate(userId: string, name: string, color?: string): Promise<Tag> {
    const existing = await this.db.tag.findFirst({ where: { userId, name } });
    if (existing) return mapTag(existing);
    const row = await this.db.tag.create({
      data: { userId, name, color: color ?? null },
    });
    return mapTag(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    const owned = await this.db.tag.findFirst({ where: { id, userId } });
    if (!owned) return;
    await this.db.tag.delete({ where: { id } });
  }

  async attachToDay(userId: string, date: DateString, tagId: string): Promise<void> {
    const tag = await this.db.tag.findFirst({ where: { id: tagId, userId } });
    if (!tag) throw new Error('Tag no pertenece al usuario');
    const day = await this.db.dayEntry.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date },
      update: {},
      select: { id: true },
    });
    await this.db.dayTag.upsert({
      where: { dayEntryId_tagId: { dayEntryId: day.id, tagId } },
      create: { dayEntryId: day.id, tagId },
      update: {},
    });
  }

  async detachFromDay(userId: string, date: DateString, tagId: string): Promise<void> {
    const day = await this.db.dayEntry.findUnique({
      where: { userId_date: { userId, date } },
      select: { id: true },
    });
    if (!day) return;
    await this.db.dayTag.deleteMany({ where: { dayEntryId: day.id, tagId } });
  }

  async listForDay(userId: string, date: DateString): Promise<string[]> {
    const day = await this.db.dayEntry.findUnique({
      where: { userId_date: { userId, date } },
      include: { tags: true },
    });
    if (!day) return [];
    return day.tags.map((t) => t.tagId);
  }
}
