'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { scoreToColor } from '@/core/lib/colorScale';
import type { ImpactLevels } from '@/features/statistics/application/statisticsService';

interface LevelComparisonProps {
  levels: ImpactLevels;
}

/**
 * Dos barras (0–10) con el puntaje promedio del día según el nivel del
 * tracker: hace visible de un vistazo que, p. ej., "Manga bajo" coincide con
 * días malos (barra corta y roja) y "Manga alto" con días buenos (larga y verde).
 */
export function LevelComparison({ levels }: LevelComparisonProps) {
  return (
    <Stack spacing={0.5} sx={{ mt: 1 }}>
      <LevelBar label={levels.lowLabel} mean={levels.lowMean} n={levels.lowN} />
      <LevelBar label={levels.highLabel} mean={levels.highMean} n={levels.highN} />
    </Stack>
  );
}

function LevelBar({ label, mean, n }: { label: string; mean: number; n: number }) {
  const color = scoreToColor(mean);
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '88px 1fr 86px', sm: '110px 1fr 96px' },
        gap: 1,
        alignItems: 'center',
      }}
    >
      <Typography variant="caption" color="text.secondary" noWrap title={label}>
        {label}
      </Typography>
      <Tooltip title={`Puntaje promedio del día: ${mean.toFixed(2)} (${n} días)`} arrow>
        <Box
          sx={{
            position: 'relative',
            height: 12,
            borderRadius: 1,
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: `${Math.max((mean / 10) * 100, 2)}%`,
              backgroundColor: alpha(color, 0.9),
              borderRadius: 1,
              transition: 'width 200ms ease',
            }}
          />
        </Box>
      </Tooltip>
      <Typography variant="caption" sx={{ textAlign: 'right' }}>
        <Box component="span" sx={{ fontWeight: 700, color }}>
          {mean.toFixed(1)}
        </Box>{' '}
        · n={n}
      </Typography>
    </Box>
  );
}
