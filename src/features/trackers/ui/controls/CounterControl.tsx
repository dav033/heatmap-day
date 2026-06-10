'use client';

import ClearIcon from '@mui/icons-material/Clear';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useEffect, useOptimistic, useRef, useState, useTransition, type ChangeEvent } from 'react';

import type { Tracker } from '@/core/domain';

import {
  removeTrackerValueAction,
  upsertTrackerValueAction,
} from '../../api/valueActions';

interface CounterControlProps {
  tracker: Tracker;
  date: string;
  initialValue: number | null;
}

export function CounterControl({ tracker, date, initialValue }: CounterControlProps) {
  const [optimistic, setOptimistic] = useOptimistic<number | null, number | null>(
    initialValue,
    (_p, next) => next,
  );
  // Valor en vivo mientras se escribe; el guardado se debouncea para no
  // disparar una server action por cada tecla.
  const [draft, setDraft] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const commit = (v: number | null) => {
    startTransition(async () => {
      setOptimistic(v);
      if (v === null) {
        await removeTrackerValueAction({ date, trackerId: tracker.id });
      } else {
        await upsertTrackerValueAction({
          date,
          value: { trackerId: tracker.id, kind: 'COUNTER', value: v },
        });
      }
    });
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    if (timer.current) clearTimeout(timer.current);
    if (raw === '') {
      setDraft(null);
      return commit(null);
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    setDraft(n);
    timer.current = setTimeout(() => {
      setDraft(null);
      commit(n);
    }, 500);
  };

  const shown = draft ?? optimistic;
  const target = tracker.target;
  const ratio =
    target !== undefined && target > 0 && shown !== null
      ? Math.min(100, Math.max(0, (shown / target) * 100))
      : null;

  return (
    <Stack spacing={1} sx={{ minWidth: 220 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <TextField
          type="number"
          size="small"
          value={shown ?? ''}
          onChange={onChange}
          placeholder="—"
          sx={{ width: 110 }}
          slotProps={{ htmlInput: { step: 'any' } }}
        />
        {tracker.unit && (
          <Typography variant="body2" color="text.secondary">
            {tracker.unit}
          </Typography>
        )}
        {target !== undefined && (
          <Typography variant="caption" color="text.secondary">
            / meta {target}
          </Typography>
        )}
        <Tooltip title="Marcar como no registrado">
          <span>
            <IconButton
              size="small"
              disabled={pending || shown === null}
              onClick={() => {
                if (timer.current) clearTimeout(timer.current);
                setDraft(null);
                commit(null);
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      {ratio !== null && (
        <LinearProgress variant="determinate" value={ratio} sx={{ height: 6, borderRadius: 1 }} />
      )}
    </Stack>
  );
}
