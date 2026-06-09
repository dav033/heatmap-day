import { describe, expect, it } from 'vitest';

import { trendSlope } from '@/features/statistics/domain';

describe('trendSlope', () => {
  it('returns null for fewer than 3 points', () => {
    expect(trendSlope([])).toBeNull();
    expect(trendSlope([1])).toBeNull();
    expect(trendSlope([1, 2])).toBeNull();
  });

  it('detects an upward trend', () => {
    const values = [1, 2, 3, 4, 5];
    const slope = trendSlope(values);
    expect(slope).not.toBeNull();
    expect(slope!).toBeGreaterThan(0);
    expect(slope!).toBeCloseTo(1, 5);
  });

  it('detects a downward trend', () => {
    const values = [9, 7, 5, 3, 1];
    const slope = trendSlope(values);
    expect(slope).not.toBeNull();
    expect(slope!).toBeLessThan(0);
    expect(slope!).toBeCloseTo(-2, 5);
  });

  it('returns 0 for a flat series (zero covariance but valid index variance)', () => {
    const values = [5, 5, 5, 5, 5];
    const slope = trendSlope(values);
    expect(slope).not.toBeNull();
    expect(slope!).toBeCloseTo(0);
  });

  it('flat 3-point series has slope ≈ 0 (not null)', () => {
    expect(trendSlope([3, 3, 3])).toBeCloseTo(0);
  });

  it('handles realistic score data with noise', () => {
    // Generally descending score
    const values = [8, 7.5, 6, 5.5, 4, 3, 2.5];
    const slope = trendSlope(values);
    expect(slope).not.toBeNull();
    expect(slope!).toBeLessThan(0);
  });
});