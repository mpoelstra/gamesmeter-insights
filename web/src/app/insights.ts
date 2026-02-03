import { GamerProfile, GeneralStats, TrendInsight, VoteRow, YearSummary } from './models';

const RATING_MIN = 0.5;
const RATING_MAX = 5;
const RATING_STEP = 0.5;

export function buildYearSummaries(rows: VoteRow[]): YearSummary[] {
  const map = new Map<number, VoteRow[]>();
  for (const row of rows) {
    if (row.year === null || row.rating === null) {
      continue;
    }
    const list = map.get(row.year) ?? [];
    list.push(row);
    map.set(row.year, list);
  }

  return [...map.entries()]
    .map(([year, yearRows]) => {
      const ratings = yearRows.map(row => row.rating ?? 0).filter(value => value > 0);
      const average = mean(ratings);
      const medianValue = median(ratings);
      const min = Math.min(...ratings);
      const max = Math.max(...ratings);
      const topGames = [...yearRows]
        .filter(row => row.rating !== null)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 3);

      return {
        year,
        count: yearRows.length,
        average,
        median: medianValue,
        min,
        max,
        topGames,
      } satisfies YearSummary;
    })
    .sort((a, b) => b.year - a.year);
}

export function buildGeneralStats(rows: VoteRow[]): GeneralStats {
  const ratings = rows.map(row => row.rating).filter((value): value is number => value !== null);
  const years = rows.map(row => row.year).filter((value): value is number => value !== null);
  const platformCounts = countBy(rows, row => row.platform ?? 'Unknown');

  return {
    total: rows.length,
    ratedCount: ratings.length,
    average: ratings.length ? mean(ratings) : 0,
    median: ratings.length ? median(ratings) : 0,
    stdDev: ratings.length ? stdDev(ratings) : 0,
    min: ratings.length ? Math.min(...ratings) : 0,
    max: ratings.length ? Math.max(...ratings) : 0,
    firstYear: years.length ? Math.min(...years) : null,
    lastYear: years.length ? Math.max(...years) : null,
    platformCounts,
    ratingBuckets: buildBuckets(ratings),
  } satisfies GeneralStats;
}

export function buildTrendInsight(years: YearSummary[]): TrendInsight {
  const points = years
    .map(summary => ({ year: summary.year, value: summary.average }))
    .sort((a, b) => a.year - b.year);

  if (points.length < 2) {
    return {
      direction: 'flat',
      slope: 0,
      points,
      summary: 'Not enough yearly data to measure a trend yet.',
    } satisfies TrendInsight;
  }

  const x = points.map(point => point.year);
  const y = points.map(point => point.value);
  const slope = linearRegressionSlope(x, y);

  const direction = Math.abs(slope) < 0.03 ? 'flat' : slope > 0 ? 'up' : 'down';
  const summary =
    direction === 'flat'
      ? 'Your average scores are stable across the years.'
      : direction === 'up'
        ? 'Your average scores are trending upward over time.'
        : 'Your average scores are trending downward over time.';

  return { direction, slope, points, summary } satisfies TrendInsight;
}

export function buildGamerProfile(stats: GeneralStats, trend: TrendInsight, years: YearSummary[]): GamerProfile {
  const generosity = stats.average >= 3.6 ? 'Generous' : stats.average <= 2.6 ? 'Tough' : 'Balanced';
  const consistency = stats.stdDev <= 0.8 ? 'Consistent' : stats.stdDev >= 1.3 ? 'Wide-ranging' : 'Selective';
  const pace = stats.total >= 600 ? 'Marathon' : stats.total >= 250 ? 'Steady' : 'Curated';

  const topPlatforms = stats.platformCounts.slice(0, 3).map(item => item.name).join(', ');
  const topPlatformShort = stats.platformCounts[0]?.name ?? 'varied systems';
  const trendNote =
    trend.direction === 'flat'
      ? 'steady taste'
      : trend.direction === 'up'
        ? 'warming up'
        : 'growing more critical';

  const mostRatedYear = [...years].sort((a, b) => b.count - a.count)[0];
  const bestYear = [...years]
    .filter(year => year.count >= 3)
    .sort((a, b) => b.average - a.average)[0];
  const bestDecade = computeBestDecade(years);
  const ratingMode = computeRatingMode(stats);

  const lead =
    `Your average score of ${formatRating(stats.average)} with a standard deviation of ${stats.stdDev.toFixed(2)} suggests a ${consistency.toLowerCase()} scoring style.`;

  const description =
    `You lean ${generosity.toLowerCase()} in your ratings, and your catalog spans ${stats.total} titles from ${stats.firstYear ?? 'N/A'} to ${stats.lastYear ?? 'N/A'}. ` +
    `Top platforms include ${topPlatforms || 'multiple systems'}. ` +
    `Your most common score is ${ratingMode}. ` +
    (bestDecade ? `Your highest average decade is the ${bestDecade.label}. ` : '') +
    formatHighlights(bestYear, mostRatedYear) +
    ` Overall, your taste clusters around ${topPlatformShort}, with a ${trendNote} over time.`;

  return {
    title: `${generosity} ${consistency} Gamer`,
    subtitle: `${pace} library with a ${trendNote}`,
    lead,
    description,
    traits: [
      `${generosity} rater`,
      `${consistency} scorer`,
      `Top platforms: ${topPlatforms || 'Varied'}`,
      `${pace} player`,
    ],
  } satisfies GamerProfile;
}

