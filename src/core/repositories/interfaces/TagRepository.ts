import type { Tag } from '@/core/domain';
import type { DateString } from '@/core/lib/date';

export interface TagRepository {
  list(userId: string): Promise<Tag[]>;
  findOrCreate(userId: string, name: string, color?: string): Promise<Tag>;
  remove(userId: string, id: string): Promise<void>;

  attachToDay(userId: string, date: DateString, tagId: string): Promise<void>;
  detachFromDay(userId: string, date: DateString, tagId: string): Promise<void>;
  listForDay(userId: string, date: DateString): Promise<string[]>;
}
