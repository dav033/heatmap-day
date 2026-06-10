import { getCurrentUserId } from '@/core/config/user';
import { prisma } from '@/core/db/prisma';
import type { TrackerValue } from '@/core/domain';
import {
  fromDateString,
  shiftDays,
  toDateString,
  todayString,
  type DateString,
} from '@/core/lib/date';
import { repos } from '@/core/repositories/prisma';

import { generateDays, type GeneratedDay, type Quality } from './generator';

export type { Quality };

export interface TestDataResult {
  quality: Quality;
  seed: number;
  dates: DateString[];
  meanScore: number;
  /** Solo en `createTestRecord`: cuántos días había antes de borrarlos. */
  deletedDays?: number;
}

const RECORD_DAYS = 30;
const SEARCH_LIMIT_DAYS = 3650;

function newSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}

function valueRow(v: TrackerValue) {
  if (v.kind === 'CHECK') {
    return { trackerId: v.trackerId, boolValue: v.done, quality: v.quality ?? null };
  }
  return { trackerId: v.trackerId, numericValue: v.value };
}

/**
 * Herramienta solo de desarrollo: escribe en bloque con Prisma directo porque
 * los repos no exponen operaciones masivas y no vale la pena ampliarlos para
 * datos de prueba.
 */
async function insertGeneratedDays(userId: string, days: GeneratedDay[]): Promise<void> {
  await prisma.$transaction(
    days.map((d) =>
      prisma.dayEntry.create({
        data: {
          userId,
          date: d.date,
          score: d.score,
          values: { create: d.values.map(valueRow) },
        },
      }),
    ),
  );
}

async function generateAndInsert(
  userId: string,
  dates: DateString[],
  quality: Quality,
  seed: number,
): Promise<TestDataResult> {
  const trackers = await repos.trackers.list(userId);
  if (trackers.length === 0) {
    throw new Error('No hay trackers activos. Creá trackers antes de generar datos.');
  }

  // La app considera un tracker "activo en una fecha" solo si createdAt ≤ fecha
  // (captura diaria y ventanas de estadísticas). Como los días generados van
  // hacia atrás, retrocedemos el createdAt de los trackers activos hasta el
  // inicio del rango para que aparezcan en todos los días generados.
  const rangeStart = fromDateString(dates[0]);
  await prisma.tracker.updateMany({
    where: { userId, archivedAt: null, createdAt: { gt: rangeStart } },
    data: { createdAt: rangeStart },
  });

  const days = generateDays(dates, trackers, quality, seed);
  await insertGeneratedDays(userId, days);
  const meanScore =
    Math.round((days.reduce((s, d) => s + d.score, 0) / days.length) * 100) / 100;
  return { quality, seed, dates, meanScore };
}

/**
 * "Registro" completo: BORRA todo el historial de días del usuario (en cascada
 * sus valores y tags de día; trackers/categorías/tags quedan intactos) y
 * genera un mes (30 días hasta hoy) cuyo promedio cae en la banda de `quality`.
 */
export async function createTestRecord(
  quality: Quality,
  seed: number = newSeed(),
): Promise<TestDataResult> {
  const userId = await getCurrentUserId();
  const { count } = await prisma.dayEntry.deleteMany({ where: { userId } });

  const today = fromDateString(todayString());
  const dates: DateString[] = [];
  for (let i = RECORD_DAYS - 1; i >= 0; i--) {
    dates.push(toDateString(shiftDays(today, -i)));
  }

  const result = await generateAndInsert(userId, dates, quality, seed);
  return { ...result, deletedDays: count };
}

async function existingDates(userId: string): Promise<Set<DateString>> {
  const rows = await prisma.dayEntry.findMany({
    where: { userId },
    select: { date: true },
  });
  return new Set(rows.map((r) => r.date));
}

/**
 * Día suelto: usa la fecha libre más reciente (de hoy hacia atrás) para no
 * pisar ni borrar días existentes.
 */
export async function insertTestDay(
  quality: Quality,
  seed: number = newSeed(),
): Promise<TestDataResult> {
  const userId = await getCurrentUserId();
  const taken = await existingDates(userId);

  const today = fromDateString(todayString());
  for (let i = 0; i < SEARCH_LIMIT_DAYS; i++) {
    const date = toDateString(shiftDays(today, -i));
    if (!taken.has(date)) return generateAndInsert(userId, [date], quality, seed);
  }
  throw new Error('No hay fechas libres en los últimos 10 años.');
}

/**
 * Semana: busca el bloque de 7 días consecutivos libres más reciente
 * (terminando hoy o antes) y lo llena, sin tocar días existentes.
 */
export async function insertTestWeek(
  quality: Quality,
  seed: number = newSeed(),
): Promise<TestDataResult> {
  const userId = await getCurrentUserId();
  const taken = await existingDates(userId);

  const today = fromDateString(todayString());
  for (let i = 0; i < SEARCH_LIMIT_DAYS; i++) {
    const end = shiftDays(today, -i);
    const dates: DateString[] = [];
    for (let j = 6; j >= 0; j--) {
      dates.push(toDateString(shiftDays(end, -j)));
    }
    if (dates.every((d) => !taken.has(d))) {
      return generateAndInsert(userId, dates, quality, seed);
    }
  }
  throw new Error('No hay un bloque de 7 días libres en los últimos 10 años.');
}
