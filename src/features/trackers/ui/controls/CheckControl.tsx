'use client';

import ClearIcon from '@mui/icons-material/Clear';
import IconButton from '@mui/material/IconButton';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { useOptimistic, useTransition } from 'react';

import type { Tracker } from '@/core/domain';

import {
  removeTrackerValueAction,
  upsertTrackerValueAction,
} from '../../api/valueActions';

interface CheckControlProps {
  tracker: Tracker;
  date: string;
  initialDone: boolean | null;
  initialQuality?: number | null;
}

const QUALITY_LABELS = ['', 'Malo', 'Regular', 'Normal', 'Bien', 'Excelente'];

export function CheckControl({ tracker, date, initialDone, initialQuality }: CheckControlProps) {
  const [optimistic, setOptimistic] = useOptimistic<boolean | null, boolean | null>(
    initialDone,
    (_p, next) => next,
  );
  const [optimisticQuality, setOptimisticQuality] = useOptimistic<number | null, number | null>(
    initialQuality ?? null,
    (_p, next) => next,
  );
  const [pending, startTransition] = useTransition();

  const onToggle = (_e: unknown, checked: boolean) => {
    startTransition(async () => {
      setOptimistic(checked);
      setOptimisticQuality(checked ? (optimisticQuality ?? null) : null);
      await upsertTrackerValueAction({
        date,
        value: {
          trackerId: tracker.id,
          kind: 'CHECK',
          done: checked,
          ...(checked ? { quality: optimisticQuality ?? undefined } : {}),
        },
      });
    });
  };

  const onQualityChange = (_e: unknown, newValue: number | null) => {
    if (!optimistic) return;
    const q = newValue ?? undefined;
    startTransition(async () => {
      setOptimisticQuality(newValue);
      await upsertTrackerValueAction({
        date,
        value: { trackerId: tracker.id, kind: 'CHECK', done: true, quality: q },
      });
    });
  };

  const onClear = () => {
    startTransition(async () => {
      setOptimistic(null);
      setOptimisticQuality(null);
      await removeTrackerValueAction({ date, trackerId: tracker.id });
    });
  };

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
      <Switch checked={!!optimistic} onChange={onToggle} disabled={pending} />
      {optimistic && (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Rating
            value={optimisticQuality}
            onChange={onQualityChange}
            max={5}
            size="small"
            sx={{ ml: 0.5 }}
          />
          {optimisticQuality && (
            <Typography variant="caption" color="text.secondary">
              {QUALITY_LABELS[optimisticQuality] ?? ''}
            </Typography>
          )}
        </Stack>
      )}
      <Tooltip title="Marcar como no registrado">
        <span>
          <IconButton
            size="small"
            disabled={pending || optimistic === null}
            onClick={onClear}
            aria-label="No registrado"
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}