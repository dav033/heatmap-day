'use client';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useState } from 'react';

import type { StatisticsResult } from '../application/statisticsService';
import { getStatisticsAction } from '../api/statisticsActions';

import { CumulativeEffectList } from './CumulativeEffectList';
import { KpiCards } from './KpiCards';
import { PatternSummaryView } from './PatternSummaryView';
import { StreakBadges } from './StreakBadges';
import { TrackerImpactList } from './TrackerImpactList';
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
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p: RangePreset) => {
    setLoading(true);
    try {
      const data = await getStatisticsAction(p);
      setResult(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(preset);
  }, [preset, load]);

  if (loading && !result) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4 }}>
        <CircularProgress size={20} />
        <Typography color="text.secondary">Calculando estadísticas…</Typography>
      </Box>
    );
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
          onChange={(_, v) => v && setPreset(v as RangePreset)}
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
        title="Impacto por factor"
        subtitle="La dirección se descubre desde los datos (correlación / delta), no se asume."
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
        return (
          <SectionPaper key={effect.trackerId} title={impact?.trackerName ?? effect.trackerName}>
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

function SectionPaper({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
      {title && (
        <Typography variant="h4" gutterBottom>
          {title}
        </Typography>
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
