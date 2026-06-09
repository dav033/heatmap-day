'use client';

import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import type { ReactNode } from 'react';

import { scoreToColor } from '@/core/lib/colorScale';

interface KpiCardsProps {
  totalDays: number;
  mean: number | null;
  median: number | null;
  slope: number | null;
  bestStreakLength: number | null;
  worstStreakLength: number | null;
}

export function KpiCards({
  totalDays,
  mean,
  median,
  slope,
  bestStreakLength,
  worstStreakLength,
}: KpiCardsProps) {
  const trendIcon =
    slope === null || Math.abs(slope) < 0.005 ? (
      <TrendingFlatIcon fontSize="small" />
    ) : slope > 0 ? (
      <TrendingUpIcon fontSize="small" />
    ) : (
      <TrendingDownIcon fontSize="small" />
    );
  const trendColor =
    slope === null || Math.abs(slope) < 0.005
      ? 'text.secondary'
      : slope > 0
        ? 'success.main'
        : 'error.main';
  const trendLabel =
    slope === null
      ? '—'
      : `${slope > 0 ? '+' : ''}${slope.toFixed(3)}/día`;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' },
        gap: 2,
        mb: 3,
      }}
    >
      <KpiCard label="Días registrados" value={String(totalDays)} accent="#7c9cff" />
      <KpiCard
        label="Promedio"
        value={mean !== null ? mean.toFixed(1) : '—'}
        accent={mean !== null ? scoreToColor(mean) : undefined}
        sub="0–10"
      />
      <KpiCard
        label="Mediana"
        value={median !== null ? median.toFixed(1) : '—'}
        accent={median !== null ? scoreToColor(median) : undefined}
      />
      <KpiCard
        label="Tendencia"
        value={trendLabel}
        icon={trendIcon}
        iconColor={trendColor}
      />
      <KpiCard
        label="Racha + larga"
        value={
          bestStreakLength !== null && bestStreakLength > 0
            ? `${bestStreakLength}d altos`
            : worstStreakLength !== null && worstStreakLength > 0
              ? `${worstStreakLength}d bajos`
              : '—'
        }
        accent={
          bestStreakLength !== null && bestStreakLength > 0
            ? '#4ade80'
            : worstStreakLength !== null && worstStreakLength > 0
              ? '#f87171'
              : undefined
        }
      />
    </Box>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  accent?: string;
  sub?: string;
  icon?: ReactNode;
  iconColor?: string;
}

function KpiCard({ label, value, accent, sub, icon, iconColor }: KpiCardProps) {
  const theme = useTheme();
  const glow = accent ?? theme.palette.primary.main;
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: 3,
          height: '100%',
          background: glow,
          opacity: 0.85,
        },
      }}
    >
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.3 }}>
          {label.toUpperCase()}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, color: accent ?? 'text.primary', display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            {icon && (
              <Box component="span" sx={{ color: iconColor ?? 'inherit', display: 'inline-flex' }}>
                {icon}
              </Box>
            )}
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.secondary">
              {sub}
            </Typography>
          )}
        </Stack>
      </Stack>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 100% 0%, ${alpha(glow, 0.10)} 0px, transparent 140px)`,
          pointerEvents: 'none',
        }}
      />
    </Paper>
  );
}
