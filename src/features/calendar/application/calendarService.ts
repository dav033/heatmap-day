import { getCurrentUserId } from '@/core/config/user';
import type { DayEntry, DayScore } from '@/core/domain';
import type { DateRange, DateString } from '@/core/lib/date';
import { repos } from '@/core/repositories/prisma';

/**
 * Servicios de la feature `calendar`. Solo orquesta repositorios — sin lógica
 * de UI ni acceso directo a Prisma. La validación de inputs vive en `api`.
 */

export async function getScoresInRange(range: DateRange): Promise<DayScore[]> {
  const userId = await getCurrentUserId();
  return repos.dayEntries.getScoresInRange(userId, range);
}

export async function getDayEntry(date: DateString): Promise<DayEntry | null> {
  const userId = await getCurrentUserId();
  return repos.dayEntries.getByDate(userId, date);
}

export async function setDayScore(date: DateString, score: number | null): Promise<void> {
  const userId = await getCurrentUserId();
  await repos.dayEntries.upsertScore(userId, date, score);
}

export async function setDayNote(date: DateString, note: string | null): Promise<void> {
  const userId = await getCurrentUserId();
  await repos.dayEntries.upsertNote(userId, date, note);
}

export async function deleteDay(date: DateString): Promise<void> {
  const userId = await getCurrentUserId();
  await repos.dayEntries.deleteByDate(userId, date);
}
