'use client';

import ClearIcon from '@mui/icons-material/Clear';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useOptimistic, useTransition } from 'react';

import type { Tracker } from '@/core/domain';

import {
  removeTrackerValueAction,
  upsertTrackerValueAction,
} from '../../api/valueActions';

interface ScaleControlProps {
  tracker: Tracker;
  date: string;
  initialValue: number | null;
}

export function ScaleControl({ tracker, date, initialValue }: ScaleControlProps) {
  const [optimistic, setOptimistic] = useOptimistic<number | null, number | null>(
    initialValue,
    (_p, next) => next,
  );
  const [pending, startTransition] = useTransition();

  const commit = (v: number | null) => {
    startTransition(async () => {
      setOptimistic(v);
      if (v === null) {
        await removeTrackerValueAction({ date, trackerId: tracker.id });
      } else {
        await upsertTrackerValueAction({
          date,
          value: { trackerId: tracker.id, kind: 'SCALE', value: Math.round(v * 10) / 10 },
        });
      }
    });
  };

  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 280 }}>
      <Typography variant="body1" sx={{ minWidth: 30 }}>
        {optimistic === null ? '—' : optimistic.toFixed(1)}
      </Typography>
      <Slider
        value={optimistic ?? 0}
        min={0}
        max={10}
        step={0.1}
        valueLabelDisplay="auto"
        onChange={(_e, v) => commit(Math.round((Array.isArray(v) ? v[0]! : v) * 10) / 10)}
        disabled={pending}
        sx={{ flexGrow: 1 }}
      />
      <Tooltip title="Marcar como no registrado">
        <span>
          <IconButton
            size="small"
            disabled={pending || optimistic === null}
            onClick={() => commit(null)}
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
