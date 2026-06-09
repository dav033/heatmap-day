import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { StatsDashboard } from '@/features/statistics/ui/StatsDashboard';

export const dynamic = 'force-dynamic';

export default function StatsPage() {
  return (
    <Box>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h1">Estadísticas</Typography>
        <Typography variant="body2" color="text.secondary">
          Análisis genérico de tus puntajes y factores. Descubre qué empuja tus días.
        </Typography>
      </Stack>
      <StatsDashboard />
    </Box>
  );
}
