'use client';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useEffect, useState, useTransition } from 'react';

import type { Category } from '@/core/domain';

import { createCategoryAction, updateCategoryAction } from '../api/actions';

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  category?: Category | null;
}

export function CategoryForm({ open, onClose, category }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setName(category?.name ?? '');
    setColor(category?.color ?? '');
  }, [category, open]);

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
