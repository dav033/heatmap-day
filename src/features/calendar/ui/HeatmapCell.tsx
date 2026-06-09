'use client';

import Tooltip from '@mui/material/Tooltip';
import Link from 'next/link';
import type { CSSProperties } from 'react';

import { scoreToColor } from '@/core/lib/colorScale';

interface HeatmapCellProps {
  date: string;
  score?: number;
  label?: string;
  size?: number;
  /** Height overrides width for a taller cell. Defaults to size (square). */
  height?: number;
  isToday?: boolean;
  showScoreText?: boolean;
}

function pickTextColor(bg: string, hasScore: boolean): string {
  if (!hasScore) return 'rgba(255,255,255,0.55)';
  // Heuristic: light text on dark, dark text on light.
  const hex = bg.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#0a0b10' : '#f4f4f6';
}

export function HeatmapCell({
  date,
  score,
  label,
  size = 36,
  height,
  isToday = false,
  showScoreText = false,
}: HeatmapCellProps) {
  const bg = scoreToColor(score);
  const hasScore = score !== undefined && score !== null && !Number.isNaN(score);

  const tooltip = hasScore ? `${date} — ${score!.toFixed(1)}/10` : `${date} — sin puntaje`;

  const cellH = height ?? size;
  const fontSize = size >= 50 ? '0.95rem' : size >= 38 ? '0.78rem' : '0.65rem';

  const style: CSSProperties = {
    width: size,
    height: cellH,
    backgroundColor: bg,
    color: pickTextColor(bg, hasScore),
    border: isToday ? '2px solid #7c9cff' : '1px solid rgba(255,255,255,0.06)',
    boxShadow: isToday ? '0 0 0 3px rgba(124,156,255,0.18)' : undefined,
    fontSize,
    transition: 'transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease',
  };

  return (
    <Tooltip title={tooltip} placement="top" arrow>
      <Link
        href={`/day/${date}`}
        prefetch={false}
        aria-label={tooltip}
        style={style}
        className="flex items-center justify-center rounded-lg font-semibold no-underline hover:scale-[1.06] hover:opacity-95 hover:shadow-md"
      >
        {showScoreText && hasScore ? score!.toFixed(1) : (label ?? '')}
      </Link>
    </Tooltip>
  );
}
