import Box from '@mui/material/Box';

import {
  fromDateString,
  monthRange,
  todayString,
  weekRange,
  yearRange,
  type DateRange,
} from '@/core/lib/date';
import { Calendar, calendarService, type CalendarView } from '@/features/calendar';

interface PageProps {
  searchParams: Promise<{ view?: string; date?: string }>;
}

function parseView(v?: string): CalendarView {
  if (v === 'year') return 'year';
  if (v === 'month') return 'month';
  return 'week';
}

function parseAnchor(d?: string): string {
  return d && /^\d{4}-\d{2}-\d{2}$/u.test(d) ? d : todayString();
}

function visibleRange(view: CalendarView, anchor: string): DateRange {
  const d = fromDateString(anchor);
  if (view === 'week') return weekRange(d);
  if (view === 'month') return monthRange(d);
  return yearRange(d);
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const view = parseView(sp.view);
  const anchor = parseAnchor(sp.date);
  const today = todayString();

  const range = visibleRange(view, anchor);
  const scores = await calendarService.getScoresInRange(range);

  return (
    <Box>
      <Calendar view={view} anchor={anchor} today={today} scores={scores} />
    </Box>
  );
}
