import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { notFound } from 'next/navigation';

import { BackButton } from '@/core/ui/BackButton';
import { fromDateString } from '@/core/lib/date';
import { scoreToColor } from '@/core/lib/colorScale';
import {
  calendarService,
  DayDangerZone,
  DayNoteEditor,
  DayTagsEditor,
  ScoreEditor,
  tagService,
} from '@/features/calendar';
import {
  categoryService,
  DayCapture,
  trackerService,
  trackerValueService,
} from '@/features/trackers';

interface DayPageProps {
  params: Promise<{ date: string }>;
}

export default async function DayPage({ params }: DayPageProps) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(date)) notFound();

  const [day, activeTrackers, categories, values, allTags, attachedTagIds] = await Promise.all([
    calendarService.getDayEntry(date),
    trackerService.listActiveTrackersOn(date),
    categoryService.listCategories(),
    trackerValueService.listValuesForDate(date),
    tagService.listTags(),
    tagService.listTagIdsForDay(date),
  ]);

  const human = format(fromDateString(date), "EEEE, d 'de' MMMM yyyy", { locale: es });
  const scoreColor = day?.score !== undefined && day?.score !== null ? scoreToColor(day.score) : null;

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <BackButton />
        <Box sx={{ flexGrow: 1 }} />
      </Stack>

      <Box
        sx={{
          position: 'relative',
          p: 3,
          borderRadius: 3,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          '&::before': scoreColor
            ? {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: 4,
                height: '100%',
                backgroundColor: scoreColor,
              }
            : undefined,
        }}
      >
        <Typography variant="h1" sx={{ textTransform: 'capitalize' }}>
          {human}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {date}
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h3">Puntaje del día</Typography>
          <ScoreEditor date={date} initialScore={day?.score ?? null} />
        </Stack>
      </Paper>

      <DayCapture
        date={date}
        activeTrackers={activeTrackers}
        categories={categories}
        values={values}
      />

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <DayNoteEditor date={date} initialNote={day?.note ?? null} />
          <DayTagsEditor date={date} allTags={allTags} attachedIds={attachedTagIds} />
        </Stack>
      </Paper>

      <DayDangerZone date={date} />
    </Stack>
  );
}
