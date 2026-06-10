'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

type Quality = 'bad' | 'medium' | 'good';
type Action = 'record' | 'day' | 'week';

interface ApiResult {
  action: Action;
  quality: Quality;
  seed: number;
  dates: string[];
  meanScore: number;
  deletedDays?: number;
}

const QUALITY_COLOR: Record<Quality, 'error' | 'warning' | 'success'> = {
  bad: 'error',
  medium: 'warning',
  good: 'success',
};

interface Section {
  action: Action;
  title: string;
  description: string;
  labels: Record<Quality, string>;
}

const SECTIONS: Section[] = [
  {
    action: 'record',
    title: 'Registro completo (1 mes)',
    description:
      'Borra TODO el historial de días y genera 30 días hasta hoy. ' +
      'Malo: media < 6 · Medio: media entre 6 y 8 · Bueno: media > 8. ' +
      'Los trackers, categorías y tags no se tocan.',
    labels: { bad: 'Registro malo', medium: 'Registro medio', good: 'Registro bueno' },
  },
  {
    action: 'day',
    title: 'Insertar un día',
    description:
      'Crea un día en la fecha libre más reciente (de hoy hacia atrás). ' +
      'No borra ni pisa días existentes.',
    labels: { bad: 'Día malo', medium: 'Día medio', good: 'Día bueno' },
  },
  {
    action: 'week',
    title: 'Insertar una semana',
    description:
      'Crea 7 días consecutivos en el bloque libre más reciente. ' +
      'No borra ni pisa días existentes.',
    labels: { bad: 'Semana mala', medium: 'Semana media', good: 'Semana buena' },
  },
];

function describeResult(r: ApiResult): string {
  const range =
    r.dates.length === 1
      ? `el día ${r.dates[0]}`
      : `${r.dates.length} días (${r.dates[0]} → ${r.dates[r.dates.length - 1]})`;
  const deleted =
    r.deletedDays !== undefined ? ` Se borraron ${r.deletedDays} días previos.` : '';
  return `Se creó ${range} con puntaje medio ${r.meanScore} (semilla ${r.seed}).${deleted}`;
}

export default function TestPage() {
  const [pending, setPending] = useState<{ action: Action; quality: Quality } | null>(null);
  const [confirm, setConfirm] = useState<Quality | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: Action, quality: Quality) => {
    setPending({ action, quality });
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/test-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, quality }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `Error HTTP ${res.status}`);
      setResult(body as ApiResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setPending(null);
    }
  };

  return (
    <Box>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h1">Test</Typography>
        <Typography variant="body2" color="text.secondary">
          Generación pseudoaleatoria de datos de prueba. Solo para desarrollo.
        </Typography>
      </Stack>

      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {result && <Alert severity="success">{describeResult(result)}</Alert>}

        {SECTIONS.map((section) => (
          <Paper key={section.action} variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Stack spacing={0.5}>
                <Typography variant="h3">{section.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {section.description}
                </Typography>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {(['bad', 'medium', 'good'] as const).map((quality) => {
                  const isPending =
                    pending?.action === section.action && pending.quality === quality;
                  return (
                    <Button
                      key={quality}
                      variant="outlined"
                      color={QUALITY_COLOR[quality]}
                      disabled={pending !== null}
                      startIcon={isPending ? <CircularProgress size={16} /> : undefined}
                      onClick={() =>
                        section.action === 'record'
                          ? setConfirm(quality)
                          : run(section.action, quality)
                      }
                    >
                      {section.labels[quality]}
                    </Button>
                  );
                })}
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Dialog open={confirm !== null} onClose={() => setConfirm(null)}>
        <DialogTitle>¿Reemplazar todo el historial?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Crear un registro completo borra todos los días registrados (puntajes,
            valores de trackers y tags de día) y los reemplaza por un mes generado.
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (confirm) void run('record', confirm);
              setConfirm(null);
            }}
          >
            Borrar y generar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
