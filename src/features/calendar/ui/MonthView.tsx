'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';

import { fromDateString, toDateString, type DateString } from '@/core/lib/date';

import { HeatmapCell } from './HeatmapCell';

interface MonthViewProps {
  anchor: DateString;
  scoresByDate: ReadonlyMap<string, number>;
  today: DateString;
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const CELL_W = 72;
const CELL_H = 80;

export function MonthView({ anchor, scoresByDate, today }: MonthViewProps) {
  const monthDate = fromDateString(anchor);
  const startGrid = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const endGrid = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const cells: DateString[] = [];
  for (let d = startGrid; d <= endGrid; d = addDays(d, 1)) cells.push(toDateString(d));

  const monthIndex = monthDate.getMonth();

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Box sx={{ width: 'fit-content' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(7, ${CELL_W}px)`,
            gap: 1,
            mb: 1.5,
          }}
        >
          {WEEKDAYS.map((w) => (
            <Typography
              key={w}
              variant="caption"
              color="text.secondary"
              sx={{
                textAlign: 'center',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.6,
              }}
            >
              {w}
            </Typography>
          ))}
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(7, ${CELL_W}px)`,
            gridAutoRows: `${CELL_H}px`,
            gap: 1,
          }}
        >
          {cells.map((d) => {
            const date = fromDateString(d);
            const dim = date.getMonth() !== monthIndex;
            return (
              <Box key={d} sx={{ opacity: dim ? 0.35 : 1 }}>
                <HeatmapCell
                  date={d}
                  score={scoresByDate.get(d)}
                  size={CELL_W}
                  height={CELL_H}
                  isToday={d === today}
                  label={format(date, 'd', { locale: es })}
                />
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