function formatHighlights(bestYear?: YearSummary, mostRatedYear?: YearSummary): string {
  const parts: string[] = [];
  if (bestYear) {
    parts.push(`Your highest-rated year was ${bestYear.year} with an average of ${formatRating(bestYear.average)}.`);
  }
  if (mostRatedYear) {
    parts.push(`Your busiest year was ${mostRatedYear.year} with ${mostRatedYear.count} rated games.`);
  }
  return parts.join(' ');
}

function computeRatingMode(stats: GeneralStats): string {
  const sorted = [...stats.ratingBuckets].sort((a, b) => b.count - a.count);
  const top = sorted[0];
  return top ? `${top.label}` : 'N/A';
}

function computeBestDecade(years: YearSummary[]): { label: string; average: number } | null {
  if (years.length === 0) {
    return null;
  }
  const decadeMap = new Map<number, { total: number; count: number }>();
  for (const year of years) {
    const decade = Math.floor(year.year / 10) * 10;
    const current = decadeMap.get(decade) ?? { total: 0, count: 0 };
    current.total += year.average;
    current.count += 1;
    decadeMap.set(decade, current);
  }
  const result = [...decadeMap.entries()]
    .map(([decade, data]) => ({ decade, avg: data.total / data.count }))
    .sort((a, b) => b.avg - a.avg)[0];
  if (!result) {
    return null;
  }
  return { label: `${result.decade}s`, average: result.avg };
}

function buildBuckets(ratings: number[]): Array<{ label: string; count: number }> {
  const buckets: Array<{ label: string; count: number }> = [];
  for (let value = RATING_MIN; value <= RATING_MAX; value += RATING_STEP) {
    const label = value.toFixed(1);
    buckets.push({ label, count: 0 });
  }

  for (const rating of ratings) {
    const index = Math.round((rating - RATING_MIN) / RATING_STEP);
    const bucket = buckets[index];
    if (bucket) {
      bucket.count += 1;
    }
  }

  return buckets;
}

function countBy<T>(items: T[], getKey: (item: T) => string): Array<{ name: string; count: number }> {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item) || 'Unknown';
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function mean(values: number[]): number {
  const total = values.reduce((sum, value) => sum + value, 0);
  return values.length ? total / values.length : 0;
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) {
    return 0;
  }
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    const left = sorted[middle - 1] ?? 0;
    const right = sorted[middle] ?? 0;
    return (left + right) / 2;
  }
  return sorted[middle] ?? 0;
}

function stdDev(values: number[]): number {
  const avg = mean(values);
  const variance = mean(values.map(value => (value - avg) ** 2));
  return Math.sqrt(variance);
}

function linearRegressionSlope(x: number[], y: number[]): number {
  const xAvg = mean(x);
  const yAvg = mean(y);
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < x.length; i += 1) {
    const xValue = x[i];
    const yValue = y[i];
    if (xValue === undefined || yValue === undefined) {
      continue;
    }
    numerator += (xValue - xAvg) * (yValue - yAvg);
    denominator += (xValue - xAvg) ** 2;
  }
  return denominator === 0 ? 0 : numerator / denominator;
}

export function formatRating(value: number): string {
  return value.toFixed(2);
}
