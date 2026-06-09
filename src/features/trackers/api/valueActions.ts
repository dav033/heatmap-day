'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import type { TrackerValue } from '@/core/domain';

import * as svc from '../application/trackerValueService';

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u);
const TrackerIdSchema = z.string().min(1);

const ValueSchema = z.discriminatedUnion('kind', [
  z.object({
    trackerId: TrackerIdSchema,
    kind: z.literal('CHECK'),
    done: z.boolean(),
    quality: z.number().int().min(1).max(5).optional(),
  }),
  z.object({
    trackerId: TrackerIdSchema,
    kind: z.literal('SCALE'),
    value: z.number().min(0).max(10),
  }),
  z.object({
    trackerId: TrackerIdSchema,
    kind: z.literal('COUNTER'),
    value: z.number().finite(),
  }),
]);

export async function upsertTrackerValueAction(input: {
  date: string;
  value: TrackerValue;
}): Promise<void> {
  const date = DateSchema.parse(input.date);
  const value = ValueSchema.parse(input.value) as TrackerValue;
  await svc.upsertValue(date, value);
  revalidatePath(`/day/${date}`);
  revalidatePath('/');
}

export async function removeTrackerValueAction(input: {
  date: string;
  trackerId: string;
}): Promise<void> {
  const date = DateSchema.parse(input.date);
  const trackerId = TrackerIdSchema.parse(input.trackerId);
  await svc.removeValue(date, trackerId);
  revalidatePath(`/day/${date}`);
}
