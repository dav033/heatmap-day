'use client';

import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { deleteDayAction } from '@/features/calendar/api/actions';

interface DayDangerZoneProps {
  date: string;
}

export function DayDangerZone({ date }: DayDangerZoneProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const confirm = () => {
    startTransition(async () => {
      await deleteDayAction({ date });
      setOpen(false);
      router.push('/');
      router.refresh();
    });
  };

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'error.dark',
        backgroundColor: 'rgba(244, 67, 54, 0.06)',
      }}
    >
      <Stack spacing={0.5}>
        <Typography variant="subtitle2" color="error.light">
          Borrar toda la información del día
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Elimina puntaje, nota, valores de trackers y tags. No se puede deshacer.
        </Typography>
      </Stack>
      <Button
        variant="outlined"
        color="error"
        startIcon={<DeleteForeverIcon />}
        onClick={() => setOpen(true)}
        disabled={pending}
      >
        Borrar día
      </Button>

      <Dialog open={open} onClose={() => !pending && setOpen(false)}>
        <DialogTitle>¿Borrar todo el día {date}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Se eliminarán el puntaje, la nota, todos los valores de trackers y los tags
            asociados a este día. Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={confirm} color="error" variant="contained" disabled={pending}>
            {pending ? 'Borrando…' : 'Sí, borrar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
