import { getCurrentUserId } from '@/core/config/user';
import type { Tracker, TrackerWindow, TrackerValue } from '@/core/domain';
import type { DateRange, DateString } from '@/core/lib/date';
import { repos } from '@/core/repositories/prisma';

import {
  type Confidence,
  type DatedNumber,
  type GroupCompareResult,
  type ScoreBin,
  type Streak,
  type WeekdayStat,
  compareGroups,
  confidenceFor,
  findStreaks,
  meanByWeekday,
  median,
  movingAverage,
  pearson,
  scoreDistribution,
  trendSlope,
} from '../domain';
import { filterValuesByWindow } from '@/core/domain';

// --- Public result types ---

/**
 * Comparación de niveles: el puntaje promedio del día cuando el tracker está
 * "bajo" vs "alto" (CHECK: no hecho vs hecho; SCALE/COUNTER: bajo/alto según
 * el target del tracker o la mediana de sus valores). Hace visible, por
 * ejemplo, que "manga bajo" coincide con días malos.
 */
export interface ImpactLevels {
  lowLabel: string;
  highLabel: string;
  /** Promedio del puntaje del día en cada grupo. */
  lowMean: number;
  highMean: number;
  lowN: number;
  highN: number;
  /** Umbral usado para separar bajo/alto; null para CHECK. */
  threshold: number | null;
}

export interface TrackerImpact {
  trackerId: string;
  trackerName: string;
  trackerType: 'CHECK' | 'SCALE' | 'COUNTER';
  expectedPolarity: 'POSITIVE' | 'NEGATIVE' | 'UNKNOWN';
  confidence: Confidence;
  delta: number | null;
  correlation: number | null;
  discoveredDirection: 'positive' | 'negative' | 'neutral' | null;
  n: number;
  /** Average quality (1-5) for CHECK trackers when done; null if no quality data or not CHECK. */
  avgQuality: number | null;
  /** Puntaje promedio del día según nivel del tracker; null si no hay muestra suficiente. */
  levels: ImpactLevels | null;
}

export interface CumulativeEffect {
  trackerId: string;
  trackerName: string;
  /** Raw numeric values of this tracker within the range (for charts). */
  rawSeries: DatedNumber[];
  ma3: DatedNumber[];
  maCorrelation3: number | null;
  ma7: DatedNumber[];
  maCorrelation7: number | null;
  lowStreaks: Streak[];
  highStreaks: Streak[];
}

export interface DayHighlight {
  date: DateString;
  score: number;
}

export interface PatternSummary {
  weekdayMeans: WeekdayStat[];
  distribution: ScoreBin[];
  overallMean: number | null;
  overallMedian: number | null;
  totalDays: number;
  bestWeekday: WeekdayStat | null;
  worstWeekday: WeekdayStat | null;
  /** Top 3 individual best-scored days. */
  bestDays: DayHighlight[];
  /** Top 3 individual worst-scored days. */
  worstDays: DayHighlight[];
  /** Score streaks: low = score < 5, high = score >= 7. */
  scoreLowStreaks: Streak[];
  scoreHighStreaks: Streak[];
}

export interface ScoreTrend {
  series: DatedNumber[];
  slope: number | null;
  ma7: DatedNumber[];
}

export interface StatisticsResult {
  range: DateRange;
  trackerImpacts: TrackerImpact[];
  cumulativeEffects: CumulativeEffect[];
  patterns: PatternSummary;
  scoreTrend: ScoreTrend;
}

// --- Internal helpers ---

function toNumericSeries(
  rawValues: { date: DateString; value: TrackerValue }[],
  window: TrackerWindow,
): { date: DateString; value: number }[] {
  const filtered = filterValuesByWindow(rawValues, window);
  return filtered
    .map((rv) => {
      const v = rv.value;
      let num: number;
      switch (v.kind) {
        case 'CHECK':
          num = v.done ? (v.quality ?? 1) : 0;
          break;
        case 'SCALE':
        case 'COUNTER':
          num = v.value;
          break;
        default:
          return null;
      }
      return { date: rv.date, value: num };
    })
    .filter((x): x is { date: DateString; value: number } => x !== null);
}

