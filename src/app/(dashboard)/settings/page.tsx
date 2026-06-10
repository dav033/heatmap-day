import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function SettingsPage() {
  return (
    <Box>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h1">Ajustes</Typography>
        <Typography variant="body2" color="text.secondary">
          Datos y configuración de la aplicación.
        </Typography>
      </Stack>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h3">Tus datos</Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
          >
            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Exportar todo (JSON)</Typography>
              <Typography variant="caption" color="text.secondary">
                Descarga días, puntajes, notas, trackers (incluidos archivados),
                categorías y tags en un único archivo. Sirve como backup y para
                migrar a otra base de datos.
              </Typography>
            </Stack>
            <Button
              component="a"
              href="/api/export"
              variant="contained"
              startIcon={<DownloadIcon />}
              sx={{ flexShrink: 0 }}
            >
              Exportar
            </Button>
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
          >
            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Importar datos</Typography>
              <Typography variant="caption" color="text.secondary">
                Restaurar un export JSON. Próximamente.
              </Typography>
            </Stack>
            <Button variant="outlined" startIcon={<UploadIcon />} disabled sx={{ flexShrink: 0 }}>
              Importar
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
