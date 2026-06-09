import type { Category } from '@/core/domain';

export interface NewCategoryInput {
  name: string;
  color?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string | null;
}

export interface CategoryRepository {
  list(userId: string): Promise<Category[]>;
  create(userId: string, input: NewCategoryInput): Promise<Category>;
  update(userId: string, id: string, input: UpdateCategoryInput): Promise<Category>;
  remove(userId: string, id: string): Promise<void>;
  reorder(userId: string, ids: string[]): Promise<void>;
}
