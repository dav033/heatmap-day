'use client';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';

interface DivergingBarProps {
  /**
   * Valor en [-1, 1]: negativo pinta hacia la izquierda en rojo (mala
   * influencia), positivo hacia la derecha en verde (buena influencia).
   */
  value: number;
  height?: number;
  /** Atenúa el color (para confianza insuficiente). */
  dimmed?: boolean;
  tooltip?: string;
}

export function DivergingBar({ value, height = 16, dimmed = false, tooltip }: DivergingBarProps) {
  const v = Math.max(-1, Math.min(1, value));
  const positive = v >= 0;
  const color = dimmed ? '#9ca3af' : positive ? '#4ade80' : '#f87171';
  const widthPct = Math.abs(v) * 50;

  const bar = (
    <Box
      sx={{
        position: 'relative',
        height,
        borderRadius: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      {/* línea central: el cero */}
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: '1px',
          backgroundColor: 'rgba(255,255,255,0.25)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 2,
          bottom: 2,
          ...(positive ? { left: '50%' } : { right: '50%' }),
          width: `${Math.max(widthPct, v === 0 ? 0 : 1.5)}%`,
          backgroundColor: alpha(color, dimmed ? 0.45 : 0.9),
          borderRadius: positive ? '0 4px 4px 0' : '4px 0 0 4px',
          transition: 'width 200ms ease',
        }}
      />
    </Box>
  );

  if (!tooltip) return bar;
  return (
    <Tooltip title={tooltip} arrow>
      {bar}
    </Tooltip>
  );
}
