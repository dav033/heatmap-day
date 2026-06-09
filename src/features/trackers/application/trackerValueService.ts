import { getCurrentUserId } from '@/core/config/user';
import type { TrackerValue } from '@/core/domain';
import { repos } from '@/core/repositories/prisma';

export async function listValuesForDate(date: string): Promise<TrackerValue[]> {
  const userId = await getCurrentUserId();
  return repos.trackerValues.listByDate(userId, date);
}

export async function upsertValue(date: string, value: TrackerValue): Promise<void> {
  const userId = await getCurrentUserId();
  await repos.trackerValues.upsert(userId, date, value);
}

export async function removeValue(date: string, trackerId: string): Promise<void> {
  const userId = await getCurrentUserId();
  await repos.trackerValues.remove(userId, date, trackerId);
}
