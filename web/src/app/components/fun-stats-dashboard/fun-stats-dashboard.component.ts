import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoteRow } from '../../models';
import { I18nService } from '../../i18n.service';
import { getPlatformImage, PlatformImage } from '../../platform-images';

interface MonthStat {
  label: string;
  count: number;
}

interface RitualStat {
  label: string;
  count: number;
}

@Component({
  selector: 'app-fun-stats-dashboard',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fun-stats-dashboard.component.html',
  styleUrls: ['./fun-stats-dashboard.component.css'],
})
export class FunStatsDashboardComponent {
  readonly rows = input.required<VoteRow[]>();
  readonly i18n = inject(I18nService);

  readonly ratedRows = computed(() => this.rows().filter(row => row.rating !== null));
  readonly ritualView = signal<'month' | 'weekday' | 'year'>('month');

  readonly firstLast = computed(() => {
    const placed = this.rows().filter(row => row.placed instanceof Date) as Array<VoteRow & { placed: Date }>;
    if (placed.length === 0) {
      return null;
    }
    const sorted = [...placed].sort((a, b) => a.placed.getTime() - b.placed.getTime());
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (!first || !last) {
      return null;
    }
    return { first, last };
  });

  readonly longestGap = computed(() => {
    const placed = this.rows().filter(row => row.placed instanceof Date) as Array<VoteRow & { placed: Date }>;
    if (placed.length < 2) {
      return null;
    }
    const sorted = [...placed].sort((a, b) => a.placed.getTime() - b.placed.getTime());
    let longest = 0;
    let pair: { from: VoteRow; to: VoteRow } | null = null;
    for (let i = 1; i < sorted.length; i += 1) {
      const current = sorted[i];
      const prev = sorted[i - 1];
      if (!current || !prev) {
        continue;
      }
      const diff = current.placed.getTime() - prev.placed.getTime();
      if (diff > longest) {
        longest = diff;
        pair = { from: prev, to: current };
      }
    }
    return pair
      ? {
          days: Math.round(longest / (1000 * 60 * 60 * 24)),
          from: pair.from.placed,
          to: pair.to.placed,
        }
      : null;
  });

  readonly monthStats = computed<MonthStat[]>(() => {
    const counts = Array.from({ length: 12 }, () => 0);
    for (const row of this.rows()) {
      if (row.placed) {
        const month = row.placed.getMonth();
        counts[month] = (counts[month] ?? 0) + 1;
      }
    }
    const labels = this.i18n.monthLabels(true);
    return labels.map((label, index) => ({ label, count: counts[index] ?? 0 }));
  });

  readonly ritualStats = computed<RitualStat[]>(() => {
    const view = this.ritualView();
    if (view === 'weekday') {
      const counts = Array.from({ length: 7 }, () => 0);
      for (const row of this.rows()) {
        if (!row.placed) {
          continue;
        }
        counts[row.placed.getDay()] = (counts[row.placed.getDay()] ?? 0) + 1;
      }
      const labels = this.i18n.weekdayLabels(true);
      return labels.map((label, index) => ({ label, count: counts[index] ?? 0 }));
    }
    if (view === 'year') {
      const counts = new Map<number, number>();
      for (const row of this.rows()) {
        if (!row.placed) {
          continue;
        }
        const year = row.placed.getFullYear();
        counts.set(year, (counts.get(year) ?? 0) + 1);
      }
      return [...counts.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([year, count]) => ({ label: year.toString(), count }));
    }
    return this.monthStats().map(stat => ({ label: stat.label, count: stat.count }));
  });

  readonly busiestRitual = computed(() => {
    const stats = this.ritualStats();
    if (stats.length === 0) {
      return { label: 'N/A', count: 0 };
    }
    let best = stats[0] as RitualStat;
    for (const current of stats) {
      if (current.count > best.count) {
        best = current;
      }
    }
    return best;
  });

