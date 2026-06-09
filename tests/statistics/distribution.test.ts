import { describe, expect, it } from 'vitest';

import { median, scoreDistribution } from '@/features/statistics/domain';

describe('scoreDistribution', () => {
  it('creates 10 bins of width 1 from 0 to 10', () => {
    const dist = scoreDistribution([]);
    expect(dist).toHaveLength(10);
    expect(dist[0]).toEqual({ from: 0, to: 1, count: 0 });
    expect(dist[9]).toEqual({ from: 9, to: 10, count: 0 });
  });

  it('counts scores in correct bins', () => {
    const scores = [0.5, 3.2, 7.8, 9.9, 5.0];
    const dist = scoreDistribution(scores);
    expect(dist[0]!.count).toBe(1); // 0.5 → bin 0
    expect(dist[3]!.count).toBe(1); // 3.2 → bin 3
    expect(dist[5]!.count).toBe(1); // 5.0 → bin 5
    expect(dist[7]!.count).toBe(1); // 7.8 → bin 7
    expect(dist[9]!.count).toBe(1); // 9.9 → bin 9
  });

  it('clamps scores exactly at boundaries (10 goes to last bin)', () => {
    const dist = scoreDistribution([10]);
    expect(dist[9]!.count).toBe(1); // 10 → Math.min(9, Math.floor(10)) = 9
  });

  it('ignores NaN and out-of-range values', () => {
    const dist = scoreDistribution([NaN, -1, 11, 5]);
    expect(dist.reduce((sum, b) => sum + b.count, 0)).toBe(1);
  });
});

describe('median', () => {
  it('returns median of odd-length array', () => {
    expect(median([1, 2, 3])).toBe(2);
  });

  it('returns average of two middle values for even-length array', () => {
    expect(median([1, 2, 3, 4])).toBeCloseTo(2.5);
  });

  it('returns null for empty array', () => {
    expect(median([])).toBeNull();
  });

  it('does not mutate input array', () => {
    const arr = [3, 1, 2];
    median(arr);
    expect(arr).toEqual([3, 1, 2]);
  });
});