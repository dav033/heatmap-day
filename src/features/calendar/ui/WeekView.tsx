'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { enumerateDates, fromDateString, toDateString, type DateRange } from '@/core/lib/date';

import { HeatmapCell } from './HeatmapCell';

interface WeekViewProps {
  range: DateRange;
  scoresByDate: ReadonlyMap<string, number>;
  today: string;
}

export function WeekView({ range, scoresByDate, today }: WeekViewProps) {
  const days = enumerateDates(range);
  return (
    <Box sx={{ overflowX: 'auto', py: 1 }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ minWidth: 'fit-content', justifyContent: 'center' }}
      >
        {days.map((d) => {
          const date = fromDateString(d);
          const isToday = d === today;
          return (
            <Stack
              key={d}
              spacing={1}
              sx={{
                minWidth: 92,
                alignItems: 'center',
                p: 1.5,
                borderRadius: 2,
                backgroundColor: isToday ? 'rgba(124,156,255,0.07)' : 'transparent',
                border: '1px solid',
                borderColor: isToday ? 'rgba(124,156,255,0.25)' : 'transparent',
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 700, letterSpacing: 0.5 }}
              >
                {format(date, 'EEE', { locale: es }).toUpperCase()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {format(date, 'd MMM', { locale: es })}
              </Typography>
              <HeatmapCell
                date={d}
                score={scoresByDate.get(d)}
                size={72}
                isToday={isToday}
                showScoreText
              />
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}

export function defaultWeekToday(date = new Date()): string {
  return toDateString(date);
}
