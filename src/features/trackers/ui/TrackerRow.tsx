'use client';

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import EditIcon from '@mui/icons-material/Edit';
import InventoryIcon from '@mui/icons-material/Inventory2';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTransition } from 'react';

import type { Tracker } from '@/core/domain';

import { archiveTrackerAction } from '../api/actions';

interface TrackerRowProps {
  tracker: Tracker;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (dir: -1 | 1) => void;
  onEdit: (tracker: Tracker) => void;
}

const TYPE_LABEL: Record<Tracker['type'], string> = {
  CHECK: 'Check',
  SCALE: 'Escala',
  COUNTER: 'Contador',
};

const POLARITY_LABEL: Record<Tracker['expectedPolarity'], string> = {
  POSITIVE: 'Positivo',
  NEGATIVE: 'Negativo',
  UNKNOWN: '?',
};

export function TrackerRow({
  tracker,
  canMoveUp,
  canMoveDown,
  onMove,
  onEdit,
}: TrackerRowProps) {
  const [pending, startTransition] = useTransition();

  const archive = () =>
    startTransition(async () => {
      await archiveTrackerAction(tracker.id);
    });

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: 'center',
        px: 2,
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
        <Typography variant="body1">{tracker.name}</Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip size="small" label={TYPE_LABEL[tracker.type]} />
          {tracker.unit && <Chip size="small" label={tracker.unit} variant="outlined" />}
          {tracker.target !== undefined && (
            <Chip size="small" label={`Meta: ${tracker.target}`} variant="outlined" />
          )}
          {tracker.expectedPolarity !== 'UNKNOWN' && (
            <Chip
              size="small"
              label={POLARITY_LABEL[tracker.expectedPolarity]}
              variant="outlined"
            />
          )}
        </Stack>
      </Stack>

      <Stack direction="row" spacing={0.5}>
        <Tooltip title="Mover arriba">
          <span>
            <IconButton size="small" disabled={!canMoveUp} onClick={() => onMove(-1)}>
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Mover abajo">
          <span>
            <IconButton size="small" disabled={!canMoveDown} onClick={() => onMove(1)}>
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Editar">
          <IconButton size="small" onClick={() => onEdit(tracker)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Archivar (conserva el historial)">
          <span>
            <IconButton size="small" onClick={archive} disabled={pending}>
              <InventoryIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Stack>
  );
}
