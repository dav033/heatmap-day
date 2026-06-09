'use client';

import SaveIcon from '@mui/icons-material/Save';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState, useTransition } from 'react';

import { setDayNoteAction } from '@/features/calendar/api/actions';

interface DayNoteEditorProps {
  date: string;
  initialNote: string | null;
}

/**
 * Edita la nota libre del día. Autosave con debounce + botón explícito por si
 * el usuario quiere forzar el guardado. Estado claro de "guardando/guardado".
 */
export function DayNoteEditor({ date, initialNote }: DayNoteEditorProps) {
  const [value, setValue] = useState(initialNote ?? '');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const persist = (next: string) => {
    startTransition(async () => {
      await setDayNoteAction({ date, note: next.length === 0 ? null : next });
      setSavedAt(Date.now());
    });
  };

  const onChange = (next: string) => {
    setValue(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => persist(next), 700);
  };

  return (
    <Stack spacing={1}>
      <TextField
        label="Nota del día"
        multiline
        minRows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="¿Qué pasó hoy? Cómo te sentiste…"
        fullWidth
      />
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
          {pending
            ? 'Guardando…'
            : savedAt
              ? 'Guardado.'
              : 'Autosave activado.'}
        </Typography>
        <Button
          size="small"
          startIcon={<SaveIcon />}
          disabled={pending}
          onClick={() => persist(value)}
        >
          Guardar ahora
        </Button>
      </Stack>
    </Stack>
  );
}
