'use client';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useMemo, useState, useTransition } from 'react';

import type { Category, Tracker } from '@/core/domain';

import {
  removeCategoryAction,
  reorderTrackersAction,
} from '../api/actions';

import { ArchivedTrackers } from './ArchivedTrackers';
import { CategoryForm } from './CategoryForm';
import { TrackerForm } from './TrackerForm';
import { TrackerRow } from './TrackerRow';

interface TrackersManagerProps {
  active: Tracker[];
  archived: Tracker[];
  categories: Category[];
  /** Cuántos valores tiene cada tracker (limita el cambio de tipo). */
  valueCountByTracker: Record<string, number>;
}

interface DialogState {
  trackerOpen: boolean;
  editingTracker: Tracker | null;
  categoryOpen: boolean;
  editingCategory: Category | null;
}

const INITIAL_DIALOG: DialogState = {
  trackerOpen: false,
  editingTracker: null,
  categoryOpen: false,
  editingCategory: null,
};

export function TrackersManager({
  active,
  archived,
  categories,
  valueCountByTracker,
}: TrackersManagerProps) {
  const [dialog, setDialog] = useState<DialogState>(INITIAL_DIALOG);
  const [pending, startTransition] = useTransition();

  // Agrupa trackers por categoría preservando el orden.
  const grouped = useMemo(() => {
    const byCat = new Map<string | null, Tracker[]>();
    for (const t of active) {
      const key = t.categoryId ?? null;
      const arr = byCat.get(key) ?? [];
      arr.push(t);
      byCat.set(key, arr);
    }
    const cats: Array<{ category: Category | null; trackers: Tracker[] }> = categories.map(
      (c) => ({ category: c, trackers: byCat.get(c.id) ?? [] }),
    );
    const uncat = byCat.get(null) ?? [];
    if (uncat.length > 0) cats.push({ category: null, trackers: uncat });
    return cats;
  }, [active, categories]);

  const moveTracker = (id: string, dir: -1 | 1) => {
    const idx = active.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= active.length) return;
    const ids = active.map((t) => t.id);
    [ids[idx], ids[next]] = [ids[next]!, ids[idx]!];
    startTransition(async () => {
      await reorderTrackersAction(ids);
    });
  };

  const removeCategory = (id: string) =>
    startTransition(async () => {
      await removeCategoryAction(id);
    });

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography variant="h2" sx={{ flexGrow: 1 }}>
          Trackers
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setDialog({ ...INITIAL_DIALOG, categoryOpen: true })}
        >
          Categoría
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialog({ ...INITIAL_DIALOG, trackerOpen: true })}
        >
          Tracker
        </Button>
      </Stack>

      {grouped.length === 0 && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography color="text.secondary">
            Todavía no tenés trackers. Empezá creando uno (ej. «Sueño» como escala 0–10).
          </Typography>
        </Paper>
      )}

      {grouped.map(({ category, trackers }) => (
        <Paper key={category?.id ?? '__none__'} variant="outlined">
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
              px: 2,
              py: 1.5,
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h3" sx={{ flexGrow: 1 }}>
              {category?.name ?? 'Sin categoría'}
            </Typography>
            {category && (
              <>
                <Tooltip title="Editar categoría">
                  <IconButton
                    size="small"
                    onClick={() =>
                      setDialog({
                        ...INITIAL_DIALOG,
                        categoryOpen: true,
                        editingCategory: category,
                      })
                    }
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar categoría (no borra los trackers)">
                  <span>
                    <IconButton
                      size="small"
                      disabled={pending}
                      onClick={() => removeCategory(category.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            )}
          </Stack>
          {trackers.length === 0 ? (
            <Typography color="text.secondary" sx={{ px: 2, py: 2 }}>
              Sin trackers en esta categoría.
            </Typography>
          ) : (
            trackers.map((t) => {
              const idxInAll = active.findIndex((x) => x.id === t.id);
              return (
                <TrackerRow
                  key={t.id}
                  tracker={t}
                  canMoveUp={idxInAll > 0}
                  canMoveDown={idxInAll < active.length - 1}
                  onMove={(dir) => moveTracker(t.id, dir)}
                  onEdit={(tr) =>
                    setDialog({
                      ...INITIAL_DIALOG,
                      trackerOpen: true,
                      editingTracker: tr,
                    })
                  }
                />
              );
            })
          )}
        </Paper>
      ))}

      <ArchivedTrackers trackers={archived} />

      <TrackerForm
        key={`tracker-${dialog.editingTracker?.id ?? 'new'}-${dialog.trackerOpen}`}
        open={dialog.trackerOpen}
        onClose={() => setDialog(INITIAL_DIALOG)}
        categories={categories}
        tracker={dialog.editingTracker}
        hasValues={
          dialog.editingTracker
            ? (valueCountByTracker[dialog.editingTracker.id] ?? 0) > 0
            : false
        }
      />
      <CategoryForm
        key={`category-${dialog.editingCategory?.id ?? 'new'}-${dialog.categoryOpen}`}
        open={dialog.categoryOpen}
        onClose={() => setDialog(INITIAL_DIALOG)}
        category={dialog.editingCategory}
      />
    </Stack>
  );
}
