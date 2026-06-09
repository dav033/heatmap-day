'use client';

import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { useMemo } from 'react';

import type { DayScore } from '@/core/domain';
import { fromDateString, weekRange, type DateString } from '@/core/lib/date';

import { CalendarNav, type CalendarView } from './CalendarNav';
import { ColorLegend } from './ColorLegend';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { YearView } from './YearView';

interface CalendarProps {
  view: CalendarView;
  anchor: DateString;
  today: DateString;
  scores: DayScore[];
}

export function Calendar({ view, anchor, today, scores }: CalendarProps) {
  const scoresByDate = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of scores) if (s.score !== undefined) m.set(s.date, s.score);
    return m;
  }, [scores]);

  const weekRangeForAnchor = useMemo(() => weekRange(fromDateString(anchor)), [anchor]);

  return (
    <Stack spacing={3}>
      <CalendarNav view={view} anchor={anchor} />
      <Paper
        variant="outlined"
        sx={{ p: { xs: 2, md: 3 }, backgroundColor: 'background.paper' }}
      >
        {view === 'week' && (
          <WeekView range={weekRangeForAnchor} scoresByDate={scoresByDate} today={today} />
        )}
        {view === 'month' && (
          <MonthView anchor={anchor} scoresByDate={scoresByDate} today={today} />
        )}
        {view === 'year' && (
          <YearView anchor={anchor} scoresByDate={scoresByDate} today={today} />
        )}
        <ColorLegend />
      </Paper>
    </Stack>
  );
}
