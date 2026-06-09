'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import * as svc from '../application/tagService';

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u);
const NameSchema = z.string().trim().min(1).max(60);

export async function createOrAttachTagAction(input: {
  date: string;
  name: string;
}): Promise<{ tagId: string }> {
  const date = DateSchema.parse(input.date);
  const name = NameSchema.parse(input.name);
  const tag = await svc.findOrCreateTag(name);
  await svc.attachTag(date, tag.id);
  revalidatePath(`/day/${date}`);
  return { tagId: tag.id };
}

export async function attachTagAction(input: { date: string; tagId: string }): Promise<void> {
  const date = DateSchema.parse(input.date);
  const tagId = z.string().min(1).parse(input.tagId);
  await svc.attachTag(date, tagId);
  revalidatePath(`/day/${date}`);
}

export async function detachTagAction(input: { date: string; tagId: string }): Promise<void> {
  const date = DateSchema.parse(input.date);
  const tagId = z.string().min(1).parse(input.tagId);
  await svc.detachTag(date, tagId);
  revalidatePath(`/day/${date}`);
}
