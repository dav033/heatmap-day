'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import Link from 'next/link';

import { scoreToColor } from '@/core/lib/colorScale';
import type { PatternSummary } from '@/features/statistics/application/statisticsService';

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface PatternSummaryViewProps {
  patterns: PatternSummary;
}

export function PatternSummaryView({ patterns }: PatternSummaryViewProps) {
  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        sx={{ alignItems: { md: 'stretch' } }}
      >
        <Box sx={{ flex: 1 }}>
          <WeekdayChart weekdayMeans={patterns.weekdayMeans} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <DistributionChart distribution={patterns.distribution} />
        </Box>
      </Stack>
      <BestWorstDays bestDays={patterns.bestDays} worstDays={patterns.worstDays} />
      <BestWorstWeekday
        bestWeekday={patterns.bestWeekday}
        worstWeekday={patterns.worstWeekday}
      />
    </Stack>
  );
}

function BestWorstWeekday({
  bestWeekday,
  worstWeekday,
}: {
  bestWeekday: PatternSummary['bestWeekday'];
  worstWeekday: PatternSummary['worstWeekday'];
}) {
  if (!bestWeekday && !worstWeekday) return null;
  return (
    <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
      {bestWeekday && (
        <Tooltip title={`Promedio en ${WEEKDAY_NAMES[bestWeekday.weekday]} (n=${bestWeekday.n})`} arrow>
          <Box
            sx={{
              px: 2,
              py: 1,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'success.dark',
              backgroundColor: alpha('#4ade80', 0.07),
            }}
          >
            <Typography variant="caption" color="success.light" sx={{ fontWeight: 600 }}>
              MEJOR DÍA DE LA SEMANA
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              {WEEKDAY_NAMES[bestWeekday.weekday]} · {bestWeekday.mean.toFixed(1)}
            </Typography>
          </Box>
        </Tooltip>
      )}
      {worstWeekday && (
        <Tooltip title={`Promedio en ${WEEKDAY_NAMES[worstWeekday.weekday]} (n=${worstWeekday.n})`} arrow>
          <Box
            sx={{
              px: 2,
              py: 1,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'error.dark',
              backgroundColor: alpha('#f87171', 0.07),
            }}
          >
            <Typography variant="caption" color="error.light" sx={{ fontWeight: 600 }}>
              PEOR DÍA DE LA SEMANA
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              {WEEKDAY_NAMES[worstWeekday.weekday]} · {worstWeekday.mean.toFixed(1)}
            </Typography>
          </Box>
        </Tooltip>
      )}
    </Stack>
  );
}

function BestWorstDays({
  bestDays,
  worstDays,
}: {
  bestDays: PatternSummary['bestDays'];
  worstDays: PatternSummary['worstDays'];
}) {
  if (bestDays.length === 0 && worstDays.length === 0) return null;

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Días destacados
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
        {bestDays.length > 0 && (
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="success.light" sx={{ fontWeight: 600 }}>
              MEJORES
            </Typography>
            <Stack spacing={0.75} sx={{ mt: 0.5 }}>
              {bestDays.map((d) => (
                <DayChip key={d.date} date={d.date} score={d.score} />
              ))}
            </Stack>
          </Box>
        )}
        {worstDays.length > 0 && (
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="error.light" sx={{ fontWeight: 600 }}>
              PEORES
            </Typography>
            <Stack spacing={0.75} sx={{ mt: 0.5 }}>
              {worstDays.map((d) => (
                <DayChip key={d.date} date={d.date} score={d.score} />
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
}

function DayChip({ date, score }: { date: string; score: number }) {
  return (
    <Link
      href={`/day/${date}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.08)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <Box
        sx={{
          width: 14,
          height: 14,
          backgroundColor: scoreToColor(score),
          borderRadius: 0.75,
        }}
      />
      <Typography variant="body2" sx={{ flexGrow: 1 }}>
        {date}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {score.toFixed(1)}
      </Typography>
    </Link>
  );
}

function WeekdayChart({ weekdayMeans }: { weekdayMeans: PatternSummary['weekdayMeans'] }) {
  const theme = useTheme();
  const maxN = Math.max(...weekdayMeans.map((w) => w.n));
  if (maxN === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        Sin datos por día de semana.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Promedio por día de semana
      </Typography>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'flex-end',
          height: 160,
          px: 1,
          py: 1.5,
          borderRadius: 2,
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {weekdayMeans.map((w) => {
          const valid = !Number.isNaN(w.mean) && w.n > 0;
          const h = valid ? (w.mean / 10) * 100 : 0;
          const color = valid ? scoreToColor(w.mean) : alpha(theme.palette.text.disabled, 0.4);
          return (
            <Tooltip
              key={w.weekday}
              title={valid ? `${WEEKDAY_NAMES[w.weekday]}: ${w.mean.toFixed(2)} (n=${w.n})` : 'Sin datos'}
              arrow
            >
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 600 }}>
                  {valid ? w.mean.toFixed(1) : '—'}
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: `${Math.max(h, 4)}%`,
                    backgroundColor: color,
                    borderRadius: '4px 4px 2px 2px',
                    minHeight: 4,
                    transition: 'height 200ms ease',
                  }}
                />
                <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary' }}>
                  {WEEKDAY_NAMES[w.weekday]}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}

function DistributionChart({ distribution }: { distribution: PatternSummary['distribution'] }) {
  const theme = useTheme();
  const maxCount = Math.max(...distribution.map((b) => b.count));
  if (maxCount === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        Sin distribución para mostrar.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Distribución de puntajes
      </Typography>
      <Box
        sx={{
          display: 'flex',
          gap: 0.75,
          alignItems: 'flex-end',
          height: 160,
          px: 1,
          py: 1.5,
          borderRadius: 2,
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {distribution.map((bin) => {
          const h = (bin.count / maxCount) * 100;
          const mid = (bin.from + bin.to) / 2;
          return (
            <Tooltip
              key={`${bin.from}-${bin.to}`}
              title={`Puntaje ${bin.from}–${bin.to}: ${bin.count} día${bin.count === 1 ? '' : 's'}`}
              arrow
            >
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.25,
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <Typography variant="caption" sx={{ fontSize: 9 }}>
                  {bin.count > 0 ? bin.count : ''}
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: `${Math.max(h, 2)}%`,
                    borderRadius: '4px 4px 2px 2px',
                    minHeight: 2,
                    backgroundColor: scoreToColor(mid),
                  }}
                />
                <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>
                  {bin.from}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
