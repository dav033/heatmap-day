'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import type { CumulativeEffect } from '@/features/statistics/application/statisticsService';

interface CumulativeEffectListProps {
  effects: CumulativeEffect[];
}

export function CumulativeEffectList({ effects }: CumulativeEffectListProps) {
  const withData = effects.filter(
    (e) => e.lowStreaks.length > 0 || e.highStreaks.length > 0 || e.maCorrelation3 !== null,
  );

  if (withData.length === 0) {
    return <Typography color="text.secondary">Sin datos acumulativos suficientes.</Typography>;
  }

  // Sort by strength: prefer trackers with stronger MA-7 correlation.
  const sorted = [...withData].sort((a, b) => {
    const aMag = Math.max(Math.abs(a.maCorrelation7 ?? 0), Math.abs(a.maCorrelation3 ?? 0));
    const bMag = Math.max(Math.abs(b.maCorrelation7 ?? 0), Math.abs(b.maCorrelation3 ?? 0));
    return bMag - aMag;
  });

  return (
    <Stack spacing={1.5}>
      {sorted.map((effect) => (
        <EffectRow key={effect.trackerId} effect={effect} />
      ))}
    </Stack>
  );
}

function EffectRow({ effect }: { effect: CumulativeEffect }) {
  const strongest = Math.abs(effect.maCorrelation7 ?? 0) > Math.abs(effect.maCorrelation3 ?? 0)
    ? effect.maCorrelation7
    : effect.maCorrelation3;
  const accent =
    strongest === null ? 'rgba(255,255,255,0.2)'
      : strongest > 0.05 ? '#4ade80'
        : strongest < -0.05 ? '#f87171'
          : 'rgba(255,255,255,0.3)';

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: alpha(accent, 0.04),
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {effect.trackerName}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 0.5, flexWrap: 'wrap' }}>
        {effect.maCorrelation3 !== null && (
          <Tooltip title="Correlación de la media móvil de 3 días con el puntaje del día" arrow>
            <Chip
              label={`MA-3 r=${effect.maCorrelation3.toFixed(2)}`}
              size="small"
              variant="outlined"
              sx={{ height: 22 }}
            />
          </Tooltip>
        )}
        {effect.maCorrelation7 !== null && (
          <Tooltip title="Correlación de la media móvil de 7 días con el puntaje del día" arrow>
            <Chip
              label={`MA-7 r=${effect.maCorrelation7.toFixed(2)}`}
              size="small"
              variant="outlined"
              sx={{ height: 22 }}
            />
          </Tooltip>
        )}
      </Stack>
      {effect.lowStreaks.length > 0 && (
        <Typography variant="caption" sx={{ display: 'block', color: 'error.light' }}>
          Rachas bajas:{' '}
          {effect.lowStreaks
            .slice(0, 3)
            .map((s) => `${s.startDate}→${s.endDate} (${s.length}d)`)
            .join(', ')}
        </Typography>
      )}
      {effect.highStreaks.length > 0 && (
        <Typography variant="caption" sx={{ display: 'block', color: 'success.light' }}>
          Rachas altas:{' '}
          {effect.highStreaks
            .slice(0, 3)
            .map((s) => `${s.startDate}→${s.endDate} (${s.length}d)`)
            .join(', ')}
        </Typography>
      )}
    </Box>
  );
}
