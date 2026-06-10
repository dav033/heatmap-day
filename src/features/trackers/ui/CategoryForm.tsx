'use client';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useState, useTransition } from 'react';

import type { Category } from '@/core/domain';

import { createCategoryAction, updateCategoryAction } from '../api/actions';

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  category?: Category | null;
}

/**
 * El estado se inicializa desde props; el padre fuerza un remount con `key`
 * cada vez que abre el diálogo, así no hace falta sincronizar con useEffect.
 */
export function CategoryForm({ open, onClose, category }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color ?? '');
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      if (category) {
        await updateCategoryAction({ id: category.id, name, color: color || null });
      } else {
        await createCategoryAction({ name, color: color || undefined });
      }
      onClose();
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{category ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            fullWidth
          />
          <TextField
            label="Color (opcional)"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#7c9cff"
          />
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
