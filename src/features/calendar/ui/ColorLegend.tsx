'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { COLOR_EMPTY, scoreToColor } from '@/core/lib/colorScale';

const STEPS = [0, 2, 4, 6, 8, 10];

export function ColorLegend() {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        mt: 2,
        pt: 2,
        alignItems: 'center',
        borderTop: '1px solid',
        borderColor: 'divider',
        flexWrap: 'wrap',
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        Peor
      </Typography>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        {STEPS.map((s) => (
          <Box
            key={s}
            sx={{
              width: 16,
              height: 16,
              backgroundColor: scoreToColor(s),
              borderRadius: 0.75,
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            title={`${s}`}
          />
        ))}
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        Mejor
      </Typography>
      <Box sx={{ width: 16 }} />
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 16,
            height: 16,
            backgroundColor: COLOR_EMPTY,
            borderRadius: 0.75,
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          title="Sin puntaje"
        />
        <Typography variant="caption" color="text.secondary">
          Sin puntaje
        </Typography>
      </Stack>
    </Stack>
  );
}
