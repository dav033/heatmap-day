'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { TrackerImpact } from '@/features/statistics/application/statisticsService';

import { DivergingBar } from './DivergingBar';

/**
 * Influencia normalizada a [-1, 1] para poder comparar trackers de distinto
 * tipo en un mismo eje:
 *  - CHECK: delta de puntaje (hecho vs. no hecho), saturando en ±4 pts.
 *  - SCALE / COUNTER: correlación de Pearson con el puntaje del día.
 */
export function influenceOf(impact: TrackerImpact): number | null {
  if (impact.trackerType === 'CHECK') {
    if (impact.delta === null) return null;
    return Math.max(-1, Math.min(1, impact.delta / 4));
  }
  return impact.correlation;
}

function detailLabel(impact: TrackerImpact): string {
  if (impact.trackerType === 'CHECK' && impact.delta !== null) {
    return `Δ ${impact.delta > 0 ? '+' : ''}${impact.delta.toFixed(2)} pts`;
  }
  if (impact.correlation !== null) {
    return `r ${impact.correlation > 0 ? '+' : ''}${impact.correlation.toFixed(2)}`;
  }
  return '—';
}

const GRID_COLUMNS = { xs: 'minmax(96px, 130px) 1fr 78px', sm: 'minmax(130px, 180px) 1fr 92px' };

interface TrackerInfluenceChartProps {
  impacts: TrackerImpact[];
}

/**
 * Gráfico de barras divergentes: una barra por tracker, hacia la derecha en
 * verde si su influencia sobre el puntaje es buena y hacia la izquierda en
 * rojo si es mala. Ordenado de mejor a peor influencia.
 */
export function TrackerInfluenceChart({ impacts }: TrackerInfluenceChartProps) {
  const withInfluence = impacts
    .map((impact) => ({ impact, influence: influenceOf(impact) }))
    .filter((d): d is { impact: TrackerImpact; influence: number } => d.influence !== null)
    .sort((a, b) => b.influence - a.influence);

  const withoutData = impacts.filter((i) => influenceOf(i) === null);

  if (withInfluence.length === 0) {
    return (
      <Typography color="text.secondary">
        Todavía no hay datos suficientes para medir influencias.
      </Typography>
    );
  }

  return (
    <Stack spacing={0.75}>
      {/* Leyenda alineada con la columna de barras */}
      <Box sx={{ display: 'grid', gridTemplateColumns: GRID_COLUMNS, gap: 1.5 }}>
        <Box />
        <Stack direction="row" sx={{ justifyContent: 'space-between', px: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#f87171', fontWeight: 600 }}>
            ← Mala influencia
          </Typography>
          <Typography variant="caption" sx={{ color: '#4ade80', fontWeight: 600 }}>
            Buena influencia →
          </Typography>
        </Stack>
        <Box />
      </Box>

      {withInfluence.map(({ impact, influence }) => {
        const dimmed = impact.confidence === 'insufficient';
        const directionText =
          influence > 0.05
            ? 'buena influencia (sube el puntaje)'
            : influence < -0.05
              ? 'mala influencia (baja el puntaje)'
              : 'sin efecto claro';
        const levelsText = impact.levels
          ? ` · ${impact.levels.lowLabel.toLowerCase()} promedia ${impact.levels.lowMean.toFixed(1)}, ${impact.levels.highLabel.toLowerCase()} promedia ${impact.levels.highMean.toFixed(1)}`
          : '';
        const tooltip = `${impact.trackerName}: ${directionText} · ${detailLabel(impact)} · n=${impact.n}${levelsText}${
          dimmed ? ' · datos insuficientes' : ''
        }`;
        return (
          <Box
            key={impact.trackerId}
            sx={{
              display: 'grid',
              gridTemplateColumns: GRID_COLUMNS,
              gap: 1.5,
              alignItems: 'center',
            }}
          >
            <Typography
              variant="body2"
              noWrap
              sx={{ fontWeight: 500, opacity: dimmed ? 0.6 : 1 }}
              title={impact.trackerName}
            >
              {impact.trackerName}
            </Typography>
            <DivergingBar value={influence} dimmed={dimmed} tooltip={tooltip} />
            <Typography
              variant="caption"
              sx={{
                textAlign: 'right',
                fontWeight: 600,
                color: dimmed
                  ? 'text.disabled'
                  : influence > 0.05
                    ? '#4ade80'
                    : influence < -0.05
                      ? '#f87171'
                      : 'text.secondary',
              }}
            >
              {detailLabel(impact)}
            </Typography>
          </Box>
        );
      })}

      {withoutData.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Sin datos suficientes: {withoutData.map((i) => i.trackerName).join(', ')}
        </Typography>
      )}
    </Stack>
  );
}
