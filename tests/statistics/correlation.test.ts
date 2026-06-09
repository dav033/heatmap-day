import { describe, expect, it } from 'vitest';

import { mean, pearson } from '@/features/statistics/domain';

describe('pearson', () => {
  it('computes a perfect positive correlation', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [2, 4, 6, 8, 10];
    expect(pearson(xs, ys)).toBeCloseTo(1, 10);
  });

  it('computes a perfect negative correlation', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [10, 8, 6, 4, 2];
    expect(pearson(xs, ys)).toBeCloseTo(-1, 10);
  });

  it('returns null for fewer than 2 points', () => {
    expect(pearson([5], [3])).toBeNull();
    expect(pearson([], [])).toBeNull();
  });

  it('returns null when variance is zero (constant series)', () => {
    expect(pearson([3, 3, 3], [1, 2, 3])).toBeNull();
    expect(pearson([1, 2, 3], [5, 5, 5])).toBeNull();
  });

  it('handles different-length arrays by using the shorter length', () => {
    const r = pearson([1, 2, 3, 4], [10, 20, 30]);
    expect(r).toBeCloseTo(1, 10);
  });

  it('computes a known moderate correlation', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [2, 3, 1, 4, 5];
    const r = pearson(xs, ys);
    expect(r).not.toBeNull();
    expect(Math.abs(r!)).toBeGreaterThan(0.5);
    expect(Math.abs(r!)).toBeLessThan(1);
  });

  it('direction is discovered by the sign, NOT by expectedPolarity', () => {
    // Simulating "sleep hours" (higher = better sleep) where bad sleep
    // correlates with low scores — the correlation sign tells us.
    const sleepScores = [3, 4, 5, 8, 9];
    const dayScores   = [2, 3, 5, 7, 9];
    const r = pearson(sleepScores, dayScores);
    expect(r).toBeGreaterThan(0);
  });
});

describe('mean', () => {
  it('computes arithmetic mean', () => {
    expect(mean([1, 2, 3, 4, 5])).toBeCloseTo(3);
  });

  it('returns NaN for empty arrays', () => {
    expect(mean([])).toBeNaN();
  });
});