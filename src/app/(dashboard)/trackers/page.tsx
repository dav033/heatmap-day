import Box from '@mui/material/Box';

import { getCurrentUserId } from '@/core/config/user';
import { repos } from '@/core/repositories/prisma';
import { categoryService, trackerService, TrackersManager } from '@/features/trackers';

export default async function TrackersPage() {
  const userId = await getCurrentUserId();
  const [active, archived, categories] = await Promise.all([
    trackerService.listTrackers({ includeArchived: false }),
    repos.trackers
      .list(userId, { includeArchived: true })
      .then((all) => all.filter((t) => t.archivedAt)),
    categoryService.listCategories(),
  ]);

  // Conteo de valores por tracker (para limitar el cambio de tipo en la edición).
  const counts: Record<string, number> = {};
  await Promise.all(
    active.map(async (t) => {
      counts[t.id] = await repos.trackers.countValues(userId, t.id);
    }),
  );

  return (
    <Box>
      <TrackersManager
        active={active}
        archived={archived}
        categories={categories}
        valueCountByTracker={counts}
      />
    </Box>
  );
}
