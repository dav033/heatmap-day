'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { StatisticsResult } from '../application/statisticsService';
import { getStatisticsAction } from '../api/statisticsActions';

import { CumulativeEffectList } from './CumulativeEffectList';
import { KpiCards } from './KpiCards';
import { PatternSummaryView } from './PatternSummaryView';
import { StreakBadges } from './StreakBadges';
import { TrackerImpactList } from './TrackerImpactList';
import { TrackerInfluenceChart } from './TrackerInfluenceChart';
import { TrackerTrendChart } from './TrackerTrendChart';

type RangePreset = 'week' | 'month' | 'year' | 'all';

const PRESET_LABELS: Record<RangePreset, string> = {
  week: 'Semana',
  month: 'Mes',
  year: 'Año',
  all: 'Todo',
};

export function StatsDashboard() {
  const [preset, setPreset] = useState<RangePreset>('month');
  const [result, setResult] = useState<StatisticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  // Evita aplicar respuestas fuera de orden al cambiar de rango rápido.
  const requestSeq = useRef(0);

  // Solo setState asíncrono (tras el await): el indicador de carga lo prende
  // el handler del toggle o el estado inicial, no el cuerpo del efecto.
  const load = useCallback(async (p: RangePreset) => {
    const id = ++requestSeq.current;
    try {
      const data = await getStatisticsAction(p);
      if (requestSeq.current === id) setResult(data);
    } finally {
      if (requestSeq.current === id) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(preset);
  }, [preset, load]);

  const changePreset = (p: RangePreset) => {
    setLoading(true);
    setPreset(p);
  };

  if (loading && !result) {
    return <StatsSkeleton />;
  }

  if (!result) {
    return <Typography color="text.secondary">Sin datos.</Typography>;
  }

  const rangeLabel = `${result.range.start} → ${result.range.end}`;
  const bestStreak = result.patterns.scoreHighStreaks.reduce(
    (max, s) => Math.max(max, s.length),
    0,
  );
  const worstStreak = result.patterns.scoreLowStreaks.reduce(
    (max, s) => Math.max(max, s.length),
    0,
  );

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'center' }, mb: 3, flexWrap: 'wrap' }}
      >
        <ToggleButtonGroup
          size="small"
          value={preset}
          exclusive
          onChange={(_, v) => v && changePreset(v as RangePreset)}
        >
          {(Object.keys(PRESET_LABELS) as RangePreset[]).map((k) => (
            <ToggleButton key={k} value={k}>
              {PRESET_LABELS[k]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography variant="caption" color="text.secondary">
          {rangeLabel}
        </Typography>
        {loading && <CircularProgress size={16} />}
      </Stack>

      <KpiCards
        totalDays={result.patterns.totalDays}
        mean={result.patterns.overallMean}
        median={result.patterns.overallMedian}
        slope={result.scoreTrend.slope}
        bestStreakLength={bestStreak > 0 ? bestStreak : null}
        worstStreakLength={worstStreak > 0 ? worstStreak : null}
      />

      <SectionPaper title="Tendencia del puntaje">
        {result.scoreTrend.series.length > 0 ? (
          <>
            <StreakBadges
              lowStreaks={result.patterns.scoreLowStreaks}
              highStreaks={result.patterns.scoreHighStreaks}
            />
            <TrackerTrendChart
              title="Puntaje diario"
              series={result.scoreTrend.series}
              movingAvg7={result.scoreTrend.ma7}
              color="#7c9cff"
              maColor="#c084fc"
            />
          </>
        ) : (
          <Typography color="text.secondary">Sin datos de puntaje en el rango.</Typography>
        )}
      </SectionPaper>

      <SectionPaper
        title="Influencia de cada tracker"
        subtitle="Barra verde hacia la derecha: buena influencia (sube el puntaje del día). Barra roja hacia la izquierda: mala influencia (lo baja). La dirección se descubre desde los datos (correlación / delta), no se asume."
      >
        <TrackerInfluenceChart impacts={result.trackerImpacts} />
      </SectionPaper>

      <SectionPaper
        title="Detalle del impacto por factor"
        subtitle="Mismos datos que arriba, con confianza, cantidad de días y calidad promedio."
      >
        <TrackerImpactList impacts={result.trackerImpacts} />
      </SectionPaper>

      <SectionPaper
        title="Efectos acumulativos"
        subtitle="Detecta cómo las rachas y las medias móviles de cada factor se relacionan con el puntaje."
      >
        <CumulativeEffectList effects={result.cumulativeEffects} />
      </SectionPaper>

      <SectionPaper title="Patrones">
        <PatternSummaryView patterns={result.patterns} />
      </SectionPaper>

      {/* Tracker trend charts — raw values + MA overlay */}
      {result.cumulativeEffects.map((effect) => {
        const impact = result.trackerImpacts.find((i) => i.trackerId === effect.trackerId);
        if (effect.rawSeries.length === 0) return null;
        const yDomain: [number, number] | undefined =
          impact?.trackerType === 'CHECK'
            ? [0, 1.2]
            : impact?.trackerType === 'SCALE'
              ? [0, 10]
              : undefined;
        const showDirection =
          impact &&
          impact.confidence !== 'insufficient' &&
          (impact.discoveredDirection === 'positive' || impact.discoveredDirection === 'negative');
        return (
          <SectionPaper
            key={effect.trackerId}
            title={impact?.trackerName ?? effect.trackerName}
            badge={
              showDirection ? (
                <Chip
                  size="small"
                  variant="outlined"
                  color={impact.discoveredDirection === 'positive' ? 'success' : 'error'}
                  label={
                    impact.discoveredDirection === 'positive'
                      ? 'Buena influencia'
                      : 'Mala influencia'
                  }
                  sx={{ height: 22 }}
                />
              ) : undefined
            }
          >
            <TrackerTrendChart
              title=""
              series={effect.rawSeries}
              movingAvg3={effect.ma3}
              movingAvg7={effect.ma7}
              color="#42a5f5"
              yDomain={yDomain}
            />
          </SectionPaper>
        );
      })}
    </Box>
  );
}

function StatsSkeleton() {
  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Skeleton variant="rounded" width={280} height={36} />
      </Stack>
      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', rowGap: 2 }}>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} variant="rounded" width={180} height={92} />
        ))}
      </Stack>
      <Skeleton variant="rounded" height={280} sx={{ mb: 3 }} />
      <Skeleton variant="rounded" height={200} sx={{ mb: 3 }} />
      <Skeleton variant="rounded" height={200} />
    </Box>
  );
}

function SectionPaper({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
      {title && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', mb: 1, flexWrap: 'wrap' }}
        >
          <Typography variant="h4">{title}</Typography>
          {badge}
        </Stack>
      )}
      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          {subtitle}
        </Typography>
      )}
      {children}
    </Paper>
  );
}
