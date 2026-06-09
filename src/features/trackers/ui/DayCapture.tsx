'use client';

import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';

import type { Category, Tracker, TrackerValue } from '@/core/domain';

import { CheckControl } from './controls/CheckControl';
import { CounterControl } from './controls/CounterControl';
import { ScaleControl } from './controls/ScaleControl';

interface DayCaptureProps {
  date: string;
  activeTrackers: Tracker[];
  categories: Category[];
  values: TrackerValue[];
}

function findValue(values: TrackerValue[], trackerId: string): TrackerValue | undefined {
  return values.find((v) => v.trackerId === trackerId);
}

function checkInitial(v: TrackerValue | undefined): boolean | null {
  if (!v || v.kind !== 'CHECK') return null;
  return v.done;
}

function checkQuality(v: TrackerValue | undefined): number | null {
  if (!v || v.kind !== 'CHECK') return null;
  return v.quality ?? null;
}

function numericInitial(v: TrackerValue | undefined): number | null {
  if (!v) return null;
  if (v.kind === 'SCALE' || v.kind === 'COUNTER') return v.value;
  return null;
}

export function DayCapture({ date, activeTrackers, categories, values }: DayCaptureProps) {
  const grouped = useMemo(() => {
    const catMap = new Map(categories.map((c) => [c.id, c]));
    const byCat = new Map<string | null, Tracker[]>();
    for (const t of activeTrackers) {
      const key = t.categoryId ?? null;
      const arr = byCat.get(key) ?? [];
      arr.push(t);
      byCat.set(key, arr);
    }
    const out: Array<{ name: string; trackers: Tracker[] }> = [];
    for (const c of categories) {
      const list = byCat.get(c.id);
      if (list && list.length > 0) out.push({ name: c.name, trackers: list });
    }
    const uncat = byCat.get(null);
    if (uncat && uncat.length > 0) out.push({ name: 'Sin categoría', trackers: uncat });
    // Categorías inexistentes (por si quedaron huérfanas)
    for (const [k, list] of byCat) {
      if (k && !catMap.has(k)) out.push({ name: 'Sin categoría', trackers: list });
    }
    return out;
  }, [activeTrackers, categories]);

  if (activeTrackers.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography color="text.secondary">
          No hay trackers activos para esta fecha. Andá a la pantalla de Trackers para crearlos.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      {grouped.map((g) => (
        <Paper key={g.name} variant="outlined">
          <Typography
            variant="h3"
            sx={{
              px: 2,
              py: 1.5,
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            {g.name}
          </Typography>
          <Stack divider={<div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }} />}>
            {g.trackers.map((t) => {
              const v = findValue(values, t.id);
              return (
                <Stack
                  key={t.id}
                  direction="row"
                  spacing={2}
                  sx={{ alignItems: 'center', px: 2, py: 1.5 }}
                >
                  <Typography sx={{ flexGrow: 1 }}>{t.name}</Typography>
                  {t.type === 'CHECK' && (
                    <CheckControl tracker={t} date={date} initialDone={checkInitial(v)} initialQuality={checkQuality(v)} />
                  )}
                  {t.type === 'SCALE' && (
                    <ScaleControl tracker={t} date={date} initialValue={numericInitial(v)} />
                  )}
                  {t.type === 'COUNTER' && (
                    <CounterControl tracker={t} date={date} initialValue={numericInitial(v)} />
                  )}
                </Stack>
              );
            })}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
