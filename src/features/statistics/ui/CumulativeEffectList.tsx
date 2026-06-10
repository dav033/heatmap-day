'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import type { CumulativeEffect } from '@/features/statistics/application/statisticsService';

import { DivergingBar } from './DivergingBar';

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

function MaCorrelationBar({
  label,
  correlation,
  windowDays,
}: {
  label: string;
  correlation: number | null;
  windowDays: number;
}) {
  if (correlation === null) return null;
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr 64px',
        gap: 1,
        alignItems: 'center',
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <DivergingBar
        value={correlation}
        height={12}
        tooltip={`Correlación de la media móvil de ${windowDays} días con el puntaje del día`}
      />
      <Typography
        variant="caption"
        sx={{
          textAlign: 'right',
          fontWeight: 600,
          color:
            correlation > 0.05 ? '#4ade80' : correlation < -0.05 ? '#f87171' : 'text.secondary',
        }}
      >
        r {correlation > 0 ? '+' : ''}
        {correlation.toFixed(2)}
      </Typography>
    </Box>
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
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75 }}>
        {effect.trackerName}
      </Typography>
      <Stack spacing={0.5} sx={{ mb: 0.75 }}>
        <MaCorrelationBar label="MA-3" correlation={effect.maCorrelation3} windowDays={3} />
        <MaCorrelationBar label="MA-7" correlation={effect.maCorrelation7} windowDays={7} />
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
