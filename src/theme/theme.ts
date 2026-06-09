'use client';

import { createTheme, alpha } from '@mui/material/styles';

/**
 * Tema único en dark mode. Sin toggle. Pensado para convivir con utilidades
 * de layout de Tailwind (ver globals.css), por lo cual los resets vienen del
 * `CssBaseline` de MUI y no del preflight de Tailwind.
 */
const PRIMARY = '#7c9cff';
const SECONDARY = '#c084fc';
const BG_DEFAULT = '#0a0b10';
const BG_PAPER = '#13141b';
const BG_PAPER_RAISED = '#1a1c25';

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'dark',
    primary: { main: PRIMARY, light: '#9fb6ff', dark: '#4f6fd9' },
    secondary: { main: SECONDARY, light: '#d8a5ff', dark: '#8a4ec0' },
    success: { main: '#4ade80', dark: '#16a34a' },
    warning: { main: '#fbbf24', dark: '#d97706' },
    error: { main: '#f87171', dark: '#dc2626' },
    info: { main: '#60a5fa', dark: '#2563eb' },
    background: {
      default: BG_DEFAULT,
      paper: BG_PAPER,
    },
    divider: 'rgba(255,255,255,0.08)',
    text: {
      primary: '#f4f4f6',
      secondary: '#a1a1aa',
      disabled: 'rgba(255,255,255,0.35)',
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      'var(--font-geist-sans), system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h1: { fontSize: '2.25rem', fontWeight: 700, letterSpacing: -0.5 },
    h2: { fontSize: '1.6rem', fontWeight: 700, letterSpacing: -0.3 },
    h3: { fontSize: '1.25rem', fontWeight: 600 },
    h4: { fontSize: '1.05rem', fontWeight: 600 },
    h5: { fontSize: '0.95rem', fontWeight: 600 },
    h6: { fontSize: '0.875rem', fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, fontSize: '0.825rem' },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0.2 },
    caption: { fontSize: '0.75rem' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: `radial-gradient(circle at 0% 0%, ${alpha(PRIMARY, 0.10)} 0px, transparent 600px), radial-gradient(circle at 100% 0%, ${alpha(SECONDARY, 0.08)} 0px, transparent 600px)`,
          backgroundAttachment: 'fixed',
          scrollbarColor: 'rgba(255,255,255,0.16) transparent',
        },
        '::-webkit-scrollbar': { width: 10, height: 10 },
        '::-webkit-scrollbar-thumb': {
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 10,
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(255,255,255,0.22)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          backgroundColor: BG_PAPER,
          borderColor: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(6px)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: ({ ownerState }) => ({
          borderRadius: 8,
          ...(ownerState.variant === 'contained' && ownerState.color === 'primary'
            ? {
                backgroundImage: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                '&:hover': {
                  backgroundImage: `linear-gradient(135deg, ${alpha(PRIMARY, 0.9)} 0%, ${alpha(SECONDARY, 0.9)} 100%)`,
                },
              }
            : {}),
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
        outlined: {
          borderColor: 'rgba(255,255,255,0.16)',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderColor: 'rgba(255,255,255,0.10)',
          '&.Mui-selected': {
            backgroundColor: alpha(PRIMARY, 0.18),
            color: PRIMARY,
            '&:hover': { backgroundColor: alpha(PRIMARY, 0.26) },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: alpha(PRIMARY, 0.16),
            color: PRIMARY,
            '&:hover': { backgroundColor: alpha(PRIMARY, 0.22) },
            '& .MuiListItemIcon-root': { color: PRIMARY },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: BG_PAPER_RAISED,
          fontSize: 12,
          border: '1px solid rgba(255,255,255,0.08)',
        },
        arrow: { color: BG_PAPER_RAISED },
      },
    },
    MuiSlider: {
      styleOverrides: {
        rail: { opacity: 0.18 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});
