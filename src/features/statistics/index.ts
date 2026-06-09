export type {
  TrackerImpact,
  CumulativeEffect,
  PatternSummary,
  ScoreTrend,
  StatisticsResult,
  DayHighlight,
} from './application/statisticsService';

export { computeStatistics } from './application/statisticsService';

export {
  StatsDashboard,
  TrackerTrendChart,
  TrackerImpactList,
  CumulativeEffectList,
  PatternSummaryView,
  StreakBadges,
} from './ui';

export { getStatisticsAction } from './api/statisticsActions';

export * from './domain';