'use client';

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import TodayIcon from '@mui/icons-material/Today';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

import {
  fromDateString,
  shiftDays,
  shiftMonths,
  shiftYears,
  todayString,
  toDateString,
  type DateString,
} from '@/core/lib/date';

export type CalendarView = 'week' | 'month' | 'year';

interface CalendarNavProps {
  view: CalendarView;
  anchor: DateString;
}

function shift(view: CalendarView, anchor: DateString, dir: -1 | 1): DateString {
  const d = fromDateString(anchor);
  if (view === 'week') return toDateString(shiftDays(d, dir * 7));
  if (view === 'month') return toDateString(shiftMonths(d, dir));
  return toDateString(shiftYears(d, dir));
}

function buildHref(view: CalendarView, anchor: DateString): string {
  return `/?view=${view}&date=${anchor}`;
}

function periodLabel(view: CalendarView, anchor: DateString): string {
  const d = fromDateString(anchor);
  if (view === 'week') return format(d, "'Semana del' d MMM yyyy", { locale: es });
  if (view === 'month') return format(d, 'MMMM yyyy', { locale: es });
  return format(d, 'yyyy', { locale: es });
}

export function CalendarNav({ view, anchor }: CalendarNavProps) {
  const router = useRouter();

  const go = (next: DateString) => router.push(buildHref(view, next));
  const goView = (v: CalendarView) => router.push(buildHref(v, anchor));

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}
    >
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <Tooltip title="Anterior" arrow>
          <IconButton size="small" aria-label="anterior" onClick={() => go(shift(view, anchor, -1))}>
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Hoy" arrow>
          <IconButton size="small" aria-label="hoy" onClick={() => go(todayString())}>
            <TodayIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Siguiente" arrow>
          <IconButton size="small" aria-label="siguiente" onClick={() => go(shift(view, anchor, 1))}>
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Typography
        variant="h2"
        sx={{ flexGrow: 1, textTransform: 'capitalize', fontWeight: 700 }}
      >
        {periodLabel(view, anchor)}
      </Typography>

      <ToggleButtonGroup
        size="small"
        value={view}
        exclusive
        onChange={(_, v) => v && goView(v as CalendarView)}
        aria-label="Vista del calendario"
      >
        <ToggleButton value="week">Semana</ToggleButton>
        <ToggleButton value="month">Mes</ToggleButton>
        <ToggleButton value="year">Año</ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
}
