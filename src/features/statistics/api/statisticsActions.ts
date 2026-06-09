'use server';

import { z } from 'zod';

import type { DateRange } from '@/core/lib/date';
import { monthRange, todayString, weekRange, yearRange } from '@/core/lib/date';

import type { StatisticsResult } from '../application/statisticsService';
import { computeStatistics } from '../application/statisticsService';

const RangePresetSchema = z.enum(['week', 'month', 'year', 'all']);

function getRange(preset: string): DateRange {
  const today = new Date();
  switch (preset) {
    case 'week':
      return weekRange(today);
    case 'month':
      return monthRange(today);
    case 'year':
      return yearRange(today);
    case 'all': {
      const start = new Date(today.getFullYear() - 5, 0, 1);
      return { start: `${start.getFullYear()}-01-01`, end: todayString() };
    }
    default:
      return monthRange(today);
  }
}

export async function getStatisticsAction(
  preset: string,
): Promise<StatisticsResult> {
  const p = RangePresetSchema.parse(preset);
  const range = getRange(p);
  return computeStatistics(range);
}