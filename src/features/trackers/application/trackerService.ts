import { getCurrentUserId } from '@/core/config/user';
import type { Tracker } from '@/core/domain';
import type {
  NewTrackerInput,
  UpdateTrackerInput,
} from '@/core/repositories/interfaces';
import { repos } from '@/core/repositories/prisma';

export async function listTrackers(opts?: { includeArchived?: boolean }): Promise<Tracker[]> {
  const userId = await getCurrentUserId();
  return repos.trackers.list(userId, opts);
}

export async function listActiveTrackersOn(date: string): Promise<Tracker[]> {
  const userId = await getCurrentUserId();
  return repos.trackers.listActiveOnDate(userId, date);
}

export async function createTracker(input: NewTrackerInput): Promise<Tracker> {
  const userId = await getCurrentUserId();
  return repos.trackers.create(userId, input);
}

export async function updateTracker(
  trackerId: string,
  input: UpdateTrackerInput,
): Promise<Tracker> {
  const userId = await getCurrentUserId();

  // Cambio de tipo: solo permitido si el tracker no tiene valores aún.
  if (input.type !== undefined) {
    const count = await repos.trackers.countValues(userId, trackerId);
    if (count > 0) {
      throw new Error('No se puede cambiar el tipo de un tracker con datos registrados.');
    }
  }
  return repos.trackers.update(userId, trackerId, input);
}

export async function archiveTracker(trackerId: string): Promise<Tracker> {
  const userId = await getCurrentUserId();
  return repos.trackers.archive(userId, trackerId);
}

export async function restoreTracker(trackerId: string): Promise<Tracker> {
  const userId = await getCurrentUserId();
  return repos.trackers.restore(userId, trackerId);
}

export async function reorderTrackers(ids: string[]): Promise<void> {
  const userId = await getCurrentUserId();
  await repos.trackers.reorder(userId, ids);
}
