import type { PrismaClient } from '@prisma/client';

import type { Category } from '@/core/domain';
import type {
  CategoryRepository,
  NewCategoryInput,
  UpdateCategoryInput,
} from '@/core/repositories/interfaces';

import { mapCategory } from './mappers';

export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(userId: string): Promise<Category[]> {
    const rows = await this.db.category.findMany({
      where: { userId },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
    return rows.map(mapCategory);
  }

  async create(userId: string, input: NewCategoryInput): Promise<Category> {
    const last = await this.db.category.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const row = await this.db.category.create({
      data: {
        userId,
        name: input.name,
        color: input.color ?? null,
        order: (last?.order ?? -1) + 1,
      },
    });
    return mapCategory(row);
  }

  async update(userId: string, id: string, input: UpdateCategoryInput): Promise<Category> {
    const owned = await this.db.category.findFirst({ where: { id, userId } });
    if (!owned) throw new Error('Categoría no encontrada');
    const row = await this.db.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
      },
    });
    return mapCategory(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    const owned = await this.db.category.findFirst({ where: { id, userId } });
    if (!owned) return;
    // Antes de borrar, desvincular trackers para no perderlos.
    await this.db.tracker.updateMany({
      where: { categoryId: id, userId },
      data: { categoryId: null },
    });
    await this.db.category.delete({ where: { id } });
  }

  async reorder(userId: string, ids: string[]): Promise<void> {
    const owned = await this.db.category.findMany({
      where: { id: { in: ids }, userId },
      select: { id: true },
    });
    if (owned.length !== ids.length) throw new Error('Categoría inválida en el reorden');
    await this.db.$transaction(
      ids.map((id, index) =>
        this.db.category.update({ where: { id }, data: { order: index } }),
      ),
    );
  }
}
