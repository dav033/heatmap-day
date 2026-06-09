import { getCurrentUserId } from '@/core/config/user';
import type { Category } from '@/core/domain';
import type {
  NewCategoryInput,
  UpdateCategoryInput,
} from '@/core/repositories/interfaces';
import { repos } from '@/core/repositories/prisma';

export async function listCategories(): Promise<Category[]> {
  const userId = await getCurrentUserId();
  return repos.categories.list(userId);
}

export async function createCategory(input: NewCategoryInput): Promise<Category> {
  const userId = await getCurrentUserId();
  return repos.categories.create(userId, input);
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<Category> {
  const userId = await getCurrentUserId();
  return repos.categories.update(userId, id, input);
}

export async function removeCategory(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  await repos.categories.remove(userId, id);
}

export async function reorderCategories(ids: string[]): Promise<void> {
  const userId = await getCurrentUserId();
  await repos.categories.reorder(userId, ids);
}
