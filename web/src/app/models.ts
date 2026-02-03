export type TrendDirection = 'up' | 'down' | 'flat';

export interface VoteRow {
  id: number | null;
  title: string;
  year: number | null;
  altTitle: string | null;
  platform: string | null;
  rating: number | null;
  placed: Date | null;
  raw: string[];
}

export interface YearSummary {
  year: number;
  count: number;
  average: number;
  median: number;
  min: number;
  max: number;
  topGames: VoteRow[];
}

export interface GeneralStats {
  total: number;
  ratedCount: number;
  average: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  firstYear: number | null;
  lastYear: number | null;
  platformCounts: Array<{ name: string; count: number }>;
  ratingBuckets: Array<{ label: string; count: number }>;
}

export interface TrendInsight {
  direction: TrendDirection;
  slope: number;
  points: Array<{ year: number; value: number }>;
  summary: string;
}

export interface GamerProfile {
  title: string;
  subtitle: string;
  lead: string;
  description: string;
  traits: string[];
}
