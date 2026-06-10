'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import type { TrackerImpact } from '@/features/statistics/application/statisticsService';
import type { Confidence } from '@/features/statistics/domain';

import { LevelComparison } from './LevelComparison';

const confidenceLabel = (c: Confidence) => {
  switch (c) {
    case 'insufficient':
      return 'Insuficiente';
    case 'preliminary':
      return 'Preliminar';
    case 'consistent':
      return 'Consistente';
  }
};

const confidenceColor = (c: Confidence): 'error' | 'warning' | 'success' => {
  switch (c) {
    case 'insufficient':
      return 'error';
    case 'preliminary':
      return 'warning';
    case 'consistent':
      return 'success';
  }
};

interface TrackerImpactListProps {
  impacts: TrackerImpact[];
}

export function TrackerImpactList({ impacts }: TrackerImpactListProps) {
  if (impacts.length === 0) {
    return <Typography color="text.secondary">Sin trackers para analizar.</Typography>;
  }

  // Sort: consistent first, then by absolute delta/correlation magnitude.
  const sorted = [...impacts].sort((a, b) => {
    const confRank = (c: Confidence) =>
      c === 'consistent' ? 2 : c === 'preliminary' ? 1 : 0;
    const cd = confRank(b.confidence) - confRank(a.confidence);
    if (cd !== 0) return cd;
    const aMag = Math.abs(a.delta ?? (a.correlation ? a.correlation * 5 : 0));
    const bMag = Math.abs(b.delta ?? (b.correlation ? b.correlation * 5 : 0));
    return bMag - aMag;
  });

  return (
    <Stack spacing={1.5}>
      {sorted.map((impact) => (
        <ImpactRow key={impact.trackerId} impact={impact} />
      ))}
    </Stack>
  );
}

function ImpactRow({ impact }: { impact: TrackerImpact }) {
  const theme = useTheme();
  const isCheck = impact.trackerType === 'CHECK';

  const directionColor =
    impact.discoveredDirection === 'positive'
      ? theme.palette.success.main
      : impact.discoveredDirection === 'negative'
        ? theme.palette.error.main
        : theme.palette.text.secondary;

  const directionLabel =
    impact.discoveredDirection === 'positive'
      ? 'sube el puntaje'
      : impact.discoveredDirection === 'negative'
        ? 'baja el puntaje'
        : 'sin efecto claro';

  // Magnitude bar: 0..1
  const magnitude =
    impact.delta !== null
      ? Math.min(1, Math.abs(impact.delta) / 4) // 4 pts → full
      : impact.correlation !== null
        ? Math.min(1, Math.abs(impact.correlation))
        : 0;

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: alpha(directionColor, 0.04),
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {impact.trackerName}
            </Typography>
            <Chip
              label={confidenceLabel(impact.confidence)}
              color={confidenceColor(impact.confidence)}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: 11 }}
            />
            <Typography variant="caption" color="text.secondary">
              n={impact.n}
            </Typography>
            {isCheck && impact.avgQuality !== null && (
              <Tooltip title="Calidad promedio cuando se cumplió (1-5)" arrow>
                <Typography variant="caption" color="text.secondary">
                  ★ {impact.avgQuality.toFixed(1)}/5
                </Typography>
              </Tooltip>
            )}
          </Stack>
          {impact.confidence !== 'insufficient' && (
            <Typography variant="caption" sx={{ color: directionColor, fontWeight: 500 }}>
              {directionLabel}
              {impact.delta !== null && (
                <>
                  {' · Δ '}
                  {impact.delta > 0 ? '+' : ''}
                  {impact.delta.toFixed(2)} pts
                </>
              )}
              {impact.correlation !== null && (
                <>
                  {' · r '}
                  {impact.correlation > 0 ? '+' : ''}
                  {impact.correlation.toFixed(2)}
                </>
              )}
            </Typography>
          )}
          {impact.levels && <LevelComparison levels={impact.levels} />}
        </Box>
        <Box sx={{ width: 140, minWidth: 100 }}>
          <LinearProgress
            variant="determinate"
            value={magnitude * 100}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: alpha(directionColor, 0.12),
              '& .MuiLinearProgress-bar': {
                backgroundColor: directionColor,
                borderRadius: 4,
              },
            }}
          />
        </Box>
      </Stack>
    </Box>
  );
}
