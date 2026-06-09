'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestoreIcon from '@mui/icons-material/Restore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTransition } from 'react';

import type { Tracker } from '@/core/domain';

import { restoreTrackerAction } from '../api/actions';

interface ArchivedTrackersProps {
  trackers: Tracker[];
}

export function ArchivedTrackers({ trackers }: ArchivedTrackersProps) {
  const [pending, startTransition] = useTransition();

  if (trackers.length === 0) return null;

  return (
    <Accordion variant="outlined" sx={{ mt: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h3">Archivados ({trackers.length})</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack divider={<div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }} />}>
          {trackers.map((t) => (
            <Stack
              key={t.id}
              direction="row"
              spacing={2}
              sx={{ alignItems: 'center', py: 1 }}
            >
              <Typography sx={{ flexGrow: 1 }}>{t.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t.type}
              </Typography>
              <Button
                size="small"
                startIcon={<RestoreIcon />}
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await restoreTrackerAction(t.id);
                  })
                }
              >
                Restaurar
              </Button>
            </Stack>
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
