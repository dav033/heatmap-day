import { describe, expect, it } from 'vitest';

import { confidenceFor, MIN_SAMPLE_CONSISTENT, MIN_SAMPLE_PRELIMINARY } from '@/features/statistics/domain';

describe('confidenceFor', () => {
  it('returns "insufficient" for n < MIN_SAMPLE_PRELIMINARY', () => {
    expect(confidenceFor(0)).toBe('insufficient');
    expect(confidenceFor(1)).toBe('insufficient');
    expect(confidenceFor(4)).toBe('insufficient');
  });

  it('returns "preliminary" for MIN_SAMPLE_PRELIMINARY ≤ n < MIN_SAMPLE_CONSISTENT', () => {
    expect(confidenceFor(5)).toBe('preliminary');
    expect(confidenceFor(10)).toBe('preliminary');
    expect(confidenceFor(14)).toBe('preliminary');
  });

  it('returns "consistent" for n ≥ MIN_SAMPLE_CONSISTENT', () => {
    expect(confidenceFor(15)).toBe('consistent');
    expect(confidenceFor(100)).toBe('consistent');
  });

  it('thresholds are 5 and 15 per specification', () => {
    expect(MIN_SAMPLE_PRELIMINARY).toBe(5);
    expect(MIN_SAMPLE_CONSISTENT).toBe(15);
  });

  it('pitfall: CHECK tracker needs ≥5 per group, not total', () => {
    // 10 total observations but only 3 in the "true" group
    // → "insufficient" for that group
    const groupTrue = 3;
    expect(confidenceFor(groupTrue)).toBe('insufficient');
  });
});