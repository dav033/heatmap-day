'use client';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState, useTransition } from 'react';

import type { Category, Polarity, Tracker, TrackerType } from '@/core/domain';

import { createTrackerAction, updateTrackerAction } from '../api/actions';

interface TrackerFormProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  /** Si llega un tracker, modo edición. Si no, creación. */
  tracker?: Tracker | null;
  /** Cuántos valores tiene el tracker (modo edición). Si > 0, no se puede cambiar el tipo. */
  hasValues?: boolean;
}

interface FormState {
  name: string;
  type: TrackerType;
  unit: string;
  target: string;
  expectedPolarity: Polarity;
  categoryId: string;
}

const EMPTY: FormState = {
  name: '',
  type: 'CHECK',
  unit: '',
  target: '',
  expectedPolarity: 'UNKNOWN',
  categoryId: '',
};

function trackerToState(t: Tracker): FormState {
  return {
    name: t.name,
    type: t.type,
    unit: t.unit ?? '',
    target: t.target !== undefined ? String(t.target) : '',
    expectedPolarity: t.expectedPolarity,
    categoryId: t.categoryId ?? '',
  };
}

export function TrackerForm({
  open,
  onClose,
  categories,
  tracker,
  hasValues,
}: TrackerFormProps) {
  const [state, setState] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setState(tracker ? trackerToState(tracker) : EMPTY);
    setError(null);
  }, [tracker, open]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const submit = () => {
    setError(null);
    const target = state.target.trim() === '' ? undefined : Number(state.target);
    if (state.target.trim() !== '' && !Number.isFinite(target)) {
      setError('Meta debe ser un número.');
      return;
    }
    startTransition(async () => {
      try {
        if (tracker) {
          await updateTrackerAction({
            trackerId: tracker.id,
            name: state.name,
            unit: state.unit || null,
            target: state.target.trim() === '' ? null : target,
            expectedPolarity: state.expectedPolarity,
            categoryId: state.categoryId || null,
            type: hasValues ? undefined : state.type,
          });
        } else {
          await createTrackerAction({
            name: state.name,
            type: state.type,
            unit: state.unit || undefined,
            target,
            expectedPolarity: state.expectedPolarity,
            categoryId: state.categoryId || undefined,
          });
        }
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al guardar.');
      }
    });
  };

  const isCounter = state.type === 'COUNTER';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{tracker ? 'Editar tracker' : 'Nuevo tracker'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Nombre"
            value={state.name}
            onChange={(e) => update('name', e.target.value)}
            autoFocus
            fullWidth
          />

          <TextField
            select
            label="Tipo"
            value={state.type}
            onChange={(e) => update('type', e.target.value as TrackerType)}
            disabled={!!tracker && !!hasValues}
            helperText={
              tracker && hasValues
                ? 'No se puede cambiar el tipo: ya hay datos registrados.'
                : undefined
            }
          >
            <MenuItem value="CHECK">Check (sí/no)</MenuItem>
            <MenuItem value="SCALE">Escala 0–10 (10 = óptimo)</MenuItem>
            <MenuItem value="COUNTER">Contador numérico</MenuItem>
          </TextField>

          {isCounter && (
            <TextField
              label="Unidad (opcional)"
              value={state.unit}
              onChange={(e) => update('unit', e.target.value)}
              placeholder="ej: vasos, horas, km"
            />
          )}

          {(isCounter || state.type === 'SCALE') && (
            <TextField
              label="Meta / ideal (opcional)"
              value={state.target}
              onChange={(e) => update('target', e.target.value)}
              placeholder={isCounter ? 'ej: 3' : 'ej: 8'}
            />
          )}

          <TextField
            select
            label="Polaridad esperada"
            value={state.expectedPolarity}
            onChange={(e) => update('expectedPolarity', e.target.value as Polarity)}
            helperText="Solo pista visual. El motor descubre la dirección real con los datos."
          >
            <MenuItem value="POSITIVE">Positivo (más = mejor)</MenuItem>
            <MenuItem value="NEGATIVE">Negativo (más = peor)</MenuItem>
            <MenuItem value="UNKNOWN">Sin asumir</MenuItem>
          </TextField>

          <TextField
            select
            label="Categoría (opcional)"
            value={state.categoryId}
            onChange={(e) => update('categoryId', e.target.value)}
          >
            <MenuItem value="">— Sin categoría —</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>

          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>
          Cancelar
        </Button>
        <Button onClick={submit} variant="contained" disabled={pending}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
