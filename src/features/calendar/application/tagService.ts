import { getCurrentUserId } from '@/core/config/user';
import type { Tag } from '@/core/domain';
import { repos } from '@/core/repositories/prisma';

export async function listTags(): Promise<Tag[]> {
  const userId = await getCurrentUserId();
  return repos.tags.list(userId);
}

export async function findOrCreateTag(name: string, color?: string): Promise<Tag> {
  const userId = await getCurrentUserId();
  return repos.tags.findOrCreate(userId, name, color);
}

export async function attachTag(date: string, tagId: string): Promise<void> {
  const userId = await getCurrentUserId();
  await repos.tags.attachToDay(userId, date, tagId);
}

export async function detachTag(date: string, tagId: string): Promise<void> {
  const userId = await getCurrentUserId();
  await repos.tags.detachFromDay(userId, date, tagId);
}

export async function listTagIdsForDay(date: string): Promise<string[]> {
  const userId = await getCurrentUserId();
  return repos.tags.listForDay(userId, date);
}
