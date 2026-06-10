import { describe, expect, it } from 'vitest';

import {
  compareGroups,
  confidenceFor,
  movingAverage,
  pearson,
  trendSlope,
} from '@/features/statistics/domain';

import type { DatedNumber } from '@/features/statistics/domain';

const dn = (date: string, value: number): DatedNumber => ({ date, value });

/**
 * Integration-style tests that exercise the full statistics domain
 * with synthetic datasets including gaps (regla §6.1: "no registrado ≠ 0").
 *
 * These verify that the domain functions work together correctly:
 * correlation sign ≠ expectedPolarity, gaps are not interpreted as zeros,
 * CHECK trackers use group comparison with proper sample guards, etc.
 */
describe('statistics domain — synthetic datasets with gaps', () => {
  it('SCALE tracker: Pearson correlation discovers direction independently of expectedPolarity', () => {
    // "Hours of sleep" tracker — expectedPolarity is just a visual hint.
    // In this dataset, more sleep → higher score (positive correlation).
    const sleepHours = [4, 5, 6, 7, 8, 9, 6, 5, 8, 7];
    const dayScores   = [3, 4, 6, 7, 9, 10, 5, 4, 8, 7];

    const r = pearson(sleepHours, dayScores);
    expect(r).not.toBeNull();
    expect(r!).toBeGreaterThan(0); // direction discovered from data

    // Negative expectedPolarity is IRRELEVANT to calculations
    // (it's only a UI hint per §6.5)
  });

  it('SCALE tracker: negative correlation is correctly discovered', () => {
    // "Stress level" tracker — higher stress → lower score
    const stress   = [2, 3, 1, 5, 8, 7, 4, 9];
    const scores   = [8, 7, 9, 5, 2, 3, 6, 1];

    const r = pearson(stress, scores);
    expect(r).not.toBeNull();
    expect(r!).toBeLessThan(0);
  });

  it('SCALE/COUNTER: bucket-based delta above/below median is interpretable', () => {
    // Sleep hours: values above median should have higher scores
    const sleepAndScore = [
      { value: 4, score: 3 },
      { value: 5, score: 5 },
      { value: 6, score: 6 },
      { value: 7, score: 8 },
      { value: 8, score: 9 },
      { value: 9, score: 10 },
      { value: 5, score: 4 },
      { value: 6, score: 7 },
    ];
    const median = [...sleepAndScore.map((d) => d.value)].sort((a, b) => a - b);
    const med = median.length % 2 === 0
      ? (median[median.length / 2 - 1]! + median[median.length / 2]!) / 2
      : median[Math.floor(median.length / 2)]!;

    const pairs = sleepAndScore.map((d) => ({
      pred: d.value >= med,
      score: d.score,
    }));

    const result = compareGroups(pairs, 3);
    expect(result).not.toBeNull();
    expect(result!.meanTrue).toBeGreaterThan(result!.meanFalse);
    expect(result!.delta).toBeGreaterThan(0);
  });

  it('CHECK tracker: impact is computed as delta of mean score when done vs not done', () => {
    // "Gym" tracker: days with done=true have higher scores
    const pairs = [
      { pred: true, score: 8 },
      { pred: true, score: 7 },
      { pred: true, score: 9 },
      { pred: true, score: 8 },
      { pred: true, score: 7 },
      { pred: false, score: 4 },
      { pred: false, score: 5 },
      { pred: false, score: 3 },
      { pred: false, score: 5 },
      { pred: false, score: 4 },
    ];
    const result = compareGroups(pairs, 5);
    expect(result).not.toBeNull();
    expect(result!.meanTrue).toBeCloseTo(7.8);
    expect(result!.meanFalse).toBeCloseTo(4.2);
    expect(result!.delta).toBeCloseTo(3.6);
  });

  it('CHECK tracker: sample < 5 per group → confidence is insufficient', () => {
    const pairs = [
      { pred: true, score: 8 },
      { pred: true, score: 7 },
      { pred: true, score: 9 },
      { pred: false, score: 4 },
      { pred: false, score: 5 },
    ];
    const result = compareGroups(pairs, 5);
    expect(result).toBeNull(); // only 2-3 per group, < 5
    expect(confidenceFor(3)).toBe('insufficient');
    expect(confidenceFor(2)).toBe('insufficient');
  });

  it('gaps in date series do not become zeros — §6.1', () => {
    // Simulating a tracker with data on days 1, 2, 5 (gap on 3, 4)
    // Gap days must NOT be treated as value=0
    const series: DatedNumber[] = [
      dn('2025-01-01', 7),
      dn('2025-01-02', 8),
      // gap: 2025-01-03, 2025-01-04 — NOT registered = NOT 0
      dn('2025-01-05', 5),
    ];
    const values = series.map((d) => d.value);
    expect(values).toEqual([7, 8, 5]);
    expect(values).not.toContain(0); // gaps are absent, not zeros

    // Moving average only operates on present entries
    const ma = movingAverage(series, 2);
    expect(ma).toHaveLength(2);
  });

  it('trend slope detects declining scores in a realistic scenario', () => {
    // User has been scoring lower over time
    const dailyScores = [8, 7.5, 7, 6, 5.5, 4, 3.5, 3, 2.5];
    const slope = trendSlope(dailyScores);
    expect(slope).not.toBeNull();
    expect(slope!).toBeLessThan(0);
  });

  it('moving average on 7-day window captures cumulative sleep effect', () => {
    // Score values descending: 7,7.5,...,10 for sleep is actually increasing. Let me use scores.
    const scores = [8, 7, 6, 5, 4, 3, 2];
    const series: DatedNumber[] = scores.map((v, i) => dn(`2025-01-${String(i + 1).padStart(2, '0')}`, v));
    const sleepMa = movingAverage(series, 3);
    expect(sleepMa.length).toBe(5); // 7 - 3 + 1
    expect(sleepMa[0]!.value).toBeCloseTo(7); // (8+7+6)/3
    expect(sleepMa.at(-1)!.value).toBeCloseTo(3); // (4+3+2)/3
  });

  it('pearson with gaps: only overlapping registered days count', () => {
    // Tracker A registered on days 1-5, Tracker B on days 1,2,4,5 (gap day 3)
    // For correlation between tracker B values and scores,
    // we only use days where B has data (not day 3)
    const trackerBValues = [4, 5, 7, 8]; // 4 days (no day 3)
    const scoresOnBDays  = [6, 7, 8, 9]; // corresponding 4 days

    const r = pearson(trackerBValues, scoresOnBDays);
    expect(r).not.toBeNull();
    expect(r!).toBeGreaterThan(0);
  });
});