function impactForCheck(
  tracker: Tracker,
  numericVals: { date: DateString; value: number }[],
  rawValues: { date: DateString; value: TrackerValue }[],
  scoresByDate: Map<string, number>,
): TrackerImpact {
  const pairs: { pred: boolean; score: number }[] = [];
  for (const v of numericVals) {
    const score = scoresByDate.get(v.date);
    if (score !== undefined) pairs.push({ pred: v.value > 0, score });
  }
  const n = numericVals.length;
  const result: GroupCompareResult | null = compareGroups(pairs, 5);

  let direction: 'positive' | 'negative' | 'neutral' | null = null;
  if (result) {
    if (result.delta > 0) direction = 'positive';
    else if (result.delta < 0) direction = 'negative';
    else direction = 'neutral';
  }

  // Average quality for done days (quality 1-5)
  const qualities = rawValues
    .filter((rv) => {
      if (rv.value.kind !== 'CHECK') return false;
      const v = rv.value as { kind: 'CHECK'; done: boolean; quality?: number };
      return v.done && v.quality !== undefined && v.quality !== null;
    })
    .map((rv) => (rv.value as { kind: 'CHECK'; done: boolean; quality?: number }).quality!);
  const avgQuality = qualities.length > 0
    ? qualities.reduce((s, q) => s + q, 0) / qualities.length
    : null;

  const levels: ImpactLevels | null = result
    ? {
        lowLabel: 'No hecho',
        highLabel: 'Hecho',
        lowMean: result.meanFalse,
        highMean: result.meanTrue,
        lowN: result.nFalse,
        highN: result.nTrue,
        threshold: null,
      }
    : null;

  return {
    trackerId: tracker.id,
    trackerName: tracker.name,
    trackerType: 'CHECK',
    expectedPolarity: tracker.expectedPolarity,
    confidence: confidenceFor(Math.min(result?.nTrue ?? 0, result?.nFalse ?? 0)),
    delta: result?.delta ?? null,
    correlation: null,
    discoveredDirection: direction,
    n,
    avgQuality,
    levels,
  };
}

function impactForScaleOrCounter(
  tracker: Tracker,
  numericVals: { date: DateString; value: number }[],
  scoresByDate: Map<string, number>,
): TrackerImpact {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const v of numericVals) {
    const score = scoresByDate.get(v.date);
    if (score !== undefined) {
      xs.push(v.value);
      ys.push(score);
    }
  }

  const corr = pearson(xs, ys);

  // Comparación bajo/alto: separa los días por el target del tracker (si lo
  // tiene) o por el umbral que mejor balancea los grupos, y compara el puntaje
  // promedio de cada grupo. Esto hace explícito "cuando X está bajo, los días
  // son malos". No usamos la mediana a ciegas: con valores empatados puede
  // dejar un grupo casi vacío y perder el análisis.
  let delta: number | null = null;
  let levels: ImpactLevels | null = null;
  const thresholds = [tracker.target ?? null, bestBalancedThreshold(xs)].filter(
    (t): t is number => t !== null,
  );
  for (const threshold of thresholds) {
    const pairs = xs.map((x, i) => ({ pred: x >= threshold, score: ys[i]! }));
    const result = compareGroups(pairs, 5);
    if (result) {
      delta = result.delta;
      const fmt = Number.isInteger(threshold) ? String(threshold) : threshold.toFixed(1);
      levels = {
        lowLabel: `Bajo (< ${fmt})`,
        highLabel: `Alto (≥ ${fmt})`,
        lowMean: result.meanFalse,
        highMean: result.meanTrue,
        lowN: result.nFalse,
        highN: result.nTrue,
        threshold,
      };
      break;
    }
  }

  let direction: 'positive' | 'negative' | 'neutral' | null = null;
  if (corr !== null) {
    if (corr > 0.05) direction = 'positive';
    else if (corr < -0.05) direction = 'negative';
    else direction = 'neutral';
  }

  return {
    trackerId: tracker.id,
    trackerName: tracker.name,
    trackerType: tracker.type as 'SCALE' | 'COUNTER',
    expectedPolarity: tracker.expectedPolarity,
    confidence: confidenceFor(xs.length),
    delta,
    correlation: corr,
    discoveredDirection: direction,
    n: xs.length,
    avgQuality: null,
    levels,
  };
}

/**
 * Umbral (entre los valores observados) que reparte los días en grupos
 * bajo/alto lo más parejos posible, usando `x >= t` como corte. Ante empate
 * de balance, prefiere el corte más cercano a la mediana.
 */
function bestBalancedThreshold(xs: ReadonlyArray<number>): number | null {
  if (xs.length < 2) return null;
  const med = median(xs);
  if (med === null) return null;

  const candidates = [...new Set(xs)].sort((a, b) => a - b);
  let best: { threshold: number; minGroup: number; distToMedian: number } | null = null;
  // El menor valor como corte deja el grupo "bajo" vacío; se omite.
  for (const threshold of candidates.slice(1)) {
    const high = xs.filter((x) => x >= threshold).length;
    const low = xs.length - high;
    const minGroup = Math.min(low, high);
    const distToMedian = Math.abs(threshold - med);
    if (
      !best ||
      minGroup > best.minGroup ||
      (minGroup === best.minGroup && distToMedian < best.distToMedian)
    ) {
      best = { threshold, minGroup, distToMedian };
    }
  }
  return best?.threshold ?? null;
}

function computeTrackerImpact(
  tracker: Tracker,
  window: TrackerWindow,
  rawValues: { date: DateString; value: TrackerValue }[],
  scoresByDate: Map<string, number>,
): TrackerImpact {
  const numericVals = toNumericSeries(rawValues, window);

  if (tracker.type === 'CHECK') {
    return impactForCheck(tracker, numericVals, rawValues, scoresByDate);
  }
  return impactForScaleOrCounter(tracker, numericVals, scoresByDate);
}

