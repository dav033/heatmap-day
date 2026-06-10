import { describe, expect, it } from 'vitest';

import type { DatedNumber } from '@/features/statistics/domain';
import { meanByWeekday } from '@/features/statistics/domain';

const dn = (date: string, value: number): DatedNumber => ({ date, value });

describe('meanByWeekday', () => {
  it('computes mean for each weekday', () => {
    // 2025-01-06 = Monday, 2025-01-07 = Tuesday, etc.
    const series2: DatedNumber[] = [
      dn('2025-01-06', 7), // Monday
      dn('2025-01-07', 8), // Tuesday
      dn('2025-01-08', 6), // Wednesday
      dn('2025-01-13', 9), // Monday (next week)
    ];
    const stats = meanByWeekday(series2);
    expect(stats).toHaveLength(7);
    // Monday (weekday 0): (7 + 9) / 2 = 8
    expect(stats[0]!.weekday).toBe(0);
    expect(stats[0]!.mean).toBeCloseTo(8);
    expect(stats[0]!.n).toBe(2);
    // Tuesday (weekday 1): 8
    expect(stats[1]!.mean).toBeCloseTo(8);
    expect(stats[1]!.n).toBe(1);
    // Wednesday (weekday 2): 6
    expect(stats[2]!.mean).toBeCloseTo(6);
    // Thursday–Sunday: NaN
    for (let i = 3; i < 7; i++) {
      expect(stats[i]!.n).toBe(0);
      expect(Number.isNaN(stats[i]!.mean)).toBe(true);
    }
  });

  it('returns NaN for weekdays with no data', () => {
    const stats = meanByWeekday([dn('2025-01-06', 5)]); // only Monday
    expect(stats[0]!.n).toBe(1);
    for (let i = 1; i < 7; i++) {
      expect(stats[i]!.n).toBe(0);
      expect(Number.isNaN(stats[i]!.mean)).toBe(true);
    }
  });

  it('returns all-zero counts for empty series', () => {
    const stats = meanByWeekday([]);
    expect(stats).toHaveLength(7);
    for (const s of stats) {
      expect(s.n).toBe(0);
    }
  });

  it('correctly maps dates to weekdays (Monday=0, Sunday=6)', () => {
    // 2025-01-06 is a Monday (verified via calendar)
    const series: DatedNumber[] = [
      dn('2025-01-06', 10), // Monday = 0
      dn('2025-01-12', 5),  // Sunday = 6
    ];
    const stats = meanByWeekday(series);
    expect(stats[0]!.n).toBe(1);
    expect(stats[0]!.mean).toBeCloseTo(10);
    expect(stats[6]!.n).toBe(1);
    expect(stats[6]!.mean).toBeCloseTo(5);
  });
});