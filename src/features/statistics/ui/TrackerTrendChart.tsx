'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { LineChart } from '@mui/x-charts/LineChart';
import { useMemo } from 'react';

import type { DatedNumber } from '@/features/statistics/domain';

interface TrackerTrendChartProps {
  title: string;
  series: DatedNumber[];
  movingAvg7?: DatedNumber[];
  movingAvg3?: DatedNumber[];
  color?: string;
  maColor?: string;
  ma3Color?: string;
  height?: number;
  /** Custom y-axis range (defaults to 0-10 for scores). */
  yDomain?: [number, number];
}

export function TrackerTrendChart({
  title,
  series,
  movingAvg7,
  movingAvg3,
  color = '#4fc3f7',
  maColor = '#ff9800',
  ma3Color = '#ce93d8',
  height = 250,
  yDomain,
}: TrackerTrendChartProps) {
  const chartData = useMemo(() => {
    if (series.length === 0)
      return { dates: [] as string[], values: [] as number[], ma7Values: [] as (number | null)[], ma3Values: [] as (number | null)[] };

    const dates = series.map((s) => {
      const parts = s.date.split('-');
      return `${parts[1]}/${parts[2]}`;
    });
    const values = series.map((s) => s.value);

    const ma7Values = new Array<number | null>(series.length).fill(null);
    if (movingAvg7 && movingAvg7.length > 0) {
      const maByDate = new Map(movingAvg7.map((m) => [m.date, m.value]));
      for (let i = 0; i < series.length; i++) {
        const v = maByDate.get(series[i]!.date);
        if (v !== undefined) ma7Values[i] = v;
      }
    }

    const ma3Values = new Array<number | null>(series.length).fill(null);
    if (movingAvg3 && movingAvg3.length > 0) {
      const maByDate = new Map(movingAvg3.map((m) => [m.date, m.value]));
      for (let i = 0; i < series.length; i++) {
        const v = maByDate.get(series[i]!.date);
        if (v !== undefined) ma3Values[i] = v;
      }
    }

    return { dates, values, ma7Values, ma3Values };
  }, [series, movingAvg7, movingAvg3]);

  if (series.length === 0) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sin datos suficientes para mostrar.
        </Typography>
      </Box>
    );
  }

  const hasMa7 = movingAvg7 && movingAvg7.length > 0;
  const hasMa3 = movingAvg3 && movingAvg3.length > 0;

  const seriesDef: Array<{
    data: number[] | (number | null)[];
    label: string;
    color: string;
    curve: 'linear';
    showMark: boolean;
  }> = [
    {
      data: chartData.values,
      label: title,
      color,
      curve: 'linear',
      showMark: series.length < 40,
    },
  ];

  if (hasMa7) {
    seriesDef.push({
      data: chartData.ma7Values,
      label: 'MA 7d',
      color: maColor,
      curve: 'linear',
      showMark: false,
    });
  }
  if (hasMa3) {
    seriesDef.push({
      data: chartData.ma3Values,
      label: 'MA 3d',
      color: ma3Color,
      curve: 'linear',
      showMark: false,
    });
  }

  const defaultY: [number, number] = yDomain ?? [0, 10];

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ width: '100%', height }}>
        <LineChart
          xAxis={[
            {
              data: chartData.dates,
              scaleType: 'point' as const,
              tickLabelStyle: { fontSize: 10 },
            },
          ]}
          series={seriesDef}
          yAxis={[{ min: defaultY[0], max: defaultY[1] }]}
          hideLegend={!hasMa7 && !hasMa3}
          margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
        />
      </Box>
    </Box>
  );
}