  readonly weekdayMetrics = computed(() => {
    const placed = this.rows().filter(row => row.placed instanceof Date) as Array<VoteRow & { placed: Date }>;
    if (placed.length === 0) {
      return { busiest: { label: 'N/A', count: 0 }, quietest: { label: 'N/A', count: 0 } };
    }
    const counts = new Map<string, number>();
    const labels = this.i18n.weekdayLabels(false);
    for (const row of placed) {
      const day = labels[row.placed.getDay()] ?? this.i18n.t('label.na');
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    let best = { label: 'N/A', count: 0 };
    let worst = { label: 'N/A', count: Number.POSITIVE_INFINITY };
    for (const [label, count] of counts.entries()) {
      if (count > best.count) {
        best = { label, count };
      }
      if (count < worst.count) {
        worst = { label, count };
      }
    }
    if (worst.count === Number.POSITIVE_INFINITY) {
      worst = { label: 'N/A', count: 0 };
    }
    return { busiest: best, quietest: worst };
  });

  readonly busiestDate = computed(() => {
    const placed = this.rows().filter(row => row.placed instanceof Date) as Array<VoteRow & { placed: Date }>;
    if (placed.length === 0) {
      return null;
    }
    const counts = new Map<string, number>();
    const dateMap = new Map<string, Date>();
    for (const row of placed) {
      const date = row.placed;
      const key = date.toDateString();
      counts.set(key, (counts.get(key) ?? 0) + 1);
      dateMap.set(key, date);
    }
    let bestKey = '';
    let bestCount = 0;
    for (const [key, count] of counts.entries()) {
      if (count > bestCount) {
        bestKey = key;
        bestCount = count;
      }
    }
    const bestDate = dateMap.get(bestKey);
    if (!bestDate) {
      return null;
    }
    return { date: bestDate, count: bestCount };
  });

  readonly ratingStreak = computed(() => {
    const rated = this.ratedRows().filter(row => row.placed instanceof Date) as Array<VoteRow & { placed: Date }>;
    if (rated.length === 0) {
      return null;
    }
    const sorted = [...rated].sort((a, b) => a.placed.getTime() - b.placed.getTime());
    const first = sorted[0];
    if (!first) {
      return null;
    }
    let best = {
      rating: first.rating ?? 0,
      length: 1,
      start: first.placed,
      end: first.placed,
    };
    let currentRating = first.rating ?? 0;
    let currentLength = 1;
    let currentStart = first.placed;
    for (let i = 1; i < sorted.length; i += 1) {
      const item = sorted[i];
      if (!item) {
        continue;
      }
      const rating = item.rating ?? 0;
      if (rating === currentRating) {
        currentLength += 1;
        if (currentLength > best.length) {
          best = {
            rating: currentRating,
            length: currentLength,
            start: currentStart,
            end: item.placed,
          };
        }
      } else {
        currentRating = rating;
        currentLength = 1;
        currentStart = item.placed;
      }
    }
    return best;
  });

  readonly tasteShift = computed(() => {
    const byYear = new Map<number, { total: number; count: number }>();
    for (const row of this.ratedRows()) {
      if (row.year === null) {
        continue;
      }
      const entry = byYear.get(row.year) ?? { total: 0, count: 0 };
      entry.total += row.rating ?? 0;
      entry.count += 1;
      byYear.set(row.year, entry);
    }
    const series = [...byYear.entries()]
      .map(([year, data]) => ({ year, avg: data.total / Math.max(data.count, 1) }))
      .sort((a, b) => a.year - b.year);
    if (series.length < 2) {
      return null;
    }
    const last = series[series.length - 1];
    const prev = series[series.length - 2];
    if (!last || !prev) {
      return null;
    }
    const delta = last.avg - prev.avg;
    return { year: last.year, delta };
  });

  readonly platformPersonality = computed(() => {
    const map = new Map<string, number[]>();
    for (const row of this.ratedRows()) {
      const platform = row.platform ?? this.i18n.t('label.platformUnknown');
      const list = map.get(platform) ?? [];
      list.push(row.rating ?? 0);
      map.set(platform, list);
    }
    const entries = [...map.entries()].map(([name, ratings]) => ({
      name,
      count: ratings.length,
      average: mean(ratings),
      stdDev: stdDev(ratings),
    }));
    const top = entries.sort((a, b) => b.count - a.count)[0];
    if (!top) {
      return null;
    }
    const generosityKey = top.average >= 3.7 ? 'personality.generous' : top.average <= 2.6 ? 'personality.tough' : 'personality.balanced';
    const consistencyKey = top.stdDev <= 0.8 ? 'personality.steady' : top.stdDev >= 1.3 ? 'personality.wild' : 'personality.varied';
    return this.i18n.t('personality.platformLine', {
      platform: top.name,
      generosity: this.i18n.t(generosityKey),
      consistency: this.i18n.t(consistencyKey),
    });
  });

  readonly topPlatformName = computed(() => {
    const map = new Map<string, number>();
    for (const row of this.ratedRows()) {
      const platform = row.platform ?? this.i18n.t('label.platformUnknown');
      map.set(platform, (map.get(platform) ?? 0) + 1);
    }
    let best: { name: string; count: number } | null = null;
    for (const [name, count] of map.entries()) {
      if (!best || count > best.count) {
        best = { name, count };
      }
    }
    return best?.name ?? null;
  });

  platformImage(platform: string | null | undefined): PlatformImage {
    return getPlatformImage(platform ?? this.i18n.t('label.platformUnknown'));
  }

  readonly mostReplayedFranchise = computed(() => {
    const counts = new Map<string, number>();
    for (const row of this.rows()) {
      const title = (row.title ?? '').trim();
      if (!title) {
        continue;
      }
      const franchise = baseFranchise(title);
      counts.set(franchise, (counts.get(franchise) ?? 0) + 1);
    }
    let best: { name: string; count: number } | null = null;
    for (const [name, count] of counts.entries()) {
      if (!best || count > best.count) {
        best = { name, count };
      }
    }
    return best;
  });

  readonly busiestYear = computed(() => {
    const counts = new Map<number, number>();
    for (const row of this.rows()) {
      if (!row.placed) {
        continue;
      }
      const year = row.placed.getFullYear();
      counts.set(year, (counts.get(year) ?? 0) + 1);
    }
    let bestYear: number | null = null;
    let bestCount = 0;
    for (const [year, count] of counts.entries()) {
      if (count > bestCount) {
        bestYear = year;
        bestCount = count;
      }
    }
    return bestYear === null ? null : { year: bestYear, count: bestCount };
  });

  readonly longestTitle = computed(() => {
    const rows = this.rows();
    if (rows.length === 0) {
      return null;
    }
    let best = rows[0]!;
    for (const row of rows) {
      if ((row.title ?? '').length > (best.title ?? '').length) {
        best = row;
      }
    }
    return { title: best.title, length: (best.title ?? '').length };
  });

  readonly mostPolarizingYear = computed(() => {
    const byYear = new Map<number, number[]>();
    for (const row of this.ratedRows()) {
      if (row.year === null) {
        continue;
      }
      const list = byYear.get(row.year) ?? [];
      list.push(row.rating ?? 0);
      byYear.set(row.year, list);
    }
    let best: { year: number; stdDev: number; count: number } | null = null;
    for (const [year, ratings] of byYear.entries()) {
      if (ratings.length < 3) {
        continue;
      }
      const spread = stdDev(ratings);
      if (!best || spread > best.stdDev) {
        best = { year, stdDev: spread, count: ratings.length };
      }
    }
    return best;
  });

  barHeight(count: number): number {
    const max = Math.max(...this.ritualStats().map(stat => stat.count), 1);
    return (count / max) * 100;
  }
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function baseFranchise(title: string): string {
  const separators = [':', ' - ', ' – ', ' — ', '(', '[' ];
  for (const sep of separators) {
    const index = title.indexOf(sep);
    if (index > 0) {
      return title.slice(0, index).trim();
    }
  }
  return title.trim();
}

function stdDev(values: number[]): number {
  const avg = mean(values);
  const variance = mean(values.map(value => (value - avg) ** 2));
  return Math.sqrt(variance);
}
