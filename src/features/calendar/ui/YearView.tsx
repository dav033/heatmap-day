'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { addDays, format, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

import { fromDateString, toDateString, type DateString } from '@/core/lib/date';

import { HeatmapCell } from './HeatmapCell';

interface YearViewProps {
  anchor: DateString;
  scoresByDate: ReadonlyMap<string, number>;
  today: DateString;
}

export function YearView({ anchor, scoresByDate, today }: YearViewProps) {
  const year = fromDateString(anchor).getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const gridStart = startOfWeek(yearStart, { weekStartsOn: 1 });

  const weeks: DateString[][] = [];
  let cursor = gridStart;
  while (cursor <= yearEnd) {
    const col: DateString[] = [];
    for (let i = 0; i < 7; i++) {
      col.push(toDateString(addDays(cursor, i)));
    }
    weeks.push(col);
    cursor = addDays(cursor, 7);
  }

  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, col) => {
    const m = fromDateString(week[0]!).getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ col, label: format(fromDateString(week[0]!), 'MMM', { locale: es }) });
      lastMonth = m;
    }
  });

  return (
    <Stack spacing={1}>
      <Box className="overflow-x-auto">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `28px repeat(${weeks.length}, 32px)`,
            columnGap: '3px',
            rowGap: '3px',
            alignItems: 'center',
          }}
        >
          {/* month labels */}
          <Box />
          {weeks.map((_, col) => {
            const lbl = monthLabels.find((m) => m.col === col)?.label;
            return (
              <Typography
                key={`mh-${col}`}
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: 9, height: 12 }}
              >
                {lbl ?? ''}
              </Typography>
            );
          })}

          {/* day rows */}
          {Array.from({ length: 7 }, (_, dayRow) => {
            const dayLabels = ['L', '', 'M', '', 'V', '', 'D'];
            return (
              <Box key={`row-${dayRow}`} sx={{ display: 'contents' }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: 9 }}
                >
                  {dayLabels[dayRow]}
                </Typography>
                {weeks.map((week, col) => {
                  const d = week[dayRow]!;
                  const date = fromDateString(d);
                  const inYear = date.getFullYear() === year;
                  return (
                    <Box key={`${col}-${dayRow}`} sx={{ opacity: inYear ? 1 : 0.25 }}>
                      <HeatmapCell
                        date={d}
                        score={scoresByDate.get(d)}
                        size={32}
                        isToday={d === today}
                      />
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Stack>
  );
}