'use client';

import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChecklistRtlIcon from '@mui/icons-material/ChecklistRtl';
import SettingsIcon from '@mui/icons-material/Settings';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const NAV_WIDTH = 240;

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  matches: (pathname: string) => boolean;
}

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  {
    href: '/',
    label: 'Calendario',
    icon: <CalendarMonthIcon fontSize="small" />,
    matches: (p) => p === '/' || p.startsWith('/day'),
  },
  {
    href: '/stats',
    label: 'Estadísticas',
    icon: <BarChartIcon fontSize="small" />,
    matches: (p) => p.startsWith('/stats'),
  },
  {
    href: '/trackers',
    label: 'Trackers',
    icon: <ChecklistRtlIcon fontSize="small" />,
    matches: (p) => p.startsWith('/trackers'),
  },
  {
    href: '/settings',
    label: 'Ajustes',
    icon: <SettingsIcon fontSize="small" />,
    matches: (p) => p.startsWith('/settings'),
  },
];

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname() ?? '/';
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: alpha(theme.palette.background.default, 0.7),
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          <Stack direction="row" spacing={1.5} sx={{ flexGrow: 1, alignItems: 'center' }}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.45)}`,
              }}
            />
            <Typography
              variant="h3"
              component="div"
              sx={{
                letterSpacing: 0.4,
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.text.primary}, ${theme.palette.primary.light})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              DayScore
            </Typography>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: NAV_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: NAV_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            backgroundColor: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(12px)',
          },
        }}
      >
        <Toolbar />
        <List component="nav" sx={{ pt: 2, px: 1.5 }}>
          {NAV_ITEMS.map((item) => {
            const selected = item.matches(pathname);
            return (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={selected}
                sx={{ mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { sx: { fontWeight: selected ? 600 : 500 } } }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          maxWidth: '100%',
        }}
      >
        <Toolbar />
        <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>{children}</Box>
      </Box>
    </Box>
  );
}
