import { describe, expect, it } from 'vitest';

import { compareGroups } from '@/features/statistics/domain';

describe('compareGroups (CHECK tracker impact)', () => {
  it('computes delta between true and false groups', () => {
    const pairs = [
      { pred: true, score: 8 },
      { pred: true, score: 7 },
      { pred: true, score: 9 },
      { pred: false, score: 4 },
      { pred: false, score: 3 },
      { pred: false, score: 5 },
    ];
    const result = compareGroups(pairs, 3);
    expect(result).not.toBeNull();
    expect(result!.meanTrue).toBeCloseTo(8);
    expect(result!.meanFalse).toBeCloseTo(4);
    expect(result!.delta).toBeCloseTo(4);
    expect(result!.nTrue).toBe(3);
    expect(result!.nFalse).toBe(3);
  });

  it('returns null when a group has fewer than minPerGroup', () => {
    const pairs = [
      { pred: true, score: 8 },
      { pred: false, score: 4 },
      { pred: false, score: 3 },
      { pred: false, score: 5 },
    ];
    expect(compareGroups(pairs, 5)).toBeNull();
  });

  it('returns null when one group is empty', () => {
    const pairs = [
      { pred: true, score: 8 },
      { pred: true, score: 7 },
    ];
    expect(compareGroups(pairs, 2)).toBeNull();
  });

  it('delta can be negative (tracker associated with lower scores)', () => {
    // Days with "skipped breakfast" → lower scores
    const pairs = [
      { pred: true, score: 2 },
      { pred: true, score: 3 },
      { pred: true, score: 1 },
      { pred: false, score: 7 },
      { pred: false, score: 8 },
      { pred: false, score: 6 },
    ];
    const result = compareGroups(pairs, 3);
    expect(result).not.toBeNull();
    expect(result!.delta).toBeLessThan(0);
  });

  it('required minimum per group respects the threshold (pitfall: ≥5 → preliminary)', () => {
    const pairs = Array.from({ length: 4 }, (_, i) => ({
      pred: true,
      score: 5 + i,
    }));
    for (let i = 0; i < 4; i++) pairs.push({ pred: false, score: 3 + i });
    expect(compareGroups(pairs, 5)).toBeNull();
    expect(compareGroups(pairs, 4)).not.toBeNull();
  });
});