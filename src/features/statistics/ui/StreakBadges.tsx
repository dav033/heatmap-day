'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

import type { Streak } from '@/features/statistics/domain';

interface StreakBadgesProps {
  lowStreaks: Streak[];
  highStreaks: Streak[];
}

function streakLabel(streak: Streak): string {
  return `${streak.startDate} → ${streak.endDate} (${streak.length}d)`;
}

export function StreakBadges({ lowStreaks, highStreaks }: StreakBadgesProps) {
  if (lowStreaks.length === 0 && highStreaks.length === 0) return null;

  // Show only longest 3 per type
  const topLow = [...lowStreaks].sort((a, b) => b.length - a.length).slice(0, 3);
  const topHigh = [...highStreaks].sort((a, b) => b.length - a.length).slice(0, 3);

  return (
    <Box sx={{ mb: 1 }}>
      {topLow.length > 0 && (
        <Box sx={{ mb: 0.5 }}>
          <Typography variant="caption" color="error.main" sx={{ mr: 1 }}>
            Rachas bajas:
          </Typography>
          {topLow.map((s, i) => (
            <Chip
              key={`low-${i}`}
              label={streakLabel(s)}
              size="small"
              variant="outlined"
              color="error"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>
      )}
      {topHigh.length > 0 && (
        <Box>
          <Typography variant="caption" sx={{ color: 'success.main', mr: 1 }}>
            Rachas altas:
          </Typography>
          {topHigh.map((s, i) => (
            <Chip
              key={`high-${i}`}
              label={streakLabel(s)}
              size="small"
              variant="outlined"
              color="success"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}