'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import * as svc from '../application/calendarService';

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'Fecha YYYY-MM-DD inválida');
const ScoreSchema = z
  .number()
  .min(0)
  .max(10)
  .refine((n) => Math.round(n * 10) / 10 === n, '1 decimal máximo');

export async function setDayScoreAction(input: {
  date: string;
  score: number | null;
}): Promise<void> {
  const date = DateSchema.parse(input.date);
  const score = input.score === null ? null : ScoreSchema.parse(input.score);
  await svc.setDayScore(date, score);
  // El calendario y el detalle de día consumen estos datos.
  revalidatePath('/');
  revalidatePath(`/day/${date}`);
}

export async function setDayNoteAction(input: {
  date: string;
  note: string | null;
}): Promise<void> {
  const date = DateSchema.parse(input.date);
  const note = input.note === null ? null : z.string().max(10_000).parse(input.note);
  await svc.setDayNote(date, note);
  revalidatePath(`/day/${date}`);
}

export async function deleteDayAction(input: { date: string }): Promise<void> {
  const date = DateSchema.parse(input.date);
  await svc.deleteDay(date);
  revalidatePath('/');
  revalidatePath(`/day/${date}`);
}