function computeCumulativeEffect(
  tracker: Tracker,
  window: TrackerWindow,
  rawValues: { date: DateString; value: TrackerValue }[],
  scoresByDate: Map<string, number>,
): CumulativeEffect {
  const numericVals = toNumericSeries(rawValues, window);
  const series: DatedNumber[] = [...numericVals].sort((a, b) => a.date.localeCompare(b.date));

  const ma3 = movingAverage(series, 3);
  const ma7 = movingAverage(series, 7);

  const maCor3 = correlateWithScores(ma3, scoresByDate);
  const maCor7 = correlateWithScores(ma7, scoresByDate);

  const threshold = tracker.target ?? median(series.map((s) => s.value)) ?? 5;
  const lowStreaks = findStreaks(series, (v) => v < threshold);
  const highStreaks = findStreaks(series, (v) => v >= threshold);

  return {
    trackerId: tracker.id,
    trackerName: tracker.name,
    rawSeries: series,
    ma3,
    maCorrelation3: maCor3,
    ma7,
    maCorrelation7: maCor7,
    lowStreaks,
    highStreaks,
  };
}

function correlateWithScores(
  ma: DatedNumber[],
  scoresByDate: Map<string, number>,
): number | null {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const point of ma) {
    const score = scoresByDate.get(point.date);
    if (score !== undefined) {
      xs.push(point.value);
      ys.push(score);
    }
  }
  return pearson(xs, ys);
}

// --- Main service ---

export async function computeStatistics(range: DateRange): Promise<StatisticsResult> {
  const userId = await getCurrentUserId();

  const trackers = await repos.trackers.list(userId);
  const windows = await repos.trackers.listWindows(userId);
  const scores = await repos.dayEntries.getScoresInRange(userId, range);

  // Single query for all tracker values in range (avoids N+1)
  const allValuesMap = await repos.trackerValues.listAllValuesInRange(userId, range);

  const scoresByDate = new Map<string, number>();
  for (const s of scores) {
    if (s.score !== undefined) scoresByDate.set(s.date, s.score);
  }

  const trackerImpacts: TrackerImpact[] = [];
  const cumulativeEffects: CumulativeEffect[] = [];

  for (const tracker of trackers) {
    const window = windows.find((w) => w.trackerId === tracker.id);
    if (!window) continue;

    const rawValues = allValuesMap.get(tracker.id) ?? [];

    trackerImpacts.push(computeTrackerImpact(tracker, window, rawValues, scoresByDate));
    cumulativeEffects.push(computeCumulativeEffect(tracker, window, rawValues, scoresByDate));
  }

  const scoreNumbers = scores
    .map((s) => s.score)
    .filter((s): s is number => s !== undefined);

  const scoreSeries: DatedNumber[] = scores
    .filter((s) => s.score !== undefined)
    .map((s) => ({ date: s.date, value: s.score! }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const weekdayMeans = meanByWeekday(scoreSeries);
  const distribution = scoreDistribution(scoreNumbers);

  const validWeekdays = weekdayMeans.filter(
    (w) => w.n > 0 && !Number.isNaN(w.mean),
  );
  const bestWeekday =
    validWeekdays.length > 0
      ? validWeekdays.reduce<WeekdayStat>(
          (best, w) => (w.mean > best.mean ? w : best),
          validWeekdays[0]!,
        )
      : null;
  const worstWeekday =
    validWeekdays.length > 0
      ? validWeekdays.reduce<WeekdayStat>(
          (worst, w) => (w.mean < worst.mean ? w : worst),
          validWeekdays[0]!,
        )
      : null;

  // Best/worst individual days (top 3)
  const scoredDays = scores.filter((s) => s.score !== undefined);
  const sortedByScore = [...scoredDays].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const bestDays: DayHighlight[] = sortedByScore.slice(0, 3).map((s) => ({
    date: s.date,
    score: s.score!,
  }));
  const worstDays: DayHighlight[] = [...sortedByScore].reverse().slice(0, 3).map((s) => ({
    date: s.date,
    score: s.score!,
  }));

  // Score streaks
  const scoreLowStreaks = findStreaks(scoreSeries, (v) => v < 5);
  const scoreHighStreaks = findStreaks(scoreSeries, (v) => v >= 7);

  const slope = trendSlope(scoreSeries.map((s) => s.value));
  const scoreMa7 = movingAverage(scoreSeries, 7);

  return {
    range,
    trackerImpacts,
    cumulativeEffects,
    patterns: {
      weekdayMeans,
      distribution,
      overallMean:
        scoreNumbers.length > 0
          ? scoreNumbers.reduce((s, v) => s + v, 0) / scoreNumbers.length
          : null,
      overallMedian: median(scoreNumbers),
      totalDays: scoreNumbers.length,
      bestWeekday,
      worstWeekday,
      bestDays,
      worstDays,
      scoreLowStreaks,
      scoreHighStreaks,
    },
    scoreTrend: { series: scoreSeries, slope, ma7: scoreMa7 },
  };
}