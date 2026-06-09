import { describe, expect, it } from 'vitest';

import type { DatedNumber } from '@/features/statistics/domain';
import { findStreaks } from '@/features/statistics/domain';

const dn = (date: string, value: number): DatedNumber => ({ date, value });

describe('findStreaks', () => {
  it('finds a single streak of consecutive days', () => {
    const series: DatedNumber[] = [
      dn('2025-01-01', 3),
      dn('2025-01-02', 4),
      dn('2025-01-03', 5),
    ];
    const streaks = findStreaks(series, (v) => v >= 3);
    expect(streaks).toHaveLength(1);
    expect(streaks[0]!.length).toBe(3);
    expect(streaks[0]!.startDate).toBe('2025-01-01');
    expect(streaks[0]!.endDate).toBe('2025-01-03');
  });

  it('splits streaks when a day does not meet the predicate', () => {
    const series: DatedNumber[] = [
      dn('2025-01-01', 5),
      dn('2025-01-02', 5),
      dn('2025-01-03', 2), // breaks streak
      dn('2025-01-04', 5),
      dn('2025-01-05', 5),
    ];
    const streaks = findStreaks(series, (v) => v >= 5);
    expect(streaks).toHaveLength(2);
    expect(streaks[0]!.length).toBe(2);
    expect(streaks[1]!.length).toBe(2);
  });

  it('pitfall: gaps (unregistered days) break streaks', () => {
    // 2025-01-03 is missing from the series — gap breaks the streak
    const series: DatedNumber[] = [
      dn('2025-01-01', 5),
      dn('2025-01-02', 5),
      // gap: 2025-01-03 not registered (§6.1: "no registrado ≠ 0")
      dn('2025-01-04', 5),
      dn('2025-01-05', 5),
    ];
    const streaks = findStreaks(series, (v) => v >= 5);
    // The gap breaks consecutive days, so we get two streaks of 2
    expect(streaks).toHaveLength(2);
    expect(streaks[0]!.length).toBe(2);
    expect(streaks[1]!.length).toBe(2);
  });

  it('returns empty for empty series', () => {
    expect(findStreaks([], (v) => v > 0)).toEqual([]);
  });

  it('returns empty when no day meets the predicate', () => {
    const series: DatedNumber[] = [
      dn('2025-01-01', 1),
      dn('2025-01-02', 2),
    ];
    expect(findStreaks(series, (v) => v > 10)).toHaveLength(0);
  });

  it('captures streak values in order', () => {
    const series: DatedNumber[] = [
      dn('2025-01-01', 7),
      dn('2025-01-02', 8),
      dn('2025-01-03', 9),
    ];
    const streaks = findStreaks(series, (v) => v >= 7);
    expect(streaks[0]!.values).toEqual([7, 8, 9]);
  });

  it('handles cross-month streaks correctly', () => {
    const series: DatedNumber[] = [
      dn('2025-01-30', 5),
      dn('2025-01-31', 5),
      dn('2025-02-01', 5),
      dn('2025-02-02', 5),
    ];
    const streaks = findStreaks(series, (v) => v >= 5);
    expect(streaks).toHaveLength(1);
    expect(streaks[0]!.length).toBe(4);
  });

  it('detects "bad sleep streak" pattern (low scores for consecutive days)', () => {
    const series: DatedNumber[] = [
      dn('2025-03-01', 3),
      dn('2025-03-02', 2),
      dn('2025-03-03', 3),
      dn('2025-03-04', 7), // recovery
      dn('2025-03-05', 8),
    ];
    const lowStreaks = findStreaks(series, (v) => v <= 4);
    expect(lowStreaks).toHaveLength(1);
    expect(lowStreaks[0]!.length).toBe(3);
    expect(lowStreaks[0]!.startDate).toBe('2025-03-01');
    expect(lowStreaks[0]!.endDate).toBe('2025-03-03');
  });
});