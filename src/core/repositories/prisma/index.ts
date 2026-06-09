import { prisma } from '@/core/db/prisma';

import { PrismaCategoryRepository } from './PrismaCategoryRepository';
import { PrismaDayEntryRepository } from './PrismaDayEntryRepository';
import { PrismaTagRepository } from './PrismaTagRepository';
import { PrismaTrackerRepository } from './PrismaTrackerRepository';
import { PrismaTrackerValueRepository } from './PrismaTrackerValueRepository';

/**
 * Punto único de acceso a los repositorios. La application capa pide a `repos`,
 * no construye instancias propias. Cambiar la implementación (ej. mocks en tests
 * o un Postgres adapter) se hace acá.
 */
export const repos = {
  dayEntries: new PrismaDayEntryRepository(prisma),
  trackers: new PrismaTrackerRepository(prisma),
  trackerValues: new PrismaTrackerValueRepository(prisma),
  categories: new PrismaCategoryRepository(prisma),
  tags: new PrismaTagRepository(prisma),
};

export {
  PrismaCategoryRepository,
  PrismaDayEntryRepository,
  PrismaTagRepository,
  PrismaTrackerRepository,
  PrismaTrackerValueRepository,
};
