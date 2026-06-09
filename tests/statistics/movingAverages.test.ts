import { describe, expect, it } from 'vitest';

import type { DatedNumber } from '@/features/statistics/domain';
import { movingAverage } from '@/features/statistics/domain';

const dn = (date: string, value: number): DatedNumber => ({ date, value });

describe('movingAverage', () => {
  it('computes a 3-day moving average', () => {
    const series: DatedNumber[] = [
      dn('2025-01-01', 1),
      dn('2025-01-02', 2),
      dn('2025-01-03', 3),
      dn('2025-01-04', 4),
      dn('2025-01-05', 5),
    ];
    const ma = movingAverage(series, 3);
    // First complete window: indices 0-2 → (1+2+3)/3 = 2
    expect(ma).toHaveLength(3);
    expect(ma[0]!.value).toBeCloseTo(2);
    expect(ma[0]!.date).toBe('2025-01-03');
    expect(ma[1]!.value).toBeCloseTo(3);
    expect(ma[2]!.value).toBeCloseTo(4);
  });

  it('skips incomplete windows (first window-1 points are not emitted)', () => {
    const series: DatedNumber[] = [
      dn('2025-01-01', 10),
      dn('2025-01-02', 20),
    ];
    const ma = movingAverage(series, 3);
    expect(ma).toHaveLength(0);
  });

  it('returns empty for a window of 1 (just the value itself) — or computes trivially', () => {
    const series: DatedNumber[] = [
      dn('2025-01-01', 5),
      dn('2025-01-02', 7),
    ];
    const ma = movingAverage(series, 1);
    expect(ma).toHaveLength(2);
    expect(ma[0]!.value).toBe(5);
    expect(ma[1]!.value).toBe(7);
  });

  it('returns empty for empty series', () => {
    expect(movingAverage([], 3)).toEqual([]);
  });

  it('throws for invalid window size', () => {
    expect(() => movingAverage([], 0)).toThrow();
    expect(() => movingAverage([], -1)).toThrow();
  });

it('pitfall: does NOT invent missing days — gaps stay absent from output', () => {
    const series: DatedNumber[] = [
      dn('2025-01-01', 1),
      dn('2025-01-02', 2),
      // gap: 2025-01-03 missing
      dn('2025-01-04', 4),
      dn('2025-01-05', 5),
    ];
    const ma = movingAverage(series, 2);
    // Moving average works on the series as-is (no gap filling).
    // With window=2, outputs start at index 1 → 3 results.
    expect(ma).toHaveLength(3);
  });

  it('computes 7-day moving average for score trends', () => {
    const series: DatedNumber[] = Array.from({ length: 14 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
      value: i + 1,
    }));
    const ma = movingAverage(series, 7);
    expect(ma).toHaveLength(8); // 14 - 7 + 1
    expect(ma[0]!.value).toBeCloseTo(4); // avg(1..7)
  });
});