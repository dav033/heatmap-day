'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import type { Polarity, TrackerType } from '@/core/domain';

import * as categoryService from '../application/categoryService';
import * as trackerService from '../application/trackerService';

const TrackerTypeSchema = z.enum(['CHECK', 'SCALE', 'COUNTER']);
const PolaritySchema = z.enum(['POSITIVE', 'NEGATIVE', 'UNKNOWN']);

const NameSchema = z.string().trim().min(1, 'Nombre requerido').max(100);
const UnitSchema = z.string().trim().max(40).optional();
const TargetSchema = z
  .number()
  .finite('Meta debe ser un número')
  .optional();

const CreateTrackerSchema = z.object({
  name: NameSchema,
  type: TrackerTypeSchema,
  unit: UnitSchema.transform((v) => (v && v.length > 0 ? v : undefined)),
  target: TargetSchema,
  expectedPolarity: PolaritySchema.default('UNKNOWN'),
  categoryId: z.string().optional().transform((v) => (v && v.length > 0 ? v : undefined)),
});

const UpdateTrackerSchema = z.object({
  trackerId: z.string().min(1),
  name: NameSchema.optional(),
  unit: z.string().nullable().optional(),
  target: z.number().nullable().optional(),
  expectedPolarity: PolaritySchema.optional(),
  categoryId: z.string().nullable().optional(),
  type: TrackerTypeSchema.optional(),
});

export async function createTrackerAction(input: unknown): Promise<void> {
  const data = CreateTrackerSchema.parse(input);
  await trackerService.createTracker({
    name: data.name,
    type: data.type as TrackerType,
    unit: data.unit,
    target: data.target,
    expectedPolarity: data.expectedPolarity as Polarity,
    categoryId: data.categoryId,
  });
  revalidatePath('/trackers');
}

export async function updateTrackerAction(input: unknown): Promise<void> {
  const data = UpdateTrackerSchema.parse(input);
  await trackerService.updateTracker(data.trackerId, {
    name: data.name,
    unit: data.unit ?? undefined,
    target: data.target ?? undefined,
    expectedPolarity: data.expectedPolarity as Polarity | undefined,
    categoryId: data.categoryId ?? undefined,
    type: data.type as TrackerType | undefined,
  });
  revalidatePath('/trackers');
}

export async function archiveTrackerAction(trackerId: string): Promise<void> {
  await trackerService.archiveTracker(trackerId);
  revalidatePath('/trackers');
}

export async function restoreTrackerAction(trackerId: string): Promise<void> {
  await trackerService.restoreTracker(trackerId);
  revalidatePath('/trackers');
}

export async function reorderTrackersAction(ids: string[]): Promise<void> {
  await trackerService.reorderTrackers(z.array(z.string().min(1)).parse(ids));
  revalidatePath('/trackers');
}

const CreateCategorySchema = z.object({
  name: NameSchema,
  color: z.string().max(20).optional(),
});

export async function createCategoryAction(input: unknown): Promise<void> {
  const data = CreateCategorySchema.parse(input);
  await categoryService.createCategory(data);
  revalidatePath('/trackers');
}

export async function updateCategoryAction(input: unknown): Promise<void> {
  const data = z
    .object({
      id: z.string().min(1),
      name: NameSchema.optional(),
      color: z.string().max(20).nullable().optional(),
    })
    .parse(input);
  await categoryService.updateCategory(data.id, {
    name: data.name,
    color: data.color ?? undefined,
  });
  revalidatePath('/trackers');
}

export async function removeCategoryAction(id: string): Promise<void> {
  await categoryService.removeCategory(id);
  revalidatePath('/trackers');
}
